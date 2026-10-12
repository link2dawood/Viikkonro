import { TEMPLATE_PATH, TEMPLATE_UPDATED, TEMPLATES, TEMPLATE_FORMATS, templateBySlug, templateCatalogMeta, templatePath } from "./catalog.js";

export function templateNodes(url, { siteUrl, pageNode }) {
  if (url === TEMPLATE_PATH) return [pageNode(url, "CollectionPage", {
    description: templateCatalogMeta.description, dateModified: TEMPLATE_UPDATED,
    mainEntity: { "@type": "ItemList", numberOfItems: TEMPLATES.length, itemListElement: TEMPLATES.map((template, index) => ({
      "@type": "ListItem", position: index + 1, name: template.finnishName, url: `${siteUrl}${templatePath(template)}`,
    })) },
    hasPart: TEMPLATES.map((template) => ({ "@id": `${siteUrl}${templatePath(template)}#webpage` })),
  })];
  const template = url.startsWith(`${TEMPLATE_PATH}/`) ? templateBySlug(url.slice(TEMPLATE_PATH.length + 1)) : null;
  if (!template) return [];
  const canonical = `${siteUrl}${templatePath(template)}`;
  const media = template.price.amount === 0 ? template.downloadableAssets.map((asset) => ({
    "@type": "MediaObject", "@id": `${siteUrl}${asset.path}`, contentUrl: `${siteUrl}${asset.path}`,
    name: `${template.finnishName} ${asset.year} (${asset.format.toUpperCase()})`, encodingFormat: TEMPLATE_FORMATS[asset.format].mime.split(";")[0],
    inLanguage: "fi-FI", isAccessibleForFree: true,
  })) : [];
  return [pageNode(url, "WebPage", {
    description: template.seo.description, dateModified: TEMPLATE_UPDATED,
    isPartOf: [{ "@id": `${siteUrl}/#website` }, { "@id": `${siteUrl}${TEMPLATE_PATH}#webpage` }],
    mainEntity: { "@id": `${canonical}#template` }, associatedMedia: media,
    potentialAction: media.map((asset) => ({ "@type": "DownloadAction", name: `Lataa ${asset.name}`, target: asset.contentUrl })),
  }), {
    "@type": "CreativeWork", "@id": `${canonical}#template`, name: template.finnishName,
    description: template.description, inLanguage: "fi-FI", keywords: template.tags.join(", "),
    isAccessibleForFree: template.price.amount === 0, encoding: media,
    publisher: { "@id": `${siteUrl}/#organization` }, mainEntityOfPage: { "@id": `${canonical}#webpage` },
  }];
}
