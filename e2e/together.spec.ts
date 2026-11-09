import { expect, test } from '@playwright/test';

test('Together keeps handoff/countdown/approach private, reveals once centrally and replays cleanly', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: '親子原型 / Together spike' }).click();
  await page.getByRole('button', { name: /^✊/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  const screen = page.getByRole('region', { name: '親子流程原型 / Together flow spike' });
  await expect(screen).toContainText('Player 1 is ready. Pass to Player 2.');
  expect(await screen.innerHTML()).not.toMatch(/✊|✌️|✋|Dozer|Snip|Crane|aria-pressed|rock|scissors|paper/i);
  await page.getByRole('button', { name: '玩家 2 準備好了 / Player 2 is ready' }).click();
  await expect(screen.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: /^✌️/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  await expect(screen.getByRole('status')).toContainText('Ready, Set, Go!');
  expect(await screen.innerHTML()).not.toMatch(/✊|✌️|✋|Dozer|Snip|Crane/);
  await expect(screen.getByRole('img', { name: '兩位選手前往中央 / Both players approach the centre' })).toBeVisible();
  expect(await screen.innerHTML()).not.toMatch(/✊|✌️|✋|Dozer|Snip|Crane/);
  const reveal = screen.getByRole('figure', { name: '中央共同揭曉 / Central simultaneous reveal' });
  await expect(reveal).toContainText('Player 1: ✊ 石頭 / Rock');
  await expect(reveal).toContainText('Player 2: ✌️ 剪刀 / Scissors');
  await expect(reveal).toContainText('Rock beats scissors!');
  await expect(screen.getByText('完成一局！ / Round complete!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '再玩一次 / Play again' }).click();
  await expect(screen.getByRole('figure')).toHaveCount(0);
  await expect(screen.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: '回首頁 / Home' }).click();
  await expect(page.getByText('規則 1 / Rule 1 0/3', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('cancel, reload and browser back never restore a confirmed Together choice', async ({ page }) => {
  await page.goto('/');
  async function handoff() {
    await page.getByRole('button', { name: '親子原型 / Together spike' }).click();
    await page.getByRole('button', { name: /^✋/ }).click();
    await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
    await expect(page.getByRole('button', { name: '玩家 2 準備好了 / Player 2 is ready' })).toBeVisible();
  }
  await handoff();
  await page.getByRole('button', { name: '回首頁 / Home' }).click();
  await page.getByRole('button', { name: '親子原型 / Together spike' }).click();
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
  await page.reload(); await handoff();
  await page.reload();
  await expect(page.getByRole('button', { name: '學習 / Learn', exact: true })).toBeVisible();
  await handoff();
  await page.goto('/?return-check');
  await page.goBack();
  await expect(page.getByRole('button', { name: '學習 / Learn', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '親子原型 / Together spike' }).click();
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0);
});

test('rejected browser animation shows correct static explanation and remains playable', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    Element.prototype.animate = () => { throw new Error('Animation unavailable'); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '親子原型 / Together spike' }).click();
  await page.getByRole('button', { name: /^✋/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  await page.getByRole('button', { name: '玩家 2 準備好了 / Player 2 is ready' }).click();
  await page.getByRole('button', { name: /^✊/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  await expect(page.getByRole('figure')).toContainText('Paper gently covers rock.');
  await page.getByRole('button', { name: '看完了 / Finished watching' }).click();
  await expect(page.getByRole('button', { name: '再玩一次 / Play again' })).toBeVisible();
  expect(errors).toEqual([]);
});
