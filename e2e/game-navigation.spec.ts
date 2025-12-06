import { test, expect } from '@playwright/test';

test.describe('Game Navigation Flow', () => {
  test('should complete full navigation: home -> lobby -> game -> lobby', async ({ page }) => {
    await page.goto('/');

    const playButton = page.getByRole('link', { name: /play now/i }).first();
    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForURL('/lobby');
    } else {
      await page.goto('/lobby');
    }

    await expect(page).toHaveURL('/lobby');

    const startButton = page.getByRole('link', { name: /Start Solo Game/i });
    await startButton.click();

    await page.waitForURL('/game');
    await expect(page).toHaveURL('/game');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(1000);

    await canvas.click();
    await page.keyboard.press('Escape');

    await page.waitForURL('/lobby', { timeout: 3000 });
    await expect(page).toHaveURL('/lobby');
  });

  test('should handle direct game page access', async ({ page }) => {
    await page.goto('/game');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should persist game state during play session', async ({ page }) => {
    await page.goto('/game');
    await page.waitForTimeout(1000);

    const canvas = page.locator('canvas');
    await canvas.click();

    await page.keyboard.press('KeyW');
    await page.waitForTimeout(500);
    await page.keyboard.press('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    await expect(canvas).toBeVisible();
  });

  test('should handle page refresh gracefully', async ({ page }) => {
    await page.goto('/game');
    await page.waitForTimeout(1000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await page.reload();
    await page.waitForTimeout(1000);

    const canvasAfterReload = page.locator('canvas');
    await expect(canvasAfterReload).toBeVisible();
  });

  test('should handle rapid navigation between pages', async ({ page }) => {
    await page.goto('/lobby');
    await page.waitForTimeout(500);

    const startButton = page.getByRole('link', { name: /Start Solo Game/i });
    await startButton.click();
    await page.waitForURL('/game');

    await page.waitForTimeout(500);
    await page.goto('/lobby');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL('/lobby');
  });
});
