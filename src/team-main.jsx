import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import PrivateSiteLayout from "./components/team/PrivateSiteLayout";
import TeamLeaveApp from "./components/team/TeamLeaveApp";
// Separate entry: no public-site analytics, ads, WebMCP or service-worker registration.
if (window.location.search || window.location.hash) window.history.replaceState(null, "", window.location.pathname);
createRoot(document.getElementById("team-root")).render(
  <BrowserRouter>
    <PrivateSiteLayout><TeamLeaveApp /></PrivateSiteLayout>
  </BrowserRouter>,
);
