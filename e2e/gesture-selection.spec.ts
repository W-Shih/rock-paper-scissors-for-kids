import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'iphone-portrait', width: 390, height: 844 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
] as const;

for (const viewport of viewports) {
  test(`gesture selection fits ${viewport.name}, supports keyboard reselection and confirms once`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
    await page.getByRole('button', { name: '比賽 / Play' }).click();
    await page.getByRole('button', { name: '親子 / Together' }).click();

    const screen = page.getByRole('region', { name: '親子流程原型 / Together flow spike' });
    const cards = screen.locator('.gesture-card');
    await expect(cards).toHaveCount(3);
    expect(await screen.locator('audio').count()).toBe(0);
    await expect(cards.nth(0)).toContainText('石頭 / Rock');
    await expect(cards.nth(0)).toContainText('推推隊長（推土機） / Captain Dozer');
    await expect(cards.nth(1)).toContainText('剪刀 / Scissors');
    await expect(cards.nth(1)).toContainText('剪剪高手（液壓剪挖土機） / Snip-Snip');
    await expect(cards.nth(2)).toContainText('布 / Paper');
    await expect(cards.nth(2)).toContainText('蓋蓋吊車（吊車＋柔軟大布） / Cover Crane');

    const confirm = screen.getByRole('button', { name: '確認 / Confirm' });
    await expect(confirm).toBeDisabled();
    await page.keyboard.press('Tab');
    await expect(cards.nth(0)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(cards.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    await expect(cards.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(cards.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Tab');
    await expect(cards.nth(2)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(cards.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'false');

    for (let index = 0; index < 8; index++) await cards.nth(index % 2).click({ noWaitAfter: true });
    await expect(screen.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(cards.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(cards.nth(2)).toHaveAttribute('aria-pressed', 'false');
    const sizes = await Promise.all([0, 1, 2].map(async index => cards.nth(index).boundingBox()));
    expect(sizes.every(box => box !== null && box.width >= 56 && box.height >= 56 && box.x >= 0 && box.x + box.width <= viewport.width && box.y >= 0 && box.y + box.height <= viewport.height)).toBe(true);
    const confirmBox = await confirm.boundingBox();
    expect(confirmBox).not.toBeNull();
    expect(confirmBox!.height).toBeGreaterThanOrEqual(56);
    expect(confirmBox!.y + confirmBox!.height).toBeLessThanOrEqual(viewport.height);
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageWidth).toBeLessThanOrEqual(viewport.width);
    await mkdir(path.join('test-results', 'm1-02'), { recursive: true });
    await page.screenshot({ path: path.join('test-results', 'm1-02', `${testInfo.project.name}-${viewport.name}.png`), fullPage: true });

    await page.goto('/');
    await page.getByRole('button', { name: '比賽 / Play' }).click();
    await page.getByRole('button', { name: '親子 / Together' }).click();
    const keyboardScreen = page.getByRole('region', { name: '親子流程原型 / Together flow spike' });
    const keyboardCards = keyboardScreen.locator('.gesture-card');
    const keyboardConfirm = keyboardScreen.getByRole('button', { name: '確認 / Confirm' });
    await page.keyboard.press('Tab');
    await expect(keyboardCards.nth(0)).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(keyboardCards.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await expect(keyboardCards.nth(2)).toHaveAttribute('aria-pressed', 'true');
    await expect(keyboardCards.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Tab');
    await expect(keyboardConfirm).toBeFocused();
    await expect(keyboardConfirm).toBeEnabled();

    const staleConfirm = await keyboardConfirm.elementHandle();
    await page.keyboard.press('Enter');
    await expect(keyboardScreen.getByText('玩家 1 已準備，請交給玩家 2。 / Player 1 is ready. Pass to Player 2.')).toBeVisible();
    await expect(keyboardScreen.getByRole('heading', { name: '玩家 1 已準備，請交給玩家 2。 / Player 1 is ready. Pass to Player 2.' })).toBeFocused();
    await staleConfirm?.evaluate((button: HTMLButtonElement) => button.click());
    expect(await keyboardScreen.locator('[aria-pressed="true"]').count()).toBe(0);
    expect(await keyboardScreen.locator('audio').count()).toBe(0);
  });
}
