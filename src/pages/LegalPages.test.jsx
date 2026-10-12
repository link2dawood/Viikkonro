import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import AboutUs from "./AboutUs.jsx";
import PrivacyPolicy from "./PrivacyPolicy.jsx";
import TermsAndConditions from "./TermsAndConditions.jsx";
import RefundPolicy from "./RefundPolicy.jsx";
import { LEGAL_PATHS, LEGAL_UPDATED, UNUSED_REFUND_TEXT, refundFaqs, LEGAL_OPERATOR } from "../data/legalPolicies.js";
import { canonicalFor, routeMeta, sitemapEntries } from "../data/seo.js";
import { sitemapLastmod } from "../data/sitemapMetadata.js";

function page(Component,path) {
  const context={};const html=renderToString(<HelmetProvider context={context}><StaticRouter location={path}><Component /></StaticRouter></HelmetProvider>);
  return {html};
}
describe("legal documents",()=>{
  it.each([[LEGAL_PATHS[0],AboutUs],[LEGAL_PATHS[1],PrivacyPolicy],[LEGAL_PATHS[2],TermsAndConditions],[LEGAL_PATHS[3],RefundPolicy]])("keeps contact and legal navigation for %s",(path,Component)=>{
    const {html}=page(Component,path);
    expect(html.match(/<h1>/g)).toHaveLength(1);expect(html).toContain("hi@viikkonro.fi");
    for(const target of LEGAL_PATHS) expect(html).toContain(`href="${target}"`);
    expect(canonicalFor(path)).toBe(`https://viikkonro.fi${path}`);expect(routeMeta[path].title).toBeTruthy();
    expect(sitemapEntries().some(entry=>entry.path===path)).toBe(true);
    expect(sitemapLastmod(path,"2026-10-12")).toBe(LEGAL_UPDATED);
  });
  it("sources all visible refund FAQ questions and answers from shared data",()=>{
    const {html}=page(RefundPolicy,"/palautusehdot");for(const faq of refundFaqs()) {expect(html).toContain(faq.q);expect(html).toContain(faq.a);}
    expect(html).toContain('id="peruuttaminen"');expect(html).toContain('data-clarity-mask="True"');
    expect(html).toContain("Pelkkä tiedoston lataaminen");expect(html).toContain("14 päivän");
    expect(html).not.toContain("Ei palautuksia");
  });
  it("distinguishes payments, local drafts, private organizations and consent",()=>{
    const {html}=page(PrivacyPolicy,"/tietosuoja");
    for(const phrase of ["Supabase Auth","Polar","Mailjet","Microsoft Clarity","Android","Web3Forms","Brevo","kansainväl","vapaaehtoinen suostumus"])expect(html).toContain(phrase);
    expect(html).toContain("Kalenterin sisältöä tai logoa ei tallenneta tähän rekisteriin");
  });
  it("limits voluntary refunds to unused purchases without excluding consumer or defect rights",()=>{
    const {html}=page(RefundPolicy,"/palautusehdot");
    expect(html).toContain(UNUSED_REFUND_TEXT);
    expect(html).toContain("Maksuttoman esikatselun käyttäminen tai luonnoksen muokkaaminen ei poista tätä palautusoikeutta");
    expect(html).toContain("ehto ei rajoita kuluttajan pakottavia oikeuksia");
    expect(html).toContain("Virheeseen perustuva hyvitys käsitellään erikseen käyttämättömyydestä riippumatta");
    expect(html).not.toContain("Takuu koskee myös jo ladattuja tiedostoja");
  });
  it("respects source-code licensing and mandatory buyer rights",()=>{
    const {html}=page(TermsAndConditions,"/kayttoehdot");expect(html).toContain("MIT");expect(html).toContain("Polar");expect(html).toContain("kertamaksu");
    expect(html).not.toContain("emme vastaa mistään");
  });
  it("shows confirmed operator contact methods without an invented registration or address",()=>{
    for(const [Component,path] of [[AboutUs,"/tietoa-meista"],[PrivacyPolicy,"/tietosuoja"],[TermsAndConditions,"/kayttoehdot"],[RefundPolicy,"/palautusehdot"]]) {
      const {html}=page(Component,path);
      expect(html).toContain("Dawood Zafar");expect(html).toContain(`href="${LEGAL_OPERATOR.website}"`);
      expect(html).toContain('href="https://wa.me/9230633301114"');
      expect(html).toContain("se ei ole rekisteröity yritys");
      expect(html).not.toContain("Rekisteritunnus:");expect(html).not.toMatch(/>\s*(null|undefined)\s*</);
    }
    expect(LEGAL_OPERATOR).not.toHaveProperty("address");expect(LEGAL_OPERATOR).not.toHaveProperty("country");
  });
});
