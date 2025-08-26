import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/tasks`;

test.describe('Task Manager End-to-End', () => {
  test('UI and API integration: add, complete, undo, and delete task', async ({ page, request }) => {
    const taskTitle = `E2E Task ${Date.now()}`;
    // Add via UI
    await page.goto(BASE_URL);
    await page.fill('#task-input', taskTitle);
    await page.click('button[type="submit"]');
    await expect(page.locator('#task-list')).toContainText(taskTitle);

    // Verify via API
    const apiTasks = await (await request.get(API_URL)).json();
  const e2eTask = apiTasks.find((t: any) => t.title === taskTitle);
    expect(e2eTask).toBeDefined();
    expect(e2eTask.completed).toBe(false);

    // Complete via UI
  const taskItem = page.locator('#task-list li').filter({ hasText: taskTitle }).last();
  await expect(taskItem).toBeVisible();
  await taskItem.getByRole('button', { name: 'Complete' }).click();
  await taskItem.getByRole('button', { name: 'Undo' }).waitFor();
  const span = taskItem.locator('span');
  await expect(span).toHaveCSS('text-decoration-line', 'line-through');

    // Verify completion via API
    const updatedTasks = await (await request.get(API_URL)).json();
  const updatedTask = updatedTasks.find((t: any) => t.title === taskTitle);
    expect(updatedTask.completed).toBe(true);

    // Undo via UI
  await taskItem.getByRole('button', { name: 'Undo' }).click();
  await taskItem.getByRole('button', { name: 'Complete' }).waitFor();
  await expect(span).toHaveCSS('text-decoration-line', 'none');

    // Delete via UI
  await taskItem.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('#task-list')).not.toContainText(taskTitle);

    // Verify deletion via API
    const finalTasks = await (await request.get(API_URL)).json();
  expect(finalTasks.find((t: any) => t.title === taskTitle)).toBeUndefined();
  });

  test('API: should not add empty task', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: { title: '' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Title is required');
  });

  test('UI: should not add empty task', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#task-input', '');
    await page.click('button[type="submit"]');
    // Should not add anything, so count remains the same
    const initialCount = await page.locator('#task-list li').count();
    await page.click('button[type="submit"]');
    const finalCount = await page.locator('#task-list li').count();
    expect(finalCount).toBe(initialCount);
  });
});
