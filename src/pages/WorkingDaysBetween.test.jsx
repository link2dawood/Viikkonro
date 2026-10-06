import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import WorkingDaysBetween from "./WorkingDaysBetween.jsx";
import {
  calculateDaysBetween,
  workingDaysBetweenFaqs,
} from "../data/workingDaysContent.js";

describe("workday calculator crawlable content", () => {
  const render = () => renderToStaticMarkup(
    <HelmetProvider><MemoryRouter><WorkingDaysBetween /></MemoryRouter></HelmetProvider>,
  );

  it("renders calculated examples including holidays and both endpoints", () => {
    const html = render();
    const cellsFor = (label) => html.match(new RegExp(`<tr><th scope="row">${label}:[\\s\\S]*?</tr>`))?.[0];
    expect(cellsFor("Tavallinen työviikko")).toContain("<td>5</td><td>2</td><td>0</td><td>7</td>");
    expect(cellsFor("Joulukuu")).toContain("<td>22</td><td>8</td><td>1</td><td>31</td>");
    expect(cellsFor("Vuodenvaihde")).toContain("<td>4</td><td>2</td><td>1</td><td>7</td>");
    expect(cellsFor("Yksi arkipäivä")).toContain("<td>1</td><td>0</td><td>0</td><td>1</td>");
  });

  it("renders every shared FAQ answer verbatim", () => {
    const html = render();
    for (const { q, a } of workingDaysBetweenFaqs) {
      expect(html).toContain(`<summary>${q}</summary><p>${a}</p>`);
    }
  });

  it("distinguishes normal workdays from Kela Monday-Saturday days", () => {
    const work = calculateDaysBetween("2026-12-01", "2026-12-31", "work");
    const kela = calculateDaysBetween("2026-12-01", "2026-12-31", "kela");
    expect(work.working).toBe(22);
    expect(kela.working).toBe(25);
    expect(kela.weekend).toBe(4);
    expect(kela.holidays).toBe(2);
  });

  it("counts an eve but excludes a Saturday public holiday in Kela mode", () => {
    const result = calculateDaysBetween("2026-06-19", "2026-06-21", "kela");
    expect(result).toMatchObject({ working: 1, holidays: 1, weekend: 1, total: 3 });
  });

  it("rejects impossible dates and unknown calculation modes", () => {
    expect(calculateDaysBetween("2026-02-30", "2026-03-01", "work")).toBeNull();
    expect(calculateDaysBetween("2026-03-01", "2026-03-02", "unknown")).toBeNull();
  });
});
