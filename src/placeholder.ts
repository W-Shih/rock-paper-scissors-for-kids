import { formatBilingualText } from './bilingual-text';

export function createPlaceholder(statusText = formatBilingualText('原型建置中，尚未開放遊玩。', 'Prototype in progress. Gameplay is not available yet.')): HTMLElement {
  const main = document.createElement('main');
  const heading = document.createElement('h1');
  heading.textContent = formatBilingualText('工地猜拳大賽', 'Construction Site RPS Adventure');
  const status = document.createElement('p');
  status.textContent = statusText;
  main.append(heading, status);
  return main;
}
