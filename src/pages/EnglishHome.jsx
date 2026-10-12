import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { englishFaqs, englishMeta, englishWeekFacts, formatEnglishDate } from "../data/englishContent";
import { canonicalFor, CONTENT_UPDATED } from "../data/seo";
import { useToday } from "../components/useToday.js";

const EnglishHome = () => {
  const today = useToday();
  const fact = englishWeekFacts(today);
  const meta = englishMeta(today);
  return (
    <section className="app">
      <SEO
        {...meta}
        canonical={canonicalFor("/en")}
        lang="en"
        alternates={[
          { lang: "en", href: canonicalFor("/en") },
          { lang: "fi", href: canonicalFor("/") },
          { lang: "x-default", href: canonicalFor("/") },
        ]}
      />
      <div className="breadcrumb"><Link to="/">Finnish site</Link> / English</div>
      <h1>What is the current week number?</h1>
      <p className="lead"><strong>The current week number is {fact.week} of {fact.year}.</strong></p>
      <div className="result">
        <div className="main-text">Week {fact.week}</div>
        <div className="sub">Monday {formatEnglishDate(fact.monday)} – Sunday {formatEnglishDate(fact.sunday)}</div>
      </div>
      <div className="prose">
        <p className="note-soft">Content reviewed {CONTENT_UPDATED}.</p>
        <h2>Current week dates</h2>
        <p>
          ISO week {fact.week} of {fact.year} starts on Monday {formatEnglishDate(fact.monday)} and ends on Sunday{" "}
          {formatEnglishDate(fact.sunday)}. Open the{" "}
          <Link to={"/viikko-" + fact.week + "-" + fact.year}>detailed week {fact.week} calendar</Link>{" "}
          (in Finnish) for individual dates and Finnish holidays.
        </p>
        <h2>How ISO week numbers work</h2>
        <p>
          ISO 8601 numbers weeks from 1 to 52 or 53. Weeks start on Monday. Week 1 is the week containing
          the first Thursday of the year, which means dates near New Year can belong to a different ISO week-year.
        </p>
        <h2>Frequently asked questions</h2>
        {englishFaqs.map((item, index) => (
          <details key={item.q} open={index === 0}><summary>{item.q}</summary><p>{item.a}</p></details>
        ))}
      </div>
      <p>
        The full service is available in Finnish: <Link to="/">current week</Link>,{" "}
        <Link to={"/vuosi-" + fact.year}>all weeks in {fact.year}</Link> and{" "}
        <Link to={"/kalenteri-" + fact.year}>the {fact.year} calendar</Link>.
      </p>
    </section>
  );
};

export default EnglishHome;
