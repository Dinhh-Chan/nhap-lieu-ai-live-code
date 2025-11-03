export type Contest = {
  _id: string;
  name: string; // local fallback name
  description?: string;
  start_time?: string;
  end_time?: string;
  is_public?: boolean;
  problems: { _id: string; name: string }[];
  participants: { _id: string; username: string; fullname: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateContestDto = {
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  is_public?: boolean;
};

// API create DTO
export type ContestCreateDto = {
  contest_name: string;
  description?: string;
  start_time: string;
  end_time: string;
  created_time?: string;
  is_active?: boolean;
  duration_minutes?: number;
  max_problems?: number;
  order_index?: number;
  type?: string; // practice | official
};

// API response for /contests/many
export type ContestManyItem = {
  _id: string;
  contest_name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  created_time?: string;
  is_active?: boolean;
  duration_minutes?: number;
  max_problems?: number;
  order_index?: number;
  type?: string; // "practice" | "official" | ...
  contest_users?: any[]; // backend may return embedded docs; use any[] for now
  contest_problems?: any[];
};

export type ContestManyResponse = {
  data: ContestManyItem[];
  success: boolean;
};

// Detail
export type ContestUser = {
  _id: string;
  contest_id: string;
  user_id: string;
  accepted_count: number;
  is_manager: boolean;
  order_index: number;
  status: string; // enrolled | ...
  start_at?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    _id: string;
    username: string;
    firstname?: string | null;
    lastname?: string | null;
    fullname?: string;
    systemRole?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type ContestProblem = {
  _id: string;
  contest_id: string;
  problem_id: string;
  order_index: number;
  score: number;
  is_visible: boolean;
  createdAt?: string;
  updatedAt?: string;
  problem?: {
    _id: string;
    name: string;
    difficulty?: number;
    time_limit_ms?: number;
    memory_limit_mb?: number;
    is_public?: boolean;
    is_active?: boolean;
  };
};

export type ContestRankingItem = ContestUser & { rank: number };

export type ContestDetailData = {
  _id: string;
  contest_name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  created_time?: string;
  is_active?: boolean;
  duration_minutes?: number;
  max_problems?: number;
  order_index?: number;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
  contest_users: ContestUser[];
  contest_problems: ContestProblem[];
  ranking?: ContestRankingItem[];
  is_start?: boolean;
  status?: string;
};

export type ContestDetailResponse = {
  success: boolean;
  data: ContestDetailData;
};

// Ranking API
export type ContestRankingProblemCell = {
  problem_id: string;
  problem_name: string;
  is_solved: boolean;
  score: number;
  solved_at?: string;
};

export type ContestRankingRow = {
  rank: number;
  user: { _id: string; username: string; fullname: string };
  accepted_count: number;
  total_score: number;
  problems: ContestRankingProblemCell[];
};

export type ContestRankingResponse = {
  success: boolean;
  data: {
    ranking: ContestRankingRow[];
  };
};


