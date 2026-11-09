import { masteryRuleIds, type Gesture, type MasteryCounts, type MasteryRuleId } from './rps-domain';

const fixedOpponents = ['scissors', 'paper', 'rock'] as const;

export function hasMixedQuestions(counts: MasteryCounts): boolean {
  return masteryRuleIds.every((id) => counts[id] === 3);
}

export function chooseLearnOpponent(counts: MasteryCounts, questionIndex: number, random: () => number): Gesture {
  if (!hasMixedQuestions(counts)) return fixedOpponents[questionIndex % fixedOpponents.length];
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('random must return a value in [0, 1)');
  return fixedOpponents[Math.floor(value * fixedOpponents.length)];
}

export const learnRuleContent = {
  'rock-beats-scissors': {
    zh: '石頭贏剪刀！', en: 'Rock beats scissors!',
    causeZh: '石頭擋住剪刀。推土機推動剪切附件，剪刀裝置彈開；朋友幫忙扶正，大家都好好的。',
    causeEn: 'Rock stops scissors. The dozer nudges the cutting attachment open; a friend helps straighten it, and everyone is okay.',
  },
  'scissors-beats-paper': {
    zh: '剪刀贏布！', en: 'Scissors beat paper!',
    causeZh: '剪刀把布剪成兩條柔軟飄帶。朋友換上新布，吊車開心地揮手。',
    causeEn: 'Scissors cut paper into two soft ribbons. A friend replaces the cloth, and the crane waves happily.',
  },
  'paper-beats-rock': {
    zh: '布贏石頭！', en: 'Paper beats rock!',
    causeZh: '布輕輕蓋住石頭。吊車掀開柔軟大布，推土機露出笑容，大家都好好的。',
    causeEn: 'Paper gently covers rock. The crane lifts the soft cloth, and the dozer smiles; everyone is okay.',
  },
} as const satisfies Record<MasteryRuleId, { zh: string; en: string; causeZh: string; causeEn: string }>;
