import { emptyState, validState, type StudyState } from './study-state';
export const STUDY_CHANGE = 'n2-study-change';
let account: string | null = null;
let state = emptyState();
export function activateAccount(id: string | null, value = emptyState()) { account = id; state = value; }
export function accountState() { return account ? state : null; }
export function updateAccount(patch: Partial<StudyState>) {
  if (!account) return false;
  state = { ...state, ...patch };
  window.dispatchEvent(new Event(STUDY_CHANGE));
  return true;
}
export function guestState(): StudyState {
  try {
    const value = {
      progress: JSON.parse(localStorage.getItem('n2-kanji-progress-v1') || '{}'),
      samePatternProgress: JSON.parse(localStorage.getItem('n2-kanji-same-pattern-progress-v1') || '{}'),
      starred: JSON.parse(localStorage.getItem('n2-kanji-starred-v1') || '[]'),
    };
    return validState(value) ? value : emptyState();
  } catch { return emptyState(); }
}
export type Pending = { state: StudyState; revision: number };
// A per-tab draft prevents one tab from clearing another tab's unsynced work.
const pendingKey = (id: string) => {
  let tab = sessionStorage.getItem('n2-study-tab');
  if (!tab) { tab = crypto.randomUUID(); sessionStorage.setItem('n2-study-tab', tab); }
  return `n2-account-pending:${id}:${tab}`;
};
export function readPending(id: string): Pending | null {
  try {
    const p = JSON.parse(localStorage.getItem(pendingKey(id)) || 'null');
    return p && validState(p.state) && Number.isSafeInteger(p.revision) && p.revision >= 0 ? p : null;
  } catch { return null; }
}
export function writePending(id: string, value: Pending | null) {
  if (value) localStorage.setItem(pendingKey(id), JSON.stringify(value));
  else localStorage.removeItem(pendingKey(id));
}
