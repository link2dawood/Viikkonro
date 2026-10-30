// Register Service Worker for offline ISO week number functionality
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    const register = () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope);
        })
        .catch((error) => {
          console.error("ServiceWorker registration failed: ", error);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }
  }
}

// Auto-register when loaded in the browser
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if (document.readyState === "complete") {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("ServiceWorker registration successful with scope: ", registration.scope);
      })
      .catch((error) => {
        console.error("ServiceWorker registration failed: ", error);
      });
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope);
        })
        .catch((error) => {
          console.error("ServiceWorker registration failed: ", error);
        });
    });
  }
}

export default registerServiceWorker;
