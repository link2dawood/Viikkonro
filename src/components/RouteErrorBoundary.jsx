import { Component } from "react";
import { Link } from "react-router-dom";

export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof console !== "undefined" && console.error) {
      console.error("Route render error:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

      return (
        <section className="app" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <h2>{isOffline ? "Ei verkkoyhteyttä" : "Sivun lataus epäonnistui"}</h2>
          <p>
            {isOffline
              ? "Olet offline-tilassa. Tätä sivua ei ole vielä tallennettu laitteellesi. Voit palata etusivulle tai kokeilla uudelleen, kun yhteys palautuu."
              : "Sivun latauksessa tapahtui odottamaton virhe. Voit yrittää ladata sivun uudelleen."}
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={this.handleRetry}>
              Yritä uudelleen
            </button>
            <Link to="/" className="btn">
              Palaa etusivulle
            </Link>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
