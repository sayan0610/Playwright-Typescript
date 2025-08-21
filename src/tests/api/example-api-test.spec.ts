import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
    test('GET example endpoint', async ({ request }) => {
        const response = await request.get('http://localhost:3000/api/tasks');
        expect(response.status()).toBe(200);
        const data = await response.json();
        // expect(data).toHaveProperty('key');
    });

    // test('POST example endpoint', async ({ request }) => {
    //     const response = await request.post('https://localhost:300/api/tasks', {
    //         data: { key: 'value' },
    //     });
    //     expect(response.status()).toBe(201);
    //     const data = await response.json();
    //     expect(data).toHaveProperty('id');
    // });
});