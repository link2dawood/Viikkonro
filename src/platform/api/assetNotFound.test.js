import fs from "node:fs";
import { describe, expect, it } from "vitest";
import handler, { handleMissingAsset } from "../../../api/asset-404.js";

describe("Missing static assets 404 handler", () => {
  it("returns 404 with no-cache and no-store headers", async () => {
    const res = handleMissingAsset();
    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-cache, no-store, must-revalidate");
    expect(res.headers.get("CDN-Cache-Control")).toBe("no-store");
    expect(res.headers.get("Vercel-CDN-Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(await res.text()).toBe("Not found");
  });

  it("exports a standard fetch handler matching Vercel serverless conventions", async () => {
    const res = await handler.fetch();
    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("configures rewrites and no-store headers in vercel.json for missing assets", () => {
    const vercel = JSON.parse(
      fs.readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8")
    );

    const assetRewrite = vercel.rewrites.find((r) => r.source === "/assets/(.*)");
    const fontRewrite = vercel.rewrites.find((r) => r.source === "/fonts/(.*)");
    expect(assetRewrite).toBeDefined();
    expect(assetRewrite.destination).toBe("/api/asset-404");
    expect(fontRewrite).toBeDefined();
    expect(fontRewrite.destination).toBe("/api/asset-404");

    const asset404Headers = vercel.headers.find((h) => h.source === "/api/asset-404");
    expect(asset404Headers).toBeDefined();
    const cacheControl = asset404Headers.headers.find((h) => h.key === "Cache-Control");
    expect(cacheControl.value).toContain("no-store");
  });
});
