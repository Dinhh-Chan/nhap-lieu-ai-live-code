import { createAuthenticatedApiClient } from "@/services/api";
import type { ClassesManyResponse } from "@/types/class";

const authenticatedApi = createAuthenticatedApiClient();

export const ClassesApi = {
  listMany: async () => {
    const res = await authenticatedApi.get<ClassesManyResponse>(`/classes/many`);
    return res.data;
  },
  create: async (dto: any) => {
    const res = await authenticatedApi.post(`/classes`, dto);
    return res.data;
  },
  deleteById: async (id: string) => {
    const res = await authenticatedApi.delete(`/classes/${id}`);
    return res.data;
  },
};


