export function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export function assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
        throw new Error(message || `Assertion failed: expected ${expected}, but got ${actual}`);
    }
}