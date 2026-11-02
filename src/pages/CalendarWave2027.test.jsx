import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import CalendarYear from "./CalendarYear.jsx";
import YearCalendar from "./YearCalendar.jsx";
import { calendarAnswer, calendarFaqs, yearAnswer, yearFaqs } from "../data/seo.js";
import { printableCalendarAnswer, printableCalendarFaqs } from "../data/printCalendarContent.js";

// The calendar wave of docs/seo-2027-growth-plan.md: /kalenteri-, /vuosi- and
// /tulostettava-kalenteri- each lead with the query they own, open with a
// computed answer and carry the planning content the briefs ask for.
const render = (element) =>
  renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter>{element}</MemoryRouter>
    </HelmetProvider>,
  );

const EN_DASH = String.fromCharCode(0x2013);

describe("/kalenteri-2027", () => {
  const html = render(<CalendarYear year={2027} />);

  it("leads with the keyword it owns and the computed answer", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("<h1>Kalenteri 2027</h1>");
    // "Viikkokalenteri 2027" belongs to /vuosi-2027: the overview must not
    // take the token back in its own heading.
    expect(html).not.toContain("<h1>Viikkokalenteri 2027");
    expect(html).toContain(calendarAnswer(2027));
  });

  it("lists the year's long weekends and its bridge day", () => {
    expect(html).toContain("Pitkät viikonloput 2027");
    expect(html).toContain("Vuonna 2027 on 5 jaksoa");
    expect(html).toContain("Pitkäperjantai, 1. pääsiäispäivä, 2. pääsiäispäivä");
    expect(html).toContain("26.3.2027 - 29.3.2027");
    expect(html).toContain("/viikko-12-2027");
    expect(html).toContain("/viikko-13-2027");
    expect(html).toContain("ota perjantai 7.5.2027 vapaaksi");
    expect(html).toContain("vapaata on 4 päivää");
  });

  it("links next year from the top of the page", () => {
    expect(html).toContain("/kalenteri-2028");
    expect(html).toContain("/vuosi-2028");
  });

  it("renders every FAQ from the shared schema source", () => {
    for (const item of calendarFaqs(2027)) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
    expect(html).not.toMatch(/NaN|Invalid Date|undefined/);
    expect(html).not.toContain(EN_DASH);
  });
});

describe("/tulostettava-kalenteri-2027", () => {
  const html = render(<CalendarYear year={2027} print />);

  it("leads with the download intent, not the paper size", () => {
    expect(html).toContain("<h1>Tulostettava kalenteri 2027</h1>");
    expect(html).toContain(printableCalendarAnswer(2027));
    // The visible breadcrumb matches the BreadcrumbList label in
    // src/data/breadcrumbs.js, which already said "Tulostettava kalenteri".
    expect(html).toContain("Tulostettava kalenteri 2027");
    expect(html).not.toContain("A4-kuukausikalenteri 2027</h1>");
  });

  it("offers the neighbouring years and the weekly print", () => {
    expect(html).toContain("/tulostettava-kalenteri-2026");
    expect(html).toContain("/tulostettava-kalenteri-2028");
    expect(html).toContain("/tulosta-2027");
  });

  it("renders the sharing permission schools ask about", () => {
    const sharing = printableCalendarFaqs(2027).at(-1);
    expect(html).toContain(sharing.q);
    expect(html).toContain(sharing.a);
  });
});

describe("/vuosi-2027", () => {
  const html = render(<YearCalendar year={2027} />);

  it("leads with viikkokalenteri and the week boundary answer", () => {
    expect(html).toContain("<h1>Viikkokalenteri 2027: viikkonumerot ja viikot</h1>");
    expect(html).toContain(yearAnswer(2027));
    expect(html).toContain("Viikot 2027");
  });

  it("names the ski-holiday weeks with their sourced cities", () => {
    expect(html).toContain("Hiihtolomaviikot 2027: 8, 9 ja 10");
    expect(html).toContain("Helsinki");
    expect(html).toContain("/koululomat-2027");
    expect(html).toContain("/viikko-8-2027");
  });

  it("explains why the year opens in the previous ISO year's week", () => {
    expect(html).toContain("Miksi vuosi 2027 alkaa viikolla 53?");
    expect(html).toContain("/viikko-53-2026");
  });

  it("renders every FAQ from the shared schema source", () => {
    for (const item of yearFaqs(2027)) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
    expect(html).not.toMatch(/NaN|Invalid Date|undefined/);
    expect(html).not.toContain(EN_DASH);
  });
});

describe("years without the wave's optional content", () => {
  it("omits the ski-holiday section where no source covers the year", () => {
    const html = render(<YearCalendar year={2031} />);
    expect(html).not.toContain("Hiihtolomaviikot");
    expect(html).toContain(yearAnswer(2031));
  });

  it("omits the week-53 explainer when 1 January is already week 1", () => {
    // 2030 starts on a Tuesday, inside its own week 1.
    const html = render(<YearCalendar year={2030} />);
    expect(html).not.toContain("Miksi vuosi 2030 alkaa viikolla");
  });

  it("keeps the half-year views on their own layout", () => {
    const html = render(<CalendarYear year={2027} half={1} />);
    expect(html).toContain("<h1>Viikkokalenteri 2027, 1. vuosipuolisko</h1>");
    expect(html).not.toContain("Pitkät viikonloput");
  });
});
