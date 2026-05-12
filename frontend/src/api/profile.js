import { getApiBase } from "./config";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getProfile = async () => {
  const response = await fetch(`${getApiBase()}/profile`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 404) {
    return { profile: null };
  }
  if (!response.ok) {
    throw new Error(result.message || "Could not load profile");
  }
  return result;
};

const completeCustomerProfile = async (data) => {
  const response = await fetch(`${getApiBase()}/profile/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not save profile");
  }
  return result;
};

const completeDriverProfile = async (data) => {
  const response = await fetch(`${getApiBase()}/profile/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not save profile");
  }
  return result;
};

const completeRestaurantProfile = async (data) => {
  const response = await fetch(`${getApiBase()}/profile/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not save profile");
  }
  return result;
};

const deleteProfile = async () => {
  const response = await fetch(`${getApiBase()}/profile`, {
    method: "DELETE",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not delete profile");
  }
  return result;
};

const updatePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const response = await fetch(`${getApiBase()}/profile/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not update password");
  }
  return result;
};

/** If new/confirm are empty, skips. Otherwise validates and calls the API. */
const tryPasswordUpdateIfFilled = async ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const np = String(newPassword ?? "").trim();
  const cf = String(confirmPassword ?? "").trim();
  const cur = String(currentPassword ?? "").trim();
  if (!np && !cf) return;
  if (!np || !cf) {
    throw new Error("Enter both new password and confirm password.");
  }
  if (np !== cf) {
    throw new Error("New password and confirmation do not match.");
  }
  if (np.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }
  await updatePassword({
    currentPassword: cur,
    newPassword: np,
    confirmPassword: cf,
  });
};

export {
  getProfile,
  completeCustomerProfile,
  completeDriverProfile,
  completeRestaurantProfile,
  deleteProfile,
  updatePassword,
  tryPasswordUpdateIfFilled,
};
