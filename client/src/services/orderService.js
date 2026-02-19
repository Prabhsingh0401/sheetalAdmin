import { API_BASE_URL } from "./api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const getAllOrders = async (page = 1, limit = 10, status = "") => {
  let url = `${API_BASE_URL}/orders/admin/all?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(res);
};

export const updateOrderStatus = async (orderId, updateData) => {
  const res = await fetch(`${API_BASE_URL}/orders/admin/update/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(updateData), // status, trackingId, courierPartner
  });

  return handleResponse(res);
};

export const getOrderStats = async () => {
  const res = await fetch(`${API_BASE_URL}/orders/admin/all?limit=1000`, {
    method: "GET",
    credentials: "include",
  });

  const result = await handleResponse(res);

  if (result.success) {
    const orders = result.data.orders;
    const stats = {
      totalOrders: result.data.totalOrders,
      processing: orders.filter((o) => o.orderStatus === "Processing").length,
      shipped: orders.filter((o) => o.orderStatus === "Shipped").length,
      delivered: orders.filter((o) => o.orderStatus === "Delivered").length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
    };
    return { success: true, data: stats };
  }
  return result;
};

export const createOrder = async (orderData) => {
  const res = await fetch(`${API_BASE_URL}/orders/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(orderData),
  });

  return handleResponse(res);
};

/**
 * Triggers AWB assignment for an order that has already been pushed to Shiprocket.
 * @param {string} orderId - Our MongoDB order _id
 * @param {number|null} courierId - Optional Shiprocket courier company ID (null = auto)
 */
export const assignAwb = async (orderId, courierId = null) => {
  const res = await fetch(`${API_BASE_URL}/orders/admin/assign-awb/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(courierId ? { courierId } : {}),
  });
  return handleResponse(res);
};

export const getMyOrders = async (page = 1) => {
  const res = await fetch(`${API_BASE_URL}/orders/my-orders?page=${page}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse(res);
};
