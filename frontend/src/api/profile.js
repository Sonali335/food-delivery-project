const authHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getProfile = async () => {
  const response = await fetch("http://localhost:5000/api/profile", {
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
  const response = await fetch("http://localhost:5000/api/profile/complete", {
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
  const response = await fetch("http://localhost:5000/api/profile/complete", {
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
  const response = await fetch("http://localhost:5000/api/profile/complete", {
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
  const response = await fetch("http://localhost:5000/api/profile", {
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

export {
  getProfile,
  completeCustomerProfile,
  completeDriverProfile,
  completeRestaurantProfile,
  deleteProfile,
};
