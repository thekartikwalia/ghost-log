import { useEffect, useState, useMemo } from "react";
import type { PageData, Status, SyncPayload, SourcePlatform } from "../shared/types";
import { getStoredAuth, signInWithGoogle } from "../shared/auth";
import { syncApplicationPOST, syncApplicationGET, DEFAULT_API_BASE_URL } from "../shared/api";
import { DEFAULT_STATUS, GHOST_DAYS_THRESHOLD, STORAGE_KEYS } from "../shared/types";
import type { StoredSettings } from "../shared/types";
import { initTheme } from "../shared/theme";

const PAGE_DATA_CACHE_KEY = "ghostlog_page_data";

function getPlatformLabel(platform?: SourcePlatform): string {
  switch (platform) {
    case "linkedin": return "LinkedIn";
    case "greenhouse": return "Greenhouse";
    case "lever": return "Lever";
    case "gmail": return "Gmail";
    case "outlook": return "Outlook";
    default: return "Web";
  }
}

function isGhosted(app: { status: string; appliedDate: string }): boolean {
  if (app.status !== "Applied") return false;
  const days = (Date.now() - new Date(app.appliedDate).getTime()) / (24 * 60 * 60 * 1000);
  return days > GHOST_DAYS_THRESHOLD;
}

// Static fallback suggestions when we don't have user data yet
const FALLBACK_COMPANY_SUGGESTIONS = [
  "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Stripe", "Vercel", "Linear", "Notion",
  "Airbnb", "Uber", "Spotify", "Slack", "Figma", "GitHub", "OpenAI", "Anthropic",
];

export default function App() {
  const [auth, setAuth] = useState<{ signedIn: boolean; idToken: string | null }>({ signedIn: false, idToken: null });
  const [pageData, setPageData] = useState<PageData>({ company: "", role: "", sourceUrl: "" });
  const [status, setStatus] = useState<Status>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [pageDataLoading, setPageDataLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ghostCount, setGhostCount] = useState<number | null>(null);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [apiUrlNotSet, setApiUrlNotSet] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

  // Load cached page data instantly, then auth + check API URL
  useEffect(() => {
    chrome.storage.local.get([PAGE_DATA_CACHE_KEY, STORAGE_KEYS.SETTINGS], (result) => {
      const cached = result[PAGE_DATA_CACHE_KEY] as Partial<PageData> | undefined;
      if (cached?.sourceUrl) {
        setPageData((p) => ({
          company: cached.company ?? p.company,
          role: cached.role ?? p.role,
          sourceUrl: cached.sourceUrl ?? p.sourceUrl,
          platform: cached.platform ?? p.platform,
        }));
      }
      const settings = (result[STORAGE_KEYS.SETTINGS] || {}) as StoredSettings;
      const hasOverride = !!(settings.apiBaseUrl?.trim());
      setApiUrlNotSet(!hasOverride && !DEFAULT_API_BASE_URL);
    });
    getStoredAuth().then((a) => {
      setAuth({ signedIn: a.signedIn, idToken: a.idToken });
      setLoading(false);
    });
  }, []);

  // Live scrape and fetch apps (ghost count + company suggestions)
  useEffect(() => {
    if (!auth.signedIn) return;
    setPageDataLoading(true);
    chrome.runtime.sendMessage({ type: "GET_PAGE_DATA" }, (data: PageData) => {
      setPageDataLoading(false);
      if (data != null) {
        const sourceUrl = data.sourceUrl ?? "";
        setPageData((p) => ({
          company: data.company ?? p.company,
          role: data.role ?? p.role,
          sourceUrl: sourceUrl || p.sourceUrl,
          platform: data.platform ?? p.platform,
        }));
        if (sourceUrl) {
          chrome.storage.local.set({
            [PAGE_DATA_CACHE_KEY]: {
              company: data.company ?? "",
              role: data.role ?? "",
              sourceUrl,
              platform: data.platform,
            },
          });
        }
      }
    });
    getStoredAuth().then((authState) => {
      if (!authState.idToken) return;
      syncApplicationGET(authState.idToken)
        .then((list) => {
          const apps = list || [];
          setGhostCount(apps.filter(isGhosted).length);
          const companies = [...new Set(apps.map((a) => a.company).filter(Boolean))].slice(0, 30);
          setCompanySuggestions(companies.length > 0 ? companies : FALLBACK_COMPANY_SUGGESTIONS);
        })
        .catch(() => { setCompanySuggestions(FALLBACK_COMPANY_SUGGESTIONS); });
    });
  }, [auth.signedIn]);

  const filteredSuggestions = useMemo(() => {
    if (!companySearch.trim()) return companySuggestions.slice(0, 8);
    const q = companySearch.toLowerCase();
    return companySuggestions.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [companySearch, companySuggestions]);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const a = await signInWithGoogle();
      setAuth({ signedIn: a.signedIn, idToken: a.idToken });
      chrome.runtime.sendMessage({ type: "GET_PAGE_DATA" }, (data: PageData) => {
        if (data != null) {
          setPageData((p) => ({
            company: data.company ?? p.company,
            role: data.role ?? p.role,
            sourceUrl: data.sourceUrl ?? p.sourceUrl,
            platform: data.platform ?? p.platform,
          }));
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!auth.idToken) return;
    const company = pageData.company?.trim();
    const sourceUrl = pageData.sourceUrl?.trim();
    if (!company || !sourceUrl) {
      setError("Company and Source URL are required.");
      return;
    }
    setError(null);
    setSuccess(false);
    setSubmitLoading(true);
    try {
      const payload: SyncPayload = {
        company,
        role: (pageData.role || "").trim(),
        sourceUrl,
        status,
      };
      await syncApplicationPOST(payload, auth.idToken);
      setSuccess(true);
      setPageData((p) => ({ ...p, company: "", role: "" }));
      setCompanySearch("");
      setTimeout(() => setSuccess(false), 2500);
      if (ghostCount !== null) {
        syncApplicationGET(auth.idToken).then((list) => {
          setGhostCount((list || []).filter(isGhosted).length);
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to log");
    } finally {
      setSubmitLoading(false);
    }
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const showSmartSearch = !pageData.company?.trim();
  const platformLabel = getPlatformLabel(pageData.platform);

  if (loading && !auth.signedIn) {
    return (
      <div className="p-5 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-w-[350px] min-h-[320px] flex items-center justify-center transition-colors" role="status" aria-label="Loading">
        <div className="animate-pulse flex flex-col gap-3 w-full max-w-[300px]">
          <div className="h-5 bg-gray-200 dark:bg-gray-900 rounded w-1/3" />
          <div className="h-10 bg-gray-200 dark:bg-gray-900 rounded w-full" />
          <div className="h-10 bg-gray-200 dark:bg-gray-900 rounded w-full" />
          <div className="h-10 bg-gray-200 dark:bg-gray-900 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!auth.signedIn) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-w-[350px] min-h-[320px] flex flex-col items-center justify-center gap-5 transition-colors">
        <h1 className="text-lg font-semibold text-orange-500">GhostLog</h1>
        <p className="text-sm text-gray-500 text-center">Sign in to log job applications and track your pipeline.</p>
        <button
          type="button"
          onClick={handleSignIn}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
          aria-label="Sign in with Google"
        >
          Sign in with Google
        </button>
        {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-w-[350px] transition-colors">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">GhostLog</h1>

      {/* API URL not set — show before ghost bar */}
      {apiUrlNotSet && (
        <div className="mb-4 rounded-lg bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 flex items-center justify-between gap-2">
          <span className="text-xs text-amber-800 dark:text-amber-200">
            Set your API URL to sync applications.
          </span>
          <button
            type="button"
            onClick={openOptions}
            className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 whitespace-nowrap focus:outline-none focus:underline"
            aria-label="Open Options to set API URL"
          >
            Open Options
          </button>
        </div>
      )}

      {/* Ghost preview bar */}
      {ghostCount !== null && !apiUrlNotSet && (
        <div className="mb-4 rounded-lg bg-gray-200/80 dark:bg-gray-900/80 border border-gray-300/50 dark:border-gray-800/50 px-3 py-2.5 flex items-center justify-between gap-2 transition-colors">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {ghostCount === 0
              ? "No applications ghosting you."
              : `You have ${ghostCount} application${ghostCount === 1 ? "" : "s"} currently ghosting you.`}
          </span>
          <button
            type="button"
            onClick={openDashboard}
            className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 whitespace-nowrap focus:outline-none focus:underline"
            aria-label="Open dashboard"
          >
            View Dashboard
          </button>
        </div>
      )}

      <div className="space-y-3.5">
        {/* Company: Smart Search when empty */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="company">
            Company
          </label>
          {pageDataLoading ? (
            <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-900 animate-pulse transition-colors" aria-hidden />
          ) : (
            <>
              <input
                id="company"
                type="text"
                value={pageData.company || companySearch}
                onChange={(e) => {
                  const v = e.target.value;
                  setPageData((p) => ({ ...p, company: v }));
                  setCompanySearch(showSmartSearch ? v : "");
                }}
                placeholder={showSmartSearch ? "Search or type company name" : "Company name"}
                list="company-suggestions"
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                aria-label="Company name"
                aria-describedby={showSmartSearch ? "company-hint" : undefined}
              />
              {showSmartSearch && (
                <p id="company-hint" className="text-xs text-gray-500 mt-1">
                  Start typing for suggestions
                </p>
              )}
              <datalist id="company-suggestions">
                {filteredSuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </>
          )}
        </div>

        {/* Job Role */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="role">
            Job Role
          </label>
          {pageDataLoading ? (
            <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-900 animate-pulse transition-colors" aria-hidden />
          ) : (
            <input
              id="role"
              type="text"
              value={pageData.role}
              onChange={(e) => setPageData((p) => ({ ...p, role: e.target.value }))}
              placeholder="Job title / role"
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              aria-label="Job role"
            />
          )}
        </div>

        {/* Source URL with platform pulse */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="source">
            Source
          </label>
          <div className="relative flex items-center gap-2">
            {pageData.platform && pageData.sourceUrl && (
              <span
                className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-300 dark:bg-gray-800 text-gray-800 dark:text-gray-300 animate-pulse-soft transition-colors"
                title={`Detected: ${platformLabel}`}
                aria-hidden
              >
                {platformLabel}
              </span>
            )}
            {pageDataLoading ? (
              <div className="flex-1 h-10 rounded-lg bg-gray-200 dark:bg-gray-900 animate-pulse transition-colors" aria-hidden />
            ) : (
              <input
                id="source"
                type="url"
                value={pageData.sourceUrl}
                onChange={(e) => setPageData((p) => ({ ...p, sourceUrl: e.target.value }))}
                placeholder="https://..."
                className="flex-1 px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                aria-label="Source URL"
              />
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            aria-label="Application status"
          >
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Log Application button + success */}
        <button
          type="button"
          onClick={handleLog}
          disabled={submitLoading}
          className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
          aria-label={submitLoading ? "Logging application" : "Log application"}
        >
          {submitLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
              Logging...
            </>
          ) : success ? (
            <>
              <span className="animate-success-check text-lg" aria-hidden>✓</span>
              Logged
            </>
          ) : (
            "Log Application"
          )}
        </button>
        {success && (
          <p className="text-xs text-emerald-400 text-center" role="status">
            Application logged. You're on a roll.
          </p>
        )}
        {error && (
          <div className="flex flex-col gap-2" role="alert">
            <p className="text-xs text-red-400">{error}</p>
            {error?.includes("API URL not set") && (
              <button
                type="button"
                onClick={openOptions}
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 focus:outline-none focus:underline text-left"
                aria-label="Open Options to set API URL"
              >
                Open Options →
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-900 flex gap-4 text-xs transition-colors">
        <button
          type="button"
          onClick={openDashboard}
          className="text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 font-medium focus:outline-none focus:underline"
          aria-label="Open dashboard"
        >
          Open Dashboard
        </button>
        <button
          type="button"
          onClick={openOptions}
          className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 focus:outline-none focus:underline"
          aria-label="Open options"
        >
          Options
        </button>
      </div>
    </div>
  );
}
