export type TopicAnalysis = {
  topicId: string;
  topicName: string;
  attempts: number;
  solved: number;
  accuracy: number;
  averageDifficulty: number;
  averageTimeToAcMs: number;
};

export type UserOverviewLayer1 = {
  solvedByDifficulty: {
    [key: string]: number;
  };
  accuracy: number;
  averageTimeToAcMs: number;
  averageSubmissionsPerProblem: number;
  topTopics: TopicAnalysis[];
  lowTopics: TopicAnalysis[];
};

export type UserOverviewLayer2 = {
  strengthTopics: TopicAnalysis[];
  weakTopics: TopicAnalysis[];
  focusTopics: TopicAnalysis[];
  summaryKmark: string;
};

export type UserOverviewLayer3 = {
  aiKmark: string;
  usedModel: string;
};

export type UserOverviewResponse = {
  success: boolean;
  data: {
    layer1: UserOverviewLayer1;
    layer2: UserOverviewLayer2;
    layer3: UserOverviewLayer3;
  };
};

