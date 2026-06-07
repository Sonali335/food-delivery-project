import { loadGsiScript } from "./loadGsiScript";

const credentialRef = { current: null };

function resolveButtonWidth(host, explicitWidth) {
  if (explicitWidth) {
    return Math.min(400, Math.max(200, Math.floor(explicitWidth)));
  }
  const measured = Math.floor(host.getBoundingClientRect().width);
  if (measured >= 200) {
    return Math.min(400, measured);
  }
  return 320;
}

function waitForLayout() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

/**
 * Loads GSI, cancels any prior prompt, re-initializes (required after cancel()),
 * then renders the official Google button into `host`.
 */
export async function mountGoogleSignInButton(host, clientId, renderButtonOptions = {}) {
  if (!host || !clientId) return false;

  await loadGsiScript();
  if (!window.google?.accounts?.id) return false;

  await waitForLayout();

  window.google.accounts.id.cancel();
  host.innerHTML = "";

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => credentialRef.current?.(response),
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  const { width: explicitWidth, ...buttonOptions } = renderButtonOptions;
  const width = resolveButtonWidth(host, explicitWidth);

  window.google.accounts.id.renderButton(host, {
    theme: "outline",
    size: "large",
    shape: "rectangular",
    ...buttonOptions,
    width,
  });

  return host.childElementCount > 0;
}

export function setGoogleCredentialHandler(handler) {
  credentialRef.current = handler;
}

export function unmountGoogleSignInButton(host) {
  try {
    window.google?.accounts?.id?.cancel();
  } catch {
    /* ignore */
  }
  if (host) host.innerHTML = "";
}
