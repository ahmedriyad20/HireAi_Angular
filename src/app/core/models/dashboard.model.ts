export interface ApplicantDashboardData {
  activeApplicationsNum: number;
  mockExamsTakenNumber: number;
  averageExamsTakenScore: number;
  skillLevel: string;
  applicationTimeline: ApplicationTimelineItem[];
  applicantSkillImprovementScore: SkillImprovementScore[];
}

export interface ApplicationTimelineItem {
  applicationId?: number;
  jobTitle: string;
  companyName: string;
  appliedAt: string;
  atsScore: number;
  applicationStatus: string;
  examStatus?: string;
}

export interface SkillImprovementScore {
  skillName: string;
  month: string;
  skillRating: number;
  improvementPercentage: number | null;
  notes: string | null;
}

// HR Dashboard Models
export interface HRDashboardData {
  totalApplicants: number;
  totalExamTaken: number;
  totalTopApplicants: number;
  atsPassedRate: number;
  monthlyApplicants: { [key: string]: number };
  atsPassedRateMonthly: { [key: string]: number };
  examScoreDistribution: { [key: string]: number };
  recentApplications: RecentApplication[];
  activeJobPostings: ActiveJobPosting[];
}

export interface RecentApplication {
  applicantName: string;
  position: string;
  appliedOn: string;
  atsScore: number;
  jobStatus: string;
  examResultLink: string;
  applicantCVlink: string;
}

export interface ActiveJobPosting {
  jobTitle: string;
  applicationTotalCount: number;
  jobStatus: string;
  takenExamCount: number;
  jobPostLink: string;
}
