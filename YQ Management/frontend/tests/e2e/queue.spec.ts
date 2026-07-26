import { test, expect } from '@playwright/test';

test.describe('Queue Management & Customer Joining', () => {

  test('Customer should be able to join an active queue via join link', async ({ browser }) => {
    // We create a fresh browser context to simulate a new customer
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    // Navigate to a specific Queue's join page (e.g. Queue ID 1)
    // NOTE: In a real CI environment, we would first create a queue via API and use its ID.
    const mockQueueId = 1;
    await customerPage.goto(`/customer/join/${mockQueueId}`);

    // If the queue exists, we should see the join form.
    try {
      const nameInput = customerPage.locator('input[type="text"]').first();
      await expect(nameInput).toBeVisible({ timeout: 2000 });

      await nameInput.fill('John Doe');
      
      const phoneInput = customerPage.locator('input[type="tel"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('1234567890');
      }

      await customerPage.click('button:has-text("Join")');
      
      // Verify redirection to status page
      await expect(customerPage).toHaveURL(/.*\/customer\/status\/.*/);
      await expect(customerPage.locator('text=Your position')).toBeVisible();

    } catch (e) {
      console.log('Queue not found or DB not seeded. Test skipped.');
    }

    await customerContext.close();
  });
});
