import { formatBilingualText as bilingual } from './bilingual-text';
import { gestures, type Gesture } from './rps-domain';
import { createGestureCard } from './gesture-card';

export function createGestureSelection(selection: Gesture | null) {
  const choices = document.createElement('div');
  choices.className = 'gesture-selection';
  choices.setAttribute('aria-label', bilingual('選擇手勢', 'Choose a gesture'));
  for (const gesture of gestures) choices.append(createGestureCard(gesture, selection === gesture));

  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.textContent = bilingual('確認', 'Confirm');
  confirm.dataset.action = 'confirm';
  confirm.disabled = selection === null;
  choices.append(confirm);
  return choices;
}
