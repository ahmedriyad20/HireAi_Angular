export interface ExamQuestion {
  id: number;
  questionText: string;
  correctAnswerIndex: number;
  questionNumber: number;
  examId: number;
  applicantResponseId: number | null;
  answerChoices: string[];
}

export interface ExamResponse {
  message: string;
  questionCount: number;
  examDurationInMinutes: number;
  questions: ExamQuestion[];
}

export interface ApplicationDetailResponse {
  id: number;
  applicationStatus: string;
  dateApplied: string;
  cvFilePath: string;
  atsScore: number;
  examStatus: string;
  hrId: number;
  applicantId: number;
  jobId: number;
  examId: number;
  applicantName: string;
  jobTitle: string;
  hrName: string;
}

export interface ExamEvaluationRequest {
  applicationId: number;
  examId: number;
  jobId: number;
  applicantExamScore: number;
  examTotalScore: number;
  appliedAt: string;
  status: 'Pending' | 'Passed' | 'Failed';
}

export interface ExamEvaluationResponse {
  message?: string;
  success?: boolean;
}

export interface UserAnswer {
  questionId: number;
  questionNumber: number;
  selectedAnswerIndex: number | null;
}

export interface ExamResult {
  applicationId: number;
  jobId: number;
  examId: number;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  status: 'Passed' | 'Failed';
  timeTaken: string;
  appliedAt: string;
  questions: ExamQuestion[];
  userAnswers: UserAnswer[];
}
