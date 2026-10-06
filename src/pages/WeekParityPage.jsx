import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { useToday } from "../components/useToday";
import { canonicalFor } from "../data/seo";
import {
  PARITY_PATH,
  currentWeekParity,
  parityMeta,
  parityPageFaqs,
  parityWeeks,
} from "../data/weekParity.js";

function WeekLinks({ title, weeks, year, kind }) {
  return (
    <section>
      <h2>{title} {year}</h2>
      <div className="pills">
        {weeks.map((week) => (
          <Link className={`pill week-parity-badge parity-${kind}`} key={week} to={`/viikko-${week}-${year}`}>
            Viikko {week}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function WeekParityPage() {
  const today = useToday();
  const fact = currentWeekParity(today);
  const current = parityWeeks(fact.year);
  const next = parityWeeks(fact.year + 1);
  const faqs = parityPageFaqs(today);

  return (
    <section className="app">
      <SEO {...parityMeta(today)} canonical={canonicalFor(PARITY_PATH)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Parillinen vai pariton viikko
      </div>

      <h1>Parillinen vai pariton viikko?</h1>

      <div className="prose">
        <p className="lead answer-sentence">
          Nyt on <strong>{fact.parity} viikko</strong>: {" "}
          <Link to={`/viikko-${fact.week}-${fact.year}`}>
            viikko {fact.week}/{fact.year}
          </Link>.
          {" "}Ensi viikko on <strong>{fact.nextParity}</strong>: {" "}
          <Link to={`/viikko-${fact.nextWeek}-${fact.nextYear}`}>
            viikko {fact.nextWeek}/{fact.nextYear}
          </Link>.
        </p>

        <div className="panel">
          <div className="now-label">Kuluvan viikon parillisuus</div>
          <p>
            <Link
              className={`week-parity-badge parity-${fact.parity}`}
              to={`/viikko-${fact.week}-${fact.year}`}
            >
              Viikko {fact.week} on {fact.parity}
            </Link>
          </p>
          <p>
            Parillisen viikon numero on jaollinen kahdella. Parittoman viikon
            numero ei ole jaollinen kahdella.
          </p>
        </div>

        <h2>Mitä parillinen ja pariton viikko tarkoittavat?</h2>
        <p>
          Parillisuus määräytyy viikon numerosta. Viikot 2, 4, 6 ja 42 ovat
          parillisia. Viikot 1, 3, 5 ja 41 ovat parittomia. Suomessa käytetään
          ISO 8601 -viikkonumeroita, joissa viikko alkaa maanantaina ja päättyy
          sunnuntaina.
        </p>

        <h2>Vuoroviikot ja joka toinen viikko toistuvat aikataulut</h2>
        <p>
          Parillisia ja parittomia viikkoja käytetään vuoroviikkoasumisessa,
          työvuoroissa, harrastusryhmissä, tapaamisissa ja muissa kahden viikon
          välein toistuvissa aikatauluissa. Sopikaa aina myös kellonaika ja
          vaihtopäivä, sillä pelkkä parillisuus ei kerro, alkaako vuoro
          maanantaina vai jonakin muuna päivänä.
        </p>

        <h2>Miksi viikot 53 ja 1 voivat olla peräkkäin parittomia?</h2>
        <p>
          Useimpina viikkoina parillisuus vaihtuu vuorotellen. Jos ISO-vuodessa
          on 53 viikkoa, vuoden viimeinen viikko on pariton. Seuraavan vuoden
          viikko 1 on myös pariton. Tarkista vuodenvaihteen vuorot aina
          viikkonumerosta, jotta kahden peräkkäisen parittoman viikon poikkeus
          ei siirrä aikataulua väärälle henkilölle tai ryhmälle.
        </p>

        <WeekLinks title="Parilliset viikot" weeks={current.even} year={current.year} kind="parillinen" />
        <WeekLinks title="Parittomat viikot" weeks={current.odd} year={current.year} kind="pariton" />
        <WeekLinks title="Parilliset viikot" weeks={next.even} year={next.year} kind="parillinen" />
        <WeekLinks title="Parittomat viikot" weeks={next.odd} year={next.year} kind="pariton" />

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map(({ q, a }, index) => (
          <details key={q} open={index === 0}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}

        <p>
          Katso myös <Link to="/mika-on-viikkonumero">miten viikkonumero määräytyy</Link>,{" "}
          <Link to={`/vuosi-${fact.year}`}>kaikki viikot {fact.year}</Link> ja{" "}
          <Link to="/paivamaara-viikoksi">päivämäärän viikkonumero</Link>.
        </p>
      </div>
    </section>
  );
}
