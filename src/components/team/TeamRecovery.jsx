import { useState } from "react";
export default function TeamRecovery({ client }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const recover = async (event, verify) => {
    event.preventDefault(); const form = event.currentTarget, data = Object.fromEntries(new FormData(form)); setBusy(true);
    try {
      if (!verify) {
        const result = await client.auth.resetPasswordForEmail(data.email);
        if (result.error) throw new Error();
        setMessage("Jos osoitteella on tili, saat palautuskoodin sähköpostiin. Tarkista myös roskaposti.");
      } else {
        const result = await client.auth.verifyOtp({ email: data.email, token: data.token, type: "recovery" });
        if (result.error) throw new Error();
        const changed = await client.auth.updateUser({ password: data.password });
        if (changed.error) { await client.auth.signOut({ scope: "local" }); throw new Error(); }
        setMessage("Salasana on päivitetty.");
      }
    } catch { setMessage("Palautus epäonnistui. Tarkista koodi tai pyydä uusi palautuskoodi."); }
    finally { form.reset(); setBusy(false); }
  };
  return <details><summary>Unohditko salasanan?</summary><p>Palautuskoodi lähetetään tilin sähköpostiin. Syötä koodi ja uusi salasana tässä sovelluksessa.</p><form onSubmit={(e) => recover(e, false)}><fieldset disabled={busy}><label>Palautuksen sähköposti<input name="email" type="email" required autoComplete="email" /></label><button>Pyydä palautuskoodi</button></fieldset></form><form onSubmit={(e) => recover(e, true)}><fieldset disabled={busy}><label>Tilin sähköposti<input name="email" type="email" required autoComplete="email" /></label><label>Palautuskoodi<input name="token" pattern="[0-9]{6}|[0-9]{8}" minLength={6} maxLength={8} required autoComplete="one-time-code" inputMode="numeric" /></label><label>Uusi salasana<input name="password" type="password" minLength={12} required autoComplete="new-password" /></label><button>Vaihda salasana</button></fieldset></form><p role="status">{message}</p></details>;
}
