import { Api } from "@/services/api";

export type TestCase = {
  _id: string;
  problem_id: string;
  input_data: string;
  expected_output: string;
  order_index?: number;
  is_public?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTestCaseDto = Omit<TestCase, "_id" | "createdAt" | "updatedAt">;
export type UpdateTestCaseDto = Partial<CreateTestCaseDto>;

const basePath = "/test-cases";

export const TestCasesApi = {
  list: async (): Promise<TestCase[]> => {
    const res = await Api.get<any>(`${basePath}/many`);
    const payload = res?.data ?? res;
    const list = Array.isArray(payload)
      ? payload
      : payload?.result || payload?.items || payload?.records || payload?.data || [];
    return list as TestCase[];
  },
  listPage: async (page: number, limit: number): Promise<TestCase[]> => {
    const res = await Api.get<any>(`${basePath}/page`, { page, limit });
    const payload = res?.data ?? res;
    const list = Array.isArray(payload)
      ? payload
      : payload?.result || payload?.items || payload?.records || payload?.data || [];
    return list as TestCase[];
  },
  getById: async (id: string): Promise<TestCase> => Api.get<TestCase>(`${basePath}/${id}`),
  create: async (dto: CreateTestCaseDto): Promise<TestCase> => Api.post<TestCase>(basePath, dto),
  updateById: async (id: string, dto: UpdateTestCaseDto): Promise<TestCase> => Api.put<TestCase>(`${basePath}/${id}`, dto),
  deleteById: async (id: string): Promise<TestCase> => Api.delete<TestCase>(`${basePath}/${id}`),
};


