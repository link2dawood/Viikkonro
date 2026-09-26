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
    label: "Week",
    apiPath: (p) => `/api/week/${p.week}/${p.year}.json`,
    dataPath: (p) => `/data/week/${p.year}/${p.week}.json`,
  },
  month: {
    label: "Month",
    apiPath: (p) => `/api/month/${p.month}/${p.year}.json`,
    dataPath: (p) => `/data/month/${p.year}/${p.month}.json`,
  },
  year: {
    label: "Year",
    apiPath: (p) => `/api/year/${p.year}.json`,
    dataPath: (p) => `/data/year/${p.year}.json`,
  },
  holiday: {
    label: "Holiday",
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
      <SEO {...meta} canonical={canonicalFor(PATH)} lang="en" />
      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> / API Playground
      </div>
      <h1>API Playground</h1>
      <p className="lead">
        <span className="answer-sentence">
          Test Viikko Nro&apos;s free ISO 8601 week-number API live in your
          browser — no auth, no rate limit.
        </span>{" "}
        cURL, JavaScript, PHP and Python examples below update as you
        change the parameters.
      </p>

      <div className="pills" role="tablist" aria-label="Endpoint">
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
            <label htmlFor="pg-week">Week</label>
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
            <label htmlFor="pg-month">Month</label>
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
            <label htmlFor="pg-slug">Holiday</label>
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
        <label htmlFor="pg-year">Year</label>
        <input
          id="pg-year"
          type="number"
          min="2020"
          max="2035"
          value={params.year}
          onChange={(e) => setParams({ ...params, year: e.target.value })}
        />
        <button type="button" className="btn" onClick={tryIt}>
          Try it
        </button>
      </div>

      <p className="note-soft">
        Request URL: <code>{apiUrl}</code> (redirects to{" "}
        <code>{dataUrl}</code>)
      </p>

      {result && (
        <div className="result">
          {result.loading && <div className="main-text">Loading…</div>}
          {result.error && (
            <div className="main-text">Request failed: {result.error}</div>
          )}
          {!result.loading && !result.error && (
            <>
              <div className="sub">
                Status: {result.status} · Content-Type: {result.contentType} ·
                Cache-Control: {result.cacheControl}
              </div>
              <pre className="code-block">{result.body}</pre>
            </>
          )}
        </div>
      )}

      <div className="pills" role="tablist" aria-label="Code example language">
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
        <h2>What happens with an invalid request?</h2>
        <p>
          There&apos;s no JSON error envelope — an out-of-range week, month
          or year still redirects, then 404s with the site&apos;s generic
          HTML error page, not a JSON error body. Validate parameters
          against the documented ranges before calling, rather than
          parsing the response to detect an invalid request. Full detail:{" "}
          <Link to="/avoin-data">Avoin data</Link>.
        </p>

        <h2>Usein kysyttyä</h2>
        <div className="faq-list">
          <details open>
            <summary>Is there a rate limit?</summary>
            <p>No — these are static files served from a CDN, not a rate-limited API.</p>
          </details>
          <details>
            <summary>Do I need an API key?</summary>
            <p>No authentication is required for any endpoint.</p>
          </details>
          <details>
            <summary>Why does this demo fetch /data/ instead of /api/?</summary>
            <p>
              The /api/ redirect hop itself carries no CORS header (only
              the final /data/ response does), so a browser fetch to
              /api/ can fail cross-origin from a page hosted elsewhere.
              Server-side code (curl, PHP, Python, Node) isn&apos;t
              subject to CORS at all, so either URL works there — see the
              code examples above, which use /api/, the documented
              developer-friendly path.
            </p>
          </details>
        </div>

        <h2>Aiheeseen liittyviä sivuja</h2>
        <div className="quicklinks">
          <Link className="ql" to="/avoin-data">
            <b>Avoin data</b>
            <span>Full field-by-field schema documentation</span>
          </Link>
          <Link className="ql" to="/tietolahteet">
            <b>Tietolähteet</b>
            <span>Where the underlying data comes from</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ApiPlayground;
