import { useEffect, useState } from "react";
import { commerce } from "../../platform/business/commerceClient.js";
import { PURCHASE_MARKETING_TEXT } from "../../platform/billing/purchaseRecord.js";
import PurchaseSteps from "./PurchaseSteps.jsx";
export default function Purchase({ year,status,onStatus,onCheckout,busy }) {
  const [catalog,setCatalog] = useState(null), [message,setMessage] = useState(""), [code,setCode] = useState("");
  const [marketingConsent,setMarketingConsent] = useState(false);
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
  const price = catalog?.enabled ? new Intl.NumberFormat("fi-FI",{ style:"currency",currency:catalog.currency }).format(catalog.amountCents/100) : null;
  return <section id="cc-purchase" aria-label="Yrityskalenterin osto" data-clarity-mask="True">
    <PurchaseSteps year={year} />
    <p className="note-soft">Tutustu ennen ostamista <a href="/kayttoehdot">käyttö- ja ostoehtoihin</a> sekä <a href="/palautusehdot">palautus- ja peruutusehtoihin</a>. <a href="/palautusehdot#peruuttaminen">Ilmoita ostoksen peruuttamisesta</a>.</p>
    {status?.paid ? <>
      <p><strong>Kalenterin {year} lataukset on avattu.</strong> Voimassa vuoden {year} loppuun.</p>
      <p>Tallenna ostotunnus turvalliseen paikkaan. Sillä palautat latausoikeuden toisessa selaimessa. Älä jaa tunnusta.</p>
      <button type="button" className="btn" onClick={() => {
        const url = URL.createObjectURL(new Blob([status.restoreCode],{ type:"text/plain;charset=utf-8" }));
        const a = document.createElement("a"); a.href=url;a.download=`viikkonro-ostotunnus-${year}.txt`;a.click();setTimeout(() => URL.revokeObjectURL(url),1000);
      }}>Tallenna ostotunnus</button>
    </> : <>
      {catalog?.enabled === false && <p>Maksaminen ei ole vielä käytössä. Voit tehdä esikatselun ja säilyttää luonnoksen.</p>}
      {price && <>
        <p><strong>{price} / valittu kalenterivuosi {year}.</strong> Kertamaksu, ei tilausta. Lataukset ovat käytettävissä vuoden {year} loppuun. Polar näyttää verot ja lopullisen hinnan ennen maksua.</p>
        <label className="cc-check"><input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} /> {PURCHASE_MARKETING_TEXT}</label>
        <p className="note-soft">Valinta on vapaaehtoinen eikä vaikuta ostoon. <a href="/tietosuoja">Tietosuojaseloste</a></p>
        <button type="button" className="btn" disabled={Boolean(busy)} onClick={() => onCheckout({ marketingConsent })}>Osta kalenterin {year} lataukset</button>
      </>}
      <button type="button" className="btn-link" onClick={() => refresh()}>Tarkista maksu</button>
      <details><summary>Palauta aiempi osto</summary>
        <label>Ostotunnus <textarea autoComplete="off" spellCheck="false" maxLength={2048} value={code} onChange={e => setCode(e.target.value)} /></label>
        <button type="button" className="btn" disabled={!code} onClick={() => refresh(true)}>Palauta latausoikeus vuodelle {year}</button>
      </details>
    </>}
    <p aria-live="polite">{message}</p>
    <p className="note-soft">Virallinen lasku on saatavilla myös Polarin asiakasportaalissa ostovahvistuksen kautta.</p>
    <p className="note-soft">Esikatselu ja luonnos säilyvät selaimessasi. Maksullista tiedostoa luotaessa kalenterin tiedot lähetetään suojatulle palvelimelle. Niitä ei tallenneta kalenteritietokantaan eikä lähetetä Polarille tai analytiikkaan. Maksu ja virallinen lasku käsitellään Polarissa. Ostoksen yhteys- ja laskutustiedot tallennetaan suojattuun asiakasrekisteriin. Lasku lähetetään ostajan sähköpostiin ja kopio Viikkonron asiakaspalvelulle. Markkinointiviestejä lähetetään vain erillisellä suostumuksella.</p>
  </section>;
}
