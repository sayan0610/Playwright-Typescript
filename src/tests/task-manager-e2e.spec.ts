import { test, expect, Page } from '@playwright/test';

const API_URL = '/api/tasks';

// Helpers replicated from UI spec for consistency
function rowByTitle(page: Page, title: string) {
  return page.locator('#task-list tr').filter({ has: page.locator(`span:has-text("${title}")`) }).first();
}
function mainTaskRows(page: Page) {
  return page.locator('#task-list tr').filter({ has: page.locator('.status-badge') });
}
async function waitForTask(page: Page, title: string) {
  await page.waitForFunction((t) => {
    return Array.from(document.querySelectorAll('#task-list span[id^="task-title-"]')).some(s => (s as HTMLElement).innerText.includes(t));
  }, title, { timeout: 10000 });
}

test.describe('Task Manager End-to-End', () => {
  test('UI and API integration: add, complete, undo, and delete task', async ({ page, request }, testInfo) => {
    // Use per-project prefix to avoid any rare cross-project collisions
    const taskTitle = `E2E-${testInfo.project.name}-Task-${Date.now()}`;
    await page.goto('/');
    await page.fill('#task-input', taskTitle);
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST'),
      page.click('button[type="submit"]')
    ]);
    await waitForTask(page, taskTitle);
    await expect(rowByTitle(page, taskTitle)).toBeVisible();

    // API verify
    const apiTasks = await (await request.get(API_URL)).json();
    const created = apiTasks.find((t: any) => t.title === taskTitle);
    expect(created).toBeDefined();
    expect(created.completed).toBe(false);

    const row = rowByTitle(page, taskTitle);
    // Toggle complete
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/tasks/') && r.request().method() === 'PUT'),
      row.locator('[data-test-id="status"]').click(),
    ]);
    await row.locator('.status-badge', { hasText: 'Completed' }).waitFor({ timeout: 10000 });
    // API verify completed
    const afterComplete = await (await request.get(API_URL)).json();
    expect(afterComplete.find((t: any) => t.title === taskTitle).completed).toBe(true);
    // Undo
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/tasks/') && r.request().method() === 'PUT'),
      row.locator('[data-test-id="status"]').click(),
    ]);
    await row.locator('.status-badge', { hasText: 'In-Progress' }).waitFor({ timeout: 10000 });
    const afterUndo = await (await request.get(API_URL)).json();
    expect(afterUndo.find((t: any) => t.title === taskTitle).completed).toBe(false);
    // Delete
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(rowByTitle(page, taskTitle)).toHaveCount(0);
    const afterDelete = await (await request.get(API_URL)).json();
    expect(afterDelete.find((t: any) => t.title === taskTitle)).toBeUndefined();
  });

  test('UI burst add then API verify consistency', async ({ page, request }, testInfo) => {
    await page.goto('/');
    const base = `${testInfo.project.name}-${Date.now()}`;
    const titles = Array.from({ length: 4 }, (_, i) => `E2E Burst ${base}-${i}`);
    for (const t of titles) {
      await page.fill('#task-input', t);
      await Promise.all([
        page.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST'),
        page.click('button[type="submit"]')
      ]);
      await waitForTask(page, t);
    }
    // Verify all rows present (tolerant to slight UI refresh timing)
    await page.waitForFunction((expected) => {
      const present = Array.from(document.querySelectorAll('#task-list span[id^="task-title-"]')).map(e => (e as HTMLElement).innerText);
      return expected.every(t => present.some(p => p.includes(t)));
    }, titles, { timeout: 10000 });
    for (const t of titles) {
      await expect(rowByTitle(page, t)).toBeVisible();
    }
    // API consistency
    const tasks = await (await request.get(API_URL)).json();
    for (const t of titles) {
      expect(tasks.some((x: any) => x.title === t)).toBeTruthy();
    }
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
    await page.goto('/');
    const initial = await mainTaskRows(page).count();
    // Attempt to submit empty (HTML required attribute should block submission)
    await page.click('button[type="submit"]');
    await expect(mainTaskRows(page)).toHaveCount(initial);
  });
});
