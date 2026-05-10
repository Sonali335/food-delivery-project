/** Loads Google Identity Services client script once (shared by Login / Signup). */
export function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const done = () => {
        if (window.google?.accounts?.id) resolve();
        else reject(new Error("Google Sign-In unavailable"));
      };
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Sign-In")),
        { once: true }
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new Error("Google Sign-In unavailable"));
    };
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.body.appendChild(script);
  });
}
