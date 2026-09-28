import { Link } from "react-router-dom";
import { fmtFullFi, isoWeek, isoYear } from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { useToday } from "../components/useToday";
import { canonicalFor } from "../data/seo";
import {
  SUN_CITIES,
  SUN_HUB_PATH,
  fmtDaylight,
  fmtTime,
  polarSentence,
  sunCity,
  sunCityFaqs,
  sunCityMeta,
  sunCityPath,
  sunSummary,
  sunToday,
} from "../data/sunCities";

const signed = (n) => (n > 0 ? `+${n} min` : n < 0 ? `${n} min` : "0 min");
const cell = (d, key) =>
  d.sunrise ? fmtTime(d[key]) : d.polarDay ? "ei laske" : "ei nouse";

// Sunrise and sunset for one city (/auringonlasku-helsinki): today via
// useToday() (prerendered day during hydration, live day right after) and the
// whole year for today's year.
const SunCity = ({ slug }) => {
  const city = sunCity(slug);
  const today = useToday();
  const y = today.getFullYear();
  const t = sunToday(city, today);
  const s = sunSummary(city, y);
  const faqs = sunCityFaqs(slug, today);
  const polar = polarSentence(s);
  const weekPath = `/viikko-${isoWeek(today)}-${isoYear(today)}`;

  return (
    <section className="app">
      <SEO {...sunCityMeta(slug, today)} canonical={canonicalFor(sunCityPath(slug))} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> /{" "}
        <Link to={SUN_HUB_PATH}>Auringonnousu ja -lasku</Link> / {city.name}
      </div>

      <h1>Auringonnousu ja -lasku {city.in}</h1>

      <p className="lead">
        <span className="answer-sentence">
          {t.sunrise ? (
            <>
              Tänään {city.in} aurinko nousee <strong>klo {fmtTime(t.sunrise)}</strong> ja
              laskee <strong>klo {fmtTime(t.sunset)}</strong>.
            </>
          ) : (
            <>
              Tänään {city.in} aurinko ei {t.polarDay ? "laske lainkaan (keskiyön aurinko)" : "nouse lainkaan (kaamos)"}.
            </>
          )}
        </span>{" "}
        Valoisaa aikaa on {fmtDaylight(t.daylight)}. Ajat ovat Suomen aikaa.
      </p>

      <QuickFacts
        title={`Aurinko ${city.in} tänään`}
        facts={[
          { label: "Päivä", value: <Link to={weekPath}>{fmtFullFi(today)}</Link> },
          { label: "Auringonnousu", value: cell(t, "sunrise") },
          { label: "Auringonlasku", value: cell(t, "sunset") },
          { label: "Valoisaa", value: fmtDaylight(t.daylight) },
          { label: "Muutos eilisestä", value: signed(t.change) },
        ]}
      />

      <section className="prose">
        <h2>
          Auringonnousu ja -lasku {city.in} {y} kuukausittain
        </h2>
      </section>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Päivä</th>
              <th scope="col">Nousu</th>
              <th scope="col">Lasku</th>
              <th scope="col">Valoisaa</th>
            </tr>
          </thead>
          <tbody>
            {s.table.map((d) => (
              <tr key={d.date.getTime()}>
                <th scope="row">
                  <Link to={`/kuukausi-${d.date.getMonth() + 1}-${y}`}>
                    {d.date.getDate()}. {d.monthName.toLowerCase()}ta
                  </Link>
                </th>
                <td>{cell(d, "sunrise")}</td>
                <td>{cell(d, "sunset")}</td>
                <td>{fmtDaylight(d.daylight)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="prose">
        <h2>Pisin ja lyhyin päivä {city.in}</h2>
        <p>
          {s.longest.polarDay
            ? `Kesällä ${city.in} aurinko ei laske lainkaan.`
            : `Vuoden ${y} pisin päivä on ${fmtFullFi(s.longest.date)}: aurinko nousee klo ${fmtTime(s.longest.sunrise)} ja laskee klo ${fmtTime(s.longest.sunset)} (${fmtDaylight(s.longest.daylight)}).`}{" "}
          {s.shortest.polarNight
            ? `Talvella ${city.in} on kaamos, jolloin aurinko ei nouse lainkaan.`
            : `Lyhyin päivä on ${fmtFullFi(s.shortest.date)}, jolloin valoisaa on vain ${fmtDaylight(s.shortest.daylight)}.`}{" "}
          Päivä on 12 tuntia pitkä keväällä {s.twelve[0].date.getDate()}.{s.twelve[0].date.getMonth() + 1}. ja
          syksyllä {s.twelve[s.twelve.length - 1].date.getDate()}.{s.twelve[s.twelve.length - 1].date.getMonth() + 1}.
        </p>

        {polar && (
          <>
            <h2>Keskiyön aurinko ja kaamos {city.in}</h2>
            <p>{polar}</p>
            <p className="note-soft">
              Rajapäivät voivat vaihdella lähteestä riippuen päivällä tai
              kahdella, koska aurinko kulkee silloin aivan horisontin tuntumassa.
            </p>
          </>
        )}
      </section>

      <p className="note-soft">
        Ajat on laskettu tähtitieteellisellä kaavalla kunnan keskustan
        koordinaateille ({city.lat.toFixed(2)}° N, {city.lon.toFixed(2)}° E).
        Auringonnousu ja -lasku ovat hetkiä, jolloin auringon yläreuna on
        horisontissa ilmakehän taittuminen huomioiden. Tarkkuus on noin minuutti.
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

      <p className="hub-links">
        Muut kaupungit:{" "}
        {SUN_CITIES.filter((c) => c.slug !== slug).map((c, i, arr) => (
          <span key={c.slug}>
            <Link to={sunCityPath(c.slug)}>{c.name}</Link>
            {i < arr.length - 1 ? ", " : "."}
          </span>
        ))}{" "}
        Katso myös <Link to={SUN_HUB_PATH}>kaikki kaupungit tänään</Link>,{" "}
        <Link to={`/kesaaika-${y}`}>kesäaika {y}</Link> ja{" "}
        <Link to={`/kuun-vaiheet-${y}`}>kuun vaiheet {y}</Link>.
      </p>
    </section>
  );
};

export default SunCity;
