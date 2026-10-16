import { useToday } from "./useToday";
import { useState } from "react";
import { Link } from "react-router-dom";
import { isoWeek, isoYear, navigationYearTargets } from "./dateUtils";

const Navbar = ({ reloadDocument = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Computed directly in the render body, not an effect: an effect never
  // runs during SSR/prerendering, so the badge would show blank ("Vk ") on
  // every prerendered page (Navbar is rendered on all of them) until the
  // client hydrates.
  const NOW = useToday();
  const weekYear = isoYear(NOW);
  const weekNow = isoWeek(NOW);
  const { currentYear, promotedYear } = navigationYearTargets(NOW);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <header className="nav">
      <div className="wrap row">
        {/* Brand Text Block */}
        <Link reloadDocument={reloadDocument}
          className="brand"
          to="/"
          onClick={closeMenu}
          aria-label="Viikkonro-etusivu"
          translate="no"
        >
          {/* <span className="dot"></span>Week Now */}
          <img
            src="/logo-horizontal-viikkonro-20260916.webp"
            alt=""
            width="592"
            height="122"
            aria-hidden="true"
            translate="no"
          />
        </Link>

        {/* Hamburger Menu Toggle Button */}
        <button
          className={`menu-toggle ${isOpen ? "is-open" : ""}`}
          onClick={toggleMenu}
          aria-label="Avaa navigointivalikko"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {/* Navigation Links Grid Block */}
        <nav
          className={`nav-links ${isOpen ? "mobile-open" : ""}`}
        >
          <>
              <Link reloadDocument={reloadDocument} id="navYear" to={`/vuosi-${currentYear}`} onClick={closeMenu}>
                Viikot {currentYear}
              </Link>
              <Link reloadDocument={reloadDocument} id="navPrint" to={`/tulosta-${promotedYear}`} onClick={closeMenu}>
                Viikkolista {promotedYear}
              </Link>
              <Link reloadDocument={reloadDocument} id="navCalendar" to={`/kalenteri-${promotedYear}`} onClick={closeMenu}>
                Kalenteri {promotedYear}
              </Link>
              <Link reloadDocument={reloadDocument} to="/laskurit" onClick={closeMenu}>Laskurit</Link>
              <Link reloadDocument={reloadDocument} to="/mika-on-viikkonumero" onClick={closeMenu}>Tietoa viikoista</Link>
          </>
        </nav>

        {/* Badge Indicator Block */}
        <Link reloadDocument={reloadDocument}
          className="badge"
          id="navBadge"
          to={`/vuosi-${weekYear}`}
          onClick={closeMenu}
        >
          Vk {weekNow}
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
