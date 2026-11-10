// @vitest-environment jsdom
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import { afterEach, expect, test, vi } from 'vitest';
import { createComputerApp } from './computer-ui';
import type { RoundControllerOptions, RoundEvent } from './round-controller';

const apps: ReturnType<typeof createComputerApp>[] = [];
afterEach(() => { apps.forEach(app => app.dispose()); apps.length = 0; document.body.replaceChildren(); vi.useRealTimers(); });
function mount(options: Partial<RoundControllerOptions> = {}) {
  const app = createComputerApp(options); apps.push(app); document.body.append(app.element);
  const click = (name: string | RegExp) => fireEvent.click(getByRole(app.element, 'button', { name }));
  return { app, screen: app.element, click };
}

test('Computer shares gesture cards and keeps the opponent neutral until reveal', async () => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const { screen, click } = mount({ random: () => 0.4, media: { play(_effect, notify) { notifications.push(notify); } } });
  expect(screen.getAttribute('aria-label')).toBe('電腦對戰原型 / Computer play spike');
  click(/^✊/); click('確認 / Confirm');
  expect(screen.textContent).toContain('3、2、1');
  expect(screen.innerHTML).not.toMatch(/✌️|剪刀|Scissors|Snip|rock|paper|Dozer|Crane|aria-label=".*(?:scissors|paper)/i);
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  expect(screen.innerHTML).not.toMatch(/✌️|剪刀|Scissors|Snip|rock|paper|Dozer|Crane/);
  expect(screen.textContent).toContain('Both players meet in the centre!');
  notifications[1]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'approach' });
  expect(getByRole(screen, 'figure').textContent).toContain('Player 1: ✊ 石頭 / Rock');
  expect(getByRole(screen, 'figure').textContent).toContain('Computer: ✌️ 剪刀 / Scissors');
  expect(getByRole(screen, 'figure').textContent).toContain('Rock beats scissors!');
  expect(queryByRole(screen, 'button', { name: '再玩一次 / Play again' })).toBeNull();
  notifications[2]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'reveal' });
  expect(screen.textContent).toContain('Round complete!');
  expect(queryByRole(screen, 'button', { name: '再玩一次 / Play again' })).toBeTruthy();
});

test('Computer draws only once on confirmation and exposes no opponent card while choosing', () => {
  const random = vi.fn(() => 0.8);
  const { screen, click } = mount({ random });
  click(/^✋/);
  expect(random).not.toHaveBeenCalled();
  expect(queryByRole(screen, 'figure')).toBeNull();
  click('確認 / Confirm');
  expect(random).toHaveBeenCalledOnce();
});

test('Computer shows original character art on cards and reveals both characters only with the result', async () => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const { screen, click } = mount({ random: () => 0.4, media: { play(_effect, notify) { notifications.push(notify); } } });
  const cards = screen.querySelectorAll<HTMLButtonElement>('.gesture-card');
  expect(cards).toHaveLength(3);
  expect(Array.from(cards, card => card.querySelector<HTMLImageElement>('[data-character-key]')?.dataset.characterKey))
    .toEqual(['rock', 'scissors', 'paper']);
  expect(screen.querySelector('[data-scene="construction-site"]')).toBeTruthy();
  click(/^✊/); click('確認 / Confirm');
  expect(screen.querySelector('[data-character-key="scissors"]')).toBeNull();
  expect(screen.innerHTML).not.toMatch(/Snip-Snip|剪剪高手|scissors\.svg/i);
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  notifications[1]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'approach' });
  const revealedCharacters = screen.querySelectorAll('figure [data-character-key]');
  expect(Array.from(revealedCharacters, image => (image as HTMLImageElement).dataset.characterKey)).toEqual(['rock', 'scissors']);
  expect(Array.from(revealedCharacters, image => (image as HTMLImageElement).getAttribute('src')))
    .toEqual(['/assets/characters/captain-dozer.svg', '/assets/characters/snip-snip.svg']);
});

test.each([
  { player: 'rock', opponent: 0.4, position: 'left', rule: 'Rock beats scissors!', cause: 'Rock stops scissors.' },
  { player: 'scissors', opponent: 0, position: 'right', rule: 'Rock beats scissors!', cause: 'Rock stops scissors.' },
] as const)('rock-beats-scissors storyboard works with the winner on the $position', ({ player, opponent, position, rule, cause }) => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const { screen, click } = mount({ random: () => opponent, media: { play(_effect, notify) { notifications.push(notify); } } });
  click(new RegExp(`^${player === 'rock' ? '✊' : '✌️'}`)); click('確認 / Confirm');
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  notifications[1]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'approach' });

  const result = getByRole(screen, 'figure');
  expect(result.querySelector('.causal-storyboard')?.getAttribute('data-winner-position')).toBe(position);
  expect(result.querySelector('.result-gestures')?.textContent).toContain('✊');
  expect(result.querySelector('.result-gestures')?.textContent).toContain('✌️');
  expect(result.textContent).toContain(rule);
  expect(result.textContent).toContain(cause);
});

test.each([
  { player: 'rock', opponent: 0, position: null, cause: '一起揮手／Wave together', rule: "It's a tie!" },
  { player: 'rock', opponent: 0.4, position: 'left', cause: '推開剪刀／Opens shears', rule: 'Rock beats scissors!' },
  { player: 'rock', opponent: 0.8, position: 'right', cause: '布蓋住石頭／Covers rock', rule: 'Paper beats rock!' },
  { player: 'scissors', opponent: 0, position: 'right', cause: '推開剪刀／Opens shears', rule: 'Rock beats scissors!' },
  { player: 'scissors', opponent: 0.4, position: null, cause: '一起揮手／Wave together', rule: "It's a tie!" },
  { player: 'scissors', opponent: 0.8, position: 'left', cause: '剪開布帶／Cuts cloth', rule: 'Scissors beat paper!' },
  { player: 'paper', opponent: 0, position: 'left', cause: '布蓋住石頭／Covers rock', rule: 'Paper beats rock!' },
  { player: 'paper', opponent: 0.4, position: 'right', cause: '剪開布帶／Cuts cloth', rule: 'Scissors beat paper!' },
  { player: 'paper', opponent: 0.8, position: null, cause: '一起揮手／Wave together', rule: "It's a tie!" },
] as const)('result diagram points the correct way for $player against opponent choice $opponent', ({ player, opponent, position, cause, rule }) => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const { screen, click } = mount({ random: () => opponent, media: { play(_effect, notify) { notifications.push(notify); } } });
  const symbol = player === 'rock' ? '✊' : player === 'scissors' ? '✌️' : '✋';
  click(new RegExp(`^${symbol}`)); click('確認 / Confirm');
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  notifications[1]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'approach' });
  const result = getByRole(screen, 'figure');
  const diagram = result.querySelector<HTMLElement>('.causal-diagram')!;
  expect(diagram.dataset.winnerPosition ?? null).toBe(position);
  expect(diagram.querySelector('svg')?.textContent).toContain(cause);
  expect(result.querySelector('.static-causal-explanation')?.textContent).toContain(rule);
});

test('failed character images leave large gestures, the bilingual rule and a self-contained causal diagram', () => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const { screen, click } = mount({ random: () => 0.4, media: { play(_effect, notify) { notifications.push(notify); } } });
  click(/^✊/); click('確認 / Confirm');
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  notifications[1]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'approach' });
  const image = screen.querySelector<HTMLImageElement>('figure [data-character-key="rock"]')!;
  fireEvent.error(image);
  const result = getByRole(screen, 'figure');
  expect(result.querySelectorAll('[data-character-key]')).toHaveLength(0);
  expect(result.querySelector('.result-gestures')?.textContent).toContain('✊');
  expect(result.querySelector('.result-gestures')?.textContent).toContain('✌️');
  expect(result.textContent).toContain('石頭贏剪刀！ / Rock beats scissors!');
  expect(result.querySelector('.causal-diagram svg')).toBeTruthy();
  expect(result.textContent).toContain('The dozer nudges the cutting attachment open');
});

test('static media recovery preserves the full cause and does not restart storyboard motion', () => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const { screen, click } = mount({ random: () => 0.4, media: { play(_effect, notify) { notifications.push(notify); } } });
  click(/^✊/); click('確認 / Confirm');
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  notifications[1]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'approach' });
  const story = screen.querySelector('.causal-storyboard')!;
  expect(story.classList.contains('causal-storyboard--complete')).toBe(false);
  notifications[2]!({ type: 'MEDIA_FAILED', roundId: 1, phase: 'reveal' });
  const staticStory = screen.querySelector('.causal-storyboard')!;
  expect(staticStory.classList.contains('causal-storyboard--complete')).toBe(true);
  expect(staticStory.querySelector('.storyboard-step--3')?.textContent).toContain('everyone is okay');
  expect(getByRole(screen, 'figure').textContent).toContain('Rock beats scissors!');
  expect(getByRole(screen, 'button', { name: '看完了 / Finished watching' })).toBeTruthy();
});

test('Home and dispose discard a locked choice mid-countdown without restoring a secret', () => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.8);
  const { app, screen, click } = mount({ random, media: { play(_effect, notify) { notifications.push(notify); } } });
  click(/^✊/); click('確認 / Confirm');
  const staleCountdown = notifications[0]!;
  expect(random).toHaveBeenCalledOnce();
  click('回首頁 / Home');
  staleCountdown({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  expect(queryByRole(screen, 'figure')).toBeNull();

  app.dispose();
  expect(screen.innerHTML).toBe('');
});
