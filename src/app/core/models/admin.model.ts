// Admin-specific models for managing applicants, HRs, and jobs

export interface ApplicantListItem {
  id: number;
  fullName: string;
  email: string;
  address: string;
  dateOfBirth: string;
  phone: string;
  bio: string | null;
  title: string | null;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  resumeUrl: string;
  skillLevel: string;
}

export interface ApplicantUpdateRequest {
  id: number;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  dateOfBirth: string;
  title: string;
  bio: string;
  isActive: boolean;
  resumeUrl: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

// HR models for admin HR management
export interface HRListItem {
  id: number;
  fullName: string;
  email: string;
  address: string;
  role: string;
  isPremium: boolean;
  phone: string;
  bio: string | null;
  title: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  companyName: string;
  companyDescription: string;
  companyAddress: string;
  accountType: string;
  premiumExpiry: string | null;
}

export interface HRUpdateRequest {
  fullName: string;
  address: string;
  phone: string;
  isPremium: boolean;
  bio: string;
  title: string;
  isActive: boolean;
  companyName: string;
  companyDescription: string;
  companyAddress: string;
  accountType: string;
  premiumExpiry: string | null;
}

// Job models for admin job management
export interface JobListItem {
  id: number;
  title: string;
  companyName: string;
  description: string;
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
  hrId: number;
  hrName: string;
  skills: any[];
  createdAt: string;
  updatedAt: string | null;
  totalApplications: number;
  examsCompleted: number;
}

export interface JobUpdateRequest {
  title: string;
  companyName: string;
  description: string;
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
  hrId: number;
  skillIds: number[];
}
