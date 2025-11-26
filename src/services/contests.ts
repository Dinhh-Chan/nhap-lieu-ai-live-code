import { createAuthenticatedApiClient } from "@/services/api";
import type { ContestManyResponse, ContestDetailResponse, ContestRankingResponse, ContestCreateDto } from "@/types/contest";

const authenticatedApi = createAuthenticatedApiClient();

export const ContestsApi = {
  listMany: async () => {
    const res = await authenticatedApi.get<ContestManyResponse>("/contests/many");
    return res.data;
  },
  getById: async (id: string) => {
    const res = await authenticatedApi.get<ContestDetailResponse>(`/contests/${id}`);
    return res.data;
  },
  getRanking: async (id: string) => {
    const res = await authenticatedApi.get<ContestRankingResponse | any>(`/contests/${id}/ranking`);
    const payload: any = res.data;
    // Chuẩn hóa: nếu API trả về mảng trong data, chuyển thành { data: { ranking: [...] } }
    const ranking = Array.isArray(payload?.data)
      ? payload.data
      : (payload?.data?.ranking ?? []);
    return { success: true, data: { ranking } } as ContestRankingResponse as any;
  },
  create: async (dto: ContestCreateDto) => {
    const res = await authenticatedApi.post(`/contests`, dto);
    return res.data;
  },
  update: async (id: string, dto: Partial<ContestCreateDto>) => {
    const res = await authenticatedApi.put(`/contests/${id}`, dto);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await authenticatedApi.delete(`/contests/${id}`);
    return res.data;
  },
};

export const ContestUsersApi = {
  addMultiple: async (contestId: string, userIds: string[]) => {
    const res = await authenticatedApi.post(`/contest-users/${contestId}/users/add-multiple`, {
      user_ids: userIds,
    });
    return res.data;
  },
  remove: async (contestId: string, userId: string) => {
    const res = await authenticatedApi.delete(`/contest-users/${contestId}/users/${userId}`);
    return res.data;
  },
  approve: async (contestId: string, userId: string) => {
    const res = await authenticatedApi.put(`/contest-users/${contestId}/users/${userId}/approve`);
    return res.data;
  },
  reject: async (contestId: string, userId: string) => {
    const res = await authenticatedApi.put(`/contest-users/${contestId}/users/${userId}/reject`);
    return res.data;
  },
  deleteById: async (contestUserId: string) => {
    const res = await authenticatedApi.delete(`/contest-users/${contestUserId}`);
    return res.data;
  },
  clear: async (contestId: string) => {
    const res = await authenticatedApi.delete(`/contest-users/${contestId}/users/all`);
    return res.data;
  },
};

export const ContestProblemsApi = {
  addMultiple: async (contestId: string, problems: string[]) => {
    const res = await authenticatedApi.post(`/contest-problems/${contestId}/problems/add-multiple`, {
      problems,
    });
    return res.data;
  },
  remove: async (contestProblemId: string) => {
    const res = await authenticatedApi.delete(`/contest-problems/${contestProblemId}`);
    return res.data;
  },
  updateVisibility: async (contestId: string, problemId: string, isVisible: boolean) => {
    const res = await authenticatedApi.patch(`/contest-problems/${contestId}/${problemId}/visibility`, {
      is_visible: isVisible,
    });
    return res.data;
  },
  clear: async (contestId: string) => {
    const res = await authenticatedApi.delete(`/contest-problems/${contestId}/problems/all`);
    return res.data;
  },
};

export const ContestSubmissionsApi = {
  getByContestId: async (contestId: string) => {
    const res = await authenticatedApi.get(`/contest-submissions/contest/${contestId}`);
    return res.data;
  },
  getAllByContestId: async (contestId: string) => {
    const res = await authenticatedApi.get(`/contest-submissions/contest/${contestId}/all`);
    return res.data;
  },
};


