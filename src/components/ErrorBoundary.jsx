import React from "react";
import { captureError } from "../sentry.js";

// Catches render errors anywhere below it, reports them to Sentry and shows a
// Finnish fallback instead of a blank page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    captureError(error, { componentStack: info?.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="app" role="alert">
        <div className="status-banner error">
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 8px" }}>Jokin meni pieleen</h1>
          <p style={{ margin: "0 0 12px" }}>
            Sivun näyttämisessä tapahtui virhe. Virhe on raportoitu meille. Yritä ladata sivu
            uudelleen tai palaa etusivulle.
          </p>
          <button type="button" className="submit-btn" onClick={() => window.location.reload()}>
            Lataa sivu uudelleen
          </button>{" "}
          <a href="/">Etusivulle</a>
        </div>
      </section>
    );
  }
}
