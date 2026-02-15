import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  email: string;
  username: string;
}

export interface TokenVerifyResponse {
  valid: boolean;
  email?: string;
  username?: string;
}

export const authService = {
  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      username,
      password,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  async verifyToken(token: string): Promise<TokenVerifyResponse> {
    const formData = new FormData();
    formData.append("token", token);
    const response = await axios.post(`${API_BASE_URL}/auth/verify`, formData);
    return response.data;
  },

  getStoredToken(): string | null {
    return localStorage.getItem("access_token");
  },

  saveToken(token: string, email: string, username: string): void {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_email", email);
    localStorage.setItem("user_username", username);
  },

  clearToken(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_username");
  },

  getStoredUser() {
    return {
      email: localStorage.getItem("user_email"),
      username: localStorage.getItem("user_username"),
    };
  },
};
