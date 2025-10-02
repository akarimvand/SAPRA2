import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))

        # Navigate to the local HTML file via the server
        await page.goto('http://localhost:8000/main.html')

        # Wait for the loading modal to disappear
        print("Waiting for loading modal to hide...")
        await expect(page.locator('#loadingModal')).to_be_hidden(timeout=30000) # Increased timeout
        print("Loading modal is hidden.")

        # Wait for the data table to be visible as a final confirmation
        await expect(page.locator('#dataTableBody > tr').first).to_be_visible(timeout=10000)
        print("Data table is visible.")

        # Take a final screenshot
        await page.screenshot(path="jules-scratch/verification/final_view.png")

        await browser.close()
        print("Script finished successfully.")

if __name__ == '__main__':
    asyncio.run(main())