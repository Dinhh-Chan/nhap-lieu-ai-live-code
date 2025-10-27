export type StudentSubmission = {
  _id: string;
  submission_id: string;
  student_id: string;
  class_id?: string | null;
  judge_node_id: string;
  code: string;
  language_id: number;
  status: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error" | "compilation_error" | "pending" | "running";
  score: string;
  execution_time_ms: number;
  memory_used_mb: string;
  test_cases_passed: number;
  total_test_cases: number;
  error_message?: string | null;
  submission_token: string;
  submitted_at: string;
  judged_at: string;
  createdAt: string;
  updatedAt: string;
  problem?: {
    _id: string;
    name: string;
    description: string;
    difficulty: number;
    time_limit_ms: number;
    memory_limit_mb: number;
    number_of_tests: number;
  };
  student?: {
    _id: string;
    username: string;
    email: string;
    fullname: string;
    systemRole: string;
  };
};

export type StudentSubmissionsResponse = {
  success: boolean;
  data: StudentSubmission[];
};

export type StudentSubmissionsParams = {
  page?: number;
  limit?: number;
  status?: string;
  problem_id?: string;
  sort?: string;
  order?: 'asc' | 'desc';
};
