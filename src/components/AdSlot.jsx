import { useEffect, useRef, useState } from "react";
import adCss from "./adSlot.css?raw";

const layoutPreviewEnabled =
  import.meta.env.VITE_AD_LAYOUT_PREVIEW === "true";

// Publisher and the single responsive display unit. See
// docs/adsense-placement-plan.md before changing either, or before adding a
// second unit: the slot IDs live in the AdSense account.
const AD_CLIENT = "ca-pub-5553975522423673";
const AD_SLOT = "8867840228";

// AdSense placement. The loader ships from index.html; this mounts the unit.
//
// The unit is responsive, so it serves every viewport and the markup carries
// no width or height: AdSense sizes the creative to the container, and
// data-full-width-responsive lets it use the whole viewport width on phones.
//
// It still mounts after the first client render, for two reasons:
//   1. The <ins> must never reach prerendered HTML. PD-19 asserts that, and ad
//      markup in a static file would be requested on behalf of a viewport that
//      has not been measured yet.
//   2. Rendering it during SSR would put ad markup in the hydration tree,
//      which the loader rewrites in place.
const AdSlot = ({ placement, format = "banner" }) => {
  const [mounted, setMounted] = useState(false);
  const insRef = useRef(null);

  useEffect(() => {
    if (layoutPreviewEnabled) return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !insRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // A blocked, failed or ad-blocked loader must never break the page.
    }
  }, [mounted]);

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

  if (!mounted) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: adCss }} />
      <aside
        className={`ad-unit ad-unit--${format} noprint`}
        data-ad-placement={placement}
      >
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    </>
  );
};

export default AdSlot;
