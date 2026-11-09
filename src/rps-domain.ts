export const gestures = ['rock', 'scissors', 'paper'] as const;

export type Gesture = (typeof gestures)[number];
export type Outcome = 'win' | 'lose' | 'tie';
export type RuleId =
  | 'rock-beats-scissors'
  | 'scissors-beats-paper'
  | 'paper-beats-rock'
  | 'tie';

export type MasteryRuleId = Exclude<RuleId, 'tie'>;
export const masteryRuleIds = ['rock-beats-scissors', 'scissors-beats-paper', 'paper-beats-rock'] as const satisfies readonly MasteryRuleId[];
// Keep the ordered list exhaustive when a winning rule is added.
const masteryRuleCoverage: Record<MasteryRuleId, true> = {
  'rock-beats-scissors': true, 'scissors-beats-paper': true, 'paper-beats-rock': true,
} satisfies Record<(typeof masteryRuleIds)[number], true>;
void masteryRuleCoverage;
export type MasteryCounts = Readonly<Record<MasteryRuleId, number>>;

export type RoundResult = Readonly<{
  player1Gesture: Gesture;
  player2Gesture: Gesture;
  outcome: Outcome;
  ruleId: RuleId;
}>;

const winningRules = {
  rock: { loser: 'scissors', ruleId: 'rock-beats-scissors' },
  scissors: { loser: 'paper', ruleId: 'scissors-beats-paper' },
  paper: { loser: 'rock', ruleId: 'paper-beats-rock' },
} as const satisfies Record<Gesture, { loser: Gesture; ruleId: Exclude<RuleId, 'tie'> }>;

export function evaluateRound(player1Gesture: Gesture, player2Gesture: Gesture): RoundResult {
  if (player1Gesture === player2Gesture) {
    return { player1Gesture, player2Gesture, outcome: 'tie', ruleId: 'tie' };
  }

  const player1Rule = winningRules[player1Gesture];
  if (player1Rule.loser === player2Gesture) {
    return { player1Gesture, player2Gesture, outcome: 'win', ruleId: player1Rule.ruleId };
  }

  return {
    player1Gesture,
    player2Gesture,
    outcome: 'lose',
    ruleId: winningRules[player2Gesture].ruleId,
  };
}

export function winningGestureAgainst(opponentGesture: Gesture): Gesture {
  return gestures.find((gesture) => winningRules[gesture].loser === opponentGesture)!;
}

export type PlayableCharacter = Readonly<{
  gesture: Gesture;
  symbol: '✊' | '✌️' | '✋';
  nameZh: string;
  nameEn: string;
  vehicleZh: string;
  vehicleEn: string;
}>;

// Presentation content is intentionally independent from the rule evaluator.
export const playableCharacters: Readonly<Record<Gesture, PlayableCharacter>> = {
  rock: {
    gesture: 'rock', symbol: '✊', nameZh: '石頭', nameEn: 'Rock',
    vehicleZh: '推推隊長（推土機）', vehicleEn: 'Captain Dozer',
  },
  scissors: {
    gesture: 'scissors', symbol: '✌️', nameZh: '剪刀', nameEn: 'Scissors',
    vehicleZh: '剪剪高手（液壓剪挖土機）', vehicleEn: 'Snip-Snip',
  },
  paper: {
    gesture: 'paper', symbol: '✋', nameZh: '布', nameEn: 'Paper',
    vehicleZh: '蓋蓋吊車（吊車＋柔軟大布）', vehicleEn: 'Cover Crane',
  },
};
