export type AccountType = 'company' | 'employee';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string;
  photoURL?: string | null;
  accountType?: AccountType;
  companyName?: string;
  companyWebsite?: string;
  preferredCategories?: string[];
  preferredLocations?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  category: 'Internship' | 'Full-Time' | 'Fellowship' | 'Scholarship' | 'Grant';
  location: string;
  workType: 'Remote' | 'Hybrid' | 'On-site';
  stipendOrSalary: string;
  deadline: string;
  description: string;
  requirements: string[];
  tags: string[];
  featured?: boolean;
}

export interface SavedOpportunity {
  id: string;
  userId: string;
  title: string;
  company: string;
  location?: string;
  type?: string;
  deadline?: string;
  savedAt?: string;
}

export interface ApplicationTrackerItem {
  id: string;
  userId: string;
  opportunityTitle: string;
  organization: string;
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  appliedDate: string;
  notes?: string;
  updatedAt?: string;
}

export type VideoCategory =
  | 'Jobs'
  | 'Internships'
  | 'Scholarships'
  | 'Coding'
  | 'Career Guidance'
  | 'Competitive Exams'
  | 'Freelancing';

export interface VideoResource {
  id: string;
  videoUrl: string;
  videoId: string;
  title: string;
  description?: string;
  category: VideoCategory;
  thumbnailUrl: string;
  channelTitle?: string;
  status: 'published' | 'draft';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
