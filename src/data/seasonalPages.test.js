import { describe, expect, it } from "vitest";
import {
  itsenaisyyspaivaData,
  itsenaisyyspaivaMeta,
  itsenaisyyspaivaFaqs,
  christmasData,
  christmasMeta,
  christmasFaqs,
  christmasBreakData,
  christmasBreakMeta,
  christmasBreakFaqs,
} from "./seasonalPages.js";
import { observanceMeta, observancePage, observanceFaqs, observancePathForFlagDay } from "./observanceDays.js";
import { flagDaysInYear } from "./flagDayPages.js";

describe("Itsenäisyyspäivä (/itsenaisyyspaiva-2026)", () => {
  it("computes accurate 2026 date, week and weekend impact", () => {
    const data = itsenaisyyspaivaData(2026);
    expect(data.date.getFullYear()).toBe(2026);
    expect(data.date.getMonth()).toBe(11);
    expect(data.date.getDate()).toBe(6);
    expect(data.weekday).toBe("Sunnuntai");
    expect(data.week).toBe(49);
    expect(data.isWeekend).toBe(true);
    expect(data.yearsSinceIndependence).toBe(109);
    expect(data.answerLead).toContain("Itsenäisyyspäivä 2026 on sunnuntai 6.12., ei ylimääräistä vapaapäivää");
  });

  it("produces valid SEO title and description without en dashes", () => {
    const meta = itsenaisyyspaivaMeta(2026);
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.title).toContain("Itsenäisyyspäivä 2026");
    expect(meta.title).toContain("| Viikko Nro");
    expect(meta.title).not.toMatch(/–/);
    expect(meta.description.length).toBeGreaterThanOrEqual(140);
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(meta.description).not.toMatch(/–/);
  });

  it("provides comprehensive FAQs explaining weekend impact, liputus and history", () => {
    const faqs = itsenaisyyspaivaFaqs(2026);
    expect(faqs.length).toBeGreaterThanOrEqual(5);
    const questions = faqs.map((f) => f.q).join(" ");
    expect(questions).toContain("vapaapäivä");
    expect(questions).toContain("liputetaan");
    expect(questions).toContain("viikolla");
    expect(questions).toContain("2. adventti");
    for (const { q, a } of faqs) {
      expect(q + a).not.toMatch(/–/);
    }
  });
});

describe("Joulu (/joulu-2026)", () => {
  it("covers jouluaatto, joulupäivä, tapaninpäivä and 4 days off", () => {
    const data = christmasData(2026);
    expect(data.eve.weekday).toBe("Torstai");
    expect(data.eve.date.getDate()).toBe(24);
    expect(data.day.weekday).toBe("Perjantai");
    expect(data.day.date.getDate()).toBe(25);
    expect(data.boxing.weekday).toBe("Lauantai");
    expect(data.boxing.date.getDate()).toBe(26);
    expect(data.week).toBe(52);
    expect(data.freeDaysCount).toBe(4);
  });

  it("produces valid SEO title and description", () => {
    const meta = christmasMeta(2026);
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.title).toContain("Joulu 2026");
    expect(meta.title).toContain("| Viikko Nro");
    expect(meta.description.length).toBeGreaterThanOrEqual(140);
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(meta.title + meta.description).not.toMatch(/–/);
  });

  it("provides FAQs covering shop opening hours and vacation planning", () => {
    const faqs = christmasFaqs(2026);
    expect(faqs.length).toBeGreaterThanOrEqual(5);
    const text = faqs.map((f) => f.q + " " + f.a).join(" ");
    expect(text).toContain("kaupat");
    expect(text).toContain("aukioloajat");
    expect(text).toContain("4 peräkkäistä vapaapäivää");
    expect(text).toContain("tapaninpäivä");
    for (const { q, a } of faqs) {
      expect(q + a).not.toMatch(/–/);
    }
  });
});

describe("Koulujen joululoma (/joululoma-2026)", () => {
  it("covers major cities with confirmed dates", () => {
    const data = christmasBreakData(2026);
    expect(data.generalStart).toBe("23.12.2026");
    expect(data.generalEnd).toBe("6.1.2027");
    expect(data.schoolResumes).toBe("7.1.2027");

    const cityNames = data.cities.map((c) => c.city);
    expect(cityNames).toContain("Helsinki");
    expect(cityNames).toContain("Espoo");
    expect(cityNames).toContain("Tampere");
    expect(cityNames).toContain("Vantaa");
    expect(cityNames).toContain("Oulu");
    expect(cityNames).toContain("Turku");
  });

  it("produces valid SEO title and description", () => {
    const meta = christmasBreakMeta(2026);
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.title).toContain("Joululoma 2026");
    expect(meta.title).toContain("| Viikko Nro");
    expect(meta.description.length).toBeGreaterThanOrEqual(140);
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(meta.title + meta.description).not.toMatch(/–/);
  });

  it("provides useful FAQs without en dashes", () => {
    const faqs = christmasBreakFaqs(2026);
    expect(faqs.length).toBeGreaterThanOrEqual(5);
    for (const { q, a } of faqs) {
      expect(q + a).not.toMatch(/–/);
    }
  });
});

describe("Adventti 2026 & Liputuspäivät", () => {
  it("observancePage computes all 4 Advent Sundays in 2026", () => {
    const page = observancePage("adventti", 2026);
    expect(page.date.getDate()).toBe(29);
    expect(page.date.getMonth()).toBe(10); // November
    expect(page.extras).toHaveLength(3);
    expect(page.extras[0].date.getDate()).toBe(6);
    expect(page.extras[0].date.getMonth()).toBe(11); // December 6 (Itsenäisyyspäivä)
    expect(page.extras[1].date.getDate()).toBe(13); // December 13 (Lucia)
    expect(page.extras[2].date.getDate()).toBe(20); // December 20
  });

  it("observanceMeta for adventti produces targeted title and description", () => {
    const meta = observanceMeta("adventti", 2026);
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.title).toBe("Adventti 2026: adventtisunnuntait ja viikot | Viikko Nro");
    expect(meta.description.length).toBeGreaterThanOrEqual(140);
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(meta.description).toContain("29.11.");
    expect(meta.description).toContain("6.12.");
    expect(meta.description).toContain("13.12.");
    expect(meta.description).toContain("20.12.2026");
  });

  it("observanceFaqs for adventti 2026 includes all sundays and itsenaisyyspaiva overlap", () => {
    const page = observancePage("adventti", 2026);
    const faqs = observanceFaqs(page);
    const text = faqs.map((f) => f.q + " " + f.a).join(" ");
    expect(text).toContain("29. marraskuuta 2026");
    expect(text).toContain("6. joulukuuta 2026");
    expect(text).toContain("itsenäisyyspäivä");
    for (const { q, a } of faqs) {
      expect(q + a).not.toMatch(/–/);
    }
  });

  it("observancePathForFlagDay maps Itsenäisyyspäivä to dedicated page", () => {
    expect(observancePathForFlagDay("Itsenäisyyspäivä", 2026)).toBe("/itsenaisyyspaiva-2026");
  });

  it("flag days 2026 includes Lasten oikeuksien päivä, Itsenäisyyspäivä and Sibelius day", () => {
    const flagDays = flagDaysInYear(2026);
    const childrenRights = flagDays.find((d) => d.slug === "lapsen-oikeuksien-paiva");
    expect(childrenRights).toBeDefined();
    expect(childrenRights.weekday).toBe("Perjantai");
    expect(childrenRights.date.getDate()).toBe(20);
    expect(childrenRights.date.getMonth()).toBe(10); // November 20
    expect(childrenRights.altName).toContain("Lasten oikeuksien päivä");

    const independence = flagDays.find((d) => d.slug === "itsenaisyyspaiva");
    expect(independence).toBeDefined();
    expect(independence.weekday).toBe("Sunnuntai");
    expect(independence.date.getDate()).toBe(6);
    expect(independence.date.getMonth()).toBe(11); // December 6

    const sibelius = flagDays.find((d) => d.slug === "sibeliuksen-paiva");
    expect(sibelius).toBeDefined();
    expect(sibelius.weekday).toBe("Tiistai");
    expect(sibelius.date.getDate()).toBe(8);
    expect(sibelius.date.getMonth()).toBe(11); // December 8
  });
});
