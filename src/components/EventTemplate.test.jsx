import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ChristmasHoliday from "../pages/ChristmasHoliday.jsx";
import EpiphanyHoliday from "../pages/EpiphanyHoliday.jsx";
import IndependenceDay from "../pages/IndependenceDay.jsx";
import NewYearHoliday from "../pages/NewYearHoliday.jsx";
import ObservanceDay from "../pages/ObservanceDay.jsx";
import WeekDays from "../pages/WeekDays.jsx";
import NamedHoliday from "../pages/NamedHoliday.jsx";

// The prerendered day every assertion below is written against. useToday()
// reads it through getServerSnapshot, exactly as prerender.js supplies it.
const RENDER_DAY = "2026-11-22";

function render(element, path = "/") {
  globalThis.__VIIKKONRO_RENDER_DAY__ = RENDER_DAY;
  return renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </HelmetProvider>,
  );
}

afterEach(() => {
  delete globalThis.__VIIKKONRO_RENDER_DAY__;
});

describe("the shared event template", () => {
  it("renders the five ordered parts on /joulu-2026", () => {
    const html = render(<ChristmasHoliday year={2026} />);
    // 1. the answer sentence, still the speakable target
    expect(html).toContain('class="answer-sentence"');
    expect(html).toMatch(/jouluaatto on torstaina 24.12./);
    // 2. the countdown: 22.11.2026 to 24.12.2026 is 32 days
    expect(html).toContain("Jouluaattoon on 32 päivää (torstaina 24. joulukuuta 2026).");
    expect(html).toContain('class="event-countdown-days">32<');
    // 3. the day-off verdict
    expect(html).toContain("Onko jouluaatto 2026 vapaapäivä?");
    // 4. next year's page, 5. the calendar CTA
    expect(html).toContain('href="/joulu-2027"');
    expect(html).toContain('href="/kalenteri-2027"');
    // 6. the visible review date, matching the schema dateModified, with no
    // React comment marker splitting the sentence
    expect(html).toContain(
      'Sisältö päivitetty <time dateTime="2026-11-21">21. marraskuuta 2026</time>.',
    );
  });

  it("counts the whole days left, not the clock, in the prerendered HTML", () => {
    // The hours-and-minutes line only exists after mount, so it must not be
    // in the static markup a crawler sees.
    const html = render(<ChristmasHoliday year={2026} />);
    expect(html).not.toContain("Tarkalleen");
  });

  it("drops the count and keeps the next-year pointer once the day has passed", () => {
    const html = render(<IndependenceDay year={2020} />);
    expect(html).toContain("Itsenäisyyspäivä on jo mennyt.");
    expect(html).not.toContain("event-countdown-days");
    expect(html).toContain('href="/itsenaisyyspaiva-2021"');
  });

  it("states the Sunday verdict on /itsenaisyyspaiva-2026", () => {
    const html = render(<IndependenceDay year={2026} />);
    expect(html).toContain("Itsenäisyyspäivä 2026 on sunnuntai 6.12. (viikko 49)");
    expect(html).toContain("Onko itsenäisyyspäivä 2026 vapaapäivä?");
    expect(html).toContain("Kyllä, mutta osuu viikonlopulle");
    expect(html).toContain("Itsenäisyyspäivään on 14 päivää");
  });

  it("links /adventti-2026 to both calendars and counts to the first advent", () => {
    const html = render(<ObservanceDay slug="adventti" year={2026} />);
    expect(html).toContain("1. adventtiin on 7 päivää (sunnuntaina 29. marraskuuta 2026).");
    expect(html).toContain('href="/kalenteri-2026"');
    expect(html).toContain('href="/kalenteri-2027"');
    expect(html).toContain('href="/adventti-2027"');
    expect(html).toContain('<time dateTime="2026-11-21">');
  });

  it("counts to the 2027 new year and loppiainen across the year boundary", () => {
    const newYear = render(<NewYearHoliday year={2027} />);
    expect(newYear).toContain("Uuteenvuoteen on 40 päivää (perjantaina 1. tammikuuta 2027).");
    expect(newYear).toContain("Kyllä, palkallinen vapaapäivä");
    expect(newYear).toContain('href="/uusi-vuosi-2028"');

    const epiphany = render(<EpiphanyHoliday year={2027} />);
    expect(epiphany).toContain("Loppiaiseen on 45 päivää (keskiviikkona 6. tammikuuta 2027).");
    expect(epiphany).toContain("Onko loppiainen 2027 vapaapäivä?");
    expect(epiphany).toContain('href="/loppiainen-2028"');
  });

  it("uses the allative weekday form, never the keskiviikkolle mistake", () => {
    // 6.12.2028 is a Wednesday, the case a naive weekday + "lle" gets wrong.
    const html = render(<IndependenceDay year={2028} />);
    expect(html).toContain("keskiviikolle");
    expect(html).not.toContain("keskiviikkolle");
  });
});

describe("the rare week 53", () => {
  it("states where week 53 of 2026 ends and when week 1 of 2027 starts", () => {
    const html = render(<WeekDays week={53} year={2026} />);
    expect(html).toContain("Harvinainen viikko 53.");
    expect(html).toContain("Viikko 53 alkaa maanantaina 28.12.2026 ja päättyy sunnuntaina 3.1.2027");
    expect(html).toContain("tammikuun 3 ensimmäistä päivää kuuluvat vielä vuoden 2026 viikkoon 53");
    expect(html).toContain("viikko 1 alkaa maanantaina 4.1.2027");
    expect(html).toContain('href="/miksi-vuodessa-on-53-viikkoa"');
    expect(html).toContain('href="/viikko-1-2027"');
    // The reviewed week page states its review date visibly, matching the
    // dateModified and lastmod the same constant produces.
    expect(html).toContain(
      'Sisältö päivitetty <time dateTime="2026-11-21">21. marraskuuta 2026</time>.',
    );
  });

  it("leaves the other 834 week pages without an unearned review date", () => {
    expect(render(<WeekDays week={52} year={2026} />)).not.toContain("Sisältö päivitetty");
  });

  it("leaves 52-week years without the notice", () => {
    expect(render(<WeekDays week={52} year={2027} />)).not.toContain("Harvinainen viikko 53.");
  });
});

describe("named holiday pages", () => {
  it("links /pyhat-2026/itsenaisyyspaiva to its seasonal landing page", () => {
    const html = render(
      <Routes>
        <Route path="/:holidayYear/:holidaySlug" element={<NamedHoliday />} />
      </Routes>,
      "/pyhat-2026/itsenaisyyspaiva",
    );
    expect(html).toContain('href="/itsenaisyyspaiva-2026"');
  });
});
