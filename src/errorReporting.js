// Preserve actionable bundle stack locations while excluding form contents,
// request bodies, query strings, user context and original exception messages.
export function publicErrorEvent(event) {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length === 0) return null;
  // Keep only a coarse page family for production triage. Never attach the
  // full URL: user supplied path segments and query strings may contain data.
  const path = typeof window === "undefined" ? "" : window.location.pathname;
  const pageFamily = /^\/vuosi-\d{4}$/.test(path)
    ? "year-calendar"
    : /^\/(?:kalenteri|tulostettava-kalenteri)-\d{4}/.test(path)
      ? "calendar"
      : /^\/viikko-\d{1,2}-\d{4}$/.test(path)
        ? "week"
        : "other";
  const safeType = (type) => ["Error","TypeError","RangeError","ReferenceError","SyntaxError","URIError","EvalError","AggregateError"].includes(type) ? type : "Error";
  const safeValue = (type, value) => {
    if (type !== "RangeError" || typeof value !== "string") return "Browser application error";
    const message = value.trim();
    const known = [
      [/^Invalid time value\.?$/i, "Invalid time value"],
      [/^Invalid array length\.?$/i, "Invalid array length"],
      [/^Maximum call stack size exceeded\.?$/i, "Maximum call stack size exceeded"],
      [/^Invalid currency code(?:\s*:.*)?$/i, "Invalid currency code"],
      [/^(?:minimum|maximum)(?:Fraction|Significant)Digits value is out of range\.?$/i, "Intl number formatting option out of range"],
      [/^Incorrect locale information provided\.?$/i, "Invalid locale identifier"],
    ];
    return known.find(([pattern]) => pattern.test(message))?.[1] ?? "Browser application error";
  };
  const safeAssetFilename = (filename) => {
    if (typeof filename !== "string" || filename.length > 2048) return undefined;
    try {
      // Browsers normally report absolute asset URLs, but React's linked
      // component-stack errors may report a root-relative Vite URL. Normalize
      // both forms to the same stable URL so Sentry can retain the frame.
      const url = new URL(filename, "https://viikkonro.fi");
      if (!/^https?:$/.test(url.protocol) || !["viikkonro.fi", "www.viikkonro.fi"].includes(url.hostname)) return undefined;
      if (!/^\/assets\/[A-Za-z0-9_.-]+\.js$/.test(url.pathname)) return undefined;
      return `https://viikkonro.fi${url.pathname}`;
    } catch {
      return undefined;
    }
  };
  return {
    event_id:event.event_id,timestamp:event.timestamp,platform:"javascript",
    level:"error",environment:event.environment,release:event.release,
    tags:{ page_family:pageFamily },
    exception:{ values:values.slice(0,5).map(value => {
      const type = safeType(value.type);
      return {
        type,
        value:safeValue(type,value.value),
        stacktrace:{ frames:(value.stacktrace?.frames ?? []).slice(-80).map(frame => ({
          filename:safeAssetFilename(frame.filename),
          lineno:frame.lineno,
          colno:frame.colno,
          in_app:frame.in_app,
        })) },
      };
    }) },
  };
}
