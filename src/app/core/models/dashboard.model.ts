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
