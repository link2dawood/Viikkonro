import { MAX_LOGO_BYTES, validateBranding } from "../../platform/design/branding.js";
import { issueToFinnish } from "./formModel.js";

/** Browser upload adapter. Validation is shared with restored drafts and exports. */
export function readLogo(file, Reader = globalThis.FileReader) {
  return new Promise((resolve) => {
    if (!file) return resolve({ error: null, logo: null });
    if (!["image/png", "image/svg+xml"].includes(file.type)) {
      return resolve({ error: "Valitse PNG- tai SVG-tiedosto.", logo: null });
    }
    if (file.size > MAX_LOGO_BYTES) {
      return resolve({ error: "Logo on liian suuri. Enimmäiskoko on 512 kt.", logo: null });
    }
    const failed = () => resolve({ error: "Tiedoston lukeminen epäonnistui.", logo: null });
    try {
      const reader = new Reader();
      reader.onload = () => {
        const { branding, issues } = validateBranding({ logo: { dataUri: String(reader.result) } });
        resolve({ error: issues.length ? issueToFinnish(issues[0]) : null, logo: branding?.logo ?? null });
      };
      reader.onerror = failed;
      reader.onabort = failed;
      reader.readAsDataURL(file);
    } catch {
      failed();
    }
  });
}
