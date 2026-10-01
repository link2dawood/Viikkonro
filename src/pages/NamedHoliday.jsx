import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import {
  PRERENDER_MAX_YEAR,
  PRERENDER_MIN_YEAR,
  fmtFullFi,
} from "../components/dateUtils";
import {
  easterHolidays,
  EASTER_SLUGS,
  holidayFaqs,
  holidayPageFor,
  holidayPageMeta,
  holidayWeekLinks,
} from "../data/holidayPages";
import { HOLIDAY_LEGAL_BASIS } from "../data/holidays";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";
import NotFound from "./NotFound";

const NamedHoliday = () => {
  const { holidayYear, holidaySlug } = useParams();
  const year = holidayYear?.match(/^pyhat-(\d{4})$/)?.[1];
  const page = holidayPageFor(year, holidaySlug);
  if (!page) return <NotFound />;

  const meta = holidayPageMeta(page.year, page.slug);
  const faqs = holidayFaqs(page);
  const status = page.official ? "Virallinen pyhäpäivä" : "Vietetty juhlapäivä";
  // Shared with prerender.js's structured-data `mentions` so the visible
  // links and the schema references point at exactly the same URLs.
  const links = holidayWeekLinks(page);
  // Only stated for the 2 of 15 holidays with an independently confirmed,
  // holiday-specific Finlex citation (see HOLIDAY_LEGAL_BASIS) — the other
  // 13 fall under the Church Act or a different instrument not individually
  // re-verified here, so nothing is stated for them rather than guessed.
  const legalBasis = HOLIDAY_LEGAL_BASIS[page.displayName];
  const easter = EASTER_SLUGS.includes(page.slug) ? easterHolidays(page.year) : null;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(page.path)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/pyhapaivat-${page.year}`}>Pyhäpäivät {page.year}</Link> /{" "}
        {page.displayName}
      </div>

      <h1>{page.displayName} {page.year}</h1>

      <div className="prose">
        <p className="lead answer-sentence">
          <strong>
            {page.displayName} {page.year} on {page.weekdayEssive}{" "}
            {fmtFullFi(page.date)} ja kuuluu viikkoon {page.week}.
          </strong>
        </p>

        <QuickFacts
          title={`${page.displayName} ${page.year} lyhyesti`}
          facts={[
            { label: "Pyhäpäivä", value: page.displayName },
            { label: "Päivämäärä", value: fmtFullFi(page.date) },
            { label: "Viikonpäivä", value: page.weekday },
            {
              label: "Viikkonumero",
              value: <Link to={links.week.path}>{links.week.label}</Link>,
            },
            {
              label: "Kuukausi",
              value: <Link to={links.month.path}>{links.month.label}</Link>,
            },
            { label: "Asema", value: status },
            { label: "Tyyppi", value: page.kind },
          ]}
        />

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Milloin {page.displayName.toLowerCase()} on vuonna {page.year}?</h2>
        <p>
          {page.displayName} on {page.weekdayEssive} {fmtFullFi(page.date)}.
          {" "}{page.rule} Vuonna {page.year} päivä on {page.kind}.
        </p>

        {easter && (
          <>
            <h2>Pääsiäinen {page.year}: kaikki pääsiäisen pyhät</h2>
            <ul>
              {easter.map((item) => (
                <li key={item.slug}>
                  {item.slug === page.slug ? (
                    <strong>{item.displayName}</strong>
                  ) : (
                    <Link to={item.path}>{item.displayName}</Link>
                  )}
                  : {item.weekday.toLowerCase()} {fmtFullFi(item.date)},{" "}
                  <Link to={`/viikko-${item.week}-${item.weekYear}`}>viikko {item.week}</Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Mille viikolle {page.displayName.toLowerCase()} {page.year} osuu?</h2>
        <p>
          Päivä kuuluu ISO 8601 -kalenterissa{" "}
          <Link to={links.week.path}>
            viikkoon {page.week} vuonna {page.weekYear}
          </Link>.
          Suomessa viikko alkaa maanantaina ja päättyy sunnuntaina. Katso{" "}
          <Link to={links.month.path}>{links.month.label} viikot kokonaisuudessaan</Link>.
        </p>

        <h2>Onko {page.displayName.toLowerCase()} virallinen pyhäpäivä?</h2>
        <p>
          {page.official
            ? `${page.displayName} on Suomessa virallinen pyhäpäivä.`
            : `${page.displayName} ei ole Suomessa virallinen pyhäpäivä, vaikka se on monilla työpaikoilla vapaa tai tavallista lyhyempi työpäivä.`}
          {" "}Kaikki vuoden päivät ja niiden asema löytyvät{" "}
          <Link to={`/pyhapaivat-${page.year}`}>pyhäpäivien {page.year} listasta</Link>.
        </p>

        <h2>Miten {page.displayName.toLowerCase()} päivämäärä määräytyy?</h2>
        <p>{page.rule}</p>

        {legalBasis && (
          <p>
            {page.displayName} on säädetty vapaapäiväksi lailla{" "}
            <a href={legalBasis.url} target="_blank" rel="noopener noreferrer">
              {legalBasis.act}
            </a>{" "}
            ({legalBasis.actName}).
          </p>
        )}

        <h2>Usein kysyttyä: {page.displayName.toLowerCase()}</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p>
          Katso myös <Link to={`/kalenteri-${page.year}`}>viikkokalenteri {page.year}</Link>,{" "}
          <Link to={`/pyhapaivat-${page.year}`}>kaikki pyhäpäivät {page.year}</Link>,{" "}
          <Link to={`/liputuspaivat-${page.year}`}>liputuspäivät {page.year}</Link>,{" "}
          <Link to={links.month.path}>{links.month.label}</Link>,{" "}
          <Link to={links.year.path}>{links.year.label}</Link>{" "}
          ja <Link to="/mika-on-viikkonumero">mikä on viikkonumero</Link>.
        </p>

        <div className="prevnext">
          {page.year > PRERENDER_MIN_YEAR && (
            <Link to={`/pyhat-${page.year - 1}/${page.slug}`}>
              <span className="lbl">Edellinen</span>{page.displayName} {page.year - 1}
            </Link>
          )}
          {page.year < PRERENDER_MAX_YEAR && (
            <Link className="nx" to={`/pyhat-${page.year + 1}/${page.slug}`}>
              <span className="lbl">Seuraava</span>{page.displayName} {page.year + 1}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default NamedHoliday;
