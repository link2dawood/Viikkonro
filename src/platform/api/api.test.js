import { describe, it, expect, vi } from "vitest";
import { calendarApiData, API_RESOURCES } from "./calendar.js";
import { handleCalendarApi } from "./handler.js";
import { apiUsageStore } from "../../../api/v1/[resource].js";
const data = (resource, query) => calendarApiData(resource, new URLSearchParams(query));
const key = `vnr_${"a".repeat(64)}`;
const usage = { status: "ok", minuteLimit: 30, minuteRemaining: 29, monthLimit: 10000, monthRemaining: 9999 };
const request = (path = "holidays?year=2027", headers = { authorization: `Bearer ${key}` }, method = "GET") => new Request(`https://viikkonro.fi/api/v1/${path}`, { headers, method });
describe("Business calendar v1 data", () => {
  for (const year of [2026, 2027, 2028]) it(`reuses complete civil calendar ${year}`, () => {
    const calendar = data("calendar", `year=${year}`);
    expect(calendar.days).toHaveLength(year === 2028 ? 366 : 365);
    expect(calendar.days[0].date).toBe(`${year}-01-01`);
    expect(calendar.days.at(-1).date).toBe(`${year}-12-31`);
    expect(data("paydays", `year=${year}&day=last`).paydays).toHaveLength(12);
    expect(data("flag-days", `year=${year}`).flagDays.length).toBeGreaterThan(10);
    expect(data("holidays", `year=${year}`).holidays.find((h) => h.name === "Jouluaatto").official).toBe(false);
  });
  it("retains ISO year boundaries", () => { expect(data("week", "date=2027-01-01")).toMatchObject({ week: 53, weekYear: 2026, from: "2026-12-28", to: "2027-01-03" }); });
  it("retains leap days and explicit statutory/planner differences", () => {
    expect(data("working-days", "from=2028-02-29&to=2028-02-29").days).toBe(1);
    expect(data("working-days", "from=2027-12-24&to=2027-12-24&rule=FINLAND_WORKDAY").counted).toBe(1);
    expect(data("working-days", "from=2027-12-24&to=2027-12-24&rule=FINLAND_BANKING").counted).toBe(0);
  });
  it("does not fabricate school holidays", () => { expect(() => data("school-holidays", "year=2030&city=Helsinki")).toThrow(); const periods = data("school-holidays", "year=2027&city=Helsinki").periods; expect(periods.length).toBeGreaterThan(0); for (const period of periods) { expect(period.confidence).toMatch(/^(confirmed|estimated)$/); expect(period.sourceUrl).toMatch(/^https:\/\//); expect(period.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/); } });
  for (const [resource, query] of [["calendar", "year=2027&year=2028"], ["calendar", "year=2027&rule=__proto__"], ["calendar", "year=1999"], ["week", "date=2027-02-29"], ["week", "year=2027&week=53"], ["week", "date=2027-01-01&year=2027"], ["paydays", "year=2027&day=0"], ["holidays", "year=2027&company=secret"], ["working-days", "from=2026-01-01&to=2028-01-01"], ["working-days", "from=2027-01-02&to=2027-01-01"]]) it(`rejects ${resource} ${query}`, () => expect(() => data(resource, query)).toThrow());
});
describe("API authorization and HTTP contract", () => {
  it("authorizes before returning UTF-8 JSON with private-cache protections", async () => {
    const consume = vi.fn().mockResolvedValue(usage), monitor = vi.fn();
    const response = await handleCalendarApi(request(), { consume, monitor, requestId: "test" });
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ version: "v1", timezone: "Europe/Helsinki" });
    expect(consume).toHaveBeenCalledWith(key, "holidays");
    expect(JSON.stringify(monitor.mock.calls)).not.toContain(key);
  });
  for (const [req, status] of [[request("holidays?year=2027", {}), 401], [request(`holidays?year=2027&key=${key}`, {}), 401], [request("holidays?year=2027", undefined, "POST"), 405], [request("organizations?year=2027"), 404], [request("holidays?year=oops"), 400]]) it(`fails closed with ${status}`, async () => { const consume = vi.fn(); expect((await handleCalendarApi(req, { consume, requestId: "test" })).status).toBe(status); expect(consume).not.toHaveBeenCalled(); });
  for (const [result, status] of [[{ status: "invalid_key" }, 401], [{ status: "rate_limit", retryAfter: 20 }, 429], [{ status: "usage_limit", retryAfter: 300 }, 429], [{ status: "unexpected" }, 503]]) it(`handles ${result.status}`, async () => { const r = await handleCalendarApi(request(), { consume: async () => result, requestId: "test" }); expect(r.status).toBe(status); expect(JSON.stringify(await r.json())).not.toContain("holidays"); });
  it("fails closed on storage failure and redacts provider errors", async () => { const r = await handleCalendarApi(request(), { consume: async () => { throw new Error(key); }, requestId: "test" }); expect(r.status).toBe(503); expect(JSON.stringify(await r.json())).not.toContain(key); });
  it("hashes keys before database transport and blocks redirects", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(usage));
    await apiUsageStore({ BUSINESS_API_SUPABASE_URL: "https://example.supabase.co", BUSINESS_API_SUPABASE_SECRET: "sb_secret_test" }, fetcher)(key, "week");
    const init = fetcher.mock.calls[0][1]; expect(init.body).not.toContain(key); expect(JSON.parse(init.body).p_hash).toMatch(/^[a-f0-9]{64}$/); expect(init.redirect).toBe("error");
  });
  it("requires configured server storage", () => expect(() => apiUsageStore({})).toThrow());
  it("rejects browser publishable credentials on the server", () => expect(() => apiUsageStore({ BUSINESS_API_SUPABASE_URL: "https://example.supabase.co", BUSINESS_API_SUPABASE_SECRET: "sb_publishable_test" })).toThrow());
  it("publishes exactly seven resources", () => expect(API_RESOURCES).toHaveLength(7));
});
