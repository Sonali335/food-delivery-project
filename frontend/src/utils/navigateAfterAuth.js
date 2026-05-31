import { getProfile } from "../api/profile";
import { getHomePathForRole } from "./roleHome";
import { getSetupPathForRole, isProfileComplete } from "./profileComplete";

/**
 * After login or signup verification: profile setup first, then role home.
 */
export async function navigateAfterAuth(navigate, role, { replace = true } = {}) {
  const setupPath = getSetupPathForRole(role);

  try {
    const { profile } = await getProfile();
    if (!isProfileComplete(profile, role)) {
      navigate(setupPath, { replace, state: { onboarding: true } });
      return;
    }
  } catch {
    navigate(setupPath, { replace, state: { onboarding: true } });
    return;
  }

  navigate(getHomePathForRole(role), { replace });
}
