// Logo preparation for rendering. PNG and JPEG data URIs go straight into a
// PDF. An SVG cannot be embedded by the PDF library, so it is drawn to a canvas
// and turned into a PNG first, in the browser, where the logo never leaves the
// visitor's device.

export const LOGO_RASTER_MAX = 1000;

/** Browser only: SVG data URI to a PNG data URI no wider or taller than `max` px. */
export function rasterizeSvgToPng(dataUri, { max = LOGO_RASTER_MAX } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("SVG rasterising needs a browser."));
      return;
    }
    const image = new Image();
    image.onload = () => {
      const w = image.naturalWidth || 300;
      const h = image.naturalHeight || 150;
      const scale = Math.min(max / w, max / h, 4);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("The SVG logo could not be drawn."));
    image.src = dataUri;
  });
}

/**
 * @param {{mime: string, dataUri: string}|null} logo
 * @param {(dataUri: string) => Promise<string>} [rasterize]  how to turn an SVG into a PNG
 * @returns {Promise<{src: string|null, warning: string|null}>}
 */
export async function prepareLogoForPdf(logo, rasterize) {
  if (!logo) return { src: null, warning: null };
  if (logo.mime !== "image/svg+xml") return { src: logo.dataUri, warning: null };
  if (!rasterize) return { src: null, warning: "SVG-logoa ei voitu muuntaa PDF-muotoon." };
  try {
    return { src: await rasterize(logo.dataUri), warning: null };
  } catch {
    return { src: null, warning: "SVG-logoa ei voitu muuntaa PDF-muotoon." };
  }
}
