import { ANDROID_APP_FACTS, ANDROID_APP_RELEASED } from "../data/androidAppContent";

// Google Play badge. Until the app is published it is a disabled, non-link
// tile labelled "Tulossa pian", so nobody lands on a missing store page.
const PlayStoreButton = ({ lazy = false }) => {
  const img = (
    <img
      src="/mobile/android/google-play-logo.png"
      alt={ANDROID_APP_RELEASED ? "Google Play" : ""}
      width="388"
      height="432"
      loading={lazy ? "lazy" : undefined}
    />
  );

  if (ANDROID_APP_RELEASED) {
    return (
      <a
        className="android-store-link"
        href={ANDROID_APP_FACTS.storeUrl}
        target="_blank"
        rel="noopener noreferrer external"
        aria-label="Saatavilla Google Playsta, avautuu uuteen välilehteen"
      >
        {img}
      </a>
    );
  }

  return (
    <span
      className="android-store-link is-disabled"
      role="button"
      aria-disabled="true"
      aria-label="Google Play: sovellus tulossa pian, lataus ei ole vielä käytettävissä"
    >
      {img}
      <span className="android-store-soon">Tulossa pian</span>
    </span>
  );
};

export default PlayStoreButton;
