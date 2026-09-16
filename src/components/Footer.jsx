import { navigationYearTargets } from "./dateUtils";
import { Link, useLocation } from "react-router-dom";
import SocialLinks from "./SocialLinks";
import { CALENDAR_META } from "../data/nameDays";

function Footer() {
  // Copyright follows the Helsinki calendar year, not the ISO week-year (which
  // can roll over during the last days of December).
  const { currentYear } = navigationYearTargets(new Date());
  const { pathname } = useLocation();
  const isEnglishPage = pathname === "/en";

  if (isEnglishPage) {
    return (
      <footer className="site-footer" lang="en">
        <div className="footer-container">
          <div className="footer-brand-col">
            <div className="brand-dark">
              <img
                src="/logo-horizontal-dark-viikkonro-20260916.svg"
                alt="Viikkonro"
                width="592"
                height="122"
                translate="no"
              />
            </div>
            <p className="footer-desc">
              A clear ISO 8601 week-number reference for visitors. The complete
              calendar service is available in Finnish.
            </p>
            <SocialLinks className="footer-social" label="Follow us" />
          </div>

          <div className="footer-links-col">
            <h3>Service</h3>
            <ul>
              <li><Link to="/en" onClick={() => window.scrollTo(0, 0)}>English home</Link></li>
              <li><Link to="/" hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Finnish site</Link></li>
              <li><Link to={`/vuosi-${currentYear}`} hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>All weeks {currentYear} (Finnish)</Link></li>
              <li><Link to={`/kalenteri-${currentYear}`} hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Calendar {currentYear} (Finnish)</Link></li>
              <li><Link to="/avoin-data" hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Open data (Finnish)</Link></li>
              <li><Link to="/android-sovellus" hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Android app (Finnish)</Link></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h3>Information</h3>
            <ul>
              <li><Link to="/menetelma" hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Methodology (Finnish)</Link></li>
              <li><Link to="/tietolahteet" hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Data sources (Finnish)</Link></li>
              <li><Link to="/ota-yhteytta" hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Contact (Finnish)</Link></li>
              <li><Link to="/tietosuoja" hrefLang="fi" onClick={() => window.scrollTo(0, 0)}>Privacy notice (Finnish)</Link></li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />
        <div className="footer-baseline">
          <p>&copy; {currentYear} Viikko Nro. All rights reserved.</p>
          <p className="footer-tz">Based on the international ISO 8601 standard</p>
        </div>
        {CALENDAR_META.attributionRequired && (
          <p className="footer-data-attribution">
            {CALENDAR_META.attribution}{" "}
            <a href={CALENDAR_META.sourceUrl} rel="license external">Data source</a>
          </p>
        )}
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Brand/Description Column */}
        <div className="footer-brand-col">
          <div className="brand-dark">
            <img
              src="/logo-horizontal-dark-viikkonro-20260916.svg"
              alt="Viikkonro"
              width="592"
              height="122"
              translate="no"
            />
          </div>
          <p className="footer-desc">
            Selkeä ja tarkka työkalu ISO 8601 -viikkonumeroihin ja vuosien
            kalenteriaikatauluihin. Laskelmat perustuvat aina ISO 8601
            -standardiin.
          </p>
          <SocialLinks className="footer-social" />
        </div>

        {/* Navigation Links Column */}
        <div className="footer-links-col">
          <h3>Palvelu</h3>
          <ul>
            <li>
              <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                Etusivu{" "}
              </Link>
            </li>
            <li>
              <Link to="/kuinka-monta-viikkoa-vuodessa" onClick={() => window.scrollTo(0, 0)}>
                Viikkoja vuodessa
              </Link>
            </li>
            <li>
              <Link
                to="/mika-on-viikkonumero"
                onClick={() => window.scrollTo(0, 0)}
              >
                Mikä on viikkonumero?
              </Link>
            </li>
            <li>
              <Link to="/avoin-data" onClick={() => window.scrollTo(0, 0)}>
                Avoin data
              </Link>
            </li>
            <li>
              <Link to="/ajanhallinta" onClick={() => window.scrollTo(0, 0)}>
                Ajanhallinta
              </Link>
            </li>
            <li>
              <Link to="/chrome-extension" onClick={() => window.scrollTo(0, 0)}>
                Chrome-laajennus
              </Link>
            </li>
            <li>
              <Link to="/android-sovellus" onClick={() => window.scrollTo(0, 0)}>
                Android-sovellus
              </Link>
            </li>
            <li>
              <Link to="/en" lang="en" onClick={() => window.scrollTo(0, 0)}>
                English
              </Link>
            </li>
            <li>
              <Link to="/menetelma" onClick={() => window.scrollTo(0, 0)}>
                Menetelmä
              </Link>
            </li>
            <li>
              <Link to="/tietolahteet" onClick={() => window.scrollTo(0, 0)}>
                Tietolähteet
              </Link>
            </li>
          </ul>
        </div>

        {/* Core Documents Column */}
        <div className="footer-links-col">
          <h3>Yritys</h3>
          <ul>
            <li>
              <Link to="/tietoa-meista" onClick={() => window.scrollTo(0, 0)}>
                Tietoa meistä
              </Link>
            </li>
            <li>
              <Link to="/toimitusperiaatteet" onClick={() => window.scrollTo(0, 0)}>
                Toimitusperiaatteet
              </Link>
            </li>
            <li>
              <Link to="/ota-yhteytta" onClick={() => window.scrollTo(0, 0)}>
                Yhteystiedot
              </Link>
            </li>
            <li>
              <Link
                to="/kayttoehdot"
                onClick={() => window.scrollTo(0, 0)}
              >
                Käyttöehdot
              </Link>
            </li>
            <li>
              <Link to="/tietosuoja" onClick={() => window.scrollTo(0, 0)}>
                Tietosuojaseloste
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Horizontal Baseline Rule */}
      <hr className="footer-divider" />

      {/* Baseline Copyright and Info Row */}
      <div className="footer-baseline">
        <p>&copy; {currentYear} Viikko Nro. Kaikki oikeudet pidätetään.</p>
        <p className="footer-tz">Kansainvälisen ISO 8601 -standardin mukaan</p>
      </div>
      {CALENDAR_META.attributionRequired && (
        <p className="footer-data-attribution">
          {CALENDAR_META.attribution}{" "}
          <a href={CALENDAR_META.sourceUrl} rel="license external">
            Aineiston lähde
          </a>
        </p>
      )}
    </footer>
  );
}

export default Footer;
