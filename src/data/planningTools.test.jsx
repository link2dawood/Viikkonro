import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { bestBreaks, breakTable, dayOffReason, leaveDaysNeeded, plannerFaqs } from "./vacationPlanner.js";
import { MAX_PROJECT_DAYS, projectExample, projectFaqs, projectPlan } from "./projectTimeline.js";
import { SPRINT_WEEKS, sprintExample, sprintFaqs, sprintOn, sprintPlan } from "./sprintPlanner.js";
import { parseIsoDate, nextMonday, toIsoDate } from "./planningDates.js";
import { isWorkingDay } from "./dateCalculator.js";
import { routeMeta, sitemapEntries } from "./seo.js";
import { sitemapLastmod } from "./sitemapMetadata.js";
import { ProjectResult } from "../pages/ProjectTimeline.jsx";
import { SprintTable } from "../pages/SprintPlanner.jsx";
import { MemoryRouter } from "react-router-dom";
import { DAY_RULES, countsAsDay, dayReason } from "./dayRules.js";
import { leaveFreeReason } from "./annualLeave.js";
import DayRuleNote from "../components/DayRuleNote.jsx";

const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const PATHS = ["/lomasuunnittelija", "/projektiaikataulu", "/sprinttisuunnittelija"];

describe("planning tools: shared date helpers", () => {
  it("parses only real dates", () => {
    expect(ymd(parseIsoDate("2027-03-22"))).toBe("2027-3-22");
    expect(parseIsoDate("2027-02-30")).toBeNull();
    expect(parseIsoDate("")).toBeNull();
    expect(toIsoDate(new Date(2027, 0, 5))).toBe("2027-01-05");
  });
  it("finds the Monday on or after a date", () => {
    expect(ymd(nextMonday(new Date(2026, 9, 6)))).toBe("2026-10-12"); // Tuesday
    expect(ymd(nextMonday(new Date(2026, 9, 12)))).toBe("2026-10-12"); // Monday itself
    expect(ymd(nextMonday(new Date(2026, 9, 11)))).toBe("2026-10-12"); // Sunday
  });
});

describe("vacation planner", () => {
  it("treats weekends, holidays and the two eves as days off", () => {
    expect(dayOffReason(new Date(2027, 2, 26))).toBe("Pitkäperjantai");
    expect(dayOffReason(new Date(2026, 11, 24))).toBe("Jouluaatto");
    expect(dayOffReason(new Date(2027, 2, 27))).toBe("Lauantai");
    expect(dayOffReason(new Date(2027, 2, 30))).toBeNull();
  });
  it("counts only Monday-Friday non-holidays as leave days", () => {
    // Easter 2027: Fri 26.3. and Mon 29.3. are holidays, Tue-Fri 30.3.-2.4. are workdays.
    expect(leaveDaysNeeded(new Date(2027, 2, 26), new Date(2027, 2, 29))).toBe(0);
    expect(leaveDaysNeeded(new Date(2027, 2, 26), new Date(2027, 3, 4))).toBe(4);
  });
  it("finds the Easter 2027 break and never exceeds the leave budget", () => {
    const [easter] = bestBreaks(2027, 4, 5).filter((b) => b.from.getMonth() === 2);
    expect(ymd(easter.from)).toBe("2027-3-20");
    expect(easter.days).toBe(10);
    expect(easter.used).toBe(4);
    for (const budget of [1, 3, 5, 10]) {
      for (const b of bestBreaks(2027, budget, 5)) {
        expect(b.used).toBeLessThanOrEqual(budget);
        expect(leaveDaysNeeded(b.from, b.to)).toBe(b.used);
        expect(dayOffReason(b.from)).not.toBeNull();
        expect(dayOffReason(b.to)).not.toBeNull();
      }
    }
  });
  it("returns non-overlapping breaks that start in the year", () => {
    const breaks = bestBreaks(2027, 4, 5);
    breaks.forEach((b, i) => {
      expect(b.from.getFullYear()).toBe(2027);
      if (i) expect(b.from > breaks[i - 1].to).toBe(true);
    });
  });
  it("buys more days off with a bigger budget", () => {
    const table = breakTable(2027);
    for (let i = 1; i < table.length; i += 1) expect(table[i].days).toBeGreaterThanOrEqual(table[i - 1].days);
  });
  it("keeps FAQs free of en dashes and double dots", () => {
    for (const { q, a } of plannerFaqs()) expect(q + a).not.toMatch(/–|\.\./);
  });
});

describe("project timeline", () => {
  it("rolls a non-working start forward and ends on a working day", () => {
    const plan = projectPlan(new Date(2027, 0, 9), { workingDays: 5 }); // Saturday
    expect(ymd(plan.start)).toBe("2027-1-11");
    expect(ymd(plan.end)).toBe("2027-1-15");
    expect(isWorkingDay(plan.end)).toBe(true);
  });
  it("skips public holidays when counting working days", () => {
    // Good Friday 26.3. and Easter Monday 29.3. 2027 are not working days.
    const plan = projectPlan(new Date(2027, 2, 22), { workingDays: 6 });
    expect(ymd(plan.end)).toBe("2027-3-31");
  });
  it("agrees between the length and the end-date modes", () => {
    const byDays = projectPlan(new Date(2027, 0, 11), { workingDays: 60 });
    const byEnd = projectPlan(new Date(2027, 0, 11), { end: byDays.end });
    expect(byEnd.workingDays).toBe(60);
    expect(ymd(byEnd.end)).toBe(ymd(byDays.end));
    expect(byEnd.rows.length).toBe(byDays.rows.length);
  });
  it("sums weekly working days to the total and rejects bad input", () => {
    const plan = projectPlan(new Date(2027, 0, 11), { workingDays: 60 });
    expect(plan.rows.reduce((n, r) => n + r.workingDays, 0)).toBe(60);
    expect(projectPlan(new Date(2027, 0, 11), { end: new Date(2026, 0, 1) })).toBeNull();
    expect(projectPlan(new Date(2027, 0, 11), { workingDays: 0 })).toBeNull();
    expect(projectPlan(new Date(2027, 0, 11), { workingDays: MAX_PROJECT_DAYS + 1 })).toBeNull();
    expect(projectPlan(null, { workingDays: 5 })).toBeNull();
  });
  it("places milestones on the matching working day", () => {
    const plan = projectPlan(new Date(2027, 0, 11), { workingDays: 60 });
    expect(plan.milestones.map((m) => m.percent)).toEqual([25, 50, 75, 100]);
    expect(ymd(plan.milestones[3].date)).toBe(ymd(plan.end));
    expect(plan.milestones[0].date < plan.milestones[1].date).toBe(true);
  });
  it("shares its example numbers with the FAQs", () => {
    const ex = projectExample();
    expect(ex.workingDays).toBe(60);
    const text = projectFaqs().map((f) => f.a).join(" ");
    expect(text).toContain("6.4.2027");
    expect(text).not.toMatch(/–|\.\./);
  });
  it("renders the result with weekly rows and milestones", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProjectResult plan={projectPlan(new Date(2027, 0, 11), { workingDays: 60 })} />
      </MemoryRouter>,
    );
    expect(html).toContain("Projekti päättyy");
    expect(html).toContain("2. pääsiäispäivä");
    expect(html).toContain("Välitavoitteet");
  });
});

describe("sprint planner", () => {
  it("lays out consecutive sprints with no gap or overlap", () => {
    for (const weeks of SPRINT_WEEKS) {
      const plan = sprintPlan(new Date(2027, 2, 22), weeks, 8);
      expect(plan).toHaveLength(8);
      plan.forEach((s, i) => {
        expect(Math.round((s.to - s.from) / 86400000) + 1).toBe(weeks * 7);
        if (i) expect(Math.round((s.from - plan[i - 1].to) / 86400000)).toBe(1);
      });
    }
  });
  it("reduces capacity for public holidays", () => {
    const [first, second] = sprintPlan(new Date(2027, 2, 22), 2, 2);
    expect(first.workingDays).toBe(8);
    expect(first.capacity).toBe(80);
    expect(first.holidays.map((h) => h.name)).toEqual(["Pitkäperjantai", "2. pääsiäispäivä"]);
    expect(second.workingDays).toBe(10);
    expect(second.capacity).toBe(100);
  });
  it("reports ISO weeks, including across a year boundary", () => {
    const [s] = sprintPlan(new Date(2027, 2, 22), 2, 1);
    expect([s.weekFrom, s.weekTo]).toEqual([12, 13]);
    const [y] = sprintPlan(new Date(2026, 11, 28), 2, 1); // ISO week 53 of 2026
    expect(y.weekFromYear).not.toBe(y.weekToYear);
  });
  it("finds the sprint a date is in and rejects bad input", () => {
    const plan = sprintPlan(new Date(2027, 2, 22), 2, 3);
    expect(sprintOn(plan, new Date(2027, 3, 6)).number).toBe(2);
    expect(sprintOn(plan, new Date(2027, 0, 1))).toBeNull();
    expect(sprintPlan(new Date(2027, 2, 22), 7, 3)).toBeNull();
    expect(sprintPlan(new Date(2027, 2, 22), 2, 0)).toBeNull();
    expect(sprintPlan(null, 2, 3)).toBeNull();
  });
  it("shares its example numbers with the FAQs and renders the table", () => {
    expect(sprintExample().easter.workingDays).toBe(8);
    const text = sprintFaqs().map((f) => f.a).join(" ");
    expect(text).toContain("8 työpäivää kymmenestä (80 prosenttia)");
    expect(text).not.toMatch(/–|\.\./);
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SprintTable plan={sprintPlan(new Date(2027, 2, 22), 2, 3)} today={new Date(2027, 3, 6)} />
      </MemoryRouter>,
    );
    expect(html).toContain("viikot 12-13");
    expect(html).toContain('aria-current="date"');
  });
});

describe("planning tools: SEO registration", () => {
  it("has distinct metadata and a sitemap entry with a known lastmod for each page", () => {
    const titles = new Set();
    for (const path of PATHS) {
      const meta = routeMeta[path];
      // The build rejects longer titles and descriptions (prerender.js).
      expect(meta.title.length).toBeLessThanOrEqual(60);
      expect(meta.description.length).toBeGreaterThan(80);
      expect(meta.description.length).toBeLessThanOrEqual(158);
      expect(meta.title + meta.description).not.toMatch(/–/);
      titles.add(meta.title);
      expect(sitemapEntries().some((e) => e.path === path)).toBe(true);
      expect(sitemapLastmod(path, "2099-01-01")).toBe("2026-10-06");
    }
    expect(titles.size).toBe(PATHS.length);
  });
});

describe("day rule modes", () => {
  const sat = new Date(2027, 3, 3); // an ordinary Saturday (27.3. is pääsiäislauantai)
  const eve = new Date(2026, 11, 24); // jouluaatto, a Thursday
  const goodFriday = new Date(2027, 2, 26);
  const plainTuesday = new Date(2027, 2, 30);
  const sunday = new Date(2027, 2, 28);

  it("defines the four explicit modes, each with a disclosure", () => {
    expect(Object.keys(DAY_RULES)).toEqual([
      "FINLAND_STATUTORY_LEAVE",
      "FINLAND_PLANNER",
      "FINLAND_PROJECT",
      "FINLAND_SPRINT",
    ]);
    for (const rule of Object.values(DAY_RULES)) {
      expect(rule.disclosure.length).toBeGreaterThan(40);
      expect(rule.disclosure).not.toMatch(/–/);
    }
  });
  it("counts Saturday only as a statutory leave day", () => {
    expect(countsAsDay("FINLAND_STATUTORY_LEAVE", sat)).toBe(true);
    expect(countsAsDay("FINLAND_PLANNER", sat)).toBe(false);
    expect(countsAsDay("FINLAND_PROJECT", sat)).toBe(false);
    expect(countsAsDay("FINLAND_SPRINT", sat)).toBe(false);
  });
  it("treats the eves as off for leave and planning, but as working days for project and sprint", () => {
    expect(countsAsDay("FINLAND_STATUTORY_LEAVE", eve)).toBe(false);
    expect(countsAsDay("FINLAND_PLANNER", eve)).toBe(false);
    expect(countsAsDay("FINLAND_PROJECT", eve)).toBe(true);
    expect(countsAsDay("FINLAND_SPRINT", eve)).toBe(true);
  });
  it("agrees on holidays, Sundays and ordinary weekdays", () => {
    for (const mode of Object.keys(DAY_RULES)) {
      expect(countsAsDay(mode, goodFriday)).toBe(false);
      expect(countsAsDay(mode, sunday)).toBe(false);
      expect(countsAsDay(mode, plainTuesday)).toBe(true);
    }
  });
  it("keeps the project and sprint modes identical to the existing workday logic", () => {
    for (let d = new Date(2026, 0, 1); d < new Date(2029, 0, 1); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      expect(countsAsDay("FINLAND_PROJECT", d)).toBe(isWorkingDay(d));
      expect(countsAsDay("FINLAND_SPRINT", d)).toBe(isWorkingDay(d));
    }
  });
  it("keeps the statutory mode identical to the annual leave calculator", () => {
    for (let d = new Date(2026, 0, 1); d < new Date(2029, 0, 1); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      expect(dayReason("FINLAND_STATUTORY_LEAVE", d)).toBe(leaveFreeReason(d));
    }
  });
  it("shows the disclosure from the engine", () => {
    const html = renderToStaticMarkup(<DayRuleNote mode="FINLAND_SPRINT" />);
    expect(html).toContain("Käytetty sääntö");
    expect(html).toContain(DAY_RULES.FINLAND_SPRINT.disclosure);
  });
});
