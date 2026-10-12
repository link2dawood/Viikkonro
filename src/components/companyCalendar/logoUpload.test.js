import { describe, expect, it } from "vitest";
import { readLogo } from "./logoUpload.js";
import { validateBranding } from "../../platform/design/branding.js";

const svgUri = (svg) => `data:image/svg+xml;base64,${btoa(svg)}`;
class Reader {
  readAsDataURL(file) {
    this.result = file.dataUri;
    this.onload();
  }
}

describe("company logo upload", () => {
  it("accepts PNG and self-contained SVG using the shared validator", async () => {
    for (const [type, dataUri] of [
      ["image/png", "data:image/png;base64,iVBORw0KGgo="],
      ["image/svg+xml", svgUri('<svg xmlns="http://www.w3.org/2000/svg"><defs><path id="a" d="M0 0"/></defs><use href="#a"/></svg>')],
    ]) expect(await readLogo({ type, size: 100, dataUri }, Reader)).toEqual({ error: null, logo: { mime: type, dataUri } });
    expect(await readLogo(null, Reader)).toEqual({ error: null, logo: null });
  });
  it("rejects unsupported types, oversized files, scripts and broken base64", async () => {
    for (const file of [
      { type: "image/jpeg", size: 100 },
      { type: "image/png", size: 512 * 1024 + 1 },
      { type: "image/svg+xml", size: 100, dataUri: svgUri('<svg onload="alert(1)"/>') },
      { type: "image/svg+xml", size: 100, dataUri: "data:image/svg+xml;base64,A" },
    ]) expect(await readLogo(file, Reader)).toMatchObject({ error: expect.any(String), logo: null });
  });
  it("reports read errors and aborted reads in Finnish", async () => {
    for (const ReaderType of [
      class { readAsDataURL() { this.onerror(); } },
      class { readAsDataURL() { this.onabort(); } },
      class { constructor() { throw new Error("unavailable"); } },
    ]) expect(await readLogo({ type: "image/png", size: 100 }, ReaderType)).toEqual({ error: "Tiedoston lukeminen epäonnistui.", logo: null });
  });
  it.each([
    '<svg><image href="https://example.com/logo.png"/></svg>',
    '<svg><style>@import "https://example.com/font.css";</style></svg>',
    '<svg><rect style="fill:url(https://example.com/image)"/></svg>',
    '<!DOCTYPE svg SYSTEM "https://example.com/x"><svg/>',
  ])("rejects SVG resources that would leave the device: %s", (svg) => {
    expect(validateBranding({ logo: { dataUri: svgUri(svg) } }).issues).toContain("SVG logo must be self-contained without external resources.");
  });
  it("allows quoted and spaced local gradient references", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url( &quot;#a&quot; )"/></svg>';
    // XML entities in references are conservatively rejected; plain fragments work.
    expect(validateBranding({ logo: { dataUri: svgUri(svg) } }).issues).not.toEqual([]);
    expect(validateBranding({ logo: { dataUri: svgUri('<svg><rect style="fill:url( \'#a\' )"/></svg>') } }).issues).toEqual([]);
  });
});
