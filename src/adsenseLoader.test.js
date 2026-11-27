import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

// The AdSense loader is appended by an inline head script instead of being its
// own <script src>, so that the large majority of pages, which mount no ad
// unit, do not spend load-time CPU on the loader and the consent message it
// delivers. Two things have to stay true at once: the loader URL remains a
// literal in the document, which is what PD-19 and the contextual crawlers
// read, and a page that does mount a unit can request the loader immediately
// rather than waiting for idle. See docs/adsense-placement-plan.md.
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const PUBLISHER = "ca-pub-5553975522423673";
const LOADER_URL =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER}`;

const block = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(([, body]) => body)
  .find((body) => body.includes("pagead2.googlesyndication.com"));

function run({ readyState = "loading" } = {}) {
  const appended = [];
  const listeners = new Map();
  const timeouts = [];
  const window = {
    addEventListener: (type, handler) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    setTimeout: (handler) => {
      timeouts.push(handler);
      return timeouts.length;
    },
  };
  window.window = window;
  window.document = {
    readyState,
    createElement: () => ({}),
    head: { appendChild: (node) => appended.push(node) },
  };
  vm.runInNewContext(block, window);
  return {
    window,
    appended,
    load: () => (listeners.get("load") ?? []).forEach((handler) => handler()),
    idle: () => timeouts.splice(0).forEach((handler) => handler()),
  };
}

describe("AdSense loader bootstrap", () => {
  it("keeps the loader URL and the ownership meta in the public head", () => {
    expect(block).toBeTypeOf("string");
    expect(html.split(LOADER_URL)).toHaveLength(2);
    expect(html.indexOf(LOADER_URL)).toBeLessThan(html.indexOf("</head>"));
    expect(html).toContain(
      `<meta name="google-adsense-account" content="${PUBLISHER}" />`,
    );
  });

  it("requests nothing while the page is still loading", () => {
    const page = run();
    expect(page.appended).toEqual([]);
  });

  it("appends the loader once the loaded page goes idle", () => {
    const page = run();
    page.load();
    expect(page.appended).toEqual([]);
    page.idle();
    expect(page.appended).toHaveLength(1);
    expect(page.appended[0].src).toBe(LOADER_URL);
    expect(page.appended[0].async).toBe(1);
    expect(page.appended[0].crossOrigin).toBe("anonymous");
  });

  // AdSlot calls this when a unit mounts, so an ad-bearing page does not wait
  // for idle to request its creative.
  it("lets a mounting ad unit request the loader immediately", () => {
    const page = run();
    page.window.viikkonroLoadAds();
    expect(page.appended.map((node) => node.src)).toEqual([LOADER_URL]);
  });

  it("appends the loader exactly once however often it is asked", () => {
    const page = run({ readyState: "complete" });
    page.window.viikkonroLoadAds();
    page.window.viikkonroLoadAds();
    page.idle();
    page.load();
    expect(page.appended).toHaveLength(1);
  });
});
