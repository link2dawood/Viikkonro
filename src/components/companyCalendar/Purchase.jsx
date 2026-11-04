import { useEffect, useState } from "react";
import { commerce } from "../../platform/business/commerceClient.js";
import { PURCHASE_MARKETING_TEXT, validEmail } from "../../platform/billing/purchaseRecord.js";
import PurchaseSteps from "./PurchaseSteps.jsx";

export default function Purchase({ year, status, onStatus, onCheckout, onSendEmail, busy, defaultCompanyName = "" }) {
  const [catalog, setCatalog] = useState(null);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [email, setEmail] = useState(() => {
    try {
      return typeof window !== "undefined" ? (localStorage.getItem("viikkonro_buyer_email") || "") : "";
    } catch {
      return "";
    }
  });
  const [companyName, setCompanyName] = useState(defaultCompanyName || "");
  const [emailError, setEmailError] = useState("");

  const [sendEmail, setSendEmail] = useState(() => {
    try {
      return typeof window !== "undefined" ? (localStorage.getItem("viikkonro_buyer_email") || "") : "";
    } catch {
      return "";
    }
  });
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  useEffect(() => {
    setCompanyName(prev => (!prev && defaultCompanyName ? defaultCompanyName : prev));
  }, [defaultCompanyName]);

  useEffect(() => {
    let alive = true;
    onStatus(null);
    setMessage("");
    commerce("catalog").then(pricing => { if (alive) setCatalog(pricing); })
      .catch(() => { if (alive) setMessage("Maksupalvelu ei ole tällä hetkellä käytettävissä. Esikatselu toimii normaalisti."); });
    commerce("status",{ year }).then(result => { if (alive) onStatus(result); })
      .catch(() => { if (alive) setMessage("Aiemman ostoksen tarkistus epäonnistui. Yritä Tarkista maksu -painiketta uudelleen."); });
    return () => { alive = false; };
  },[year,onStatus]);

  async function refresh(restore = false) {
    setMessage("");
    try {
      const result = await commerce(restore ? "restore" : "status",{ year,...(restore ? { code } : {}) });
      onStatus(result);
      setMessage(result.paid ? "Osto on vahvistettu. Voit ladata tiedostot." : "Maksua ei vielä vahvistettu. Odota hetki ja tarkista uudelleen.");
      if (restore) setCode("");
    } catch (e) { setMessage(e.message); }
  }

  function handleCheckoutClick() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !validEmail(trimmedEmail)) {
      setEmailError("Syötä kelvollinen sähköpostiosoite laskua ja toimitusta varten.");
      return;
    }
    setEmailError("");
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("viikkonro_buyer_email", trimmedEmail);
        if (companyName.trim()) localStorage.setItem("viikkonro_buyer_company", companyName.trim());
      }
    } catch {
      /* ignore storage errors */
    }
    onCheckout({
      marketingConsent,
      email: trimmedEmail.toLowerCase(),
      companyName: companyName.trim(),
    });
  }

  async function handleSendEmailDelivery() {
    const trimmed = sendEmail.trim();
    if (!trimmed || !validEmail(trimmed)) {
      setDeliveryMessage("Syötä kelvollinen sähköpostiosoite.");
      setDeliverySuccess(false);
      return;
    }
    setDeliveryBusy(true);
    setDeliveryMessage("");
    setDeliverySuccess(false);
    try {
      if (onSendEmail) {
        await onSendEmail({ email: trimmed.toLowerCase() });
        setDeliverySuccess(true);
        setDeliveryMessage(`Kalenteritiedostot on lähetetty osoitteeseen ${trimmed}!`);
      }
    } catch (err) {
      setDeliverySuccess(false);
      setDeliveryMessage(err.message || "Lähetys epäonnistui. Yritä hetken kuluttua uudelleen.");
    } finally {
      setDeliveryBusy(false);
    }
  }

  const price = catalog?.enabled ? new Intl.NumberFormat("fi-FI",{ style:"currency",currency:catalog.currency }).format(catalog.amountCents/100) : null;
  return <section id="cc-purchase" className="cc-purchase" aria-label="Yrityskalenterin osto" data-clarity-mask="True">
    <PurchaseSteps year={year} />
    <p className="note-soft">Tutustu ennen ostamista <a href="/kayttoehdot">käyttö- ja ostoehtoihin</a> sekä <a href="/palautusehdot">palautus- ja peruutusehtoihin</a>. <a href="/palautusehdot#peruuttaminen">Ilmoita ostoksen peruuttamisesta</a>.</p>
    {status?.paid ? <>
      <p><strong>Kalenterin {year} lataukset on avattu.</strong> Voimassa vuoden {year} loppuun.</p>
      <p>Tallenna ostotunnus turvalliseen paikkaan. Sillä palautat latausoikeuden toisessa selaimessa. Älä jaa tunnusta.</p>
      <button type="button" className="btn" onClick={() => {
        const url = URL.createObjectURL(new Blob([status.restoreCode],{ type:"text/plain;charset=utf-8" }));
        const a = document.createElement("a"); a.href=url;a.download=`viikkonro-ostotunnus-${year}.txt`;a.click();setTimeout(() => URL.revokeObjectURL(url),1000);
      }}>Tallenna ostotunnus</button>

      <div className="cc-email-delivery">
        <h3>Lähetä kalenteritiedosto sähköpostiin</h3>
        <p className="note-soft">Voit lähettää valmiin kalenterisi (.ics-kalenteritiedosto ja PDF) suoraan omaan tai kollegan sähköpostiin.</p>
        <div className="cc-purchase-fields">
          <label htmlFor="cc-deliver-email">Vastaanottajan sähköpostiosoite</label>
          <input
            id="cc-deliver-email"
            type="email"
            autoComplete="email"
            placeholder="etunimi@yritys.fi"
            value={sendEmail}
            onChange={e => { setSendEmail(e.target.value); setDeliveryMessage(""); }}
            disabled={deliveryBusy}
          />
        </div>
        <button
          type="button"
          className="btn"
          disabled={deliveryBusy || !sendEmail}
          onClick={handleSendEmailDelivery}
        >
          {deliveryBusy ? "Lähetetään..." : "Lähetä kalenteri sähköpostiin"}
        </button>
        {deliveryMessage && (
          <p className={`cc-delivery-status ${deliverySuccess ? "cc-delivery-status--success" : "cc-delivery-status--error"}`} aria-live="polite">
            {deliveryMessage}
          </p>
        )}
      </div>
    </> : <>
      {catalog?.enabled === false && <p>Maksaminen ei ole vielä käytössä. Voit tehdä esikatselun ja säilyttää luonnoksen.</p>}
      {price && <>
        <p><strong>{price} / valittu kalenterivuosi {year}.</strong> Kertamaksu, ei tilausta. Lataukset ovat käytettävissä vuoden {year} loppuun. Polar näyttää verot ja lopullisen hinnan ennen maksua.</p>

        <div className="cc-purchase-fields">
          <label htmlFor="cc-buyer-email">Sähköpostiosoite <span>(laskua ja kalenteritiedostoa varten)</span></label>
          <input
            id="cc-buyer-email"
            type="email"
            required
            autoComplete="email"
            placeholder="etunimi@yritys.fi"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (!sendEmail) setSendEmail(e.target.value);
              setEmailError("");
            }}
          />
          <label htmlFor="cc-buyer-company">Yrityksen nimi / Laskutusnimi <span>(valinnainen)</span></label>
          <input
            id="cc-buyer-company"
            type="text"
            autoComplete="organization"
            maxLength={100}
            placeholder="esim. Yritys Oy"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
          />
          {emailError && <p className="cc-field-error" role="alert">{emailError}</p>}
        </div>

        <label className="cc-check"><input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} /> {PURCHASE_MARKETING_TEXT}</label>
        <p className="note-soft">Valinta on vapaaehtoinen eikä vaikuta ostoon. <a href="/tietosuoja">Tietosuojaseloste</a></p>
        <button type="button" className="btn" disabled={Boolean(busy)} onClick={handleCheckoutClick}>Osta kalenterin {year} lataukset</button>
      </>}
      <button type="button" className="btn-link" onClick={() => refresh()}>Tarkista maksu</button>
      <details className="cc-restore"><summary>Palauta aiempi osto</summary>
        <label htmlFor="cc-restore-code">Ostotunnus</label>
        <textarea id="cc-restore-code" autoComplete="off" spellCheck="false" maxLength={2048} value={code} onChange={e => setCode(e.target.value)} />
        <div className="planner-actions"><button type="button" className="btn" disabled={!code} onClick={() => refresh(true)}>Palauta latausoikeus vuodelle {year}</button></div>
      </details>
    </>}
    <p aria-live="polite">{message}</p>
    <p className="note-soft">Virallinen lasku on saatavilla myös Polarin asiakasportaalissa ostovahvistuksen kautta.</p>
    <p className="note-soft">Esikatselu ja luonnos säilyvät selaimessasi. Maksullista tiedostoa luotaessa kalenterin tiedot lähetetään suojatulle palvelimelle. Niitä ei tallenneta kalenteritietokantaan eikä lähetetä Polarille tai analytiikkaan. Maksu ja virallinen lasku käsitellään Polarissa. Ostoksen yhteys- ja laskutustiedot tallennetaan suojattuun asiakasrekisteriin. Lasku lähetetään ostajan sähköpostiin ja kopio Viikkonron asiakaspalvelulle. Markkinointiviestejä lähetetään vain erillisellä suostumuksella.</p>
  </section>;
}
