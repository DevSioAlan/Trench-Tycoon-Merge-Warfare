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
        await page.wait_for_timeout(4500)

        # In case there's an initial "JOUER" button (StartScreen)
        start_btn = page.locator("button:has-text('JOUER')")
        if await start_btn.is_visible():
            print("Clicking start button...")
            await start_btn.click()
            await page.wait_for_timeout(1000)

        # Now we are in Hub view. Click "COMBAT"
        print("Clicking COMBAT in Hub View...")
        combat_hub_btn = page.locator("button:has-text('COMBAT')")
        await combat_hub_btn.click()
        await page.wait_for_timeout(1000)

        # Now we are in Map view. Click Level 1.
        print("Clicking Level 1 in Map View...")
        level_btn = page.locator(".map-level-btn").first
        await level_btn.click()
        await page.wait_for_timeout(2000)

        # Now in Combat View. Wait for energy to generate.
        print("In Combat. Waiting for energy...")
        await page.wait_for_timeout(3000)

        # Click the "Améliorer l'Énergie" button
        print("Upgrading energy...")
        upgrade_btn = page.locator("button:has-text('Améliorer')")
        if await upgrade_btn.is_visible():
            await upgrade_btn.click()

        await page.wait_for_timeout(2000)

        # Click the first unit to deploy
        print("Deploying a unit...")
        unit_btn = page.locator(".deck-slot-btn").first
        if await unit_btn.is_visible():
            await unit_btn.click()

        await page.wait_for_timeout(2000)

        # Click the Canon button
        print("Attempting to fire cannon...")
        cannon_btn = page.locator("button:has-text('CANON')")
        if await cannon_btn.is_visible():
            await cannon_btn.click()

        await page.wait_for_timeout(2000)
        await page.screenshot(path="screenshot_final.png", full_page=True)
        print("Done. Screenshot saved as screenshot_final.png")

        await browser.close()

asyncio.run(main())
