export async function commerce(action,body) {
  const response = await fetch(`/api/billing/${action}`,{ method:body ? "POST" : "GET",credentials:"same-origin",cache:"no-store",...(body ? { headers:{ "Content-Type":"application/json" },body:JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error("Maksun tarkistus ei onnistunut. Yritä hetken kuluttua uudelleen.");
  return response.json();
}
