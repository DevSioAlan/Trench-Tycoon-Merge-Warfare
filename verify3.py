from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173") # Default Vite port
    page.wait_for_timeout(4000) # Initial cinematic/screen loading

    page.get_by_role("button", name="DÉPLOYER LES TROUPES").click()
    page.wait_for_timeout(1000)

    # Click Map view
    page.locator(".bottom-nav .nav-item").nth(1).click() # Check if bottom-nav has map
    page.wait_for_timeout(1000)

    # Click level 1
    page.locator(".level-node").nth(0).click()
    page.wait_for_timeout(1000)

    page.screenshot(path="screenshot_debug2.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="videos")
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
