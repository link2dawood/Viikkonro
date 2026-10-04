import { describe, expect, it } from "vitest";
import { validateContact, LIMITS } from "./contactValidation.js";

const ok = { name: "Matti", email: "matti@example.fi", message: "Hei, tämä on viesti." };

describe("validateContact", () => {
  it("accepts valid input", () => {
    expect(validateContact(ok)).toEqual({});
  });
  it("requires every field", () => {
    expect(Object.keys(validateContact({}))).toEqual(["name", "email", "message"]);
  });
  it("rejects whitespace-only values", () => {
    expect(validateContact({ ...ok, name: "   " }).name).toBeDefined();
  });
  it("rejects malformed emails", () => {
    for (const email of ["a", "a@b", "a@b.c", "a b@c.fi", "@x.fi"]) {
      expect(validateContact({ ...ok, email }).email).toBeDefined();
    }
  });
  it("enforces length limits", () => {
    expect(validateContact({ ...ok, message: "x".repeat(LIMITS.message + 1) }).message).toBeDefined();
    expect(validateContact({ ...ok, message: "lyhyt" }).message).toBeDefined();
    expect(validateContact({ ...ok, name: "x".repeat(LIMITS.name + 1) }).name).toBeDefined();
  });
});
