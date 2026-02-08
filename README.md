# GhostLog

**Title:** GhostLog: One-Click Job Application Tracker 
**Description:** Stop getting ghosted. Log every application in one click, track who’s gone quiet, and own your pipeline — from LinkedIn to Gmail.

A Chrome Extension + Azure backend for job seekers: auto-scrape job portals and email (Sent), log applications with status, and track "ghosted" applications (14+ days in Applied).

## Structure

- **extension/** – Chrome Extension (Vite + React + Tailwind, Manifest V3)
- **backend/** – Azure Functions (Node.js/TypeScript) + Azure Table Storage

## Extension setup

1. **Google OAuth**
   - Create an OAuth 2.0 Client (Web application) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Add authorized redirect URI: `https://<extension-id>.chromiumapp.org/` (get extension ID from `chrome://extensions` after loading unpacked).
   - Put the Client ID in `extension/public/manifest.json` under `oauth2.client_id` (replace `YOUR_GOOGLE_OAUTH_CLIENT_ID`).

2. **Build**
   ```bash
   cd extension && npm ci && npm run build
   ```

3. **Load**
   - Open `chrome://extensions`, enable Developer mode, Load unpacked, select `extension/dist`.

4. **Options**
   - For **local/dev**: Set the API base URL (e.g. `http://localhost:7071`) in Options.
   - For **Chrome Web Store**: Build with `VITE_API_BASE_URL=https://your-api.azurewebsites.net`; users then use the default server and don’t need to set API URL. See [DEPLOY.md](DEPLOY.md).

## Backend setup

1. **Config**
   - Copy `backend/local.settings.json` and set:
     - `AZURE_TABLE_STORAGE_CONNECTION_STRING` (Azure Storage account)
     - `GOOGLE_CLIENT_ID` (same as extension OAuth client ID, or a Web client ID for token verification).

2. **Build & run**
   ```bash
   cd backend && npm ci && npm run build && cd dist && func start
   ```

3. **Deploy & publish**
   - See **[DEPLOY.md](DEPLOY.md)** for full steps: deploy backend to Azure, build extension with production API URL, and publish on Chrome Web Store (no API URL for end users).
   - Quick deploy: `./deploy.sh` or Azure CLI + `func azure functionapp publish <name>`; set app settings for connection string and Google Client ID.

## Features

- **Smart scraper:** Job portals (LinkedIn, Greenhouse, Lever) → company/role from title and meta; Gmail/Outlook Sent → recipient and subject.
- **Popup:** Sign in with Google, auto-filled form, status dropdown, Log to Dashboard.
- **Dashboard:** Table or Kanban, ghost badge (14+ days in Applied), Export CSV.
- **Options:** API URL, notify when ghosted, Sign out.
- **Backend:** POST/GET `syncApplication` with Google ID token; Azure Table Storage (PartitionKey: UserID, RowKey: GUID).
