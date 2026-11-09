import { describe, expect, it, vi } from 'vitest';
import { createProgressStore, progressStorageWarning, type StorageLike } from './progress-store';

function memoryStorage(initial?: string): StorageLike {
  let value = initial ?? null;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

describe('versioned progress store', () => {
  it('loads persisted counts and derives collectible IDs, then reloads them', () => {
    const storage = memoryStorage();
    const first = createProgressStore(storage);
    first.save({ 'rock-beats-scissors': 3, 'scissors-beats-paper': 1, 'paper-beats-rock': 0 });
    const reloaded = createProgressStore(storage);
    expect(reloaded.progress).toEqual({
      masteryCountsByRuleId: { 'rock-beats-scissors': 3, 'scissors-beats-paper': 1, 'paper-beats-rock': 0 },
      unlockedCollectibleIds: ['collectible-rock-beats-scissors'],
    });
    expect(reloaded.persistent).toBe(true);
  });

  it('normalizes invalid counts and never trusts saved unlock IDs', () => {
    const storage = memoryStorage(JSON.stringify({ schemaVersion: 1, masteryCountsByRuleId: {
      'rock-beats-scissors': 9, 'scissors-beats-paper': -1, 'paper-beats-rock': 2.5,
    }, unlockedCollectibleIds: ['collectible-paper-beats-rock'] }));
    expect(createProgressStore(storage).progress).toEqual({
      masteryCountsByRuleId: { 'rock-beats-scissors': 0, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 },
      unlockedCollectibleIds: [],
    });
  });

  it('keeps valid sibling counts while warning when persisted data needs normalization', () => {
    const store = createProgressStore(memoryStorage(JSON.stringify({ schemaVersion: 1,
      masteryCountsByRuleId: { 'rock-beats-scissors': 2, 'scissors-beats-paper': 8 },
      unlockedCollectibleIds: [],
    })));
    expect(store.progress.masteryCountsByRuleId).toEqual({
      'rock-beats-scissors': 2, 'scissors-beats-paper': 0, 'paper-beats-rock': 0,
    });
    expect(store.persistent).toBe(false);
    expect(store.warning).toBe(progressStorageWarning);
  });

  it('recovers corrupt data with safe defaults and a warning', () => {
    const store = createProgressStore(memoryStorage('{bad json'));
    expect(store.progress.unlockedCollectibleIds).toEqual([]);
    expect(store.persistent).toBe(false);
    expect(store.warning).toBe(progressStorageWarning);
  });

  it('uses memory when storage is unavailable or writes fail, and reports failure', () => {
    const unavailable = createProgressStore(() => { throw new Error('blocked'); });
    expect(unavailable.persistent).toBe(false);
    unavailable.save({ 'rock-beats-scissors': 1, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 });
    expect(unavailable.progress.masteryCountsByRuleId['rock-beats-scissors']).toBe(1);

    const throwing: StorageLike = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    const failedWrite = createProgressStore(throwing);
    expect(failedWrite.save({ 'rock-beats-scissors': 1, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 })).toBe(false);
    expect(failedWrite.persistent).toBe(false);
    expect(failedWrite.progress.masteryCountsByRuleId['rock-beats-scissors']).toBe(1);
  });

  it('protects unknown newer schemas from overwrite', () => {
    const storage = memoryStorage(JSON.stringify({ schemaVersion: 2, future: true }));
    const setItem = vi.spyOn(storage, 'setItem');
    const store = createProgressStore(storage);
    expect(store.canPersist).toBe(false);
    expect(store.warning).toBe(progressStorageWarning);
    expect(store.save({ 'rock-beats-scissors': 2, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 })).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
    expect(storage.getItem('construction-rps:progress')).toContain('"schemaVersion":2');
  });

  it('performs one atomic write per save and tolerates idempotent retries', () => {
    const storage = memoryStorage();
    const setItem = vi.spyOn(storage, 'setItem');
    const store = createProgressStore(storage);
    const counts = { 'rock-beats-scissors': 3, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 } as const;
    expect(store.save(counts)).toBe(true);
    expect(store.save(counts)).toBe(true);
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(JSON.parse(setItem.mock.calls[0][1])).toMatchObject({ schemaVersion: 1, masteryCountsByRuleId: counts });
    expect(JSON.parse(setItem.mock.calls[0][1]).unlockedCollectibleIds).toEqual(['collectible-rock-beats-scissors']);
    store.save({ 'rock-beats-scissors': 1, 'scissors-beats-paper': 0, 'paper-beats-rock': 0 });
    expect(store.progress.masteryCountsByRuleId['rock-beats-scissors']).toBe(3);
  });
});
