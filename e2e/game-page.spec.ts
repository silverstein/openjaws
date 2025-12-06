import { test, expect } from '@playwright/test';

test.describe('Game Page', () => {
  test('should load game page correctly', async ({ page }) => {
    await page.goto('/game');

    await expect(page).toHaveTitle(/Beach Panic/);
  });

  test('should render canvas element', async ({ page }) => {
    await page.goto('/game');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    await page.waitForTimeout(2000);

    const canvasElement = await canvas.elementHandle();
    if (canvasElement) {
      const width = await canvasElement.evaluate((el) => (el as HTMLCanvasElement).width);
      const height = await canvasElement.evaluate((el) => (el as HTMLCanvasElement).height);

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    }
  });

  test('should display game instructions overlay', async ({ page }) => {
    await page.goto('/game');

    await expect(page.getByText(/Beach Panic: Jaws Royale/i)).toBeVisible();
    await expect(page.getByText(/Use WASD or Arrow Keys/i)).toBeVisible();
    await expect(page.getByText(/Press F to take selfie/i)).toBeVisible();
    await expect(page.getByText(/Press SPACE/i)).toBeVisible();
    await expect(page.getByText(/Complete objectives/i)).toBeVisible();
  });

  test('should display character information', async ({ page }) => {
    await page.goto('/game');

    await expect(page.getByText(/Playing as:/i)).toBeVisible();
    await expect(page.getByText(/The Influencer/i)).toBeVisible();
    await expect(page.getByText(/Going Live/i)).toBeVisible();
  });

  test('should display ESC instruction at bottom', async ({ page }) => {
    await page.goto('/game');

    await expect(page.getByText(/Press ESC to return to lobby/i)).toBeVisible();
  });

  test('should display health hearts', async ({ page }) => {
    await page.goto('/game');

    await expect(page.getByText(/You have 5 hits before game over/i)).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/game');

    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBeGreaterThan(0);
    expect(viewportSize?.height).toBeGreaterThan(0);

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
