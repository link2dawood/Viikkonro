import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fmtFullFi, fmtShortFi, WD_ESSIVE } from "../components/dateUtils";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import { canonicalFor, routeMeta } from "../data/seo";
import {
  COUNTDOWNS,
  COUNTDOWN_BY_PATH,
  countdownFaqs,
  countdownStats,
  upcomingTargets,
} from "../data/countdownPages";

// Hours and minutes to the target's midnight — only rendered after mount
// (the prerendered HTML shows whole days), so hydration never mismatches on
// a value that changes every minute.
function clockLeft(target, now) {
  const ms = Math.max(0, target - now);
  const totalMin = Math.floor(ms / 60000);
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  };
}

// Countdown pages (/kuinka-monta-paivaa-jouluun etc.). The day count is
// computed in the render body, like homeMeta(), so the prerendered HTML
// already shows today's number; the nightly rebuild keeps it fresh.
const Countdown = ({ path }) => {
  const countdown = COUNTDOWN_BY_PATH[path];
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const stats = countdownStats(countdown, now);
  const faqs = countdownFaqs(countdown, now);
  const upcoming = upcomingTargets(countdown, now, 5);
  const others = COUNTDOWNS.filter((c) => c.path !== path);
  const verb = countdown.verb ?? "on";

  return (
    <section className="app">
      <SEO {...routeMeta[path]} canonical={canonicalFor(path)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / <Link to="/laskurit">Laskurit</Link> /{" "}
        {countdown.label}
      </div>

      <h1>Kuinka monta päivää {countdown.illative}?</h1>

      {stats ? (
        <>
          <p className="lead">
            <span className="answer-sentence">
              {stats.days === 0 ? (
                <>
                  <strong>Tänään!</strong> {countdown.targetNameCap} {verb} tänään{" "}
                  {fmtShortFi(stats.target)}.
                </>
              ) : (
                <>
                  {countdown.illative.replace(/^./, (c) => c.toUpperCase())} on{" "}
                  <strong>{stats.days} päivää</strong>.{" "}
                  {countdown.targetNameCap} {verb} {WD_ESSIVE[stats.target.getDay()]}{" "}
                  {fmtFullFi(stats.target)}.
                </>
              )}
            </span>
          </p>

          <div className="countdown-panel" aria-live="polite">
            <div className="countdown-days">{stats.days}</div>
            <div className="countdown-unit">päivää {countdown.illative}</div>
            {mounted && stats.days > 0 && (() => {
              const c = clockLeft(stats.target, now);
              return (
                <div className="countdown-clock">
                  Tarkalleen {c.days} pv {c.hours} h {c.minutes} min
                </div>
              );
            })()}
          </div>

          <QuickFacts
            facts={[
              { label: "Päivämäärä", value: fmtShortFi(stats.target) },
              {
                label: "Viikko",
                value: (
                  <Link to={`/viikko-${stats.week}-${stats.weekYear}`}>
                    Viikko {stats.week}
                  </Link>
                ),
              },
              { label: "Viikkoja ja päiviä", value: `${stats.weeks} vk ${stats.extraDays} pv` },
              { label: "Työpäiviä välissä", value: stats.workingDays },
            ]}
          />
        </>
      ) : (
        <p className="lead">
          Seuraavaa ajankohtaa ei ole vielä julkaistu. Päivitämme laskurin,
          kun viralliset päivämäärät ovat saatavilla.
        </p>
      )}

      {upcoming.length > 1 && (
        <>
          <h2>{countdown.targetNameCap} seuraavina vuosina</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vuosi</th>
                  <th>Päivämäärä</th>
                  <th>Viikonpäivä</th>
                  <th>Viikko</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((r) => (
                  <tr key={r.date.getFullYear()}>
                    <td>{r.date.getFullYear()}</td>
                    <td>{fmtShortFi(r.date)}</td>
                    <td>{r.weekday}</td>
                    <td>
                      <Link to={`/viikko-${r.week}-${r.weekYear}`}>Viikko {r.week}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <section className="prose">
        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((item, index) => (
          <details key={item.q} open={index === 0}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      <section className="related">
        <h2>Muut päivälaskurit</h2>
        <div className="pills">
          {others.map((c) => (
            <Link key={c.path} className="pill" to={c.path}>
              {c.label}
            </Link>
          ))}
          <Link className="pill" to="/paivien-erotus">
            Päivien erotus
          </Link>
        </div>
      </section>
    </section>
  );
};

export default Countdown;
