import { http } from "./http";
import type {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

export const authApi = {
  register: async (payload: RegisterRequest) => {
    const response = await http.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },

  login: async (payload: LoginRequest) => {
    const response = await http.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  me: async () => {
    const response = await http.get<CurrentUser>("/auth/me");
    return response.data;
  },
};