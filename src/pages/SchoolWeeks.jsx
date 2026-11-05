import { useState } from "react";
import { Link } from "react-router-dom";
import { useToday } from "../components/useToday.js";
import { isoYear } from "../components/dateUtils.js";
import SEO from "../components/SEO.jsx";
import AdSlot from "../components/AdSlot.jsx";
import { canonicalFor, CONTENT_UPDATED_FI, routeMeta } from "../data/seo.js";
import {
  schoolWeeksStats,
  schoolWeeksFaqs,
} from "../data/vacationSchoolContent.js";

const PATH = "/kuinka-monta-viikkoa-lukuvuodessa";

export default function SchoolWeeks() {
  const meta = routeMeta[PATH];
  const today = useToday();
  const currentYear = isoYear(today);
  const stats = schoolWeeksStats(currentYear);
  const faqs = schoolWeeksFaqs(currentYear);

  const [selectedRegion, setSelectedRegion] = useState("region1");

  const winterBreakWeek =
    selectedRegion === "region1" ? "Viikko 8 (Etelä-Suomi)" :
    selectedRegion === "region2" ? "Viikko 9 (Väli-Suomi)" : "Viikko 10 (Itä- ja Pohjois-Suomi)";

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / Lukuvuoden viikot
      </div>

      <h1>Kuinka monta viikkoa lukuvuodessa on?</h1>

      <div className="prose">
        <p className="lead">
          <strong>
            Suomen peruskouluissa ja lukioissa lukuvuosi kestää noin 38–39 kouluviikkoa.
            Perusopetuslain mukaan lukuvuodessa on 190 työpäivää (noin 187–188 päivää arkipyhien vähennyksen jälkeen).
            Koululaisten kesäloma kestää noin 10 viikkoa.
          </strong>
        </p>

        <div className="panel">
          <div className="now-label">Lukuvuosi ja koulujen lomat pähkinänkuoressa</div>
          <ul>
            <li><strong>Kouluviikot yhteensä:</strong> noin 38–39 viikkoa vuodessa.</li>
            <li><strong>Koulupäivät:</strong> 190 työpäivää laissa (itsenäisyyspäivä, loppiainen ja vappu vähentävät päiviä, jos osuvat arkipäivälle).</li>
            <li><strong>Syyslukukausi:</strong> noin 18–19 viikkoa (elokuun puolivälistä jouluun).</li>
            <li><strong>Kevätlukukausi:</strong> noin 19–20 viikkoa (tammikuun alusta kesäkuun alkuun).</li>
            <li><strong>Kesäloma:</strong> noin 10 viikkoa (kesäkuun alusta elokuun puoliväliin).</li>
            <li><strong>Lomat lukuvuoden aikana:</strong> syysloma (1 vk), joululoma (1,5–2 vk), talviloma (1 vk) ja pääsiäisloma (4 pv).</li>
          </ul>
        </div>

        <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

        <h2>Koulujen lomat lukuvuonna {stats.schoolYearLabel}</h2>
        <p>
          Lukuvuoteen kuuluu opetuksen lisäksi neljä loma-aikaa:
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loma</th>
                <th>Kesto</th>
                <th>Ajankohta</th>
              </tr>
            </thead>
            <tbody>
              {stats.vacations.map((v) => (
                <tr key={v.name}>
                  <td><strong>{v.name}</strong></td>
                  <td>{v.duration}</td>
                  <td>
                    {v.name.includes("Talviloma") ? (
                      <Link to={`/koululomat-${currentYear}`}>Viikot 8, 9 tai 10 (katso kaupungit)</Link>
                    ) : v.name.includes("Kesäloma") ? (
                      "Viikot 23–32/33"
                    ) : v.name.includes("Syysloma") ? (
                      "Viikko 42 tai 43"
                    ) : (
                      "Viikot 52–1"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdSlot placement="school-weeks-after-answer" />

        <h2>Tarkista talvilomaviikkosi (hiihtoloma)</h2>
        <p>
          Talviloma (viikko 8, 9 tai 10) jaetaan Suomessa kolmeen porrastettuun jaksoon ruuhkien välttämiseksi:
        </p>

        <div className="panel lookup" style={{ marginTop: "14px", marginBottom: "24px" }}>
          <label htmlFor="sw-region-select">Valitse asuinalueesi</label>
          <select
            id="sw-region-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ marginTop: "6px", width: "100%", padding: "8px", maxWidth: "340px" }}
          >
            <option value="region1">Etelä-Suomi (Helsinki, Espoo, Vantaa, Turku, Tampere)</option>
            <option value="region2">Väli-Suomi (Pori, Jyväskylä, Lahti, Mikkeli)</option>
            <option value="region3">Itä- ja Pohjois-Suomi (Kuopio, Joensuu, Oulu, Rovaniemi)</option>
          </select>

          <p style={{ marginTop: "12px", fontSize: "1.1rem" }}>
            Talvilomasi ajankohta: <strong>{winterBreakWeek}</strong>.
          </p>
        </div>

        <h2>Mihin lukuvuoden pituus perustuu?</h2>
        <p>
          Suomessa koulujen työajasta säädetään <strong>perusopetuslain 23 §:ssä</strong>:
        </p>
        <blockquote>
          <em>"Lukuvuodessa on 190 työpäivää. Lukuvuoden työpäivistä vähennetään kuitenkin muuksi arkipäiväksi kuin lauantaiksi sattuva itsenäisyyspäivä, loppiainen ja vapunpäivä."</em>
        </blockquote>
        <p>
          Lukuvuoden koulutyö päättyy aina viikon 22 viimeisenä arkipäivänä (lauantaina touko-kesäkuun vaihteessa).
          Syyslukukauden alkamispäivästä päättää kukin kunta itsenäisesti, useimmiten viikolla 32 tai 33 (elokuun 8.–15. päivän tienoilla).
        </p>

        <h2>Usein kysyttyä lukuvuoden viikoista</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>

        <p className="hub-links">
          Katso myös vahvistetut kaupunkikohtaiset lomat sivulta <Link to={`/koululomat-${currentYear}`}>koululomat {currentYear}</Link>,{" "}
          <Link to={`/koululomat-${currentYear + 1}`}>koululomat {currentYear + 1}</Link>,{" "}
          <Link to="/kuinka-monta-viikkoa-vuodessa">kuinka monta viikkoa vuodessa on</Link> ja{" "}
          <Link to={`/kalenteri-${currentYear}`}>kalenteri {currentYear}</Link>.
        </p>
      </div>
    </section>
  );
}
