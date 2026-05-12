import { loadGsiScript } from "./loadGsiScript";

const credentialRef = { current: null };

/**
 * Loads GSI, cancels any prior prompt, re-initializes (required after cancel()),
 * then renders the official Google button into `host`.
 */
export async function mountGoogleSignInButton(host, clientId, renderButtonOptions) {
  if (!host || !clientId) return;

  await loadGsiScript();
  if (!window.google?.accounts?.id) return;

  window.google.accounts.id.cancel();
  host.innerHTML = "";

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => credentialRef.current?.(response),
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  window.google.accounts.id.renderButton(host, renderButtonOptions);
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
