import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, importGuest, validState } from './study-state';
const card = { box: 1, due: 123, seen: 2, correct: 1 };
test('validates persisted state and rejects invalid review data', () => {
  assert.ok(validState(emptyState()));
  assert.ok(validState({ progress: { 日: card }, starred: ['日'] }));
  for (const progress of [[], { 日: { ...card, box: 5 } }, { 日: { ...card, seen: -1 } }, { 日: { ...card, correct: 3 } }, { 日: { ...card, due: Infinity } }]) {
    assert.equal(validState({ progress, starred: [] }), false);
  }
  assert.equal(validState({ progress: {}, starred: [42] }), false);
  assert.equal(validState(null), false);
});
test('guest import preserves cloud progress and combines unique stars', () => {
  const cloud = { progress: { 日: card }, starred: ['日'] };
  const guest = { progress: { 日: { ...card, box: 0 }, 月: card }, starred: ['日', '月'] };
  assert.deepEqual(importGuest(cloud, guest), { progress: { 日: card, 月: card }, starred: ['日', '月'] });
  assert.deepEqual(cloud.starred, ['日']);
});

test('account progress and stars stay separate from guests and other accounts', async () => {
  const { activateAccount } = await import('./study-storage');
  const { loadProgress, saveProgress, resetProgress } = await import('./srs');
  const { loadStarred, saveStarred } = await import('./starred');
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const mockWindow = Object.assign(new EventTarget(), { localStorage: storage });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: mockWindow });
  try {
    activateAccount(null);
    saveProgress({ 日: card }); saveStarred(['日']);
    activateAccount('alice', emptyState());
    assert.deepEqual(loadProgress(), {}); assert.deepEqual(loadStarred(), []);
    saveProgress({ 月: card }); saveStarred(['月']);
    assert.deepEqual(loadProgress(), { 月: card });
    resetProgress();
    assert.deepEqual(loadProgress(), {}); assert.deepEqual(loadStarred(), ['月']);
    activateAccount('bob', emptyState());
    assert.deepEqual(loadProgress(), {}); assert.deepEqual(loadStarred(), []);
    activateAccount(null);
    assert.deepEqual(loadProgress(), { 日: card }); assert.deepEqual(loadStarred(), ['日']);
  } finally { activateAccount(null); Reflect.deleteProperty(globalThis, 'window'); }
});
