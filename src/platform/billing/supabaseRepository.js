import { fail } from "./catalog.js";

/** Server secret only. No memory persistence/limiter fallback in production. */
export function createSupabaseBillingRepository({ url, secret, fetchImpl = fetch }) {
  if (typeof window !== "undefined") fail("server_only");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co") || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) fail("invalid_backend");
  if (!secret || secret.startsWith("sb_publishable_")) fail("server_secret_required");
  if (!secret.startsWith("sb_secret_")) {
    try { if (JSON.parse(atob(secret.split(".")[1])).role !== "service_role") fail("server_secret_required"); }
    catch { fail("server_secret_required"); }
  }
  const rpc = async (name, body) => {
    const response = await fetchImpl(`${parsed.origin}/rest/v1/rpc/${name}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: secret, Authorization: `Bearer ${secret}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000), cache: "no-store", redirect: "error" });
    if (!response.ok) fail("billing_unavailable");
    return response.json();
  };
  return {
    catalog: () => rpc("billing_catalog_get", {}),
    authorize: (account, actor, permission) => rpc("billing_authorize", { p_account: account, p_actor: actor, p_permission: permission }),
    load: account => rpc("billing_state_get", { p_account: account }),
    commit: (account, revision, state, eventKey) => rpc("billing_state_commit", { p_account: account, p_revision: revision, p_state: state, p_event: eventKey }),
    consume: (account, revision, product, key, limits, amount, expires) => rpc("billing_usage_consume", { p_account: account, p_revision: revision, p_product: product, p_key: key, p_limits: limits, p_amount: amount, p_expires: expires }),
  };
}
