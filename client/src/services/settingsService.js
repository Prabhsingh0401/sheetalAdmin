import axios from "axios";
import { API_BASE_URL } from "./api";

// Get global settings
export const getSettings = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
    });
    return response.data;
};

// Update global settings
export const updateSettings = async (data) => {
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_BASE_URL}/settings`, data, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
    });
    return response.data;
};

// Explicitly save Navbar Layout to avoid partial update ambiguity and improved readability
export const saveNavbarLayout = async (layout) => {
    return await updateSettings({ navbarLayout: layout });
};
