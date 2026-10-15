import adCss from "./adSlot.css?raw";
const layoutPreviewEnabled =
  import.meta.env.VITE_AD_LAYOUT_PREVIEW === "true";

// Layout-only AdSense reservation. The loader script ships from index.html,
// but no ad unit exists in source: units and Auto ads are AdSense account
// settings. Nothing is rendered in production unless the explicit preview flag
// is enabled, so pages never contain an empty ad box. See
// docs/adsense-placement-plan.md before filling the mount element.
const AdSlot = ({ placement, format = "banner" }) => {
  if (!layoutPreviewEnabled) return null;

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
};

export default AdSlot;
