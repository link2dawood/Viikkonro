// Preserve actionable bundle stack locations while excluding form contents,
// request bodies, query strings, user context and original exception messages.
export function publicErrorEvent(event) {
  const values = event.exception?.values;
  if (!Array.isArray(values) || values.length === 0) return null;
  const safeType = (type) => ["Error","TypeError","RangeError","ReferenceError","SyntaxError","URIError","EvalError","AggregateError"].includes(type) ? type : "Error";
  return {
    event_id:event.event_id,timestamp:event.timestamp,platform:"javascript",
    level:"error",environment:event.environment,release:event.release,
    exception:{ values:values.slice(0,5).map(value => ({
      type:safeType(value.type),value:"Browser application error",
      stacktrace:{ frames:(value.stacktrace?.frames ?? []).slice(-80).map(frame => {
        let filename;
        try {
          const url = new URL(frame.filename);
          if (/^https?:$/.test(url.protocol) && /^\/assets\/[A-Za-z0-9_.-]+\.js$/.test(url.pathname)) filename=url.origin+url.pathname;
        } catch { /* Unknown script names do not belong in an error report. */ }
        return { filename,lineno:frame.lineno,colno:frame.colno,in_app:frame.in_app };
      }) },
    })) },
  };
}
