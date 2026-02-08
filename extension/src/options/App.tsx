import { useEffect, useState } from "react";
import { getStoredAuth, signOut } from "../shared/auth";
import { DEFAULT_API_BASE_URL } from "../shared/api";
import { STORAGE_KEYS } from "../shared/types";
import { getTheme, setTheme, initTheme, type ThemePreference } from "../shared/theme";

interface Settings {
  apiBaseUrl: string;
  notifyWhenGhosted: boolean;
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function App() {
  const [settings, setSettings] = useState<Settings>({ apiBaseUrl: "", notifyWhenGhosted: false });
  const [saved, setSaved] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [themePreference, setThemePreference] = useState<ThemePreference>(getTheme());

  useEffect(() => {
    initTheme();
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
      const stored = (result[STORAGE_KEYS.SETTINGS] || {}) as Partial<Settings>;
      setSettings({
        apiBaseUrl: stored.apiBaseUrl ?? "",
        notifyWhenGhosted: stored.notifyWhenGhosted ?? false,
      });
    });
    getStoredAuth().then((a) => {
      setSignedIn(a.signedIn);
      setLoading(false);
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set(
      {
        [STORAGE_KEYS.SETTINGS]: {
          apiBaseUrl: settings.apiBaseUrl.trim(),
          notifyWhenGhosted: settings.notifyWhenGhosted,
        },
      },
      () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    );
  };

  const handleThemeChange = (value: ThemePreference) => {
    setThemePreference(value);
    setTheme(value);
  };

  const handleSignOut = async () => {
    await signOut();
    setSignedIn(false);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center transition-colors" role="status" aria-label="Loading">
        <div className="w-full max-w-md space-y-5">
          <div className="h-7 bg-gray-200 dark:bg-gray-900 rounded w-40 animate-pulse" />
          <div className="h-11 bg-gray-200 dark:bg-gray-900 rounded w-full animate-pulse" />
          <div className="h-11 bg-gray-200 dark:bg-gray-900 rounded w-full animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-900 rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 min-h-screen transition-colors">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">GhostLog Options</h1>
        <div className="rounded-xl border border-gray-200 dark:border-gray-900 bg-white dark:bg-gray-900/50 p-6 space-y-6 shadow-card dark:shadow-card-dark transition-colors">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              value={themePreference}
              onChange={(e) => handleThemeChange(e.target.value as ThemePreference)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              aria-label="Theme: Light, Dark, or System"
            >
              {THEME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1.5">
              System follows your device preference.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2" htmlFor="api-url">
              {DEFAULT_API_BASE_URL ? "Override API URL (optional)" : "API base URL"}
            </label>
            <input
              id="api-url"
              type="url"
              value={settings.apiBaseUrl}
              onChange={(e) => setSettings((s) => ({ ...s, apiBaseUrl: e.target.value }))}
              placeholder={DEFAULT_API_BASE_URL ? "Use default server" : "http://localhost:7071"}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
              aria-label={DEFAULT_API_BASE_URL ? "Override API URL" : "API base URL"}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              {DEFAULT_API_BASE_URL
                ? "Leave empty to use the default server. Set a URL only to use your own backend."
                : "For local dev use http://localhost:7071; for production set VITE_API_BASE_URL when building."}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="notify"
              checked={settings.notifyWhenGhosted}
              onChange={(e) => setSettings((s) => ({ ...s, notifyWhenGhosted: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-900 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 dark:focus:ring-offset-black"
              aria-label="Notify when an application is ghosted"
            />
            <label htmlFor="notify" className="text-sm text-gray-800 dark:text-gray-300">
              Notify me when an application is ghosted (14+ days in Applied)
            </label>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
            aria-label={saved ? "Settings saved" : "Save settings"}
          >
            {saved ? "Saved" : "Save settings"}
          </button>
        </div>
        {signedIn && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-900">
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-gray-200 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-black"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
