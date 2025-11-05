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
    const res = await authenticatedApi.get<ContestRankingResponse>(`/contests/${id}/ranking`);
    return res.data;
  },
  create: async (dto: ContestCreateDto) => {
    const res = await authenticatedApi.post(`/contests`, dto);
    return res.data;
  },
  update: async (id: string, dto: Partial<ContestCreateDto>) => {
    const res = await authenticatedApi.put(`/contests/${id}`, dto);
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
};

export const ContestProblemsApi = {
  addMultiple: async (
    contestId: string,
    problems: { problem_id: string; order_index: number; score: number; is_visible: boolean }[],
  ) => {
    const res = await authenticatedApi.post(`/contest-problems/${contestId}/problems/add-multiple`, {
      problems,
    });
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


