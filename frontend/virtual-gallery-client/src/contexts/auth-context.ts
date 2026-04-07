import { createContext } from "react";
import type { CurrentUser, LoginRequest, RegisterRequest } from "../types/auth";

export interface AuthContextValue {
  user: CurrentUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const TOKEN_KEY = "vg_token";