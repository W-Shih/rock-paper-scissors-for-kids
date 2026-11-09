// @vitest-environment jsdom
import { fireEvent, getByRole } from '@testing-library/dom';
import { expect, test } from 'vitest';
import { createPrototypeApp } from './prototype-app';

test('pagehide clears secrets even for bfcache, pageshow and browser back safely reopen home', () => {
  const app = createPrototypeApp(); document.body.append(app.element);
  const click = (name: string | RegExp) => fireEvent.click(getByRole(app.element, 'button', { name }));
  try {
    click('親子原型 / Together spike'); click(/^✊/); click('確認 / Confirm');
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    expect(app.element.innerHTML).toBe('');
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    click('親子原型 / Together spike');
    expect(app.element.querySelector('[aria-pressed="true"]')).toBeNull();
    click(/^✋/); click('確認 / Confirm');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(getByRole(app.element, 'button', { name: '學習 / Learn' })).toBeTruthy();
    click('親子原型 / Together spike');
    expect(app.element.querySelector('[aria-pressed="true"]')).toBeNull();
  } finally { app.dispose(); app.element.remove(); }
});
