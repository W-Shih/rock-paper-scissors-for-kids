export const progressStorageKey = 'construction-rps:progress';
export const progressStorageWarning = {
  zh: '學習進度及收藏可能無法保留。',
  en: 'Learning progress and collectibles may not be saved.',
} as const;

export const masteryRuleIds = ['rock-beats-scissors', 'scissors-beats-paper', 'paper-beats-rock'] as const;
export type MasteryRuleId = (typeof masteryRuleIds)[number];
export type MasteryCounts = Readonly<Record<MasteryRuleId, number>>;
export type Progress = Readonly<{
  masteryCountsByRuleId: MasteryCounts;
  unlockedCollectibleIds: readonly string[];
}>;
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
type StorageSource = StorageLike | (() => StorageLike);

const emptyCounts: MasteryCounts = {
  'rock-beats-scissors': 0,
  'scissors-beats-paper': 0,
  'paper-beats-rock': 0,
};
const collectibleId = (ruleId: MasteryRuleId) => `collectible-${ruleId}`;
const normalizedCount = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 3) return 0;
  return value;
};
function normalizeCounts(value: unknown): MasteryCounts {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  return Object.fromEntries(masteryRuleIds.map((id) => [id, normalizedCount(source[id])])) as unknown as MasteryCounts;
}
function makeProgress(counts: MasteryCounts): Progress {
  return {
    masteryCountsByRuleId: { ...counts },
    unlockedCollectibleIds: masteryRuleIds.filter((id) => counts[id] >= 3).map(collectibleId),
  };
}

export function createProgressStore(source?: StorageSource) {
  let storage: StorageLike | undefined;
  let canPersist = true;
  let persistent = false;
  let warning: typeof progressStorageWarning | undefined;
  let progress = makeProgress(emptyCounts);

  try {
    storage = source ? (typeof source === 'function' ? source() : source) : window.localStorage;
    const raw = storage.getItem(progressStorageKey);
    if (raw === null) {
      persistent = true;
    } else {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || !('schemaVersion' in parsed)) throw new Error('Invalid progress record');
      const record = parsed as { schemaVersion: unknown; masteryCountsByRuleId?: unknown };
      if (typeof record.schemaVersion === 'number' && record.schemaVersion > 1) {
        canPersist = false;
        warning = progressStorageWarning;
      } else if (record.schemaVersion !== 1) {
        throw new Error('Unsupported progress record');
      } else {
        const counts = normalizeCounts(record.masteryCountsByRuleId);
        const derivedProgress = makeProgress(counts);
        const rawCounts = typeof record.masteryCountsByRuleId === 'object' && record.masteryCountsByRuleId !== null
          ? record.masteryCountsByRuleId as Record<string, unknown> : {};
        const countsChanged = masteryRuleIds.some((id) => rawCounts[id] !== counts[id]);
        const rawUnlocks = (parsed as { unlockedCollectibleIds?: unknown }).unlockedCollectibleIds;
        const unlocksChanged = JSON.stringify(rawUnlocks) !== JSON.stringify(derivedProgress.unlockedCollectibleIds);
        progress = derivedProgress;
        persistent = !countsChanged && !unlocksChanged;
        if (!persistent) warning = progressStorageWarning;
      }
    }
  } catch {
    storage = undefined;
    warning = progressStorageWarning;
  }

  return {
    get progress(): Progress { return makeProgress(progress.masteryCountsByRuleId); },
    get persistent(): boolean { return persistent; },
    get canPersist(): boolean { return canPersist && storage !== undefined; },
    get warning(): typeof progressStorageWarning | undefined { return warning; },
    save(counts: MasteryCounts): boolean {
      const incoming = normalizeCounts(counts);
      const next = normalizeCounts(Object.fromEntries(masteryRuleIds.map((id) => [
        id, Math.max(progress.masteryCountsByRuleId[id], incoming[id]),
      ])));
      progress = makeProgress(next);
      if (!canPersist || !storage) {
        persistent = false;
        warning = progressStorageWarning;
        return false;
      }
      try {
        storage.setItem(progressStorageKey, JSON.stringify({
          schemaVersion: 1,
          masteryCountsByRuleId: next,
          unlockedCollectibleIds: progress.unlockedCollectibleIds,
        }));
        persistent = true;
        warning = undefined;
        return true;
      } catch {
        persistent = false;
        warning = progressStorageWarning;
        return false;
      }
    },
  };
}
