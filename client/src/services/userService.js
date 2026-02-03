import { API_BASE_URL } from "./api";

export const getUserById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/users/admin/${id}`, {
    method: "GET",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch user details");
  return data;
};

export const getUsers = async (page = 1, limit = 10, search = "") => {
  const res = await fetch(
    `${API_BASE_URL}/users/admin/all?page=${page}&limit=${limit}&search=${search}`,
    {
      credentials: "include",
    },
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch users");
  }
  const data = await res.json();
  return data;
};

export const addUser = async (userData) => {
  const res = await fetch(`${API_BASE_URL}/users/admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add user");
  return data;
};

export const updateUser = async (id, userData) => {
  const res = await fetch(`${API_BASE_URL}/users/admin/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update user");
  return data;
};

export const deleteUser = async (id) => {
  const res = await fetch(`${API_BASE_URL}/users/admin/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to delete user");
  }
  return true;
};

export const getUserStats = async () => {
  const res = await fetch(`${API_BASE_URL}/users/admin/stats`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to fetch user stats");
  }
  return res.json();
};
