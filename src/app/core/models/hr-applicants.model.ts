// Model for HR Jobs List Response
export interface HrJobsListResponse {
  success: boolean;
  hrId: number;
  message: string;
  data: HrJobSummary[];
}

// Model for individual job summary in the list
export interface HrJobSummary {
  hrId: number;
  jobId: number;
  title: string;
  companyName: string;
  createdAt: string;
  jobStatus: string;
  totalApplications: number;
  applicantsTookExam: number;
  avgATSScore: number | null;
  avgExamScore: number | null;
}

// Model for Job Applications Details Response
export interface JobApplicationsResponse {
  success: boolean;
  message: string;
  data: JobApplicationsData;
}

// Model for job applications data
export interface JobApplicationsData {
  id: number;
  title: string;
  companyName: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  jobStatus: string;
  examDurationMinutes: number;
  experienceLevel: string;
  employmentType: string;
  location: string;
  salaryRange: string;
  numberOfQuestions: number;
  applicationDeadline: string;
  atsMinimumScore: number;
  autoSend: boolean;
  totalApplications: number;
  applicantsTookExam: number;
  applications: JobApplication[];
}

// Model for individual application
export interface JobApplication {
  applicationId: number;
  applicantId: number;
  applicantName: string;
  applicantPhone: string;
  cvKey: string;
  dateApplied: string;
  atsScore: number;
  applicationStatus: string;
  examStatus: string;
}
