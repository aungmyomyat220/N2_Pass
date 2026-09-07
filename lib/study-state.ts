import type { ProgressMap } from './srs';

export type StudyState = {
  progress: ProgressMap;
  samePatternProgress?: ProgressMap;
  starred: string[];
};
export const emptyState = (): StudyState => ({ progress: {}, samePatternProgress: {}, starred: [] });

const validProgress = (progress: unknown): progress is ProgressMap => {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return false;
  if (Object.keys(progress).length > 10000) return false;
  const key = (s: unknown) => typeof s === 'string' && s.length > 0 && s.length <= 32;
  return Object.entries(progress).every(([k, p]) =>
    key(k) && p && Number.isInteger(p.box) && p.box >= 0 && p.box <= 4 &&
    Number.isSafeInteger(p.due) && p.due >= 0 && Number.isSafeInteger(p.seen) && p.seen >= 0 &&
    Number.isSafeInteger(p.correct) && p.correct >= 0 && p.correct <= p.seen);
};

export function validState(value: unknown): value is StudyState {
  if (!value || typeof value !== 'object') return false;
  const v = value as StudyState;
  if (!validProgress(v.progress) || (v.samePatternProgress !== undefined && !validProgress(v.samePatternProgress)) || !Array.isArray(v.starred)) return false;
  if (v.starred.length > 10000) return false;
  return v.starred.every(s => typeof s === "string" && s.length > 0 && s.length <= 160);
}
export function importGuest(cloud: StudyState, guest: StudyState): StudyState {
  return {
    progress: { ...guest.progress, ...cloud.progress },
    samePatternProgress: { ...(guest.samePatternProgress ?? {}), ...(cloud.samePatternProgress ?? {}) },
    starred: [...new Set([...cloud.starred, ...guest.starred])],
  };
}
