#!/usr/bin/env python3
"""
Visual proof walk — screenshots every public + auth + admin page at desktop + mobile.
Logs in via the seed admin account by creating a session cookie directly is not possible
without the password being set, so we sign up a brand new admin via INITIAL_ADMIN_EMAIL
match (the in-memory adapter auto-promotes that signup).

Usage: from auti-hr root, with dev server running on :3000:
  ./scripts/proof-walk.py
"""
import asyncio, os, sys, datetime, json
from playwright.async_api import async_playwright

BASE = os.environ.get("AUTI_BASE", "http://localhost:3000")
OUT = os.path.join(os.path.dirname(__file__), "..", ".proof", "WALK-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
os.makedirs(OUT, exist_ok=True)

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

# Order matters: public first, then signup/login, then auth, then admin
PUBLIC_PAGES = [
    ("home", "/"),
    ("oglasi", "/oglasi"),
    ("oglasi-filtered", "/oglasi?make=bmw&priceMax=30000"),
    ("oglasi-najnoviji", "/oglasi/najnoviji"),
    ("oglasi-napredno", "/oglasi/napredno"),
    ("oglasi-detail", "/oglasi/volkswagen-golf-1-6-tdi-comfortline-2019-zagreb-lst-0001"),
    ("oglasi-detail-prijavi", "/oglasi/volkswagen-golf-1-6-tdi-comfortline-2019-zagreb-lst-0001/prijavi"),
    ("usporedi-empty", "/usporedi"),
    ("usporedi-2", "/usporedi?a=volkswagen-golf-1-6-tdi-comfortline-2019-zagreb-lst-0001&b=audi-a4-2-0-tdi-s-tronic-sport-2020-split-lst-0002"),
    ("marke", "/marke"),
    ("trgovci-demo", "/trgovci/00000000-0000-0000-0000-000000000001"),
    ("kontakt", "/kontakt"),
    ("o-nama", "/o-nama"),
    ("uvjeti", "/uvjeti"),
    ("prijava", "/prijava"),
    ("registracija", "/registracija"),
]

AUTH_PAGES = [
    ("moj-racun", "/moj-racun"),
    ("moj-racun-oglasi", "/moj-racun/oglasi"),
    ("moj-racun-spremljeno", "/moj-racun/spremljeno"),
    ("moj-racun-pretrage", "/moj-racun/pretrage"),
    ("moj-racun-poruke", "/moj-racun/poruke"),
    ("moj-racun-postavke", "/moj-racun/postavke"),
    ("objavi", "/objavi"),
]

ADMIN_PAGES = [
    ("admin-overview", "/admin"),
    ("admin-oglasi", "/admin/oglasi"),
    ("admin-korisnici", "/admin/korisnici"),
    ("admin-prijave", "/admin/prijave"),
    ("admin-dnevnik", "/admin/dnevnik"),
]


async def shoot(page, name, vp_name):
    out = os.path.join(OUT, f"{vp_name}__{name}.png")
    await page.screenshot(path=out, full_page=False)
    return out


async def signup_admin(context):
    page = await context.new_page()
    email = f"proof-admin-{int(datetime.datetime.now().timestamp())}@auti.hr"
    await page.goto(BASE + "/registracija")
    await page.fill('input[name="email"]', "dino@marketingbybesic.com")
    await page.fill('input[name="password"]', "ProofPass123!")
    await page.fill('input[name="firstName"]', "Proof")
    await page.fill('input[name="lastName"]', "Walker")
    await page.click('button[type="submit"]')
    await page.wait_for_load_state("networkidle", timeout=10000)
    url = page.url
    await page.close()
    return url


async def run_vp(browser, vp, vp_name, do_admin=True):
    results = []
    context = await browser.new_context(viewport=vp, locale="hr-HR")

    # public walk (no auth)
    for name, path in PUBLIC_PAGES:
        page = await context.new_page()
        try:
            await page.goto(BASE + path, wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(800)
            out = await shoot(page, name, vp_name)
            console = []
            page.on("console", lambda m: console.append(m.text) if m.type == "error" else None)
            results.append({"name": name, "path": path, "screenshot": os.path.relpath(out, OUT), "ok": True})
        except Exception as e:
            results.append({"name": name, "path": path, "ok": False, "error": str(e)})
        finally:
            await page.close()

    # try the signup → admin flow (only in desktop run to avoid double-signup)
    if vp_name == "desktop":
        try:
            await signup_admin(context)
        except Exception as e:
            print(f"signup_admin failed: {e}")

    # auth + admin
    for name, path in AUTH_PAGES + (ADMIN_PAGES if do_admin else []):
        page = await context.new_page()
        try:
            await page.goto(BASE + path, wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(800)
            out = await shoot(page, name, vp_name)
            results.append({"name": name, "path": path, "screenshot": os.path.relpath(out, OUT), "ok": True, "url_landed": page.url})
        except Exception as e:
            results.append({"name": name, "path": path, "ok": False, "error": str(e)})
        finally:
            await page.close()

    await context.close()
    return results


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        desktop_results = await run_vp(browser, DESKTOP, "desktop", do_admin=True)
        mobile_results = await run_vp(browser, MOBILE, "mobile", do_admin=True)
        await browser.close()

    summary = {"base": BASE, "out": OUT, "desktop": desktop_results, "mobile": mobile_results}
    with open(os.path.join(OUT, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)

    # Print short report
    total = len(desktop_results) + len(mobile_results)
    failed = [r for r in desktop_results + mobile_results if not r.get("ok")]
    print(f"\nWalked {total} pages. {len(failed)} failures.")
    for f in failed:
        print(f"  FAIL {f['name']} {f.get('path')}: {f.get('error')}")
    print(f"Screenshots in: {OUT}")


if __name__ == "__main__":
    asyncio.run(main())
