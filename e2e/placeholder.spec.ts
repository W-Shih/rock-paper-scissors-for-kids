import { expect, test } from '@playwright/test';

test('production build loads the bilingual placeholder without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', {
    level: 1,
    name: '工地猜拳大賽 / Construction Site RPS Adventure',
  })).toBeVisible();
  await expect(page.getByText('原型建置中，尚未開放遊玩。 / Prototype in progress. Gameplay is not available yet.')).toBeVisible();
  expect(errors).toEqual([]);
});
