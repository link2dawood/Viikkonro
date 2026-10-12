import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Button from "./Button.jsx";
import Exports from "./companyCalendar/Exports.jsx";

describe("shared planner buttons", () => {
  it("preserves native semantics and accessibility attributes", () => {
    const html=renderToStaticMarkup(<Button disabled aria-label="Lataa PDF">Lataa</Button>);
    expect(html).toContain('type="button"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-label="Lataa PDF"');
    expect(html).toContain('class="btn"');
  });
  it("reuses secondary styles without duplicate classes", () => {
    const html=renderToStaticMarkup(<Button variant="secondary" className="btn custom" type="submit">Lisää</Button>);
    expect(html).toContain('class="btn btn-ghost custom"');
    expect(html).toContain('type="submit"');
  });
  it("distinguishes a product not launched from live company-calendar payments", () => {
    const props={unlocked:false,busy:null,message:"",warnings:[],unlockOpen:true,onExport:()=>{}};
    const live=renderToStaticMarkup(<MemoryRouter><Exports {...props} paymentAvailable /></MemoryRouter>);
    expect(live).toContain("Osto avaa valitun vuoden");
    expect(live).not.toContain("Maksaminen ei ole vielä käytössä");
    const unavailable=renderToStaticMarkup(<MemoryRouter><Exports {...props} unavailableMessage="Pro-latauksia ei vielä myydä." /></MemoryRouter>);
    expect(unavailable).toContain("Pro-latauksia ei vielä myydä.");
    expect(unavailable).not.toContain("Maksaminen ei ole vielä käytössä");
  });
});
