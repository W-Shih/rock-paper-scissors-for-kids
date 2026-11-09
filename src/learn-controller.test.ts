import { expect, test } from 'vitest';
import { createRoundController, type RoundEvent } from './round-controller';
import { createProgressStore, type StorageLike } from './progress-store';
import type { Gesture } from './rps-domain';

function harness(storage?: StorageLike, random = () => 0.99) {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const controller = createRoundController({
    progressStore: createProgressStore(storage ?? { getItem: () => null, setItem() {} }), random,
    clock: { schedule: () => 1, cancel() {} },
    media: { play(_effect, notify) { notifications.push(notify); } },
  });
  function answer(gesture: Gesture) {
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
  }
  function finish() {
    const state = controller.getState();
    controller.dispatch({ type: 'MEDIA_FINISHED', roundId: state.roundId, phase: state.phase });
  }
  return { controller, answer, finish, notifications };
}

test('first two wrong confirmations only hint; third wrong forces a correct demo with no fourth answer or early exit', () => {
  const { controller, answer, finish } = harness();
  controller.dispatch({ type: 'START', mode: 'learn' });
  answer('paper');
  expect(controller.getState()).toMatchObject({ learnAttempts: 1, phase: 'choosing-p1', result: null, player1Selection: null });
  controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
  expect(controller.getState().learnAttempts).toBe(1);
  answer('scissors');
  expect(controller.getState()).toMatchObject({ learnAttempts: 2, phase: 'choosing-p1', result: null });
  answer('paper');
  expect(controller.getState()).toMatchObject({ learnAttempts: 3, learnDemonstration: 'forced', phase: 'countdown', result: { outcome: 'win', player1Gesture: 'rock' } });
  answer('paper');
  controller.dispatch({ type: 'HOME' });
  controller.dispatch({ type: 'REPLAY' });
  expect(controller.getState()).toMatchObject({ phase: 'countdown', learnAttempts: 3 });
  finish(); finish();
  expect(controller.getState().phase).toBe('reveal');
  finish();
  expect(controller.getState().phase).toBe('complete');
  expect(controller.getProgress().masteryCountsByRuleId['rock-beats-scissors']).toBe(0);
});

test.each([1, 2])('correct after %i hint(s) still demonstrates but earns no mastery', (wrongCount) => {
  const { controller, answer, finish } = harness();
  controller.dispatch({ type: 'START', mode: 'learn' });
  for (let index = 0; index < wrongCount; index++) answer('paper');
  answer('rock');
  expect(controller.getState()).toMatchObject({ phase: 'countdown', learnDemonstration: 'correct', result: { outcome: 'win' } });
  finish(); finish(); finish();
  expect(controller.getState().phase).toBe('complete');
  expect(controller.getProgress().unlockedCollectibleIds).toEqual([]);
  expect(controller.getProgress().masteryCountsByRuleId['rock-beats-scissors']).toBe(0);
});

test('voluntary demonstration uses the correct gesture without awarding mastery', () => {
  const { controller } = harness();
  controller.dispatch({ type: 'START', mode: 'learn', opponentGesture: 'rock' });
  controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'scissors' });
  controller.dispatch({ type: 'SHOW_DEMONSTRATION' });
  expect(controller.getState()).toMatchObject({ learnAttempts: 0, learnDemonstration: 'voluntary', result: { player1Gesture: 'paper', outcome: 'win' } });
  expect(controller.getProgress().masteryCountsByRuleId['paper-beats-rock']).toBe(0);
});

test('first correct confirmation commits once synchronously, unlocks at 3, and survives reload before media completes', () => {
  let raw: string | null = null;
  const storage = { getItem: () => raw, setItem(_key: string, value: string) { raw = value; } };
  const progress = createProgressStore(storage);
  progress.save({ 'rock-beats-scissors': 2, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 });
  const { controller, answer, finish, notifications } = harness(storage);
  controller.dispatch({ type: 'START', mode: 'learn' });
  controller.subscribe((state) => {
    if (state.phase === 'countdown') expect(controller.getProgress().masteryCountsByRuleId['rock-beats-scissors']).toBe(3);
  });
  answer('rock');
  const reloaded = createProgressStore(storage);
  expect(reloaded.progress.masteryCountsByRuleId['rock-beats-scissors']).toBe(3);
  expect(reloaded.progress.unlockedCollectibleIds).toEqual(['collectible-rock-beats-scissors']);
  controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
  finish(); finish(); finish();
  controller.dispatch({ type: 'REPLAY' });
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  expect(controller.getState()).toMatchObject({ phase: 'choosing-p1', learnAttempts: 0, opponentGesture: 'paper' });
  expect(controller.getProgress()).toEqual(reloaded.progress);
});

test('fixed rotation covers each rule and mixed questions only start after all three counts reach 3', () => {
  const { controller, answer, finish } = harness();
  const opponents: Gesture[] = [];
  controller.dispatch({ type: 'START', mode: 'learn' });
  for (let index = 0; index < 9; index++) {
    opponents.push(controller.getState().opponentGesture!);
    answer((['rock', 'scissors', 'paper'] as const)[index % 3]);
    finish(); finish(); finish();
    controller.dispatch({ type: 'REPLAY' });
  }
  expect(opponents).toEqual(['scissors', 'paper', 'rock', 'scissors', 'paper', 'rock', 'scissors', 'paper', 'rock']);
  expect(controller.getState().opponentGesture).toBe('rock'); // injected 0.99, rather than restarting fixed sequence
  expect(controller.getProgress().masteryCountsByRuleId).toEqual({ 'rock-beats-scissors': 3, 'scissors-beats-paper': 3, 'paper-beats-rock': 3 });
  answer('paper'); finish(); finish(); finish();
  expect(controller.getProgress().unlockedCollectibleIds).toHaveLength(3);
});

test('forced demonstration media failure waits for static content acknowledgement and ignores old media', () => {
  const { controller, answer, notifications } = harness();
  controller.dispatch({ type: 'START', mode: 'learn' });
  answer('paper'); answer('paper'); answer('paper');
  notifications[0]!({ type: 'MEDIA_FAILED', roundId: 1, phase: 'countdown' });
  expect(controller.getState()).toMatchObject({ phase: 'reveal', presentation: 'static', result: { player1Gesture: 'rock', player2Gesture: 'scissors', outcome: 'win' } });
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  controller.dispatch({ type: 'MEDIA_FAILED', roundId: 1, phase: 'reveal' });
  controller.dispatch({ type: 'HOME' });
  expect(controller.getState().phase).toBe('reveal');
  controller.dispatch({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'reveal' });
  expect(controller.getState().phase).toBe('complete');
});
