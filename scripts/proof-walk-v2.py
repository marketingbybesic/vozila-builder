#!/usr/bin/env python3
"""
Proof walk v2 — registers fresh admin (via INITIAL_ADMIN_EMAIL match), keeps
the session cookie across the admin walk so admin pages actually render
instead of bouncing to /prijava.

Usage (dev server already on :3000):
  ./scripts/proof-walk-v2.py
"""
import asyncio, os, datetime, json, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("AUTI_BASE", "http://localhost:3000")
OUT = os.path.join(
    os.path.dirname(__file__), "..", ".proof",
    "WALK-V2-" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
)
os.makedirs(OUT, exist_ok=True)

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

PUBLIC = [
    ("home", "/"),
    ("oglasi", "/oglasi"),
    ("oglasi-detail", "/oglasi/volkswagen-golf-1-6-tdi-comfortline-2019-zagreb-lst-0001"),
    ("oglasi-detail-sale", "/oglasi/skoda-octavia-1-6-tdi-style-2020-rijeka-lst-0005"),  # 5th = on-sale
    ("oglasi-detail-history", "/oglasi/bmw-serija-3-320d-xdrive-m-sport-2021-rijeka-lst-0003"),  # 3rd = history
    ("usporedi", "/usporedi?a=volkswagen-golf-1-6-tdi-comfortline-2019-zagreb-lst-0001&b=audi-a4-2-0-tdi-s-tronic-sport-2020-split-lst-0002"),
    ("napredno", "/oglasi/napredno"),
    ("najnoviji", "/oglasi/najnoviji"),
    ("marke", "/marke"),
    ("trgovci", "/trgovci/00000000-0000-0000-0000-000000000001"),
]

AUTH = [
    ("moj-racun", "/moj-racun"),
    ("moj-pretrage", "/moj-racun/pretrage"),
    ("moj-spremljeno", "/moj-racun/spremljeno"),
]

ADMIN = [
    ("admin-overview", "/admin"),
    ("admin-oglasi", "/admin/oglasi"),
    ("admin-korisnici", "/admin/korisnici"),
    ("admin-prijave", "/admin/prijave"),
    ("admin-dnevnik", "/admin/dnevnik"),
]


async def signup_admin(context, marker):
    """Sign up via INITIAL_ADMIN_EMAIL (default dino@marketingbybesic.com)."""
    page = await context.new_page()
    email = f"proof+{marker}@auti.hr"  # unique
    # First try the INITIAL_ADMIN_EMAIL match for admin role:
    admin_email = os.environ.get("INITIAL_ADMIN_EMAIL", "dino@marketingbybesic.com")
    await page.goto(BASE + "/registracija", wait_until="domcontentloaded")
    await page.fill('input[name="email"]', admin_email)
    await page.fill('input[name="password"]', "ProofPass123!")
    await page.fill('input[name="firstName"]', "Proof")
    await page.fill('input[name="lastName"]', "Walker")
    try:
        # Submit and wait for navigation away from /registracija
        async with page.expect_navigation(timeout=10000):
            await page.click('button[type="submit"]')
        landed = page.url
    except Exception as e:
        # form action redirects via React server-action protocol; expect_navigation
        # may not always fire. Fall back: wait a bit, check URL changed.
        await page.wait_for_timeout(2500)
        landed = page.url
        if "/registracija" in landed:
            # try one more time to navigate manually to /moj-racun and see if session sticks
            await page.goto(BASE + "/moj-racun", wait_until="domcontentloaded")
            landed = page.url
    await page.close()
    return landed


async def shoot(page, name, vp_name, results):
    out = os.path.join(OUT, f"{vp_name}__{name}.png")
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    try:
        await page.screenshot(path=out, full_page=False)
        results.append({"name": name, "screenshot": os.path.basename(out), "ok": True, "url": page.url, "errors": errors[:3]})
    except Exception as e:
        results.append({"name": name, "ok": False, "error": str(e)})


async def walk_pages(context, pages, vp_name, results):
    for name, path in pages:
        page = await context.new_page()
        try:
            await page.goto(BASE + path, wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(700)
            await shoot(page, name, vp_name, results)
        except Exception as e:
            results.append({"name": name, "ok": False, "error": str(e)})
        finally:
            await page.close()


async def run():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)

        all_results = {}
        for vp_name, vp in [("desktop", DESKTOP), ("mobile", MOBILE)]:
            results = []
            context = await browser.new_context(viewport=vp, locale="hr-HR")

            # Public pages (no auth)
            await walk_pages(context, PUBLIC, vp_name, results)

            # Sign up the admin once per viewport context
            if vp_name == "desktop":
                landed = await signup_admin(context, vp_name)
                results.append({"name": "_signup_landed", "url": landed, "ok": True})

            # Auth + admin pages — same context still has session cookie
            await walk_pages(context, AUTH + ADMIN, vp_name, results)

            await context.close()
            all_results[vp_name] = results

        await browser.close()

    with open(os.path.join(OUT, "summary.json"), "w") as f:
        json.dump({"base": BASE, "out": OUT, **all_results}, f, indent=2)

    total = sum(len(v) for v in all_results.values())
    failed = [r for v in all_results.values() for r in v if not r.get("ok")]
    with_errors = [r for v in all_results.values() for r in v if r.get("errors")]
    print(f"\nWalked {total} ops. {len(failed)} failures. {len(with_errors)} pages had console errors.")
    for f in failed:
        print(f"  FAIL {f.get('name')}: {f.get('error')}")
    print(f"\nScreenshots: {OUT}")


if __name__ == "__main__":
    asyncio.run(run())
