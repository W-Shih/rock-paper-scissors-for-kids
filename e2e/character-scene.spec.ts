import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test('original character and construction scene artwork fits narrow cards and stays secret until reveal', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => { Math.random = () => 0.4; });
  await page.goto('/');
  await page.getByRole('button', { name: '比賽 / Play' }).click();
  await page.getByRole('button', { name: '電腦 / Computer' }).click();

  const screen = page.getByRole('region', { name: '電腦對戰原型 / Computer play spike' });
  const scene = screen.locator('[data-scene="construction-site"]');
  await expect(scene).toBeVisible();
  await expect.poll(() => scene.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(720);
  const cards = screen.locator('.gesture-card');
  await expect(cards).toHaveCount(3);
  const initialGeometry = await cards.evaluateAll(elements => elements.map(card => {
    const bounds = card.getBoundingClientRect();
    const symbol = card.querySelector('.gesture-card__symbol')!.getBoundingClientRect();
    const art = card.querySelector('.gesture-card__artwork') as HTMLImageElement;
    const artBounds = art.getBoundingClientRect();
    const vehicle = card.querySelector('.gesture-card__vehicle')!.getBoundingClientRect();
    return {
      left: bounds.left, right: bounds.right, bottom: bounds.bottom, width: bounds.width, height: bounds.height,
      symbolTop: symbol.top, artTop: artBounds.top, artBottom: artBounds.bottom,
      vehicleBottom: vehicle.bottom, imageWidth: art.naturalWidth, imageHeight: art.naturalHeight,
    };
  }));
  expect(initialGeometry.every(rect => rect.left >= 0 && rect.right <= 320 && rect.width >= 56 && rect.height >= 56)).toBe(true);
  expect(initialGeometry.every(rect => rect.imageWidth === 240 && rect.imageHeight === 144 && rect.artTop >= rect.symbolTop && rect.vehicleBottom <= rect.bottom)).toBe(true);
  expect(initialGeometry.map(rect => rect.artBottom < rect.vehicleBottom)).toEqual([true, true, true]);
  await expect(cards.nth(0).locator('[data-character-key="rock"]')).toBeVisible();
  await expect(cards.nth(1).locator('[data-character-key="scissors"]')).toBeVisible();
  await expect(cards.nth(2).locator('[data-character-key="paper"]')).toBeVisible();

  await mkdir(path.join('test-results', 'm1-04'), { recursive: true });
  await page.screenshot({ path: path.join('test-results', 'm1-04', `${testInfo.project.name}-320-selection.png`), fullPage: true });

  await screen.getByRole('button', { name: /^✊/ }).click();
  await screen.getByRole('button', { name: '確認 / Confirm', exact: true }).click();
  await expect(screen.getByRole('status')).toContainText('Ready, Set, Go!');
  expect(await screen.locator('[data-character-key="scissors"]').count()).toBe(0);
  expect(await screen.locator('figure').count()).toBe(0);
  await expect(screen.getByRole('figure', { name: '中央揭曉結果 / Central reveal' })).toBeVisible();
  const revealed = screen.locator('figure .reveal-characters img');
  await expect(revealed).toHaveCount(2);
  await expect.poll(() => revealed.nth(0).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(240);
  await expect.poll(() => revealed.nth(1).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(240);
  const revealedGeometry = await revealed.evaluateAll(images => images.map(image => {
    const bounds = image.getBoundingClientRect();
    return { left: bounds.left, right: bounds.right, width: bounds.width, height: bounds.height };
  }));
  expect(revealedGeometry.every(rect => rect.left >= 0 && rect.right <= 320 && rect.width > 0 && rect.height > 0)).toBe(true);
  await page.screenshot({ path: path.join('test-results', 'm1-04', `${testInfo.project.name}-320-reveal.png`), fullPage: true });
});
