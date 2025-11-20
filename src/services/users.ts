import { Api, createAuthenticatedApiClient } from "@/services/api";
import type { User, CreateUserDto, UpdateUserDto, UserListResponse, UserListParams } from "@/types/user";
import type { UserStatisticsResponse } from "@/types/user-statistics";
import type { SystemStatisticsResponse } from "@/types/system-statistics";
import type { UserOverviewResponse } from "@/types/user-overview";

const basePath = "/user";

// Tạo authenticated client cho users API
const authenticatedApi = createAuthenticatedApiClient();

export const UsersApi = {
  list: async (page: number = 1, limit: number = 10, params: Partial<UserListParams> = {}): Promise<UserListResponse> => {
    const queryParams: Record<string, any> = {
      page,
      limit,
      ...params
    };
    
    try {
      const res = await authenticatedApi.get<UserListResponse>(`${basePath}/page`, { params: queryParams });
      return res.data;
    } catch (error: any) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },
  getById: async (id: string): Promise<User> => {
    const res = await authenticatedApi.get<{success: boolean; data: User}>(`${basePath}/${id}`);
    return res.data.data;
  },
  create: async (dto: CreateUserDto): Promise<User> => {
    const res = await authenticatedApi.post<User>(basePath, dto);
    return res.data;
  },
  updateById: async (id: string, dto: UpdateUserDto): Promise<User> => {
    const res = await authenticatedApi.put<User>(`${basePath}/${id}`, dto);
    return res.data;
  },
  deleteById: async (id: string): Promise<User> => {
    const res = await authenticatedApi.delete<User>(`${basePath}/${id}`);
    return res.data;
  },
  getStatistics: async (userId: string): Promise<UserStatisticsResponse> => {
    try {
      const res = await authenticatedApi.get<UserStatisticsResponse>(`${basePath}/statistics/by-user-id/${userId}`);
      return res.data;
    } catch (error: any) {
      console.error("Error fetching user statistics:", error);
      throw error;
    }
  },
  searchByUsername: async (q: string, params: { exact?: boolean; limit?: number; skip?: number; select?: string; sort?: string } = {}) => {
    const res = await authenticatedApi.get(`${basePath}/search-username`, {
      params: {
        q,
        exact: params.exact ? "true" : undefined,
        limit: params.limit,
        skip: params.skip,
        select: params.select,
        sort: params.sort,
      },
    });
    return (res.data?.data ?? []) as any[];
  },
  searchByUsernamePage: async (
    q: string,
    page: number,
    limit: number,
    params: { exact?: boolean; select?: string; sort?: string } = {}
  ) => {
    const res = await authenticatedApi.get(`${basePath}/search-username/page`, {
      params: {
        q,
        exact: params.exact ? "true" : undefined,
        page,
        limit,
        select: params.select,
        sort: params.sort,
      },
    });
    return (res.data?.data ?? { page, limit, total: 0, result: [] }) as { page: number; limit: number; total: number; result: any[] };
  },
  getSystemStatistics: async (): Promise<SystemStatisticsResponse> => {
    try {
      const res = await authenticatedApi.get<SystemStatisticsResponse>(`${basePath}/system-statistics`);
      return res.data;
    } catch (error: any) {
      console.error("Error fetching system statistics:", error);
      throw error;
    }
  },
  getOverviewUser: async (userId: string): Promise<UserOverviewResponse> => {
    try {
      const res = await authenticatedApi.get<UserOverviewResponse>(`${basePath}/${userId}/overview-user`);
      return res.data;
    } catch (error: any) {
      console.error("Error fetching user overview:", error);
      throw error;
    }
  },
};
