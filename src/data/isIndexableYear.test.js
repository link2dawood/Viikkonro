import { describe, expect, it, vi, afterEach } from "vitest";
import { isIndexableYear, helsinkiYear } from "./seo.js";
import { isIndexableYear as isIndexableYearDirect, helsinkiYear as helsinkiYearDirect } from "../components/dateUtils.js";

describe("isIndexableYear helper", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("with mocked date 2026-11-30 (Europe/Helsinki currentYear = 2026)", () => {
    // Window in 2026: (2026 - 1) through (2026 + 2) => 2025 to 2028
    it("returns false for 2024, true for 2025 and 2028, and false for 2029 (explicit parameter)", () => {
      const mockDate = new Date("2026-11-30T12:00:00Z");
      expect(helsinkiYear(mockDate)).toBe(2026);
      expect(isIndexableYear(2024, mockDate)).toBe(false);
      expect(isIndexableYear(2025, mockDate)).toBe(true);
      expect(isIndexableYear(2028, mockDate)).toBe(true);
      expect(isIndexableYear(2029, mockDate)).toBe(false);
    });

    it("evaluates correctly using system timer mock (default date argument)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-30T12:00:00Z"));
      expect(helsinkiYear()).toBe(2026);
      expect(isIndexableYear(2024)).toBe(false);
      expect(isIndexableYear(2025)).toBe(true);
      expect(isIndexableYear(2028)).toBe(true);
      expect(isIndexableYear(2029)).toBe(false);
    });
  });

  describe("with mocked date 2027-01-02 (Europe/Helsinki currentYear = 2027, rolled forward)", () => {
    // Window in 2027: (2027 - 1) through (2027 + 2) => 2026 to 2029
    it("returns true for 2026 and false for 2030 (explicit parameter)", () => {
      const mockDate = new Date("2027-01-02T12:00:00Z");
      expect(helsinkiYear(mockDate)).toBe(2027);
      expect(isIndexableYear(2026, mockDate)).toBe(true);
      expect(isIndexableYear(2030, mockDate)).toBe(false);
    });

    it("evaluates correctly using system timer mock (default date argument)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2027-01-02T12:00:00Z"));
      expect(helsinkiYear()).toBe(2027);
      expect(isIndexableYear(2026)).toBe(true);
      expect(isIndexableYear(2030)).toBe(false);
    });
  });

  it("exports identical behavior from dateUtils and seo modules", () => {
    const mockDate = new Date("2026-11-30T12:00:00Z");
    expect(isIndexableYearDirect(2025, mockDate)).toBe(isIndexableYear(2025, mockDate));
    expect(helsinkiYearDirect(mockDate)).toBe(helsinkiYear(mockDate));
  });

  it("handles string years and rejects invalid inputs gracefully", () => {
    const mockDate = new Date("2026-11-30T12:00:00Z");
    expect(isIndexableYear("2027", mockDate)).toBe(true);
    expect(isIndexableYear("invalid", mockDate)).toBe(false);
    expect(isIndexableYear(null, mockDate)).toBe(false);
    expect(isIndexableYear(undefined, mockDate)).toBe(false);
  });
});
