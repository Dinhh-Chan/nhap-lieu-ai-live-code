export type CourseStudent = {
  _id: string;
  username: string;
  fullname: string;
  email?: string;
  join_at?: string;
  completed_problems?: number;
  total_problems?: number;
};

export type CourseProblem = {
  _id: string;
  course_id: string;
  problem_id: string;
  order_index?: number;
  is_visible?: boolean;
  is_required?: boolean;
  problem?: {
    _id: string;
    name: string;
    description?: string;
    difficulty?: string | number;
    [key: string]: any;
  };
};

export type Course = {
  _id: string;
  course_name: string;
  course_code: string;
  description?: string;
  is_active?: boolean;
  students?: CourseStudent[];
  problems?: CourseProblem[];
  createdAt?: string;
  updatedAt?: string;
};

export type CourseResponse = {
  success: boolean;
  data: Course[] | Course;
};

