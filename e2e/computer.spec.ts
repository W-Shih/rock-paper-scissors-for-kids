import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test('Computer completes win, loss and tie with happy recovery, fresh replay and Home', async ({ page }, testInfo) => {
  const screenshots = join(process.cwd(), 'test-results', 'm1-07');
  await mkdir(screenshots, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/');
  await page.getByRole('button', { name: '比賽 / Play' }).click();
  await page.getByRole('button', { name: '電腦 / Computer' }).click();
  const screen = page.getByRole('region', { name: '電腦對戰原型 / Computer play spike' });
  for (const [symbol, outcome, message] of [
    ['✌️', 'loss', "It's okay. Let's help our truck."],
    ['✋', 'win', 'You won! Great job!'],
    ['✊', 'tie', "It's a tie! Let's play again!"],
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${symbol}`) }).click();
    await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
    const feedback = screen.getByRole('region', { name: '友善回饋 / Friendly feedback' });
    await expect(feedback).toContainText(message!);
    if (outcome === 'loss') {
      await feedback.scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(screenshots, `${testInfo.project.name}-recovery.png`) });
    }
    await expect(screen.getByRole('heading', { name: '完成一局！ / Round complete!' })).toBeVisible();
    await expect(screen.getByRole('img', { name: '兩位朋友都恢復正常、開心的狀態 / Both friends are okay and happy' })).toBeVisible();
    expect(await feedback.locator('.friendly-friend').evaluateAll(friends => friends.map(friend => getComputedStyle(friend).transform))).toEqual(['none', 'none']);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(screen.getByRole('button', { name: '再玩一次 / Play again' })).toBeInViewport({ ratio: 1 });
    await expect(screen.getByRole('button', { name: '回首頁 / Home' })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: join(screenshots, `${testInfo.project.name}-complete-${outcome}.png`), fullPage: true });
    await screen.getByRole('button', { name: '再玩一次 / Play again' }).click();
    await expect(screen.getByRole('figure')).toHaveCount(0);
    await expect(screen.getByRole('button', { name: '確認 / Confirm', exact: true })).toBeDisabled();
  }
  await screen.getByRole('button', { name: '回首頁 / Home' }).click();
  await expect(page.getByRole('button', { name: '比賽 / Play' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Computer keeps its injected choice secret until reveal and shows the matching rule result', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0.4; });
  await page.goto('/');
  await page.getByRole('button', { name: '比賽 / Play' }).click();
  await page.getByRole('button', { name: '電腦 / Computer' }).click();
  const screen = page.getByRole('region', { name: '電腦對戰原型 / Computer play spike' });
  await page.getByRole('button', { name: /^✊/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  await expect(screen.getByRole('status')).toContainText('Ready, Set, Go!');
  const countdownBeat = screen.locator('.countdown-beat');
  await expect(countdownBeat).toHaveText('3');
  await page.clock.fastForward(1000);
  await expect(countdownBeat).toHaveText('2');
  await page.clock.fastForward(1000);
  await expect(countdownBeat).toHaveText('1');
  await page.clock.fastForward(500);
  await expect(countdownBeat).toHaveText('準備，開始！ / Ready, Set, Go!');
  await page.clock.fastForward(500);
  await expect(screen.getByRole('figure')).toHaveCount(0);
  expect(await screen.innerHTML()).not.toMatch(/✌️|剪刀|Scissors|Snip-Snip|aria-label=".*(?:scissors|paper)/i);
  await expect(screen.getByRole('img', { name: '兩位選手前往中央 / Both players approach the centre' })).toBeVisible();
  expect(await screen.innerHTML()).not.toMatch(/✌️|剪刀|Scissors|Snip-Snip/);
  const reveal = screen.getByRole('figure', { name: '中央揭曉結果 / Central reveal' });
  await expect(reveal).toContainText('Computer: ✌️ 剪刀 / Scissors');
  await expect(reveal).toContainText('Rock beats scissors!');
  await expect(reveal.locator('.result-gestures')).toBeInViewport({ ratio: 1 });
  await expect(reveal.locator('.static-causal-explanation')).toBeInViewport({ ratio: 1 });
  await expect(screen.getByRole('status')).toContainText('Round complete!');
  expect(errors).toEqual([]);
});

test('rock-beats-scissors causal storyboard supports either winner position and image failure fallback', async ({ page }, testInfo) => {
  const screenshots = join(process.cwd(), 'test-results', 'm1-06');
  await mkdir(screenshots, { recursive: true });
  const screenshotPath = (name: string) => join(screenshots, `${testInfo.project.name}-${name}.png`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0.4; });
  await page.goto('/');
  await page.getByRole('button', { name: '比賽 / Play' }).click();
  await page.getByRole('button', { name: '電腦 / Computer' }).click();
  const screen = page.getByRole('region', { name: '電腦對戰原型 / Computer play spike' });

  await page.getByRole('button', { name: /^✊/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  const leftWinner = screen.locator('.causal-storyboard');
  await expect(leftWinner).toHaveAttribute('data-winner-position', 'left');
  await expect(screen.locator('.causal-diagram')).toHaveAttribute('data-winner-position', 'left');
  await expect(leftWinner.locator('.storyboard-step--1')).toBeVisible();
  await expect(leftWinner.locator('.storyboard-step--2')).toBeVisible();
  await expect(leftWinner.locator('.storyboard-step--3')).toContainText('everyone is okay');
  await page.screenshot({ path: screenshotPath('rock-winner-left'), fullPage: true });
  await expect(screen.getByRole('status')).toContainText('Round complete!');
  await expect(screen.locator('.causal-storyboard--complete .storyboard-step--3')).toBeVisible();

  await page.getByRole('button', { name: '再玩一次 / Play again' }).click();
  await page.evaluate(() => { Math.random = () => 0; });
  await page.getByRole('button', { name: /^✌️/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  const rightWinner = screen.locator('.causal-storyboard');
  await expect(rightWinner).toHaveAttribute('data-winner-position', 'right');
  await expect(screen.locator('.causal-diagram')).toHaveAttribute('data-winner-position', 'right');
  await expect(rightWinner.locator('.storyboard-step--3')).toContainText('everyone is okay');
  await page.screenshot({ path: screenshotPath('rock-winner-right'), fullPage: true });
  await expect(screen.getByRole('status')).toContainText('Round complete!');

  await page.getByRole('button', { name: '再玩一次 / Play again' }).click();
  await page.route('**/assets/characters/*.svg', route => route.abort());
  await page.evaluate(() => { Math.random = () => 0.4; });
  await page.getByRole('button', { name: /^✊/ }).click();
  await page.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  const fallback = screen.getByRole('figure');
  await expect(fallback.locator('[data-character-key]')).toHaveCount(0);
  await expect(fallback.locator('.result-gestures')).toContainText('✊');
  await expect(fallback.locator('.result-gestures')).toContainText('✌️');
  await expect(fallback).toContainText('Rock beats scissors!');
  await expect(fallback.locator('.causal-diagram svg')).toBeVisible();
  await page.screenshot({ path: screenshotPath('rock-image-failure-fallback'), fullPage: true });
  await expect(screen.getByRole('status')).toContainText('Round complete!');
});
