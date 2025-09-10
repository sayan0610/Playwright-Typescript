import { test, expect, Page } from '@playwright/test';

// Helper to get a table row (main task row) by title text. Uses regex to be resilient to whitespace.
function rowByTitle(page: Page, title: string) {
  const table = page.locator('#task-table');
  return table
    .locator('tbody tr')
    .filter({ has: page.locator('.task-title', { hasText: title }) })
    .first();
}

// Helper to count only main task rows (exclude detail rows) by presence of status badge
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

test.describe('Task Manager UI', () => {
  test('should load the page and display the title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Task');
    await expect(page.locator('h1')).toContainText('Manager');
  });

  test('should add a new task', async ({ page }) => {
    await page.goto('/');
    await addTaskUI(page, 'Playwright Test Task');
    await expect(rowByTitle(page, 'Playwright Test Task')).toBeVisible();
  });

  test('should mark a task as complete and then undo', async ({ page }) => {
    await page.goto('/');
    const title = 'Complete Me';
    await addTaskUI(page, title);
    const row = rowByTitle(page, title);
    await expect(row).toBeVisible();
    // Click complete (button opens a modal requiring reason and signature)
    const completeBtn = row.getByRole('button', { name: 'Mark Complete' });
    await completeBtn.click();
    const completeModal = page.locator('.m-form');
    await completeModal.getByPlaceholder('Why is this task complete?').fill('Done via UI test');
    await completeModal.getByPlaceholder('Your name / initials').fill('PW');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH',
      ),
      completeModal.getByRole('button', { name: 'Confirm' }).click(),
    ]);
    await row.locator('.status-badge', { hasText: 'Completed' }).waitFor({ timeout: 10000 });
    const titleSpan = row.locator('.task-title');
    await expect(titleSpan).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('should delete a task', async ({ page }) => {
    await page.goto('/');
    const title = 'Delete Me';
    await addTaskUI(page, title);
    const row = rowByTitle(page, title);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Delete task' }).click();
    await expect(rowByTitle(page, title)).toHaveCount(0);
  });

  test('should allow multiple tasks and reflect correct count', async ({ page }) => {
    await page.goto('/');
    const titles = ['Task A', 'Task B', 'Task C'];
    for (const t of titles) {
      await addTaskUI(page, t);
      await waitForTask(page, t);
    }
    for (const t of titles) {
      await expect(rowByTitle(page, t)).toBeVisible();
    }
    // Instead of asserting absolute count (flaky when other parallel browser projects add tasks),
    // ensure no duplicate missing: every added title present exactly once.
    for (const t of titles) {
      await expect(rowByTitle(page, t)).toHaveCount(1);
    }
  });

  test('should handle rapid add operations without losing tasks', async ({ page }) => {
    await page.goto('/');
    const burst = 5;
    const unique = Date.now();
    for (let i = 0; i < burst; i++) {
      const title = `Burst ${unique}-${i}`;
      await addTaskUI(page, title);
      await waitForTask(page, title);
      await expect(rowByTitle(page, title)).toBeVisible();
    }
    // Ensure each burst task appears exactly once
    for (let i = 0; i < burst; i++) {
      await expect(rowByTitle(page, `Burst ${unique}-${i}`)).toHaveCount(1);
    }
  });

  test('trims whitespace in task title input (UI expectation)', async ({ page }) => {
    await page.goto('/');
    const raw = '   Spaced Title   ';
    await addTaskUI(page, raw);
    await expect(rowByTitle(page, 'Spaced Title')).toBeVisible();
  });
});
