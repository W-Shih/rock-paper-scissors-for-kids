import { evaluateRound, gestures, winningGestureAgainst, type Gesture, type RoundResult } from './rps-domain';
import { createProgressStore } from './progress-store';
import { chooseLearnOpponent } from './learn-domain';

export type GameMode = 'learn' | 'computer' | 'together';
export type RoundPhase = 'home' | 'choosing-p1' | 'handoff' | 'choosing-p2' | 'countdown' | 'approach' | 'reveal' | 'complete';
export type RoundState = Readonly<{
  roundId: number;
  mode: GameMode | null;
  phase: RoundPhase;
  presentation: 'animated' | 'static';
  opponentGesture: Gesture | null;
  player1Selection: Gesture | null;
  player2Selection: Gesture | null;
  result: RoundResult | null;
  learnAttempts: number;
  learnDemonstration: 'correct' | 'voluntary' | 'forced' | null;
}>;

export type RoundEvent =
  | { type: 'START'; mode: GameMode; opponentGesture?: Gesture }
  | { type: 'SELECT_GESTURE'; player: 1 | 2; gesture: Gesture }
  | { type: 'CONFIRM_SELECTION'; player: 1 | 2 }
  | { type: 'SHOW_DEMONSTRATION' }
  | { type: 'MEDIA_FINISHED' | 'MEDIA_FAILED'; roundId: number; phase: RoundPhase }
  | { type: 'REPLAY' | 'HOME' };

export type RoundEffect = Readonly<{ type: 'PLAY_PHASE'; roundId: number; phase: RoundPhase }>;
export type RoundTransition = Readonly<{ state: RoundState; effects: readonly RoundEffect[] }>;

export const initialRoundState: RoundState = {
  roundId: 0, mode: null, phase: 'home', presentation: 'animated', opponentGesture: null,
  player1Selection: null, player2Selection: null, result: null, learnAttempts: 0, learnDemonstration: null,
};

function freshRound(roundId: number, mode: GameMode | null, opponentGesture: Gesture | null): RoundState {
  return { roundId, mode, phase: mode ? 'choosing-p1' : 'home', presentation: 'animated', opponentGesture,
    player1Selection: null, player2Selection: null, result: null, learnAttempts: 0, learnDemonstration: null };
}

function enterPhase(state: RoundState, phase: RoundPhase): RoundTransition {
  const next = { ...state, phase };
  return { state: next, effects: ['handoff', 'countdown', 'approach', 'reveal'].includes(phase)
    ? [{ type: 'PLAY_PHASE', roundId: next.roundId, phase }] : [] };
}

function beginReveal(state: RoundState, player1: Gesture, player2: Gesture): RoundTransition {
  return enterPhase({ ...state, player1Selection: player1, player2Selection: player2,
    result: evaluateRound(player1, player2) }, 'countdown');
}

export function reduceRound(state: RoundState, event: RoundEvent, computerGesture?: Gesture): RoundTransition {
  if (event.type === 'START') {
    if ((state.phase !== 'home' && state.phase !== 'complete') || (event.mode === 'learn' && !event.opponentGesture)) return { state, effects: [] };
    return { state: freshRound(state.roundId + 1, event.mode, event.mode === 'learn' ? event.opponentGesture ?? null : null), effects: [] };
  }
  if (event.type === 'HOME') {
    if (state.learnDemonstration !== null && state.phase !== 'complete') return { state, effects: [] };
    return { state: freshRound(state.roundId + 1, null, null), effects: [] };
  }
  if (event.type === 'REPLAY') {
    if (state.phase !== 'complete' || !state.mode) return { state, effects: [] };
    return { state: freshRound(state.roundId + 1, state.mode, state.opponentGesture), effects: [] };
  }
  if (event.type === 'SELECT_GESTURE') {
    if (event.player === 1 && state.phase === 'choosing-p1') return { state: { ...state, player1Selection: event.gesture }, effects: [] };
    if (event.player === 2 && state.phase === 'choosing-p2' && state.mode === 'together') return { state: { ...state, player2Selection: event.gesture }, effects: [] };
    return { state, effects: [] };
  }
  if (event.type === 'CONFIRM_SELECTION') {
    if (event.player === 1 && state.phase === 'choosing-p1' && state.player1Selection) {
      if (state.mode === 'together') return enterPhase(state, 'handoff');
      if (state.mode === 'learn' && state.opponentGesture) {
        const correct = winningGestureAgainst(state.opponentGesture);
        const attempts = state.learnAttempts + 1;
        if (state.player1Selection !== correct && attempts < 3) {
          return { state: { ...state, learnAttempts: attempts, player1Selection: null }, effects: [] };
        }
        return beginReveal({ ...state, learnAttempts: attempts,
          learnDemonstration: state.player1Selection === correct ? 'correct' : 'forced' }, correct, state.opponentGesture);
      }
      const opponent = state.mode === 'learn' ? state.opponentGesture : computerGesture;
      return opponent ? beginReveal(state, state.player1Selection, opponent) : { state, effects: [] };
    }
    if (event.player === 2 && state.phase === 'choosing-p2' && state.player1Selection && state.player2Selection) {
      return beginReveal(state, state.player1Selection, state.player2Selection);
    }
    return { state, effects: [] };
  }
  if (event.type === 'SHOW_DEMONSTRATION') {
    if (state.mode !== 'learn' || state.phase !== 'choosing-p1' || !state.opponentGesture) return { state, effects: [] };
    return beginReveal({ ...state, learnDemonstration: 'voluntary' }, winningGestureAgainst(state.opponentGesture), state.opponentGesture);
  }
  if (event.type === 'MEDIA_FINISHED' || event.type === 'MEDIA_FAILED') {
    if (event.roundId !== state.roundId || event.phase !== state.phase) return { state, effects: [] };
    if (event.type === 'MEDIA_FAILED' && state.result) {
      if (state.presentation === 'static') return { state, effects: [] };
      // The renderer must present the complete static explanation and explicitly
      // acknowledge it. A failed animation/watchdog is not proof it was shown.
      return { state: { ...state, phase: 'reveal', presentation: 'static' }, effects: [] };
    }
    if (state.phase === 'handoff') return enterPhase(state, 'choosing-p2');
    if (state.phase === 'countdown') return enterPhase(state, 'approach');
    if (state.phase === 'approach') return enterPhase(state, 'reveal');
    if (state.phase === 'reveal') return enterPhase(state, 'complete');
  }
  return { state, effects: [] };
}

export interface RoundClock {
  schedule(callback: () => void, delayMs: number): unknown;
  cancel(handle: unknown): void;
}
export interface RoundMedia {
  play(effect: RoundEffect, notify: (event: RoundEvent) => void): void | (() => void);
}
export interface RoundControllerOptions {
  random?: () => number;
  clock: RoundClock;
  media: RoundMedia;
  watchdogMs?: number;
  progressStore?: ReturnType<typeof createProgressStore>;
}

export function chooseComputerGesture(random: () => number): Gesture {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('random must return a value in [0, 1)');
  return gestures[Math.floor(value * gestures.length)];
}

export function createRoundController(options: RoundControllerOptions) {
  let state = initialRoundState;
  let watchdog: unknown;
  let cancelMedia: (() => void) | undefined;
  let phaseToken = 0;
  let disposed = false;
  const progressStore = options.progressStore ?? createProgressStore();
  let learnQuestionIndex = 0;
  const listeners = new Set<(state: RoundState) => void>();
  const clearEffects = () => {
    phaseToken++;
    if (watchdog !== undefined) options.clock.cancel(watchdog);
    watchdog = undefined;
    const cancel = cancelMedia;
    cancelMedia = undefined;
    try { cancel?.(); } catch { /* An adapter failure must not prevent leaving the round. */ }
  };
  const dispatch = (event: RoundEvent): RoundState => {
    if (disposed) return state;
    const oldId = state.roundId;
    const computer = event.type === 'CONFIRM_SELECTION' && event.player === 1 && state.phase === 'choosing-p1'
      && state.mode === 'computer' && state.player1Selection
      ? chooseComputerGesture(options.random ?? Math.random) : undefined;
    let nextEvent = event;
    if ((event.type === 'START' && event.mode === 'learn' && !event.opponentGesture
        && (state.phase === 'home' || state.phase === 'complete'))
      || (event.type === 'REPLAY' && state.mode === 'learn' && state.phase === 'complete')) {
      nextEvent = { type: 'START', mode: 'learn', opponentGesture: chooseLearnOpponent(
        progressStore.progress.masteryCountsByRuleId, learnQuestionIndex++, options.random ?? Math.random,
      ) };
    }
    const transition = reduceRound(state, nextEvent, computer);
    if (transition.state === state) return state;
    if (transition.state.roundId !== oldId || transition.state.phase !== state.phase
      || transition.state.presentation !== state.presentation) clearEffects();
    state = transition.state;
    // Commit before notifying the renderer or starting media. Once choosing has
    // ended, repeated confirmation and media callbacks cannot issue another award.
    if (state.mode === 'learn' && state.learnDemonstration === 'correct' && state.learnAttempts === 1
      && state.phase === 'countdown' && transition.effects.length > 0 && state.result?.ruleId !== 'tie' && state.result) {
      const ruleId = state.result.ruleId;
      const counts = progressStore.progress.masteryCountsByRuleId;
      if (counts[ruleId] < 3) progressStore.save({ ...counts, [ruleId]: counts[ruleId] + 1 });
    }
    const transitionToken = phaseToken;
    listeners.forEach((listener) => listener(state));
    if (disposed || state !== transition.state || transitionToken !== phaseToken) return state;
    for (const effect of transition.effects) {
      const token = phaseToken;
      const notify = (mediaEvent: RoundEvent) => { if (token === phaseToken) dispatch(mediaEvent); };
      watchdog = options.clock.schedule(() => notify({ type: 'MEDIA_FAILED', roundId: effect.roundId, phase: effect.phase }), options.watchdogMs ?? 5000);
      try {
        const cancel = options.media.play(effect, notify);
        if (token === phaseToken) cancelMedia = cancel || undefined;
        else cancel?.();
      } catch {
        notify({ type: 'MEDIA_FAILED', roundId: effect.roundId, phase: effect.phase });
      }
    }
    return state;
  };
  return {
    getState: () => state,
    getProgress: () => progressStore.progress,
    getStorageWarning: () => progressStore.warning,
    dispatch,
    subscribe(listener: (state: RoundState) => void) { listeners.add(listener); return () => listeners.delete(listener); },
    dispose() { disposed = true; clearEffects(); listeners.clear(); },
  };
}
