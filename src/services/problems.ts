import { Api, createAuthenticatedApiClient } from "@/services/api";
import type {
  Problem,
  CreateProblemDto,
  UpdateProblemDto,
  ProblemListResponse,
  ProblemListParams,
  ProblemsBySubTopicResponse,
} from "@/types/problem";

const basePath = "/problems";

// Tạo authenticated client cho problems API
const authenticatedApi = createAuthenticatedApiClient();

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
  listBySubTopic: async (
    subTopicId: string,
    page: number = 1,
    limit: number = 10,
    params: Record<string, any> = {},
  ): Promise<ProblemsBySubTopicResponse> => {
    try {
      const queryParams = {
        page,
        limit,
        ...params,
      };
      const res = await authenticatedApi.get<ProblemsBySubTopicResponse>(`${basePath}/by-sub-topic/${subTopicId}`, {
        params: queryParams,
      });
      return res.data;
    } catch (error: any) {
      console.error("Error fetching problems by sub-topic:", error);
      throw error;
    }
  },
  search: async (name: string, page: number = 1, limit: number = 10, difficulty?: number): Promise<ProblemListResponse> => {
    const params: any = { name, page, limit };
    if (typeof difficulty === "number") params.difficulty = difficulty;
    const res = await authenticatedApi.get<ProblemListResponse>(`${basePath}/search`, { params });
    return res.data;
  },
  listPage: async (
    page: number = 1,
    limit: number = 10,
    options: {
      filters?: Array<{ field: string; operator: string; values: any[] }>;
      sort?: Record<string, number>;
      topic_id?: string;
      difficulty?: number;
    } = {}
  ): Promise<ProblemListResponse> => {
    const queryParams: Record<string, any> = {
      page,
      limit,
    };
    
    // Add filters as array parameter - axios will serialize filters[] correctly
    if (options.filters && options.filters.length > 0) {
      // Format: filters[]={"field":"name","operator":"contain","values":["Thêm"]}
      queryParams["filters[]"] = options.filters.map(f => JSON.stringify(f));
    }
    
    // Add sort as JSON string
    if (options.sort && Object.keys(options.sort).length > 0) {
      queryParams.sort = JSON.stringify(options.sort);
    }
    
    // Add other filters
    if (options.topic_id) {
      queryParams.topic_id = options.topic_id;
    }
    if (options.difficulty !== undefined) {
      queryParams.difficulty = options.difficulty;
    }
    
    try {
      const res = await authenticatedApi.get<ProblemListResponse>(`${basePath}/page`, { params: queryParams });
      return res.data;
    } catch (error: any) {
      console.error("Error fetching problems page:", error);
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


