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
  topic?: {
    _id: string;
    topic_name: string;
    description?: string;
  };
  sub_topic?: {
    _id: string;
    topic_id: string;
    sub_topic_name: string;
    description?: string;
  };
};

export type CreateProblemDto = Omit<Problem, "_id" | "createdAt" | "updatedAt">;
export type UpdateProblemDto = Partial<CreateProblemDto>;

export type ProblemListResponse = {
  success: boolean;
  data: {
    page: number;
    skip: number;
    limit: number;
    total: number;
    result: Problem[];
  };
};

export type ProblemPageData = {
  page: number;
  limit: number;
  total: number;
  result: Problem[];
};

export type ProblemsBySubTopicResponse = {
  success: boolean;
  data: Problem[] | ProblemPageData;
};

export type ProblemListParams = {
  page?: number;
  limit?: number;
  topic_id?: string;
  sub_topic_id?: string;
  difficulty?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
};
