export interface ApplicantSkill {
  id: number;
  skillId: number;
  skillName: string;
  skillRate: number;
  improvementPercentage: number | null;
  notes: string | null;
}

export interface ApplicantProfile {
  id: number;
  name: string;
  email: string;
  dateOfBirth: string;
  phone: string;
  bio: string;
  title: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  resumeUrl: string;
  skillLevel: string;
  applicantSkills: ApplicantSkill[];
}
