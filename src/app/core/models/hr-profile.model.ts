export interface HrProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isPremium: boolean;
  phone: string;
  address: string;
  bio: string | null;
  title: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  companyName: string;
  companyDescription: string;
  companyAddress: string;
  accountType: string;
  premiumExpiry: string | null;
}

export enum AccountType {
  Free = 'Free',
  Premium = 'Premium',
  Pro = 'Pro'
}

export interface UpdateHrProfileRequest {
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
