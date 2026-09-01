import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar.jsx";

function renderAt(isoTime) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoTime));
  return renderToStaticMarkup(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

afterEach(() => vi.useRealTimers());

describe("Navbar seasonal year targets", () => {
  it("uses the current year before the October promotion boundary", () => {
    const html = renderAt("2026-09-30T20:59:59Z");
    expect(html).toContain('id="navYear" href="/vuosi-2026"');
    expect(html).toContain('id="navPrint" href="/tulosta-2026"');
    expect(html).toContain('id="navCalendar" href="/kalenteri-2026"');
  });

  it("keeps current-year weeks while promoting next-year planning pages", () => {
    const html = renderAt("2026-09-30T21:00:00Z");
    expect(html).toContain('id="navYear" href="/vuosi-2026"');
    expect(html).toContain('id="navPrint" href="/tulosta-2027"');
    expect(html).toContain('id="navCalendar" href="/kalenteri-2027"');
  });

  it("automatically moves all year navigation forward at New Year", () => {
    const html = renderAt("2026-12-31T22:00:00Z");
    expect(html).toContain('id="navYear" href="/vuosi-2027"');
    expect(html).toContain('id="navPrint" href="/tulosta-2027"');
    expect(html).toContain('id="navCalendar" href="/kalenteri-2027"');
  });
});
