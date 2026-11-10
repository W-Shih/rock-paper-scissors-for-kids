import { expect, test } from '@playwright/test';

test('production build loads the bilingual navigation shell without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', {
    level: 1,
    name: '工地猜拳大賽 / Construction Site RPS Adventure',
  })).toBeVisible();
  await expect(page.getByRole('button', { name: '學習 / Learn', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '比賽 / Play', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '收藏館 / Garage', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '學習 / Learn', exact: true }).click();
  await expect(page.getByText('教學流程原型：使用簡化圖文示範。 / Learn flow spike: simplified visual demonstrations.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('first correct confirmation persists immediately across reload and unlocks once at three', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '學習 / Learn', exact: true }).click();
  for (let count = 1; count <= 3; count++) {
    await page.getByRole('button', { name: '學習 / Learn', exact: true }).click();
    await expect(page.getByText('什麼能贏剪刀？ / What beats scissors?')).toBeVisible();
    await page.getByRole('button', { name: /^✊/ }).click();
    await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
    await expect(page.getByRole('figure')).toContainText('Rock stops scissors.');
    await expect(page.getByText(`規則 1 / Rule 1 ${count}/3`, { exact: true })).toBeVisible();
    await page.reload(); // award does not depend on demonstration completion
    await page.getByRole('button', { name: '學習 / Learn', exact: true }).click();
    await expect(page.getByText(`規則 1 / Rule 1 ${count}/3`, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('已解鎖收藏：1/3 / Collectibles unlocked: 1/3')).toBeVisible();
  await page.getByRole('button', { name: '學習 / Learn', exact: true }).click();
  await page.getByRole('button', { name: /^✊/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  await expect(page.getByText('規則 1 / Rule 1 3/3', { exact: true })).toBeVisible();
  await expect(page.getByText('已解鎖收藏：1/3 / Collectibles unlocked: 1/3')).toBeVisible();
});

test('third wrong answer presents the full necessary demonstration before next or Home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '學習 / Learn', exact: true }).click();
  await page.getByRole('button', { name: '學習 / Learn', exact: true }).click();
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.getByRole('button', { name: /^✋/ }).click();
    await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
    if (attempt < 3) {
      await expect(page.getByRole('figure')).toHaveCount(0);
      await expect(page.getByText(/Rock beats scissors!/)).toHaveCount(0);
    }
  }
  await expect(page.getByRole('figure')).toContainText('✊ 石頭 / Rock → ✌️ 剪刀 / Scissors');
  await expect(page.getByRole('figure')).toContainText('Rock stops scissors.');
  await expect(page.getByRole('button', { name: '確認 / Confirm', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '回首頁 / Home', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '下一題 / Next question', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '示範看完了 / Demonstration finished', exact: true }).click();
  await expect(page.getByText('本題完成 / Question complete', { exact: true })).toBeVisible();
  await expect(page.getByText('規則 1 / Rule 1 0/3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '下一題 / Next question', exact: true }).click();
  await expect(page.getByText('什麼能贏布？ / What beats paper?')).toBeVisible();
});
