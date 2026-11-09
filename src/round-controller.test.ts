import { describe, expect, test } from 'vitest';
import { createRoundController, reduceRound, chooseComputerGesture, initialRoundState, type RoundEvent, type RoundMedia, type RoundClock } from './round-controller';

function harness(random = () => 0) {
  const scheduled: Array<{ callback: () => void; cancelled: boolean }> = [];
  const played: Array<{ notify: (event: RoundEvent) => void }> = [];
  const clock: RoundClock = {
    schedule(callback) { const item = { callback, cancelled: false }; scheduled.push(item); return item; },
    cancel(handle) { (handle as (typeof scheduled)[number]).cancelled = true; },
  };
  const media: RoundMedia = { play(_effect, notify) { played.push({ notify }); return () => undefined; } };
  const controller = createRoundController({ random, clock, media });
  return { controller, scheduled, played, completeCurrent() {
    const item = played.at(-1)!;
    item.notify({ type: 'MEDIA_FINISHED', roundId: controller.getState().roundId, phase: controller.getState().phase });
  } };
}

describe('round controller', () => {
  test('selection is provisional; confirmation locks one result despite repeated confirmation', () => {
    const { controller } = harness(() => 0.99);
    controller.dispatch({ type: 'START', mode: 'computer' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'rock' });
    expect(controller.getState().result).toBeNull();
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'paper' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    const result = controller.getState().result;
    expect(result).toMatchObject({ player1Gesture: 'paper', player2Gesture: 'paper', outcome: 'tie' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    expect(controller.getState().result).toBe(result);
  });

  test('ignores illegal phase events and invalid Learn setup', () => {
    const invalidStart = reduceRound(initialRoundState, { type: 'START', mode: 'learn' });
    expect(invalidStart.state).toBe(initialRoundState);
    const state = reduceRound(initialRoundState, { type: 'START', mode: 'together' }).state;
    expect(reduceRound(state, { type: 'CONFIRM_SELECTION', player: 1 }).state).toBe(state);
    expect(reduceRound(state, { type: 'SELECT_GESTURE', player: 2, gesture: 'rock' }).state).toBe(state);
  });

  test('Together requires the handoff before player 2 can select; result completes once', () => {
    const { controller, completeCurrent } = harness();
    controller.dispatch({ type: 'START', mode: 'together' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'rock' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    expect(controller.getState().phase).toBe('handoff');
    expect(controller.getState().player1Selection).toBe('rock');
    controller.dispatch({ type: 'SELECT_GESTURE', player: 2, gesture: 'paper' });
    expect(controller.getState().player2Selection).toBeNull();
    completeCurrent();
    expect(controller.getState().phase).toBe('choosing-p2');
    controller.dispatch({ type: 'SELECT_GESTURE', player: 2, gesture: 'paper' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 2 });
    expect(controller.getState().result?.outcome).toBe('lose');
    completeCurrent(); expect(controller.getState().phase).toBe('approach');
    completeCurrent(); expect(controller.getState().phase).toBe('reveal');
    completeCurrent(); expect(controller.getState().phase).toBe('complete');
    controller.dispatch({ type: 'REPLAY' });
    expect(controller.getState()).toMatchObject({ roundId: 2, phase: 'choosing-p1', player1Selection: null, player2Selection: null, result: null });
  });

  test('old phase callback and timer are ignored after Home invalidates the round', () => {
    const { controller, played, scheduled } = harness();
    controller.dispatch({ type: 'START', mode: 'computer' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'rock' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    const oldNotify = played[0]!.notify;
    const oldTimer = scheduled[0]!;
    controller.dispatch({ type: 'HOME' });
    expect(oldTimer.cancelled).toBe(true);
    oldNotify({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
    oldTimer.callback();
    expect(controller.getState()).toMatchObject({ phase: 'home', result: null, roundId: 2 });
  });

  test('watchdog fallback advances a failed or stalled media phase without recalculating', () => {
    const { controller, scheduled } = harness();
    controller.dispatch({ type: 'START', mode: 'learn', opponentGesture: 'scissors' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'rock' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    const lockedResult = controller.getState().result;
    scheduled.at(-1)!.callback();
    expect(controller.getState()).toMatchObject({ phase: 'reveal', presentation: 'static' });
    expect(controller.getState().result).toBe(lockedResult);
    controller.dispatch({ type: 'MEDIA_FAILED', roundId: 1, phase: 'reveal' });
    expect(controller.getState().phase).toBe('reveal');
    controller.dispatch({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'reveal' });
    expect(controller.getState().phase).toBe('complete');
  });

  test.each(['home', 'dispose'] as const)('subscriber %s prevents the outer transition starting stale effects', (action) => {
    const { controller, played, scheduled } = harness();
    controller.subscribe((state) => {
      if (state.phase === 'countdown') {
        if (action === 'home') controller.dispatch({ type: 'HOME' });
        else controller.dispose();
      }
    });
    controller.dispatch({ type: 'START', mode: 'computer' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'rock' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    expect(played).toHaveLength(0);
    expect(scheduled).toHaveLength(0);
    if (action === 'home') expect(controller.getState().phase).toBe('home');
  });

  test('synchronous media exception enters static reveal and awaits rendered acknowledgement', () => {
    let cancelled = false;
    const controller = createRoundController({
      random: () => 0,
      clock: { schedule: () => 1, cancel: () => { cancelled = true; } },
      media: { play() { throw new Error('missing animation'); } },
    });
    controller.dispatch({ type: 'START', mode: 'computer' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'paper' });
    expect(() => controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 })).not.toThrow();
    expect(cancelled).toBe(true);
    expect(controller.getState()).toMatchObject({ phase: 'reveal', presentation: 'static', result: { outcome: 'win' } });
  });

  test('synchronous completion cancels returned handles instead of leaking effects', () => {
    let cancellations = 0;
    const controller = createRoundController({
      random: () => 0,
      clock: { schedule: () => 1, cancel: () => undefined },
      media: { play(effect, notify) {
        notify({ type: 'MEDIA_FINISHED', roundId: effect.roundId, phase: effect.phase });
        return () => { cancellations++; };
      } },
    });
    controller.dispatch({ type: 'START', mode: 'computer' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'paper' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    expect(controller.getState().phase).toBe('complete');
    expect(cancellations).toBe(3);
  });

  test('throwing media cancellation still permits Home to clear round state', () => {
    const controller = createRoundController({
      random: () => 0,
      clock: { schedule: () => 1, cancel: () => undefined },
      media: { play: () => () => { throw new Error('cancel failed'); } },
    });
    controller.dispatch({ type: 'START', mode: 'computer' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'paper' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    expect(() => controller.dispatch({ type: 'HOME' })).not.toThrow();
    expect(controller.getState()).toMatchObject({ phase: 'home', result: null });
  });

  test('replay rejects old phase callbacks and direct reducer rejects stale round or phase notifications', () => {
    const { controller, played, completeCurrent } = harness();
    controller.dispatch({ type: 'START', mode: 'computer' });
    controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture: 'paper' });
    controller.dispatch({ type: 'CONFIRM_SELECTION', player: 1 });
    const oldNotify = played[0]!.notify;
    completeCurrent(); completeCurrent(); completeCurrent();
    controller.dispatch({ type: 'REPLAY' });
    const fresh = controller.getState();
    oldNotify({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
    expect(controller.getState()).toBe(fresh);
    expect(reduceRound(fresh, { type: 'MEDIA_FINISHED', roundId: 1, phase: fresh.phase }).state).toBe(fresh);
    expect(reduceRound(fresh, { type: 'MEDIA_FINISHED', roundId: fresh.roundId, phase: 'reveal' }).state).toBe(fresh);
  });

  test('computer choice maps injected random values uniformly by bucket', () => {
    expect([0, 0.34, 0.67].map((value) => chooseComputerGesture(() => value))).toEqual(['rock', 'scissors', 'paper']);
    expect(() => chooseComputerGesture(() => 1)).toThrow(RangeError);
  });
});
