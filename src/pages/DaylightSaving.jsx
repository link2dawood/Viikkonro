import { Link } from "react-router-dom";
import {
  fmtFullFi,
  WD_ESSIVE,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { canonicalFor } from "../data/seo";
import { dstChanges, dstFaqs, dstMeta } from "../data/dstPages";

const ChangeCard = ({ title, change, note }) => (
  <div className="dst-card">
    <div className="now-label">{title}</div>
    <div className="dst-date">
      {WD_ESSIVE[change.date.getDay()]} {fmtFullFi(change.date)}
    </div>
    <div className="dst-time">
      klo {change.from} → {change.to}
    </div>
    <p>{note}</p>
    <Link to={`/viikko-${change.week}-${change.weekYear}`}>Viikko {change.week}</Link>
  </div>
);

// Daylight saving time for a year (/kesaaika-2026). Purely a function of
// the year (dstChanges()), so SSR and hydration always agree.
const DaylightSaving = ({ year }) => {
  const y = Number(year);
  const { start, end, summerDays } = dstChanges(y);
  const faqs = dstFaqs(y);

  return (
    <section className="app">
      <SEO {...dstMeta(y)} canonical={canonicalFor(`/kesaaika-${y}`)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${y}`}>Viikot {y}</Link> / Kesäaika {y}
      </div>

      <h1>Kesäaika {y} – milloin kellot siirretään?</h1>

      <p className="lead">
        <span className="answer-sentence">
          Kesäaika {y} alkaa {WD_ESSIVE[start.date.getDay()]}{" "}
          <strong>{fmtFullFi(start.date)}</strong> ja päättyy{" "}
          {WD_ESSIVE[end.date.getDay()]} <strong>{fmtFullFi(end.date)}</strong>.
        </span>{" "}
        Keväällä kelloja siirretään tunti eteenpäin ja syksyllä tunti taaksepäin.
      </p>

      <div className="dst-cards">
        <ChangeCard
          title="Kesäaika alkaa"
          change={start}
          note="Kellot siirretään tunti eteenpäin. Yö on tuntia lyhyempi."
        />
        <ChangeCard
          title="Talviaika alkaa"
          change={end}
          note="Kellot siirretään tunti taaksepäin. Yö on tuntia pidempi."
        />
      </div>

      <QuickFacts
        facts={[
          { label: "Kesäaika alkaa", value: `viikko ${start.week}` },
          { label: "Kesäaika päättyy", value: `viikko ${end.week}` },
          { label: "Kesäaikaa", value: `${summerDays} päivää` },
          { label: "Talviaika", value: "UTC+2 (EET)" },
          { label: "Kesäaika", value: "UTC+3 (EEST)" },
        ]}
      />

      <p className="note-soft">
        Ajankohdat perustuvat EU:n voimassa olevaan kesäaikadirektiiviin
        (2000/84/EY). Jos kellojen siirrosta luovutaan, tulevien vuosien
        päivämäärät muuttuvat.
      </p>

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p>
        Katso myös <Link to={`/vuosi-${y}`}>vuoden {y} viikkonumerot</Link>,{" "}
        <Link to={`/kalenteri-${y}`}>kalenteri {y}</Link> ja{" "}
        <Link to={`/pyhapaivat-${y}`}>pyhäpäivät {y}</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={`/kesaaika-${y - 1}`}>
            <span className="lbl">Edellinen</span>Kesäaika {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={`/kesaaika-${y + 1}`}>
            <span className="lbl">Seuraava</span>Kesäaika {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default DaylightSaving;
