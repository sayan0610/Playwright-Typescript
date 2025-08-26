import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3000/api/tasks';

test.describe('Task Manager API', () => {
  test('should fetch all tasks', async ({ request }) => {
    const response = await request.get(API_URL);
    expect(response.ok()).toBeTruthy();
    const tasks = await response.json();
    expect(Array.isArray(tasks)).toBeTruthy();
  });

  test('should add a new task', async ({ request }) => {
    const newTask = { title: 'API Test Task' };
    const response = await request.post(API_URL, {
      data: newTask,
    });
    expect(response.status()).toBe(201);
    const task = await response.json();
    expect(task.title).toBe(newTask.title);
    expect(task.completed).toBe(false);
  });

  test('should update a task', async ({ request }) => {
    // Add a new task first
    const addResponse = await request.post(API_URL, {
      data: { title: 'Update Me' },
    });
    const addedTask = await addResponse.json();
    // Update the task
    const updateResponse = await request.put(`${API_URL}/${addedTask.id}`, {
      data: { completed: true },
    });
    expect(updateResponse.ok()).toBeTruthy();
    const updatedTask = await updateResponse.json();
    expect(updatedTask.completed).toBe(true);
  });

  test('should delete a task', async ({ request }) => {
    // Add a new task first
    const addResponse = await request.post(API_URL, {
      data: { title: 'Delete Me' },
    });
    const addedTask = await addResponse.json();
    // Delete the task
    const deleteResponse = await request.delete(`${API_URL}/${addedTask.id}`);
    expect(deleteResponse.ok()).toBeTruthy();
    // Verify deletion
    const getResponse = await request.get(API_URL);
    const tasks = await getResponse.json();
    expect(tasks.find((t: any) => t.id === addedTask.id)).toBeUndefined();
  });
});
