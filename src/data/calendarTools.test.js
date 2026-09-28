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
