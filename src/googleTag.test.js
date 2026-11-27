import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { CONSENT_VERSION } from "./consent.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const TAG_URL = "https://www.googletagmanager.com/gtag/js?id=G-B1M6291M6C";

// Run the inline head script in isolation. The context deliberately omits
// requestIdleCallback so the script takes its setTimeout fallback, which the
// returned `idle` helper then fires; `load` fires the load listener. Both are
// explicit, so a test can observe the state of the page before gtag.js has
// been requested at all.
function run(stored, { readyState = "loading" } = {}) {
  const appended = [];
  const listeners = new Map();
  const timeouts = [];
  const window = {
    localStorage: { getItem: () => stored },
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
  vm.runInNewContext(bootstrap, window);
  return {
    queue: window.dataLayer.map((args) => Array.from(args)),
    appended,
    load: () => (listeners.get("load") ?? []).forEach((handler) => handler()),
    idle: () => timeouts.splice(0).forEach((handler) => handler()),
  };
}

const commands = (stored) => run(stored).queue;

describe("Google tag bootstrap", () => {
  it("names the requested measurement ID once in the public head", () => {
    // The tag is appended by the inline script rather than carried as its own
    // <script src>, so the URL appears exactly once, as a string literal.
    expect(html.match(new RegExp(TAG_URL.replace(/[?]/g, "\\?"), "g"))).toHaveLength(1);
    expect(html.indexOf("gtag('consent', 'default'")).toBeLessThan(html.indexOf("gtag('config'"));
    expect(html.indexOf("gtag('config'")).toBeLessThan(html.indexOf("</head>"));
    expect(html.indexOf(TAG_URL)).toBeLessThan(html.indexOf("</head>"));
  });

  it.each([null, "{invalid", JSON.stringify({ v: CONSENT_VERSION - 1, analytics: true }), JSON.stringify({ v: CONSENT_VERSION, analytics: false })])("keeps storage denied for an absent or ungranted choice: %s", (stored) => {
    const queue = commands(stored);
    expect(queue[0]).toEqual(["consent", "default", {
      analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    }]);
    expect(queue.map((args) => args[0])).toEqual(["consent", "js", "config"]);
    expect(queue.at(-1)).toEqual(["config", "G-B1M6291M6C"]);
  });

  it("restores a current grant before the first measurement", () => {
    const queue = commands(JSON.stringify({ v: CONSENT_VERSION, analytics: true }));
    expect(queue[1]).toEqual(["consent", "update", { analytics_storage: "granted" }]);
    expect(queue.at(-1)).toEqual(["config", "G-B1M6291M6C"]);
  });

  // gtag.js initialization measured about 140 ms of CPU on a mid-range phone
  // and it used to run while React was hydrating. The whole command queue is
  // built synchronously, so nothing is lost by requesting the tag later.
  it("queues every command before requesting gtag.js", () => {
    const page = run(null);
    expect(page.queue.map((args) => args[0])).toEqual(["consent", "js", "config"]);
    expect(page.appended).toEqual([]);
  });

  it("requests gtag.js once the loaded page goes idle", () => {
    const page = run(null);
    page.load();
    expect(page.appended).toEqual([]);
    page.idle();
    expect(page.appended).toHaveLength(1);
    expect(page.appended[0].src).toBe(TAG_URL);
    expect(page.appended[0].async).toBe(1);
  });

  it("does not wait for a load event that has already fired", () => {
    const page = run(null, { readyState: "complete" });
    page.idle();
    expect(page.appended.map((node) => node.src)).toEqual([TAG_URL]);
  });
});
