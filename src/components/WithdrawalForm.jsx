import { useState } from "react";
import Button from "./Button.jsx";
import { LEGAL_OPERATOR } from "../data/legalPolicies.js";
import "./planning/plannerControls.css";
import "./legal.css";

export default function WithdrawalForm() {
  const [fields,setFields]=useState({name:"",email:"",orderId:""});
  const [review,setReview]=useState(false),[busy,setBusy]=useState(false),[receipt,setReceipt]=useState(null),[error,setError]=useState("");
  const update=event=>{setFields({...fields,[event.target.name]:event.target.value});setError("");};
  async function send(event) {
    event.preventDefault();if(busy)return;
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/billing/withdrawal",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:fields.name.trim(),email:fields.email.trim(),orderId:fields.orderId.trim(),confirmed:true})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error === "order_not_verified"
        ? "Tilausta ja sähköpostiosoitetta ei voitu varmistaa. Tarkista Polarin tilaustunniste ja ostossa käytetty sähköposti. Voit myös lähettää ilmoituksen sähköpostitse."
        : "Ilmoitusta ei voitu vahvistaa. Yritä uudelleen tai lähetä ilmoitus sähköpostitse asiakaspalveluun.");
      if(typeof result.id !== "string" || typeof result.receivedAt !== "string") throw new Error("Vahvistus puuttuu. Ota yhteyttä asiakaspalveluun.");
      setReceipt(result);setReview(false);
    } catch(reason) {setError(reason.message || "Lähetys epäonnistui. Ota yhteyttä asiakaspalveluun.");}
    finally {setBusy(false);}
  }
  return <section id="peruuttaminen" className="planning-editor withdrawal-form noprint" data-clarity-mask="True" aria-label="Peruuta sopimus">
    <h2>Peruuta sopimus</h2>
    <p>Tällä toiminnolla ilmoitat peruuttavasi yrityskalenterin ostoksen. Kirjautumista ei tarvita. Ilmoitus vahvistetaan sähköpostiisi, ja maksun palautus käsitellään erikseen.</p>
    {!receipt && !review && <form onSubmit={event=>{event.preventDefault();setReview(true);setError("");}}>
      <label htmlFor="withdraw-name">Nimi<input id="withdraw-name" name="name" autoComplete="name" required maxLength={160} value={fields.name} onChange={update} /></label>
      <label htmlFor="withdraw-email">Ostossa käytetty sähköpostiosoite<input id="withdraw-email" name="email" type="email" autoComplete="email" required maxLength={254} value={fields.email} onChange={update} /></label>
      <label htmlFor="withdraw-order">Polarin tilaustunniste<input id="withdraw-order" name="orderId" autoComplete="off" required maxLength={36} pattern="[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}" value={fields.orderId} onChange={update} /></label>
      <p>Tilaustunniste löytyy Polarin ostovahvistuksesta tai asiakasportaalista. Älä syötä tähän yksityistä Viikkonron ostotunnusta tai maksukorttitietoja.</p>
      <Button type="submit">Tarkista peruuttamisilmoitus</Button>
    </form>}
    {review && !receipt && <form onSubmit={send}>
      <h3>Tarkista ilmoitus ennen lähettämistä</h3>
      <p>Peruutan Viikkonro Yrityskalenterin ostoksen, jonka Polarin tilaustunniste on <strong>{fields.orderId}</strong>.</p>
      <p>Ilmoittaja: {fields.name}. Vastaanottovahvistus lähetetään osoitteeseen {fields.email}.</p>
      <div className="planner-actions"><Button variant="secondary" disabled={busy} onClick={()=>setReview(false)}>Muokkaa tietoja</Button><Button type="submit" disabled={busy}>{busy ? "Lähetetään..." : "Vahvista peruuttaminen"}</Button></div>
    </form>}
    {error && <p role="alert">{error}</p>}
    {receipt && <div role="status"><p><strong>Peruuttamisilmoitus vastaanotettu.</strong> Vahvistus on lähetetty ostossa käyttämääsi sähköpostiin. Maksua ei ole vielä automaattisesti palautettu.</p><p>Ilmoituksen tunniste: {receipt.id}. Vastaanotettu (UTC): {receipt.receivedAt}.</p></div>}
    <p>Voit tehdä vapaamuotoisen peruuttamisilmoituksen myös osoitteeseen <a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a>. Jos tilaustunniste puuttuu tai lomake ei toimi, kerro sähköpostissa ostoksen ajankohta ja muut tiedot, joilla ostos voidaan tunnistaa.</p>
  </section>;
}
