import { Link } from "react-router-dom";
import { trackPlatformEvent } from "../../analytics";
import { COMPANY_ICS_IMPORTS } from "../../data/companyIcs";

export default function IcsInstructions() {
  return <section className="prose">
    <h2>ICS-tiedoston tuonti kalenterisovellukseen</h2>
    <p>Luo erillinen yrityskalenteri ennen tuontia. Tiedosto sisältää yrityksen omat tiedot: jaa se vain tarkoitetuille vastaanottajille. Kun tuot sen Googleen, Microsoftiin tai iCloudiin, tiedot tallentuvat valitsemaasi kalenteripalveluun sen käyttöoikeuksien mukaan.</p>
    {COMPANY_ICS_IMPORTS.map((group) => <section key={group.app}>
      <h3>{group.app}</h3><ol>{group.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <a href={group.url} target="_blank" rel="noopener noreferrer">{group.app}: palvelun oma tuontiohje</a>
    </section>)}
    <h2>Tiedoston tuonti vai kalenterin tilaus?</h2>
    <p>Tiedoston tuonti on kertaluonteinen. Yrityksen omille päiville ei julkaista tilausosoitetta, eikä ladattua tiedostoa päivitetä automaattisesti. Yleiset viikkonumerot, Suomen pyhäpäivät ja liputuspäivät voit tilata erillisinä julkisina syötteinä.</p>
    <p><Link to="/kalenteritilaus" onClick={() => trackPlatformEvent("company_ics_subscription_help", { source: "public-feeds" })}>Tilaa yleiset kalenterit ja katso sovelluskohtaiset tilausohjeet</Link>. Näihin syötteisiin ei lisätä yrityksen nimeä tai omia merkintöjä.</p>
  </section>;
}
