import axios from "axios";

const API_BASE_URL = "http://localhost:5215/api";

export const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("vg_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});