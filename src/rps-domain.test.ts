import { describe, expect, test } from 'vitest';
import { evaluateRound, playableCharacters, winningGestureAgainst, type Gesture } from './rps-domain';

const cases = [
  ['rock', 'rock', 'tie', 'tie'],
  ['rock', 'scissors', 'win', 'rock-beats-scissors'],
  ['rock', 'paper', 'lose', 'paper-beats-rock'],
  ['scissors', 'rock', 'lose', 'rock-beats-scissors'],
  ['scissors', 'scissors', 'tie', 'tie'],
  ['scissors', 'paper', 'win', 'scissors-beats-paper'],
  ['paper', 'rock', 'win', 'paper-beats-rock'],
  ['paper', 'scissors', 'lose', 'scissors-beats-paper'],
  ['paper', 'paper', 'tie', 'tie'],
] as const;

describe('evaluateRound', () => {
  test.each(cases)('%s against %s gives %s with rule %s', (player1, player2, outcome, ruleId) => {
    const result = evaluateRound(player1, player2);
    expect(result).toEqual({ player1Gesture: player1, player2Gesture: player2, outcome, ruleId });
    if (player1 !== player2) {
      expect(evaluateRound(player2, player1).outcome).toBe(outcome === 'win' ? 'lose' : 'win');
      expect(evaluateRound(player2, player1).ruleId).toBe(ruleId);
    }
  });
});

describe('winningGestureAgainst', () => {
  test.each([
    ['rock', 'paper'],
    ['scissors', 'rock'],
    ['paper', 'scissors'],
  ] as const)('returns %s as the winner against %s', (opponent, expected) => {
    expect(winningGestureAgainst(opponent)).toBe(expected);
    expect(evaluateRound(expected, opponent).outcome).toBe('win');
  });
});

test('playable character content has exactly one fixed mapping for every gesture', () => {
  const expected: Record<Gesture, readonly [string, string]> = {
    rock: ['推推隊長（推土機）', 'Captain Dozer'],
    scissors: ['剪剪高手（液壓剪挖土機）', 'Snip-Snip'],
    paper: ['蓋蓋吊車（吊車＋柔軟大布）', 'Cover Crane'],
  };

  expect(Object.keys(playableCharacters).sort()).toEqual(['paper', 'rock', 'scissors']);
  for (const [gesture, character] of Object.entries(playableCharacters) as [Gesture, (typeof playableCharacters)[Gesture]][]) {
    expect([character.vehicleZh, character.vehicleEn]).toEqual(expected[gesture]);
    expect(character.gesture).toBe(gesture);
  }
});
