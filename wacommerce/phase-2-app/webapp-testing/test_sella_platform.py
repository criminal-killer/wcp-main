import sys
import time
from playwright.sync_api import sync_playwright

def test_page(page, url, name, viewport):
    print(f"--- Testing {name} ({viewport['width']}x{viewport['height']}) ---")
    page.set_viewport_size(viewport)
    
    try:
        response = page.goto(url, wait_until='networkidle')
        if response.status >= 400:
            print(f"[ERROR] {name} returned status {response.status}")
        
        # Check for console errors
        # (We rely on the logs captured in the test runner)
        
        # Check specific elements
        if '/dashboard' in url:
            # Check for mobile burger if small
            if viewport['width'] < 1024:
                try:
                    page.wait_for_selector('button:has(svg)', timeout=5000)
                    print(f"[OK] Mobile Header/Menu button found.")
                except:
                    print(f"[FAIL] Mobile Menu button NOT found on {name}")
            else:
                try:
                    page.wait_for_selector('aside.lg\\:flex', timeout=5000)
                    print(f"[OK] Desktop Sidebar found.")
                except:
                    print(f"[FAIL] Desktop Sidebar NOT found on {name}")
        
        page.screenshot(path=f"test_results/{name}_{viewport['width']}.png", full_page=True)
        print(f"[OK] Screenshot saved for {name}")
        
    except Exception as e:
        print(f"[CRITICAL] Error testing {name}: {str(e)}")

def run_tests():
    import os
    if not os.path.exists('test_results'):
        os.makedirs('test_results')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        
        # Log console messages
        def handle_console(msg):
            if msg.type == 'error':
                print(f"[BROWSER ERROR] {msg.text}")
        
        page = context.new_page()
        page.on('console', handle_console)
        
        base_url = "http://localhost:3001"
        
        viewports = [
            {'width': 1280, 'height': 800}, # Desktop
            {'width': 375, 'height': 667}   # Mobile (iPhone SE)
        ]
        
        pages = [
            {'url': '/', 'name': 'LandingPage'},
            {'url': '/docs', 'name': 'Docs'},
            {'url': '/dashboard', 'name': 'Dashboard'}
        ]
        
        for vp in viewports:
            for pg in pages:
                test_page(page, f"{base_url}{pg['url']}", pg['name'], vp)
        
        browser.close()

if __name__ == "__main__":
    run_tests()
