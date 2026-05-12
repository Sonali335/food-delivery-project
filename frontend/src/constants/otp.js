/** Must match backend OTP_EXPIRY_MINUTES (10) — used when API did not pass otpExpiresAt. */
export const OTP_VALIDITY_MS = 10 * 60 * 1000;

export function resolveOtpExpiresAt(isoFromServer) {
  if (typeof isoFromServer === "string" && isoFromServer.trim()) {
    const t = Date.parse(isoFromServer);
    if (Number.isFinite(t)) return isoFromServer;
  }
  return new Date(Date.now() + OTP_VALIDITY_MS).toISOString();
}
