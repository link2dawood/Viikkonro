import { PARITY_UPDATED } from "./weekParity.js";
import { FAQ_UPDATED } from "./faqs.js";
import { WORKING_DAYS_UPDATED } from "./workingDaysContent.js";
import { PREGNANCY_UPDATED } from "./pregnancyCalculator.js";
import { COMPANY_CALENDAR_PATH, COMPANY_CALENDAR_UPDATED } from "./companyCalendar.js";
import { PLANNER_UPDATED } from "./vacationPlanner.js";
import { PROJECT_UPDATED } from "./projectTimeline.js";
import { SPRINT_UPDATED } from "./sprintPlanner.js";
import { schoolHolidayVerifiedAt } from "./schoolHolidayPages.js";

export const CALENDAR_CONTENT_UPDATED = "2026-10-05";

// Only publish known content dates. A year in a URL is not a modification
// date, and rebuilding an unchanged page does not make its content new.
// Google guidance checked 2026-10-05:
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
export function sitemapLastmod(path, buildDay) {
  if (
    path === "/" || path === "/en" || path === "/nimipaivat/tanaan" ||
    path === "/parillinen-pariton-viikko" ||
    /^\/auringonlasku(?:-[a-z-]+)?$/.test(path) ||
    /^\/kuinka-monta-paivaa-[a-z-]+$/.test(path) ||
    /^\/\d+-paivaa-eteenpain$/.test(path)
  ) return buildDay;

  if (path === "/tyopaivalaskuri") return WORKING_DAYS_UPDATED;
  if (path === "/tietosuoja") return "2026-10-07";
  if (path === "/raskauslaskuri") return PREGNANCY_UPDATED;
  if (path === COMPANY_CALENDAR_PATH) return COMPANY_CALENDAR_UPDATED;
  if (path === "/lomasuunnittelija") return PLANNER_UPDATED;
  if (path === "/projektiaikataulu") return PROJECT_UPDATED;
  if (path === "/sprinttisuunnittelija") return SPRINT_UPDATED;
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
