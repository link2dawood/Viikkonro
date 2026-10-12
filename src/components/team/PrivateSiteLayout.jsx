import Navbar from "../Navbar";
import Footer from "../Footer";

// Share site navigation without mounting public analytics, ads or growth prompts.
// Public links must leave this isolated entry point through a document request.
export default function PrivateSiteLayout({ children }) {
  return (
    <>
      <Navbar reloadDocument />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer reloadDocument showConsentSettings={false} />
    </>
  );
}
