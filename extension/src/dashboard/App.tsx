import { useEffect, useState } from "react";
import { getStoredAuth, signInWithGoogle } from "../shared/auth";
import { syncApplicationGET, syncApplicationPATCH } from "../shared/api";
import type { JobApplication, Status } from "../shared/types";
import { GHOST_DAYS_THRESHOLD } from "../shared/types";
import { initTheme } from "../shared/theme";

const PAGE_SIZE = 15;

function isGhosted(app: JobApplication): boolean {
  if (app.status !== "Applied") return false;
  const applied = new Date(app.appliedDate).getTime();
  const now = Date.now();
  const days = (now - applied) / (24 * 60 * 60 * 1000);
  return days > GHOST_DAYS_THRESHOLD;
}

function exportCSV(apps: JobApplication[]): void {
  const header = "Company,Role,Source URL,Status,Applied Date,Ghosted\n";
  const rows = apps.map((a) => {
    const ghosted = isGhosted(a) ? "Yes" : "";
    const escape = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    return [a.company, a.role, a.sourceUrl, a.status, a.appliedDate, ghosted].map(escape).join(",");
  });
  const csv = header + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ghostlog-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_OPTIONS: Status[] = ["Applied", "Interviewing", "Offer", "Rejected"];

const statusStyles: Record<Status, string> = {
  Applied: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30",
  Interviewing: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30",
  Offer: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30",
  Rejected: "bg-gray-200 dark:bg-gray-600/50 text-gray-600 dark:text-gray-400 border border-gray-400 dark:border-gray-500/30",
};

function StatusSelect({
  app,
  idToken,
  onStatusChange,
  disabled,
}: {
  app: JobApplication;
  idToken: string | null;
  onStatusChange: (rowKey: string, status: Status) => void;
  disabled?: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const ghosted = isGhosted(app);
  const style = statusStyles[app.status] ?? statusStyles.Applied;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Status;
    if (!idToken || newStatus === app.status) return;
    setUpdating(true);
    try {
      await syncApplicationPATCH(app.rowKey, newStatus, idToken);
      onStatusChange(app.rowKey, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <select
        value={app.status}
        onChange={handleChange}
        disabled={disabled || updating}
        className={`min-w-0 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed ${style}`}
        aria-label={`Change status for ${app.company}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {ghosted && (
        <span className="flex-shrink-0" title="No response for 14+ days" aria-hidden>
          👻
        </span>
      )}
    </span>
  );
}

function CopySourceButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group flex items-center gap-2 min-w-0 max-w-full rounded-md px-2 py-1.5 text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900"
      title={copied ? "Copied" : "Copy URL"}
      aria-label={copied ? "Copied to clipboard" : "Copy source URL"}
    >
      <span className="truncate flex-1">
        {url.replace(/^https?:\/\//, "").length > 42
          ? `${url.replace(/^https?:\/\//, "").slice(0, 40)}…`
          : url.replace(/^https?:\/\//, "")}
      </span>
      <span className="flex-shrink-0 text-xs font-medium text-orange-600 dark:text-orange-400 group-hover:text-orange-500 dark:group-hover:text-orange-300">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

const STATUS_COLUMNS: Status[] = ["Applied", "Interviewing", "Offer", "Rejected"]; // Kanban columns

function EmptyStateIllustration() {
  return (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-4 text-gray-500 dark:text-gray-600"
      aria-hidden
    >
      {/* Ghost body */}
      <path
        d="M80 24c-22 0-40 18-40 40v32h16v-16h8v16h16v-16h8v16h16v-16h8v16h16V64c0-22-18-40-40-40z"
        fill="currentColor"
        opacity="0.4"
      />
      {/* Ghost eyes */}
      <ellipse cx="64" cy="52" rx="6" ry="8" fill="currentColor" opacity="0.6" />
      <ellipse cx="96" cy="52" rx="6" ry="8" fill="currentColor" opacity="0.6" />
      {/* Document / list underneath */}
      <rect x="52" y="88" width="56" height="24" rx="4" fill="currentColor" opacity="0.25" />
      <line x1="60" y1="96" x2="100" y2="96" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
      <line x1="60" y1="102" x2="88" y2="102" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
      {/* Small sparkle */}
      <circle cx="120" cy="36" r="4" fill="#f97316" opacity="0.8" />
    </svg>
  );
}

export default function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [page, setPage] = useState(0);
  const [filterGhosted, setFilterGhosted] = useState(false);

  useEffect(() => {
    initTheme();
    getStoredAuth().then((a) => {
      setSignedIn(a.signedIn);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    setError(null);
    setAppsLoading(true);
    getStoredAuth().then((auth) => {
      if (!auth.idToken) return void setAppsLoading(false);
      setIdToken(auth.idToken);
      syncApplicationGET(auth.idToken)
        .then((list) => setApps(list || []))
        .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
        .finally(() => setAppsLoading(false));
    });
  }, [signedIn]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      setSignedIn(true);
      getStoredAuth().then((auth) => {
        if (auth.idToken)
          syncApplicationGET(auth.idToken).then((list) => setApps(list || [])).catch(() => {});
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportCSV(apps);
  };

  const handleStatusChange = (rowKey: string, status: Status) => {
    setApps((prev) =>
      prev.map((a) => (a.rowKey === rowKey ? { ...a, status } : a))
    );
  };

  const sortedApps = [...apps].sort(
    (a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
  );
  const ghostedApps = sortedApps.filter(isGhosted);
  const displayApps = filterGhosted ? ghostedApps : sortedApps;
  const totalPages = Math.max(1, Math.ceil(displayApps.length / PAGE_SIZE));
  const paginatedApps = displayApps.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading && !signedIn) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center transition-colors" role="status" aria-label="Loading">
        <div className="w-full max-w-2xl space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-900 rounded w-48 animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-900 rounded w-full animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-900 rounded w-full animate-pulse" />
          <div className="h-12 bg-gray-200 dark:bg-gray-900 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen flex flex-col items-center justify-center gap-5 transition-colors">
        <h1 className="text-xl font-semibold text-orange-500">GhostLog Dashboard</h1>
        <p className="text-gray-500 text-center max-w-sm">Sign in to view and manage your job applications.</p>
        <button
          type="button"
          onClick={handleSignIn}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-black"
          aria-label="Sign in with Google"
        >
          Sign in with Google
        </button>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen transition-colors">
      <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">GhostLog Dashboard</h1>
            {ghostedApps.length > 0 && (
              <button
                type="button"
                onClick={() => { setFilterGhosted((f) => !f); setPage(0); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-black ${filterGhosted ? "bg-amber-500/20 dark:bg-amber-500/20 border-amber-500/50 text-amber-800 dark:text-amber-200" : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                aria-pressed={filterGhosted}
                aria-label={filterGhosted ? "Show all applications" : "Show only ghosted applications"}
              >
                <span aria-hidden>👻</span>
                <span>Ghosted ({ghostedApps.length})</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setView((v) => (v === "table" ? "kanban" : "table")); setPage(0); }}
              className="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-black"
              aria-label={view === "table" ? "Switch to Kanban view" : "Switch to Table view"}
            >
              {view === "table" ? "Kanban" : "Table"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-black"
              aria-label="Export applications as CSV"
            >
              Export CSV
            </button>
          </div>
        </header>

        {error && (
          <p className="text-sm text-red-400 mb-4" role="alert">
            {error}
          </p>
        )}

        {appsLoading && apps.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-900/30 overflow-hidden shadow-card dark:shadow-card-dark transition-colors" role="status" aria-label="Loading applications">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-5 bg-gray-200 dark:bg-gray-800/50 rounded w-24 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-gray-200 dark:bg-gray-800/50 rounded w-32 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-gray-200 dark:bg-gray-800/50 rounded w-40 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-6 bg-gray-200 dark:bg-gray-800/50 rounded-full w-20 animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-gray-200 dark:bg-gray-800/50 rounded w-20 animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : displayApps.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-900/30 flex flex-col items-center justify-center py-16 px-6 text-center shadow-card dark:shadow-card-dark transition-colors" role="status">
            {filterGhosted ? (
              <>
                <span className="text-4xl mb-2" aria-hidden>👻</span>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">No ghosted applications</h2>
                <p className="text-gray-500 max-w-sm mb-6">
                  None of your applications have been in &quot;Applied&quot; for 14+ days without a response.
                </p>
                <button
                  type="button"
                  onClick={() => { setFilterGhosted(false); setPage(0); }}
                  className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300 focus:outline-none focus:underline"
                >
                  Show all applications
                </button>
              </>
            ) : (
              <>
                <EmptyStateIllustration />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">No applications yet</h2>
                <p className="text-gray-500 max-w-sm mb-6">
                  Apply to your first job to see magic. Use the GhostLog extension on a job posting to log it here.
                </p>
                <p className="text-sm text-gray-500">
                  Click the GhostLog extension icon on a job page to log an application.
                </p>
              </>
            )}
          </div>
        ) : view === "table" ? (
          <>
            <div className="rounded-xl border border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-900/30 overflow-hidden shadow-card dark:shadow-card-dark transition-colors">
              <table className="w-full text-sm" role="table" aria-label="Job applications">
                <thead className="bg-gray-100 dark:bg-gray-900/80 text-gray-600 dark:text-gray-400 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
                  {paginatedApps.map((app) => (
                    <tr key={app.rowKey} className="bg-gray-50/50 dark:bg-gray-900/20 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{app.company}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-300">{app.role || "—"}</td>
                      <td className="px-4 py-2">
                        <CopySourceButton url={app.sourceUrl} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusSelect
                          app={app}
                          idToken={idToken}
                          onStatusChange={handleStatusChange}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-500">
                        {new Date(app.appliedDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500" aria-live="polite">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-300 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Next page"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
            {STATUS_COLUMNS.map((status) => {
              const columnApps = displayApps.filter((a) => a.status === status);
              const count = columnApps.length;
              return (
              <section key={status} className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800/50 p-4 shadow-card dark:shadow-card-dark transition-colors flex flex-col max-h-[calc(100vh-11rem)] min-h-0" aria-label={`Column: ${status}`}>
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex-shrink-0">{status} ({count})</h2>
                <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
                  {columnApps
                    .map((app) => (
                      <article
                        key={app.rowKey}
                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        role="listitem"
                      >
                        <p className="font-medium text-gray-900 dark:text-gray-200">{app.company}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{app.role || "—"}</p>
                        <div className="mt-2">
                          <CopySourceButton url={app.sourceUrl} />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(app.appliedDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <div className="mt-2">
                          <StatusSelect
                            app={app}
                            idToken={idToken}
                            onStatusChange={handleStatusChange}
                          />
                        </div>
                      </article>
                    ))}
                </div>
              </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
