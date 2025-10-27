export type DailySubmission = {
  date: string;
  count: number;
};

export type WeeklySubmission = {
  week: string;
  count: number;
};

export type MonthlySubmission = {
  month: string;
  count: number;
};

export type ProblemAcStats = {
  problem_id: string;
  problem_name: string;
  total_submissions: number;
  accepted_submissions: number;
  ac_rate: number;
};

export type UserAcStats = {
  user_id: string;
  username: string;
  total_submissions: number;
  accepted_submissions: number;
  ac_rate: number;
};

export type TopUser = {
  user_id: string;
  username: string;
  total_submissions: number;
  accepted_submissions: number;
};

export type TopProblem = {
  problem_id: string;
  problem_name: string;
  total_submissions: number;
  accepted_submissions: number;
};

export type SystemStatistics = {
  total_submissions: number;
  today_submissions: number;
  this_week_submissions: number;
  this_month_submissions: number;
  total_users: number;
  total_problems: number;
  overall_ac_rate: number;
  daily_submissions: DailySubmission[];
  weekly_submissions: WeeklySubmission[];
  monthly_submissions: MonthlySubmission[];
  problem_ac_stats: ProblemAcStats[];
  user_ac_stats: UserAcStats[];
  language_stats: {
    [key: string]: number;
  };
  status_stats: {
    accepted: number;
    wrong_answer: number;
    time_limit_exceeded: number;
    runtime_error: number;
    compile_error: number;
  };
  top_users: TopUser[];
  top_problems: TopProblem[];
};

export type SystemStatisticsResponse = {
  success: boolean;
  data: SystemStatistics;
};
