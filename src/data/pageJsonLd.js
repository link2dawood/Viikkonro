// Shared structured data (schema.org JSON-LD) generator for Viikkonro.
// Used by prerender.js at build time and by SEO.jsx for client-side SPA navigation.

import {
  SITE_URL,
  canonicalFor,
  metaFor,
  breadcrumbTrail,
  calendarFaqs,
  calendarMeta,
  calendarPdfPath,
  CONTENT_UPDATED,
  FEED_SCHEMA_VERSION,
  mondayOf,
  monthFaqs,
  monthlyWorkingDayFaqs,
  monthPdfPath,
  quarterFaqs,
  quarterStats,
  weekPdfPath,
  workingDaysFaqs,
  yearFaqs,
  isIndexable,
} from "./seo.js";

import {
  PARITY_PATH,
  PARITY_UPDATED,
  parityMeta,
  parityPageFaqs,
} from "./weekParity.js";

import {
  CHROME_EXTENSION_PATH,
} from "./chromeExtensionContent.js";

import {
  ANDROID_APP_PATH,
} from "./androidAppContent.js";

import {
  REFUND_PATH,
  LEGAL_UPDATED,
  refundFaqs,
} from "./legalPolicies.js";

import {
  printListFaqs,
  printableCalendarFaqs,
} from "./printCalendarContent.js";

import {
  weeksInYearFaqs,
} from "./weeksInYearContent.js";

import {
  currentMonthMeta,
  currentMonthFaqs,
  currentYearMeta,
  currentYearFaqs,
  weekdayMeta,
  weekdayFaqs,
} from "./currentDateContent.js";

import {
  openDataFaqs,
} from "./openDataContent.js";

import {
  M_FULL,
  M_SLUG,
  PRERENDER_MIN_YEAR,
  PRERENDER_MAX_YEAR,
  isoWeek,
  isoYear,
  dateFromDayKey,
  helsinkiDayKey,
  quarterOf,
  fmtShortFi,
  weeksInIsoYear,
} from "../components/dateUtils.js";

import { faqs, FAQ_UPDATED, featuredFaqs } from "./faqs.js";
import {
  dataSourcesFaqs,
  methodologyFaqs,
  editorialPolicyFaqs,
} from "./trustPages.js";

import {
  INSTALL_STEPS,
  EXTENSION_FACTS,
  EXTENSION_FEATURES,
  chromeExtensionFaqs,
} from "./chromeExtensionContent.js";

import {
  ANDROID_APP_FACTS,
  ANDROID_APP_FEATURES,
  ANDROID_WIDGETS,
  androidAppFaqs,
} from "./androidAppContent.js";

import { datasetPageFaqs } from "./datasetPages.js";
import { whatWeekFaqs, weekStartsMondayFaqs } from "./isoWeekContent.js";
import { finlandVsUsaFaqs } from "./finlandVsUsaContent.js";
import {
  schoolHolidayFaqs,
  schoolHolidayPage,
  schoolHolidayVerifiedAt,
  SCHOOL_HOLIDAY_SOURCES,
} from "./schoolHolidayPages.js";

import { holidaysInYear } from "./holidays.js";
import {
  holidayPageFor,
  holidayPageMeta,
  holidayFaqs,
  holidayWeekLinks,
  holidayLinkPath,
  HOLIDAY_DEFINITIONS,
} from "./holidayPages.js";

import { flagDaysInYear, flagDayFaqs } from "./flagDayPages.js";
import {
  todayNameDayPage,
  todayNameDayMeta,
  nameDayNamePage,
  nameDayNameMeta,
  nameDayDatePage,
  nameDayDateMeta,
  nameDayFaqs,
} from "./nameDayPages.js";

import { paydayFaqs, paydaysInYear, DEFAULT_PAYDAY } from "./paydayPages.js";
import {
  kelaPaymentFaqs,
  pensionPaymentFaqs,
  benefitPaymentsInYear,
  KELA_BENEFITS,
  PENSION_BENEFITS,
} from "./benefitPaymentPages.js";

import {
  observancePage,
  observanceMeta,
  observanceFaqs,
  upcomingYears,
  OBSERVANCE_SLUG_RE,
} from "./observanceDays.js";

import { dstChanges, dstFaqs } from "./dstPages.js";
import { COUNTDOWN_BY_PATH, countdownFaqs } from "./countdownPages.js";
import {
  CALCULATOR_PATH as DATE_CALCULATOR_PATH,
  DATE_CALCULATOR_STEPS,
  OFFSETS,
  dateCalculatorFaqs,
  monthlyTable,
  offsetFaqs,
  offsetPath,
} from "./dateCalculator.js";

import { PERIOD_PATH, PERIOD_STEPS, periodFaqs } from "./periodCalculator.js";
import { PREGNANCY_PATH, PREGNANCY_UPDATED, PREGNANCY_STEPS, pregnancyFaqs } from "./pregnancyCalculator.js";

import { ageFaqs, AGE_PATH, AGE_STEPS } from "./ageCalculator.js";
import { leaveFaqs, LEAVE_PATH, LEAVE_STEPS } from "./annualLeave.js";
import { templateNodes } from "../platform/templates/schema.js";
import { TEMPLATE_PATH } from "../platform/templates/catalog.js";
import {
  companyIcsFaqs,
  COMPANY_ICS_PATH,
  COMPANY_ICS_STEPS,
  COMPANY_ICS_UPDATED,
} from "./companyIcs.js";

import {
  constructionFaqs,
  CONSTRUCTION_PATH,
  CONSTRUCTION_STEPS,
  CONSTRUCTION_UPDATED,
} from "./constructionCalendar.js";

import { hrFaqs, HR_PATH, HR_STEPS, HR_UPDATED } from "./hrCalendar.js";
import { teamFaqs, TEAM_PATH, TEAM_STEPS, TEAM_UPDATED } from "./teamLeave.js";
import {
  companyCalendarFaqs,
  COMPANY_CALENDAR_PATH,
  COMPANY_CALENDAR_STEPS,
  COMPANY_CALENDAR_UPDATED,
} from "./companyCalendar.js";

import {
  plannerFaqs,
  PLANNER_PATH,
  PLANNER_STEPS,
  PLANNER_UPDATED,
} from "./vacationPlanner.js";

import {
  projectFaqs,
  PROJECT_PATH,
  PROJECT_STEPS,
  PROJECT_UPDATED,
} from "./projectTimeline.js";

import {
  sprintFaqs,
  SPRINT_PATH,
  SPRINT_STEPS,
  SPRINT_UPDATED,
} from "./sprintPlanner.js";

import { hoursFaqs, HOURS_PATH, HOURS_STEPS } from "./hoursCalculator.js";
import {
  SUN_HUB_PATH,
  SUN_CITIES,
  sunCityPath,
  sunHubFaqs,
  sunCityFaqs,
} from "./sunCities.js";

import { moonFaqs, phaseList } from "./moonPhases.js";
import {
  calendarSubscriptionFaqs,
  CALENDAR_SUBSCRIPTION_PATH,
  CALENDAR_SUBSCRIPTION_STEPS,
  ICS_FEEDS,
} from "./icsFeeds.js";

import {
  widgetFaqs,
  WIDGET_EMBED_PAGE_PATH,
  WIDGET_EMBED_STEPS,
} from "./weekWidget.js";

import { pageTopic, topicSchema } from "./pageTopics.js";
import { CALENDAR_CONTENT_UPDATED, sitemapLastmod } from "./sitemapMetadata.js";
import { WORKING_DAYS_UPDATED, workingDaysBetweenFaqs } from "./workingDaysContent.js";

export const GLOBAL_JSON_LD_NODES = [
  {
    "@type": "WebSite",
    "@id": "https://viikkonro.fi/#website",
    url: "https://viikkonro.fi/",
    name: "Viikko Nro",
    description:
      "Ilmainen viikkolaskuri, joka näyttää kuluvan viikkonumeron ja laskee minkä tahansa päivän viikon ISO 8601 -standardin mukaan.",
    inLanguage: "fi-FI",
    publisher: {
      "@id": "https://viikkonro.fi/#organization",
    },
  },
  {
    "@type": "Organization",
    "@id": "https://viikkonro.fi/#organization",
    name: "Viikko Nro",
    alternateName: "Viikkonro.fi",
    url: "https://viikkonro.fi/",
    description:
      "Suomalainen verkkopalvelu ISO 8601 -viikkonumeroiden, kalenteriviikkojen ja päivämäärien tarkistamiseen.",
    logo: "https://viikkonro.fi/logo-horizontal-viikkonro-20260916.webp",
    sameAs: [
      "https://www.linkedin.com/company/viikkonro",
      "https://www.instagram.com/viikkonro/",
      "https://fi.pinterest.com/viikkonroo/",
      "https://bsky.app/profile/viikkonro.bsky.social",
    ],
  },
  {
    "@type": "WebApplication",
    "@id": "https://viikkonro.fi/#app",
    name: "Viikko Nro - viikkolaskuri",
    url: "https://viikkonro.fi/",
    publisher: {
      "@id": "https://viikkonro.fi/#organization",
    },
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "All",
    inLanguage: "fi-FI",
    browserRequirements: "Requires JavaScript",
    description:
      "Näyttää kuluvan viikkonumeron ja laskee minkä tahansa päivän viikon, viikonpäivät ja ajanjakson ISO 8601 -standardin mukaan.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  },
];

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function pageNode(url, type = "WebPage", extra = {}) {
  const canonical = canonicalFor(url);
  const trail = breadcrumbTrail(url);
  const meta = metaFor(url);
  const name = meta?.title ? meta.title.replace(/\s*\|\s*Viikko Nro$/, "") : "";
  return {
    "@type": type,
    "@id": `${canonical}#webpage`,
    url: canonical,
    name,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "fi-FI",
    ...(trail && trail.length >= 2 ? { breadcrumb: { "@id": `${canonical}#breadcrumb` } } : {}),
    ...extra,
  };
}

export function speakableExtra(url) {
  if (
    /^\/viikko-\d+-\d+$/.test(url) ||
    /^\/tyopaivat-\d+$/.test(url) ||
    /^\/pyhapaivat-\d+$/.test(url)
  ) {
    return {
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
    };
  }
  return {};
}

export function weekHolidayMentionsExtra(url) {
  const m = url.match(/^\/viikko-(\d+)-(\d+)$/);
  if (!m) return {};
  const officialHolidays = holidaysInWeekForPrerender(+m[2], +m[1]).filter((h) => h.official);
  const mentions = officialHolidays
    .map((h) => holidayLinkPath(h.name, h.date))
    .filter(Boolean)
    .map((path) => ({ "@id": `${canonicalFor(path)}#webpage` }));
  return mentions.length > 0 ? { mentions } : {};
}

export function ogImageUrlFor(url) {
  let m;
  if (url === "/") {
    return `${SITE_URL}/og.png`;
  }
  if (url === CHROME_EXTENSION_PATH) {
    return `${SITE_URL}/og/chrome-extension.png`;
  }
  if (url === ANDROID_APP_PATH) {
    return `${SITE_URL}/og/android-sovellus.png`;
  }
  if ((m = url.match(/^\/(?:tulostettava-)?kalenteri-(\d+)/))) {
    return `${SITE_URL}/og/kalenteri-${m[1]}.png`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `${SITE_URL}/og/vuosi-${m[1]}.png`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/og/kuukausi-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/og/viikko-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    return `${SITE_URL}/og/pyhat-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    return `${SITE_URL}/og/pyhapaivat-${m[1]}.png`;
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    return `${SITE_URL}/og/liputuspaivat-${m[1]}.png`;
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    return `${SITE_URL}/og/tyopaivat-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) {
    return `${SITE_URL}/og/tyopaivat-${m[1]}.png`;
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    return `${SITE_URL}/og/q${m[1]}-${m[2]}.png`;
  }
  return null;
}

export function ogImageAltFor(url) {
  let m;
  if (url === CHROME_EXTENSION_PATH) {
    return "Viikko Nro Chrome-laajennus - viikkonumero selaimeen";
  }
  if (url === ANDROID_APP_PATH) {
    return "Viikkonro Android-sovellus ja aloitusnäytön widgetit";
  }
  if ((m = url.match(/^\/(?:tulostettava-)?kalenteri-(\d+)/))) {
    return `Vuoden ${m[1]} kalenteri - Viikko Nro`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `Viikkonumerot ${m[1]} - Viikko Nro`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `${M_FULL[Number(m[1]) - 1]} ${m[2]} - Viikko Nro`;
  }
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `Viikko ${m[1]}/${m[2]} - Viikko Nro`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    const page = holidayPageFor(m[1], m[2]);
    return page ? `${page.displayName} ${m[1]} - Viikko Nro` : null;
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    return `Suomen pyhäpäivät ${m[1]} - Viikko Nro`;
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    return `Suomen liputuspäivät ${m[1]} - Viikko Nro`;
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    return mi === -1 ? null : `Työpäivät ${M_FULL[mi]} ${m[2]} - Viikko Nro`;
  }
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) {
    return `Työpäivät ${m[1]} - Viikko Nro`;
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    return `Q${m[1]} ${m[2]} - Viikko Nro`;
  }
  return null;
}

export function ogImageExtra(url) {
  const img = ogImageUrlFor(url);
  if (!img) return {};
  return {
    image: {
      "@type": "ImageObject",
      url: img,
      contentUrl: img,
      width: 1200,
      height: 630,
    },
  };
}

export function weekPdfExtra(url) {
  const m = url.match(/^\/viikko-(\d+)-(\d+)$/);
  if (!m) return {};
  const pdfUrl = `${SITE_URL}${weekPdfPath(m[1], m[2])}`;
  return {
    associatedMedia: {
      "@type": "MediaObject",
      "@id": `${pdfUrl}#media`,
      name: `Viikko ${m[1]}/${m[2]} (PDF)`,
      contentUrl: pdfUrl,
      encodingFormat: "application/pdf",
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
    },
    potentialAction: {
      "@type": "DownloadAction",
      target: pdfUrl,
      object: { "@id": `${pdfUrl}#media` },
    },
  };
}

export function monthPdfExtra(url) {
  const m = url.match(/^\/kuukausi-(\d+)-(\d+)$/);
  if (!m) return {};
  const pdfUrl = `${SITE_URL}${monthPdfPath(m[1], m[2])}`;
  return {
    associatedMedia: {
      "@type": "MediaObject",
      "@id": `${pdfUrl}#media`,
      name: `${M_FULL[Number(m[1]) - 1]} ${m[2]} (PDF)`,
      contentUrl: pdfUrl,
      encodingFormat: "application/pdf",
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
    },
    potentialAction: {
      "@type": "DownloadAction",
      target: pdfUrl,
      object: { "@id": `${pdfUrl}#media` },
    },
  };
}

export function entityParentExtra(url) {
  let m;
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    const year = m[2];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    const month = Number(m[1]);
    const year = m[2];
    const quarter = quarterOf(new Date(Number(year), month - 1, 1));
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/q${quarter}-${year}`)}#webpage` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/q([1-4])-(\d+)$/))) {
    const year = m[2];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/pyhapaivat-(\d+)$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
      hasPart: HOLIDAY_DEFINITIONS.map((h) => ({
        "@id": `${canonicalFor(`/pyhat-${year}/${h.slug}`)}#webpage`,
      })),
    };
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/[a-z0-9-]+$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/pyhapaivat-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/liputuspaivat-(\d+)$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.match(/^\/tyopaivat-(\d+)$/))) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
      hasPart: M_SLUG.map((slug) => ({
        "@id": `${canonicalFor(`/tyopaivat-${slug}-${year}`)}#webpage`,
      })),
    };
  }
  if ((m = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/))) {
    const mi = M_SLUG.indexOf(m[1]);
    if (mi === -1) return {};
    const year = m[2];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/kuukausi-${mi + 1}-${year}`)}#webpage` },
      ],
    };
  }
  if (
    (m = url.match(/^\/kalenteri-(\d+)(?:-(?:alkuvuosi|loppuvuosi))?$/)) ||
    (m = url.match(/^\/tulostettava-kalenteri-(\d+)$/)) ||
    (m = url.match(/^\/palkkapaivat-(\d{4})$/)) ||
    (m = url.match(/^\/kelan-maksupaivat-(\d{4})$/)) ||
    (m = url.match(/^\/elakkeen-maksupaivat-(\d{4})$/)) ||
    (m = url.match(/^\/kuun-vaiheet-(\d{4})$/)) ||
    (m = url.match(/^\/kesaaika-(\d{4})$/))
  ) {
    const year = m[1];
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${year}`)}#webpage` },
      ],
    };
  }
  if ((m = url.slice(1).match(OBSERVANCE_SLUG_RE))) {
    return {
      isPartOf: [
        { "@id": `${SITE_URL}/#website` },
        { "@id": `${canonicalFor(`/vuosi-${m[2]}`)}#webpage` },
      ],
    };
  }
  return {};
}

export function discoverImageUrlFor(url) {
  let m;
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/discover/viikko-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `${SITE_URL}/discover/kuukausi-${m[1]}-${m[2]}.png`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `${SITE_URL}/discover/vuosi-${m[1]}.png`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    return `${SITE_URL}/discover/pyhat-${m[1]}-${m[2]}.png`;
  }
  return null;
}

export function discoverImageAltFor(url) {
  let m;
  if ((m = url.match(/^\/viikko-(\d+)-(\d+)$/))) {
    return `Kalenterinäkymä: viikko ${m[1]} korostettuna, ${M_FULL[mondayOf(+m[1], +m[2]).getMonth()]} ${m[2]}`;
  }
  if ((m = url.match(/^\/kuukausi-(\d+)-(\d+)$/))) {
    return `Kalenterinäkymä: ${M_FULL[Number(m[1]) - 1]} ${m[2]} viikkonumeroineen`;
  }
  if ((m = url.match(/^\/vuosi-(\d+)$/))) {
    return `Koko vuoden ${m[1]} kalenterinäkymä, kaikki 12 kuukautta`;
  }
  if ((m = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/))) {
    const page = holidayPageFor(m[1], m[2]);
    return page
      ? `Kalenterinäkymä: ${page.displayName} ${m[1]} korostettuna, ${M_FULL[page.date.getMonth()]}`
      : null;
  }
  return null;
}

export function discoverImageNodes(url) {
  const img = discoverImageUrlFor(url);
  if (!img) return [];
  return [
    {
      "@type": "ImageObject",
      "@id": `${img}#discover`,
      url: img,
      contentUrl: img,
      width: 1200,
      height: 675,
      caption: discoverImageAltFor(url),
      representativeOfPage: true,
    },
  ];
}

export function datasetSchema({
  id,
  name,
  description,
  distributionUrl,
  extraDistribution = [],
  temporalCoverage,
  license,
  dateModified,
}) {
  const urls = Array.isArray(distributionUrl) ? distributionUrl : [distributionUrl];
  const landingPage = extraDistribution.find((item) => item.encodingFormat === "text/html")?.contentUrl;
  return {
    "@type": "Dataset",
    "@id": `${SITE_URL}/#dataset-${id}`,
    ...(landingPage
      ? {
          url: landingPage,
          mainEntityOfPage: { "@id": `${landingPage}#webpage` },
        }
      : {}),
    name,
    description,
    creator: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    license,
    dateModified,
    version: FEED_SCHEMA_VERSION,
    inLanguage: "fi-FI",
    temporalCoverage,
    spatialCoverage: { "@type": "Place", name: "Suomi" },
    distribution: [
      ...urls.map((contentUrl) => ({
        "@type": "DataDownload",
        contentUrl,
        encodingFormat: "application/json",
      })),
      ...extraDistribution.map(({ contentUrl, encodingFormat }) => ({
        "@type": "DataDownload",
        contentUrl,
        encodingFormat,
      })),
    ],
  };
}

export function datasetNodes(currentYear = new Date().getFullYear(), feedBuildDate = ymd(new Date())) {
  const temporalCoverage = `2020-01-01/${currentYear + 9}-12-31`;
  const license = `${SITE_URL}/kayttoehdot`;
  const common = { temporalCoverage, license, dateModified: feedBuildDate };

  const weekDataset = datasetSchema({
    ...common,
    id: "week",
    name: "Suomen ISO 8601 -viikkonumerodata",
    description:
      "Koneluettava JSON-data jokaiselle ISO 8601 -viikolle Suomessa: alkamis- ja päättymispäivä, työpäivien määrä, juhlapyhät, vuosineljännes ja vuodenaika. Saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/week/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/week`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/week/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/week/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });
  const monthDataset = datasetSchema({
    ...common,
    id: "month",
    name: "Suomen kuukausittainen viikkodata",
    description:
      "Koneluettava JSON-data jokaiselle kalenterikuukaudelle Suomessa: kuukauden sisältämät ISO-viikot, työpäivien ja viikonloppupäivien määrä sekä arkipyhät. Saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/month/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/month`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/month/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/month/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });
  const yearDataset = datasetSchema({
    ...common,
    id: "year",
    name: "Suomen vuosittainen viikko- ja työpäivädata",
    description:
      "Koneluettava JSON-data jokaiselle vuodelle Suomessa: viikkojen määrä (52 tai 53), työpäivien ja viikonloppupäivien määrä, arkipyhät sekä vuoden ensimmäinen ja viimeinen ISO-viikko. Saatavilla myös CSV- ja XML-muodossa (kaikki vuodet yhdessä tiedostossa). Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/year/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/year`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/year.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/year.xml`, encodingFormat: "application/xml" },
    ],
  });
  const quarterDataset = datasetSchema({
    ...common,
    id: "quarter",
    name: "Suomen vuosineljännesdata",
    description:
      "Koneluettava JSON-data jokaiselle vuosineljännekselle (Q1-Q4): alkamis- ja päättymispäivä, kuukaudet, viikkoväli, työpäivien ja viikonloppupäivien määrä sekä arkipyhät. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/quarter/index.json`,
  });
  const holidayDataset = datasetSchema({
    ...common,
    id: "holidays",
    name: "Suomen pyhäpäivädata",
    description:
      "Koneluettava JSON-data Suomen virallisista pyhäpäivistä ja laajasti vietetyistä vapaapäivistä: nimi, päivämäärä, viikonpäivä, ISO-viikko ja virallinen asema jokaiselle vuodelle. Saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/holidays/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/holiday`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/holiday/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/holiday/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });
  const holidayDetailDataset = datasetSchema({
    ...common,
    id: "holiday",
    name: "Suomen pyhäpäiväkohtainen data",
    description:
      "Koneluettava JSON-data yhdelle nimetylle pyhäpäivälle kerrallaan: päivämäärä, viikonpäivä, ISO-viikko, vuosineljännes, virallinen asema, määräytymissääntö ja lainsäädäntöperuste (kun se on erikseen vahvistettu). Yksi tiedosto per pyhäpäivä per vuosi. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/holiday/index.json`,
  });
  const flagDaysDataset = datasetSchema({
    ...common,
    id: "flag-days",
    name: "Suomen liputuspäivädata",
    description:
      "Koneluettava JSON-data Suomen liputuspäivistä: nimi, päivämäärä, viikonpäivä, ISO-viikko, tyyppi (virallinen, vakiintunut tai kansainvälinen) ja mahdollinen päällekkäisyys pyhäpäivän kanssa jokaiselle vuodelle. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/flag-days/index.json`,
  });
  const workingDayDataset = datasetSchema({
    ...common,
    id: "workingdays",
    name: "Suomen työpäivädata",
    description:
      "Koneluettava JSON-data työpäivien, viikonloppupäivien ja arkipyhien määristä viikko- ja vuositasolla Suomessa, arkipyhien vaikutus työpäivien määrään huomioiden. Päivittyy kerran vuorokaudessa.",
    distributionUrl: [`${SITE_URL}/data/week/index.json`, `${SITE_URL}/data/year/index.json`],
  });
  const monthlyWorkingDaysDataset = datasetSchema({
    ...common,
    id: "monthly-workingdays",
    name: "Suomen kuukausittainen työpäivädata",
    description:
      "Koneluettava JSON-data työpäivien ja viikonloppupäivien määrästä kuukausitasolla Suomessa, arkipyhät huomioiden. Julkinen nimi /data/working-days; saatavilla myös CSV- ja XML-muodossa. Päivittyy kerran vuorokaudessa.",
    distributionUrl: `${SITE_URL}/data/monthly-working-days/index.json`,
    extraDistribution: [
      { contentUrl: `${SITE_URL}/data/working-days`, encodingFormat: "text/html" },
      { contentUrl: `${SITE_URL}/data/working-days/${currentYear}.csv`, encodingFormat: "text/csv" },
      { contentUrl: `${SITE_URL}/data/working-days/${currentYear}.xml`, encodingFormat: "application/xml" },
    ],
  });

  return [
    weekDataset,
    monthDataset,
    yearDataset,
    quarterDataset,
    holidayDataset,
    holidayDetailDataset,
    flagDaysDataset,
    workingDayDataset,
    monthlyWorkingDaysDataset,
  ];
}

export function jsonLdBlock(nodes) {
  const data = {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${json}\n    </script>\n  `;
}

export function breadcrumbNode(url) {
  const trail = breadcrumbTrail(url);
  if (!trail || trail.length < 2) return null;
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalFor(url)}#breadcrumb`,
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: canonicalFor(t.path),
    })),
  };
}

export function faqNodes() {
  return [
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/ukk#faq`,
      inLanguage: "fi-FI",
      dateModified: FAQ_UPDATED,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
}

export function openDataFaqNodes() {
  return [
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/avoin-data#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: openDataFaqs().map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function dataSourcesFaqNodes() {
  return [
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/tietolahteet#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: dataSourcesFaqs().map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function methodologyFaqNodes() {
  return [
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/menetelma#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: methodologyFaqs().map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@type": "HowTo",
      "@id": `${SITE_URL}/menetelma#howto`,
      name: "Näin viikkonumero lasketaan",
      inLanguage: "fi-FI",
      step: [
        { "@type": "HowToStep", text: "Aloita viikko aina maanantaista." },
        { "@type": "HowToStep", text: "Etsi vuoden ensimmäinen torstai - se kertoo, mikä viikko on viikko 1." },
        { "@type": "HowToStep", text: "Viikko, joka sisältää 4. tammikuuta, on aina viikko 1." },
        { "@type": "HowToStep", text: "Jos 1. tammikuuta on torstai (tai karkausvuonna keskiviikko), vuodessa on 53 viikkoa 52:n sijaan." },
      ],
    },
  ];
}

export function editorialPolicyFaqNodes() {
  return [
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/toimitusperiaatteet#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: editorialPolicyFaqs().map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function apiPlaygroundNodes(feedBuildDate = ymd(new Date())) {
  const path = "/api-playground";
  const url = canonicalFor(path);
  const apiNode = (id, name, description, endpointUrl) => ({
    "@type": "WebAPI",
    "@id": `${url}#api-${id}`,
    name,
    description,
    documentation: `${SITE_URL}/avoin-data`,
    termsOfService: `${SITE_URL}/kayttoehdot`,
    endpointUrl,
  });
  const apis = [
    apiNode(
      "week",
      "Viikko Nro -viikkorajapinta",
      "Ilmainen ISO 8601 -viikkonumerodata mille tahansa viikolle/vuodelle, 2020-2035. Ei kirjautumista, ei käyttörajoja.",
      `${SITE_URL}/api/week/{week}/{year}.json`,
    ),
    apiNode(
      "month",
      "Viikko Nro -kuukausirajapinta",
      "Ilmainen kalenterikuukausidata (ISO-viikot, työpäivät) mille tahansa kuukaudelle/vuodelle, 2020-2035. Ei kirjautumista, ei käyttörajoja.",
      `${SITE_URL}/api/month/{month}/{year}.json`,
    ),
    apiNode(
      "year",
      "Viikko Nro -vuosirajapinta",
      "Ilmainen koko vuoden data (viikkojen määrä, pyhäpäivät, liputuspäivät) mille tahansa vuodelle, 2020-2035. Ei kirjautumista, ei käyttörajoja.",
      `${SITE_URL}/api/year/{year}.json`,
    ),
    apiNode(
      "holiday",
      "Viikko Nro -pyhäpäivärajapinta",
      "Ilmainen pyhäpäiväkohtainen data (päivämäärä, viikonpäivä, tarvittaessa oikeusperusta) mille tahansa Suomen 15 nimetystä pyhäpäivästä, 2020-2035. Ei kirjautumista, ei käyttörajoja.",
      `${SITE_URL}/api/holiday/{slug}/{year}.json`,
    ),
  ];
  return [
    pageNode(path, "TechArticle", {
      description: metaFor(path).description,
      inLanguage: "fi",
      dateModified: feedBuildDate,
      mainEntity: apis.map((a) => ({ "@id": a["@id"] })),
    }),
    ...apis,
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi",
      dateModified: feedBuildDate,
      mainEntity: [
        {
          "@type": "Question",
          name: "Onko käytössä nopeusrajoitus?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ei - nämä ovat CDN:stä tarjoiltavia staattisia tiedostoja, ei nopeusrajoitettua rajapintaa.",
          },
        },
        {
          "@type": "Question",
          name: "Tarvitsenko API-avaimen?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Mikään päätepiste ei vaadi tunnistautumista.",
          },
        },
      ],
    },
  ];
}

export function chromeExtensionNodes() {
  const path = CHROME_EXTENSION_PATH;
  const url = canonicalFor(path);
  const f = EXTENSION_FACTS;
  const appId = `${url}#software`;
  return [
    pageNode(path, "WebPage", {
      description: metaFor(path).description,
      dateModified: f.updated,
      mainEntity: { "@id": appId },
      about: { "@id": appId },
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-sentence"] },
      ...ogImageExtra(path),
    }),
    {
      "@type": "SoftwareApplication",
      "@id": appId,
      name: f.name,
      alternateName: "Viikko Nro Chrome-laajennus",
      description:
        "Ilmainen Chrome-laajennus, joka näyttää kuluvan ISO 8601 -viikon numeron selaimen työkalupalkissa sekä viikon päivämäärät, liputuspäivät ja koululomat. Viikkohaku osoiteriviltä komennolla vk.",
      url,
      sameAs: f.storeUrl,
      installUrl: f.storeUrl,
      downloadUrl: f.storeUrl,
      image: `${SITE_URL}/favicon-viikkonro-20260915.webp`,
      applicationCategory: "BrowserApplication",
      applicationSubCategory: f.category,
      operatingSystem: "Windows, macOS, Linux, ChromeOS",
      softwareVersion: f.version,
      fileSize: f.size,
      dateModified: f.updated,
      inLanguage: f.languageCodes,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        url: f.storeUrl,
      },
      featureList: EXTENSION_FEATURES.map((x) => `${x.name}: ${x.desc}`),
      permissions: "Tallennus (asetukset), ajastin (keskiyön päivitys)",
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
    },
    {
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: "Näin asennat Viikko Nro -Chrome-laajennuksen",
      inLanguage: "fi-FI",
      totalTime: "PT1M",
      tool: { "@type": "HowToTool", name: "Google Chrome" },
      step: INSTALL_STEPS.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.name,
        text: step.text,
        url: `${url}#asennus`,
      })),
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: f.updated,
      mainEntity: chromeExtensionFaqs().map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function androidAppNodes() {
  const path = ANDROID_APP_PATH;
  const url = canonicalFor(path);
  const f = ANDROID_APP_FACTS;
  const appId = `${url}#mobile-app`;
  return [
    pageNode(path, "WebPage", {
      description: metaFor(path).description,
      dateModified: f.updated,
      mainEntity: { "@id": appId },
      about: { "@id": appId },
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-sentence"] },
      ...ogImageExtra(path),
    }),
    {
      "@type": "MobileApplication",
      "@id": appId,
      name: f.name,
      alternateName: f.storeName,
      description:
        "Android-sovellus ISO 8601 -viikkonumeroihin, suomalaiseen kalenteriin, päivämäärälaskureihin ja seitsemään aloitusnäytön widgetiin.",
      url,
      image: `${SITE_URL}/mobile/android/app-icon.webp`,
      screenshot: [
        `${SITE_URL}/mobile/android/app-weeks.webp`,
        `${SITE_URL}/mobile/android/app-calendar.webp`,
        `${SITE_URL}/mobile/android/app-tools.webp`,
      ],
      applicationCategory: "UtilitiesApplication",
      applicationSubCategory: "Calendar and week number utility",
      operatingSystem: "Android 7.0 or later",
      availableOnDevice: "Android phone and tablet",
      softwareVersion: f.version,
      inLanguage: f.languageCodes,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
      featureList: [
        ...ANDROID_APP_FEATURES.map((x) => `${x.name}: ${x.desc}`),
        ...ANDROID_WIDGETS.map((x) => `${x.name}: ${x.desc}`),
      ],
      permissions: f.permissionsFi,
      dateModified: f.updated,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: f.updated,
      mainEntity: androidAppFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function datasetPageNodes(family, currentYear = new Date().getFullYear(), feedBuildDate = ymd(new Date())) {
  const url = `${SITE_URL}/data/${family}`;
  const dataset = datasetNodes(currentYear, feedBuildDate).find((node) => node.url === url);
  if (!dataset) throw new Error(`Dataset schema missing for ${url}`);
  return [
    dataset,
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: feedBuildDate,
      mainEntity: datasetPageFaqs(family).map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function homepageFaqNodes() {
  return [
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      inLanguage: "fi-FI",
      dateModified: PARITY_UPDATED,
      mainEntity: featuredFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function currentDateIntentNodes(url) {
  const now = new Date();
  const configs = {
    "/mika-kuukausi-nyt": {
      headline: "Mikä kuukausi nyt on?",
      meta: currentMonthMeta(now),
      faq: currentMonthFaqs(now),
    },
    "/mika-vuosi-nyt": {
      headline: "Mikä vuosi nyt on?",
      meta: currentYearMeta(now),
      faq: currentYearFaqs(now),
    },
    "/viikonpaiva": {
      headline: "Mikä viikonpäivä oli?",
      meta: weekdayMeta,
      faq: weekdayFaqs,
      steps: [
        "Valitse päivämäärä kentästä.",
        "Lue tuloksesta viikonpäivä suomeksi.",
        "Tarkista samalla päivän ISO-viikkonumero ja viikkovuosi.",
      ],
    },
  };
  const config = configs[url];
  if (!config) return [];
  const canonical = canonicalFor(url);
  const graph = [
    pageNode(url, "WebPage", {
      name: config.headline,
      description: config.meta.description,
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
    }),
    {
      "@type": "Article",
      "@id": canonical + "#article",
      headline: config.headline,
      description: config.meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      author: { "@id": SITE_URL + "/#organization" },
      publisher: { "@id": SITE_URL + "/#organization" },
      mainEntityOfPage: { "@id": canonical + "#webpage" },
    },
    {
      "@type": "FAQPage",
      "@id": canonical + "#faq",
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: config.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
  if (config.steps) {
    graph.push({
      "@type": "HowTo",
      "@id": canonical + "#howto",
      name: "Näin selvität päivämäärän viikonpäivän",
      dateModified: CONTENT_UPDATED,
      step: config.steps.map((item, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        text: item,
      })),
    });
  }
  return graph;
}

export function weekParityPageNodes(today = new Date(), renderDay = helsinkiDayKey()) {
  const meta = parityMeta(today);
  const faq = parityPageFaqs(today);
  const canonical = canonicalFor(PARITY_PATH);
  return [
    pageNode(PARITY_PATH, "WebPage", {
      name: "Parillinen vai pariton viikko?",
      description: meta.description,
      datePublished: PARITY_UPDATED,
      dateModified: renderDay,
      mainEntity: { "@id": `${canonical}#article` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
    }),
    {
      "@type": "Article",
      "@id": `${canonical}#article`,
      headline: "Parillinen vai pariton viikko?",
      description: meta.description,
      inLanguage: "fi-FI",
      datePublished: PARITY_UPDATED,
      dateModified: renderDay,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${canonical}#webpage` },
    },
    {
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      inLanguage: "fi-FI",
      dateModified: renderDay,
      mainEntity: faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];
}

export function mikaOnViikkonumeroNodes() {
  const faq = whatWeekFaqs;
  const url = canonicalFor("/mika-on-viikkonumero");
  const meta = metaFor("/mika-on-viikkonumero");
  return [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "Mikä on viikkonumero? ISO 8601 -viikkolaskenta selitettynä",
      description: meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-01-01",
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      about: [
        { "@type": "Thing", name: "ISO 8601" },
        { "@type": "Thing", name: "Viikkonumero" },
        { "@type": "Thing", name: "Kalenteri" },
      ],
    },
    pageNode("/mika-on-viikkonumero", "WebPage", {
      description: meta.description,
      datePublished: "2026-01-01",
      dateModified: CONTENT_UPDATED,
      mainEntity: { "@id": `${url}#article` },
    }),
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/mika-on-viikkonumero#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@type": "HowTo",
      "@id": `${url}#howto`,
      name: "Näin lasket viikkonumeron käsin",
      description:
        "Kolmen vaiheen menetelmä päivämäärän ISO 8601 -viikkonumeron laskemiseen.",
      inLanguage: "fi-FI",
      mainEntityOfPage: { "@id": `${url}#webpage` },
      step: [
        "Etsi tarkasteltavan päivän sisältävän viikon torstai.",
        "Katso, mihin vuoteen torstai kuuluu - se on ISO-viikkovuosi.",
        "Laske, kuinka mones torstai se on kyseisenä vuonna - se on viikkonumero.",
      ].map((text, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        text,
      })),
    },
  ];
}

export function weekStartsMondayNodes() {
  const path = "/viikko-alkaa-maanantaista";
  const url = canonicalFor(path);
  const meta = metaFor(path);
  return [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "Miksi viikko alkaa maanantaista?",
      description: meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      about: [
        { "@type": "Thing", name: "ISO 8601" },
        { "@type": "Thing", name: "Viikon ensimmäinen päivä" },
        { "@type": "Thing", name: "ISO-viikkovuosi" },
      ],
    },
    pageNode(path, "WebPage", {
      description: meta.description,
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      mainEntity: { "@id": `${url}#article` },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      mainEntity: weekStartsMondayFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function finlandVsUsaNodes() {
  const path = "/suomi-vs-usa-viikkonumerot";
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const faq = finlandVsUsaFaqs();
  return [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "Suomi vs. USA: miksi viikkonumero eroaa?",
      description: meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-08-05",
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      about: [
        { "@type": "Thing", name: "ISO 8601" },
        { "@type": "Thing", name: "Viikkonumero" },
        { "@type": "Thing", name: "Yhdysvaltain viikkonumerointi" },
      ],
    },
    pageNode(path, "WebPage", {
      description: meta.description,
      datePublished: "2026-08-05",
      dateModified: CONTENT_UPDATED,
      mainEntity: { "@id": `${url}#article` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-08-05",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function printIntentNodes(pathname) {
  const listMatch = pathname.match(/^\/tulosta-(\d+)$/);
  const calendarMatch = pathname.match(/^\/tulostettava-kalenteri-(\d+)$/);
  if (!listMatch && !calendarMatch) return [];

  const year = Number((listMatch || calendarMatch)[1]);
  const faqsForPage = listMatch
    ? printListFaqs(year)
    : printableCalendarFaqs(year);
  const url = canonicalFor(pathname);
  const meta = metaFor(pathname);
  return [
    pageNode(pathname, "WebPage", {
      description: meta.description,
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      mainEntity: { "@id": `${url}#faq` },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      mainEntity: faqsForPage.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function schoolHolidayNodes(year) {
  const pathname = `/koululomat-${year}`;
  const url = canonicalFor(pathname);
  const meta = metaFor(pathname);
  const page = schoolHolidayPage(year);
  if (!meta || !page) return [];
  const dateModified = schoolHolidayVerifiedAt(year);
  const faq = schoolHolidayFaqs(year);
  const citations = page.sourceKeys.map(
    (key) => SCHOOL_HOLIDAY_SOURCES[key].url,
  );
  return [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: `Koululomat ${year} - hiihto- ja syyslomat`,
      description: meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-08-04",
      dateModified,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      citation: citations,
      about: [
        { "@type": "Thing", name: `Koululomat ${year}` },
        { "@type": "Thing", name: "Hiihtoloma" },
        { "@type": "Thing", name: "Syysloma" },
      ],
    },
    pageNode(pathname, "WebPage", {
      description: meta.description,
      datePublished: "2026-08-04",
      dateModified,
      mainEntity: { "@id": `${url}#article` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
    }),
    ...(faq.length > 0
      ? [
          {
            "@type": "FAQPage",
            "@id": `${url}#faq`,
            inLanguage: "fi-FI",
            datePublished: "2026-08-04",
            dateModified,
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          },
        ]
      : []),
  ];
}

export function weeksInYearNodes(currentYear = new Date().getFullYear()) {
  const url = canonicalFor("/kuinka-monta-viikkoa-vuodessa");
  const meta = metaFor("/kuinka-monta-viikkoa-vuodessa");
  const faq = weeksInYearFaqs(currentYear);
  return [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: "Kuinka monta viikkoa vuodessa on?",
      description: meta.description,
      inLanguage: "fi-FI",
      datePublished: "2026-01-01",
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      about: [
        { "@type": "Thing", name: "ISO 8601" },
        { "@type": "Thing", name: "Viikkovuosi" },
        { "@type": "Thing", name: "Viikko 53" },
      ],
    },
    pageNode("/kuinka-monta-viikkoa-vuodessa", "WebPage", {
      description: meta.description,
      datePublished: "2026-01-01",
      dateModified: CONTENT_UPDATED,
      mainEntity: { "@id": `${url}#article` },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-01-01",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function holidaysEventNodes(year) {
  return [
    {
      "@type": "ItemList",
      "@id": `${SITE_URL}/pyhapaivat-${year}#events`,
      name: `Suomen pyhäpäivät ${year}`,
      itemListElement: holidaysInYear(year).map((h, i) => {
        const path = holidayLinkPath(h.name, h.date);
        return {
          "@type": "ListItem",
          position: i + 1,
          name: h.name,
          ...(path ? { url: canonicalFor(path) } : {}),
        };
      }),
    },
  ];
}

export function flagDayNodes(year) {
  const path = `/liputuspaivat-${year}`;
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const days = flagDaysInYear(year);
  const faq = flagDayFaqs(year);

  const itemListElement = days.map((d, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: d.name,
    url: `${url}#${d.slug}`,
  }));

  return [
    pageNode(path, "CollectionPage", {
      name: `Suomen liputuspäivät ${year}`,
      description: meta.description,
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
      ...ogImageExtra(path),
      ...entityParentExtra(path),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function holidaysInWeekForPrerender(isoYearNum, week) {
  const monday = mondayOf(week, isoYearNum);
  const sunday = addDays(monday, 6);
  const years = new Set([monday.getFullYear(), sunday.getFullYear()]);
  const candidates = [...years].flatMap((y) => holidaysInYear(y));
  return candidates
    .filter((h) => h.date >= monday && h.date <= sunday)
    .sort((x, y) => x.date - y.date);
}

export function flagDaysInWeekForPrerender(isoYearNum, week) {
  const monday = mondayOf(week, isoYearNum);
  const sunday = addDays(monday, 6);
  const years = new Set([monday.getFullYear(), sunday.getFullYear()]);
  const candidates = [...years].flatMap((y) => flagDaysInYear(y));
  return candidates
    .filter((f) => f.date >= monday && f.date <= sunday)
    .sort((x, y) => x.date - y.date);
}

export function weekWorkingDaysCount(monday, officialHolidays) {
  const officialDates = new Set(officialHolidays.map((h) => h.date.toDateString()));
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(monday, i);
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5 && !officialDates.has(d.toDateString())) {
      count += 1;
    }
  }
  return count;
}

export function weekFaqNodes(w, y) {
  const mo = mondayOf(w, y);
  const su = addDays(mo, 6);
  const moStr = fmtShortFi(mo);
  const suStr = fmtShortFi(su);
  const officialHolidays = holidaysInWeekForPrerender(y, w).filter((h) => h.official);

  const faq = [
    [`Mikä viikko on ${moStr}?`, `${moStr} kuuluu viikkoon ${w} vuonna ${y}.`],
    [
      `Milloin viikko ${w} vuonna ${y} alkaa ja päättyy?`,
      `Viikko ${w} vuonna ${y} alkaa maanantaina ${moStr} ja päättyy sunnuntaina ${suStr}.`,
    ],
  ];
  if (officialHolidays.length > 0) {
    faq.push([
      `Mitä juhlapäiviä viikolla ${w} vuonna ${y} on?`,
      `Viikolla ${w} vuonna ${y} vietetään: ${officialHolidays.map((h) => h.name).join(", ")}.`,
    ]);
  }

  return [
    {
      "@type": "FAQPage",
      "@id": `${canonicalFor(`/viikko-${w}-${y}`)}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];
}

export function workingDaysFaqNodes(year) {
  const faq = workingDaysFaqs(year);
  return [
    {
      "@type": "FAQPage",
      "@id": `${canonicalFor(`/tyopaivat-${year}`)}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function monthFaqNodes(month, year) {
  const faq = monthFaqs(month, year);
  return [
    {
      "@type": "FAQPage",
      "@id": `${canonicalFor(`/kuukausi-${month}-${year}`)}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function yearFaqNodes(year) {
  const faq = yearFaqs(year);
  return [
    {
      "@type": "FAQPage",
      "@id": `${canonicalFor(`/vuosi-${year}`)}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function monthlyWorkingDaysNodes(month, year) {
  const path = `/tyopaivat-${M_SLUG[month - 1]}-${year}`;
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const faq = monthlyWorkingDayFaqs(month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  const officialHolidayByDay = new Map(
    holidaysInYear(year)
      .filter((h) => h.official && h.date.getMonth() === month - 1)
      .map((h) => [h.date.getDate(), h.name]),
  );
  const itemListElement = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dow = new Date(year, month - 1, day).getDay();
    const holidayName = officialHolidayByDay.get(day);
    const status = holidayName
      ? "Arkipyhä"
      : dow === 0 || dow === 6
        ? "Viikonloppu"
        : "Työpäivä";
    return {
      "@type": "ListItem",
      position: day,
      item: {
        "@type": "Thing",
        name: `${day}.${month}.${year}`,
        description: holidayName ? `${status}: ${holidayName}` : status,
      },
    };
  });

  return [
    pageNode(path, "CollectionPage", {
      description: meta.description,
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
      ...ogImageExtra(path),
      ...entityParentExtra(path),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function quarterNodes(quarter, year) {
  const path = `/q${quarter}-${year}`;
  const url = canonicalFor(path);
  const meta = metaFor(path);
  const stats = quarterStats(year, quarter);
  const faq = quarterFaqs(quarter, year);

  const hasPart = stats.months.map((m) => ({
    "@id": `${canonicalFor(`/kuukausi-${m}-${year}`)}#webpage`,
  }));
  const itemListElement = stats.weeks.map((w, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: canonicalFor(`/viikko-${w.week}-${w.year}`),
  }));

  return [
    pageNode(path, "CollectionPage", {
      name: `Q${quarter} ${year}`,
      description: meta.description,
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
      hasPart,
      ...ogImageExtra(path),
      ...entityParentExtra(path),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function calendarPageNodes(year) {
  const url = canonicalFor(`/kalenteri-${year}`);
  const meta = calendarMeta(year, null, false);
  const faq = calendarFaqs(year);
  return [
    pageNode(`/kalenteri-${year}`, "CollectionPage", {
      description: meta.description,
      datePublished: "2026-08-03",
      dateModified: CALENDAR_CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      associatedMedia: {
        "@type": "MediaObject",
        "@id": `${SITE_URL}${calendarPdfPath(year)}#media`,
        name: `A4-kuukausikalenteri ${year} (PDF)`,
        contentUrl: `${SITE_URL}${calendarPdfPath(year)}`,
        encodingFormat: "application/pdf",
        inLanguage: "fi-FI",
        dateModified: CONTENT_UPDATED,
      },
      ...ogImageExtra(`/kalenteri-${year}`),
      ...entityParentExtra(`/kalenteri-${year}`),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: 12,
        itemListElement: Array.from({ length: 12 }, (_, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: canonicalFor(`/kuukausi-${index + 1}-${year}`),
        })),
      },
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-08-03",
      dateModified: CALENDAR_CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function weekCollectionNodes(pathname) {
  let match = pathname.match(/^\/vuosi-(\d+)$/);
  let urls;
  let collectionName;
  let hasPart;
  let speakable;
  let mentions;

  if (match) {
    const year = Number(match[1]);
    collectionName = `Viikkonumerot ${year}`;
    urls = Array.from(
      { length: weeksInIsoYear(year) },
      (_, index) => canonicalFor(`/viikko-${index + 1}-${year}`),
    );
    hasPart = [
      ...M_FULL.map((_, index) => ({
        "@id": `${canonicalFor(`/kuukausi-${index + 1}-${year}`)}#webpage`,
      })),
      ...[1, 2, 3, 4].map((q) => ({
        "@id": `${canonicalFor(`/q${q}-${year}`)}#webpage`,
      })),
    ];
    speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: [".answer-sentence"],
    };
  } else {
    match = pathname.match(/^\/kuukausi-(\d+)-(\d+)$/);
    if (!match) return [];
    const month = Number(match[1]);
    const year = Number(match[2]);
    const seen = new Set();
    urls = [];
    const days = new Date(year, month, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(year, month - 1, day);
      const weekYear = isoYear(date);
      const week = isoWeek(date);
      const key = `${weekYear}-${week}`;
      if (
        seen.has(key) ||
        weekYear < PRERENDER_MIN_YEAR ||
        weekYear > PRERENDER_MAX_YEAR
      ) {
        continue;
      }
      seen.add(key);
      urls.push(canonicalFor(`/viikko-${week}-${weekYear}`));
    }
    collectionName = metaFor(pathname).title;
    speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: [".answer-sentence"],
    };
    const monthHolidayMentions = holidaysInYear(year)
      .filter((h) => h.date.getMonth() === month - 1)
      .map((h) => holidayLinkPath(h.name, h.date))
      .filter(Boolean)
      .map((path) => ({ "@id": `${canonicalFor(path)}#webpage` }));
    if (monthHolidayMentions.length > 0) mentions = monthHolidayMentions;
  }

  const meta = metaFor(pathname);
  return [
    pageNode(pathname, "CollectionPage", {
      name: collectionName,
      description: meta.description,
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      ...(hasPart ? { hasPart } : {}),
      ...(speakable ? { speakable } : {}),
      ...(mentions ? { mentions } : {}),
      ...ogImageExtra(pathname),
      ...monthPdfExtra(pathname),
      ...entityParentExtra(pathname),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: urls.length,
        itemListElement: urls.map((url, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url,
        })),
      },
    }),
  ];
}

export function namedHolidayNodes(year, slug) {
  const page = holidayPageFor(year, slug);
  if (!page) return [];
  const meta = holidayPageMeta(year, slug);
  const faq = holidayFaqs(page);
  const url = canonicalFor(page.path);
  const links = holidayWeekLinks(page);
  return [
    pageNode(page.path, "WebPage", {
      description: meta.description,
      datePublished: "2026-08-03",
      dateModified: page.updated ?? CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
      about: { "@type": "Thing", name: `${page.displayName} ${page.year}` },
      mentions: [
        { "@id": `${canonicalFor(links.week.path)}#webpage` },
        { "@id": `${canonicalFor(links.month.path)}#webpage` },
        { "@id": `${canonicalFor(links.year.path)}#webpage` },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".answer-sentence"],
      },
      ...ogImageExtra(page.path),
      ...entityParentExtra(page.path),
    }),
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-08-03",
      dateModified: page.updated ?? CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export function nameDayPageNodes(url) {
  let page;
  let meta;
  let type;
  let match;
  if (url === "/nimipaivat/tanaan") {
    page = todayNameDayPage();
    meta = todayNameDayMeta();
    type = "today";
  } else if ((match = url.match(/^\/nimipaiva\/([a-z0-9-]+)$/))) {
    page = nameDayNamePage(match[1]);
    meta = nameDayNameMeta(match[1]);
    type = "name";
  } else if ((match = url.match(/^\/nimipaivat\/(\d{2}-\d{2})$/))) {
    page = nameDayDatePage(match[1]);
    meta = nameDayDateMeta(match[1]);
    type = "date";
  }
  if (!page || !meta) return [];
  const faq = nameDayFaqs(page, type);
  const canonical = canonicalFor(url);
  return [
    pageNode(url, "WebPage", {
      description: meta.description,
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      author: { "@id": `${SITE_URL}/#organization` },
    }),
    {
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      inLanguage: "fi-FI",
      datePublished: "2026-08-04",
      dateModified: CONTENT_UPDATED,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];
}

export const CALCULATOR_SCHEMA = {
  "/paivamaara-viikoksi": {
    howToName: "Näin selvität päivämäärän viikkonumeron",
    steps: [
      "Valitse tai kirjoita päivämäärä yläkentässä.",
      "Työkalu näyttää heti viikkonumeron, viikonpäivän ja koko viikon päivämäärät.",
      'Avaa "avaa viikko" -linkki nähdäksesi viikon juhlapäivät, nimipäivät ja muut tiedot.',
    ],
    faq: [
      [
        "Miksi 29.-31. joulukuuta voi kuulua ensi vuoden viikkoon 1?",
        "ISO 8601 -standardin mukaan vuoden ensimmäinen viikko on se, johon vuoden ensimmäinen torstai osuu. Jos esimerkiksi 1. tammikuuta on torstai, myös sitä edeltävä maanantai (29. joulukuuta) kuuluu jo uuden vuoden viikkoon 1.",
      ],
      [
        "Toimiiko laskuri myös menneille päivämäärille?",
        'Kyllä, laskuri laskee viikkonumeron mille tahansa päivämäärälle. "Avaa viikko" -linkki vie tarkempiin tietoihin vuosilta 2020-2035; tätä väliä vanhemmat tai uudemmat päivämäärät saavat silti oikean viikkonumeron, mutta ilman omaa tietosivua.',
      ],
      [
        "Mistä standardista viikkonumero lasketaan?",
        "ISO 8601 -standardista, jota käytetään Suomessa ja koko Euroopassa. Katso tarkempi selitys sivulta Mikä on viikkonumero.",
      ],
    ],
  },
  "/viikko-paivamaaraksi": {
    howToName: "Näin selvität viikon alkamis- ja päättymispäivän",
    steps: [
      "Syötä viikkonumero (1-53).",
      "Syötä vuosi.",
      "Näet heti viikon alkamis- ja päättymispäivän sekä kaikki seitsemän viikonpäivää.",
    ],
    faq: [
      [
        "Miksi viikko 1 voi alkaa jo edellisenä joulukuuna?",
        "Koska vuoden ensimmäinen viikko määräytyy vuoden ensimmäisen torstain mukaan, sen maanantai voi olla vielä edellisen kalenterivuoden puolella. Esimerkiksi viikko 1/2026 alkaa maanantaina 29.12.2025.",
      ],
      [
        "Onko joka vuodessa viikko 53?",
        "Ei. Useimmissa vuosissa on 52 viikkoa; viikko 53 esiintyy vain noin joka viidennessä tai kuudennessa vuodessa. Katso, mitkä vuodet ovat 53 viikon vuosia.",
      ],
      [
        "Mitä tapahtuu, jos syötän viikon, jota kyseisessä vuodessa ei ole?",
        "Laskuri ei näytä tulosta, koska sellaista viikkoa ei ole olemassa kyseiselle vuodelle. Tarkista ensin, onko vuodessa 52 vai 53 viikkoa.",
      ],
    ],
  },
  "/tyopaivalaskuri": {
    dateModified: WORKING_DAYS_UPDATED,
    howToName: "Näin lasket työpäivät kahden päivämäärän välillä",
    steps: [
      "Valitse työpäivät tai Kelan arkipäivät.",
      "Valitse alkupäivä.",
      "Valitse loppupäivä.",
      "Näet heti laskettavien päivien, pois jäävien viikonpäivien, pyhäpäivien ja kaikkien kalenteripäivien määrän.",
    ],
    faq: workingDaysBetweenFaqs.map(({ q, a }) => [q, a]),
  },
  "/paivien-erotus": {
    howToName: "Näin lasket päivien erotuksen kahden päivämäärän välillä",
    steps: [
      "Valitse ensimmäinen päivämäärä.",
      "Valitse toinen päivämäärä.",
      "Näet heti päivien ja viikkojen erotuksen.",
    ],
    faq: [
      [
        "Lasketaanko molemmat päivämäärät mukaan erotukseen?",
        "Erotus on päivämäärien välinen etäisyys, ei niiden välissä olevien kalenteripäivien lukumäärä molemmat reunat mukaan lukien. Esimerkiksi 1.1. ja 2.1. välissä on 1 päivä.",
      ],
      [
        "Mitä eroa tällä ja työpäivälaskurilla on?",
        "Tämä laskuri laskee kaikki päivät, myös viikonloput ja arkipyhät. Jos tarvitset vain arkipäivien määrän, käytä työpäivälaskuria.",
      ],
      [
        "Miksi koko kalenterivuoden erotus on 364 eikä 365 päivää?",
        "Koska erotus lasketaan päivämäärien välisenä etäisyytenä. Esimerkiksi 1.1. ja 31.12. saman vuoden välissä on 364 päivää, vaikka vuodessa on 365 (tai karkausvuonna 366) päivää.",
      ],
    ],
  },
};

export function faqPageNode(url, items, dateModified = CONTENT_UPDATED) {
  return {
    "@type": "FAQPage",
    "@id": `${canonicalFor(url)}#faq`,
    inLanguage: "fi-FI",
    dateModified,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function howToNode(url, name, steps) {
  return {
    "@type": "HowTo",
    "@id": `${canonicalFor(url)}#howto`,
    name,
    inLanguage: "fi-FI",
    step: steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
  };
}

export function observanceNodes(url) {
  const m = url.slice(1).match(OBSERVANCE_SLUG_RE);
  const page = observancePage(m[1], +m[2]);
  return [
    pageNode(url, "WebPage", {
      description: observanceMeta(m[1], +m[2]).description,
      about: { "@type": "Thing", name: page.name },
      mentions: [
        { "@id": `${canonicalFor(page.weekPath)}#webpage` },
        { "@id": `${canonicalFor(page.monthPath)}#webpage` },
        { "@id": `${canonicalFor(`/vuosi-${page.year}`)}#webpage` },
      ],
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".answer-sentence"] },
      ...entityParentExtra(url),
    }),
    faqPageNode(url, observanceFaqs(page)),
    {
      "@type": "ItemList",
      "@id": `${canonicalFor(url)}#upcoming`,
      name: `${page.name} tulevina vuosina`,
      itemListElement: upcomingYears(page.slug, page.year).map((u, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${page.name} ${u.year}: ${ymd(u.date)}`,
        url: canonicalFor(u.path),
      })),
    },
  ];
}

export function benefitPaymentNodes(url, year, benefits, faqs) {
  return [
    faqPageNode(url, faqs),
    ...benefits.map((b) => ({
      "@type": "ItemList",
      "@id": `${canonicalFor(url)}#${b.id}`,
      name: `${b.name}: maksupäivät ${year}`,
      description: `Sääntö: ${b.rule}.`,
      itemListElement: benefitPaymentsInYear(year, b).map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${r.monthName}: ${ymd(r.actual)}${r.moved ? ` (${r.early ? "etuajassa" : "siirtyy"}, ${r.reason})` : ""}`,
      })),
    })),
  ];
}

export function paydayNodes(year) {
  const url = `/palkkapaivat-${year}`;
  return [
    faqPageNode(url, paydayFaqs(year)),
    {
      "@type": "ItemList",
      "@id": `${canonicalFor(url)}#paydays-${DEFAULT_PAYDAY}`,
      name: `Palkkapäivät ${year}, kuun ${DEFAULT_PAYDAY}. päivä`,
      itemListElement: paydaysInYear(year, DEFAULT_PAYDAY).map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${r.monthName}: ${ymd(r.actual)}${r.moved ? ` (siirtyy, ${r.reason})` : ""}`,
      })),
    },
  ];
}

export function dstNodes(year) {
  const url = `/kesaaika-${year}`;
  const { start, end } = dstChanges(year);
  return [
    faqPageNode(url, dstFaqs(year)),
    {
      "@type": "ItemList",
      "@id": `${canonicalFor(url)}#changes`,
      name: `Kellojen siirto ${year}`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: `Kesäaika alkaa ${ymd(start.date)} klo 03.00 -> 04.00 (UTC+3)` },
        { "@type": "ListItem", position: 2, name: `Talviaika alkaa ${ymd(end.date)} klo 04.00 -> 03.00 (UTC+2)` },
      ],
    },
  ];
}

export const SUN_CITY_BY_PATH = Object.fromEntries(SUN_CITIES.map((c) => [sunCityPath(c.slug), c]));

export function sunNodes(url, today = new Date()) {
  const dayKey = helsinkiDayKey();
  if (url === SUN_HUB_PATH) return [faqPageNode(url, sunHubFaqs(today), dayKey)];
  const city = SUN_CITY_BY_PATH[url];
  return [
    faqPageNode(url, sunCityFaqs(city.slug, today), dayKey),
    {
      "@type": "Place",
      "@id": `${canonicalFor(url)}#place`,
      name: city.name,
      address: { "@type": "PostalAddress", addressLocality: city.name, addressCountry: "FI" },
      geo: { "@type": "GeoCoordinates", latitude: city.lat, longitude: city.lon },
    },
  ];
}

export function moonNodes(year) {
  const url = `/kuun-vaiheet-${year}`;
  return [
    faqPageNode(url, moonFaqs(year)),
    {
      "@type": "ItemList",
      "@id": `${canonicalFor(url)}#taysikuut`,
      name: `Täysikuut ${year}`,
      itemListElement: phaseList(year, "taysikuu").map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Täysikuu ${ymd(e.date)} klo ${e.time} (Suomen aikaa, ${e.instant.toISOString().slice(0, 16)}Z)`,
      })),
    },
  ];
}

export function ageCalculatorNodes() {
  return [
    faqPageNode(AGE_PATH, ageFaqs()),
    howToNode(AGE_PATH, "Näin lasket tarkan ikäsi", AGE_STEPS),
  ];
}

export function dateCalculatorNodes() {
  return [
    faqPageNode(DATE_CALCULATOR_PATH, dateCalculatorFaqs()),
    howToNode(DATE_CALCULATOR_PATH, "Näin lasket päivämäärän päivien, viikkojen tai kuukausien päähän", DATE_CALCULATOR_STEPS),
  ];
}

export const OFFSET_BY_PATH = Object.fromEntries(OFFSETS.map((n) => [offsetPath(n), n]));

export function dateOffsetNodes(url, today = new Date()) {
  const n = OFFSET_BY_PATH[url];
  const year = today.getFullYear();
  return [
    faqPageNode(url, offsetFaqs(n, today)),
    {
      "@type": "ItemList",
      "@id": `${canonicalFor(url)}#month-starts`,
      name: `${n} päivää kunkin kuukauden alusta vuonna ${year}`,
      itemListElement: monthlyTable(n, year).map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${ymd(r.from)} + ${n} päivää = ${ymd(r.result)}`,
      })),
    },
  ];
}

export function countdownNodes(url) {
  const countdown = COUNTDOWN_BY_PATH[url];
  return countdown ? [faqPageNode(url, countdownFaqs(countdown, new Date()))] : [];
}

export function calendarSubscriptionNodes(currentYear = new Date().getFullYear()) {
  const url = CALENDAR_SUBSCRIPTION_PATH;
  return [
    faqPageNode(url, calendarSubscriptionFaqs(currentYear)),
    howToNode(
      url,
      "Viikkonumerot ja pyhäpäivät Google-kalenteriin, Outlookiin tai iPhoneen",
      CALENDAR_SUBSCRIPTION_STEPS.flatMap((g) => g.steps.map((s) => `${g.app}: ${s}`)),
    ),
    ...ICS_FEEDS.map((feed) => ({
      "@type": "DataFeed",
      "@id": `${SITE_URL}${feed.path}#feed`,
      name: feed.calName,
      description: feed.desc,
      url: `${SITE_URL}${feed.path}`,
      encodingFormat: "text/calendar",
      inLanguage: "fi-FI",
      isAccessibleForFree: true,
      publisher: { "@id": `${SITE_URL}/#organization` },
    })),
  ];
}

export function widgetEmbedNodes() {
  const url = WIDGET_EMBED_PAGE_PATH;
  return [
    faqPageNode(url, widgetFaqs()),
    howToNode(url, "Viikkonumero-widgetin upottaminen omalle sivulle", WIDGET_EMBED_STEPS),
  ];
}

export function calculatorNodes(url) {
  const entry = CALCULATOR_SCHEMA[url];
  if (!entry) return [];
  return [
    {
      "@type": "HowTo",
      "@id": `${canonicalFor(url)}#howto`,
      name: entry.howToName,
      inLanguage: "fi-FI",
      dateModified: entry.dateModified || CONTENT_UPDATED,
      step: entry.steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        text: s,
      })),
    },
    faqPageNode(
      url,
      entry.faq.map(([q, a]) => ({ q, a })),
      entry.dateModified || CONTENT_UPDATED,
    ),
  ];
}

export function getPageJsonLdNodes(url, { today = new Date(), renderDay } = {}) {
  const currentYear = today.getFullYear();
  const isWeekYearHub = /^\/vuosi-\d+$/.test(url);
  const meta = metaFor(url);
  if (!meta) return null;

  if (!isIndexable(url, currentYear) && !isWeekYearHub) {
    return null;
  }
  if (meta.robots?.startsWith("noindex")) {
    return null;
  }

  const nodes = [];
  const crumb = breadcrumbNode(url);
  if (crumb) nodes.push(crumb);
  nodes.push(...discoverImageNodes(url));

  if (url === "/ukk") nodes.push(...faqNodes());
  if (url === REFUND_PATH) nodes.push(faqPageNode(url, refundFaqs(), LEGAL_UPDATED));
  if (url === "/") nodes.push(...homepageFaqNodes(), ...datasetNodes(currentYear));
  if (url === "/avoin-data") nodes.push(...openDataFaqNodes(), ...datasetNodes(currentYear));
  if (url === "/tietolahteet") nodes.push(...dataSourcesFaqNodes());
  if (url === "/menetelma") nodes.push(...methodologyFaqNodes());
  if (url === "/toimitusperiaatteet") nodes.push(...editorialPolicyFaqNodes());
  if (url === "/api-playground") nodes.push(...apiPlaygroundNodes());
  if (url === CHROME_EXTENSION_PATH) nodes.push(...chromeExtensionNodes());
  if (url === ANDROID_APP_PATH) nodes.push(...androidAppNodes());
  const datasetPageMatch = url.match(/^\/data\/(week|month|year|holiday|working-days)$/);
  if (datasetPageMatch) nodes.push(...datasetPageNodes(datasetPageMatch[1], currentYear));

  if (["/mika-kuukausi-nyt", "/mika-vuosi-nyt", "/viikonpaiva"].includes(url)) {
    nodes.push(...currentDateIntentNodes(url));
  }
  if (url === "/mika-on-viikkonumero") {
    nodes.push(...mikaOnViikkonumeroNodes());
  }
  if (url === PARITY_PATH) {
    nodes.push(...weekParityPageNodes(today, renderDay));
  }
  if (url === "/viikko-alkaa-maanantaista") {
    nodes.push(...weekStartsMondayNodes());
  }
  if (url === "/suomi-vs-usa-viikkonumerot") {
    nodes.push(...finlandVsUsaNodes());
  }
  if (/^\/(?:tulosta-|tulostettava-kalenteri-)\d+$/.test(url)) {
    nodes.push(...printIntentNodes(url));
  }

  const schoolHolidayMatch = url.match(/^\/koululomat-(\d+)$/);
  if (schoolHolidayMatch) {
    nodes.push(...schoolHolidayNodes(Number(schoolHolidayMatch[1])));
  }
  if (url === "/kuinka-monta-viikkoa-vuodessa") {
    nodes.push(...weeksInYearNodes(currentYear));
  }

  const holidaysMatch = url.match(/^\/pyhapaivat-(\d+)$/);
  if (holidaysMatch) nodes.push(...holidaysEventNodes(+holidaysMatch[1]));

  const flagDaysMatch = url.match(/^\/liputuspaivat-(\d+)$/);
  if (flagDaysMatch) nodes.push(...flagDayNodes(+flagDaysMatch[1]));

  const workingDaysMatch = url.match(/^\/tyopaivat-(\d+)$/);
  if (workingDaysMatch) nodes.push(...workingDaysFaqNodes(+workingDaysMatch[1]));

  const monthlyWorkingDaysMatch = url.match(/^\/tyopaivat-([a-z]+)-(\d+)$/);
  if (monthlyWorkingDaysMatch) {
    const mi = M_SLUG.indexOf(monthlyWorkingDaysMatch[1]);
    if (mi !== -1) {
      nodes.push(...monthlyWorkingDaysNodes(mi + 1, +monthlyWorkingDaysMatch[2]));
    }
  }

  const namedHolidayMatch = url.match(/^\/pyhat-(\d+)\/([a-z0-9-]+)$/);
  if (namedHolidayMatch) {
    nodes.push(...namedHolidayNodes(+namedHolidayMatch[1], namedHolidayMatch[2]));
  }
  if (/^\/nimipaiva(?:t)?\//.test(url)) nodes.push(...nameDayPageNodes(url));

  const weekMatch = url.match(/^\/viikko-(\d+)-(\d+)$/);
  if (weekMatch) nodes.push(...weekFaqNodes(+weekMatch[1], +weekMatch[2]));

  const calendarMatch = url.match(/^\/kalenteri-(\d+)$/);
  if (calendarMatch) nodes.push(...calendarPageNodes(+calendarMatch[1]));

  const monthMatch = url.match(/^\/kuukausi-(\d+)-(\d+)$/);
  if (monthMatch) nodes.push(...monthFaqNodes(+monthMatch[1], +monthMatch[2]));

  const quarterMatch = url.match(/^\/q([1-4])-(\d+)$/);
  if (quarterMatch) nodes.push(...quarterNodes(+quarterMatch[1], +quarterMatch[2]));

  const yearMatch = url.match(/^\/vuosi-(\d+)$/);
  if (yearMatch) nodes.push(...yearFaqNodes(+yearMatch[1]));

  if (/^\/(?:vuosi-\d+|kuukausi-\d+-\d+)$/.test(url)) {
    nodes.push(...weekCollectionNodes(url));
  }
  if (CALCULATOR_SCHEMA[url]) nodes.push(...calculatorNodes(url));

  const paydayMatch = url.match(/^\/palkkapaivat-(\d{4})$/);
  if (paydayMatch) nodes.push(...paydayNodes(+paydayMatch[1]));
  const kelaMatch = url.match(/^\/kelan-maksupaivat-(\d{4})$/);
  if (kelaMatch) {
    nodes.push(
      ...benefitPaymentNodes(
        url,
        +kelaMatch[1],
        KELA_BENEFITS,
        kelaPaymentFaqs(+kelaMatch[1]),
      ),
    );
  }
  if (OBSERVANCE_SLUG_RE.test(url.slice(1))) nodes.push(...observanceNodes(url));
  const pensionMatch = url.match(/^\/elakkeen-maksupaivat-(\d{4})$/);
  if (pensionMatch) {
    nodes.push(
      ...benefitPaymentNodes(
        url,
        +pensionMatch[1],
        PENSION_BENEFITS,
        pensionPaymentFaqs(+pensionMatch[1]),
      ),
    );
  }
  const dstMatch = url.match(/^\/kesaaika-(\d{4})$/);
  if (dstMatch) nodes.push(...dstNodes(+dstMatch[1]));
  if (COUNTDOWN_BY_PATH[url]) nodes.push(...countdownNodes(url));
  if (url === DATE_CALCULATOR_PATH) nodes.push(...dateCalculatorNodes());
  if (url === AGE_PATH) nodes.push(...ageCalculatorNodes());
  if (url === PERIOD_PATH) {
    nodes.push(
      faqPageNode(url, periodFaqs()),
      howToNode(url, "Näin lasket seuraavat kuukautiset ja ovulaation", PERIOD_STEPS),
    );
  }
  if (url === PREGNANCY_PATH) {
    nodes.push(
      faqPageNode(url, pregnancyFaqs(), PREGNANCY_UPDATED),
      howToNode(url, "Näin lasket raskausviikon ja lasketun ajan", PREGNANCY_STEPS),
    );
  }
  if (url === LEAVE_PATH) {
    nodes.push(faqPageNode(url, leaveFaqs()), howToNode(url, "Näin lasket lomapäivät", LEAVE_STEPS));
  }
  if (url === TEMPLATE_PATH || url.startsWith(`${TEMPLATE_PATH}/`)) {
    nodes.push(...templateNodes(url, { siteUrl: SITE_URL, pageNode }));
  }
  if (url === COMPANY_ICS_PATH) {
    nodes.push(
      faqPageNode(url, companyIcsFaqs(), COMPANY_ICS_UPDATED),
      howToNode(url, "ICS-kalenterin tuonti", COMPANY_ICS_STEPS),
    );
  }
  if (url === CONSTRUCTION_PATH) {
    nodes.push(
      faqPageNode(url, constructionFaqs(), CONSTRUCTION_UPDATED),
      howToNode(url, "Näin teet rakennuskalenterin", CONSTRUCTION_STEPS),
    );
  }
  if (url === HR_PATH) {
    nodes.push(
      faqPageNode(url, hrFaqs(), HR_UPDATED),
      howToNode(url, "Näin teet HR-kalenterin", HR_STEPS),
    );
  }
  if (url === TEAM_PATH) {
    nodes.push(
      faqPageNode(url, teamFaqs(), TEAM_UPDATED),
      howToNode(url, "Näin aloitat tiimin lomasuunnittelun", TEAM_STEPS),
    );
  }
  if (url === COMPANY_CALENDAR_PATH) {
    nodes.push(
      faqPageNode(url, companyCalendarFaqs(), COMPANY_CALENDAR_UPDATED),
      howToNode(url, "Näin teet yrityksellesi oman kalenterin", COMPANY_CALENDAR_STEPS),
    );
  }
  if (url === PLANNER_PATH) {
    nodes.push(
      faqPageNode(url, plannerFaqs(), PLANNER_UPDATED),
      howToNode(url, "Näin löydät pisimmän loman vähillä lomapäivillä", PLANNER_STEPS),
    );
  }
  if (url === PROJECT_PATH) {
    nodes.push(
      faqPageNode(url, projectFaqs(), PROJECT_UPDATED),
      howToNode(url, "Näin lasket projektin päättymispäivän työpäivinä", PROJECT_STEPS),
    );
  }
  if (url === SPRINT_PATH) {
    nodes.push(
      faqPageNode(url, sprintFaqs(), SPRINT_UPDATED),
      howToNode(url, "Näin lasket sprinttien päivämäärät ja viikot", SPRINT_STEPS),
    );
  }
  if (url === HOURS_PATH) {
    nodes.push(
      faqPageNode(url, hoursFaqs()),
      howToNode(url, "Näin lasket työtunnit kellonajoista", HOURS_STEPS),
    );
  }
  if (url === SUN_HUB_PATH || SUN_CITY_BY_PATH[url]) nodes.push(...sunNodes(url, today));
  const moonMatch = url.match(/^\/kuun-vaiheet-(\d{4})$/);
  if (moonMatch) nodes.push(...moonNodes(+moonMatch[1]));
  if (OFFSET_BY_PATH[url]) nodes.push(...dateOffsetNodes(url, today));
  if (url === CALENDAR_SUBSCRIPTION_PATH) nodes.push(...calendarSubscriptionNodes(currentYear));
  if (url === WIDGET_EMBED_PAGE_PATH) nodes.push(...widgetEmbedNodes());

  const canonical = canonicalFor(url);
  const pageId = `${canonical}#webpage`;
  if (!nodes.some((node) => node["@id"] === pageId)) {
    const pageDateModified = sitemapLastmod(url, renderDay || today);
    nodes.unshift(
      pageNode(url, "WebPage", {
        description: meta.description,
        ...(pageDateModified ? { dateModified: pageDateModified } : {}),
        ...speakableExtra(url),
        ...weekHolidayMentionsExtra(url),
        ...ogImageExtra(url),
        ...weekPdfExtra(url),
        ...entityParentExtra(url),
      }),
    );
  }
  const pageIndex = nodes.findIndex((node) => node["@id"] === pageId);
  if (datasetPageMatch) {
    const dataset = nodes.find((node) => node["@type"] === "Dataset");
    if (dataset) {
      nodes[pageIndex].mainEntity = { "@id": dataset["@id"] };
    }
  }
  const rDay = renderDay || helsinkiDayKey();
  nodes[pageIndex] = topicSchema(nodes[pageIndex], pageTopic(url, dateFromDayKey(rDay)));

  return nodes;
}

export function getPageJsonLd(url, options = {}) {
  const nodes = getPageJsonLdNodes(url, options);
  if (!nodes || nodes.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@graph": [...GLOBAL_JSON_LD_NODES, ...nodes],
  };
}
