export type ClassItem = {
  _id: string;
  class_id: string;
  class_name: string;
  class_code: string;
  course_id?: string;
  teacher_id?: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  is_active?: boolean;
  course?: any;
  teacher?: { _id: string; username?: string; fullname?: string } | null;
  teacher_basic?: { _id: string; username?: string; fullname?: string } | null;
  students?: any[];
};

export type ClassesManyResponse = {
  data: ClassItem[] | { [key: string]: any };
  success: boolean;
};

