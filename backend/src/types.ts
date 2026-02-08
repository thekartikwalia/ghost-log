// GhostLog backend types

export type Status = "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface SyncPayload {
  company: string;
  role: string;
  sourceUrl: string;
  status: Status;
}

export interface JobApplicationEntity {
  partitionKey: string; // userId (Google sub)
  rowKey: string; // guid
  company: string;
  role: string;
  sourceUrl: string;
  status: string;
  appliedDate: string; // ISO
}

export interface JobApplicationResponse {
  rowKey: string;
  company: string;
  role: string;
  sourceUrl: string;
  status: Status;
  appliedDate: string;
}
