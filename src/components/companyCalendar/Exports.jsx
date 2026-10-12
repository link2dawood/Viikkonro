import { Link } from "react-router-dom";

const FORMATS = [
  { kind: "pdf", label: "Lataa PDF", hint: "Tulostusvalmis" },
  { kind: "xlsx", label: "Lataa Excel", hint: "Päivät, tapahtumat ja viikot" },
  { kind: "csv", label: "Lataa CSV", hint: "Excel-yhteensopiva" },
  { kind: "ics", label: "Lataa ICS", hint: "Google, Outlook, iPhone" },
];

// `devPanel` and `devNote` are passed only by a development build (the page builds
// them behind import.meta.env.DEV), so production code contains no unlock path.
export default function Exports({ unlocked, busy, message, warnings, unlockOpen, devPanel, devNote, onExport, onContactClick, paymentAvailable = false, unavailableMessage = "Tämän tuotteen maksullisia latauksia ei vielä myydä. Esikatselu on käytettävissä.", icsOnly = false, formats = ["pdf", "xlsx", "csv", "ics"] }) {
  return (
    <div className="cc-exports">
      <h2>Lataa kalenteri</h2>
      {!unlocked && (
        <p className="note-soft">
          {paymentAvailable ? "Esikatselu on ilmainen. Osto avaa valitun vuoden PDF-, Excel-, CSV- ja ICS-lataukset." : unavailableMessage}
        </p>
      )}
      <div className="cc-buttons">
        {FORMATS.filter((f) => formats.includes(f.kind) && (!icsOnly || f.kind === "ics")).map((f) => (
          <button key={f.kind} type="button" className="btn" aria-label={f.label} aria-description={f.hint} disabled={busy !== null} onClick={() => onExport(f.kind)}>
            {!unlocked && <span aria-hidden="true">🔒 </span>}
            {busy === f.kind ? "Luodaan..." : f.label}
            <small>{f.hint}</small>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="cc-status">{message}</p>
      {warnings.length > 0 && (
        <ul className="cc-notes-list">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      {!unlocked && unlockOpen && (
        <div className="cc-unlock" role="region" aria-label="Lataukset">
          {devPanel ?? (paymentAvailable ? <p>Osta lataukset alla olevalla painikkeella tai palauta aiempi osto ostotunnuksella.</p> : (
            <>
              <p>{unavailableMessage}</p>
              <Link className="btn" to="/ota-yhteytta" onClick={onContactClick}>Ota yhteyttä</Link>
            </>
          ))}
        </div>
      )}
      {unlocked && devNote}
    </div>
  );
}
