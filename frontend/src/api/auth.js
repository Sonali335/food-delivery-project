const signup = async ({ email, password, role }) => {
  const response = await fetch("http://localhost:5000/api/auth/signup", {
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

const verifyEmail = async (token) => {
  const response = await fetch(`http://localhost:5000/api/auth/verify/${token}`, {
    method: "GET",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Verification failed");
  }
  return data;
};

const login = async ({ email, password }) => {
  const response = await fetch("http://localhost:5000/api/auth/login", {
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

export { signup, verifyEmail, login };
