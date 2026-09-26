import { useToday } from "../components/useToday";
import "../App.css";
import SEO from "../components/SEO";
import { canonicalFor, homeMeta } from "../data/seo";
import Weekcounter from "../components/Weekcounter";
import WeeklySearch from "../components/WeeklySearch";
import FAQ from "../components/FAQ";
import WeeksOfMonth from "../components/WeeksOfMonth";
import YearsWeek from "../components/YearsWeek";
import QuickLinks from "../components/QuickLinks";
import Information from "../components/Information";
import AppsPromo from "../components/AppsPromo";
import SeasonYear from "../components/SeasonYear";

const Home = () => {
  // Computed directly in the render body (not an effect) so it's correct
  // during SSR/prerendering too — an effect-based computation (like
  // Weekcounter's) would render as build-time-empty state on the server.
  const meta = homeMeta(useToday());
  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={canonicalFor("/")}
        lang="fi"
        alternates={[
          { lang: "fi", href: canonicalFor("/") },
          { lang: "en", href: canonicalFor("/en") },
          { lang: "x-default", href: canonicalFor("/") },
        ]}
      />
      <div className="app">
        <Weekcounter lead={meta.lead} />
        <SeasonYear />
        <WeeklySearch />
        <WeeksOfMonth />
        <YearsWeek />
        <Information />
        <AppsPromo />
        <QuickLinks />
        <FAQ />
      </div>
    </>
  );
};

export default Home;
