// @vitest-environment jsdom
import { fireEvent, getByRole, getByText, queryByRole, queryByText } from '@testing-library/dom';
import { afterEach, expect, test } from 'vitest';
import { createLearnApp } from './learn-ui';
import { createProgressStore } from './progress-store';
import type { RoundEvent } from './round-controller';

const apps: Array<ReturnType<typeof createLearnApp>> = [];
afterEach(() => { apps.forEach((app) => app.dispose()); apps.length = 0; document.body.replaceChildren(); });
function mount(options: Parameters<typeof createLearnApp>[0] = {}) {
  const app = createLearnApp({ progressStore: createProgressStore({ getItem: () => null, setItem() {} }), ...options });
  apps.push(app);
  document.body.append(app.element);
  const click = (name: string | RegExp) => fireEvent.click(getByRole(app.element, 'button', { name }));
  click('學習 / Learn');
  return { screen: app.element, click, app };
}

test('opponent is public, cards are provisional and reselectable, and first correct confirmation saves before demonstration completion', () => {
  const { screen, click } = mount();
  expect(getByText(screen, '對手手勢 / Opponent gesture: ✌️ 剪刀 / Scissors')).toBeTruthy();
  expect(getByText(screen, '什麼能贏剪刀？ / What beats scissors?')).toBeTruthy();
  expect((getByRole(screen, 'button', { name: '確認 / Confirm' }) as HTMLButtonElement).disabled).toBe(true);
  click(/^✋/); click(/^✊/);
  expect(getByRole(screen, 'button', { name: /^✊/ }).getAttribute('aria-pressed')).toBe('true');
  expect(getByText(screen, '規則 1 / Rule 1 0/3')).toBeTruthy();
  click('確認 / Confirm');
  expect(getByRole(screen, 'figure', { name: '正確規則示範 / Correct rule demonstration' }).textContent).toContain('Rock stops scissors.');
  expect(getByText(screen, '規則 1 / Rule 1 1/3')).toBeTruthy();
  expect(queryByRole(screen, 'button', { name: '下一題 / Next question' })).toBeNull();
  click('示範看完了 / Demonstration finished');
  expect(getByText(screen, '本題完成 / Question complete')).toBeTruthy();
  click('下一題 / Next question');
  expect(getByText(screen, '什麼能贏布？ / What beats paper?')).toBeTruthy();
  expect(getByText(screen, '規則 1 / Rule 1 1/3')).toBeTruthy();
});

test('two gentle hints do not reveal the answer in DOM or ARIA; third wrong automatically shows full static cause and blocks exit until acknowledged', () => {
  const { screen, click } = mount();
  for (let attempt = 1; attempt <= 2; attempt++) {
    click(/^✋/); click('確認 / Confirm');
    fireEvent.click(getByRole(screen, 'button', { name: '確認 / Confirm' }));
    expect(queryByRole(screen, 'figure')).toBeNull();
    expect(screen.innerHTML).not.toContain('Rock beats scissors');
    expect(screen.innerHTML).not.toContain('Rock stops scissors');
    expect(getByText(screen, attempt === 1
      ? '再看看三種手勢，試試別的選擇。 / Look at the three gestures and try another choice.'
      : '慢慢想，哪個手勢能贏對手呢？ / Take your time. Which gesture can beat the opponent?')).toBeTruthy();
  }
  click(/^✋/); click('確認 / Confirm');
  const figure = getByRole(screen, 'figure');
  expect(figure.textContent).toContain('✊ 石頭 / Rock → ✌️ 剪刀 / Scissors');
  expect(figure.textContent).toContain('石頭擋住剪刀。');
  expect(figure.textContent).toContain('Rock stops scissors.');
  expect(queryByRole(screen, 'button', { name: '確認 / Confirm' })).toBeNull();
  expect(queryByRole(screen, 'button', { name: '下一題 / Next question' })).toBeNull();
  expect(queryByRole(screen, 'button', { name: '回首頁 / Home' })).toBeNull();
  expect(getByText(screen, '規則 1 / Rule 1 0/3')).toBeTruthy();
  click('示範看完了 / Demonstration finished');
  click('回首頁 / Home');
  expect(getByRole(screen, 'button', { name: '學習 / Learn' })).toBeTruthy();
});

test.each([1, 2])('correct after %i wrong answer(s) still completes without awarding progress', (wrongCount) => {
  const { screen, click } = mount();
  for (let index = 0; index < wrongCount; index++) { click(/^✋/); click('確認 / Confirm'); }
  click(/^✊/); click('確認 / Confirm');
  expect(getByRole(screen, 'figure').textContent).toContain('Rock beats scissors!');
  click('示範看完了 / Demonstration finished');
  expect(getByText(screen, '本題完成 / Question complete')).toBeTruthy();
  expect(getByText(screen, '規則 1 / Rule 1 0/3')).toBeTruthy();
});

test('voluntary demonstration and unavailable storage still allow completion and truthfully show saving warning', () => {
  const { screen, click } = mount({ progressStore: createProgressStore(() => { throw new Error('Storage blocked'); }) });
  click('直接看示範 / Show demonstration');
  expect(getByRole(screen, 'figure').textContent).toContain('Rock stops scissors.');
  expect(getByText(screen, '規則 1 / Rule 1 0/3')).toBeTruthy();
  expect(getByText(screen, '學習進度及收藏可能無法保留。 / Learning progress and collectibles may not be saved.')).toBeTruthy();
  click('示範看完了 / Demonstration finished');
  expect(getByText(screen, '本題完成 / Question complete')).toBeTruthy();
});

test('voluntary demonstration keeps Home unavailable until the complete static cause is acknowledged', () => {
  let notify: ((event: RoundEvent) => void) | undefined;
  const { screen, click } = mount({ media: { play(_effect, callback) { notify = callback; } } });
  click('直接看示範 / Show demonstration');
  expect(queryByRole(screen, 'button', { name: '回首頁 / Home' })).toBeNull();
  notify!({ type: 'MEDIA_FAILED', roundId: 1, phase: 'countdown' });
  expect(getByRole(screen, 'figure').textContent).toContain('Rock stops scissors.');
  expect(queryByRole(screen, 'button', { name: '回首頁 / Home' })).toBeNull();
  click('示範看完了 / Demonstration finished');
  expect(getByRole(screen, 'button', { name: '回首頁 / Home' })).toBeTruthy();
});

test('forced media failure renders necessary cause before completion; stale callback and repeated acknowledgement cannot advance a new question', () => {
  let notify: ((event: RoundEvent) => void) | undefined;
  const { screen, click } = mount({ media: { play(_effect, callback) { notify = callback; } } });
  for (let index = 0; index < 3; index++) { click(/^✋/); click('確認 / Confirm'); }
  expect(queryByRole(screen, 'figure')).toBeNull();
  expect(queryByRole(screen, 'button', { name: '示範看完了 / Demonstration finished' })).toBeNull();
  notify!({ type: 'MEDIA_FAILED', roundId: 1, phase: 'countdown' });
  expect(getByRole(screen, 'figure').textContent).toContain('Rock stops scissors.');
  const acknowledgement = getByRole(screen, 'button', { name: '示範看完了 / Demonstration finished' });
  fireEvent.click(acknowledgement);
  fireEvent.click(acknowledgement); // detached old controls have no delegated listener
  click('下一題 / Next question');
  notify!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  expect(getByText(screen, '什麼能贏布？ / What beats paper?')).toBeTruthy();
  expect(queryByText(screen, '本題完成 / Question complete')).toBeNull();
});

test('new mount restores synchronous qualifying progress and unlock without relying on media completion', () => {
  let raw: string | null = null;
  const storage = { getItem: () => raw, setItem(_key: string, value: string) { raw = value; } };
  const progressStore = createProgressStore(storage);
  progressStore.save({ 'rock-beats-scissors': 2, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 });
  const first = mount({ progressStore });
  first.click(/^✊/); first.click('確認 / Confirm');
  first.app.dispose(); first.screen.remove();
  const second = mount({ progressStore: createProgressStore(storage) });
  expect(getByText(second.screen, '規則 1 / Rule 1 3/3')).toBeTruthy();
  expect(getByText(second.screen, '已解鎖收藏：1/3 / Collectibles unlocked: 1/3')).toBeTruthy();
});
