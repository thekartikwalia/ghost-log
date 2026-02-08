# GhostLog – Local setup (backend + extension)

You’ve already done: Google OAuth, load extension, put Client ID in extension.

Follow these steps to run the backend and see the full flow.

---

## Step 1: Backend config

### 1.1 Get your Google Client ID

Use the **same** OAuth 2.0 Client ID you put in the extension (the Web application client ID from Google Cloud Console).

### 1.2 Get Azure Table Storage connection string

You need a connection string so the backend can store applications.

**Option A – Azure (recommended)**  
1. Go to [Azure Portal](https://portal.azure.com) → create or open a **Storage account**.  
2. Left menu → **Access keys** → under **key1** (or key2), click **Show** and copy the **Connection string**.  
3. It looks like:  
   `DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx;EndpointSuffix=core.windows.net`

**Option B – Azurite (local emulator)**  
1. Install: `npm install -g azurite`  
2. Run: `azurite --table`  
3. Use this connection string in `local.settings.json`:  
   `DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;`

### 1.3 Edit `backend/local.settings.json`

Open `ghost-log/backend/local.settings.json` and set:

- **GOOGLE_CLIENT_ID** – Your Google OAuth Web client ID (same as in the extension), e.g.  
  `255866995720-khc9nq6kuhvbjb98pm21t8vrjg0u9nos.apps.googleusercontent.com`
- **AZURE_TABLE_STORAGE_CONNECTION_STRING** – The connection string from 1.2 (Azure or Azurite).

Leave the rest as-is. Do **not** commit this file if it contains real secrets.

---

## Step 2: Run the backend locally

### 2.1 Install Azure Functions Core Tools (one-time)

- **macOS (Homebrew):**  
  `brew tap azure/functions && brew install azure-functions-core-tools@4`
- **Windows (npm):**  
  `npm install -g azure-functions-core-tools@4`
- Or: [Install from Microsoft](https://docs.microsoft.com/azure/azure-functions/functions-run-local)

### 2.2 Install dependencies and start the backend

From the repo root:

```bash
cd ghost-log/backend
npm install
npm run start
```

You should see something like:

```
syncApplication: [GET,POST] http://localhost:7071/api/syncApplication
```

Your **API base URL** is: **`http://localhost:7071`**  
Leave this terminal open while you test.

---

## Step 3: Extension Options – set API URL

1. In Chrome, click the **GhostLog** icon (or open `chrome://extensions` and click “Details” on GhostLog).  
2. Click **Extension options** (or right‑click the icon → Options).  
3. In **API base URL**, enter exactly:  
   **`http://localhost:7071`**  
   (no trailing slash)  
4. Optionally turn on **“Notify me when an application is ghosted”**.  
5. Click **Save**.

---

## Step 4: See how it works

### 4.1 Sign in

1. Click the GhostLog icon to open the popup.  
2. Click **“Sign in with Google”**.  
3. Complete the Google sign‑in in the new tab.  
4. The popup should show the form (Company, Job Role, Source URL, Status).

### 4.2 Log an application

1. Keep the backend running (`npm run start` in the backend folder).  
2. In the popup, fill:
   - **Company** – e.g. `Test Company`
   - **Job Role** – e.g. `Software Engineer`
   - **Source URL** – e.g. `https://linkedin.com/jobs/view/123`
3. **Status** – e.g. **Applied**.  
4. Click **“Log to Dashboard”**.  
5. You should see **“Logged successfully.”** and no error.

If you see “API URL not set”, go back to **Step 3** and save the API URL again.

### 4.3 View the dashboard

1. In the popup, click **“Open Dashboard”**.  
2. You should see your application in the table (or Kanban if you switch view).  
3. Use **“Export CSV”** to download the list.

### 4.4 Optional: auto-fill from a job page

1. Open a job page (e.g. LinkedIn, Greenhouse, Lever).  
2. Open the GhostLog popup.  
3. Company / Role / Source URL may be pre-filled from the page.  
4. Click **“Log to Dashboard”** as above.

### 4.5 Optional: seed ghosted test data

To test the **Ghosted** filter (applications in "Applied" for 14+ days):

1. Sign in with the extension once so your user ID is set.
2. Get your user ID: in Chrome DevTools (F12) → **Application** → **Local Storage** → your extension → `ghostlog_user_id`, or run in the extension's context:  
   `chrome.storage.local.get(['ghostlog_user_id'], r => console.log(r.ghostlog_user_id))`
3. From the **backend** folder run:  
   `USER_ID=<paste-your-user-id> npm run seed`  
   (On Windows use `set USER_ID=...` then `npm run seed`.)
4. This adds 5 test applications with status **Applied** and applied dates 15–20 days ago.
5. Open the dashboard and click **👻 Ghosted (5)** to see them.

---

## Quick checklist

| Step | What to do | How you know it worked |
|------|------------|-------------------------|
| 1.3 | Edit `backend/local.settings.json` (Google Client ID + Storage connection string) | File saved. |
| 2.2 | In `backend/`: `npm install` then `npm run start` | Terminal shows `http://localhost:7071/api/syncApplication`. |
| 3 | Extension Options → API base URL = `http://localhost:7071` → Save | Options page shows the URL. |
| 4.1 | Popup → Sign in with Google | Form appears after sign-in. |
| 4.2 | Popup → fill form → Log to Dashboard | “Logged successfully.” |
| 4.3 | Popup → Open Dashboard | Your row appears; Export CSV works. |

---

## If something fails

- **“API URL not set”** – Set API base URL in Extension options and Save, then try again.  
- **“Please sign in again” / 401** – Sign out in Options, then sign in again in the popup.  
- **Backend won’t start** – Install Azure Functions Core Tools (Step 2.1) and run from `backend/` with `npm run start`.  
- **Table errors** – Check `AZURE_TABLE_STORAGE_CONNECTION_STRING` in `local.settings.json`; if using Azurite, run `azurite --table` first.
