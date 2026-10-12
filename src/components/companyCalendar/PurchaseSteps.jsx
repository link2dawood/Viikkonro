export default function PurchaseSteps({ year }) {
  return <section className="cc-purchase-steps" aria-labelledby="purchase-steps-title">
    <h2 id="purchase-steps-title">Näin ostat yrityskalenterin</h2>
    <ol>
      <li><strong>Tee maksuton esikatselu.</strong> Valitse vuosi {year}, lisää yrityksesi tiedot ja tarkista kalenteri.</li>
      <li><strong>Maksa turvallisesti Polarissa.</strong> Tarkista hinta ja laskutustiedot ennen maksua. Osto on kertamaksu valitulle vuodelle, ei jatkuva tilaus.</li>
      <li><strong>Palaa lataamaan tiedostot.</strong> Maksun vahvistamisen jälkeen voit ladata PDF-, Excel-, CSV- ja ICS-tiedostot ilman esikatselun vesileimaa. Jos vahvistus viipyy, valitse Tarkista maksu.</li>
      <li><strong>Tallenna ostotunnus.</strong> Sillä palautat latausoikeuden toisessa selaimessa. Lasku on saatavilla Polarin ostovahvistuksen kautta.</li>
    </ol>
    <p className="note-soft">Latausoikeus on voimassa vuoden {year} loppuun. Säilytä myös kalenteriluonnos: ostotunnus palauttaa latausoikeuden, ei kalenterin sisältöä.</p>
  </section>;
}
