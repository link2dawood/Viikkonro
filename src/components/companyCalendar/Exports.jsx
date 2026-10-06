import { Link } from "react-router-dom";

const FORMATS = [
  { kind: "pdf", label: "Lataa PDF", hint: "Tulostusvalmis" },
  { kind: "xlsx", label: "Lataa Excel", hint: "Päivät, tapahtumat ja viikot" },
  { kind: "csv", label: "Lataa CSV", hint: "Excel-yhteensopiva" },
  { kind: "ics", label: "Lataa ICS", hint: "Google, Outlook, iPhone" },
];

// `devPanel` and `devNote` are passed only by a development build (the page builds
// them behind import.meta.env.DEV), so production code contains no unlock path.
export default function Exports({ unlocked, busy, message, warnings, unlockOpen, devPanel, devNote, onExport, onContactClick }) {
  return (
    <div className="cc-exports">
      <h2>Lataa kalenteri</h2>
      {!unlocked && (
        <p className="note-soft">
          Esikatselu on ilmainen. Tiedostot, logo ja oma väri avautuvat maksun jälkeen.
        </p>
      )}
      <div className="cc-buttons">
        {FORMATS.map((f) => (
          <button key={f.kind} type="button" className="btn" disabled={busy !== null} onClick={() => onExport(f.kind)}>
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
          {devPanel ?? (
            <>
              <p><b>Maksaminen ei ole vielä käytössä.</b> Tiedostojen lataus avataan, kun maksu on otettu käyttöön. Jos haluat kalenterin yrityksellesi, kerro siitä meille.</p>
              <Link className="btn" to="/ota-yhteytta" onClick={onContactClick}>Ota yhteyttä</Link>
            </>
          )}
        </div>
      )}
      {unlocked && devNote}
    </div>
  );
}
