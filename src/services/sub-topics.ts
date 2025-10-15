import { Api } from "@/services/api";

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

export const SubTopicsApi = {
  list: async (): Promise<SubTopic[]> => {
    const res = await Api.get<any>(`${basePath}/many`);
    const list = Array.isArray(res) ? res : res?.items || res?.data || res?.records || [];
    return list as SubTopic[];
  },
  getById: async (id: string): Promise<SubTopic> => Api.get<SubTopic>(`${basePath}/${id}`),
  create: async (dto: CreateSubTopicDto): Promise<SubTopic> => Api.post<SubTopic>(basePath, dto),
  updateById: async (id: string, dto: UpdateSubTopicDto): Promise<SubTopic> => Api.put<SubTopic>(`${basePath}/${id}`, dto),
  deleteById: async (id: string): Promise<SubTopic> => Api.delete<SubTopic>(`${basePath}/${id}`),
};


