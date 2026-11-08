// @vitest-environment jsdom
import { getByRole, getByText } from '@testing-library/dom';
import { expect, test } from 'vitest';
import { createPlaceholder } from './placeholder';

test('renders the bilingual placeholder and clearly identifies unavailable gameplay', () => {
  const screen = createPlaceholder();
  expect(getByRole(screen, 'heading', {
    level: 1,
    name: '工地猜拳大賽 / Construction Site RPS Adventure',
  })).toBeTruthy();
  expect(getByText(screen, '原型建置中，尚未開放遊玩。 / Prototype in progress. Gameplay is not available yet.')).toBeTruthy();
  expect(screen.querySelector('button, a')).toBeNull();
});
