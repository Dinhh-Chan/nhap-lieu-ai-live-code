import { Api } from "@/services/api";

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
};

export type CreateProblemDto = Omit<Problem, "_id" | "createdAt" | "updatedAt">;
export type UpdateProblemDto = Partial<CreateProblemDto>;

const basePath = "/problems";

export const ProblemsApi = {
  list: async (): Promise<Problem[]> => {
    const res = await Api.get<any>(`${basePath}/many`);
    const list = Array.isArray(res) ? res : res?.items || res?.data || res?.records || [];
    return list as Problem[];
  },
  getById: async (id: string): Promise<Problem> => Api.get<Problem>(`${basePath}/${id}`),
  create: async (dto: CreateProblemDto): Promise<Problem> => Api.post<Problem>(basePath, dto),
  updateById: async (id: string, dto: UpdateProblemDto): Promise<Problem> => Api.put<Problem>(`${basePath}/${id}`, dto),
  deleteById: async (id: string): Promise<Problem> => Api.delete<Problem>(`${basePath}/${id}`),
};


