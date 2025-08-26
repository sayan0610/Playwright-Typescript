import { test, expect } from '@playwright/test';

// Change this if your server runs on a different port
const BASE_URL = 'http://localhost:3000';

test.describe('Task Manager UI', () => {
  test('should load the page and display the title', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toHaveText('Task Manager');
  });

  test('should add a new task', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#task-input', 'Playwright Test Task');
    await page.click('button[type="submit"]');
    await expect(page.locator('#task-list')).toContainText('Playwright Test Task');
  });

  test('should mark a task as complete and then undo', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#task-input', 'Complete Me');
    await page.click('button[type="submit"]');
  // Wait for the LI containing the new task text to appear (text may include whitespace/newlines)
  const taskItem = page.locator('#task-list li').filter({ hasText: /Complete Me/ }).last();
  await expect(taskItem).toBeVisible();
  // Click the Complete button within that task item
      await taskItem.getByRole('button', { name: 'Complete' }).click();
      // Wait for re-render (button text changes to Undo)
      await taskItem.getByRole('button', { name: 'Undo' }).waitFor();
      const span = taskItem.locator('span');
      // Check computed CSS (more reliable cross-browser than inline attribute)
      await expect(span).toHaveCSS('text-decoration-line', 'line-through');
  // Undo
  await taskItem.getByRole('button', { name: 'Undo' }).click();
  await taskItem.getByRole('button', { name: 'Complete' }).waitFor();
  await expect(span).toHaveCSS('text-decoration-line', 'none');
  });

  test('should delete a task', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#task-input', 'Delete Me');
    await page.click('button[type="submit"]');
    const taskItem = page.locator('#task-list li', { hasText: 'Delete Me' });
    await taskItem.locator('button', { hasText: 'Delete' }).click();
    await expect(page.locator('#task-list')).not.toContainText('Delete Me');
  });
});
