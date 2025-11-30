export enum Role {
  Applicant = 'Applicant',
  HR = 'HR',
  Admin = 'Admin'
}

export enum SkillLevel {
  Beginner = 'Beginner',
  Intermediate = 'Intermediate',
  Advanced = 'Advanced',
  Expert = 'Expert'
}

export enum AccountType {
  Free = 'Free',
  Premium = 'Premium',
  Enterprise = 'Enterprise'
}

export interface User {
  id?: number;
  name: string;
  email: string;
  role: Role;
  isPremium: boolean;
  phone?: string;
  bio?: string;
  title?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface Applicant extends User {
  resumeUrl: string;
  skillLevel?: SkillLevel;
  cvId?: number;
}

export interface HR extends User {
  companyName: string;
  accountType: AccountType;
  premiumExpiry?: Date;
}

export interface ApplicantRegistration {
  name: string;
  email: string;
  password: string;
  phone?: string;
  title?: string;
  skillLevel?: SkillLevel;
  resumeFile?: File;
}

export interface HRRegistration {
  name: string;
  email: string;
  password: string;
  phone?: string;
  companyName: string;
  title?: string;
  bio?: string;
}
