export const getStoredJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const setStoredJson = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
};

export const getStoredMapItem = <T>(storageKey: string, mapKey: string): T | null => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, T>;
    return map[mapKey] ?? null;
  } catch {
    return null;
  }
};

export const setStoredMapItem = <T>(storageKey: string, mapKey: string, value: T) => {
  try {
    const raw = localStorage.getItem(storageKey);
    const map = raw ? (JSON.parse(raw) as Record<string, T>) : {};
    localStorage.setItem(storageKey, JSON.stringify({ ...map, [mapKey]: value }));
  } catch {
    // ignore storage errors
  }
};
