import { Api, createAuthenticatedApiClient } from "@/services/api";

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

// Tạo authenticated client cho test-cases API
const authenticatedApi = createAuthenticatedApiClient();

export const TestCasesApi = {
  list: async (): Promise<TestCase[]> => {
    const res = await authenticatedApi.get<any>(`${basePath}/many`);
    const payload = res.data?.data ?? res.data;
    const list = Array.isArray(payload)
      ? payload
      : payload?.result || payload?.items || payload?.records || payload?.data || [];
    return list as TestCase[];
  },
  listPage: async (page: number, limit: number): Promise<TestCase[]> => {
    const res = await authenticatedApi.get<any>(`${basePath}/page`, { params: { page, limit } });
    const payload = res.data?.data ?? res.data;
    const list = Array.isArray(payload)
      ? payload
      : payload?.result || payload?.items || payload?.records || payload?.data || [];
    return list as TestCase[];
  },
  getById: async (id: string): Promise<TestCase> => {
    const res = await authenticatedApi.get<TestCase>(`${basePath}/${id}`);
    return res.data;
  },
  create: async (dto: CreateTestCaseDto): Promise<TestCase> => {
    const res = await authenticatedApi.post<TestCase>(basePath, dto);
    return res.data;
  },
  updateById: async (id: string, dto: UpdateTestCaseDto): Promise<TestCase> => {
    const res = await authenticatedApi.put<TestCase>(`${basePath}/${id}`, dto);
    return res.data;
  },
  deleteById: async (id: string): Promise<TestCase> => {
    const res = await authenticatedApi.delete<TestCase>(`${basePath}/${id}`);
    return res.data;
  },
};


