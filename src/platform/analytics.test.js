import { expect, it } from "vitest";
import { plannerCreatedEvents } from "./analytics.js";
import { plannerCreatedEvents as legacyImport } from "../analytics.js";

it("preserves the planner analytics import, exact event names, tag order and whitelist", () => {
  expect(legacyImport).toBe(plannerCreatedEvents);
  expect(plannerCreatedEvents({
    planner_type: "sprinttisuunnittelija", year: 2027, start_month: "2027-03",
    end_month: null, size: 6, companyName: "Private name",
  })).toEqual([
    ["set", "planner_type", "sprinttisuunnittelija"],
    ["set", "planner_year", "2027"],
    ["set", "planner_start_month", "2027-03"],
    ["set", "planner_size", "6"],
    ["event", "planner_created"],
    ["event", "planner_created_sprinttisuunnittelija"],
  ]);
});
