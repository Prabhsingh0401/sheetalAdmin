import { API_BASE_URL } from "./api";

export const getDashboardStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
};

export const updatePassword = async (newPassword) => {
  const res = await fetch(`${API_BASE_URL}/admin/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newPassword }),
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to update password");
  }
  return res.json();
};
