export type UserRole = 'seeker' | 'employer';

export type ApplicationStatus = 'pending' | 'shortlisted' | 'interview' | 'rejected' | 'offered';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
  resume_url?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  experience_level?: string;
  experience_years?: number;
  preferred_shift?: string;
  preferred_job_type?: string;
  preferred_distance?: number;
  location?: string;
  phone?: string;
  is_seeker?: boolean;
  is_employer?: boolean;
  created_at?: string;
  updated_at?: string;
  is_verified?: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified';
  company_registration_no?: string;
  tax_id?: string;
  company_website?: string;
  company_location?: string;
  about_company?: string;
  company_size?: string;
  industry?: string;
  tagline?: string;
  website?: string;
  company_address?: string;
  verification_submitted_at?: string;
  latitude?: number;
  longitude?: number;
  founded_year?: string;
  benefits?: string[];
  culture?: string[];
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  shift_preference: string;
  flexible_hours: boolean;
  min_salary?: number;
  max_salary?: number;
  salary_range: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  culture?: string[];
  skills?: string[];
  experience_level?: string;
  department?: string;
  status: 'active' | 'closed' | 'draft';
  created_at: string;
  updated_at?: string;
  match_score?: number;
  match?: string;
  match_breakdown?: {
    skills?: number;
    experience?: number;
    preferences?: number;
    location?: number | null;
    distance_km?: number | null;
  };
  distance_km?: number | null;
  is_saved?: boolean;
  has_applied?: boolean;
  category?: string;
  applications_count?: number;
  company_verified?: boolean;
  latitude?: number;
  longitude?: number;
  workplace_type?: 'onsite' | 'hybrid' | 'remote';
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  commute_distance_km?: number;
  commute_time_mins?: number;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  match_score: number;
  cover_letter?: string;
  applied_at: string;
  created_at?: string;
  updated_at: string;
  job?: Job;
  applicant?: Profile;
}

export interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface ChatConversation {
  application_id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  status: string;
  contact_name: string;
  contact_avatar?: string;
  contact_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface EmployerStats {
  stats: {
    active_jobs: number;
    total_applicants: number;
    new_today: number;
    shortlisted: number;
    interview: number;
  };
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    location: string;
    salary_range: string;
    applicants_count: number;
    new_today_count: number;
  }>;
}

export interface SavedJobItem {
  id: string;
  saved_job_id?: string;
  job_id: string;
  user_id: string;
  created_at?: string;
  saved_at?: string;
  job: Job;
  job_details?: Job;
}

export interface RecentlyViewedItem {
  id: string;
  job_id: string;
  user_id: string;
  viewed_at: string;
  job: Job;
}

export interface ResumeAnalysisResult {
  resume_score: number;
  overall_score: number;
  breakdown: {
    profile_completeness: number;
    skills: number;
    experience: number;
    projects: number;
    education: number;
    keywords: number;
  };
  skills: string[];
  skills_categorized?: {
    languages?: string[];
    frameworks?: string[];
    databases?: string[];
    cloud_devops?: string[];
    tools_other?: string[];
    soft_skills?: string[];
  };
  experience: {
    years: number;
    seniority: string;
    detected_roles: string[];
    primary_headline?: string;
  };
  education: string[];
  certifications: string[];
  projects: {
    has_project_section: boolean;
    project_count: number;
    impact_statements: string[];
    has_quantifiable_metrics: boolean;
  };
  detected_roles: string[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  missing_sections: string[];
  improvement_suggestions: string[];
  matching_jobs: Array<{
    id: string;
    title: string;
    company_name: string;
    location: string;
    salary_range: string;
    job_type: string;
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
    distance_km?: number | null;
  }>;
  extracted_profile_updates: {
    skills?: string[];
    experience_years?: number;
    experience_level?: string;
    headline?: string;
    phone?: string;
    location?: string;
  };
  filename?: string;
  detected_format?: string;
}
