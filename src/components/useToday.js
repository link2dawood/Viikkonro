import { useMemo, useSyncExternalStore } from "react";
import { dateFromDayKey, helsinkiDayKey } from "./dateUtils.js";

// Today's date (Europe/Helsinki) for render bodies — use this instead of
// `new Date()` anywhere the value ends up in markup.
//
// Why a store: every page is prerendered once per build, then hydrated in the
// visitor's browser, possibly on a later day. Reading `new Date()` during
// render made the browser's first render disagree with the prerendered HTML
// (React error #418) and showed a stale week until the next rebuild.
// useSyncExternalStore renders the *prerendered* day during hydration
// (getServerSnapshot), then immediately re-renders with the live day
// (getSnapshot) — no mismatch, no stale text, and an open tab rolls over at
// midnight. Client-side navigations skip hydration and get the live day
// directly.
//
// The prerendered day travels in <meta name="viikkonro-render-day">, which
// prerender.js writes into every page from the same value it renders with
// (globalThis.__VIIKKONRO_RENDER_DAY__).
export const RENDER_DAY_META = "viikkonro-render-day";

function subscribe(onChange) {
  const id = setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const getSnapshot = () => helsinkiDayKey();

function getServerSnapshot() {
  if (typeof document === "undefined") {
    return globalThis.__VIIKKONRO_RENDER_DAY__ ?? helsinkiDayKey();
  }
  return document.querySelector(`meta[name="${RENDER_DAY_META}"]`)?.content || helsinkiDayKey();
}

export function useTodayKey() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useToday() {
  const key = useTodayKey();
  return useMemo(() => dateFromDayKey(key), [key]);
}
