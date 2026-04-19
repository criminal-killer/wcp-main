import sys
from playwright.sync_api import sync_playwright

urls = [
    ("https://adm-pan.vercel.app", "admin_panel_live.png"),
    ("https://sella-app.vercel.app", "main_app_live.png"),
    ("https://chatevo-admin.vercel.app", "chatevo_admin_live.png")
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for url, screenshot in urls:
        print(f"Visiting {url}")
        page = browser.new_page()
        try:
            response = page.goto(url, wait_until="load", timeout=30000)
            status = response.status if response else "Unknown"
            print(f"Response status from {url}: {status}")
            page.screenshot(path=f"c:/Users/alfre/Desktop/Whatsapp Saas/wacommerce/phase-2-app/webapp-testing/{screenshot}", full_page=True)
            print(f"Screenshot saved to {screenshot}")
        except Exception as e:
            print(f"Failed to load {url}: {e}")
        page.close()
    browser.close()
