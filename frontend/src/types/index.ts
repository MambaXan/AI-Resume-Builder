// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ─── Resume ──────────────────────────────────────────────────────────────────

export interface WorkExperience {
  id?: number;
  company: string;
  position: string;
  start_date: string; // "YYYY-MM"
  end_date?: string; // "YYYY-MM" | undefined means "Present"
  description: string;
}

export interface Education {
  id?: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  gpa?: string;
}

export interface Skill {
  id?: number;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface Resume {
  id?: number;
  title: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  summary?: string;
  work_experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  created_at?: string;
  updated_at?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
  status: number;
}
