import { createAuthenticatedApiClient } from "@/services/api";

const authenticatedApi = createAuthenticatedApiClient();

export const ClassStudentsApi = {
  getByClassId: async (classId: string) => {
    const res = await authenticatedApi.get(`/class-students/by-class/${classId}`);
    return res.data;
  },
  addMultiple: async (classId: string, studentIds: string[]) => {
    const res = await authenticatedApi.post(`/class-students/${classId}/add-multiple`, {
      student_ids: studentIds,
    });
    return res.data;
  },
  create: async (classId: string, studentId: string) => {
    const res = await authenticatedApi.post(`/class-students`, {
      class_id: classId,
      student_id: studentId,
    });
    return res.data;
  },
};


