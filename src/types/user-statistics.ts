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
  difficulty_stats: {
    easy: {
      solved: number;
      total: number;
    };
    medium: {
      solved: number;
      total: number;
    };
    hard: {
      solved: number;
      total: number;
    };
  };
  activity_data: {
    date: string;
    submissions_count: number;
  }[];
  total_active_days: number;
  max_streak: number;
  current_streak: number;
  recent_submissions: {
    problem_name: string;
    submitted_at: string;
    status: string;
    language: string;
  }[];
  progress_stats: {
    solved: number;
    total: number;
    attempting: number;
  };
};

export type UserStatisticsResponse = {
  success: boolean;
  data: UserStatistics;
};
