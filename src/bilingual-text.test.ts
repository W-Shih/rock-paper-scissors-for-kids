import { expect, test } from 'vitest';
import { formatBilingualText } from './bilingual-text';

test('keeps Traditional Chinese and English together in display order', () => {
  expect(formatBilingualText('布', 'Paper')).toBe('布 / Paper');
});
