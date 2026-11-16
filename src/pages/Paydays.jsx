import pageCss from "./paymentPage.css?raw";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  fmtShortFi,
  M_SLUG,
  PRERENDER_MIN_YEAR as YEAR_MIN,
  PRERENDER_MAX_YEAR as YEAR_MAX,
} from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { canonicalFor } from "../data/seo";
import {
  DEFAULT_PAYDAY,
  PAYDAY_LAST,
  paydayFaqs,
  paydayMeta,
  paydaysInYear,
} from "../data/paydayPages";
import { CONFIDENCE, pageConfidenceTier } from "../data/schoolHolidayPages";

const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1);

// One table cell: the actual payday, and the original date when it moved.
const PaydayCell = ({ row }) => (
  <td>
    {row.weekYear >= YEAR_MIN && row.weekYear <= YEAR_MAX ? (
      <Link to={`/viikko-${row.week}-${row.weekYear}`}>
        {row.weekday.slice(0, 2).toLowerCase()} {fmtShortFi(row.actual)}
      </Link>
    ) : (
      <>{row.weekday.slice(0, 2).toLowerCase()} {fmtShortFi(row.actual)}</>
    )}
    {row.moved && (
      <span className="payday-moved">
        {" "}siirtyy ({row.reason.toLowerCase()} {fmtShortFi(row.nominal)})
      </span>
    )}
  </td>
);

// Payday calendar for a year (/palkkapaivat-2026). The prerendered table
// shows the two most common paydays (15th and the last day of the month);
// the day picker only changes the first column client-side, so SSR and
// hydration render identical markup.
const Paydays = ({ year }) => {
  const y = Number(year);
  const [day, setDay] = useState(DEFAULT_PAYDAY);
  const chosen = paydaysInYear(y, day);
  const last = paydaysInYear(y, PAYDAY_LAST);
  const faqs = paydayFaqs(y);
  const movedChosen = chosen.filter((r) => r.moved).length;
  const movedLast = last.filter((r) => r.moved).length;

  return (
    <section className="app">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />
      <SEO {...paydayMeta(y)} canonical={canonicalFor(`/palkkapaivat-${y}`)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={`/vuosi-${y}`}>Viikot {y}</Link> / Palkkapäivät {y}
      </div>

      <h1>Palkkapäivät {y}</h1>

      <p className="lead">
        <span className="answer-sentence">
          Jos palkkapäivä osuu lauantaille, sunnuntaille tai arkipyhälle, palkka
          maksetaan <strong>edellisenä pankkipäivänä</strong>.
        </span>{" "}
        Taulukosta näet, milloin palkka tulee tilille jokaisena kuukautena
        vuonna {y}.
      </p>

      <QuickFacts
        facts={[
          { label: "Vuosi", value: y },
          { label: `${day}. päivän palkka siirtyy`, value: `${movedChosen} kertaa` },
          { label: "Kuun viimeisen päivän palkka siirtyy", value: `${movedLast} kertaa` },
        ]}
      />

      <div className="payday-picker">
        <label htmlFor="payday-day">Palkkapäivä kuukaudessa</label>
        <select
          id="payday-day"
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
        >
          {DAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}. päivä
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kuukausi</th>
              <th>{day}. päivä</th>
              <th>Kuun viimeinen päivä</th>
            </tr>
          </thead>
          <tbody>
            {chosen.map((row, i) => (
              <tr key={row.month}>
                <td>
                  <Link to={`/tyopaivat-${M_SLUG[row.month - 1]}-${y}`}>
                    {row.monthName}
                  </Link>
                </td>
                <PaydayCell row={row} />
                <PaydayCell row={last[i]} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note-soft">
        Pankkipäiviä ovat arkipäivät maanantaista perjantaihin, paitsi Suomen
        Pankin pankkivapaapäivät: arkipyhät sekä juhannus- ja jouluaatto.
        Työehtosopimus voi määrätä palkanmaksupäivästä tarkemmin.
      </p>

      <section className="prose">
        <h2>Palkkapäivä ennen joulua {y}</h2>
        <p>
          Työsopimuslain (2 luku 13 §) mukaan palkan erääntyessä pyhäpäivänä, itsenäisyyspäivänä, vapunpäivänä, joulu- tai juhannusaattona taikka arkilauantaina pidetään erääntymispäivänä <strong>sitä edeltävää arkipäivää</strong>. Palkka on oltava työntekijän käytettävissä sen erääntymispäivänä.
        </p>
        <p>
          Jouluna pankit ovat kiinni jouluaattona, joulupäivänä ja tapaninpäivänä.
          {y === 2026 && (
            <>
              {" "}Vuonna 2026 jouluaatto on torstai 24.12., joulupäivä perjantai 25.12., tapaninpäivä lauantai 26.12. ja sunnuntai 27.12.
              Tämän vuoksi kaikille, joiden säännöllinen palkkapäivä on <strong>24.–27. joulukuuta</strong>, palkka maksetaan edeltävänä pankkipäivänä eli <strong>keskiviikkona 23.12.2026</strong>.
            </>
          )}
        </p>
        <ul>
          <li><strong>Palkkapäivä 15.12.:</strong> {y === 2026 ? "Tiistai 15.12.2026 on normaali pankkipäivä, joten palkka maksetaan ajallaan." : "Maksetaan pankkipäivänä."}</li>
          <li><strong>Palkkapäivä 24.–27.12.:</strong> {y === 2026 ? "Kaikki nämä päivät siirtyvät maksettavaksi keskiviikkona 23.12.2026 ennen joulua." : "Maksetaan joulua edeltävänä pankkipäivänä."}</li>
          <li><strong>Palkkapäivä kuun viimeinen päivä (31.12.):</strong> {y === 2026 ? "Torstai 31.12.2026 (uudenvuodenaatto) on virallinen pankkipäivä, joten palkka maksetaan normaalisti 31.12.2026." : "Maksetaan kuun viimeisenä pankkipäivänä."}</li>
        </ul>
        <p>
          Katso myös <Link to={`/joulu-${y}`}>joulu {y}</Link> pyhät ja vapaat sekä <Link to={`/tyopaivat-${y}`}>työpäivät {y}</Link>.
        </p>

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <p>
        Katso myös <Link to={`/tyopaivat-${y}`}>työpäivät {y}</Link>,{" "}
        <Link to={`/pyhapaivat-${y}`}>pyhäpäivät {y}</Link>,{" "}
        <Link to={`/kelan-maksupaivat-${y}`}>Kelan maksupäivät {y}</Link>,{" "}
        <Link to={`/elakkeen-maksupaivat-${y}`}>eläkkeen maksupäivät {y}</Link>
        {pageConfidenceTier(y) === CONFIDENCE.CONFIRMED && (
          <>
            , <Link to={`/koululomat-${y}`}>koululomat {y}</Link>
          </>
        )}
        {" ja "}
        <Link to="/tyopaivalaskuri">työpäivälaskuri</Link>. Työtunnit lasket{" "}
        <Link to="/tuntilaskuri">tuntilaskurilla</Link>.
      </p>

      <div className="prevnext">
        {y - 1 >= YEAR_MIN && (
          <Link to={`/palkkapaivat-${y - 1}`}>
            <span className="lbl">Edellinen</span>Palkkapäivät {y - 1}
          </Link>
        )}
        {y + 1 <= YEAR_MAX && (
          <Link className="nx" to={`/palkkapaivat-${y + 1}`}>
            <span className="lbl">Seuraava</span>Palkkapäivät {y + 1}
          </Link>
        )}
      </div>
    </section>
  );
};

export default Paydays;
