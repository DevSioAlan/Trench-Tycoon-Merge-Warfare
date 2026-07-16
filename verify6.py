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
            # Click the start button
            print("Clicking Start Button...")
            start_btn = page.get_by_test_id('start-button')
            await start_btn.wait_for(state='visible', timeout=5000)
            await start_btn.click(force=True)
            await page.wait_for_timeout(1000)

            # Now we should be on the HubView
            print("Clicking COMBAT...")
            combat_btn = page.locator('.hub-btn-combat')
            await combat_btn.wait_for(state='visible', timeout=5000)
            await combat_btn.click(force=True)
            await page.wait_for_timeout(1000)

            # Now we should be on MapView
            print("Clicking Level...")
            level_btn = page.locator('.map-level-btn').first
            await level_btn.wait_for(state='visible', timeout=5000)
            await level_btn.click(force=True)
            await page.wait_for_timeout(1000)

            # Now we should be in CombatView
            print("Taking initial combat screenshot...")
            await page.screenshot(path='combat_start.png')

            # Since the combat deck relies on `combatDeck` being populated, but we start at 0 and might not have any
            # we can inject a unit into localStorage or just wait longer.
            # But actually `combatDeck` might be empty. Wait, the deck comes from the save system. Let's see what is stored.

            # Wait for some energy to accumulate
            print("Waiting for energy...")
            await page.wait_for_timeout(3000)

            # Click energy upgrade button
            print("Upgrading energy...")
            upgrade_btn = page.get_by_test_id('upgrade-energy-btn')
            await upgrade_btn.click(force=True)
            await page.wait_for_timeout(500)

            # Wait for energy to regenerate so unit can be afforded
            print("Waiting for energy to regenerate...")
            await page.wait_for_timeout(3000)

            # Click first unit to deploy
            print("Deploying unit...")
            deploy_btn = page.get_by_test_id('deploy-unit-0')
            if await deploy_btn.count() > 0:
                await deploy_btn.click(force=True)
                await page.wait_for_timeout(500)
            else:
                print("Deploy button not found. Deck might be empty.")

            # Wait for cannon to charge (in test it charges in 1s since we mocked it, but wait a bit to be sure)
            await page.wait_for_timeout(2000)

            print("Taking combat mid-fight screenshot...")
            await page.screenshot(path='combat_mid.png')

            # Fire cannon
            print("Firing cannon...")
            cannon_btn = page.get_by_test_id('cannon-btn')
            await cannon_btn.click(force=True)
            await page.wait_for_timeout(1000)

            # Final screenshot
            print("Taking final combat screenshot...")
            await page.screenshot(path='combat_final.png')

            print("Test complete!")
        except Exception as e:
            print(f"Error during execution: {e}")
            await page.screenshot(path='error4.png')
        finally:
            await browser.close()

asyncio.run(run())