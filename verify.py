import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(
            viewport={'width': 1280, 'height': 720},
            device_scale_factor=2
        )
        await page.goto('http://localhost:5173')

        # Wait for the initial load and screen
        await page.wait_for_timeout(4500)

        try:
            # Click the start button (it's "DÉPLOYER LES TROUPES")
            print("Clicking DÉPLOYER LES TROUPES...")
            await page.get_by_text('DÉPLOYER LES TROUPES', exact=False).click(timeout=3000)
            await page.wait_for_timeout(1000)

            # Now we should be on the HubView
            print("Clicking COMBAT...")
            await page.locator('.hub-btn-combat').click()
            await page.wait_for_timeout(1000)

            # Now we should be on MapView
            print("Clicking Level...")
            await page.locator('.map-level-btn').first.click()
            await page.wait_for_timeout(1000)

            # Now we should be in CombatView
            print("Taking initial combat screenshot...")
            await page.screenshot(path='combat_start.png')

            # Wait for some energy to accumulate
            print("Waiting for energy...")
            await page.wait_for_timeout(3000)

            # Click energy upgrade button
            print("Upgrading energy...")
            await page.locator('button', has_text='Améliorer').click(timeout=2000)
            await page.wait_for_timeout(500)

            # Click first unit to deploy
            print("Deploying unit...")
            await page.locator('.deck-slot-btn').first.click(timeout=2000)
            await page.wait_for_timeout(500)

            # Wait for cannon to charge (in test it charges in 1s since we mocked it, but wait a bit to be sure)
            await page.wait_for_timeout(2000)

            print("Taking combat mid-fight screenshot...")
            await page.screenshot(path='combat_mid.png')

            # Fire cannon
            print("Firing cannon...")
            await page.locator('.cannon-btn').click(timeout=2000)
            await page.wait_for_timeout(1000)

            # Final screenshot
            print("Taking final combat screenshot...")
            await page.screenshot(path='combat_final.png')

            print("Test complete!")
        except Exception as e:
            print(f"Error during execution: {e}")
            await page.screenshot(path='error.png')
        finally:
            await browser.close()

asyncio.run(run())