// @vitest-environment jsdom
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import { afterEach, expect, test, vi } from 'vitest';
import { createTogetherApp } from './together-ui';
import { createProgressStore } from './progress-store';
import type { RoundControllerOptions, RoundEvent } from './round-controller';

const apps: ReturnType<typeof createTogetherApp>[] = [];
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, 'animate');
afterEach(() => {
  apps.forEach(app => app.dispose()); apps.length = 0; document.body.replaceChildren(); vi.useRealTimers();
  if (originalAnimate) Object.defineProperty(Element.prototype, 'animate', originalAnimate);
  else Reflect.deleteProperty(Element.prototype, 'animate');
});
function mount(options: Partial<RoundControllerOptions> = {}) {
  const app = createTogetherApp(options); apps.push(app); document.body.append(app.element);
  const click = (name: string | RegExp) => fireEvent.click(getByRole(app.element, 'button', { name }));
  return { app, screen: app.element, click };
}
test('confirmed P1 choice is removed from handoff DOM and focus; P2 starts with no selection', () => {
  const { screen, click } = mount();
  const oldChoice = getByRole(screen, 'button', { name: /^✊/ }); oldChoice.focus();
  click(/^✊/); click('確認 / Confirm');
  expect(screen.innerHTML).not.toMatch(/rock|scissors|paper|✊|✌️|✋|Dozer|Snip|Crane|aria-pressed/i);
  expect(screen.contains(oldChoice)).toBe(false);
  expect(document.activeElement?.textContent).toContain('玩家 1 已準備');
  fireEvent.click(oldChoice);
  click('玩家 2 準備好了 / Player 2 is ready');
  expect(screen.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  expect((getByRole(screen, 'button', { name: '確認 / Confirm' }) as HTMLButtonElement).disabled).toBe(true);
  expect(queryByRole(screen, 'figure')).toBeNull();
});

test('handoff waits for P2 and cancel or safe reload cannot recover the confirmed choice', () => {
  vi.useFakeTimers();
  const { app, screen, click } = mount();
  click(/^✊/); click('確認 / Confirm');
  vi.advanceTimersByTime(30000);
  expect(screen.textContent).toContain('玩家 1 已準備');
  click('回首頁 / Home'); click('親子 / Together');
  expect(screen.querySelector('[aria-pressed="true"]')).toBeNull();
  click(/^✋/); click('確認 / Confirm');
  app.dispose(); screen.remove();
  const reloaded = mount();
  expect(reloaded.screen.querySelector('[aria-pressed="true"]')).toBeNull();
});

test('countdown precedes reveal; missing animation API gives the correct static result', async () => {
  vi.useFakeTimers();
  const { screen, click } = mount();
  click(/^✊/); click('確認 / Confirm'); click('玩家 2 準備好了 / Player 2 is ready');
  click(/^✌️/); click('確認 / Confirm');
  expect(screen.textContent).toContain('Ready, Set, Go!');
  expect(screen.innerHTML).not.toMatch(/✊|✌️|✋|Dozer|Snip|Crane/);
  await vi.advanceTimersByTimeAsync(3000);
  expect(getByRole(screen, 'figure').textContent).toContain('Rock beats scissors!');
  expect(getByRole(screen, 'figure').textContent).toContain('Rock stops scissors.');
  expect(queryByRole(screen, 'button', { name: '再玩一次 / Play again' })).toBeNull();
  click('看完了 / Finished watching');
  const oldReplay = getByRole(screen, 'button', { name: '再玩一次 / Play again' });
  fireEvent.click(oldReplay); fireEvent.click(oldReplay);
  expect(screen.querySelector('[aria-pressed="true"]')).toBeNull();
});

const pairs = [
  ['✊', '✊', "It's a tie!"], ['✊', '✌️', 'Rock beats scissors!'], ['✊', '✋', 'Paper beats rock!'],
  ['✌️', '✊', 'Rock beats scissors!'], ['✌️', '✌️', "It's a tie!"], ['✌️', '✋', 'Scissors beat paper!'],
  ['✋', '✊', 'Paper beats rock!'], ['✋', '✌️', 'Scissors beat paper!'], ['✋', '✋', "It's a tie!"],
] as const;
test.each(pairs)('Together %s / %s reveals the actual pair and %s without saving mastery', (p1, p2, rule) => {
  const writes = vi.fn();
  const progressStore = createProgressStore({ getItem: () => null, setItem: writes });
  const before = progressStore.progress;
  let finish: ((event: RoundEvent) => void) | undefined;
  const { screen, click } = mount({ progressStore, media: { play(_effect, notify) { finish = notify; } } });
  click(new RegExp(`^${p1}`)); click('確認 / Confirm'); click('玩家 2 準備好了 / Player 2 is ready');
  click(new RegExp(`^${p2}`));
  const confirm = getByRole(screen, 'button', { name: '確認 / Confirm' });
  fireEvent.click(confirm); fireEvent.click(confirm);
  for (const phase of ['countdown', 'approach'] as const) {
    expect(screen.innerHTML).not.toMatch(/✊|✌️|✋|Dozer|Snip|Crane|aria-pressed/);
    finish!({ type: 'MEDIA_FINISHED', roundId: 1, phase });
  }
  const figure = getByRole(screen, 'figure');
  expect(figure.textContent).toContain(`Player 1: ${p1}`);
  expect(figure.textContent).toContain(`Player 2: ${p2}`);
  expect(figure.textContent).toContain(rule);
  const oldCallback = finish!;
  oldCallback({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'reveal' });
  oldCallback({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'reveal' });
  expect(screen.querySelectorAll('[role="status"]')).toHaveLength(1);
  click('再玩一次 / Play again');
  oldCallback({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'reveal' });
  expect(queryByRole(screen, 'figure')).toBeNull();
  expect(progressStore.progress).toEqual(before);
  expect(writes).not.toHaveBeenCalled();
});

function animateBoundary() {
  const pending: Array<{ resolve: () => void; reject: () => void; cancel: ReturnType<typeof vi.fn> }> = [];
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: () => {
    let resolve!: () => void; let reject!: () => void;
    const finished = new Promise<void>((yes, no) => { resolve = yes; reject = () => no(new Error('Animation cancelled')); });
    const cancel = vi.fn(reject);
    pending.push({ resolve, reject, cancel }); return { finished, cancel };
  } });
  return pending;
}
function choosePair(click: (name: string | RegExp) => void) {
  click(/^✋/); click('確認 / Confirm'); click('玩家 2 準備好了 / Player 2 is ready'); click(/^✊/); click('確認 / Confirm');
}
test.each(['success', 'reject', 'timeout'] as const)('WAAPI %s settles once, with both neutral vehicles private until central reveal', async mode => {
  vi.useFakeTimers(); const animations = animateBoundary();
  const { screen, click } = mount(); choosePair(click);
  await vi.advanceTimersByTimeAsync(3000);
  expect(screen.querySelector('svg')).toBeTruthy();
  expect(screen.innerHTML).not.toMatch(/✊|✌️|✋|Dozer|Snip|Crane/);
  expect(animations).toHaveLength(2);
  if (mode === 'success') { animations[0].resolve(); animations[1].resolve(); }
  if (mode === 'reject') animations[0].reject();
  await vi.advanceTimersByTimeAsync(mode === 'timeout' ? 5000 : 0);
  expect(getByRole(screen, 'figure').textContent).toContain('Paper beats rock!');
  expect(animations.every(a => a.cancel.mock.calls.length === 1)).toBe(true);
  if (mode === 'success') await vi.advanceTimersByTimeAsync(1800);
  else click('看完了 / Finished watching');
  expect(screen.textContent).toContain('Round complete!');
  click('再玩一次 / Play again');
  animations.forEach(a => a.resolve()); await vi.advanceTimersByTimeAsync(10000);
  expect(queryByRole(screen, 'figure')).toBeNull();
  expect(screen.querySelector('[aria-pressed="true"]')).toBeNull();
});

test.each(['home', 'dispose'] as const)('leaving by %s cancels active animation, timers and stale notifications', async action => {
  vi.useFakeTimers(); const animations = animateBoundary();
  const { app, screen, click } = mount(); choosePair(click);
  await vi.advanceTimersByTimeAsync(3000);
  if (action === 'home') click('回首頁 / Home'); else app.dispose();
  expect(animations.every(a => a.cancel.mock.calls.length === 1)).toBe(true);
  const after = screen.innerHTML;
  animations.forEach(a => a.resolve()); await vi.advanceTimersByTimeAsync(10000);
  expect(screen.innerHTML).toBe(after);
  expect(vi.getTimerCount()).toBe(0);
});

test('a later WAAPI setup exception still cleans up the already started animation without an unhandled rejection', async () => {
  vi.useFakeTimers();
  const cancel = vi.fn(); let reject!: (reason: Error) => void;
  const finished = new Promise<void>((_resolve, no) => { reject = no; });
  let calls = 0;
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: () => {
    if (++calls === 2) throw new Error('Second animation unavailable');
    cancel.mockImplementation(() => reject(new Error('Cancelled first animation')));
    return { finished, cancel };
  } });
  const { screen, click } = mount(); choosePair(click);
  await vi.advanceTimersByTimeAsync(3000);
  expect(getByRole(screen, 'figure').textContent).toContain('Paper beats rock!');
  expect(cancel).toHaveBeenCalledOnce();
  click('看完了 / Finished watching');
  expect(screen.textContent).toContain('Round complete!');
});
