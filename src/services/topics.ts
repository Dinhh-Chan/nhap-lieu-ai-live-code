import api, { Api } from "@/services/api";

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

export type GetTopicsManyQuery = {
  // select?: string; // ví dụ: "topic_name,description,order_index"
  // sort?: string; // ví dụ: "-createdAt"
  // population?: string[]; // population[]
  // condition?: string | Record<string, unknown>; // sẽ JSON.stringify nếu là object
  // filters?: string[]; // filters[]
};

export const TopicsApi = {
  list: async (query?: GetTopicsManyQuery): Promise<Topic[]> => {
    const res = await Api.get<any>(`${basePath}/many`);
    const list = Array.isArray(res)
      ? res
      : res?.items || res?.data || res?.records || [];
    return list as Topic[];
  },
  getById: async (id: string): Promise<Topic> => Api.get<Topic>(`${basePath}/${id}`),
  create: async (dto: CreateTopicDto): Promise<Topic> => Api.post<Topic>(basePath, dto),
  updateById: async (id: string, dto: UpdateTopicDto): Promise<Topic> => Api.put<Topic>(`${basePath}/${id}`, dto),
  deleteById: async (id: string): Promise<Topic> => Api.delete<Topic>(`${basePath}/${id}`),
};


