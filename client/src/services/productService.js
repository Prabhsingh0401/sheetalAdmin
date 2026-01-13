import { API_BASE_URL } from "./api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const getProducts = async (page = 1, limit = 10, search = "") => {
  const res = await fetch(
    `${API_BASE_URL}/products/all?page=${page}&limit=${limit}&search=${search}`,
    { credentials: "include" }
  );
  return handleResponse(res);
};

export const createProduct = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/products/admin/new`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res);
};

export const updateProduct = async (id, formData) => {
  const res = await fetch(`${API_BASE_URL}/products/admin/${id}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res);
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${API_BASE_URL}/products/admin/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
};

export const getProductStats = async () => {
  const res = await fetch(`${API_BASE_URL}/products/admin/stats`, {
    credentials: "include",
  });
  return handleResponse(res);
};

export const bulkImportProducts = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/products/admin/import`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res);
};

export const getProductDetails = async (id) => {
  const res = await fetch(`${API_BASE_URL}/products/detail/${id}`, {
    credentials: "include",
  });
  return handleResponse(res);
};