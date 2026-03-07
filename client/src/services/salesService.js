import { API_BASE_URL } from "./api";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export const getBestSellingItems = async ()=>{
    const res = await fetch(`${API_BASE_URL}/sales/best-selling`)
    return handleResponse(res)
}