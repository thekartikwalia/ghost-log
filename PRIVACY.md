# GhostLog Privacy Policy

**Last updated:** [DATE]

GhostLog ("we," "our," or "the extension") is committed to putting your privacy first. This policy explains what data we collect, how we use it, and where it is stored.

---

## 1. Data We Collect

We only collect data you **explicitly save** when using the extension.

- **Job application data:** Company name, role/title, source URL, status (e.g. Applied, Interviewing, Offer, Rejected), and applied date. This is collected only when you click **"Log to Dashboard"** (or equivalent) in the extension popup.
- **Account linkage:** A unique identifier from your Google sign-in (e.g. Google account ID) so we can associate your applications with your account and sync them securely. We do not store your email content, passwords, or full profile data beyond what is needed for authentication.
- **Settings:** Your preferences (e.g. theme, optional "notify when ghosted," optional API base URL if you use your own backend) stored locally in the extension.

We do **not** collect data in the background. We do **not** read your emails, messages, or browsing history except as described below.

---

## 2. When We Access Page Content

We access the **current tab** only when **you** open the GhostLog popup (click the extension icon).

- **On job portals** (e.g. LinkedIn, Greenhouse, Lever): We may read job-related metadata (e.g. job title, company name, page URL) from the visible page **only** to pre-fill the log form. You can edit or clear these fields before saving.
- **On email pages** (e.g. Gmail, Outlook): We only use the **current page URL** as the source for the application. We do **not** read your email content, subject lines, or recipient addresses unless you manually enter them. We never see the body of your emails.

All access is limited to the single tab you have open when you click the extension. We do not scan other tabs or your browsing history.

---

## 3. Where Your Data Is Stored

- **Application data and account linkage** are stored in a **private Azure database** (Azure Table Storage) operated by the publisher. Only you and the extension’s backend can access your data for syncing and displaying your dashboard. If you configure your own API URL in the extension options, your application data is sent only to **your** backend instance.
- **Settings and cached pre-fill data** are stored **locally** in your browser (Chrome’s local storage for the extension). They are not sent to third-party servers for advertising or analytics.

We do **not** sell, rent, or share your data with advertisers, data brokers, or any third parties for their marketing or other purposes.

---

## 4. How We Use Your Data

Your data is used **only** to provide the extension’s functionality:

- Logging and syncing your job applications across sessions.
- Displaying your dashboard (table or Kanban) and status (e.g. ghosted applications).
- Optional notifications (e.g. "application ghosted" after 14+ days) if you enable them in options.
- Export (e.g. CSV) that you initiate.

We do **not** use your data for advertising, creditworthiness checks, or any purpose unrelated to job-application tracking and sync.

---

## 5. Your Choices

- You can **sign out** in the extension options to disconnect your account; application data already stored in the backend remains until you or the service deletes it.
- You can **clear local data** by removing the extension or clearing site data for the extension.
- If you use your own backend (custom API URL), you control that data according to your own policies.

---

## 6. Changes to This Policy

We may update this privacy policy from time to time. The "Last updated" date at the top will be revised, and we encourage you to review this page periodically.

---

## 7. Contact

For questions about this privacy policy or GhostLog’s data practices, please open an issue at [GitHub repository URL] or contact us at [your contact email or support URL].
