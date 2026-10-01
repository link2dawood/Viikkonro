import { Link } from "react-router-dom";
import { fmtFullFi } from "../components/dateUtils";
import SEO from "../components/SEO";
import {
  CONFIDENCE,
  autumnSummary,
  SCHOOL_HOLIDAY_SOURCES,
  confidenceLabel,
  pageConfidenceTier,
  schoolHolidayFaqs,
  schoolHolidayMeta,
  schoolHolidayPage,
  schoolHolidayYears,
} from "../data/schoolHolidayPages";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";
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
                {fmtFullFi(group.startDate)}–{fmtFullFi(group.endDate)}
              </td>
              <td>{group.cities.join(", ")}</td>
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
  // The most recent of this page's own sources' verifiedAt dates (STEP 8/9)
  // — not CONTENT_UPDATED directly, so this stays correct even if a future
  // source is verified on a different date than the sitewide constant.
  const verifiedAt = sources.reduce(
    (latest, s) => (s.verifiedAt > latest ? s.verifiedAt : latest),
    sources[0]?.verifiedAt ?? "",
  );

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
            just in the (noindexed) meta description. */}
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
            <li><strong>Hiihto- eli talviloma:</strong> viikot 8–10 alueittain.</li>
            <li>
              <strong>Syysloma:</strong>{" "}
              {selectedYear === 2026
                ? "viikko 42 tai 43 vertailukaupungista riippuen."
                : "Helsingissä vahvistetusti viikko 42; muut kunnat tarkistettava erikseen."}
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

        <p className="note-soft">Sisältö ja lähteet tarkistettu {CONTENT_UPDATED_FI}.</p>

        <h2>Milloin hiihtoloma {selectedYear} on?</h2>
        <p>
          Talviloma porrastetaan kolmen viikon jaksolle. Alla olevat kaupungit
          ovat Opetushallituksen Manner-Suomen maakuntapääkaupunkien
          vertailusta; lista ei tarkoita, että jokainen samalla alueella oleva
          kunta noudattaa täsmälleen samaa aikaa.
        </p>
        <HolidayTable
          groups={page.winter}
          year={selectedYear}
          label="Hiihtolomaviikko"
        />

        <h2>Milloin syysloma {selectedYear} on?</h2>
        <p className="answer-sentence">
          <strong>{autumnSummary(page)}</strong>
        </p>
        <p>
          {selectedYear === 2026
            ? "Syysloma osuu vertailukaupungeissa viikolle 42 tai 43. Joissakin kunnissa loma kestää koko viikon, toisissa maanantaista perjantaihin."
            : "Syksyn 2027 valtakunnallista kuntavertailua ei ole vielä julkaistu. Taulukossa näkyy vain Helsingin virallisesti vahvistettu aika, eikä sitä yleistetä muihin kuntiin."}
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

        <h2>Muut koululomien ajankohdat vuonna {selectedYear}</h2>
        <ul>
          {page.otherPeriods.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <h2>Miksi koululomat vaihtelevat alueittain?</h2>
        <p>
          Suomessa opetuksen järjestäjä päättää lukuvuoden työ- ja loma-ajoista
          lain asettamissa rajoissa. Talvilomien porrastus viikoille 8–10
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
            <b>Viikkokalenteri {selectedYear}</b>
            <span>Kaikki kuukaudet, viikot ja juhlapäivät</span>
          </Link>
          <Link className="ql" to={"/vuosi-" + selectedYear}>
            <b>Viikkonumerot {selectedYear}</b>
            <span>Kaikki ISO-viikot päivämäärineen</span>
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
