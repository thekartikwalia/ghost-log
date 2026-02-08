// GhostLog shared types

export type Status = "Applied" | "Interviewing" | "Offer" | "Rejected";

export type SourcePlatform = "linkedin" | "greenhouse" | "lever" | "gmail" | "outlook" | "other";

export interface PageData {
  company: string;
  role: string;
  sourceUrl: string;
  platform?: SourcePlatform;
}

export interface SyncPayload {
  company: string;
  role: string;
  sourceUrl: string;
  status: Status;
}

export interface JobApplication {
  rowKey: string;
  company: string;
  role: string;
  sourceUrl: string;
  status: Status;
  appliedDate: string; // ISO string
}

export interface StoredSettings {
  apiBaseUrl?: string;
  notifyWhenGhosted?: boolean;
  idToken?: string;
  userId?: string;
}

export const STORAGE_KEYS = {
  SETTINGS: "ghostlog_settings",
  TOKEN: "ghostlog_id_token",
  USER_ID: "ghostlog_user_id",
} as const;

export const DEFAULT_STATUS: Status = "Applied";
export const GHOST_DAYS_THRESHOLD = 14;
