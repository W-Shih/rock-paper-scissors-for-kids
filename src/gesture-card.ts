import { formatBilingualText as bilingual } from './bilingual-text';
import { characterArtwork } from './character-assets';
import { playableCharacters, type Gesture } from './rps-domain';

export function createGestureCard(gesture: Gesture, selected: boolean) {
  const character = playableCharacters[gesture];
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'gesture-card';
  card.dataset.action = `select-${gesture}`;
  card.setAttribute('aria-pressed', String(selected));

  const symbol = document.createElement('span');
  symbol.className = 'gesture-card__symbol';
  symbol.textContent = character.symbol;
  const artwork = document.createElement('img');
  artwork.className = 'gesture-card__artwork';
  artwork.src = characterArtwork[gesture];
  artwork.dataset.characterKey = gesture;
  artwork.alt = '';
  artwork.setAttribute('aria-hidden', 'true');
  const gestureName = document.createElement('span');
  gestureName.className = 'gesture-card__gesture';
  gestureName.textContent = bilingual(character.nameZh, character.nameEn);
  const vehicleName = document.createElement('span');
  vehicleName.className = 'gesture-card__vehicle';
  vehicleName.textContent = `${bilingual(character.vehicleZh, character.vehicleEn)}`;
  const selectedMark = document.createElement('span');
  selectedMark.className = 'gesture-card__selected-mark';
  selectedMark.setAttribute('aria-hidden', 'true');
  selectedMark.textContent = '✓';
  card.append(symbol, artwork, gestureName, vehicleName, selectedMark);
  return card;
}
