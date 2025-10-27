import { Api, createAuthenticatedApiClient } from "@/services/api";

export type SubTopic = {
  _id: string;
  topic_id: string;
  sub_topic_name: string;
  description?: string;
  lo?: string;
  order_index?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSubTopicDto = Omit<SubTopic, "_id" | "createdAt" | "updatedAt">;
export type UpdateSubTopicDto = Partial<CreateSubTopicDto>;

const basePath = "/sub-topics";

// Tạo authenticated client cho sub-topics API
const authenticatedApi = createAuthenticatedApiClient();

export const SubTopicsApi = {
  list: async (): Promise<SubTopic[]> => {
    const res = await authenticatedApi.get<any>(`${basePath}/many`);
    const list = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || res.data?.records || [];
    return list as SubTopic[];
  },
  getById: async (id: string): Promise<SubTopic> => {
    const res = await authenticatedApi.get<SubTopic>(`${basePath}/${id}`);
    return res.data;
  },
  create: async (dto: CreateSubTopicDto): Promise<SubTopic> => {
    const res = await authenticatedApi.post<SubTopic>(basePath, dto);
    return res.data;
  },
  updateById: async (id: string, dto: UpdateSubTopicDto): Promise<SubTopic> => {
    const res = await authenticatedApi.put<SubTopic>(`${basePath}/${id}`, dto);
    return res.data;
  },
  deleteById: async (id: string): Promise<SubTopic> => {
    const res = await authenticatedApi.delete<SubTopic>(`${basePath}/${id}`);
    return res.data;
  },
};


