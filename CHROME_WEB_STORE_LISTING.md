# GhostLog — Chrome Web Store Listing (Metadata & Copy)

Product Marketing Manager–ready copy for the GhostLog Chrome Extension. Use this document in the Chrome Web Store developer dashboard.

Replace `YOUR_USERNAME` / `YOUR_REPO` with your GitHub username or repo path before pasting.

---

## 1. PRODUCT DETAILS

### Title (for package)
**GhostLog: One-Click Job Application Tracker**  
*(44 characters — within 45-char limit.)*

### Summary (for package)
**Stop getting ghosted. Log every application in one click, track who’s gone quiet, and own your pipeline—from LinkedIn to Gmail.**  
*(118 characters — max 132.)*

### Description (long-form, 300–500 words)

Use the block below in the Chrome Web Store **Description** field. Written in Pain → Agitation → Solution style.

---

**The Problem: The Spreadsheet Nightmare**

You apply everywhere. Then you forget where. You dig through Gmail, LinkedIn, and random tabs to see who replied. Some companies never reply—you’re left wondering if you’re being ghosted. Spreadsheets are clunky. Manual copy-paste is tedious. Your pipeline becomes a mess.

**The Agitation**

Tracking applications by hand doesn’t scale. One missed follow-up can cost you an interview. Without a single place to see “Applied,” “Interviewing,” and “No response,” you’re always one step behind. You deserve a tool that works where you already are: on the job page and in your inbox.

**The Solution: One-Click Logging from Portals and Email**

GhostLog turns job application tracking into one click. Open the extension on a job posting—company, role, and source are filled for you. On Gmail or Outlook, log from your inbox with the current page as source. Log it. Move on. Your dashboard shows everything: table or Kanban, statuses, and which applications have gone quiet for 14+ days.

**Key Features**

- **Smart Scraper:** Detects company and role from LinkedIn, Greenhouse, Lever, and many job pages. On Gmail and Outlook, use the current page URL so you never lose an email application.
- **One-Click Logging:** Popup opens with fields pre-filled where possible. Set status (Applied, Interviewing, Offer, Rejected), then click “Log Application.” No copy-paste.
- **Unified Dashboard:** View all applications in a table or Kanban. Update status with a dropdown. See applied dates and source URLs. Copy links with one click. Export to CSV.
- **Ghosting Detection:** Applications stuck in “Applied” for 14+ days are clearly marked. Filter to “Ghosted” only. Optional notifications when an application is considered ghosted.
- **Light & Dark Theme:** Choose a theme that fits you. Works the same everywhere.

**Why GhostLog?**

- **Zero configuration:** Install, sign in with Google, start logging. No API keys or setup for store users.
- **Azure-backed:** Data is stored securely via Azure Functions and Table Storage. Reliable and scalable.
- **Student-built:** Focused on one job—tracking applications and spotting ghosting—without bloat.
- **Respects your data:** Your data stays in the service backend (or your own if you configure it). It is not sold to third parties.

Stop managing spreadsheets. Start owning your pipeline.

---

### Category
**Productivity**

### Language
**English (United States)**

---

## 2. GRAPHIC ASSET CONCEPTS (Descriptions for You to Create)

### Store Icon (128×128 px)

**Concept:** A professional logo inspired by the 👻 emoji—friendly ghost + “log/track.”

- **Visual:** A simple ghost silhouette (rounded body, two dots for eyes, no mouth or arms). Integrate a small “list” or “check” element—e.g. a tiny document with lines, or a checkmark—so it reads as “logging” or “tracking” without text.
- **Colours:** White or light ghost on a solid background: orange (`#f97316`) or dark slate (`#1e293b`) for contrast. Flat, no gradients.
- **Style:** Clean, recognizable at 128×128 and down to 48px. No gradients; works in store grid and toolbar.
- **Alternative:** Bold “GL” wordmark with a small ghost replacing the crossbar of the “G” or sitting beside the letters; same colour system.

### Screenshots (5 total — 1280×800 or 640×400, JPEG or 24-bit PNG)

**Screenshot 1**  
- **Caption:** “One click on any job page — company & role auto-filled.”  
- **Content:** Browser with a job page (e.g. LinkedIn or Greenhouse) visible. GhostLog popup open, showing Company, Role, Source URL, and Status pre-filled from the page. “Log to Dashboard” button visible. Clean crop on popup + a sliver of the job page for context.

**Screenshot 2**  
- **Caption:** “Log from Gmail and Outlook — never lose an application.”  
- **Content:** Gmail or Outlook Sent with an email open. GhostLog popup open with Source URL (current page) and optional company/role fields. Emphasizes “works in your inbox.”

**Screenshot 3**  
- **Caption:** “Your pipeline in one place — table or Kanban.”  
- **Content:** Full GhostLog Dashboard in Table view: header “GhostLog Dashboard,” table with Company, Role, Source, Status, Applied. Several rows with different statuses. “Ghosted” filter button and “Export CSV” visible in header.

**Screenshot 4**  
- **Caption:** “See who’s ghosting you — 14+ days, no response.”  
- **Content:** Dashboard with “👻 Ghosted (X)” filter active or highlighted. At least one row/card with “Applied” and 👻 icon. Optional: popup bar saying “You have X application(s) currently ghosting you” to reinforce the value.

**Screenshot 5**  
- **Caption:** “Change status anytime. Export to CSV. Light or dark.”  
- **Content:** Either (a) Dashboard with a status dropdown open (Applied / Interviewing / Offer / Rejected) and “Export CSV” in header, or (b) Options page with Theme (Light / Dark / System) and “Notify me when an application is ghosted.” Conveys control and customization.

### Small Promo Tile (440×280 px)

**Concept:** High-impact, store-safe.

- **Layout:** Left ~40%: GhostLog icon (ghost + list/check) or wordmark “GhostLog” in bold. Right ~60%: Short headline, e.g. “One-Click Job Tracking” or “Stop Getting Ghosted.”
- **Visual:** Solid background (dark slate or orange). White or light text. One accent colour. No long sentences.
- **Mood:** Professional, trustworthy, productivity-focused. Avoid playful or childish.

### Marquee Promo Tile (1400×560 px)

**Concept:** Hero-style banner for featured spots.

- **Layout:** Center or left-aligned: “GhostLog” (large) + tagline “One-Click Job Application Tracker” or “Log from LinkedIn, Gmail & more. See who’s ghosting you.” Right side: Composite of popup + dashboard thumbnail, or simple illustration (ghost + checklist).
- **Visual:** Same colour system as small tile. Plenty of negative space. Readable at a glance.
- **Avoid:** Dense text, more than two type sizes, or cluttered UI.

---

## 3. ADDITIONAL FIELDS

### Homepage URL
- **If you have a landing page:** Use it (e.g. Azure Static Web App: `https://<your-app>.azurestaticapps.net` or custom domain).
- **Otherwise:** Use the GitHub repo URL: `https://github.com/YOUR_USERNAME/ghost-log`.
- **Placeholder for copy:** `https://github.com/YOUR_USERNAME/ghost-log`

### Support URL
- **Recommended:** GitHub Issues: `https://github.com/YOUR_USERNAME/ghost-log/issues`.
- **Alternative:** Contact/support page or `mailto:support@yourdomain.com`.
- **Placeholder for copy:** `https://github.com/YOUR_USERNAME/ghost-log/issues`

### Mature Content
**No.** GhostLog does not contain sexual or suggestive content, strong language, violence, or content focused on alcohol, tobacco, or drugs.

---

## 4. PRIVACY POLICY & DATA USAGE (CRITICAL)

### Purpose Statement (for the Privacy tab / Single Purpose)

**Purpose:**  
GhostLog helps users track their job applications in one place. The extension reads the **current tab or page only** to pre-fill job details (company, role, source URL) when the user clicks the extension icon, and stores the user’s preferences and cached data **locally**. Account and application data are sent **only** to the user’s chosen backend (the publisher’s Azure-hosted service or the user’s own backend if configured) for syncing and storage. Data is **not** used for advertising, **not** sold to third parties, and **not** used for purposes unrelated to job-application tracking and sync.

---

### Why We Need These Permissions

| Permission | Why we need it |
|------------|----------------|
| **Tabs** | To get the URL of the active tab when the user opens the popup, so we can save the “Source” (job or email URL) for each application and offer one-click logging from the current page. |
| **ActiveTab** | To run the scraper only on the tab the user is viewing when they click the extension. We read page content (e.g. job title, company name) **only on that tab** to auto-fill the log form. |
| **Storage** | To store the user’s settings (e.g. theme, notify when ghosted), cached page data for instant popup load, and OAuth-related data so the user stays signed in. |
| **Scripting** | To inject the scraper script on job or email pages when the content script is not already loaded, so logging works on as many job sites as possible. |
| **Identity** | To sign the user in with Google (OAuth) so their applications are synced to their account securely. |
| **Notifications** | Optional: to notify the user when an application is marked as “ghosted” (14+ days in “Applied” with no response), if they enable this in Options. |
| **Alarms** | To run the optional ghost-check in the background on a schedule (e.g. daily) when “Notify when ghosted” is enabled. |
| **Host permissions (https/http)** | To call the backend API (Azure Function) for syncing applications and to load the scraper on job and email sites (e.g. LinkedIn, Gmail, Outlook). |

---

### Data Storage & Third-Party Sale

**Data storage:**  
Application data (company, role, source URL, status, applied date) and account linkage (e.g. Google ID) are stored in the **publisher’s Azure-hosted backend** (Azure Functions + Azure Table Storage). Users who configure their own API URL store data in **their own backend instance**. Data is **not** stored on third-party ad or analytics servers for advertising purposes.

**Third-party sale:**  
We **do not sell** user data to third parties. Data is used only to provide the extension’s functionality: logging applications, syncing across the user’s devices, displaying the dashboard, optional ghosting notifications, and export (e.g. CSV). No data is shared with advertisers or data brokers.

*(Include the above in your public Privacy Policy page and, where relevant, in the Chrome Web Store “Privacy practices” or “Single purpose” description.)*

---

## COPY-PASTE VALUES (Chrome Web Store form)

| Field | Value |
|-------|--------|
| **Title** | GhostLog: One-Click Job Application Tracker |
| **Summary** | Stop getting ghosted. Log every application in one click, track who's gone quiet, and own your pipeline—from LinkedIn to Gmail. |
| **Category** | Productivity |
| **Language** | English (United States) |
| **Homepage URL** | https://github.com/YOUR_USERNAME/ghost-log |
| **Support URL** | https://github.com/YOUR_USERNAME/ghost-log/issues |
| **Mature content** | No |

**Privacy / Single purpose (paste into the form):**

```
GhostLog helps users track their job applications in one place. The extension reads the current tab or page only to pre-fill job details (company, role, source URL) when the user clicks the extension icon, and stores the user's preferences and cached data locally. Account and application data are sent only to the user's chosen backend (the publisher's Azure-hosted service or the user's own backend if configured) for syncing and storage. Data is not used for advertising, sold to third parties, or used for purposes unrelated to job-application tracking and sync.
```

---

*End of Chrome Web Store Listing document.*
