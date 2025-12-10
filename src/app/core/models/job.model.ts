export enum JobStatus {
  NotSet = 'NotSet',
  Active = 'Active',
  Closed = 'Closed'
}

export enum ExperienceLevel {
  EntryLevel = 'EntryLevel',
  Junior = 'Junior',
  MidLevel = 'MidLevel',
  Senior = 'Senior',
  TeamLead = 'TeamLead',
  Executive = 'Executive'
}

export enum EmploymentType {
  FullTime = 'FullTime',
  PartTime = 'PartTime',
  Internship = 'Internship',
  FreeLance = 'FreeLance'
}

export interface Skill {
  id: number;
  title: string;
  description: string;
}

export interface JobOpening {
  id?: number;
  title: string;
  companyName: string;
  description?: string;
  createdAt: Date | string;
  jobStatus: JobStatus;
  examDurationMinutes?: number;
  experienceLevel?: ExperienceLevel;
  employmentType?: EmploymentType;
  location?: string;
  salaryRange?: string;
  numberOfQuestions?: number;
  applicationDeadline?: Date | string;
  atsMinimumScore?: number;
  autoSend?: boolean;
  hrId?: number;
  skills?: Skill[];
  updatedAt?: Date | string | null;
  totalApplications?: number;
  examsCompleted?: number;
}

export interface JobFilters {
  searchQuery?: string;
  experienceLevel?: ExperienceLevel;
  employmentType?: EmploymentType;
  location?: string;
  jobStatus?: JobStatus;
  applicationStatus?: 'all' | 'applied' | 'notApplied';
}
