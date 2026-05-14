const API = "http://localhost:5000/api";

const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getMenuItems = async () => {
  const response = await fetch(`${API}/menu/`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not load menu items");
  }
  return result;
};

export const getMenuItem = async (id) => {
  const response = await fetch(`${API}/menu/${id}`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not load menu item");
  }
  return result;
};

export const createMenuItem = async (data) => {
  const response = await fetch(`${API}/menu/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not create menu item");
  }
  return result;
};

export const updateMenuItem = async (id, data) => {
  const response = await fetch(`${API}/menu/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not update menu item");
  }
  return result;
};

export const deleteMenuItem = async (id) => {
  const response = await fetch(`${API}/menu/${id}`, {
    method: "DELETE",
    headers: {
      ...authHeader(),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not delete menu item");
  }
  return result;
};

export const uploadMenuImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API}/menu/upload-image`, {
    method: "POST",
    headers: {
      ...authHeader(),
    },
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || "Could not upload image");
  }
  return result;
};
