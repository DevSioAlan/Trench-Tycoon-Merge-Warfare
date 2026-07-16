from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173") # Default Vite port
    page.wait_for_timeout(4000) # Initial cinematic/screen loading

    # We can skip start screen by taking a screenshot first to see where we are
    page.screenshot(path="screenshot_debug.png")
    page.wait_for_timeout(1000)

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
