import { getApiBase } from "./config";

const signup = async ({ email, password, role }) => {
  const response = await fetch(`${getApiBase()}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }
  return data;
};

const verifyOtp = async ({ email, otp }) => {
  const response = await fetch(`${getApiBase()}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Verification failed");
  }
  return data;
};

const login = async ({ email, password }) => {
  const response = await fetch(`${getApiBase()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }
  return data;
};

const googleLogin = async ({ idToken }) => {
  const response = await fetch(`${getApiBase()}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Google login failed");
  }
  return data;
};

const requestPasswordReset = async ({ email }) => {
  const response = await fetch(`${getApiBase()}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

const resetPasswordWithOtp = async ({ email, otp, newPassword }) => {
  const response = await fetch(`${getApiBase()}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Reset failed");
  }
  return data;
};

export { signup, verifyOtp, login, googleLogin, requestPasswordReset, resetPasswordWithOtp };
