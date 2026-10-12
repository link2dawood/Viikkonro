import { createClient } from "@supabase/supabase-js";
export function teamBackendConfig(env = import.meta.env) {
  const url = env.VITE_TEAM_SUPABASE_URL?.trim(), key = env.VITE_TEAM_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  const parsed = new URL(url);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== "/" && parsed.pathname !== "")) throw new Error("Invalid Supabase URL.");
  if (parsed.protocol === "https:" && !parsed.hostname.endsWith(".supabase.co")) throw new Error("Use the Supabase project hostname configured in the private CSP.");
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) throw new Error("Invalid Supabase URL.");
  if (!key.startsWith("sb_publishable_")) {
    try { if (JSON.parse(atob(key.split(".")[1])).role !== "anon") throw new Error(); }
    catch { throw new Error("Only a publishable or legacy anon key may be used in the browser."); }
  }
  return { url, key };
}
export function createTeamClient(config = teamBackendConfig()) {
  if (!config) return null;
  return createClient(config.url, config.key, { auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: true }, global: { headers: { "X-Client-Info": "viikkonro-team-leave" }, fetch: (url, init) => fetch(url, { ...init, cache: "no-store", referrerPolicy: "no-referrer" }) } });
}
export function teamError(error) {
  if (error?.code === "40001") return "Kalenteri muuttui toisessa istunnossa. Päivitä tiedot ja yritä uudelleen.";
  if (error?.code === "42501") return "Sinulla ei ole oikeutta tähän organisaatioon tai toimintoon.";
  if (error?.code === "23503") return "Merkintään liittyvä jäsen, osasto tai poissaololaji puuttuu tai on käytössä.";
  return "Pyyntö epäonnistui. Tarkista tiedot, oikeudet ja verkkoyhteys.";
}
export async function teamRpc(client, name, args = {}) {
  const { data, error } = await client.rpc(name, args);
  if (error) { const reason = new Error(teamError(error)); reason.code = error.code; throw reason; }
  return data;
}
