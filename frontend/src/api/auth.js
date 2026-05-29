import { apiFetch } from "./http";

const jsonPost = (path, body) =>
  apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const signup = ({ email, password, role }) =>
  jsonPost("/api/auth/signup", { email, password, role });

const verifyOtp = ({ email, otp }) => jsonPost("/api/auth/verify-otp", { email, otp });

const login = ({ email, password }) => jsonPost("/api/auth/login", { email, password });

const googleLogin = ({ idToken, role }) => {
  const body = { idToken };
  if (role) body.role = role;
  return jsonPost("/api/auth/google", body);
};

const requestPasswordReset = ({ email }) => jsonPost("/api/auth/forgot-password", { email });

const resetPasswordWithOtp = ({ email, otp, newPassword }) =>
  jsonPost("/api/auth/reset-password", { email, otp, newPassword });

export { signup, verifyOtp, login, googleLogin, requestPasswordReset, resetPasswordWithOtp };
