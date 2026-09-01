import { describe, expect, it } from "vitest";
import {
  NAVIGATION_PROMOTION_MONTH,
  navigationYearTargets,
} from "./dateUtils.js";

describe("sitewide navigation year rollover", () => {
  it("uses a deliberate October promotion boundary", () => {
    expect(NAVIGATION_PROMOTION_MONTH).toBe(10);
    expect(navigationYearTargets(new Date("2026-09-30T20:59:59Z"))).toEqual({
      currentYear: 2026,
      promotedYear: 2026,
      promotesUpcomingYear: false,
    });
    expect(navigationYearTargets(new Date("2026-09-30T21:00:00Z"))).toEqual({
      currentYear: 2026,
      promotedYear: 2027,
      promotesUpcomingYear: true,
    });
  });

  it("keeps both current and upcoming years through the autumn transition", () => {
    expect(navigationYearTargets(new Date("2026-11-15T12:00:00Z"))).toEqual({
      currentYear: 2026,
      promotedYear: 2027,
      promotesUpcomingYear: true,
    });
  });

  it("automatically completes rollover at Helsinki New Year", () => {
    expect(navigationYearTargets(new Date("2026-12-31T21:59:59Z"))).toEqual({
      currentYear: 2026,
      promotedYear: 2027,
      promotesUpcomingYear: true,
    });
    expect(navigationYearTargets(new Date("2026-12-31T22:00:00Z"))).toEqual({
      currentYear: 2027,
      promotedYear: 2027,
      promotesUpcomingYear: false,
    });
  });
});
