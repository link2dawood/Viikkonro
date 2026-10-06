import { Link } from "react-router-dom";
import { useToday } from "./useToday";
import { PARITY_PATH, currentWeekParity } from "../data/weekParity.js";

export default function WeekParity() {
  const fact = currentWeekParity(useToday());
  return (
    <section className="prose" id="parillinen-vai-pariton-viikko">
      <h2>Onko nyt parillinen vai pariton viikko?</h2>
      <p>
        Nyt on <strong>{fact.parity} viikko</strong>: {" "}
        <Link to={`/viikko-${fact.week}-${fact.year}`}>viikko {fact.week}/{fact.year}</Link>.
        {" "}Ensi viikko on {fact.nextParity},{" "}
        <Link to={`/viikko-${fact.nextWeek}-${fact.nextYear}`}>viikko {fact.nextWeek}/{fact.nextYear}</Link>.
      </p>
      <p>
        Parilliset viikot ovat jaollisia kahdella. Parittomat viikot eivät ole.
        Viikon 53 jälkeen tulee viikko 1: molemmat ovat parittomia.
        Tarkista siksi vuodenvaihteen aikataulu viikkonumerosta.
      </p>
      <p>
        Parillisuutta käytetään esimerkiksi vuoroviikoissa, työvuoroissa,
        harrastusryhmissä ja muissa joka toinen viikko toistuvissa aikatauluissa.
        Tarkista ensin viikkonumero, sillä vuoden 53. ja seuraavan vuoden 1.
        viikko ovat peräkkäiset parittomat viikot.
      </p>
      <p>
        <Link to={PARITY_PATH}>Avaa parillisten ja parittomien viikkojen opas</Link>.{" "}
        <Link to={`/vuosi-${fact.year}#parilliset-ja-parittomat-viikot`}>
          Parilliset ja parittomat viikot {fact.year}
        </Link>. Voit tarkistaa muun päivämäärän viikkonumeron alla olevasta hausta.
      </p>
    </section>
  );
}
