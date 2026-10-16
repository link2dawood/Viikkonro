import { useToday } from "../components/useToday";
import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { canonicalFor, routeMeta } from "../data/seo";
import { isoWeek, isoYear, weeksInIsoYear } from "../components/dateUtils";
import { HOLIDAY_DEFINITIONS } from "../data/holidayPages";

const PATH = "/api-playground";
const SITE = "https://viikkonro.fi";

// The four real /api/ endpoints, from docs/api.md — one shared source for
// both the displayed code examples and the live "Try it" fetch, so this
// page can't silently drift from what the API actually does.
const ENDPOINTS = {
  week: {
    label: "Viikko",
    apiPath: (p) => `/api/week/${p.week}/${p.year}.json`,
    dataPath: (p) => `/data/week/${p.year}/${p.week}.json`,
  },
  month: {
    label: "Kuukausi",
    apiPath: (p) => `/api/month/${p.month}/${p.year}.json`,
    dataPath: (p) => `/data/month/${p.year}/${p.month}.json`,
  },
  year: {
    label: "Vuosi",
    apiPath: (p) => `/api/year/${p.year}.json`,
    dataPath: (p) => `/data/year/${p.year}.json`,
  },
  holiday: {
    label: "Pyhäpäivä",
    apiPath: (p) => `/api/holiday/${p.slug}/${p.year}.json`,
    dataPath: (p) => `/data/holiday/${p.year}/${p.slug}.json`,
  },
};

function codeFor(lang, apiUrl) {
  const full = `${SITE}${apiUrl}`;
  if (lang === "curl") return `curl -L ${full}`;
  if (lang === "js") {
    return `const res = await fetch("${full}");\nconst data = await res.json();\nconsole.log(data);`;
  }
  if (lang === "php") {
    return `<?php\n$json = file_get_contents("${full}");\n$data = json_decode($json, true);\nprint_r($data);`;
  }
  if (lang === "python") {
    return `import requests\ndata = requests.get("${full}").json()\nprint(data)`;
  }
  return "";
}

const ApiPlayground = () => {
  const meta = routeMeta[PATH];
  const now = useToday();
  const year = isoYear(now);
  const week = isoWeek(now);
  const month = now.getMonth() + 1;

  const [endpoint, setEndpoint] = useState("week");
  const [params, setParams] = useState({
    week,
    month,
    year,
    slug: HOLIDAY_DEFINITIONS[11].slug, // itsenaisyyspaiva — a recognisable default
  });
  const [lang, setLang] = useState("curl");
  const [result, setResult] = useState(null); // { loading, error, status, contentType, cacheControl, body }

  const def = ENDPOINTS[endpoint];
  const apiUrl = def.apiPath(params);
  const dataUrl = def.dataPath(params);

  async function tryIt() {
    setResult({ loading: true });
    try {
      // Fetches /data/ directly, not /api/ — the /api/ redirect hop itself
      // carries no CORS header (only the final /data/ response does; see
      // docs/api.md), so a browser fetch to /api/ can fail cross-origin
      // here even though curl/server-side code (not subject to CORS at
      // all) can use either. The code examples below still show /api/,
      // since that's the documented developer-friendly path.
      const res = await fetch(`${SITE}${dataUrl}`);
      const body = await res.text();
      setResult({
        loading: false,
        status: res.status,
        contentType: res.headers.get("content-type"),
        cacheControl: res.headers.get("cache-control"),
        body,
      });
    } catch (err) {
      setResult({ loading: false, error: err.message });
    }
  }

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(PATH)} lang="fi" />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / API-kokeilu
      </div>
      <h1>API-kokeilu</h1>
      <p className="lead">
        <span className="answer-sentence">
          Kokeile Viikko Nron ilmaista ISO 8601 -viikkonumerorajapintaa
          suoraan selaimessa — ei kirjautumista, ei käyttörajoja.
        </span>{" "}
        cURL-, JavaScript-, PHP- ja Python-esimerkit alla päivittyvät, kun
        muutat parametreja.
      </p>

      <div className="pills" role="tablist" aria-label="Päätepiste">
        {Object.entries(ENDPOINTS).map(([key, e]) => (
          <button
            key={key}
            type="button"
            className={`pill ${endpoint === key ? "active" : ""}`}
            onClick={() => {
              setEndpoint(key);
              setResult(null);
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="lookup">
        {endpoint === "week" && (
          <>
            <label htmlFor="pg-week">Viikko</label>
            <input
              id="pg-week"
              type="number"
              min="1"
              max={weeksInIsoYear(params.year)}
              value={params.week}
              onChange={(e) => setParams({ ...params, week: e.target.value })}
            />
          </>
        )}
        {endpoint === "month" && (
          <>
            <label htmlFor="pg-month">Kuukausi</label>
            <input
              id="pg-month"
              type="number"
              min="1"
              max="12"
              value={params.month}
              onChange={(e) => setParams({ ...params, month: e.target.value })}
            />
          </>
        )}
        {endpoint === "holiday" && (
          <>
            <label htmlFor="pg-slug">Pyhäpäivä</label>
            <select
              id="pg-slug"
              value={params.slug}
              onChange={(e) => setParams({ ...params, slug: e.target.value })}
            >
              {HOLIDAY_DEFINITIONS.map((h) => (
                <option key={h.slug} value={h.slug}>
                  {h.displayName}
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="pg-year">Vuosi</label>
        <input
          id="pg-year"
          type="number"
          min="2020"
          max="2035"
          value={params.year}
          onChange={(e) => setParams({ ...params, year: e.target.value })}
        />
        <button type="button" className="btn" onClick={tryIt}>
          Kokeile
        </button>
      </div>

      <p className="note-soft">
        Pyynnön URL: <code>{apiUrl}</code> (ohjaa osoitteeseen{" "}
        <code>{dataUrl}</code>)
      </p>

      {result && (
        <div className="result">
          {result.loading && <div className="main-text">Ladataan…</div>}
          {result.error && (
            <div className="main-text">Pyyntö epäonnistui: {result.error}</div>
          )}
          {!result.loading && !result.error && (
            <>
              <div className="sub">
                Tila: {result.status} · Content-Type: {result.contentType} ·
                Cache-Control: {result.cacheControl}
              </div>
              <pre className="code-block">{result.body}</pre>
            </>
          )}
        </div>
      )}

      <div className="pills" role="tablist" aria-label="Koodiesimerkin kieli">
        {["curl", "js", "php", "python"].map((l) => (
          <button
            key={l}
            type="button"
            className={`pill ${lang === l ? "active" : ""}`}
            onClick={() => setLang(l)}
          >
            {l === "js" ? "JavaScript" : l === "php" ? "PHP" : l === "python" ? "Python" : "curl"}
          </button>
        ))}
      </div>
      <pre className="code-block">{codeFor(lang, apiUrl)}</pre>

      <div className="prose">
        <h2>Mitä tapahtuu virheellisellä pyynnöllä?</h2>
        <p>
          JSON-virhevastausta ei ole — alueen ulkopuolella oleva viikko,
          kuukausi tai vuosi ohjataan edelleen, mutta se palauttaa sitten
          404:n sivuston yleisellä HTML-virhesivulla, ei JSON-virhesisältöä.
          Tarkista parametrit dokumentoiduilta alueilta ennen kutsua sen
          sijaan, että päättelisit virheellisen pyynnön vastauksesta.
          Tarkemmat tiedot:{" "}
          <Link to="/avoin-data">Avoin data</Link>.
        </p>

        <h2>Usein kysyttyä</h2>
        <div className="faq-list">
          <details open>
            <summary>Onko käytössä nopeusrajoitus?</summary>
            <p>Ei — nämä ovat CDN:stä tarjoiltavia staattisia tiedostoja, ei nopeusrajoitettua rajapintaa.</p>
          </details>
          <details>
            <summary>Tarvitsenko API-avaimen?</summary>
            <p>Mikään päätepiste ei vaadi tunnistautumista.</p>
          </details>
          <details>
            <summary>Miksi tämä demo hakee osoitteesta /data/ eikä /api/?</summary>
            <p>
              /api/-ohjaus ei itsessään sisällä CORS-otsaketta (vain
              lopullinen /data/-vastaus sisältää), joten selaimesta tehty
              haku osoitteeseen /api/ voi epäonnistua cross-origin-pyynnössä
              muualta isännöidyltä sivulta. Palvelinpuolen koodi (curl, PHP,
              Python, Node) ei ole CORS:in alainen lainkaan, joten siellä
              toimii kumpi URL tahansa — katso yllä olevat koodiesimerkit,
              jotka käyttävät /api/:a, dokumentoitua kehittäjäystävällistä
              polkua.
            </p>
          </details>
        </div>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          <Link className="ql" to="/avoin-data">
            <b>Avoin data</b>
            <span>Kenttäkohtainen skeemadokumentaatio</span>
          </Link>
          <Link className="ql" to="/tietolahteet">
            <b>Tietolähteet</b>
            <span>Mistä taustalla oleva data on peräisin</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ApiPlayground;
