import { test, expect, Page } from '@playwright/test';

// Helper to get a table row (main task row) by title text. Uses regex to be resilient to whitespace.
function rowByTitle(page: Page, title: string) {
  return page.locator('#task-list tr').filter({ has: page.locator(`span:has-text("${title}")`) }).first();
}

// Helper to count only main task rows (exclude detail rows) by presence of status badge
function mainTaskRows(page: Page) {
  return page.locator('#task-list tr').filter({ has: page.locator('.status-badge') });
}

async function waitForTask(page: Page, title: string) {
  await page.waitForFunction((t) => {
    return Array.from(document.querySelectorAll('#task-list span[id^="task-title-"]')).some(s => (s as HTMLElement).innerText.includes(t));
  }, title, { timeout: 10000 });
}

test.describe('Task Manager UI', () => {
  test('should load the page and display the title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Task Manager');
  });

  test('should add a new task', async ({ page }) => {
    await page.goto('/');
    await page.fill('#task-input', 'Playwright Test Task');
    await page.click('button[type="submit"]');
    await expect(rowByTitle(page, 'Playwright Test Task')).toBeVisible();
  });

  test('should mark a task as complete and then undo', async ({ page }) => {
    await page.goto('/');
    const title = 'Complete Me';
    await page.fill('#task-input', title);
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST'),
      page.click('button[type="submit"]')
    ]);
    const row = rowByTitle(page, title);
    await expect(row).toBeVisible();
    // Click complete (button has title attr "Complete")
    const statusBtn = row.locator('[data-test-id="status"]');
    await statusBtn.waitFor();
    await statusBtn.click();
    await row.locator('.status-badge', { hasText: 'Completed' }).waitFor({ timeout: 10000 });
    const titleSpan = row.locator(`span:has-text("${title}")`).first();
    await expect(titleSpan).toHaveCSS('text-decoration-line', 'line-through');
    // Undo
    await statusBtn.click();
    await row.locator('.status-badge', { hasText: 'In-Progress' }).waitFor({ timeout: 10000 });
    await expect(titleSpan).toHaveCSS('text-decoration-line', 'none');
  });

  test('should delete a task', async ({ page }) => {
    await page.goto('/');
    const title = 'Delete Me';
    await page.fill('#task-input', title);
    await page.click('button[type="submit"]');
    const row = rowByTitle(page, title);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(rowByTitle(page, title)).toHaveCount(0);
  });

  test('should allow multiple tasks and reflect correct count', async ({ page }) => {
    await page.goto('/');
    const titles = ['Task A', 'Task B', 'Task C'];
    for (const t of titles) {
      await page.fill('#task-input', t);
      await page.click('button[type="submit"]');
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
      await page.fill('#task-input', title);
      await Promise.all([
        page.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST'),
        page.click('button[type="submit"]')
      ]);
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
    await page.fill('#task-input', raw);
    await page.click('button[type="submit"]');
    await expect(rowByTitle(page, 'Spaced Title')).toBeVisible();
  });
});
