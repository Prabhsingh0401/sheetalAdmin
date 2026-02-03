import { API_BASE_URL } from "./api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const uploadHowToMeasureImage = async (formData) => {
  const res = await fetch(`${API_BASE_URL}/size-chart/how-to-measure`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res);
};

export const getSizeChart = async () => {
  const res = await fetch(`${API_BASE_URL}/size-chart`, {
    credentials: "include",
  });
  return handleResponse(res);
};

export const addSize = async (sizeData) => {
  const res = await fetch(`${API_BASE_URL}/size-chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(sizeData),
  });
  return handleResponse(res);
};

export const updateSize = async (id, sizeData) => {
  const res = await fetch(`${API_BASE_URL}/size-chart/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(sizeData),
  });
  return handleResponse(res);
};

export const deleteSize = async (id) => {
  const res = await fetch(`${API_BASE_URL}/size-chart/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
};
