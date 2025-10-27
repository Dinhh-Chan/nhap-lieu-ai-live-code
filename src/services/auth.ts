import { Api } from "./api";

export interface LoginRequest {
  platform: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    accessExpireAt: number;
    refreshExpireAt: number;
  };
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  platform: string;
  systemRole: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await Api.post<LoginResponse>("/auth/login", credentials);
    return response;
  },

  // Có thể thêm các method khác như refresh token, logout, etc.
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await Api.post<LoginResponse>("/auth/refresh", { refreshToken });
    return response;
  },
};
