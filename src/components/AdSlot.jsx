import { useEffect, useRef, useState } from "react";
import adCss from "./adSlot.css?raw";

const layoutPreviewEnabled =
  import.meta.env.VITE_AD_LAYOUT_PREVIEW === "true";

// Publisher and the single fixed 728x90 display unit. See
// docs/adsense-placement-plan.md before changing either, or before adding a
// second unit: the slot IDs live in the AdSense account.
const AD_CLIENT = "ca-pub-5553975522423673";
const AD_SLOT = "8867840228";
// The unit is a fixed leaderboard, so it only runs where 728px fits. Below
// this it is not rendered at all, rather than rendered and hidden: AdSense
// counts an impression for a hidden unit, which is a policy problem.
const MIN_WIDTH = 768;

// AdSense placement. The loader ships from index.html; this mounts the unit.
//
// Two constraints shape the implementation:
//   1. The <ins> must never reach prerendered HTML. PD-19 asserts that, and ad
//      markup in a static file would be requested on behalf of a viewport that
//      has not been measured yet.
//   2. Deciding on window width during render would break the SSR/hydration
//      contract this codebase keeps elsewhere (see useToday).
// Both are satisfied by mounting after the first client render: the server and
// the hydrating client both render nothing, then the unit appears.
// `format` only shapes the layout-preview box. Every placement shares the one
// fixed unit above, so the rectangle slot renders a leaderboard too until a
// second unit exists in the AdSense account.
const AdSlot = ({ placement, format = "banner" }) => {
  const [eligible, setEligible] = useState(false);
  const insRef = useRef(null);

  useEffect(() => {
    if (layoutPreviewEnabled) return;
    // Measured once. It deliberately does not follow resizes: re-rendering the
    // <ins> would need a second push for the new element, and pushing twice
    // for one placement is what produces blank units.
    if (window.innerWidth >= MIN_WIDTH) setEligible(true);
  }, []);

  useEffect(() => {
    if (!eligible || !insRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // A blocked, failed or ad-blocked loader must never break the page.
    }
  }, [eligible]);

  if (layoutPreviewEnabled) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: adCss }} />
        <aside
          className={`ad-slot ad-slot--${format} noprint`}
          aria-label="Suunniteltu mainospaikka"
          data-ad-placement={placement}
        >
          <span className="ad-slot__label">Mainospaikan esikatselu</span>
          <span className="ad-slot__name">{placement}</span>
          <div className="ad-slot__mount" aria-hidden="true" />
        </aside>
      </>
    );
  }

  if (!eligible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: adCss }} />
      <aside className="ad-unit noprint" data-ad-placement={placement}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "inline-block", width: 728, height: 90, maxWidth: "100%" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOT}
        />
      </aside>
    </>
  );
};

export default AdSlot;
