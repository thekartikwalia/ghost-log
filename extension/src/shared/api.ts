// GhostLog API client - syncApplication POST/GET/PATCH

import type { JobApplication, Status, SyncPayload, StoredSettings } from "./types";
import { STORAGE_KEYS } from "./types";

/** Production API URL baked in at build time. Set VITE_API_BASE_URL when building for Chrome Web Store. */
export const DEFAULT_API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL) || "";

const getApiBaseUrl = (): Promise<string> =>
  new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
      const settings = (result[STORAGE_KEYS.SETTINGS] || {}) as StoredSettings;
      const override = (settings.apiBaseUrl || "").trim();
      resolve(override || DEFAULT_API_BASE_URL);
    });
  });

export async function syncApplicationPOST(
  payload: SyncPayload,
  idToken: string
): Promise<JobApplication> {
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) throw new Error("API URL not set. Set VITE_API_BASE_URL when building, or set it in Options.");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/syncApplication`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 401 ? "Please sign in again." : text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function syncApplicationPATCH(
  rowKey: string,
  status: Status,
  idToken: string
): Promise<JobApplication> {
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) throw new Error("API URL not set. Set VITE_API_BASE_URL when building, or set it in Options.");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/syncApplication`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ rowKey, status }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 401 ? "Please sign in again." : text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function syncApplicationGET(idToken: string): Promise<JobApplication[]> {
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) throw new Error("API URL not set. Set VITE_API_BASE_URL when building, or set it in Options.");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/syncApplication`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(res.status === 401 ? "Please sign in again." : text || `HTTP ${res.status}`);
  }
  return res.json();
}
