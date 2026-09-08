import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, importGuest, validState } from './study-state';
const card = { box: 1, due: 123, seen: 2, correct: 1 };
test('validates persisted state and rejects invalid review data', () => {
  assert.ok(validState(emptyState()));
  assert.ok(validState({ progress: { 日: card }, starred: ['日'] }));
  assert.ok(validState({ progress: {}, samePatternProgress: { 月: card }, starred: [] }));
  for (const progress of [[], { 日: { ...card, box: 5 } }, { 日: { ...card, seen: -1 } }, { 日: { ...card, correct: 3 } }, { 日: { ...card, due: Infinity } }]) {
    assert.equal(validState({ progress, starred: [] }), false);
    assert.equal(validState({ progress: {}, samePatternProgress: progress, starred: [] }), false);
  }
  assert.equal(validState({ progress: {}, starred: [42] }), false);
  assert.equal(validState(null), false);
});
test('guest import preserves cloud progress and combines unique stars', () => {
  const cloud = { progress: { 日: card }, samePatternProgress: { 木: card }, starred: ['日'] };
  const guest = { progress: { 日: { ...card, box: 0 }, 月: card }, samePatternProgress: { 木: { ...card, box: 0 }, 水: card }, starred: ['日', '月'] };
  assert.deepEqual(importGuest(cloud, guest), {
    progress: { 日: card, 月: card },
    samePatternProgress: { 木: card, 水: card },
    starred: ['日', '月'],
  });
  assert.deepEqual(cloud.starred, ['日']);
});

test('account progress and stars stay separate from guests and other accounts', async () => {
  const { activateAccount } = await import('./study-storage');
  const { loadCurrentIndex, loadProgress, saveCurrentIndex, saveProgress, resetProgress } = await import('./srs');
  const { loadStarred, saveStarred } = await import('./starred');
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const mockWindow = Object.assign(new EventTarget(), { localStorage: storage });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: mockWindow });
  try {
    activateAccount(null);
    saveProgress({ 日: card }); saveProgress({ 木: card }, 'same-pattern'); saveStarred(['日']); saveCurrentIndex(49); saveCurrentIndex(12, 'same-pattern');
    resetProgress('same-pattern');
    assert.deepEqual(loadProgress(), { 日: card }); assert.deepEqual(loadProgress('same-pattern'), {}); assert.equal(loadCurrentIndex(), 49); assert.equal(loadCurrentIndex('same-pattern'), null);
    saveProgress({ 水: card }, 'same-pattern'); saveCurrentIndex(12, 'same-pattern');
    activateAccount('alice', emptyState());
    assert.deepEqual(loadProgress(), {}); assert.deepEqual(loadProgress('same-pattern'), {}); assert.deepEqual(loadStarred(), []); assert.equal(loadCurrentIndex(), null);
    saveProgress({ 月: card }); saveProgress({ 火: card }, 'same-pattern'); saveStarred(['月', 'grammar:te-bakari-iru']); saveCurrentIndex(8); saveCurrentIndex(5, 'same-pattern');
    assert.deepEqual(loadProgress(), { 月: card }); assert.deepEqual(loadProgress('same-pattern'), { 火: card });
    resetProgress();
    assert.deepEqual(loadProgress(), {}); assert.deepEqual(loadProgress('same-pattern'), { 火: card }); assert.deepEqual(loadStarred(), ['月', 'grammar:te-bakari-iru']); assert.equal(loadCurrentIndex(), null); assert.equal(loadCurrentIndex('same-pattern'), 5);
    resetProgress('same-pattern');
    assert.deepEqual(loadProgress('same-pattern'), {}); assert.deepEqual(loadStarred(), ['月', 'grammar:te-bakari-iru']); assert.equal(loadCurrentIndex('same-pattern'), null);
    activateAccount('bob', emptyState());
    assert.deepEqual(loadProgress(), {}); assert.deepEqual(loadProgress('same-pattern'), {}); assert.deepEqual(loadStarred(), []); assert.equal(loadCurrentIndex(), null);
    activateAccount(null);
    assert.deepEqual(loadProgress(), { 日: card }); assert.deepEqual(loadProgress('same-pattern'), { 水: card }); assert.deepEqual(loadStarred(), ['日']); assert.equal(loadCurrentIndex(), 49); assert.equal(loadCurrentIndex('same-pattern'), 12);
  } finally { activateAccount(null); Reflect.deleteProperty(globalThis, 'window'); }
});


test('grammar stars use stable IDs and sync alongside legacy kanji stars', async () => {
  const { grammarStarKey, toggleStarred } = await import('./starred');
  const { default: grammar } = await import('../data/exam/grammar/lesson/power-drill-n2-grammar-lessons-01-05.json');
  const grammarKeys = grammar.grammar.map(point => grammarStarKey(point.id));
  assert.equal(new Set(grammarKeys).size, grammarKeys.length);
  assert.ok(validState({ progress: {}, starred: ['日', ...grammarKeys] }));
  const mixed = ['日', grammarKeys[0]];
  assert.deepEqual(toggleStarred(mixed, '日'), [grammarKeys[0]]);
  assert.deepEqual(toggleStarred(mixed, grammarKeys[0]), ['日']);
  assert.deepEqual(importGuest({ progress: {}, starred: ['日'] }, { progress: {}, starred: [grammarKeys[0]] }).starred, mixed);
});
