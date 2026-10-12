import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TeamRecovery from "./TeamRecovery.jsx";

it("accepts deployed eight-digit recovery codes and existing six-digit codes without accepting malformed input", () => {
  const html = renderToStaticMarkup(<TeamRecovery client={{}} />);
  const input = html.match(/<input[^>]*name="token"[^>]*>/)[0];
  const pattern = new RegExp(`^(?:${input.match(/pattern="([^"]+)"/)[1]})$`);
  expect(pattern.test("12345678")).toBe(true);
  expect(pattern.test("123456")).toBe(true);
  for (const malformed of ["1234567", "123456789", "12345", "1234567a", " 12345678"]) expect(pattern.test(malformed)).toBe(false);
  expect(input).toContain('maxLength="8"');
  expect(html).toContain('minLength="12"');
});
