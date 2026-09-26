import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { pageTypeOf, pdfDownloadEvents, pdfInfo } from "./analytics.js";
import { homepageSeasonYear } from "./components/dateUtils.js";
import SeasonYear from "./components/SeasonYear.jsx";

afterEach(() => {
  delete globalThis.__VIIKKONRO_RENDER_DAY__;
});

describe("PDF download tracking", () => {
  it("recognises every PDF family and ignores other links", () => {
    expect(pdfInfo("/pdf/kalenteri-2026.pdf")).toEqual({ file: "kalenteri-2026", type: "kalenteri" });
    expect(pdfInfo("/pdf/viikko-39-2026.pdf")).toEqual({ file: "viikko-39-2026", type: "viikko" });
    expect(pdfInfo("https://viikkonro.fi/pdf/kuukausi-9-2026.pdf")).toEqual({ file: "kuukausi-9-2026", type: "kuukausi" });
    expect(pdfInfo("/kalenteri-2026")).toBeNull();
    expect(pdfInfo("/ics/pyhapaivat.ics")).toBeNull();
    expect(pdfInfo("https://example.com/pdf/kalenteri-2026.pdf")).toEqual({ file: "kalenteri-2026", type: "kalenteri" });
  });

  it("fires a total, a per-type and a per-file event plus tags", () => {
    expect(pdfDownloadEvents({ file: "kalenteri-2027", type: "kalenteri" })).toEqual([
      ["set", "pdf_file", "kalenteri-2027"],
      ["set", "pdf_type", "kalenteri"],
      ["event", "pdf_download"],
      ["event", "pdf_download_kalenteri"],
      ["event", "pdf:kalenteri-2027"],
    ]);
  });
});

describe("page types", () => {
  it("maps routes to funnel page types", () => {
    expect(pageTypeOf("/")).toBe("etusivu");
    expect(pageTypeOf("/vuosi-2027")).toBe("vuosi");
    expect(pageTypeOf("/kalenteri-2027-alkuvuosi")).toBe("kalenteri");
    expect(pageTypeOf("/tulostettava-kalenteri-2027")).toBe("tulostettava-kalenteri");
    expect(pageTypeOf("/viikko-1-2027")).toBe("viikko");
    expect(pageTypeOf("/pyhat-2027/joulupaiva")).toBe("pyhapaivat");
    expect(pageTypeOf("/ukk")).toBe("muu");
  });
});

describe("homepage season year", () => {
  it("features next year from September (Helsinki time)", () => {
    expect(homepageSeasonYear(new Date("2026-08-31T12:00:00Z"))).toBe(2026);
    expect(homepageSeasonYear(new Date("2026-08-31T21:30:00Z"))).toBe(2027); // 1.9. 00:30 Helsinki
    expect(homepageSeasonYear(new Date("2026-12-31T12:00:00Z"))).toBe(2027);
    expect(homepageSeasonYear(new Date("2027-01-15T12:00:00Z"))).toBe(2027);
  });

  it("renders the 2027 block in autumn 2026", () => {
    globalThis.__VIIKKONRO_RENDER_DAY__ = "2026-09-26";
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SeasonYear />
      </MemoryRouter>,
    );
    expect(html).toContain("Kalenteri 2027");
    expect(html).toContain("Ensi vuosi");
    expect(html).toContain('href="/pdf/kalenteri-2027.pdf"');
    expect(html).toContain('href="/vuosi-2027"');
    expect(html).toContain('href="/tyopaivat-2027"');
    expect(html).toContain('href="/koululomat-2027"');
  });
});
