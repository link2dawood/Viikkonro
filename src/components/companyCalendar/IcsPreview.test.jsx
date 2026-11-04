import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IcsPreview from "./IcsPreview.jsx";
import { createCalendarConfig } from "../../platform/calendar/config.js";
import { buildCalendarModel } from "../../platform/calendar/model.js";

describe("IcsPreview component", () => {
  const model = buildCalendarModel(
    createCalendarConfig({
      year: 2027,
      include: { holidays: true, flagDays: false, paydays: { day: 15 } },
      events: [{ id: "meeting", date: "2027-05-12", title: "Kevätkokous", kind: "company" }],
      periods: [{ id: "summer-close", kind: "closure", label: "Kesäsulku", start: "2027-07-01", end: "2027-07-15" }],
    }),
  );

  it("renders both Kalenterinäkymä and ICS-tapahtumat tabs with event count", () => {
    const html = renderToStaticMarkup(
      <IcsPreview
        model={model}
        locked={true}
        calendarId="1234567890abcdef1234567890abcdef"
        paydayRows={[]}
      />,
    );
    expect(html).toContain("Kalenterinäkymä");
    expect(html).toContain("ICS-tapahtumat");
    expect(html).toContain("ESIKATSELU");
    expect(html).toContain("ISO-viikkonumerot maanantaisin");
    expect(html).toContain('data-clarity-mask="True"');
  });

  it("handles null or missing calendarId without crashing (falls back to safe identity)", () => {
    expect(() => {
      renderToStaticMarkup(
        <IcsPreview
          model={model}
          locked={false}
          calendarId={null}
          paydayRows={[]}
        />,
      );
    }).not.toThrow();
  });

  it("handles empty string calendarId gracefully without throwing", () => {
    expect(() => {
      renderToStaticMarkup(
        <IcsPreview
          model={model}
          locked={false}
          calendarId=""
          paydayRows={[]}
        />,
      );
    }).not.toThrow();
  });
});
