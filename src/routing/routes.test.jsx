import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { pageModuleForRoute } from "../AppRoutes.jsx";
import { routePage as clientPage } from "./clientPage.jsx";
import { routePage as serverPage } from "./serverPage.js";

describe("route splitting", () => {
  it.each([
    ["/", "Home"], ["/hr-kalenteri", "HrCalendar"],
    ["/viikko-42-2026", "WeekDays"], ["/kuukausi-10-2026", "WeeksInEachMonth"],
    ["/kalenteri-2027-loppuvuosi", "CalendarYear"], ["/q1-2027", "QuarterPage"],
    ["/palkkapaivat-2027", "Paydays"], ["/nimipaivat/tanaan", "NameDaysToday"],
    ["/nimipaiva/aapeli", "NameDayName"], ["/pyhat-2027/joulupaiva", "NamedHoliday"],
    ["/kalenteripohjat/hr-ja-palkkapaivien-vuosikello", "Templates"],
    ["/tyopaivat-unknown-2027", "NotFound"], ["/palkkapaivat-9999", "NotFound"],
    ["/missing-route", "NotFound"], ["/missing/route/segments", "NotFound"],
  ])("loads the same module used by the router for %s", (path, name) => {
    expect(pageModuleForRoute(path)).toBe(`src/pages/${name}.jsx`);
  });

  it.each([["Home", "default"], ["CalendarYear", "default"], ["Templates", "TemplateCatalog"]])(
    "preloaded client %s matches eager SSR without a Suspense fallback", async (name, exportName) => {
      const Client = clientPage(name, exportName), Server = serverPage(name, exportName);
      await Client.preload();
      const render = Component => renderToString(<HelmetProvider><MemoryRouter><Component year={2027} /></MemoryRouter></HelmetProvider>);
      expect(render(Client)).toBe(render(Server));
    },
  );
});
