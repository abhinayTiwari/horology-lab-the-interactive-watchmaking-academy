import type { StateStorage } from 'zustand/middleware';
// Persist preferences only when their serialized value changes, never at frame rate.
let lastSaved: string | null = null;
export const browserStorage: StateStorage = {
 getItem(name) { try { lastSaved = localStorage.getItem(name); return lastSaved; } catch { return null; } },
 setItem(name, value) { if (value === lastSaved) return; try { localStorage.setItem(name,value); lastSaved=value; } catch { /* Restricted storage: the in-memory workshop remains usable. */ } },
 removeItem(name) { lastSaved=null; try { localStorage.removeItem(name); } catch { /* Storage may be disabled by browser policy. */ } },
};
