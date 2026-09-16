import { Routes, Route, useParams, Navigate } from "react-router-dom";
import { M_SLUG } from "./components/dateUtils";
import Home from "./pages/Home";
import YearCalendar from "./pages/YearCalendar";
import Navbar from "./components/Navbar";
import FAQPage from "./pages/FAQPage";
import OpenData from "./pages/OpenData";
import ApiPlayground from "./pages/ApiPlayground";
import ChromeExtension from "./pages/ChromeExtension";
import AndroidApp from "./pages/AndroidApp";
import DatasetPage from "./pages/DatasetPage";
import TimeManagement from "./pages/TimeManagement";
import DataSources from "./pages/DataSources";
import Methodology from "./pages/Methodology";
import EditorialPolicy from "./pages/EditorialPolicy";
import WeekDays from "./pages/WeekDays";
import WeeksInEachMonth from "./pages/WeeksInEachMonth";
import QuarterPage from "./pages/QuarterPage";
import WhatWeek from "./pages/WhatWeek";
import WeekStartsMonday from "./pages/WeekStartsMonday";
import PrintCalendar from "./pages/PrintCalendar";
import PublicHolidays from "./pages/PublicHolidays";
import FlagDays from "./pages/FlagDays";
import WorkingDays from "./pages/WorkingDays";
import MonthlyWorkingDays from "./pages/MonthlyWorkingDays";
import CalendarYear from "./pages/CalendarYear";
import Calculators from "./pages/Calculators";
import DateToWeek from "./pages/DateToWeek";
import WeekToDate from "./pages/WeekToDate";
import WorkingDaysBetween from "./pages/WorkingDaysBetween";
import DaysBetween from "./pages/DaysBetween";
import WeeksInYear from "./pages/WeeksInYear";
import FinlandVsUsa from "./pages/FinlandVsUsa";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import NamedHoliday from "./pages/NamedHoliday";
import NameDayName from "./pages/NameDayName";
import NameDaysDate from "./pages/NameDaysDate";
import NameDaysToday from "./pages/NameDaysToday";
import SchoolHolidays from "./pages/SchoolHolidays";
import CurrentMonth from "./pages/CurrentMonth";
import CurrentYear from "./pages/CurrentYear";
import WeekdayCalculator from "./pages/WeekdayCalculator";
import EnglishHome from "./pages/EnglishHome";

// Finnish dynamic pages use keyword-rich single-segment slugs
// (/viikko-30-2026, /kuukausi-7-2026, /vuosi-2026, /tulosta-2026). React Router
// can't parse two params inside one path segment, so a single /:slug route
// dispatches by pattern. Static routes (/ukk, /tietoa-meista, …) outrank /:slug, so
// only unmatched single segments ever reach this — the same reachability the
// old explicit routes had. Deterministic, so SSR and client hydration agree.
const DynamicSlug = () => {
  const { slug } = useParams();
  let m;
  if ((m = slug.match(/^viikko-(\d+)-(\d+)$/)))
    return <WeekDays week={+m[1]} year={+m[2]} />;
  if ((m = slug.match(/^kuukausi-(\d+)-(\d+)$/)))
    return <WeeksInEachMonth month={+m[1]} year={+m[2]} />;
  if ((m = slug.match(/^q([1-4])-(\d+)$/)))
    return <QuarterPage quarter={+m[1]} year={+m[2]} />;
  if ((m = slug.match(/^vuosi-(\d+)$/))) return <YearCalendar year={+m[1]} />;
  if ((m = slug.match(/^tulosta-(\d+)$/))) return <PrintCalendar year={+m[1]} />;
  if ((m = slug.match(/^pyhapaivat-(\d+)$/)))
    return <PublicHolidays year={+m[1]} />;
  if ((m = slug.match(/^liputuspaivat-(\d+)$/)))
    return <FlagDays year={+m[1]} />;
  if ((m = slug.match(/^tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    return mi === -1 ? (
      <NotFound />
    ) : (
      <MonthlyWorkingDays month={mi + 1} year={+m[2]} />
    );
  }
  if ((m = slug.match(/^tyopaivat-(\d+)$/))) return <WorkingDays year={+m[1]} />;
  if ((m = slug.match(/^koululomat-(\d+)$/)))
    return <SchoolHolidays year={+m[1]} />;
  if ((m = slug.match(/^kalenteri-(\d+)-(alkuvuosi|loppuvuosi)$/)))
    return <CalendarYear year={+m[1]} half={m[2] === "alkuvuosi" ? 1 : 2} />;
  if ((m = slug.match(/^kalenteri-(\d+)$/)))
    return <CalendarYear year={+m[1]} />;
  if ((m = slug.match(/^tulostettava-kalenteri-(\d+)$/)))
    return <CalendarYear year={+m[1]} print />;
  return <NotFound />;
};

// Router-agnostic app shell. Wrapped in <BrowserRouter> on the client (App.jsx)
// and in <StaticRouter> at build time for prerendering (entry-server.jsx).
const AppRoutes = () => {
  return (
    <>
      <Navbar />
      {/* Single <main> landmark wraps the routed page content (a11y: screen
          readers use it to jump to the primary content). */}
      <main id="main">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/en" element={<EnglishHome />} />
        <Route path="/mika-on-viikkonumero" element={<WhatWeek />} />
        <Route path="/viikko-alkaa-maanantaista" element={<WeekStartsMonday />} />
        <Route path="/kuinka-monta-viikkoa-vuodessa" element={<WeeksInYear />} />
        <Route path="/suomi-vs-usa-viikkonumerot" element={<FinlandVsUsa />} />
        <Route path="/mika-kuukausi-nyt" element={<CurrentMonth />} />
        <Route path="/mika-vuosi-nyt" element={<CurrentYear />} />
        <Route path="/viikonpaiva" element={<WeekdayCalculator />} />
        <Route path="/ukk" element={<FAQPage />} />
        <Route path="/avoin-data" element={<OpenData />} />
        <Route path="/api-playground" element={<ApiPlayground />} />
        <Route path="/chrome-extension" element={<ChromeExtension />} />
        <Route path="/android-sovellus" element={<AndroidApp />} />
        <Route path="/data/week" element={<DatasetPage family="week" />} />
        <Route path="/data/month" element={<DatasetPage family="month" />} />
        <Route path="/data/year" element={<DatasetPage family="year" />} />
        <Route path="/data/holiday" element={<DatasetPage family="holiday" />} />
        <Route
          path="/data/working-days"
          element={<DatasetPage family="working-days" />}
        />
        <Route path="/ajanhallinta" element={<TimeManagement />} />
        <Route path="/tietolahteet" element={<DataSources />} />
        <Route path="/menetelma" element={<Methodology />} />
        <Route path="/toimitusperiaatteet" element={<EditorialPolicy />} />
        <Route path="/laskurit" element={<Calculators />} />
        <Route path="/paivamaara-viikoksi" element={<DateToWeek />} />
        <Route path="/viikko-paivamaaraksi" element={<WeekToDate />} />
        <Route path="/tyopaivalaskuri" element={<WorkingDaysBetween />} />
        <Route path="/paivien-erotus" element={<DaysBetween />} />
        <Route path="/tietoa-meista" element={<AboutUs />} />
        <Route path="/ota-yhteytta" element={<ContactUs />} />
        <Route path="/tietosuoja" element={<PrivacyPolicy />} />
        <Route path="/kayttoehdot" element={<TermsAndConditions />} />
        <Route path="/nimipaivat/tanaan" element={<NameDaysToday />} />
        <Route path="/nimipaiva/:name" element={<NameDayName />} />
        <Route path="/nimipaivat/:monthDay" element={<NameDaysDate />} />
        <Route path="/:holidayYear/:holidaySlug" element={<NamedHoliday />} />
        {/* No other page family has a bare, year-less route (/pyhapaivat,
            /tyopaivat, /kalenteri, /vuosi all require an explicit year) —
            this sends a visitor who lands on /liputuspaivat straight to the
            current year's page rather than 404ing or inventing a second,
            year-less content type. The prerendered HTML (prerender.js) does
            the same redirect server-side via a 0-delay meta refresh, since
            this client route never runs for a crawler or a fresh page load. */}
        <Route
          path="/liputuspaivat"
          element={<Navigate to={`/liputuspaivat-${new Date().getFullYear()}`} replace />}
        />
        <Route path="/:slug" element={<DynamicSlug />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default AppRoutes;
