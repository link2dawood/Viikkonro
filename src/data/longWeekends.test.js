import { describe, expect, it } from "vitest";
import { bridgeDays, longWeekends } from "./longWeekends.js";
import { countsAsDay } from "./dayRules.js";

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

describe("long weekends", () => {
  it("lists every long weekend of 2027 with its real length", () => {
    expect(
      longWeekends(2027).map((run) => [iso(run.start), iso(run.end), run.days]),
    ).toEqual([
      ["2027-01-01", "2027-01-03", 3],
      ["2027-03-26", "2027-03-29", 4],
      ["2027-06-25", "2027-06-27", 3],
      ["2027-12-04", "2027-12-06", 3],
      ["2027-12-24", "2027-12-26", 3],
    ]);
  });

  it("names the holidays inside a run and the ISO weeks it spans", () => {
    const easter = longWeekends(2027)[1];
    expect(easter.holidays).toEqual([
      "Pitkäperjantai",
      "1. pääsiäispäivä",
      "2. pääsiäispäivä",
    ]);
    expect(easter.weeks).toEqual([
      { week: 12, year: 2027 },
      { week: 13, year: 2027 },
    ]);
  });

  it("never reports a plain weekend as a long weekend", () => {
    for (const year of [2026, 2027, 2028]) {
      for (const run of longWeekends(year)) {
        expect(run.days).toBeGreaterThanOrEqual(3);
        expect(run.holidays.length).toBeGreaterThan(0);
      }
    }
  });

  it("reports a run spanning new year on both years, undivided", () => {
    const end = longWeekends(2023).at(-1);
    expect(iso(end.start)).toBe("2023-12-30");
    expect(iso(end.end)).toBe("2024-01-01");
    expect(end.days).toBe(3);
    expect(end.holidays).toEqual(["Uudenvuodenpäivä"]);
    expect(end.weeks).toEqual([
      { week: 52, year: 2023 },
      { week: 1, year: 2024 },
    ]);
    expect(longWeekends(2024)[0]).toEqual(end);
  });

  it("counts only days the planner mode treats as free", () => {
    for (const run of longWeekends(2027)) {
      for (
        let day = new Date(run.start);
        day <= run.end;
        day.setDate(day.getDate() + 1)
      ) {
        expect(countsAsDay("FINLAND_PLANNER", day)).toBe(false);
      }
    }
  });
});

describe("bridge days", () => {
  it("finds the 2027 helatorstai bridge and the break it buys", () => {
    const bridges = bridgeDays(2027);
    expect(bridges.map((bridge) => iso(bridge.date))).toEqual(["2027-05-07"]);
    expect(bridges[0].freeDays).toBe(4);
    expect(iso(bridges[0].start)).toBe("2027-05-06");
    expect(iso(bridges[0].end)).toBe("2027-05-09");
    expect(bridges[0].holidays).toEqual(["Helatorstai"]);
  });

  it("only counts a single working day between two free runs", () => {
    for (const year of [2026, 2027, 2028]) {
      for (const bridge of bridgeDays(year)) {
        expect(countsAsDay("FINLAND_PLANNER", bridge.date)).toBe(true);
        expect(bridge.freeDays).toBeGreaterThanOrEqual(4);
      }
    }
  });
});
