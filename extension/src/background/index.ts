// GhostLog background service worker
// Auth, page data relay, ghosted notifications

import type { JobApplication } from "../shared/types";
import { getStoredAuth, ensureSignedIn } from "../shared/auth";
import { syncApplicationGET } from "../shared/api";
import { STORAGE_KEYS, GHOST_DAYS_THRESHOLD } from "../shared/types";

const ALARM_GHOST_CHECK = "ghostlog-ghost-check";

function getApiBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
      const settings = result[STORAGE_KEYS.SETTINGS] || {};
      resolve(settings.apiBaseUrl || "");
    });
  });
}

function getNotifyWhenGhosted(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
      const settings = result[STORAGE_KEYS.SETTINGS] || {};
      resolve(!!settings.notifyWhenGhosted);
    });
  });
}

function isGhosted(app: JobApplication): boolean {
  if (app.status !== "Applied") return false;
  const applied = new Date(app.appliedDate).getTime();
  const now = Date.now();
  const days = (now - applied) / (24 * 60 * 60 * 1000);
  return days > GHOST_DAYS_THRESHOLD;
}

async function fetchApplications(): Promise<JobApplication[]> {
  const auth = await getStoredAuth();
  if (!auth.idToken) return [];
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) return [];
  try {
    return await syncApplicationGET(auth.idToken);
  } catch {
    return [];
  }
}

async function runGhostCheck(): Promise<void> {
  const enabled = await getNotifyWhenGhosted();
  if (!enabled || !chrome.notifications?.create) return;
  const apps = await fetchApplications();
  const ghosted = apps.filter(isGhosted);
  for (const app of ghosted) {
    chrome.notifications.create(`ghost-${app.rowKey}`, {
      type: "basic",
      iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      title: "GhostLog: Application ghosted",
      message: `${app.company} – ${app.role} (no response in ${GHOST_DAYS_THRESHOLD}+ days)`,
      priority: 1,
    });
  }
}

chrome.runtime.onMessage.addListener(
  (
    msg: { type: string; payload?: unknown },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    if (msg.type === "GET_PAGE_DATA") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id || !tab.url) {
          sendResponse({ company: "", role: "", sourceUrl: "" });
          return;
        }
        const tryGetPageData = () => {
          chrome.tabs.sendMessage(tab.id!, { type: "GET_PAGE_DATA" }, (data: unknown) => {
            if (chrome.runtime.lastError) {
              // Content script not in tab: inject and retry (works on any http(s) page)
              const url = tab.url || "";
              if (!url.startsWith("http://") && !url.startsWith("https://")) {
                sendResponse({ company: "", role: "", sourceUrl: url });
                return;
              }
              chrome.scripting.executeScript(
                { target: { tabId: tab.id! }, files: ["content.js"] },
                () => {
                  if (chrome.runtime.lastError) {
                    sendResponse({ company: "", role: "", sourceUrl: url });
                    return;
                  }
                  chrome.tabs.sendMessage(tab.id!, { type: "GET_PAGE_DATA" }, (data2: unknown) => {
                    if (chrome.runtime.lastError) {
                      sendResponse({ company: "", role: "", sourceUrl: url });
                      return;
                    }
                    const d = data2 as { company?: string; role?: string; sourceUrl?: string; platform?: string };
                    sendResponse({
                      company: d?.company ?? "",
                      role: d?.role ?? "",
                      sourceUrl: d?.sourceUrl ?? url,
                      platform: d?.platform,
                    });
                  });
                }
              );
            } else {
              const d = data as { company?: string; role?: string; sourceUrl?: string; platform?: string };
              sendResponse({
                company: d?.company ?? "",
                role: d?.role ?? "",
                sourceUrl: d?.sourceUrl ?? tab.url ?? "",
                platform: d?.platform,
              });
            }
          });
        };

        tryGetPageData();
      });
      return true;
    }
    if (msg.type === "SIGN_IN") {
      ensureSignedIn(true)
        .then((auth: { idToken: string | null; userId: string | null; signedIn: boolean }) => sendResponse({ ok: true, auth }))
        .catch((err: unknown) => sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }));
      return true;
    }
    if (msg.type === "GET_AUTH") {
      getStoredAuth().then(sendResponse);
      return true;
    }
    if (msg.type === "RUN_GHOST_CHECK") {
      runGhostCheck().then(() => sendResponse({ ok: true }));
      return true;
    }
    return false;
  }
);

if (typeof chrome !== "undefined" && chrome.alarms?.create) {
  chrome.alarms.create(ALARM_GHOST_CHECK, { periodInMinutes: 24 * 60 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_GHOST_CHECK) runGhostCheck();
  });
}
