// import { test, expect } from '@playwright/test';

// test.describe('Example Web Test Suite', () => {
//     test('should load the homepage', async ({ page }) => {
//         await page.goto('https://example.com');
//         await expect(page).toHaveTitle(/Example Domain/);
//     });

//     test('should navigate to the about page', async ({ page }) => {
//         await page.goto('https://example.com');
//         await page.click('text=More information...');
//         await expect(page).toHaveURL(/about/);
//     });

//     test('should display the correct heading', async ({ page }) => {
//         await page.goto('https://example.com');
//         const heading = await page.locator('h1');
//         await expect(heading).toHaveText('Example Domain');
//     });
// });