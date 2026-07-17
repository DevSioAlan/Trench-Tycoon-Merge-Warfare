import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        print("Navigating to local server...")
        await page.goto("http://localhost:5173")

        # Wait for loading cinematic
        print("Waiting for cinematic...")
        await page.wait_for_timeout(6000)

        await page.screenshot(path="debug1.png", full_page=True)

        # Click JOUER if visible
        try:
            await page.locator("button:has-text('JOUER')").click(timeout=3000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path="debug2.png", full_page=True)
        except Exception as e:
            print(f"JOUER button error: {e}")

        # Click COMBAT
        try:
            await page.locator(".hub-btn-combat").click(timeout=3000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path="debug3.png", full_page=True)
        except Exception as e:
            print(f"COMBAT button error: {e}")

        await browser.close()

asyncio.run(main())
