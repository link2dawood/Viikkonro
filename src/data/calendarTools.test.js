import { describe, expect, it } from "vitest";
import { paydayFor, paydayFaqs, paydaysInYear, PAYDAY_LAST, nonBankingReason } from "./paydayPages.js";
import { dstChanges, dstFaqs } from "./dstPages.js";
import { COUNTDOWNS, countdownStats, countdownFaqs, nextTarget } from "./countdownPages.js";
import { buildIcs, foldIcsLine, holidayEvents, weekEvents } from "./icsFeeds.js";
import { weekWidgetHtml, widgetEmbedCode } from "./weekWidget.js";

const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

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
