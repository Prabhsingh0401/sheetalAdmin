import { API_BASE_URL } from "./api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const getBestSellingItems = async () => {
  const res = await fetch(`${API_BASE_URL}/sales/best-selling`, {
    credentials: "include",
  });
  return handleResponse(res);
};

/**
 * Fetch combined sales + revenue chart data.
 */
export const getChartData = async ({ period, startDate, endDate } = {}) => {
  const query = new URLSearchParams();
  if (period) query.set("period", period);
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  const res = await fetch(`${API_BASE_URL}/sales/get-chart?${query}`, {
    credentials: "include",
  });
  return handleResponse(res);
};

/**
 * Fetch revenue-only data (breakdown: itemsRevenue, tax, shipping).
 */
export const getRevenueData = async ({ period, startDate, endDate } = {}) => {
  const query = new URLSearchParams();
  if (period) query.set("period", period);
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  const res = await fetch(`${API_BASE_URL}/sales/get-revenue?${query}`, {
    credentials: "include",
  });
  return handleResponse(res);
};

/**
 * Fetch sales-only data (order counts, units sold).
 */
export const getSalesData = async ({ period, startDate, endDate } = {}) => {
  const query = new URLSearchParams();
  if (period) query.set("period", period);
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  const res = await fetch(`${API_BASE_URL}/sales/get-sales?${query}`, {
    credentials: "include",
  });
  return handleResponse(res);
};