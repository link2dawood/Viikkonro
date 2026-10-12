// Public files are only for free templates. A future paid-download adapter must
// verify payment on a trusted service and return a short-lived private URL.
// Existing company-calendar payment/licence objects do not grant template access.
import { TEMPLATE_FORMATS } from "./catalog.js";

/**
 * @typedef {object} TemplateDownloadProvider
 * @property {string} id
 * @property {(request: {template: object, year: number, format: string}) => Promise<{status: "granted", url: string}|{status: "unavailable", reason: string}>} resolveDownload
 */
export const staticTemplateProvider = Object.freeze({
  id: "static-free-templates",
  async resolveDownload({ template, year, format }) {
    const asset = template.downloadableAssets.find((item) => item.year === year && item.format === format);
    if (!asset || !Object.hasOwn(TEMPLATE_FORMATS, format)) return { status: "unavailable", reason: "Tätä tiedostoa ei ole saatavilla." };
    if (template.price.amount !== 0) return { status: "unavailable", reason: "Maksullisen pohjan lataus ei ole vielä käytössä." };
    return { status: "granted", url: asset.path };
  },
});
