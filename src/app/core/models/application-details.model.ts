export type ExperienceLevel = 'EntryLevel' | 'Junior' | 'MidLevel' | 'Senior' | 'TeamLead' | 'Executive';
export type ApplicationStatus = 'ExamSent' | 'ATSPassed' | 'UnderReview' | 'Completed' | 'Rejected';
export type ExamEvaluationStatus = 'Pending' | 'Passed' | 'Failed';

export interface ApplicationDetails {
  applicationId: number;
  jobTitle: string;
  companyName: string;
  companyLocation: string;
  createdAt: string;
  intrviewDate: string | null;
  experienceLevel: ExperienceLevel;
  salaryRange: string | null;
  examScore: number | null;
  numberOfApplicants: number;
  atsScore: number;
  applicationStatus: ApplicationStatus;
  examEvaluationStatus: ExamEvaluationStatus;
}
