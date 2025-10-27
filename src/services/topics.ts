import api, { Api, createAuthenticatedApiClient } from "@/services/api";

export type Topic = {
  _id: string;
  topic_name: string;
  description?: string;
  lo?: string;
  order_index?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTopicDto = Omit<Topic, "_id" | "createdAt" | "updatedAt">;
export type UpdateTopicDto = Partial<CreateTopicDto>;

const basePath = "/topics";

// Tạo authenticated client cho topics API
const authenticatedApi = createAuthenticatedApiClient();

export type GetTopicsManyQuery = {
  // select?: string; // ví dụ: "topic_name,description,order_index"
  // sort?: string; // ví dụ: "-createdAt"
  // population?: string[]; // population[]
  // condition?: string | Record<string, unknown>; // sẽ JSON.stringify nếu là object
  // filters?: string[]; // filters[]
};

export const TopicsApi = {
  list: async (query?: GetTopicsManyQuery): Promise<Topic[]> => {
    const res = await authenticatedApi.get<any>(`${basePath}/many`);
    const list = Array.isArray(res.data)
      ? res.data
      : res.data?.items || res.data?.data || res.data?.records || [];
    return list as Topic[];
  },
  getById: async (id: string): Promise<Topic> => {
    const res = await authenticatedApi.get<Topic>(`${basePath}/${id}`);
    return res.data;
  },
  create: async (dto: CreateTopicDto): Promise<Topic> => {
    const res = await authenticatedApi.post<Topic>(basePath, dto);
    return res.data;
  },
  updateById: async (id: string, dto: UpdateTopicDto): Promise<Topic> => {
    const res = await authenticatedApi.put<Topic>(`${basePath}/${id}`, dto);
    return res.data;
  },
  deleteById: async (id: string): Promise<Topic> => {
    const res = await authenticatedApi.delete<Topic>(`${basePath}/${id}`);
    return res.data;
  },
};


