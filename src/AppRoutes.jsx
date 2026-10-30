import { routePage } from "virtual:route-page";
import { Suspense, useEffect } from "react";
import { Routes, Route, useParams, Navigate, useLocation, createRoutesFromElements, matchRoutes } from "react-router-dom";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import { M_SLUG, validateYear } from "./components/dateUtils";
import { trackPageView } from "./analytics";
import GrowthCTA from "./components/GrowthCTA";
import RelatedTools from "./components/RelatedTools";
import TopicGuide from "./components/TopicGuide";
import ConsentBanner from "./components/ConsentBanner";
import NewsletterSignup from "./components/NewsletterSignup";
const Home = routePage("Home");
const YearCalendar = routePage("YearCalendar");
import Navbar from "./components/Navbar";
const FAQPage = routePage("FAQPage");
const OpenData = routePage("OpenData");
const ApiPlayground = routePage("ApiPlayground");
const ChromeExtension = routePage("ChromeExtension");
const AndroidApp = routePage("AndroidApp");
const DatasetPage = routePage("DatasetPage");
const TimeManagement = routePage("TimeManagement");
const DataSources = routePage("DataSources");
const Methodology = routePage("Methodology");
const EditorialPolicy = routePage("EditorialPolicy");
const WeekDays = routePage("WeekDays");
const WeeksInEachMonth = routePage("WeeksInEachMonth");
const QuarterPage = routePage("QuarterPage");
const WhatWeek = routePage("WhatWeek");
const WeekParityPage = routePage("WeekParityPage");
const WeekStartsMonday = routePage("WeekStartsMonday");
const PrintCalendar = routePage("PrintCalendar");
const PublicHolidays = routePage("PublicHolidays");
const FlagDays = routePage("FlagDays");
const WorkingDays = routePage("WorkingDays");
const MonthlyWorkingDays = routePage("MonthlyWorkingDays");
const CalendarYear = routePage("CalendarYear");
const Calculators = routePage("Calculators");
const DateToWeek = routePage("DateToWeek");
const WeekToDate = routePage("WeekToDate");
const WorkingDaysBetween = routePage("WorkingDaysBetween");
const DaysBetween = routePage("DaysBetween");
const WeeksInYear = routePage("WeeksInYear");
const FinlandVsUsa = routePage("FinlandVsUsa");
const AboutUs = routePage("AboutUs");
const ContactUs = routePage("ContactUs");
const PrivacyPolicy = routePage("PrivacyPolicy");
const TermsAndConditions = routePage("TermsAndConditions");
const RefundPolicy = routePage("RefundPolicy");
const NotFound = routePage("NotFound");
import Footer from "./components/Footer";
const NamedHoliday = routePage("NamedHoliday");
const NameDayName = routePage("NameDayName");
const NameDaysDate = routePage("NameDaysDate");
const NameDaysToday = routePage("NameDaysToday");
const SchoolHolidays = routePage("SchoolHolidays");
const CurrentMonth = routePage("CurrentMonth");
const CurrentYear = routePage("CurrentYear");
const WeekdayCalculator = routePage("WeekdayCalculator");
const Paydays = routePage("Paydays");
const KelaPayments = routePage("KelaPayments");
const PensionPayments = routePage("PensionPayments");
const ObservanceDay = routePage("ObservanceDay");
const DateCalculator = routePage("DateCalculator");
const DateOffset = routePage("DateOffset");
const AgeCalculator = routePage("AgeCalculator");
const MoonPhases = routePage("MoonPhases");
const SunCity = routePage("SunCity");
const SunHub = routePage("SunHub");
const HoursCalculator = routePage("HoursCalculator");
const AnnualLeave = routePage("AnnualLeave");
const VacationPlanner = routePage("VacationPlanner");
const ProjectTimeline = routePage("ProjectTimeline");
const SprintPlanner = routePage("SprintPlanner");
const ConstructionCalendar = routePage("ConstructionCalendar");
const HrCalendar = routePage("HrCalendar");
const TeamLeaveLanding = routePage("TeamLeaveLanding");
const CompanyCalendar = routePage("CompanyCalendar");
import { COMPANY_ICS_PATH } from "./data/companyIcs";
const TemplateCatalog = routePage("Templates", "TemplateCatalog");
const TemplateLanding = routePage("Templates", "TemplateLanding");
import { COMPANY_CALENDAR_PATH } from "./data/companyCalendar";
const PregnancyCalculator = routePage("PregnancyCalculator");
const PeriodCalculator = routePage("PeriodCalculator");
import { SUN_CITIES, SUN_HUB_PATH, sunCityPath } from "./data/sunCities";
import { CALCULATOR_PATH, OFFSETS, offsetPath } from "./data/dateCalculator";
import { OBSERVANCE_SLUG_RE } from "./data/observanceDays";
const DaylightSaving = routePage("DaylightSaving");
const Countdown = routePage("Countdown");
const CalendarSubscription = routePage("CalendarSubscription");
const WidgetEmbed = routePage("WidgetEmbed");
import { COUNTDOWNS } from "./data/countdownPages";

// Finnish dynamic pages use keyword-rich single-segment slugs
// (/viikko-30-2026, /kuukausi-7-2026, /vuosi-2026, /tulosta-2026). React Router
// can't parse two params inside one path segment, so a single /:slug route
// dispatches by pattern. Static routes (/ukk, /tietoa-meista, …) outrank /:slug, so
// only unmatched single segments ever reach this — the same reachability the
// old explicit routes had. Deterministic, so SSR and client hydration agree.
const dynamicElement = (slug) => {
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
  if ((m = slug.match(/^palkkapaivat-(\d{4})$/)))
    return validateYear(+m[1]) ? <Paydays year={+m[1]} /> : <NotFound />;
  if ((m = slug.match(/^kelan-maksupaivat-(\d{4})$/)))
    return validateYear(+m[1]) ? <KelaPayments year={+m[1]} /> : <NotFound />;
  if ((m = slug.match(/^elakkeen-maksupaivat-(\d{4})$/)))
    return validateYear(+m[1]) ? <PensionPayments year={+m[1]} /> : <NotFound />;
  if ((m = slug.match(/^kuun-vaiheet-(\d{4})$/)))
    return validateYear(+m[1]) ? <MoonPhases year={+m[1]} /> : <NotFound />;
  if ((m = slug.match(OBSERVANCE_SLUG_RE)))
    return validateYear(+m[2]) ? <ObservanceDay slug={m[1]} year={+m[2]} /> : <NotFound />;
  if ((m = slug.match(/^kesaaika-(\d{4})$/)))
    return validateYear(+m[1]) ? <DaylightSaving year={+m[1]} /> : <NotFound />;
  return <NotFound />;
};

const DynamicSlug = () => dynamicElement(useParams().slug);

// Router-agnostic app shell. Wrapped in <BrowserRouter> on the client (App.jsx)
// and in <StaticRouter> at build time for prerendering (entry-server.jsx).
// Clarity page-view tags/events after each route renders (see analytics.js).
// Effects never run during prerendering, so this is client-only.
const RouteAnalytics = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
};

const routeElements = <>
        <Route path="/" element={<Home />} />
        <Route path="/mika-on-viikkonumero" element={<WhatWeek />} />
        <Route path="/parillinen-pariton-viikko" element={<WeekParityPage />} />
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
        <Route path={CALCULATOR_PATH} element={<DateCalculator />} />
        <Route path="/ikalaskuri" element={<AgeCalculator />} />
        <Route path="/tuntilaskuri" element={<HoursCalculator />} />
        <Route path="/vuosilomalaskuri" element={<AnnualLeave />} />
        <Route path="/lomasuunnittelija" element={<VacationPlanner />} />
        <Route path="/projektiaikataulu" element={<ProjectTimeline />} />
        <Route path="/sprinttisuunnittelija" element={<SprintPlanner />} />
        <Route path={COMPANY_CALENDAR_PATH} element={<CompanyCalendar />} />
        <Route path={COMPANY_ICS_PATH} element={<CompanyCalendar icsOnly />} />
        <Route path="/rakennuskalenteri" element={<ConstructionCalendar />} />
        <Route path="/hr-kalenteri" element={<HrCalendar />} />
        <Route path="/tiimin-lomat" element={<TeamLeaveLanding />} />
        <Route path="/kalenteripohjat" element={<TemplateCatalog />} />
        <Route path="/kalenteripohjat/:slug" element={<TemplateLanding />} />
        <Route path="/raskauslaskuri" element={<PregnancyCalculator />} />
        <Route path="/kuukautislaskuri" element={<PeriodCalculator />} />
        <Route path={SUN_HUB_PATH} element={<SunHub />} />
        {SUN_CITIES.map((c) => (
          <Route key={c.slug} path={sunCityPath(c.slug)} element={<SunCity slug={c.slug} />} />
        ))}
        {OFFSETS.map((n) => (
          <Route key={n} path={offsetPath(n)} element={<DateOffset n={n} />} />
        ))}
        {COUNTDOWNS.map((c) => (
          <Route key={c.path} path={c.path} element={<Countdown path={c.path} />} />
        ))}
        <Route path="/kalenteritilaus" element={<CalendarSubscription />} />
        <Route path="/upota-viikkonumero" element={<WidgetEmbed />} />
        <Route path="/tietoa-meista" element={<AboutUs />} />
        <Route path="/ota-yhteytta" element={<ContactUs />} />
        <Route path="/tietosuoja" element={<PrivacyPolicy />} />
        <Route path="/kayttoehdot" element={<TermsAndConditions />} />
        <Route path="/palautusehdot" element={<RefundPolicy />} />
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

</>;
const routeDefinitions = createRoutesFromElements(routeElements);

export function matchedPage(pathname) {
  const match = matchRoutes(routeDefinitions, pathname)?.at(-1);
  const element = match?.route.element;
  return element?.type === DynamicSlug ? dynamicElement(match.params.slug).type : element?.type;
}

export function preloadRoute(pathname) {
  return matchedPage(pathname)?.preload?.() ?? Promise.resolve();
}

export function pageModuleForRoute(pathname) {
  return matchedPage(pathname)?.routeModule;
}

const AppRoutes = () => {
  const { pathname } = useLocation();
  return (
    <>
      <RouteAnalytics />
      <Navbar />
      {/* Single <main> landmark wraps the routed page content (a11y: screen
          readers use it to jump to the primary content). */}
      <main id="main" tabIndex={-1}>
        <RouteErrorBoundary key={pathname}>
          <Suspense fallback={<p className="app" role="status">Ladataan sivua...</p>}>
            <Routes>{routeElements}</Routes>
          </Suspense>
        </RouteErrorBoundary>
        <TopicGuide />
        <RelatedTools />
        <GrowthCTA />
      </main>
      <Footer />
      <ConsentBanner />
      <NewsletterSignup />
    </>
  );
};

export default AppRoutes;
