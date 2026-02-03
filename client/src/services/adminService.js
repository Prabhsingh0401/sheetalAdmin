import { API_BASE_URL } from "./api";

export const getDashboardStats = async () => {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
};
