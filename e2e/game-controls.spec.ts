import { test, expect } from '@playwright/test';

test.describe('Game Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game');
    await page.waitForTimeout(1000);
  });

  test('should respond to WASD keyboard movement', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.press('KeyW');
    await page.waitForTimeout(100);

    await page.keyboard.press('KeyA');
    await page.waitForTimeout(100);

    await page.keyboard.press('KeyS');
    await page.waitForTimeout(100);

    await page.keyboard.press('KeyD');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('should respond to Arrow key movement', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    await expect(canvas).toBeVisible();
  });

  test('should handle ability activation with Space key', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    await expect(canvas).toBeVisible();
  });

  test('should handle selfie action with F key', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.press('KeyF');
    await page.waitForTimeout(500);

    await expect(canvas).toBeVisible();
  });

  test('should handle NPC interaction with E key', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.press('KeyW');
    await page.waitForTimeout(500);

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(500);

    await expect(canvas).toBeVisible();
  });

  test('should return to lobby with ESC key', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.press('Escape');

    await page.waitForURL('/lobby', { timeout: 3000 });
    await expect(page).toHaveURL('/lobby');
  });

  test('should handle continuous movement', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.down('KeyW');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyW');

    await page.keyboard.down('KeyD');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyD');

    await expect(canvas).toBeVisible();
  });

  test('should handle multiple simultaneous key presses', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyD');

    await expect(canvas).toBeVisible();
  });
});
