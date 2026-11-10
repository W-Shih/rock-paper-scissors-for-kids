// @vitest-environment jsdom
import { expect, test } from 'vitest';
import { createGestureSelection } from './gesture-selection';
import { gestures, type Gesture } from './rps-domain';

test('renders three ordered bilingual gesture cards and a disabled bilingual confirm when nothing is selected', () => {
  const choices = createGestureSelection(null);
  const cards = Array.from(choices.querySelectorAll<HTMLButtonElement>('.gesture-card'));
  expect(choices.tagName).toBe('DIV');
  expect(choices.getAttribute('aria-label')).toBe('選擇手勢 / Choose a gesture');
  expect(cards.map(card => card.dataset.action)).toEqual(gestures.map(gesture => `select-${gesture}`));
  expect(cards.every(card => card.getAttribute('aria-pressed') === 'false')).toBe(true);
  expect(cards.map(card => card.textContent)).toEqual([
    expect.stringContaining('✊石頭 / Rock'),
    expect.stringContaining('✌️剪刀 / Scissors'),
    expect.stringContaining('✋布 / Paper'),
  ]);
  const confirm = choices.querySelector<HTMLButtonElement>('[data-action="confirm"]')!;
  expect(confirm.textContent).toBe('確認 / Confirm');
  expect(confirm.disabled).toBe(true);
  expect(Array.from(choices.children).at(-1)).toBe(confirm);
});

test.each(gestures)('marks only %s as pressed and enables confirmation', (selection: Gesture) => {
  const choices = createGestureSelection(selection);
  const cards = Array.from(choices.querySelectorAll<HTMLButtonElement>('.gesture-card'));
  expect(cards.map(card => card.getAttribute('aria-pressed'))).toEqual(gestures.map(gesture => String(gesture === selection)));
  expect(cards.map(card => card.dataset.action)).toEqual(gestures.map(gesture => `select-${gesture}`));
  expect(choices.querySelector<HTMLButtonElement>('[data-action="confirm"]')?.disabled).toBe(false);
});
