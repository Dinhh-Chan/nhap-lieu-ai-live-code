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

export type TopicStats = {
  topicId: string;
  topicName: string;
  averageScore: number;
  completionRate: number;
  totalAttempts: number;
  totalSolved: number;
};

export type StudentStats = {
  studentId: string;
  username: string;
  fullname: string;
  totalSolved: number;
  averageScore: number;
  totalSubmissions: number;
};

export type ProblemStats = {
  problemName: string;
  difficulty: number;
  failRate: number;
  totalAttempts: number;
  totalPassed: number;
};

export type ClassOverviewResponse = {
  success: boolean;
  data: {
    overallStats: {
      averageDifficulty: number;
      completionRate: number;
      averageScoreByDifficulty: {
        easy?: number;
        medium?: number;
        normal?: number;
        hard?: number;
        very_hard?: number;
      };
      passRateByProblem: {
        [key: string]: number;
      };
    };
    strongTopics: TopicStats[];
    weakTopics: TopicStats[];
    topStudents: StudentStats[];
    bottomStudents: StudentStats[];
    difficultProblems: ProblemStats[];
    aiAnalysisKmark: string;
  };
};

