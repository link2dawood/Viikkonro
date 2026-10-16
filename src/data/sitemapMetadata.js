import { TEMPLATE_PATH, TEMPLATE_UPDATED, TEMPLATES, templatePath } from "../platform/templates/catalog.js";
import { PARITY_UPDATED } from "./weekParity.js";
import { FAQ_UPDATED } from "./faqs.js";
import { WORKING_DAYS_UPDATED } from "./workingDaysContent.js";
import { PREGNANCY_UPDATED } from "./pregnancyCalculator.js";
import { COMPANY_ICS_PATH, COMPANY_ICS_UPDATED } from "./companyIcs.js";
import { COMPANY_CALENDAR_PATH, COMPANY_CALENDAR_UPDATED } from "./companyCalendar.js";
import { PLANNER_UPDATED } from "./vacationPlanner.js";
import { PROJECT_UPDATED } from "./projectTimeline.js";
import { SPRINT_UPDATED } from "./sprintPlanner.js";
import { CONSTRUCTION_PATH, CONSTRUCTION_UPDATED } from "./constructionCalendar.js";
import { HR_PATH, HR_UPDATED } from "./hrCalendar.js";
import { TEAM_PATH, TEAM_UPDATED } from "./teamLeave.js";
import { schoolHolidayVerifiedAt } from "./schoolHolidayPages.js";
import { pageTopic, TOPIC_CONTENT_UPDATED } from "./pageTopics.js";
import { dateFromDayKey } from "../components/dateUtils.js";
import { LEGAL_PATHS, LEGAL_UPDATED } from "./legalPolicies.js";
import { VAPPU_UPDATED } from "./holidayPages.js";

export const CALENDAR_CONTENT_UPDATED = "2026-10-05";

// Only publish known content dates. A year in a URL is not a modification
// date, and rebuilding an unchanged page does not make its content new.
// Google guidance checked 2026-10-05:
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
function previousContentLastmod(path, buildDay) {
  if (
    path === "/" || path === "/nimipaivat/tanaan" ||
    path === "/parillinen-pariton-viikko" ||
    /^\/auringonlasku(?:-[a-z-]+)?$/.test(path) ||
    /^\/kuinka-monta-paivaa-[a-z-]+$/.test(path) ||
    /^\/\d+-paivaa-eteenpain$/.test(path)
  ) return buildDay;

  if (path === "/tyopaivalaskuri") return WORKING_DAYS_UPDATED;
  if (/^\/pyhat-\d{4}\/vappu$/.test(path) && buildDay >= VAPPU_UPDATED) return VAPPU_UPDATED;
  if (LEGAL_PATHS.includes(path) && buildDay >= LEGAL_UPDATED) return LEGAL_UPDATED;
  if (path === "/tietosuoja") return "2026-10-07";
  if (path === "/raskauslaskuri") return PREGNANCY_UPDATED;
  if (path === TEMPLATE_PATH || TEMPLATES.some((template) => path === templatePath(template))) return TEMPLATE_UPDATED;
  if (path === COMPANY_ICS_PATH) return COMPANY_ICS_UPDATED;
  if (path === COMPANY_CALENDAR_PATH) return COMPANY_CALENDAR_UPDATED;
  if (path === "/lomasuunnittelija") return PLANNER_UPDATED;
  if (path === "/projektiaikataulu") return PROJECT_UPDATED;
  if (path === "/sprinttisuunnittelija") return SPRINT_UPDATED;
  if (path === CONSTRUCTION_PATH) return CONSTRUCTION_UPDATED;
  if (path === HR_PATH) return HR_UPDATED;
  if (path === TEAM_PATH) return TEAM_UPDATED;
  if (/^\/kalenteri-\d{4}$/.test(path)) return CALENDAR_CONTENT_UPDATED;
  const schoolHolidayMatch = path.match(/^\/koululomat-(\d{4})$/);
  if (schoolHolidayMatch) return schoolHolidayVerifiedAt(Number(schoolHolidayMatch[1]));
  if (path === "/ukk") return FAQ_UPDATED;
  if (/^\/(?:viikko-\d+|vuosi)-\d{4}$/.test(path)) {
    return PARITY_UPDATED;
  }
  // lastmod is optional. Unknown dates (including PDF modification dates)
  // are omitted until content history is available for those resources.
  return null;
}

export function sitemapLastmod(path, buildDay) {
  const previous = previousContentLastmod(path,buildDay);
  // The new visible guide and contextual links are a substantive content
  // update. Preserve later reviews and daily answers; never publish a future
  // review date when testing historical builds.
  if (typeof buildDay !== "string" || buildDay < TOPIC_CONTENT_UPDATED || !pageTopic(path,dateFromDayKey(buildDay))) return previous;
  return previous && previous > TOPIC_CONTENT_UPDATED ? previous : TOPIC_CONTENT_UPDATED;
}
