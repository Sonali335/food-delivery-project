import { getApiBase } from "./config";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getCategories = async () => {
  const response = await fetch(`${getApiBase()}/category/`, {
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
  const response = await fetch(`${getApiBase()}/category/`, {
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
  const response = await fetch(`${getApiBase()}/category/${id}`, {
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
