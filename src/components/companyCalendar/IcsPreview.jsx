import { isoWeek } from "../dateUtils";
import { EVENT_KIND_LABELS_FI } from "../../platform/calendar/events";
import { companyIcsEvents } from "../../platform/export/companyIcs";

const dateLabel = (date) => `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
export default function IcsPreview({ model, locked, calendarId, paydayRows }) {
  // The deterministic SSR namespace is used only for preview keys, never downloads.
  const events = companyIcsEvents(model, calendarId ?? "00000000000000000000000000000000", { paydayRows }).filter((event) => event.kind !== "week");
  return <div className="cc-preview" data-clarity-mask="True">
    {locked && <p className="cc-banner">ESIKATSELU</p>}
    <p>ICS-tiedostossa on {events.length} päivämerkintää ja ISO-viikkonumerot maanantaisin. Päällekkäiset eri merkinnät säilyvät.</p>
    <div style={{ maxHeight: "36rem", overflow: "auto" }}>
      <table><thead><tr><th scope="col">Päivä</th><th scope="col">Vk</th><th scope="col">Merkintä</th></tr></thead>
        <tbody>{events.map((event) => <tr key={event.uid}>
          <td>{dateLabel(event.date)}{event.endDate && event.endDate > event.date && <> - {dateLabel(event.endDate)}</>}</td>
          <td>{isoWeek(event.date)}</td>
          <td>{event.summary}<small> ({EVENT_KIND_LABELS_FI[event.kind]})</small></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
