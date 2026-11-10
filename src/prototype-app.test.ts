// @vitest-environment jsdom
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import { expect, test } from 'vitest';
import { createPrototypeApp } from './prototype-app';

test('home offers bilingual destinations and opens the Learn prototype', () => {
  const app = createPrototypeApp(); document.body.append(app.element);
  try {
    for (const name of ['學習 / Learn', '比賽 / Play', '收藏館 / Garage']) {
      expect(getByRole(app.element, 'button', { name })).toBeTruthy();
    }
    fireEvent.click(getByRole(app.element, 'button', { name: '學習 / Learn' }));
    expect(getByRole(app.element, 'region', { name: /教學|Learn/ })).toBeTruthy();
    expect(getByRole(app.element, 'button', { name: '回首頁 / Home' })).toBeTruthy();
  } finally { app.dispose(); app.element.remove(); }
});

test('Play opens the playable Computer prototype and Together still returns home', () => {
  const app = createPrototypeApp(); document.body.append(app.element);
  try {
    fireEvent.click(getByRole(app.element, 'button', { name: '比賽 / Play' }));
    fireEvent.click(getByRole(app.element, 'button', { name: '電腦 / Computer' }));
    expect(getByRole(app.element, 'region', { name: '電腦對戰原型 / Computer play spike' })).toBeTruthy();
    expect(getByRole(app.element, 'button', { name: /^✊/ })).toBeTruthy();
    fireEvent.click(getByRole(app.element, 'button', { name: '回首頁 / Home' }));
    fireEvent.click(getByRole(app.element, 'button', { name: '比賽 / Play' }));
    fireEvent.click(getByRole(app.element, 'button', { name: '親子 / Together' }));
    expect(getByRole(app.element, 'region', { name: /親子流程原型|Together flow spike/ })).toBeTruthy();
    fireEvent.click(getByRole(app.element, 'button', { name: '回首頁 / Home' }));
    expect(getByRole(app.element, 'button', { name: '收藏館 / Garage' })).toBeTruthy();
  } finally { app.dispose(); app.element.remove(); }
});

test('Garage and parent settings require a deliberate confirmation and stay unavailable', () => {
  const app = createPrototypeApp(); document.body.append(app.element);
  try {
    fireEvent.click(getByRole(app.element, 'button', { name: '收藏館 / Garage' }));
    expect(getByRole(app.element, 'status').textContent).toMatch(/原型|prototype/i);
    fireEvent.click(getByRole(app.element, 'button', { name: '回首頁 / Home' }));
    fireEvent.click(getByRole(app.element, 'button', { name: '家長設定 / Parent settings' }));
    expect(queryByRole(app.element, 'region', { name: '家長設定 / Parent settings' })).toBeNull();
    fireEvent.click(getByRole(app.element, 'button', { name: '繼續 / Continue' }));
    expect(getByRole(app.element, 'region', { name: '家長設定 / Parent settings' })).toBeTruthy();
    fireEvent.click(getByRole(app.element, 'button', { name: '知道了 / Got it' }));
    expect(queryByRole(app.element, 'region', { name: '家長設定 / Parent settings' })).toBeNull();
  } finally { app.dispose(); app.element.remove(); }
});

test('leaving and re-entering Together discards the previous selection and removes app listeners on dispose', () => {
  const app = createPrototypeApp(); document.body.append(app.element);
  try {
    fireEvent.click(getByRole(app.element, 'button', { name: '比賽 / Play' }));
    fireEvent.click(getByRole(app.element, 'button', { name: '親子 / Together' }));
    fireEvent.click(getByRole(app.element, 'button', { name: /^✊/ }));
    fireEvent.click(getByRole(app.element, 'button', { name: '回首頁 / Home' }));
    fireEvent.click(getByRole(app.element, 'button', { name: '比賽 / Play' }));
    fireEvent.click(getByRole(app.element, 'button', { name: '親子 / Together' }));
    expect(app.element.querySelector('[aria-pressed="true"]')).toBeNull();
  } finally { app.dispose(); app.element.remove(); }
  window.dispatchEvent(new PopStateEvent('popstate'));
});

test('pagehide clears active prototype and pageshow returns to home without retaining stale controls', () => {
  const app = createPrototypeApp(); document.body.append(app.element);
  fireEvent.click(getByRole(app.element, 'button', { name: '比賽 / Play' }));
  fireEvent.click(getByRole(app.element, 'button', { name: '親子 / Together' }));
  fireEvent.click(getByRole(app.element, 'button', { name: /^✊/ }));
  const staleControl = getByRole(app.element, 'button', { name: /^✊/ });
  fireEvent.click(getByRole(app.element, 'button', { name: '確認 / Confirm' }));
  window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
  expect(app.element.querySelector('main')?.innerHTML).toBe('');
  window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  expect(getByRole(app.element, 'button', { name: '學習 / Learn' })).toBeTruthy();
  fireEvent.click(getByRole(app.element, 'button', { name: '比賽 / Play' }));
  fireEvent.click(getByRole(app.element, 'button', { name: '親子 / Together' }));
  expect(app.element.querySelector('[aria-pressed="true"]')).toBeNull();
  fireEvent.click(staleControl);
  expect(app.element.querySelector('[aria-pressed="true"]')).toBeNull();
  fireEvent.click(getByRole(app.element, 'button', { name: /^✋/ }));
  fireEvent.click(getByRole(app.element, 'button', { name: '確認 / Confirm' }));
  window.dispatchEvent(new PopStateEvent('popstate'));
  expect(app.element.querySelector('[aria-pressed="true"]')).toBeNull();
  expect(getByRole(app.element, 'button', { name: '學習 / Learn' })).toBeTruthy();
  app.dispose(); app.element.remove();
});
