import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SchoolHolidays from "./SchoolHolidays.jsx";
import WeekDays from "./WeekDays.jsx";
import NamedHoliday from "./NamedHoliday.jsx";
import { holidayFaqs, holidayPageFor } from "../data/holidayPages.js";
import { schoolHolidayFaqs } from "../data/schoolHolidayPages.js";

const render = (element) =>
  renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter>{element}</MemoryRouter>
    </HelmetProvider>,
  );

const renderRoute = (initialPath, routePattern, element) =>
  renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path={routePattern} element={element} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

const EN_DASH = String.fromCharCode(0x2013);

describe("Wave 2: /koululomat-2027 and ski weeks", () => {
  it("renders /koululomat-2027 with city anchors, updated tokens and outward planning link", () => {
    const html = render(<SchoolHolidays year="2027" />);

    expect(html).toContain("<h1>Koululomat 2027: syysloma ja hiihtoloma</h1>");
    expect(html).toContain("Koululaisten hiihtoloma 2027 ajoittuu Suomessa");

    // City anchors for regional search queries
    expect(html).toContain('id="helsinki"');
    expect(html).toContain('id="espoo"');
    expect(html).toContain('id="tampere"');
    expect(html).toContain('id="oulu"');

    // Token ownership: /kalenteri-2027 owns "Kalenteri", /vuosi-2027 owns "Viikkokalenteri"
    expect(html).toContain("<b>Kalenteri 2027</b>");
    expect(html).toContain("<b>Viikkokalenteri 2027</b>");

    // Outward planning link to leave calculator
    expect(html).toContain("/vuosilomalaskuri");
    expect(html).toContain("<b>Vuosilomalaskuri</b>");

    // Links to ski weeks
    expect(html).toContain("/viikko-8-2027");
    expect(html).toContain("/viikko-9-2027");
    expect(html).toContain("/viikko-10-2027");

    // Check FAQs and zero en-dashes
    for (const item of schoolHolidayFaqs(2027)) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
    expect(html).not.toContain(EN_DASH);
  });

  it("links /koululomat-2027 from ski holiday weeks 8, 9 and 10", () => {
    for (const week of [8, 9, 10]) {
      const html = render(<WeekDays week={week} year={2027} />);
      expect(html).toContain("/koululomat-2027");
      expect(html).toContain("Katso koululomat 2027 alueittain");
      expect(html).toContain("Koululoma tällä viikolla:");
      expect(html).toContain("Hiihtoloma");
    }
  });
});

describe("Wave 3: Major 2027 holiday pages", () => {
  it("renders /pyhat-2027/paasiaispaiva with full Easter break and DST crossover note", () => {
    const html = renderRoute(
      "/pyhat-2027/paasiaispaiva",
      "/:holidayYear/:holidaySlug",
      <NamedHoliday />,
    );

    expect(html).toContain("<h1>Pääsiäispäivä 2027</h1>");
    expect(html).toContain("Pääsiäinen 2027: kaikki pääsiäisen pyhät");
    expect(html).toContain("Pitkäperjantai");
    expect(html).toContain("Toinen pääsiäispäivä");
    expect(html).toContain("/viikko-12-2027");
    expect(html).toContain("/viikko-13-2027");

    // 2027 Daylight Saving Time crossover
    expect(html).toContain("Kesäaika ja pääsiäinen 2027");
    expect(html).toContain("/kesaaika-2027");

    // Token consistency
    expect(html).toContain(">kalenteri 2027<");
    expect(html).not.toContain(">viikkokalenteri 2027<");

    for (const item of holidayFaqs(holidayPageFor(2027, "paasiaispaiva"))) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
    expect(html).not.toContain(EN_DASH);
  });

  it("renders /pyhat-2027/helatorstai with bridge day, 39 days rule and planner link", () => {
    const html = renderRoute(
      "/pyhat-2027/helatorstai",
      "/:holidayYear/:holidaySlug",
      <NamedHoliday />,
    );

    expect(html).toContain("<h1>Helatorstai 2027</h1>");
    expect(html).toContain("Siltapäivä ja pitkä viikonloppu 2027");
    expect(html).toContain("Perjantai 7. toukokuuta 2027");
    expect(html).toContain("/vuosilomalaskuri");
    expect(html).toContain("Miksi helatorstai on eri päivänä joka vuosi?");
    expect(html).toContain("tasan 39 päivää pääsiäissunnuntain jälkeen");
    expect(html).toContain("/pyhat-2027/helluntaipaiva");
    expect(html).toContain("Helatorstai lähivuosina");

    for (const item of holidayFaqs(holidayPageFor(2027, "helatorstai"))) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
    expect(html).not.toContain(EN_DASH);
  });

  it("renders /pyhat-2027/juhannusaatto with vapaapäivä status and flag protocol", () => {
    const html = renderRoute(
      "/pyhat-2027/juhannusaatto",
      "/:holidayYear/:holidaySlug",
      <NamedHoliday />,
    );

    expect(html).toContain("<h1>Juhannusaatto 2027</h1>");
    expect(html).toContain("Onko juhannusaatto vapaapäivä?");
    expect(html).toContain("/pyhat-2027/juhannuspaiva");
    expect(html).toContain("Juhannuksen liputus");
    expect(html).toContain("kello 18 ja päättyy juhannuspäivänä kello 21");
    expect(html).toContain("/liputuspaivat-2027#suomen-lipun-paiva");
    expect(html).toContain("Juhannus lähivuosina");

    for (const item of holidayFaqs(holidayPageFor(2027, "juhannusaatto"))) {
      expect(html).toContain(item.q);
      expect(html).toContain(item.a);
    }
    expect(html).not.toContain(EN_DASH);
  });
});
