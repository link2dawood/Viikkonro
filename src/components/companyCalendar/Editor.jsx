import { LAYOUT_OPTIONS, PAYDAY_RULES } from "../../data/companyCalendar.js";
import { schoolHolidayCities, schoolHolidayCoverage } from "../../platform/calendar/sources.js";
import { PAPER } from "../../platform/design/layouts.js";
import { newRowId, MAX_CLOSURES, issueToFinnish } from "./formModel.js";
import { validateBranding } from "../../platform/design/branding.js";
import { MAX_COMPANY_EVENTS, MAX_PAYDAY_DATES } from "../../platform/calendar/config.js";

const MAX_LOGO_FILE = 512 * 1024;

function readLogo(file) {
  return new Promise((resolve) => {
    if (!file) return resolve({ error: null, logo: null });
    if (!["image/png", "image/svg+xml"].includes(file.type)) {
      return resolve({ error: "Valitse PNG- tai SVG-tiedosto.", logo: null });
    }
    if (file.size > MAX_LOGO_FILE) {
      return resolve({ error: "Logo on liian suuri. Enimmäiskoko on 512 kt.", logo: null });
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ error: null, logo: { mime: file.type, dataUri: String(reader.result) } });
    reader.onerror = () => resolve({ error: "Tiedoston lukeminen epäonnistui.", logo: null });
    reader.readAsDataURL(file);
  });
}

const Section = ({ n, title, hint, children }) => (
  <fieldset className="lookup cc-section">
    <legend>
      <span className="cc-step">{n}</span> {title}
    </legend>
    {hint && <p className="note-soft">{hint}</p>}
    {children}
  </fieldset>
);

export default function Editor({ form, setForm, years, logoError, setLogoError, notes, onClearDraft }) {
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setRow = (key, id, patch) => setForm((f) => ({ ...f, [key]: f[key].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const addRow = (key, row) => setForm((f) => ({ ...f, [key]: [...f[key], { id: newRowId(), ...row }] }));
  const removeRow = (key, id) => setForm((f) => ({ ...f, [key]: f[key].filter((r) => r.id !== id) }));

  const cities = schoolHolidayCities(form.year);
  const coverage = form.schoolCity ? schoolHolidayCoverage(form.year, form.schoolCity) : null;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const { error, logo } = await readLogo(file);
    // The same safety checks the calendar itself applies, shown in Finnish before the logo is kept.
    const issues = logo ? validateBranding({ logo }).issues : [];
    setLogoError(error ?? (issues.length ? issueToFinnish(issues[0]) : null));
    if (logo && issues.length === 0) set({ logo });
  };

  return (
    <div className="cc-editor">
      <Section n="1" title="Yrityksen tiedot" hint="Nimi ja logo näkyvät kalenterin ylälaidassa.">
        <div className="two-fields">
          <div>
            <label htmlFor="cc-name">Yrityksen nimi</label>
            <input id="cc-name" maxLength={80} autoComplete="organization" value={form.companyName} onChange={(e) => set({ companyName: e.target.value })} />
          </div>
          <div>
            <label htmlFor="cc-year">Kalenterin vuosi</label>
            <select id="cc-year" value={form.year} onChange={(e) => set({ year: Number(e.target.value), schoolCity: "" })}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="two-fields">
          <div>
            <label htmlFor="cc-logo">Logo (PNG tai SVG, enintään 512 kt)</label>
            <input id="cc-logo" type="file" accept="image/png,image/svg+xml" onChange={onFile} />
            {logoError && <p className="cc-error" role="alert">{logoError}</p>}
            {form.logo && (
              <p className="cc-logo-row">
                <img src={form.logo.dataUri} alt="Valittu logo" />
                <button type="button" className="btn-ghost" onClick={() => set({ logo: null })}>Poista logo</button>
              </p>
            )}
          </div>
          <div>
            <label htmlFor="cc-color">Pääväri</label>
            <input id="cc-color" type="color" value={form.color} onChange={(e) => set({ color: e.target.value })} />
          </div>
        </div>
        <fieldset className="cc-radios">
          <legend>Asettelu</legend>
          {LAYOUT_OPTIONS.map((o) => (
            <label key={o.id} className="cc-radio">
              <input type="radio" name="cc-layout" checked={form.layout === o.id} onChange={() => set({ layout: o.id })} />
              <span><b>{o.name}</b><small>{o.hint}</small></span>
            </label>
          ))}
        </fieldset>
        <div className="two-fields">
          <div>
            <label htmlFor="cc-paper">Paperikoko</label>
            <select id="cc-paper" value={form.paper} onChange={(e) => set({ paper: e.target.value })}>
              {Object.keys(PAPER).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section n="2" title="Sulkupäivät ja tärkeät päivät" hint="Esimerkiksi kesäsulku, yhtiökokous tai kehityspäivä. Loppupäivän voi jättää tyhjäksi, jos päivä on yksittäinen.">
        <h3>Sulkupäivät</h3>
        {form.closures.map((r) => (
          <div className="cc-row" key={r.id}>
            <input aria-label="Sulkupäivän nimi" placeholder="Nimi, esim. Kesäsulku" maxLength={120} value={r.label} onChange={(e) => setRow("closures", r.id, { label: e.target.value })} />
            <input type="date" aria-label="Alkaa" value={r.start} onChange={(e) => setRow("closures", r.id, { start: e.target.value })} />
            <input type="date" aria-label="Päättyy" value={r.end} min={r.start || undefined} onChange={(e) => setRow("closures", r.id, { end: e.target.value })} />
            <button type="button" className="btn-ghost" onClick={() => removeRow("closures", r.id)} aria-label="Poista sulkupäivä">Poista</button>
          </div>
        ))}
        {form.closures.length < MAX_CLOSURES && (
          <button type="button" className="btn-ghost" onClick={() => addRow("closures", { label: "", start: "", end: "" })}>+ Lisää sulkupäivä</button>
        )}
        <h3>Yrityksen tapahtumat</h3>
        {form.events.map((r) => (
          <div className="cc-row" key={r.id}>
            <input type="date" aria-label="Päivä" value={r.date} onChange={(e) => setRow("events", r.id, { date: e.target.value })} />
            <input aria-label="Tapahtuman nimi" placeholder="Nimi, esim. Yhtiökokous" maxLength={120} value={r.title} onChange={(e) => setRow("events", r.id, { title: e.target.value })} />
            <button type="button" className="btn-ghost" onClick={() => removeRow("events", r.id)} aria-label="Poista tapahtuma">Poista</button>
          </div>
        ))}
        {form.events.length < MAX_COMPANY_EVENTS && (
          <button type="button" className="btn-ghost" onClick={() => addRow("events", { date: "", title: "" })}>+ Lisää tapahtuma</button>
        )}
        <h3>Lomakausi</h3>
        <label className="cc-check">
          <input type="checkbox" checked={form.seasonOn} onChange={(e) => set({ seasonOn: e.target.checked })} />
          Merkitse yrityksen lomakausi kalenteriin
        </label>
        {form.seasonOn && (
          <div className="cc-row">
            <input aria-label="Lomakauden nimi" maxLength={120} value={form.season.label} onChange={(e) => set({ season: { ...form.season, label: e.target.value } })} />
            <input type="date" aria-label="Lomakausi alkaa" value={form.season.start} onChange={(e) => set({ season: { ...form.season, start: e.target.value } })} />
            <input type="date" aria-label="Lomakausi päättyy" value={form.season.end} min={form.season.start || undefined} onChange={(e) => set({ season: { ...form.season, end: e.target.value } })} />
          </div>
        )}
      </Section>

      <Section n="3" title="Palkkapäivät" hint="Jos sovittu päivä ei ole pankkipäivä, palkkapäivä siirtyy edelliseen pankkipäivään.">
        <fieldset className="cc-radios">
          <legend className="cc-sr">Palkkapäivän sääntö</legend>
          {PAYDAY_RULES.map((o) => (
            <label key={o.id} className="cc-radio">
              <input type="radio" name="cc-payday" checked={form.paydayRule === o.id} onChange={() => set({ paydayRule: o.id })} />
              <span><b>{o.name}</b></span>
            </label>
          ))}
        </fieldset>
        {form.paydayRule === "day" && (
          <div className="two-fields">
            <div>
              <label htmlFor="cc-payday-day">Kuukauden päivä</label>
              <input id="cc-payday-day" type="number" min="1" max="31" inputMode="numeric" value={form.paydayDay} onChange={(e) => set({ paydayDay: e.target.value })} />
            </div>
          </div>
        )}
        <h3>Yksittäiset palkkapäivät</h3>
        {form.paydayDates.map((r) => (
          <div className="cc-row" key={r.id}>
            <input type="date" aria-label="Palkkapäivä" value={r.date} onChange={(e) => setRow("paydayDates", r.id, { date: e.target.value })} />
            <button type="button" className="btn-ghost" onClick={() => removeRow("paydayDates", r.id)} aria-label="Poista palkkapäivä">Poista</button>
          </div>
        ))}
        {form.paydayDates.length < MAX_PAYDAY_DATES && (
          <button type="button" className="btn-ghost" onClick={() => addRow("paydayDates", { date: "" })}>+ Lisää palkkapäivä</button>
        )}
      </Section>

      <Section n="4" title="Suomen päivät" hint="Viikkonumerot näkyvät aina. Päivät tulevat samasta tiedosta kuin sivuston muut kalenterit.">
        <label className="cc-check">
          <input type="checkbox" checked={form.holidays} onChange={(e) => set({ holidays: e.target.checked })} />
          Suomen pyhäpäivät
        </label>
        <label className="cc-check">
          <input type="checkbox" checked={form.flagDays} onChange={(e) => set({ flagDays: e.target.checked })} />
          Liputuspäivät
        </label>
        <label className="cc-check">
          <input type="checkbox" checked={form.schoolOn} disabled={cities.length === 0} onChange={(e) => set({ schoolOn: e.target.checked })} />
          Koululomat
        </label>
        {cities.length === 0 && <p className="note-soft">Koululomatietoja ei ole vielä vuodelle {form.year}.</p>}
        {form.schoolOn && cities.length > 0 && (
          <div className="two-fields">
            <div>
              <label htmlFor="cc-city">Kaupunki</label>
              <select id="cc-city" value={form.schoolCity} onChange={(e) => set({ schoolCity: e.target.value })}>
                <option value="">Valitse kaupunki</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {coverage && (
          <p className="note-soft">
            Hiihtoloma: {coverage.winter ? "tiedossa" : "ei vahvistettu"}. Syysloma: {coverage.autumn ? "tiedossa" : "ei vahvistettu"}. Tarkista oman koulusi päivät.
          </p>
        )}
      </Section>

      {notes.length > 0 && (
        <ul className="cc-notes-list" aria-live="polite">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      <p className="note-soft">
        Luonnos tallentuu vain tämän selaimen muistiin, eikä tietoja lähetetä palvelimelle.{" "}
        <button type="button" className="btn-link" onClick={onClearDraft}>Tyhjennä luonnos</button>
      </p>
    </div>
  );
}
