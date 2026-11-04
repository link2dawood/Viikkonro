import { useId, useState } from "react";
import { isoWeek } from "../dateUtils";
import { EVENT_KIND_LABELS_FI } from "../../platform/calendar/events";
import { companyIcsEvents, isCalendarIdentity } from "../../platform/export/companyIcs";
import Preview from "./Preview";

const dateLabel = (date) => `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;

export default function IcsPreview({ model, locked, calendarId, paydayRows }) {
  const [tab, setTab] = useState("calendar");
  const tabListId = useId();

  const safeCalendarId = isCalendarIdentity(calendarId) ? calendarId : "00000000000000000000000000000000";

  let events;
  try {
    events = companyIcsEvents(model, safeCalendarId, { paydayRows }).filter((event) => event.kind !== "week");
  } catch {
    // Graceful fallback for preview if an event collision occurs during active form typing
    events = (model.events || [])
      .filter((event) => event.kind !== "week")
      .map((event, idx) => ({
        uid: `${safeCalendarId}-fallback-${idx}@viikkonro.fi`,
        date: event.date,
        endDate: event.endDate,
        summary: event.title,
        kind: event.kind,
      }));
  }

  return (
    <div className="cc-preview" data-clarity-mask="True">
      {locked && <p className="cc-banner">ESIKATSELU</p>}

      <div className="cc-view-toggle" role="tablist" aria-label="Esikatselun näkymä" id={tabListId}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "calendar"}
          className={`btn btn-sm ${tab === "calendar" ? "btn-active" : "btn-ghost"}`}
          onClick={() => setTab("calendar")}
        >
          Kalenterinäkymä
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "events"}
          className={`btn btn-sm ${tab === "events" ? "btn-active" : "btn-ghost"}`}
          onClick={() => setTab("events")}
        >
          ICS-tapahtumat ({events.length})
        </button>
      </div>

      {tab === "calendar" ? (
        <div className="cc-calendar-tab-content">
          <Preview model={model} locked={locked} hasLogo={false} logo={null} />
          <p className="note-soft" style={{ marginTop: 12 }}>
            ICS-tiedostossa on {events.length} päivämerkintää ja ISO-viikkonumerot maanantaisin. Päällekkäiset eri merkinnät säilyvät.{" "}
            <button type="button" className="btn-link" onClick={() => setTab("events")}>
              Näytä ICS-tapahtumaluettelo ({events.length}) ›
            </button>
          </p>
        </div>
      ) : (
        <div className="cc-frame cc-events-tab-content">
          <header className="cc-head">
            <div>
              <p className="cc-company">{model.config.branding.companyName || "Yrityksen ICS-kalenteri"}</p>
              <p className="cc-sub">ICS-tiedoston sisältö ({events.length} merkintää)</p>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setTab("calendar")}>
              ‹ Kalenterinäkymään
            </button>
          </header>

          <p>ICS-tiedostossa on {events.length} päivämerkintää ja ISO-viikkonumerot maanantaisin. Päällekkäiset eri merkinnät säilyvät.</p>

          <div className="cc-ics-table-wrap">
            <table className="cc-ics-table">
              <thead>
                <tr>
                  <th scope="col">Päivä</th>
                  <th scope="col">Vk</th>
                  <th scope="col">Merkintä</th>
                  <th scope="col">Tyyppi</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.uid}>
                    <td>
                      {dateLabel(event.date)}
                      {event.endDate && event.endDate > event.date && <> - {dateLabel(event.endDate)}</>}
                    </td>
                    <td>{isoWeek(event.date)}</td>
                    <td>{event.summary}</td>
                    <td>
                      <span className={`cc-tag cc-tag--${event.kind}`}>
                        {EVENT_KIND_LABELS_FI[event.kind] || event.kind}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {locked && <div className="cc-watermark" aria-hidden="true" />}
        </div>
      )}
    </div>
  );
}
