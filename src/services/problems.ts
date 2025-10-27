import { Api, createAuthenticatedApiClient } from "@/services/api";

export type Problem = {
  _id: string;
  topic_id?: string;
  sub_topic_id?: string;
  name: string;
  description: string;
  difficulty: number;
  code_template?: string;
  number_of_tests?: number;
  is_public?: boolean;
  is_active?: boolean;
  time_limit_ms?: number;
  memory_limit_mb?: number;
  createdAt?: string;
  updatedAt?: string;
  topic?: {
    _id: string;
    topic_name: string;
    description?: string;
  };
  sub_topic?: {
    _id: string;
    topic_id: string;
    sub_topic_name: string;
    description?: string;
  };
};

export type CreateProblemDto = Omit<Problem, "_id" | "createdAt" | "updatedAt">;
export type UpdateProblemDto = Partial<CreateProblemDto>;

const basePath = "/problems";

// Tạo authenticated client cho problems API
const authenticatedApi = createAuthenticatedApiClient();

export type ProblemListResponse = {
  success: boolean;
  data: {
    page: number;
    skip: number;
    limit: number;
    total: number;
    result: Problem[];
  };
};

export type ProblemListParams = {
  page?: number;
  limit?: number;
  topic_id?: string;
  sub_topic_id?: string;
  difficulty?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
};

export const ProblemsApi = {
  list: async (page: number = 1, limit: number = 10, params: Partial<ProblemListParams> = {}): Promise<ProblemListResponse> => {
    const queryParams: Record<string, any> = {
      page,
      limit,
      ...params
    };
    
    try {
      const res = await authenticatedApi.get<ProblemListResponse>(`${basePath}/list/basic`, { params: queryParams });
      return res.data;
    } catch (error: any) {
      console.error("Error fetching problems:", error);
      throw error;
    }
  },
  getById: async (id: string): Promise<Problem> => {
    const res = await authenticatedApi.get<{success: boolean; data: Problem}>(`${basePath}/${id}`);
    return res.data.data;
  },
  create: async (dto: CreateProblemDto): Promise<Problem> => {
    const res = await authenticatedApi.post<Problem>(basePath, dto);
    return res.data;
  },
  updateById: async (id: string, dto: UpdateProblemDto): Promise<Problem> => {
    const res = await authenticatedApi.put<Problem>(`${basePath}/${id}`, dto);
    return res.data;
  },
  deleteById: async (id: string): Promise<Problem> => {
    const res = await authenticatedApi.delete<Problem>(`${basePath}/${id}`);
    return res.data;
  },
};


