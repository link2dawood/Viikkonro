import { useState } from "react";
import { EVENT_KIND_LABELS_FI } from "../../platform/calendar/events.js";
import { WEEKDAYS_MON_FIRST, weekList } from "../../platform/calendar/model.js";
import { resolveTheme } from "../../platform/design/themes.js";
import { dayStyle, legendKinds } from "../../platform/render/dayStyle.js";

const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const NOTE_KINDS = new Set(["closure", "leave", "season", "school", "company", "payday", "flag-day"]);
const KIND_ORDER = ["holiday", "flag-day", "payday", "closure", "leave", "season", "school", "company"];

const Marks = ({ style }) => (
  <>
    {style.flag && <i className="cc-mark cc-flag" aria-hidden="true" />}
    {style.payday && <i className="cc-mark cc-payday" aria-hidden="true" />}
    {style.company && <i className="cc-mark cc-dot" aria-hidden="true" />}
  </>
);

const dayLabel = (day) => day.events.filter((e) => e.kind !== "week").map((e) => e.title).join(", ");

function YearGlance({ model, colors }) {
  return (
    <div className="cc-year">
      {model.months.map((month) => {
        const notes = model.events.filter(
          (e) => NOTE_KINDS.has(e.kind) && e.date.getMonth() === month.index && e.date.getFullYear() === model.year,
        );
        return (
          <section className="cc-month" key={month.index}>
            <h3 style={{ color: colors.accent }}>{month.name}</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Vk</th>
                  {WEEKDAYS_MON_FIRST.map((d) => (
                    <th scope="col" key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {month.rows.map((row) => (
                  <tr key={`${row.weekYear}-${row.week}`}>
                    <th scope="row" className="cc-wk">{row.week}</th>
                    {row.days.map((day, i) => {
                      if (!day) return <td key={i} />;
                      const style = dayStyle(day, colors);
                      return (
                        <td
                          key={i}
                          title={dayLabel(day) || undefined}
                          style={{ background: style.fill ?? undefined, color: style.numberColor, fontWeight: style.bold ? 700 : 400 }}
                        >
                          {day.day}
                          <Marks style={style} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {notes.length > 0 && (
              <ul className="cc-notes">
                {notes.slice(0, 4).map((e) => (
                  <li key={e.id}>
                    {dm(e.date)}
                    {e.endDate ? `-${dm(e.endDate)}` : ""} {e.title}
                  </li>
                ))}
                {notes.length > 4 && <li>+{notes.length - 4} muuta</li>}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function MonthPage({ model, colors }) {
  const [index, setIndex] = useState(0);
  const month = model.months[index];
  return (
    <div className="cc-monthpage">
      <div className="cc-monthnav">
        <button type="button" className="btn-ghost" onClick={() => setIndex((index + 11) % 12)} aria-label="Edellinen kuukausi">
          ‹
        </button>
        <label>
          <span className="cc-sr">Kuukausi</span>
          <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
            {model.months.map((m) => (
              <option key={m.index} value={m.index}>{m.name} {model.year}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-ghost" onClick={() => setIndex((index + 1) % 12)} aria-label="Seuraava kuukausi">
          ›
        </button>
      </div>
      <h3 style={{ color: colors.accent }}>{month.name} {model.year}</h3>
      <table className="cc-bigmonth">
        <thead>
          <tr>
            <th scope="col">Viikko</th>
            {WEEKDAYS_MON_FIRST.map((d) => (
              <th scope="col" key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {month.rows.map((row) => (
            <tr key={`${row.weekYear}-${row.week}`}>
              <th scope="row" className="cc-bigwk" style={{ background: colors.accent }}>{row.week}</th>
              {row.days.map((day, i) => {
                if (!day) return <td key={i} className="cc-empty" />;
                const style = dayStyle(day, colors);
                const items = day.events.filter((e) => e.kind !== "week").sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
                return (
                  <td key={i} style={{ background: style.fill ?? undefined }}>
                    <b style={{ color: style.numberColor }}>{day.day}</b>
                    <Marks style={style} />
                    {items.slice(0, 3).map((e) => (
                      <span className="cc-ev" key={e.id}>{e.title}</span>
                    ))}
                    {items.length > 3 && <span className="cc-ev">+{items.length - 3} muuta</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeekListView({ model, colors }) {
  const weeks = weekList(model);
  return (
    <div className="table-wrap">
      <table className="cc-weeks">
        <thead>
          <tr>
            <th scope="col">Viikko</th>
            <th scope="col">Päivät</th>
            <th scope="col">Työpäiviä {model.year}</th>
            <th scope="col">Merkittävät päivät</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={`${w.weekYear}-${w.week}`}>
              <th scope="row" style={{ color: colors.accent }}>{w.week}</th>
              <td>{dm(w.from)} - {dm(w.to)}</td>
              <td>{w.workingDays}</td>
              <td>{w.events.map((e) => e.text).join("; ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The live preview. When `locked` it is the free preview: a watermark over the
 * calendar and a placeholder where the logo goes.
 */
export default function Preview({ model, locked, hasLogo, logo }) {
  const { config } = model;
  const colors = resolveTheme(config.theme, config.branding).colors;
  const kinds = legendKinds(model);
  const name = config.branding.companyName;
  return (
    <div className={`cc-frame${locked ? " cc-locked" : ""}`} style={{ borderTopColor: colors.accent }}>
      <header className="cc-head">
        <div>
          <p className="cc-company" style={name ? undefined : { color: colors.inkSoft }}>{name || "Yrityksesi nimi"}</p>
          <p className="cc-sub">Kalenteri {model.year}, ISO 8601 -viikkonumerot</p>
        </div>
        {!locked && logo && <img className="cc-logo" src={logo.dataUri} alt={name ? `${name}, logo` : "Yrityksen logo"} />}
        {locked && hasLogo && <span className="cc-logo-slot">Logo näkyy ladatussa kalenterissa</span>}
      </header>
      {config.layout.id === "month-page" ? (
        <MonthPage model={model} colors={colors} />
      ) : config.layout.id === "week-list" ? (
        <WeekListView model={model} colors={colors} />
      ) : (
        <YearGlance model={model} colors={colors} />
      )}
      {kinds.length > 0 && (
        <ul className="cc-legend" aria-label="Merkinnät">
          {kinds.map((k) => (
            <li key={k}>
              <i className={`cc-key cc-key-${k}`} style={{ background: { holiday: colors.holidayTint, closure: colors.closureTint, leave: colors.leaveTint, season: colors.seasonTint, school: colors.schoolTint }[k] }} aria-hidden="true" />
              {EVENT_KIND_LABELS_FI[k]}
            </li>
          ))}
        </ul>
      )}
      {locked && <div className="cc-watermark" aria-hidden="true" />}
    </div>
  );
}
