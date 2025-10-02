import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the local HTML file via the server
        await page.goto('http://localhost:8000/main.html')

        # Wait for the main data table to be populated, which indicates the app is ready.
        # We'll wait for a specific row to appear. Let's use a subsystem from the bug report.
        # The text will be something like "A SUB-101 - Pump Skid". We look for the start.
        # The selector will target a table cell (td) containing the subsystem name.
        # Wait for the loading modal to disappear
        await expect(page.locator('#loadingModal')).to_be_hidden(timeout=20000)

        # The HOS status "A" is added dynamically, so we wait for the table body to have children.
        await expect(page.locator('#dataTableBody > tr').first).to_be_visible(timeout=20000)

        # Find the specific row for "A SUB-101"
        # The status and name are in the second cell of the row.
        # We need to find the row and then click the 'Completed' column cell.
        subsystem_row_locator = page.locator('tr:has-text("SUB-101")')

        # The 'Completed' column is the 4th <td> element (index 3)
        completed_cell_locator = subsystem_row_locator.locator('td').nth(3)

        # DEBUG: Take a screenshot before the click to see the page state
        await page.screenshot(path="jules-scratch/verification/debug_before_click.png")

        # Click the 'Completed' cell to open the modal
        await completed_cell_locator.click()

        # Wait for the modal to be visible
        modal_locator = page.locator('#itemDetailsModal')
        await expect(modal_locator).to_be_visible()

        # Assert that the modal's table body is not empty
        modal_table_body_locator = modal_locator.locator('#itemDetailsTableBody')
        # Check that there's at least one row in the modal table
        await expect(modal_table_body_locator.locator('tr').first).to_be_visible(timeout=10000)

        # Take a screenshot of the modal content
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())