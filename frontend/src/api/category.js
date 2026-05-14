const API = "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getCategories = async () => {
  const response = await fetch(`${API}/category/`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not load categories");
  }
  return result;
};

export const createCategory = async (data) => {
  const response = await fetch(`${API}/category/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not create category");
  }
  return result;
};

export const deleteCategory = async (id) => {
  const response = await fetch(`${API}/category/${id}`, {
    method: "DELETE",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not delete category");
  }
  return result;
};
