import { describe, expect, it } from "vitest";
import { paydayFor, paydayFaqs, paydaysInYear, PAYDAY_LAST, nonBankingReason } from "./paydayPages.js";
import { dstChanges, dstFaqs } from "./dstPages.js";
import {
  AFTER_DAY_OFF,
  KELA_BENEFITS,
  PENSION_BENEFITS,
  benefitPaymentFor,
  benefitPaymentsInYear,
  kelaPaymentFaqs,
  pensionPaymentFaqs,
} from "./benefitPaymentPages.js";
import {
  OBSERVANCES,
  OBSERVANCE_SLUG_RE,
  observanceFaqs,
  observanceHighlights,
  observanceMeta,
  observancePage,
} from "./observanceDays.js";
import {
  OFFSETS,
  addWorkingDays,
  calculate,
  offsetFaqs,
  offsetMeta,
  offsetPage,
  weeksAndDays,
} from "./dateCalculator.js";
import { flagDayFaqs, flagDaysInYear } from "./flagDayPages.js";
import { ageFaqs, ageOn, ageReport, ageText, nextBirthday } from "./ageCalculator.js";
import { blueMoons, moonFaqs, moonMeta, moonPhasesInYear, phaseList } from "./moonPhases.js";
import {
  SUN_CITIES,
  fmtTime,
  sunCityFaqs,
  sunCityMeta,
  sunDay,
  sunHubMeta,
  sunSummary,
} from "./sunCities.js";
import {
  MINUTE_TABLE,
  decimalToMinutes,
  fmtHM,
  hoursFaqs,
  parseClock,
  shiftMinutes,
  toDecimal,
  weekTotal,
} from "./hoursCalculator.js";
import { COUNTDOWNS, countdownStats, countdownFaqs, nextTarget } from "./countdownPages.js";
import { buildIcs, foldIcsLine, holidayEvents, weekEvents } from "./icsFeeds.js";
import { weekWidgetHtml, widgetEmbedCode } from "./weekWidget.js";

const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

describe("Kela and pension payment days", () => {
  // Kela's published schedule for February to December 2026, per benefit.
  const PUBLISHED_2026 = {
    asumistuki: "2.2. 2.3. 1.4. 4.5. 1.6. 1.7. 3.8. 1.9. 1.10. 2.11. 1.12.",
    "elakkeensaajan-asumistuki": "4.2. 4.3. 2.4. 4.5. 4.6. 3.7. 4.8. 4.9. 2.10. 4.11. 4.12.",
    kansanelake: "6.2. 6.3. 7.4. 7.5. 5.6. 7.7. 7.8. 7.9. 7.10. 6.11. 7.12.",
    elatustuki: "10.2. 10.3. 10.4. 8.5. 10.6. 10.7. 10.8. 10.9. 9.10. 10.11. 10.12.",
    takuuelake: "20.2. 20.3. 22.4. 22.5. 22.6. 22.7. 21.8. 22.9. 22.10. 20.11. 22.12.",
    lapsilisa: "26.2. 26.3. 24.4. 26.5. 26.6. 24.7. 26.8. 25.9. 23.10. 26.11. 23.12.",
  };

  it("matches Kela's published 2026 schedule for every benefit", () => {
    for (const b of KELA_BENEFITS) {
      const got = benefitPaymentsInYear(2026, b)
        .slice(1)
        .map((r) => `${r.actual.getDate()}.${r.actual.getMonth() + 1}.`)
        .join(" ");
      expect(got, b.id).toBe(PUBLISHED_2026[b.id]);
    }
  });

  it("pays child benefit early when the 26th follows a non-banking day", () => {
    const lapsilisa = KELA_BENEFITS.find((b) => b.id === "lapsilisa");
    // Monday 26.10.2026 -> Friday 23.10.
    const monday = benefitPaymentFor(2026, 10, lapsilisa);
    expect(monday.reason).toBe("Maanantai");
    expect(monday.afterDayOff).toBe(true);
    expect(ymd(monday.actual)).toBe("2026-10-23");
    // Published 2024 and 2025 cases: Mondays 26.2.2024 and 26.5.2025.
    expect(ymd(benefitPaymentFor(2024, 2, lapsilisa).actual)).toBe("2024-2-23");
    expect(ymd(benefitPaymentFor(2025, 5, lapsilisa).actual)).toBe("2025-5-23");
    // Friday 26.5.2028 follows Ascension Day (Thursday 25.5.2028).
    const afterHoliday = benefitPaymentFor(2028, 5, lapsilisa);
    expect(afterHoliday.reason).toBe(AFTER_DAY_OFF);
    expect(ymd(afterHoliday.actual)).toBe("2028-5-24");
  });

  it("does not apply the day-after rule to other benefits", () => {
    // Tuesday 22.4.2025 follows Easter Monday; takuueläke is still paid that day.
    const r = benefitPaymentFor(2025, 4, KELA_BENEFITS.find((b) => b.id === "takuuelake"));
    expect(r.moved).toBe(false);
    expect(ymd(r.actual)).toBe("2025-4-22");
  });

  it("moves first-of-month payments forward past New Year's Day", () => {
    const r = benefitPaymentFor(2027, 1, KELA_BENEFITS[0]);
    expect(r.early).toBe(false);
    expect(ymd(r.actual)).toBe("2027-1-4");
  });

  it("uses the same dates for a pension on both pages", () => {
    const kela = KELA_BENEFITS.find((b) => b.id === "takuuelake");
    const pension = PENSION_BENEFITS.find((b) => b.id === "takuuelake");
    expect(benefitPaymentsInYear(2027, pension)).toEqual(benefitPaymentsInYear(2027, kela));
  });

  it("writes FAQ answers without en dashes or doubled periods", () => {
    for (const faqs of [kelaPaymentFaqs(2026), pensionPaymentFaqs(2026)]) {
      for (const { q, a } of faqs) {
        expect(q + a).not.toMatch(/–|\.\./);
      }
    }
  });
});

describe("hours calculator", () => {
  it("parses common clock formats", () => {
    expect(parseClock("8.00")).toBe(480);
    expect(parseClock("08:30")).toBe(510);
    expect(parseClock("7,45")).toBe(465);
    expect(parseClock("1630")).toBe(990);
    expect(parseClock("25.00")).toBeNull();
    expect(parseClock("")).toBeNull();
  });

  it("subtracts breaks and handles night shifts", () => {
    expect(shiftMinutes("8.00", "16.30", 30).worked).toBe(480);
    const night = shiftMinutes("22.00", "6.00", 30);
    expect(night.overnight).toBe(true);
    expect(night.worked).toBe(450);
  });

  it("converts between minutes and decimal hours", () => {
    expect(toDecimal(45)).toBe("0,75");
    expect(toDecimal(465)).toBe("7,75");
    expect(decimalToMinutes("7,75")).toBe(465);
    expect(fmtHM(465)).toBe("7 h 45 min");
    expect(MINUTE_TABLE[14]).toEqual({ min: 15, dec: "0,25" });
  });

  it("sums a week and compares it to 40 hours", () => {
    const rows = Array.from({ length: 5 }, () => ({ start: "8", end: "16.30", break: "30" }));
    const t = weekTotal([...rows, { start: "", end: "", break: "" }, { start: "", end: "", break: "" }]);
    expect(t.worked).toBe(2400);
    expect(t.days).toBe(5);
    expect(t.diffTo40).toBe(0);
  });

  it("writes FAQ answers without en dashes", () => {
    for (const { q, a } of hoursFaqs()) expect(q + a).not.toMatch(/–|\.\./);
  });
});

describe("sun times by city", () => {
  const fmt = (d) => (d ? fmtTime(d) : null);
  const city = (slug) => SUN_CITIES.find((c) => c.slug === slug);

  it("matches known Helsinki times at the solstices", () => {
    const june = sunDay(city("helsinki"), 2026, 5, 21);
    const dec = sunDay(city("helsinki"), 2026, 11, 21);
    expect([fmt(june.sunrise), fmt(june.sunset)]).toEqual(["03.54", "22.50"]);
    expect([fmt(dec.sunrise), fmt(dec.sunset)]).toEqual(["09.23", "15.12"]);
  });

  it("puts the longest and shortest day on the solstices south of the Arctic Circle", () => {
    const s = sunSummary(city("oulu"), 2026);
    expect(ymd(s.longest.date)).toBe("2026-6-21");
    expect(ymd(s.shortest.date)).toBe("2026-12-21");
    expect(s.midnightSun).toHaveLength(0);
  });

  it("finds Utsjoki's midnight sun and kaamos", () => {
    const s = sunSummary(city("utsjoki"), 2026);
    // Verified windows: midnight sun from 17.5., kaamos 26.11.-15.1.
    expect(ymd(s.midnightSun[0].from)).toBe("2026-5-17");
    expect(ymd(s.polarNight[0].to)).toBe("2026-1-15");
    expect(ymd(s.polarNight[1].from)).toBe("2026-11-26");
  });

  it("writes titles, descriptions and FAQs within limits", () => {
    const today = new Date(2026, 8, 28);
    for (const c of SUN_CITIES) {
      const m = sunCityMeta(c.slug, today);
      expect(m.title.length).toBeLessThanOrEqual(60);
      expect(m.description.length).toBeLessThanOrEqual(160);
      for (const { q, a } of sunCityFaqs(c.slug, today)) expect(q + a).not.toMatch(/–|\.\./);
    }
    expect(sunHubMeta().title.length).toBeLessThanOrEqual(60);
  });
});

describe("moon phases", () => {
  // NASA Six Millennium Catalog of Phases of the Moon, 2026 (UT).
  const NASA_2026 = [
    ["taysikuu", Date.UTC(2026, 1, 1, 22, 9)],
    ["taysikuu", Date.UTC(2026, 7, 28, 4, 18)],
    ["taysikuu", Date.UTC(2026, 11, 24, 1, 28)],
    ["uusikuu", Date.UTC(2026, 0, 18, 19, 52)],
    ["uusikuu", Date.UTC(2026, 7, 12, 17, 37)],
    ["ensimmainen-neljannes", Date.UTC(2026, 5, 21, 21, 55)],
    ["viimeinen-neljannes", Date.UTC(2026, 11, 30, 18, 59)],
  ];

  it("matches NASA's phase times to within two minutes", () => {
    const events = moonPhasesInYear(2026);
    for (const [phase, t] of NASA_2026) {
      const closest = events
        .filter((e) => e.phase === phase)
        .reduce((b, e) => (Math.abs(e.instant - t) < Math.abs(b.instant - t) ? e : b));
      expect(Math.abs(closest.instant - t) / 60000).toBeLessThanOrEqual(2);
    }
  });

  it("gives Finnish local dates and times, including summer time", () => {
    const aug = phaseList(2026, "taysikuu").find((e) => e.month === 8);
    expect(aug.time).toBe("07.18");
    // 29.6. 23:57 UT is already 30.6. in Finland.
    expect(phaseList(2026, "taysikuu").find((e) => e.month === 6).date.getDate()).toBe(30);
  });

  it("finds 13 full moons and the May blue moon in 2026", () => {
    expect(phaseList(2026, "taysikuu")).toHaveLength(13);
    expect(blueMoons(2026).map((e) => e.date.getDate() + "." + e.month)).toEqual(["31.5"]);
    expect(phaseList(2024, "taysikuu")).toHaveLength(12);
  });

  it("writes FAQ answers without en dashes and a title within limits", () => {
    for (const { q, a } of moonFaqs(2026)) expect(q + a).not.toMatch(/–|\.\./);
    expect(moonMeta(2026).title.length).toBeLessThanOrEqual(60);
  });
});

describe("age calculator", () => {
  it("counts full years, months and days", () => {
    expect(ageOn(new Date(1990, 5, 15), new Date(2026, 8, 28))).toMatchObject({ years: 36, months: 3, days: 13 });
    expect(ageOn(new Date(1990, 5, 15), new Date(2026, 5, 15))).toMatchObject({ years: 36, months: 0, days: 0 });
    expect(ageOn(new Date(1990, 5, 15), new Date(2026, 5, 14)).years).toBe(35);
  });

  it("handles month ends", () => {
    // Born 31.1.: one month later is 28.2. (month-end rule, as in the date calculator).
    expect(ageOn(new Date(2000, 0, 31), new Date(2026, 1, 28))).toMatchObject({ years: 26, months: 1, days: 0 });
    expect(ageOn(new Date(2000, 0, 31), new Date(2026, 2, 31))).toMatchObject({ years: 26, months: 2, days: 0 });
  });

  it("completes a 29.2. birthday on 1.3. in non-leap years", () => {
    const leapling = new Date(2004, 1, 29);
    expect(ageOn(leapling, new Date(2027, 1, 28)).years).toBe(22);
    expect(ageOn(leapling, new Date(2027, 2, 1)).years).toBe(23);
    expect(ageOn(leapling, new Date(2028, 1, 29)).years).toBe(24);
    expect(ymd(nextBirthday(leapling, new Date(2027, 0, 10)).date)).toBe("2027-3-1");
  });

  it("reports next birthday and milestones", () => {
    const r = ageReport(new Date(2000, 0, 1), new Date(2026, 8, 28));
    expect(ymd(r.next.date)).toBe("2027-1-1");
    expect(r.next.turns).toBe(27);
    // 10 000 days after 1.1.2000 is 19.5.2027: still ahead on 28.9.2026.
    const tenK = r.milestones.find((m) => m.label === "10 000 päivää");
    expect(ymd(tenK.date)).toBe("2027-5-19");
    expect(tenK.past).toBe(false);
    expect(ageReport(new Date(2030, 0, 1), new Date(2026, 8, 28))).toBeNull();
  });

  it("writes FAQ answers without en dashes", () => {
    for (const { q, a } of ageFaqs()) expect(q + a).not.toMatch(/–|\.\./);
    expect(ageText({ years: 1, months: 1, days: 1 })).toBe("1 vuosi, 1 kuukausi ja 1 päivä");
  });
});

describe("flag days", () => {
  const find = (year, name) => flagDaysInYear(year).find((d) => d.name === name);
  const dmy = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;

  it("lists all dated flag days, with 2023 additions only from 2023", () => {
    expect(flagDaysInYear(2022)).toHaveLength(20);
    expect(flagDaysInYear(2026)).toHaveLength(22);
    expect(find(2022, "Suomen luonnon päivä")).toBeUndefined();
    expect(find(2023, "Miina Sillanpään päivä")).toBeDefined();
  });

  it("has exactly the seven official flag days of the decree", () => {
    const official = flagDaysInYear(2026).filter((d) => d.category === "virallinen").map((d) => d.name);
    expect(official).toEqual([
      "Kalevalan päivä",
      "Vappu",
      "Äitienpäivä",
      "Puolustusvoimain lippujuhlan päivä",
      "Juhannuspäivä",
      "Isänpäivä",
      "Itsenäisyyspäivä",
    ]);
  });

  it("computes the movable flag days and names juhannus as Suomen lipun päivä", () => {
    expect(dmy(find(2026, "Kaatuneitten muistopäivä").date)).toBe("17.5.");
    expect(dmy(find(2026, "Suomen luonnon päivä").date)).toBe("29.8.");
    expect(find(2026, "Juhannuspäivä").altName).toBe("Suomen lipun päivä");
    expect(find(2026, "Puolustusvoimain lippujuhlan päivä").altName).toBeNull();
  });

  it("writes FAQ answers without en dashes", () => {
    for (const { q, a } of flagDayFaqs(2026)) expect(q + a).not.toMatch(/–|\.\./);
  });
});

describe("date calculator", () => {
  it("does not count the start day", () => {
    expect(ymd(calculate(new Date(2026, 0, 1), 1, "paivaa").result)).toBe("2026-1-2");
    expect(ymd(calculate(new Date(2026, 0, 1), 1, "viikkoa").result)).toBe("2026-1-8");
  });

  it("clamps months to the last day of a shorter month", () => {
    expect(ymd(calculate(new Date(2027, 0, 31), 1, "kuukautta").result)).toBe("2027-2-28");
    expect(ymd(calculate(new Date(2028, 0, 31), 1, "kuukautta").result)).toBe("2028-2-29");
  });

  it("skips weekends and official holidays but counts jouluaatto as a working day", () => {
    // 23 (ke), 24 (to, jouluaatto), 28 (ma), 29 (ti), 30 (ke).
    expect(ymd(calculate(new Date(2026, 11, 22), 5, "arkipaivaa").result)).toBe("2026-12-30");
  });

  it("counts backwards", () => {
    expect(ymd(calculate(new Date(2027, 2, 1), 90, "paivaa", -1).result)).toBe("2026-12-1");
    // 7.1.2026 is a Wednesday; loppiainen (ti 6.1.) is skipped: 5.1., then 2.1.
    expect(ymd(addWorkingDays(new Date(2026, 0, 7), -2))).toBe("2026-1-2");
  });

  it("builds offset pages and titles within limits", () => {
    const today = new Date(2026, 8, 28);
    for (const n of OFFSETS) {
      const p = offsetPage(n, today);
      expect(ymd(p.result)).toBe(ymd(new Date(2026, 8, 28 + n)));
      expect(offsetMeta(n, today).title.length).toBeLessThanOrEqual(60);
      expect(offsetMeta(n, today).description.length).toBeLessThanOrEqual(160);
      for (const { q, a } of offsetFaqs(n, today)) expect(q + a).not.toMatch(/–|\.\./);
    }
    expect(weeksAndDays(90)).toBe("12 viikkoa ja 6 päivää");
    expect(weeksAndDays(8)).toBe("1 viikko ja 1 päivä");
  });
});

describe("observance days", () => {
  const dm = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;

  it("matches the published dates", () => {
    expect(dm(observancePage("isanpaiva", 2026).date)).toBe("8.11.");
    expect(dm(observancePage("aitienpaiva", 2027).date)).toBe("9.5.");
    expect(dm(observancePage("laskiainen", 2026).date)).toBe("15.2.");
    expect(dm(observancePage("laskiainen", 2026).extras[0].date)).toBe("17.2.");
    expect(dm(observancePage("adventti", 2026).date)).toBe("29.11.");
    expect(dm(observancePage("ystavanpaiva", 2027).date)).toBe("14.2.");
  });

  it("keeps isänpäivä eight days after pyhäinpäivä every year", () => {
    for (let y = 2020; y <= 2035; y++) {
      const [fact] = observanceHighlights(observancePage("isanpaiva", y));
      expect(fact.text).toContain("kahdeksan päivää");
    }
  });

  it("notices when äitienpäivä shares its date with another flag day", () => {
    const [fact] = observanceHighlights(observancePage("aitienpaiva", 2027));
    expect(fact.text).toContain("Eurooppa-päivä");
  });

  it("routes only the five observance slugs", () => {
    expect(OBSERVANCE_SLUG_RE.test("isanpaiva-2026")).toBe(true);
    expect(OBSERVANCE_SLUG_RE.test("isanpaiva-26")).toBe(false);
    expect(OBSERVANCE_SLUG_RE.test("halloween-2026")).toBe(false);
  });

  it("writes titles, descriptions and FAQs within limits and without en dashes", () => {
    for (const o of OBSERVANCES) {
      const meta = observanceMeta(o.slug, 2027);
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeLessThanOrEqual(160);
      for (const { q, a } of observanceFaqs(observancePage(o.slug, 2027))) {
        expect(q + a).not.toMatch(/–|\.\./);
      }
    }
  });
});

describe("paydays", () => {
  it("moves a weekend payday to the previous Friday", () => {
    const r = paydayFor(2026, 8, 15); // Saturday 15.8.2026
    expect(r.moved).toBe(true);
    expect(r.reason).toBe("Lauantai");
    expect(ymd(r.actual)).toBe("2026-8-14");
  });

  it("treats Midsummer Eve and Christmas Eve as non-banking days", () => {
    expect(nonBankingReason(new Date(2026, 5, 19))).toBe("Juhannusaatto");
    expect(nonBankingReason(new Date(2026, 11, 24))).toBe("Jouluaatto");
    expect(nonBankingReason(new Date(2026, 11, 23))).toBeNull();
  });

  it("skips back over consecutive non-banking days", () => {
    // 26.12.2027 is Sunday; 25.12 Saturday, 24.12 Friday = Christmas Eve.
    expect(ymd(paydayFor(2027, 12, 26).actual)).toBe("2027-12-23");
  });

  it("clamps day 31 and 'last' to the month's last day", () => {
    expect(ymd(paydayFor(2026, 4, 31).nominal)).toBe("2026-4-30");
    expect(ymd(paydayFor(2026, 2, PAYDAY_LAST).nominal)).toBe("2026-2-28");
  });

  it("returns 12 months and consistent FAQ counts", () => {
    const rows = paydaysInYear(2026, 15);
    expect(rows).toHaveLength(12);
    const moved = rows.filter((r) => r.moved).length;
    expect(paydayFaqs(2026)[1].a).toContain(`${moved} kertaa`);
  });
});

describe("daylight saving time", () => {
  it("uses the last Sundays of March and October", () => {
    expect(ymd(dstChanges(2026).start.date)).toBe("2026-3-29");
    expect(ymd(dstChanges(2026).end.date)).toBe("2026-10-25");
    expect(ymd(dstChanges(2027).start.date)).toBe("2027-3-28");
    expect(ymd(dstChanges(2027).end.date)).toBe("2027-10-31");
    for (const y of [2024, 2025, 2026, 2027, 2028]) {
      expect(dstChanges(y).start.date.getDay()).toBe(0);
      expect(dstChanges(y).end.date.getDay()).toBe(0);
    }
  });

  it("states the local change times in the FAQ", () => {
    const faqs = dstFaqs(2026);
    expect(faqs[0].a).toContain("3.00");
    expect(faqs[1].a).toContain("4.00");
  });
});

describe("countdowns", () => {
  const joulu = COUNTDOWNS.find((c) => c.key === "joulu");
  const juhannus = COUNTDOWNS.find((c) => c.key === "juhannus");

  it("counts calendar days to the next Christmas Eve", () => {
    const s = countdownStats(joulu, new Date(2026, 8, 25, 23, 30));
    expect(ymd(s.target)).toBe("2026-12-24");
    expect(s.days).toBe(90);
    expect(s.weeks * 7 + s.extraDays).toBe(s.days);
  });

  it("is zero on the day and rolls to next year afterwards", () => {
    expect(countdownStats(joulu, new Date(2026, 11, 24, 18)).days).toBe(0);
    expect(ymd(nextTarget(joulu, new Date(2026, 11, 25)))).toBe("2027-12-24");
  });

  it("finds Midsummer Eve on a Friday between 19 and 25 June", () => {
    const t = nextTarget(juhannus, new Date(2026, 8, 25));
    expect(t.getDay()).toBe(5);
    expect(t.getMonth()).toBe(5);
    expect(t.getDate()).toBeGreaterThanOrEqual(19);
    expect(t.getDate()).toBeLessThanOrEqual(25);
  });

  it("gives every countdown at least one FAQ", () => {
    for (const c of COUNTDOWNS) expect(countdownFaqs(c, new Date(2026, 8, 25)).length).toBeGreaterThan(0);
  });
});

describe("iCalendar feeds", () => {
  it("folds long lines at 75 octets without splitting UTF-8", () => {
    const folded = foldIcsLine("DESCRIPTION:" + "ää ".repeat(60));
    for (const line of folded.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, "")).toBe("DESCRIPTION:" + "ää ".repeat(60));
  });

  it("builds a CRLF calendar with one event per ISO week", () => {
    const events = weekEvents([2026], "https://viikkonro.fi", () => true);
    expect(events).toHaveLength(53);
    const ics = buildIcs({ calName: "x", calDesc: "y", events, stamp: "20260101T000000Z" });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(/[^\r]\n/.test(ics)).toBe(false);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(53);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260921");
  });

  it("has unique event UIDs across holiday years", () => {
    const uids = holidayEvents([2025, 2026, 2027], "https://viikkonro.fi").map((e) => e.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });
});

describe("week widget", () => {
  it("bakes in the current week and a backlink", () => {
    const html = weekWidgetHtml("https://viikkonro.fi", new Date(2026, 8, 25));
    expect(html).toContain('<b id="w">39</b>');
    expect(html).toContain('href="https://viikkonro.fi/viikko-39-2026"');
    expect(html).toContain('content="noindex, follow"');
  });

  it("adds the dark-theme parameter only when asked", () => {
    expect(widgetEmbedCode("https://viikkonro.fi", "vaalea")).toContain('src="https://viikkonro.fi/widget/viikko"');
    expect(widgetEmbedCode("https://viikkonro.fi", "tumma")).toContain("?teema=tumma");
  });
});
