import { describe, expect, it } from "vitest";
import { FAQ_UPDATED, faqCategories, faqs } from "./faqs.js";

describe("FAQ content", () => {
  it("leads with a direct answer to the primary viikkonumero intent", () => {
    const firstCategory = faqCategories[0];
    const firstItem = firstCategory.items[0];

    expect(firstCategory.title).toBe("Viikkonumero nyt ja perusteet");
    expect(firstItem.q).toBe("Mikä on viikkonumero?");
    expect(firstItem.a).toContain("ISO 8601");
    expect(firstItem.a).toContain("viikko alkaa maanantaina");
    expect(firstItem.a).toContain("52 tai 53 viikkoa");
    expect(FAQ_UPDATED).toBe("2026-10-06");
  });

  it("includes the week abbreviation category in the flat FAQ source", () => {
    const category = faqCategories.find(
      (item) => item.title === "Viikkonumeron lyhenteet ja merkintätavat",
    );
    expect(category?.items).toHaveLength(5);
    expect(category?.items.some((item) => item.q.includes("vko"))).toBe(true);
    expect(faqs).toEqual(expect.arrayContaining(category.items));
  });

  it("keeps FAQ questions unique", () => {
    const questions = faqs.map((item) => item.q);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("includes evergreen date and year-week questions", () => {
    const questions = faqs.map((item) => item.q);
    expect(questions).toEqual(
      expect.arrayContaining([
        "Miten selvitän, mille viikolle tietty päivämäärä osuu?",
        "Miten tiedän, onko vuodessa 52 vai 53 viikkoa?",
        "Mitkä tulevat vuodet ovat 53 viikon vuosia?",
        "Kuinka monta viikkoa on puolessa vuodessa?",
        "Kuinka monta viikkoa on kuukaudessa?",
        "Monesko viikko vuodesta on kulunut?",
      ]),
    );
  });

  it("includes the calendar and printing category", () => {
    const category = faqCategories.find(
      (item) => item.title === "Viikkokalenteri ja tulostaminen",
    );
    expect(category?.items).toHaveLength(4);
    expect(category?.items.map((item) => item.q)).toEqual(
      expect.arrayContaining([
        "Mikä on viikkokalenteri?",
        "Mistä saan tulostettavan viikkokalenterin?",
        "Voinko tulostaa viikkokalenterin PDF-muodossa?",
        "Näkyvätkö pyhäpäivät viikkokalenterissa?",
      ]),
    );
  });

  it("includes the named-holiday category and all statutory holidays", () => {
    const category = faqCategories.find(
      (item) => item.title === "Juhlapäivät ja arkipyhät",
    );
    expect(category?.items).toHaveLength(10);
    expect(category?.items.map((item) => item.q)).toEqual(
      expect.arrayContaining([
        "Milloin on pääsiäinen?",
        "Milloin on juhannus?",
        "Mitkä ovat Suomen viralliset arkipyhät?",
        "Milloin on helatorstai?",
        "Mille viikonpäivälle itsenäisyyspäivä osuu?",
      ]),
    );
    const official = category?.items.find(
      (item) => item.q === "Mitkä ovat Suomen viralliset arkipyhät?",
    );
    expect(official?.a).toContain("13 virallista pyhäpäivää");
    expect(official?.a).toContain("1. pääsiäispäivä");
  });

  it("includes month-week and school-holiday coverage without stale duplicates", () => {
    const month = faqCategories.find(
      (item) => item.title === "Kuukauden viikot",
    );
    const school = faqCategories.find(
      (item) => item.title === "Koululomat ja viikkonumerot",
    );
    expect(month?.items).toHaveLength(2);
    expect(school?.items).toHaveLength(6);
    expect(faqs.some((item) => item.q === "Mihin viikkoon hiihtoloma osuu?")).toBe(
      false,
    );
    expect(faqs.some((item) => item.q === "Mihin viikkoon syysloma osuu?")).toBe(
      false,
    );
    expect(
      school?.items.find(
        (item) => item.q === "Milloin koulujen kesäloma alkaa ja päättyy?",
      )?.a,
    ).toContain("toukokuun lopun");
  });

  it("includes adjacent-date and workplace/software coverage", () => {
    const adjacent = faqCategories.find(
      (item) => item.title === "Kuukausi, päivä ja vuosineljännes",
    );
    const workplace = faqCategories.find(
      (item) => item.title === "Työelämä ja ohjelmistot",
    );
    expect(adjacent?.items).toHaveLength(3);
    expect(workplace?.items).toHaveLength(5);
    expect(workplace?.items.map((item) => item.q)).toEqual(
      expect.arrayContaining([
        "Montako työpäivää vuodessa on?",
        "Miten lasken viikkonumeron Excelissä?",
        "Miten lasken viikkonumeron Google Sheetsissä?",
        "Miten saan viikkonumerot näkyviin Outlookissa?",
        "Miksi työpaikoilla käytetään viikkonumeroita?",
      ]),
    );
    const workingDays = workplace?.items.find(
      (item) => item.q === "Montako työpäivää vuodessa on?",
    );
    expect(workingDays?.a).toContain("260–262");
    expect(workingDays?.a).toContain("252–256");
  });
});
