export function createPurchaseStore(env, { fetchImpl = fetch } = {}) {
  const rpc = async (name, body) => {
    const url = new URL(env.BILLING_SUPABASE_URL ?? "https://invalid.invalid");
    if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || url.pathname !== "/" || !env.BILLING_SUPABASE_SECRET) throw new Error("purchase_store_unavailable");
    const result = await fetchImpl(new URL(`/rest/v1/rpc/${name}`, url), {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: { apikey: env.BILLING_SUPABASE_SECRET, Authorization: `Bearer ${env.BILLING_SUPABASE_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!result.ok) throw new Error("purchase_store_unavailable");
    return result.json();
  };
  return {
    record: record => rpc("commerce_record_purchase", { p_record: record }),
    claim: orderId => rpc("commerce_invoice_claim", { p_order_id: orderId }),
    complete: (orderId, token, messageId) => rpc("commerce_invoice_complete", { p_order_id: orderId, p_token: token, p_message_id: messageId }),
    release: (orderId, token) => rpc("commerce_invoice_release", { p_order_id: orderId, p_token: token }),
  };
}
