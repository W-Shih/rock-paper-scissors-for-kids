import type { Gesture } from './rps-domain';

export type CharacterKey = Gesture;

// All artwork is authored for this project; the keys are the approved gesture keys.
export const characterArtwork: Readonly<Record<CharacterKey, string>> = {
  rock: '/assets/characters/captain-dozer.svg',
  scissors: '/assets/characters/snip-snip.svg',
  paper: '/assets/characters/cover-crane.svg',
};

export const constructionSceneArtwork = '/assets/scenes/warm-construction-site.svg';
