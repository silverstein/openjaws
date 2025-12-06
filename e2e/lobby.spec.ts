import { test, expect } from '@playwright/test';

test.describe('Lobby Page', () => {
  test('should load lobby page correctly', async ({ page }) => {
    await page.goto('/lobby');

    await expect(page).toHaveTitle(/Beach Panic/);

    const heading = page.getByRole('heading', { name: /Beach Panic: Jaws Royale/i });
    await expect(heading).toBeVisible();
  });

  test('should display lobby welcome message', async ({ page }) => {
    await page.goto('/lobby');

    const welcome = page.getByRole('heading', { name: /Welcome to the Lobby/i });
    await expect(welcome).toBeVisible();
  });

  test('should have Start Solo Game button', async ({ page }) => {
    await page.goto('/lobby');

    const startButton = page.getByRole('link', { name: /Start Solo Game/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
  });

  test('should have disabled multiplayer button', async ({ page }) => {
    await page.goto('/lobby');

    const multiplayerButton = page.getByRole('button', { name: /Join Multiplayer/i });
    await expect(multiplayerButton).toBeVisible();
    await expect(multiplayerButton).toBeDisabled();
  });

  test('should display game instructions', async ({ page }) => {
    await page.goto('/lobby');

    await expect(page.getByText(/How to Play:/i)).toBeVisible();
    await expect(page.getByText(/WASD or Arrow Keys/i)).toBeVisible();
    await expect(page.getByText(/SPACE to activate/i)).toBeVisible();
    await expect(page.getByText(/ESC during game/i)).toBeVisible();
  });

  test('should navigate to game page when clicking Start Solo Game', async ({ page }) => {
    await page.goto('/lobby');

    const startButton = page.getByRole('link', { name: /Start Solo Game/i });
    await startButton.click();

    await page.waitForURL('/game');
    await expect(page).toHaveURL('/game');
  });
});
