// Client-only persistence for per-user UI preferences.
// Single-tenant install — we keep it in localStorage to avoid a DB migration.

export type AccountPrefs = {
  displayName: string;
  timezone: string;
  language: string;
  defaultFormat: string;
  autoPromoteFirstVersion: boolean;
  autoDetectBrandOnUrl: boolean;
  notifyGenerationDone: boolean;
  notifyBrandDetect: boolean;
  notifyDailyCost: boolean;
  notifyEmail: boolean;
  defaultModel: string;
  imageModel: string;
  streamHtml: boolean;
};

export const PREFS_KEY = 'bw-account-prefs';

export function defaultPrefs(seed: Partial<AccountPrefs>): AccountPrefs {
  return {
    displayName: seed.displayName ?? '',
    timezone: seed.timezone ?? '',
    language: 'English',
    defaultFormat: 'square_1080',
    autoPromoteFirstVersion: false,
    autoDetectBrandOnUrl: true,
    notifyGenerationDone: true,
    notifyBrandDetect: true,
    notifyDailyCost: false,
    notifyEmail: false,
    defaultModel: 'gemini-3-pro',
    imageModel: 'nano-banana-pro',
    streamHtml: true,
  };
}

export function readPrefs(seed: Partial<AccountPrefs>): AccountPrefs {
  if (typeof window === 'undefined') return defaultPrefs(seed);
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs(seed);
    const parsed = JSON.parse(raw) as Partial<AccountPrefs>;
    return { ...defaultPrefs(seed), ...parsed };
  } catch {
    return defaultPrefs(seed);
  }
}

export function writePrefs(prefs: AccountPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
