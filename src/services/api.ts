import axios, { AxiosError, AxiosInstance } from "axios";
import { getEnv } from "@/lib/utils";

const BASE_URL = getEnv("VITE_API_BASE_URL", "https://live-code-be-2.ript.vn/");

export const createApiClient = (getToken?: () => string | null): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    withCredentials: false,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Chuẩn hóa lỗi
      const status = error.response?.status;
      const message = (error.response?.data as any)?.message || error.message;
      return Promise.reject({ status, message, error });
    }
  );

  return instance;
};

// Client mặc định không cần auth
const api = createApiClient();
export default api;

// Client có auth - cần import useAuth từ component
export const createAuthenticatedApiClient = () => {
  // Lấy token từ localStorage trực tiếp vì không thể sử dụng hook ở đây
  const getToken = () => localStorage.getItem("accessToken");
  return createApiClient(getToken);
};

export type ApiError = { status?: number; message: string; error?: unknown };

export const Api = {
  get: async <T = unknown>(url: string, params?: Record<string, any>) => {
    const res = await api.get<T>(url, { params });
    return res.data;
  },
  post: async <T = unknown>(url: string, body?: unknown) => {
    const res = await api.post<T>(url, body);
    return res.data;
  },
  put: async <T = unknown>(url: string, body?: unknown) => {
    const res = await api.put<T>(url, body);
    return res.data;
  },
  delete: async <T = unknown>(url: string) => {
    const res = await api.delete<T>(url);
    return res.data;
  },
};


