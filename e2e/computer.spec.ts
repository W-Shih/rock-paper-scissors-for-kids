import { expect, test } from '@playwright/test';

test('Computer keeps its injected choice secret until reveal and shows the matching rule result', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0.4; });
  await page.goto('/');
  await page.getByRole('button', { name: '比賽 / Play' }).click();
  await page.getByRole('button', { name: '電腦 / Computer' }).click();
  const screen = page.getByRole('region', { name: '電腦對戰原型 / Computer play spike' });
  await page.getByRole('button', { name: /^✊/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  await expect(screen.getByRole('status')).toContainText('Ready, Set, Go!');
  expect(await screen.innerHTML()).not.toMatch(/✌️|剪刀|Scissors|Snip-Snip|aria-label=".*(?:scissors|paper)/i);
  await expect(screen.getByRole('img', { name: '兩位選手前往中央 / Both players approach the centre' })).toBeVisible();
  expect(await screen.innerHTML()).not.toMatch(/✌️|剪刀|Scissors|Snip-Snip/);
  const reveal = screen.getByRole('figure', { name: '中央揭曉結果 / Central reveal' });
  await expect(reveal).toContainText('Computer: ✌️ 剪刀 / Scissors');
  await expect(reveal).toContainText('Rock beats scissors!');
  await expect(screen.getByRole('status')).toContainText('Round complete!');
  expect(errors).toEqual([]);
});
