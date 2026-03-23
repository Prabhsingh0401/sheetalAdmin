import axios from "axios";
import { API_BASE_URL } from "./api";

export const getBasicInfo = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE_URL}/basic-info`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
  return response.data;
};

export const updateBasicInfo = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_BASE_URL}/basic-info`, data, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
  return response.data;
};
