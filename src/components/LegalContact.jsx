import { Link } from "react-router-dom";
import { LEGAL_OPERATOR, LEGAL_UPDATED, REFUND_PATH } from "../data/legalPolicies.js";

export function LegalOperator() {
  return <div className="prose">
    <p><strong>Palvelun ylläpitäjä: {LEGAL_OPERATOR.legalName}</strong>. Viikkonro on palvelun nimi{!LEGAL_OPERATOR.registered && "; se ei ole rekisteröity yritys"}.</p>
    <p>Ylläpitäjän verkkosivusto: <a href={LEGAL_OPERATOR.website} rel="external noopener">dawoodzafar.us</a>. WhatsApp: <a href={`https://wa.me/${LEGAL_OPERATOR.whatsapp.replace("+","")}`} rel="external noopener">{LEGAL_OPERATOR.whatsapp}</a>.</p>
    <p>Viikkonron asiakaspalvelu ja tietosuojapyynnöt: <a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a>. Voit käyttää myös <Link to="/ota-yhteytta">yhteydenottolomaketta</Link>.</p>
  </div>;
}
export function LegalNavigation() {
  return <nav className="legal-navigation" aria-label="Palvelun ehdot ja tietosuoja"><Link to="/tietoa-meista">Tietoa Viikkonrosta</Link>{" · "}<Link to="/tietosuoja">Tietosuojaseloste</Link>{" · "}<Link to="/kayttoehdot">Käyttö- ja ostoehdot</Link>{" · "}<Link to={REFUND_PATH}>Palautus- ja peruutusehdot</Link></nav>;
}
export const LegalUpdated = () => <p className="note-soft">Päivitetty {LEGAL_UPDATED.split("-").reverse().join(".")}.</p>;
