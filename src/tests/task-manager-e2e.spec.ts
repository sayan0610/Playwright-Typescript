import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://127.0.0.1:3000/api/tasks';

function rowByTitle(page: Page, title: string) {
  const table = page.locator('#task-table');
  return table
    .locator('tbody tr')
    .filter({ has: page.locator('.task-title', { hasText: title }) })
    .first();
}
function mainTaskRows(page: Page) {
  return page.locator('#task-table tbody tr').filter({ has: page.locator('.status-badge') });
}
async function waitForTask(page: Page, title: string) {
  await page.waitForFunction(
    (t) => {
      return Array.from(document.querySelectorAll('#task-table .task-title')).some((s) =>
        (s as HTMLElement).innerText.includes(t),
      );
    },
    title,
    { timeout: 10000 },
  );
}
async function addTaskUI(page: Page, title: string, details?: string) {
  await page.getByRole('button', { name: 'Add New Task' }).click();
  const modal = page.locator('.m-form');
  await modal.getByPlaceholder('Task title').fill(title);
  if (details) await modal.getByPlaceholder('Optional details').fill(details);
  await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/tasks') && r.request().method() === 'POST'),
    modal.getByRole('button', { name: 'Create' }).click(),
  ]);
}

test.describe('Task Manager End-to-End', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get('http://127.0.0.1:3000/api/health');
    if (!res.ok()) test.skip(true, 'API is not available, skipping E2E tests');
  });

  test('UI and API integration: add, complete, and delete task', async ({
    page,
    request,
  }, testInfo) => {
    // Use per-project prefix to avoid any rare cross-project collisions
    const taskTitle = `E2E-${testInfo.project.name}-Task-${Date.now()}`;
    await page.goto('/');
    await addTaskUI(page, taskTitle);
    await waitForTask(page, taskTitle);
    await expect(rowByTitle(page, taskTitle)).toBeVisible();

    // API verify
    const apiTasks = await (await request.get(API_URL)).json();
    const created = apiTasks.find((t: any) => t.title === taskTitle);
    expect(created).toBeDefined();
    expect(created.completed).toBe(false);

    const row = rowByTitle(page, taskTitle);
    // Mark complete: opens modal and requires reason/signature
    await row.getByRole('button', { name: 'Mark Complete' }).click();
    const completeModal = page.locator('.m-form');
    await completeModal.getByPlaceholder('Why is this task complete?').fill('Done in E2E');
    await completeModal.getByPlaceholder('Your name / initials').fill('E2E');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH',
      ),
      completeModal.getByRole('button', { name: 'Confirm' }).click(),
    ]);
    await row.locator('.status-badge', { hasText: 'Completed' }).waitFor({ timeout: 10000 });
    // API verify completed
    const afterComplete = await (await request.get(API_URL)).json();
    expect(afterComplete.find((t: any) => t.title === taskTitle).completed).toBe(true);
    // Delete
    await row.getByRole('button', { name: 'Delete task' }).click();
    await expect(rowByTitle(page, taskTitle)).toHaveCount(0);
    const afterDelete = await (await request.get(API_URL)).json();
    expect(afterDelete.find((t: any) => t.title === taskTitle)).toBeUndefined();
  });

  test('UI burst add then API verify consistency', async ({ page, request }, testInfo) => {
    await page.goto('/');
    const base = `${testInfo.project.name}-${Date.now()}`;
    const titles = Array.from({ length: 4 }, (_, i) => `E2E Burst ${base}-${i}`);
    for (const t of titles) {
      await addTaskUI(page, t);
      await waitForTask(page, t);
    }
    // Verify all rows present (tolerant to slight UI refresh timing)
    await page.waitForFunction(
      (expected) => {
        const present = Array.from(document.querySelectorAll('#task-table .task-title')).map(
          (e) => (e as HTMLElement).innerText,
        );
        return expected.every((t) => present.some((p) => p.includes(t)));
      },
      titles,
      { timeout: 10000 },
    );
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
    const response = await request.post(API_URL, { data: { title: '' } });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Title required');
  });

  test('UI: should not add empty task', async ({ page }) => {
    await page.goto('/');
    // Open modal and try to submit empty
    await page.getByRole('button', { name: 'Add New Task' }).click();
    const modal = page.locator('.m-form');
    await modal.getByRole('button', { name: 'Create' }).click();
    // The input is required; either the browser blocks submit (no error shown), or our UI shows an error.
    // Assert that the modal is still open and either error is visible or the title input is invalid.
    await expect(modal).toBeVisible();
    const error = modal.locator('.m-error');
    const titleInput = modal.getByPlaceholder('Task title');
    // Prefer explicit branch: if error appears, good; otherwise the input validity should be false
    const errorShown = await error.isVisible().catch(() => false);
    if (!errorShown) {
      const valid = await titleInput.evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(valid).toBe(false);
    }
    // Close modal
    await modal.getByRole('button', { name: 'Cancel' }).click();
  });
});
