import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import NotFound from "./NotFound";
import { canonicalFor, templatePdfPath } from "../data/seo";
import { trackPlatformEvent } from "../analytics";
import { downloadBlob } from "../platform/export/download";
import { staticTemplateProvider } from "../platform/templates/access";
import { buildTemplateWorkbook, templateCellText } from "../platform/templates/workbook";
import { TEMPLATE_PATH, TEMPLATE_CATEGORIES, TEMPLATE_FORMATS, TEMPLATES, templateBySlug, templateCatalogMeta, templateCategory, templatePath, filterTemplates } from "../platform/templates/catalog";
import css from "../components/templates/templates.css?raw";

const event = (name, template, extra = {}) => trackPlatformEvent(name, { source: template ? template.id : "catalog", ...extra });

export function TemplateCatalog() {
  const [category, setCategory] = useState("all");
  const [format, setFormat] = useState("all");
  const templates = filterTemplates({ category, format });
  useEffect(() => { event("template_view"); }, []);
  return <div className="tpl-page">
    <SEO {...templateCatalogMeta} canonical={canonicalFor(TEMPLATE_PATH)} />
    <style>{css}</style>
    <nav aria-label="Murupolku"><Link to="/">Etusivu</Link> / Kalenteripohjat</nav>
    <header className="tpl-hero"><p className="tpl-eyebrow">Valmiit pohjat työsi tueksi</p><h1>Kalenteri- ja suunnittelupohjat</h1>
      <p>Lataa selkeä pohja ja aloita suunnittelu Excelissä, Google Sheetsissä tai paperilla. ISO-viikot ja Suomen pyhäpäivät ovat valmiina.</p>
      <p>Ensimmäinen kokoelma on maksuton. Ei tiliä, tilausta tai vesileimaa. Saatavilla vuodet 2026, 2027 ja 2028.</p>
      <Link to="/yrityskalenteri">Tarvitsetko kalenterin yrityksen logolla? Avaa Yrityskalenteri.</Link>
    </header>
    <section aria-label="Rajaa pohjia" className="tpl-filters">
      <label>Kategoria<select aria-label="Kategoria" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Kaikki kategoriat</option>{TEMPLATE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Tiedostomuoto<select aria-label="Tiedostomuoto" value={format} onChange={(e) => setFormat(e.target.value)}><option value="all">Kaikki tiedostomuodot</option>{Object.entries(TEMPLATE_FORMATS).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}</select></label>
      <p aria-live="polite">{templates.length} pohjaa</p>
    </section>
    <div className="tpl-grid">{templates.map((template) => <article key={template.id} className="tpl-card">
      <p className="tpl-eyebrow">{templateCategory(template.category).name}</p><h2><Link to={templatePath(template)} onClick={() => event("template_cta", template)}>{template.finnishName}</Link></h2>
      <p>{template.description}</p><p className="tpl-tags">{template.tags.join(" · ")}</p><p><strong>Maksuton</strong> · XLSX / CSV / PDF</p>
      <Link className="tpl-button" to={templatePath(template)} onClick={() => event("template_cta", template)}>Tutustu ja lataa</Link>
    </article>)}</div>
    <section className="tpl-help"><h2>Valitse käyttötapaan sopiva tiedosto</h2><p>Excel-pohjassa on muokattava suunnitelma, ohjeet ja päivämääräviite. Voit tuoda sen myös Google Sheetsiin. CSV sopii tietojen siirtämiseen omaan järjestelmään: se sisältää suunnitelman rivit puolipisteellä eroteltuina. PDF on valmis tuloste käsin täytettäväksi tai vuoden yleiskuvaksi.</p>
      <p>Pohjat eivät sisällä makroja. Tyhjät kentät on tarkoitettu omille tiedoillesi. Täytetyt tiedostot pysyvät omassa käytössäsi, eikä niitä ladata Viikkonro-palveluun.</p>
    </section>
  </div>;
}

export function TemplateLanding() {
  const { slug } = useParams();
  const template = templateBySlug(slug);
  return template ? <TemplateDetail key={template.id} template={template} /> : <NotFound />;
}

function TemplateDetail({ template }) {
  const [year, setYear] = useState(template.yearApplicability.defaultYear);
  const [preview, setPreview] = useState(true);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");
  const workbook = useMemo(() => buildTemplateWorkbook(template, year), [template, year]);
  useEffect(() => { event("template_view", template); }, [template]);
  useEffect(() => { if (preview) event("template_preview", template, { year }); }, [template, year, preview]);
  const download = async (e, format, downloadYear = year) => {
    event("template_cta", template, { year: downloadYear, export_type: format });
    // Keep visible static links useful without JavaScript and for new-tab actions.
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (busy) return;
    setBusy(format); setMessage("");
    try {
      const access = await staticTemplateProvider.resolveDownload({ template, year: downloadYear, format });
      if (access.status !== "granted") { setMessage(access.reason); return; }
      const response = await fetch(access.url);
      if (!response.ok) throw new Error("Download unavailable");
      const bytes = new Uint8Array(await response.arrayBuffer());
      const expected = format === "pdf" ? "%PDF-" : format === "xlsx" ? "PK" : "\uFEFF";
      if (!new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes.slice(0, 8)).startsWith(expected)) throw new Error("Invalid download");
      downloadBlob(`${template.slug}-${downloadYear}.${format}`, bytes, TEMPLATE_FORMATS[format].mime);
      event("template_download", template, { year: downloadYear, export_type: format });
      setMessage(`${TEMPLATE_FORMATS[format].label} on ladattu.`);
    } catch {
      setMessage("Lataus ei onnistunut. Yritä uudelleen hetken kuluttua.");
    } finally { setBusy(null); }
  };
  return <div className="tpl-page">
    <SEO {...template.seo} canonical={canonicalFor(templatePath(template))} /><style>{css}</style>
    <nav aria-label="Murupolku"><Link to="/">Etusivu</Link> / <Link to={TEMPLATE_PATH}>Kalenteripohjat</Link> / {template.finnishName}</nav>
    <header className="tpl-hero"><p className="tpl-eyebrow">{templateCategory(template.category).name}</p><h1>{template.finnishName}</h1><p>{template.description}</p><p><strong>Maksuton</strong> · Excel, CSV ja PDF · Ei tiliä</p></header>
    <div className="tpl-detail-grid"><section className="tpl-card" aria-labelledby="tpl-download"><h2 id="tpl-download">Lataa pohja</h2>
      <label>Suunnitteluvuosi<select aria-label="Suunnitteluvuosi" value={year} onChange={(e) => { setYear(Number(e.target.value)); setMessage(""); }}>{template.yearApplicability.years.map((value) => <option key={value}>{value}</option>)}</select></label>
      <div className="tpl-downloads">{template.format.map((format) => <a key={format} className="tpl-button" href={format === "pdf" ? templatePdfPath(template, year) : template.downloadableAssets.find((asset) => asset.year === year && asset.format === format).path} download={`${template.slug}-${year}.${format}`} aria-disabled={Boolean(busy)} onClick={(e) => download(e, format)}>{busy === format ? "Ladataan…" : `Lataa ${TEMPLATE_FORMATS[format].label}`}</a>)}</div>
      <p role="status">{message}</p><p>Omaan ja organisaation sisäiseen käyttöön. Täytetyn suunnitelman voi jakaa tiimille. Pohjaa ei saa myydä edelleen.</p>
    </section><section className="tpl-card"><h2>Mitä pohja sisältää?</h2><ul>{template.includes.map((item) => <li key={item}>{item}</li>)}</ul><p>{template.limitation}</p></section></div>
    <section className="tpl-preview"><h2>Esikatselu: {year}</h2><button className="tpl-secondary" type="button" aria-expanded={preview} onClick={() => setPreview(!preview)}>{preview ? "Piilota esikatselu" : "Näytä esikatselu"}</button>
      {preview && <><p>Ensimmäiset viisi riviä. Lataus sisältää koko vuoden. Tyhjät solut ovat omia merkintöjäsi varten.</p><div className="tpl-table" tabIndex={0} role="region" aria-label={template.preview.caption}><table><caption>{template.preview.caption}</caption><thead><tr>{workbook.main.columns.map((column) => <th scope="col" key={column.header}>{column.header}</th>)}</tr></thead><tbody>{workbook.main.rows.slice(0, template.preview.rows).map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i}>{cell instanceof Date ? <time dateTime={templateCellText(cell)}>{templateCellText(cell)}</time> : templateCellText(cell) || <span aria-label="Tyhjä täytettävä solu">&nbsp;</span>}</td>)}</tr>)}</tbody></table></div></>}
    </section>
    <section className="tpl-help"><h2>Näin käytät pohjaa</h2><ol>{template.steps.map((step) => <li key={step}>{step}</li>)}</ol><p>Viikkovuosi näkyy omassa sarakkeessaan. Vuoden ensimmäinen tai viimeinen ISO-viikko voi sisältää naapurivuoden päiviä. Työpäivien määrä koskee vain valittua vuotta.</p>
      <h3>Excel, Google Sheets vai paperi?</h3><p>Muokkaa Suunnitelma-välilehden tyhjiä sarakkeita Excelissä tai tuo XLSX-tiedosto Google Sheetsiin. Ohjeet-välilehdellä on täyttöohjeet ja Päivämääräviite-välilehdellä koko vuoden päivät. CSV sisältää vain suunnitelman; valitse tuonnissa UTF-8 ja puolipiste. PDF:n voit tulostaa A4-paperille. Exceliin tehdyt muutokset tulostetaan omasta taulukkolaskentaohjelmasta.</p>
      <Link to={template.related.path}>{template.related.label}</Link>
    </section><section className="tpl-help"><h2>Kaikki vuosiversiot</h2><ul>{template.yearApplicability.years.map((assetYear) => <li key={assetYear}>{assetYear}: {template.downloadableAssets.filter((asset) => asset.year === assetYear).map((asset) => <span key={asset.format}><a href={asset.path} download={`${template.slug}-${assetYear}.${asset.format}`} onClick={(e) => download(e, asset.format, assetYear)}>{asset.format.toUpperCase()}</a>{" "}</span>)}</li>)}</ul></section><section><h2>Muut suunnittelupohjat</h2><ul>{TEMPLATES.filter((item) => item.id !== template.id).map((item) => <li key={item.id}><Link to={templatePath(item)}>{item.finnishName}</Link></li>)}</ul></section>
  </div>;
}
