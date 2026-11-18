import { Link, useParams } from "react-router-dom";
import SEO from "../components/SEO";
import QuickFacts from "../components/QuickFacts";
import {
  PRERENDER_MAX_YEAR as YEAR_MAX,
  validateYear,
} from "../components/dateUtils";
import { canonicalFor, CONTENT_UPDATED_FI } from "../data/seo";
import {
  christmasBreakData,
  christmasBreakFaqs,
  christmasBreakMeta,
} from "../data/seasonalPages";
import NotFound from "./NotFound";

const ChristmasBreak = ({ year: pYear } = {}) => {
  const params = useParams();
  const rawYear = pYear ?? params.year ?? params.slug?.match(/^joululoma-(\d{4})$/)?.[1];
  const year = Number(rawYear);

  if (!validateYear(year)) return <NotFound />;

  const data = christmasBreakData(year);
  const meta = christmasBreakMeta(year);
  const faqs = christmasBreakFaqs(year);
  const path = `/joululoma-${year}`;

  return (
    <section className="app">
      <SEO {...meta} canonical={canonicalFor(path)} />

      <div className="breadcrumb">
        <Link to="/">Etusivu</Link> ›{" "}
        <Link to={`/koululomat-${year}`}>Koululomat {year}</Link> › Joululoma {year}
      </div>

      <h1>Koulujen joululoma {year}</h1>

      <p className="lead">
        <span className="answer-sentence">
          <strong>
            Koulujen joululoma {year} alkaa suurimmassa osassa Suomea keskiviikkona {data.generalStart} ja päättyy loppiaiseen {data.generalEnd}.
          </strong>
        </span>{" "}
        Koulutyö jatkuu jälleen torstaina {data.schoolResumes}. Katso myös kaikki lukuvuoden loma-ajat sivulta{" "}
        <Link to={`/koululomat-${year}`}>koululomat {year}</Link>.
      </p>

      <QuickFacts
        title={`Koulujen joululoma ${year} lyhyesti`}
        facts={[
          { label: "Lukuvuosi", value: data.schoolYear },
          { label: "Joululoma alkaa", value: data.generalStart },
          { label: "Joululoma päättyy", value: data.generalEnd },
          { label: "Koulu alkaa", value: `torstaina ${data.schoolResumes}` },
          { label: "Loman pituus", value: `noin ${data.durationDays} päivää (sis. viikonloput ja pyhät)` },
          {
            label: "Kaikki koululomat",
            value: <Link to={`/koululomat-${year}`}>koululomat {year}</Link>,
          },
        ]}
      />

      <p className="note-soft">Sisältö päivitetty {CONTENT_UPDATED_FI}.</p>

      <section className="prose">
        <h2>Joululoman 2026 aikataulu Suomen suurimmissa kaupungeissa</h2>
        <p>
          Suomen suurimmissa kaupungeissa perusopetuksen joululoman ajankohdat noudattavat yhtenäistä aikataulua:
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Kaupunki</th>
                <th>Joululoma alkaa</th>
                <th>Joululoma päättyy</th>
                <th>Koulu jatkuu</th>
                <th>Huomio</th>
              </tr>
            </thead>
            <tbody>
              {data.cities.map((c) => (
                <tr key={c.city}>
                  <td><strong>{c.city}</strong></td>
                  <td>{c.start}</td>
                  <td>{c.end}</td>
                  <td>{c.schoolResumes}</td>
                  <td>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Joululoman sijoittuminen kalenteriin</h2>
        <p>
          Lukuvuonna {data.schoolYear} syyslukukausi päättyy tiistaina 22. joulukuuta {year}. Joululoma käynnistyy virallisesti keskiviikkona 23. joulukuuta, jolloin oppilailla ja perheillä on aikaa valmistautua jouluaattoon (torstai 24.12.).
        </p>
        <p>
          Tammikuun alussa loppiainen osuu keskiviikolle 6. tammikuuta, joka on virallinen pyhäpäivä. Koululaiset palaavat luokkahuoneisiin loppiaisen jälkeen <strong>torstaina {data.schoolResumes}</strong>.
        </p>
        <p>
          Kokonaisuudessaan joululomasta kertyy <strong>15 peräkkäistä vapaapäivää</strong> viikonloput ja pyhäpäivät mukaan luettuina.
        </p>

        <h2>Kaikki lukuvuoden {data.schoolYear} lomat</h2>
        <p>
          Joululoman lisäksi lukuvuoteen kuuluu muita säännöllisiä lomajaksoja:
        </p>
        <ul>
          <li><strong>Syysloma:</strong> Pidetään lokakuussa (viikot 42 tai 43 kunnasta riippuen).</li>
          <li><strong>Talviloma (hiihtoloma):</strong> Porrastetusti viikoilla 8-10 helmikuussa ja maaliskuussa.</li>
          <li><strong>Pääsiäisloma:</strong> Pääsiäisen pyhäpäivät pitkäperjantaista toiseen pääsiäispäivään.</li>
          <li><strong>Kesäloma:</strong> Alkaa lukuvuoden päättyessä viikon 22 lauantaina.</li>
        </ul>
        <p>
          Tarkista kuntakohtaiset vahvistetut päivämäärät sivulta <Link to={`/koululomat-${year}`}>koululomat {year}</Link>.
        </p>

        <h2>Usein kysytyt kysymykset</h2>
        {faqs.map((faq) => (
          <details key={faq.q} className="faq-item">
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </section>

      <p className="hub-links">
        Katso myös{" "}
        {year + 1 <= YEAR_MAX && (
          <>
            <Link to={`/uusi-vuosi-${year + 1}`}>uusi vuosi {year + 1}</Link>,{" "}
            <Link to={`/loppiainen-${year + 1}`}>loppiainen {year + 1}</Link>,{" "}
          </>
        )}
        <Link to={`/koululomat-${year}`}>koululomat {year}</Link>,{" "}
        <Link to={`/joulu-${year}`}>joulu {year}</Link>,{" "}
        <Link to={`/vuosi-${year}`}>viikkokalenteri {year}</Link>,{" "}
        <Link to={`/pyhapaivat-${year}`}>pyhäpäivät {year}</Link> ja{" "}
        <Link to={`/itsenaisyyspaiva-${year}`}>itsenäisyyspäivä {year}</Link>.
      </p>
    </section>
  );
};

export default ChristmasBreak;
