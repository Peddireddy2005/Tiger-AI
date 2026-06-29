import api from "../services/axios";

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser    = (data) => api.post("/auth/login", data);
export const getProfile   = ()     => api.get("/auth/me");
