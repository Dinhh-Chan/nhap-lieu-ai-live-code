export type UserStatistics = {
  total_submissions: number;
  accepted_submissions: number;
  wrong_answer_submissions: number;
  time_limit_exceeded_submissions: number;
  memory_limit_exceeded_submissions: number;
  runtime_error_submissions: number;
  compile_error_submissions: number;
  pending_submissions: number;
  success_rate: number;
  average_score: number | null;
  ranking: number;
  total_users: number;
  last_submission_date: string;
  solved_problems_count: number;
  language_stats: {
    [key: string]: number;
  };
};

export type UserStatisticsResponse = {
  success: boolean;
  data: UserStatistics;
};
