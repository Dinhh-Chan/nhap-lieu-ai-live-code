import { createAuthenticatedApiClient } from "@/services/api";
import type { Course, CourseResponse } from "@/types/course";

const authenticatedApi = createAuthenticatedApiClient();

const basePath = "/courses";

const normalizeList = (payload: any): Course[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Course[];
  if (Array.isArray(payload.data)) return payload.data as Course[];
  if (Array.isArray(payload.result)) return payload.result as Course[];
  if (Array.isArray(payload.items)) return payload.items as Course[];
  if (Array.isArray(payload.records)) return payload.records as Course[];
  return [];
};

export const CoursesApi = {
  listMany: async (): Promise<Course[]> => {
    const res = await authenticatedApi.get<CourseResponse | { data: any }>(`${basePath}/many`);
    const payload = (res.data as any)?.data ?? res.data;
    return normalizeList(payload);
  },
  getById: async (id: string): Promise<Course> => {
    const res = await authenticatedApi.get<CourseResponse | { data: Course } | Course>(`${basePath}/${id}`);
    if ((res.data as any)?.data) {
      return (res.data as any).data as Course;
    }
    return res.data as Course;
  },
  create: async (dto: Partial<Course>): Promise<Course> => {
    const res = await authenticatedApi.post<Course>(basePath, dto);
    return res.data;
  },
  updateById: async (id: string, dto: Partial<Course>): Promise<Course> => {
    const res = await authenticatedApi.put<Course>(`${basePath}/${id}`, dto);
    return res.data;
  },
  deleteById: async (id: string): Promise<Course> => {
    const res = await authenticatedApi.delete<Course>(`${basePath}/${id}`);
    return res.data;
  },
  addProblem: async (dto: { course_id: string; problem_id: string; order_index?: number; is_visible?: boolean; is_required?: boolean }): Promise<any> => {
    const res = await authenticatedApi.post(`/course-problems`, {
      course_id: dto.course_id,
      problem_id: dto.problem_id,
      order_index: dto.order_index ?? 0,
      is_visible: dto.is_visible ?? true,
      is_required: dto.is_required ?? true,
    });
    return res.data;
  },
  removeProblem: async (courseId: string, problemId: string): Promise<any> => {
    const res = await authenticatedApi.delete(`${basePath}/${courseId}/problems/${problemId}`);
    return res.data;
  },
};

