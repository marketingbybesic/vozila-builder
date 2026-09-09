#!/usr/bin/env python3
"""G3: verify sidebar field-set/order matches napredna pretraga for all 11 prosti-cas subcategories.
Usage: python3 verify-prosti-cas-parity.py <base_url>
Prints PARITY_OK <n>/11 on success (all subcategories matched), or lists mismatches and exits 1.
"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

SUBCATS = [
    ("kamperi", None),
    ("kamp-prikolice", None),
    ("mobilne-kucice", None),
    ("moduli-za-kamper", None),
    ("satorske-prikolice", None),
    ("krovni-satori", None),
    ("plovila", None),
    ("kamping-oprema", "kamper-dijelovi-nadogradnje"),
    ("e-skuteri", None),
    ("e-bicikli", None),
    ("najam", None),
]


def field_labels(page, selector):
    return page.evaluate(f"""
        () => {{
          const root = document.querySelector("{selector}");
          if (!root) return [];
          const nodes = Array.from(root.querySelectorAll('div.block > span > span, label > span > span'));
          return nodes.map(n => n.textContent.trim());
        }}
    """)


def main():
    ok = 0
    total = len(SUBCATS)
    mismatches = []
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", headless=True)
        for sub, vrsta in SUBCATS:
            qs = f"category=prosti-cas&subcategory={sub}"
            if vrsta:
                qs += f"&a.vrsta={vrsta}"

            page = browser.new_page(viewport={"width": 1400, "height": 2600})
            errors = []
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            page.goto(f"{BASE}/oglasi?{qs}", wait_until="load", timeout=30000)
            page.wait_for_timeout(1000)
            sidebar_labels = field_labels(page, "aside")
            has_vise_filtera = "aside" and page.evaluate("() => document.querySelector('aside')?.innerText.includes('Više filtera') ?? false")
            page.close()

            page2 = browser.new_page(viewport={"width": 1400, "height": 2600})
            page2.on("pageerror", lambda exc: errors.append(str(exc)))
            page2.goto(f"{BASE}/oglasi/napredno?{qs}", wait_until="load", timeout=30000)
            page2.wait_for_timeout(1000)
            more = page2.query_selector("text=Više filtera")
            if more:
                more.click()
                page2.wait_for_timeout(500)
            napredna_labels = field_labels(page2, "body")
            page2.close()

            # sidebar labels must all appear in napredna, in the same relative order (subsequence check)
            idx = 0
            missing = []
            for lbl in sidebar_labels:
                found = False
                while idx < len(napredna_labels):
                    if napredna_labels[idx] == lbl:
                        found = True
                        idx += 1
                        break
                    idx += 1
                if not found:
                    missing.append(lbl)

            status = "OK" if not missing and not has_vise_filtera and not errors else "MISMATCH"
            if status == "OK":
                ok += 1
            else:
                mismatches.append((sub, missing, has_vise_filtera, errors))
            print(f"[{status}] {sub}: sidebar={len(sidebar_labels)} fields, missing_from_napredna={missing}, has_vise_filtera={has_vise_filtera}, errors={errors}")
        browser.close()

    print(f"\nPARITY_RESULT {ok}/{total}")
    if ok == total:
        print("PARITY_OK")
        sys.exit(0)
    else:
        print("PARITY_FAIL")
        for sub, missing, vf, errs in mismatches:
            print(f"  - {sub}: missing={missing} vise_filtera={vf} errors={errs}")
        sys.exit(1)


if __name__ == "__main__":
    main()
