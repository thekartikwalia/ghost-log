# GhostLog: Deploy Backend & Publish on Chrome Web Store

This guide covers deploying the backend so all users share one API, and publishing the extension so **users never have to set an API URL**—it’s baked in at build time.

---

## 1. Deploy the backend (Azure Functions)

Your backend is the single API all extension users will call. Deploy it once and use its URL when building the extension.

### Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) and [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- Azure subscription
- Storage account (for Azure Table Storage)

**Region:** The examples use `centralindia`. If your subscription has a region policy, use an allowed region instead (e.g. `southeastasia`, `eastasia`, `uaenorth`, `malaysiawest`). Use the **same** region for resource group, storage account, and `--consumption-plan-location`.

### Steps

1. **Create a Function App** (if you don’t have one):

   **If you already have a storage account**, skip the storage-account creation and use your existing name and resource group. Use a **region allowed by your subscription** (e.g. `centralindia`, `southeastasia`, `eastasia`, `uaenorth`, `malaysiawest`):

   ```bash
   az login
   # Use your existing resource group, or create one (use an allowed region):
   # az group create --name ghostlog-rg --location centralindia

   # Get connection string from your EXISTING storage account (replace <your-storage-name> and <your-resource-group>):
   az storage account show-connection-string --name <your-storage-name> --resource-group <your-resource-group> -o tsv

   # Create the Function App (--consumption-plan-location must be a region your subscription allows):
   az functionapp create \
     --resource-group <your-resource-group> \
     --consumption-plan-location centralindia \
     --runtime node \
     --runtime-version 24 \
     --functions-version 4 \
     --name ghostlog-api \
     --storage-account <your-storage-name>
   ```

   **If you don’t have a storage account yet**, create everything from scratch. Use the same region everywhere (e.g. `centralindia`; if you get a region policy error, try `southeastasia`, `eastasia`, `uaenorth`, or `malaysiawest`):

   ```bash
   az login
   az group create --name ghostlog-rg --location centralindia
   az storage account create --name ghostlogstorage --resource-group ghostlog-rg --sku Standard_LRS
   az storage account show-connection-string --name ghostlogstorage --resource-group ghostlog-rg -o tsv
   az functionapp create \
     --resource-group ghostlog-rg \
     --consumption-plan-location centralindia \
     --runtime node \
     --runtime-version 24 \
     --functions-version 4 \
     --name ghostlog-api \
     --storage-account ghostlogstorage
   ```

2. **Configure app settings** (replace with your values; if you used a custom resource group or function app name in step 1, use those same names here):

   ```bash
   az functionapp config appsettings set --name ghostlog-api --resource-group ghostlog-rg --settings \
     AZURE_TABLE_STORAGE_CONNECTION_STRING="<your-storage-connection-string>" \
     GOOGLE_CLIENT_ID="<your-google-oauth-client-id>"
   ```

3. **Build and publish** from the repo root:

   ```bash
   cd backend
   npm run build
   cd dist
   func azure functionapp publish ghostlog-api
   ```

4. **Note the URL**  
   Your API base URL will be:  
   `https://ghostlog-api.azurewebsites.net`  
   (or whatever `--name` you used). Use this in the next step.

5. **CORS**  
   In Azure Portal → Function App → CORS, add `https://<extension-id>.chromiumapp.org` and/or use `*` for development. For the published extension, Chrome uses the extension origin; you may need to allow that or use a broad rule per [Azure CORS docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings#cors).

---

## 2. Build the extension for production (Chrome Web Store)

Bake your deployed API URL into the extension so **users don’t configure anything**. Only users who want their own backend use Options to override.

1. **Set the production API URL** when building:

   ```bash
   cd extension
   # Option A: env file (create .env.production, do not commit secrets)
   echo 'VITE_API_BASE_URL=https://ghostlog-api.azurewebsites.net' > .env.production

   # Option B: inline
   VITE_API_BASE_URL=https://ghostlog-api.azurewebsites.net npm run build
   ```

   Replace `https://ghostlog-api.azurewebsites.net` with your actual Function App URL (no trailing slash).

2. **Build**:

   ```bash
   npm run build
   ```

3. **Package for Chrome Web Store**  
   Zip the **contents** of `dist/` (not the folder itself):

   - Include: `manifest.json`, `*.html`, `*.js`, `assets/`, `theme-init.js`, etc.
   - Do **not** include: `node_modules`, source files, or `.env*`.

   ```bash
   cd dist
   zip -r ../ghostlog-extension.zip .
   cd ..
   # ghostlog-extension.zip is ready for upload
   ```

   On Windows (PowerShell):  
   `Compress-Archive -Path dist\* -DestinationPath ghostlog-extension.zip`

---

## 3. Publish on Chrome Web Store

### 3.1 Developer account

- Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
- Sign in with a Google account and pay the **one-time $5 developer registration fee**.

### 3.2 Create a new item

- Click **“New item”**.
- Upload `ghostlog-extension.zip`.

### 3.3 Store listing

Fill in:

- **Short description** (e.g. “One-click job application tracking from LinkedIn, Greenhouse, and more.”)
- **Detailed description** (features, that data is stored in your backend, sign-in with Google, etc.)
- **Category** (e.g. Productivity)
- **Language** (e.g. English)
- **Screenshots** (popup, dashboard, options—recommended 1280x800 or 640x400)
- **Small promo tile** (440x280) and **marquee** (1400x560) if you want a store listing image
- **Privacy policy URL** (required)—host a page explaining what data the extension collects (e.g. Google sign-in, job data sent to your backend) and how it’s used/stored.

### 3.4 Permissions justification

Chrome may ask you to justify permissions. Be ready to explain:

- **identity** – Google Sign-In
- **storage** – settings and cache
- **tabs / activeTab** – current tab URL for autofill
- **scripting** – inject scraper on job pages when needed
- **host_permissions** – fetch your API and scrape job sites

### 3.5 Submit for review

- Set **visibility** (e.g. “Public” or “Unlisted”).
- Click **“Submit for review”**.  
  Review usually takes from a few hours to a few days.

---

## 4. After publish

- **Users**: Install from the store → Sign in with Google → Use the extension. No API URL to set.
- **Updates**: Bump `version` in `extension/public/manifest.json`, rebuild with the same `VITE_API_BASE_URL`, re-zip, and upload a new package in the developer dashboard.
- **Your backend**: All store users hit the same API URL you baked in; ensure your Azure plan and Table Storage scale and that you comply with privacy/terms.

---

## 5. Optional: package script

Add to `extension/package.json` for a one-command production build (replace the URL with yours or use env):

```json
"scripts": {
  "build:store": "VITE_API_BASE_URL=https://ghostlog-api.azurewebsites.net npm run build"
}
```

Then run: `npm run build:store` and zip `dist/` as above.
