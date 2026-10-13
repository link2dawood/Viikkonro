import adCss from "./adSlot.css?raw";
const layoutPreviewEnabled =
  import.meta.env.VITE_AD_LAYOUT_PREVIEW === "true";

// Layout-only AdSense reservation. Nothing is rendered in production unless
// the explicit preview flag is enabled, so pre-approval pages never contain
// empty ad boxes. The real post-approval component will replace the mount
// element only after the certified CMP has granted the required consent.
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
