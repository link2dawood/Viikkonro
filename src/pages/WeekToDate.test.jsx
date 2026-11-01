import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import WeekToDate from "./WeekToDate.jsx";
import { computeWeekToDate } from "../data/weekToDate.js";

describe("WeekToDate calculator", () => {
  describe("computeWeekToDate validation", () => {
    it("rejects fractional weeks", () => {
      expect(computeWeekToDate("1.5", "2026")).toBeNull();
      expect(computeWeekToDate("0.5", "2026")).toBeNull();
      expect(computeWeekToDate("52.9", "2026")).toBeNull();
      expect(computeWeekToDate(1.5, 2026)).toBeNull();
    });

    it("rejects fractional or invalid years", () => {
      expect(computeWeekToDate("1", "2026.5")).toBeNull();
      expect(computeWeekToDate("1", "abc")).toBeNull();
      expect(computeWeekToDate("1", "999")).toBeNull();
      expect(computeWeekToDate("1", "10000")).toBeNull();
      expect(computeWeekToDate("1", "")).toBeNull();
      expect(computeWeekToDate("1", null)).toBeNull();
    });

    it("rejects scientific notation and non-decimal numbers", () => {
      expect(computeWeekToDate("1e1", "2026")).toBeNull();
      expect(computeWeekToDate("0x10", "2026")).toBeNull();
      expect(computeWeekToDate("NaN", "2026")).toBeNull();
      expect(computeWeekToDate("Infinity", "2026")).toBeNull();
    });

    it("rejects weeks outside the valid ISO range for the specified year", () => {
      expect(computeWeekToDate("0", "2026")).toBeNull();
      expect(computeWeekToDate("-1", "2026")).toBeNull();
      expect(computeWeekToDate("54", "2026")).toBeNull();
      // 2025 has 52 weeks; week 53 does not exist
      expect(computeWeekToDate("53", "2025")).toBeNull();
    });

    it("computes correct date range for valid integer week and year", () => {
      const w1 = computeWeekToDate("1", "2026");
      expect(w1).not.toBeNull();
      expect(w1.w).toBe(1);
      expect(w1.y).toBe(2026);
      expect(w1.start).toBe("29. joulukuuta 2025");
      expect(w1.end).toBe("4. tammikuuta 2026");
      expect(w1.days).toHaveLength(7);
      expect(w1.days[0].name).toBe("Maanantai");
      expect(w1.days[6].name).toBe("Sunnuntai");

      // 2026 is a 53-week year
      const w53 = computeWeekToDate("53", "2026");
      expect(w53).not.toBeNull();
      expect(w53.w).toBe(53);
      expect(w53.y).toBe(2026);
      expect(w53.start).toBe("28. joulukuuta 2026");
      expect(w53.end).toBe("3. tammikuuta 2027");
    });
  });

  describe("WeekToDate component", () => {
    it("renders with step=1 attributes on number inputs", () => {
      const html = renderToStaticMarkup(
        <HelmetProvider>
          <MemoryRouter>
            <WeekToDate />
          </MemoryRouter>
        </HelmetProvider>
      );
      expect(html).toContain('id="wk"');
      expect(html).toContain('id="yr"');
      expect(html).toContain('step="1"');
      expect(html).not.toContain("/viikko-1.5-2026");
      expect(html).not.toContain("Viikko 1.5/2026");
    });
  });
});
