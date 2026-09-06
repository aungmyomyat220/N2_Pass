import { accountState, updateAccount } from "./study-storage";
const STORAGE_KEY = "n2-kanji-starred-v1";

export const STARRED_CHANGE_EVENT = "n2-kanji-starred-change";

export function loadStarred(): string[] {
  if (typeof window === "undefined") return [];

  if (accountState()) return accountState()!.starred;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    return [
      ...new Set(
        value.filter((item): item is string => typeof item === "string"),
      ),
    ];
  } catch {
    return [];
  }
}

export function saveStarred(starred: string[]): void {
  if (typeof window === "undefined") return;

  const unique = [...new Set(starred)];
  if (!updateAccount({ starred: unique })) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  window.dispatchEvent(
    new CustomEvent<string[]>(STARRED_CHANGE_EVENT, { detail: unique }),
  );
}

export function toggleStarred(starred: string[], kanji: string): string[] {
  if (starred.includes(kanji)) {
    return starred.filter((item) => item !== kanji);
  }

  return [...starred, kanji];
}

// Keep existing kanji keys intact; grammar uses its stable content ID.
export const grammarStarKey = (id: string) => `grammar:${id}`;
