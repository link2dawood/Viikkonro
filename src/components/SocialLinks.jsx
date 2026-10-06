import React from "react";

// Single source of truth for the brand's social profiles — used by the footer,
// the About page and the Contact page. Keep this list in sync with the
// Organization `sameAs` array in index.html.
export const SOCIAL_PROFILES = [
  { name: "LinkedIn", url: "https://www.linkedin.com/company/viikkonro" },
  { name: "Instagram", url: "https://www.instagram.com/viikkonro/" },
  { name: "Pinterest", url: "https://fi.pinterest.com/viikkonroo/" },
  { name: "Bluesky", url: "https://bsky.app/profile/viikkonro.bsky.social" },
];

// rel="me" is an identity signal (this site vouches these profiles are "me");
// noopener hardens the target="_blank" links.
const SocialLinks = ({ className = "social-links", label = "Seuraa meitä" }) => (
  <ul className={className} aria-label={label}>
    {SOCIAL_PROFILES.map((p) => (
      <li key={p.name}>
        <a href={p.url} target="_blank" rel="me noopener">
          {p.name}
        </a>
      </li>
    ))}
  </ul>
);

export default SocialLinks;
