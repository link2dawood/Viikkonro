import { Link } from "react-router-dom";
import { fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import AdSlot from "../components/AdSlot";
import {
  CONFIDENCE,
  autumnSummary,
  SCHOOL_HOLIDAY_SOURCES,
  confidenceLabel,
  pageConfidenceTier,
  schoolHolidayFaqs,
  schoolHolidayMeta,
  schoolHolidayPage,
  schoolHolidayVerifiedAt,
  schoolHolidayYears,
} from "../data/schoolHolidayPages";
import { canonicalFor } from "../data/seo";
import NotFound from "./NotFound";

// Confidence badge — same plain-text string rendered here as
// confidenceLabel() returns for schema/GEO purposes elsewhere (STEP 3/8), so
// what a user sees and what an AI system parses from the HTML can't diverge.
function ConfidenceBadge({ confidence }) {
  return <span className={`confidence-badge confidence-${confidence}`}>{confidenceLabel(confidence)}</span>;
}

function HolidayTable({ groups, year, label }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>{label}</th>
            <th>Päivämäärät</th>
            <th>Vertailukaupungit</th>
            <th>Lähde</th>
            <th>Tila</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.week + group.cities.join("-")}>
              <td>
                <Link to={"/viikko-" + group.week + "-" + year}>
                  <strong>Viikko {group.week}</strong>
                </Link>
              </td>
              <td>
                {fmtFullFi(group.startDate)} - {fmtFullFi(group.endDate)}
              </td>
              <td>
                {group.cities.map((city, idx) => (
                  <span key={city}>
                    {idx > 0 && ", "}
                    <span id={city.toLowerCase()}>{city}</span>
                  </span>
                ))}
              </td>
              <td>{SCHOOL_HOLIDAY_SOURCES[group.sourceKey].source}</td>
              <td>
                <ConfidenceBadge confidence={group.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Tier C (STEP 2/3): named cities with no date — never a fabricated row in
// the dated table above, always a visibly separate "not yet published" list.
function UnknownCitiesNotice({ cities }) {
  if (!cities || cities.length === 0) return null;
  return (
    <p className="note-soft">
      <ConfidenceBadge confidence={CONFIDENCE.UNKNOWN} />{" "}
      Ei vielä julkaistua ajankohtaa: {cities.join(", ")}.
    </p>
  );
}

const SchoolHolidays = ({ year }) => {
  const selectedYear = Number(year);
  const page = schoolHolidayPage(selectedYear);
  if (!page) return <NotFound />;

  const tier = pageConfidenceTier(selectedYear);
  const meta = schoolHolidayMeta(selectedYear);
  const faqs = schoolHolidayFaqs(selectedYear);
  const sources = page.sourceKeys.map((key) => SCHOOL_HOLIDAY_SOURCES[key]);
  // The most recent of this page's own source-review dates.
  const verifiedAt = schoolHolidayVerifiedAt(selectedYear);
  const autumnCitiesSummary = page.autumn
    .map((group) => `${group.cities.join(", ")}: viikko ${group.week}`)
    .join("; ");

  return (
    <section className="app">
      <SEO
        {...meta}
        canonical={canonicalFor("/koululomat-" + selectedYear)}
      />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Koululomat {selectedYear}
      </div>

      <h1>Koululomat {selectedYear}: syysloma ja hiihtoloma</h1>

      <div className="prose">
        {/* STEP 4: Tier B pages must show this exact sentence, visibly, not
            just in the meta description. */}
        {tier !== CONFIDENCE.CONFIRMED && (
          <div className="notice">
            <strong>
              <ConfidenceBadge confidence={tier} /> Ei vielä virallisesti
              vahvistettu.
            </strong>{" "}
            Tiedot perustuvat aiempien vuosien käytäntöihin eikä niitä ole
            vielä vahvistettu.
          </div>
        )}

        <p className="lead">
          <span className="answer-sentence">
            <strong>
              Koululaisten hiihtoloma {selectedYear} ajoittuu Suomessa
              alueesta riippuen viikoille 8, 9 tai 10.
            </strong>
          </span>{" "}
          Syysloman, joululoman ja lukuvuoden muiden päivien tarkka ajankohta
          riippuu kunnasta ja oppilaitoksesta.
        </p>

        <div className="panel">
          <div className="now-label">Koululomat {selectedYear} lyhyesti</div>
          <ul>
            <li><strong>Hiihto- eli talviloma:</strong> viikot 8-10 alueittain.</li>
            <li>
              <strong>Syysloma:</strong>{" "}
              {autumnCitiesSummary}. Muut kunnat tarkistettava erikseen.
            </li>
            <li><strong>Päätöksentekijä:</strong> opetuksen järjestäjä, yleensä kunta.</li>
            <li><strong>Kohderyhmä:</strong> ensisijaisesti perusopetus.</li>
          </ul>
        </div>

        {/* STEP 8/9 — GEO: source, confidence and last-verified date exposed
            as plain, crawlable text, not just inside JSON-LD. */}
        <div className="panel">
          <div className="now-label">Lähde ja luotettavuus</div>
          <ul>
            <li>
              <strong>Lähde:</strong> {sources.map((s) => s.source).join(", ")}
            </li>
            <li>
              <strong>Tila:</strong> <ConfidenceBadge confidence={tier} />
            </li>
            <li>
              <strong>Tarkistettu:</strong> {verifiedAt}
            </li>
          </ul>
        </div>

        <p className="note-soft">Sisältö ja lähteet tarkistettu {verifiedAt}.</p>

        <AdSlot placement="school-holidays-after-summary" />

        {selectedYear === 2027 && (
          <div className="table-wrap">
            <h2>Talvilomaviikot 2027 alueittain (alue 1, alue 2 ja alue 3)</h2>
            <p>
              Suomessa koulujen talviloma (hiihtoloma) on jaettu kolmeen alueeseen porrastetusti helmikuun lopulta maaliskuun puoliväliin:
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alue</th>
                  <th>Viikko</th>
                  <th>Ajankohta 2027</th>
                  <th>Maakunnat ja esimerkkikaupungit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Alue 1</strong></td>
                  <td>
                    <Link to="/viikko-8-2027"><strong>Viikko 8</strong></Link>
                  </td>
                  <td>22.2.-26.2.2027</td>
                  <td>
                    <strong>Etelä-Suomi ja rannikko:</strong> Helsinki, Espoo, Vantaa, Kauniainen, Turku, Pori, Rauma, Salo, Porvoo, Lohja, Hyvinkää (Uusimaa, Varsinais-Suomi, Satakunta, Ahvenanmaa)
                  </td>
                </tr>
                <tr>
                  <td><strong>Alue 2</strong></td>
                  <td>
                    <Link to="/viikko-9-2027"><strong>Viikko 9</strong></Link>
                  </td>
                  <td>1.3.-5.3.2027</td>
                  <td>
                    <strong>Sisä- ja Länsi-Suomi:</strong> Tampere, Hämeenlinna, Lahti, Jyväskylä, Seinäjoki, Vaasa, Kokkola, Kouvola, Kotka, Lappeenranta, Mikkeli (Pirkanmaa, Keski-Suomi, Kanta-Häme, Päijät-Häme, Kymenlaakso, Etelä-Karjala, Etelä-Savo, Pohjanmaa, Etelä-Pohjanmaa, Keski-Pohjanmaa)
                  </td>
                </tr>
                <tr>
                  <td><strong>Alue 3</strong></td>
                  <td>
                    <Link to="/viikko-10-2027"><strong>Viikko 10</strong></Link>
                  </td>
                  <td>8.3.-12.3.2027</td>
                  <td>
                    <strong>Itä- ja Pohjois-Suomi:</strong> Oulu, Rovaniemi, Kuopio, Joensuu, Kajaani, Iisalmi, Kemi, Tornio, Kuusamo (Pohjois-Savo, Pohjois-Karjala, Kainuu, Pohjois-Pohjanmaa, Lappi)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <AdSlot placement="school-holidays-mid-1" />

        <h2>Milloin hiihtoloma {selectedYear} on?</h2>
        <p>
          Talviloma porrastetaan kolmen viikon jaksolle. Jokainen taulukon rivi
          perustuu siinä nimettyyn viralliseen lähteeseen. Lista ei tarkoita,
          että jokainen samalla alueella oleva kunta noudattaa täsmälleen samaa
          aikaa.
        </p>
        <HolidayTable
          groups={page.winter}
          year={selectedYear}
          label="Hiihtolomaviikko"
        />

        <AdSlot placement="school-holidays-mid-2" />

        <h2>Milloin syysloma {selectedYear} on?</h2>
        <p className="answer-sentence">
          <strong>{autumnSummary(page)}</strong>
        </p>
        <p>
          Taulukossa näkyvät vain kaupunkien virallisesti vahvistamat ajat.
          Ajankohtaa ei yleistetä muihin kuntiin, ja valtakunnallista vertailua
          täydennetään vasta Opetushallituksen julkaistua kyseisen vuoden tiedot.
        </p>
        <HolidayTable
          groups={page.autumn}
          year={selectedYear}
          label="Syyslomaviikko"
        />
        <UnknownCitiesNotice cities={page.autumnUnknownCities} />

        <div className="panel">
          <div className="now-label">Tarkista aina oma kunta ja koulu</div>
          <p>{page.coverageNote}</p>
          <p>
            Esiopetuksen, lukion ja ammatillisen oppilaitoksen ajat voivat
            poiketa perusopetuksesta. Myös yksittäinen koulu voi siirtää
            työpäivää. Varmista lopullinen tieto kunnan sivulta tai Wilmasta.
          </p>
        </div>

        <AdSlot placement="school-holidays-tail" />

        <h2>Muut koululomien ajankohdat vuonna {selectedYear}</h2>
        <ul>
          {page.otherPeriods.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <h2>Miksi koululomat vaihtelevat alueittain?</h2>
        <p>
          Suomessa opetuksen järjestäjä päättää lukuvuoden työ- ja loma-ajoista
          lain asettamissa rajoissa. Talvilomien porrastus viikoille 8-10
          jakaa lomaliikennettä, mutta myös syys- ja joululomissa on
          kuntakohtaisia eroja. Lukion, ammatillisen koulutuksen ja
          esiopetuksen kalenterit voivat lisäksi poiketa peruskoulusta.
        </p>

        <h2>Viralliset lähteet</h2>
        <ul>
          {sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
              </a>
            </li>
          ))}
        </ul>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          <Link className="ql" to={"/kalenteri-" + selectedYear}>
            <b>Kalenteri {selectedYear}</b>
            <span>Kaikki kuukaudet, viikot ja juhlapäivät</span>
          </Link>
          <Link className="ql" to={"/vuosi-" + selectedYear}>
            <b>Viikkokalenteri {selectedYear}</b>
            <span>Kaikki ISO-viikot päivämäärineen</span>
          </Link>
          <Link className="ql" to="/vuosilomalaskuri">
            <b>Vuosilomalaskuri</b>
            <span>Laske ja suunnittele omat lomat</span>
          </Link>
          {/* STEP 6: only ever link to OTHER confirmed years — an estimated
              or unknown page must not receive aggressive internal linking,
              including from its own sibling-year footer. */}
          {schoolHolidayYears
            .filter((item) => item !== selectedYear && pageConfidenceTier(item) === CONFIDENCE.CONFIRMED)
            .map((item) => (
              <Link className="ql" to={"/koululomat-" + item} key={item}>
                <b>Koululomat {item}</b>
                <span>Hiihto- ja syyslomat alueittain</span>
              </Link>
            ))}
        </div>

        {faqs.length > 0 && (
          <>
            <h2>Usein kysytyt kysymykset</h2>
            {faqs.map((item, index) => (
              <details key={item.q} open={index === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default SchoolHolidays;
