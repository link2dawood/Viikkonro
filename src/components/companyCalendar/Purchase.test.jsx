import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Purchase from "./Purchase.jsx";

describe("Purchase component", () => {
  const dummyProps = {
    year: 2027,
    status: null,
    onStatus: vi.fn(),
    onCheckout: vi.fn(),
    onSendEmail: vi.fn(),
    busy: null,
    defaultCompanyName: "Yritys Oy",
  };

  it("renders purchase steps, legal links, and restore section when unpaid", () => {
    const html = renderToStaticMarkup(<Purchase {...dummyProps} />);
    expect(html).toContain('id="cc-purchase"');
    expect(html).toContain('data-clarity-mask="True"');
    expect(html).toContain("/kayttoehdot");
    expect(html).toContain("/palautusehdot");
    expect(html).toContain("Tarkista maksu");
    expect(html).toContain("Palauta aiempi osto");
    expect(html).toContain('id="cc-restore-code"');
  });

  it("renders restore code and email delivery section when purchase is confirmed", () => {
    const paidStatus = { paid: true, year: 2027, restoreCode: "valid-secret-restore-code" };
    const html = renderToStaticMarkup(<Purchase {...dummyProps} status={paidStatus} />);
    expect(html).toContain("Kalenterin 2027 lataukset on avattu");
    expect(html).toContain("Tallenna ostotunnus");
    expect(html).toContain("Lähetä kalenteritiedosto sähköpostiin");
    expect(html).toContain('id="cc-deliver-email"');
    expect(html).toContain("Lähetä kalenteri sähköpostiin");
    expect(html).toContain(".ics-kalenteritiedosto ja PDF");
  });
});
