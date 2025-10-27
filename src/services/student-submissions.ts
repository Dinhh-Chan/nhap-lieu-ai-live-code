import { Api, createAuthenticatedApiClient } from "@/services/api";
import type { StudentSubmission, StudentSubmissionsResponse, StudentSubmissionsParams } from "@/types/student-submission";

const basePath = "/student-submissions";

// Tạo authenticated client cho student submissions API
const authenticatedApi = createAuthenticatedApiClient();

export const StudentSubmissionsApi = {
  getByStudentId: async (studentId: string, params: Partial<StudentSubmissionsParams> = {}): Promise<StudentSubmissionsResponse> => {
    const queryParams: Record<string, any> = {
      ...params
    };
    
    try {
      const res = await authenticatedApi.get<StudentSubmissionsResponse>(`${basePath}/student/${studentId}/submissions`, { params: queryParams });
      return res.data;
    } catch (error: any) {
      console.error("Error fetching student submissions:", error);
      throw error;
    }
  },
};
