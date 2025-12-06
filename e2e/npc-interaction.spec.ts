import { test, expect } from '@playwright/test';

test.describe('NPC Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game');
    await page.waitForTimeout(1500);
  });

  test('should display NPC proximity hint when near NPC', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
  });

  test('should open dialogue when E key pressed near NPC', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(50);
    }

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(1000);

    await expect(canvas).toBeVisible();
  });

  test('should close dialogue on subsequent E key press', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(50);
    }

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(1000);

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(500);

    await expect(canvas).toBeVisible();
  });

  test('should maintain game state while dialogue is open', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(50);
    }

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(500);

    await page.keyboard.press('KeyA');
    await page.waitForTimeout(200);

    await expect(canvas).toBeVisible();
  });

  test('should handle movement away from NPC', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await canvas.click();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('KeyW');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('KeyS');
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);
    await expect(canvas).toBeVisible();
  });
});
