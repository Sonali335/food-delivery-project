const API = "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getStatus = async () => {
  const response = await fetch(`${API}/restaurant/status`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not load status");
  }
  return result;
};

export const updateStatus = async (status) => {
  const response = await fetch(`${API}/restaurant/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ status }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not update status");
  }
  return result;
};
