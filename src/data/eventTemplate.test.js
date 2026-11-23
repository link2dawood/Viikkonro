import { describe, expect, it } from "vitest";
import {
  EVENT_REVIEWS,
  countdownSentence,
  dayOffVerdict,
  eventCountdown,
  eventReviewedAt,
  eventReviewedFi,
  eventReviewedFor,
  wholeDaysBetween,
} from "./eventTemplate.js";
import { sitemapLastmod } from "./sitemapMetadata.js";
import { sitemapEntries } from "./seo.js";
import {
  christmasData,
  epiphanyData,
  itsenaisyyspaivaData,
  newYearData,
} from "./seasonalPages.js";
import { observanceDayOff, observancePage } from "./observanceDays.js";

const d = (y, m, day) => new Date(y, m - 1, day);

describe("wholeDaysBetween", () => {
  it("counts calendar days regardless of the time of day", () => {
    expect(wholeDaysBetween(d(2026, 11, 21), d(2026, 12, 24))).toBe(33);
    expect(wholeDaysBetween(d(2026, 12, 24), d(2026, 12, 24))).toBe(0);
    expect(wholeDaysBetween(d(2026, 12, 25), d(2026, 12, 24))).toBe(-1);
  });

  it("is unaffected by the clock change inside the span", () => {
    // 29.3.2026 is the spring clock change; the span is still 7 days.
    expect(wholeDaysBetween(d(2026, 3, 26), d(2026, 4, 2))).toBe(7);
  });
});

describe("eventCountdown", () => {
  it("names the four states", () => {
    const target = d(2026, 12, 24);
    expect(eventCountdown(target, d(2026, 11, 21))).toEqual({ days: 33, state: "future" });
    expect(eventCountdown(target, d(2026, 12, 23))).toEqual({ days: 1, state: "tomorrow" });
    expect(eventCountdown(target, d(2026, 12, 24))).toEqual({ days: 0, state: "today" });
    expect(eventCountdown(target, d(2026, 12, 27))).toEqual({ days: -3, state: "past" });
  });
});

describe("countdownSentence", () => {
  const joulu = { nameCap: "Jouluaatto", illative: "jouluaattoon", target: d(2026, 12, 24) };

  it("states the day count and the weekday for a future day", () => {
    expect(countdownSentence({ ...joulu, today: d(2026, 11, 21) })).toBe(
      "Jouluaattoon on 33 päivää (torstaina 24. joulukuuta 2026).",
    );
  });

  it("switches to huomenna and tänään on the last two days", () => {
    expect(countdownSentence({ ...joulu, today: d(2026, 12, 23) })).toBe(
      "Jouluaatto on huomenna torstaina 24. joulukuuta 2026.",
    );
    expect(countdownSentence({ ...joulu, today: d(2026, 12, 24) })).toBe(
      "Jouluaatto on tänään 24.12.2026.",
    );
  });

  it("returns null once the day has passed, so no negative count is shown", () => {
    expect(countdownSentence({ ...joulu, today: d(2026, 12, 25) })).toBeNull();
  });
});

describe("dayOffVerdict", () => {
  it("separates a statutory day off, a weekend one and a plain observance", () => {
    expect(dayOffVerdict({ official: true, weekend: false })).toBe("Kyllä, palkallinen vapaapäivä");
    expect(dayOffVerdict({ official: true, weekend: true })).toBe("Kyllä, mutta osuu viikonlopulle");
    expect(dayOffVerdict({ official: false, weekend: false })).toBe("Ei virallinen vapaapäivä");
  });
});

describe("event review dates", () => {
  it("records a date for every page refreshed in the 2026-11-22 pass", () => {
    expect(Object.keys(EVENT_REVIEWS).sort()).toEqual([
      "/adventti-2026",
      "/itsenaisyyspaiva-2026",
      "/joulu-2026",
      "/loppiainen-2027",
      "/pyhat-2026/itsenaisyyspaiva",
      "/uusi-vuosi-2027",
      "/viikko-53-2026",
    ]);
  });

  it("formats the visible date from the same string the schema uses", () => {
    expect(eventReviewedAt("/joulu-2026")).toBe("2026-11-21");
    expect(eventReviewedFi("/joulu-2026")).toBe("21. marraskuuta 2026");
    expect(eventReviewedAt("/joulu-2030")).toBeNull();
    expect(eventReviewedFi("/joulu-2030")).toBeNull();
  });

  it("withholds a review date until the day has arrived", () => {
    // The single guard behind the visible line, both schema nodes and the
    // sitemap, so a build that predates a review cannot leave one of them
    // claiming a freshness the others are still withholding.
    expect(eventReviewedFor("/joulu-2026", "2026-11-21")).toBe("2026-11-21");
    expect(eventReviewedFor("/joulu-2026", "2026-12-01")).toBe("2026-11-21");
    expect(eventReviewedFor("/joulu-2026", "2026-11-20")).toBeNull();
    expect(eventReviewedFor("/joulu-2030", "2026-11-21")).toBeNull();
    expect(eventReviewedFor("/joulu-2026", undefined)).toBeNull();
  });

  it("only names paths that are real sitemap entries", () => {
    const published = new Set(sitemapEntries(2026).map((entry) => entry.path));
    for (const path of Object.keys(EVENT_REVIEWS)) {
      expect(published.has(path)).toBe(true);
    }
  });
});

describe("sitemapLastmod for reviewed event pages", () => {
  it("publishes the review date once the build day has reached it", () => {
    expect(sitemapLastmod("/joulu-2026", "2026-11-22")).toBe("2026-11-21");
    expect(sitemapLastmod("/adventti-2026", "2026-12-01")).toBe("2026-11-21");
    expect(sitemapLastmod("/pyhat-2026/itsenaisyyspaiva", "2026-11-22")).toBe("2026-11-21");
  });

  it("beats the shared parity date on a reviewed week page, and leaves others alone", () => {
    expect(sitemapLastmod("/viikko-53-2026", "2026-11-22")).toBe("2026-11-21");
    expect(sitemapLastmod("/viikko-52-2026", "2026-11-22")).toBe("2026-10-11");
  });

  it("never publishes a review date a historical build predates", () => {
    expect(sitemapLastmod("/joulu-2026", "2026-10-20")).toBe("2026-10-11");
  });
});

describe("day-off verdicts on the seasonal data", () => {
  it("states the Sunday caveat for itsenäisyyspäivä 2026", () => {
    const { dayOff } = itsenaisyyspaivaData(2026);
    expect(dayOff.question).toBe("Onko itsenäisyyspäivä 2026 vapaapäivä?");
    expect(dayOff.verdict).toBe("Kyllä, mutta osuu viikonlopulle");
    expect(dayOff.detail).toContain("ei anneta korvaavaa vapaapäivää");
  });

  it("separates jouluaatto from the two statutory Christmas holidays", () => {
    const { dayOff } = christmasData(2026);
    expect(dayOff.question).toBe("Onko jouluaatto 2026 vapaapäivä?");
    expect(dayOff.detail).toContain("Jouluaatto 24.12. ei ole lakisääteinen pyhäpäivä");
  });

  it("treats the 2027 Friday new year and Wednesday loppiainen as paid days off", () => {
    expect(newYearData(2027).dayOff.verdict).toBe("Kyllä, palkallinen vapaapäivä");
    expect(epiphanyData(2027).dayOff.verdict).toBe("Kyllä, palkallinen vapaapäivä");
    expect(epiphanyData(2027).dayOff.detail).toContain("keskiviikolle");
  });

  it("reuses the observance flag-day sentence rather than restating it", () => {
    const page = observancePage("adventti", 2026);
    const dayOff = observanceDayOff(page);
    expect(dayOff.question).toBe("Onko 1. adventti 2026 vapaapäivä?");
    expect(dayOff.verdict).toBe("Ei virallinen vapaapäivä, mutta osuu sunnuntaille");
    expect(dayOff.detail.startsWith(page.flagDay)).toBe(true);
  });
});
