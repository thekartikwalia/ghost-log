// GhostLog content script - smart scraper for job portals and email
// Portal-specific selectors with fallback to title/meta parsing

import type { PageData } from "../shared/types";

const LINKEDIN_HOST = "linkedin.com";
const GREENHOUSE_HOST = "greenhouse.io";
const LEVER_HOST = "lever.co";
const GMAIL_HOST = "mail.google.com";
const OUTLOOK_HOSTS = ["outlook.live.com", "outlook.office.com", "outlook.office365.com"];

function getMetaContent(name: string): string {
  const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return el?.getAttribute("content")?.trim() || "";
}

function getOgTitle(): string {
  return getMetaContent("og:title") || document.title || "";
}

function getCanonicalOrHref(): string {
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
  return canonical?.trim() || window.location.href;
}

function text(selector: string): string {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() || "";
}

function deriveCompanyAndRoleFromTitle(title: string): { company: string; role: string } {
  const cleaned = title.trim();
  if (!cleaned) return { company: "", role: "" };
  const atIdx = cleaned.toLowerCase().indexOf(" at ");
  const pipeParts = cleaned.split("|").map((s) => s.trim()).filter(Boolean);
  const dashParts = cleaned.split(/[\u2013\u2014–—\-]/).map((s) => s.trim()).filter(Boolean);
  if (atIdx >= 0) {
    const role = cleaned.slice(0, atIdx).trim();
    const rest = cleaned.slice(atIdx + 4).trim();
    const beforePipe = rest.split("|")[0].trim();
    return { role, company: beforePipe || rest };
  }
  if (pipeParts.length >= 2) {
    const first = pipeParts[0];
    const second = pipeParts[1];
    if (second.toLowerCase().includes("linkedin") || second.toLowerCase().includes("jobs"))
      return { role: first, company: pipeParts.length > 2 ? pipeParts[1] : "" };
    return { role: first, company: second };
  }
  if (dashParts.length >= 2) {
    return { role: dashParts[0], company: dashParts[1] };
  }
  return { company: "", role: cleaned };
}

// LinkedIn: job detail page and search results
function scrapeLinkedIn(): PageData {
  const url = getCanonicalOrHref();
  let company = "";
  let role = "";

  // Job detail page (single job view) - try multiple known class patterns
  const titleSelectors = [
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    "h1.t-24",
    "h1[data-test-id='job-details-header-title']",
    ".job-details-how-you-match__card-header-row h2",
    "h1",
  ];
  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name",
    ".job-details-how-you-match__card-header-row a",
    "a[data-tracking-control-name='job_details_company_link']",
    ".jobs-poster__name",
    ".job-details-jobs-unified-top-card__primary-description a",
  ];
  for (const sel of titleSelectors) {
    role = text(sel);
    if (role && role.length < 200) break;
  }
  for (const sel of companySelectors) {
    company = text(sel);
    if (company && company.length < 200) break;
  }

  // Search results list (job cards)
  if (!role) role = text(".base-search-card__title");
  if (!company) company = text(".base-search-card__subtitle");

  // Fallback: og:title / document.title parsing
  if (!role || !company) {
    const ogTitle = getOgTitle() || document.title || "";
    const parsed = deriveCompanyAndRoleFromTitle(ogTitle);
    if (!role) role = parsed.role;
    if (!company) company = parsed.company;
  }

  return {
    company: company.slice(0, 200),
    role: role.slice(0, 200),
    sourceUrl: url,
    platform: "linkedin",
  };
}

// Greenhouse: job board and job detail
function scrapeGreenhouse(): PageData {
  const url = getCanonicalOrHref();
  let company = "";
  let role = "";

  const titleSelectors = [
    ".app-title",
    "h1.app-title",
    ".content h1",
    "h1",
    "[data-qa='job-detail-heading']",
  ];
  const companySelectors = [
    ".company-name",
    ".branding .company-name",
    "header .company-name",
    ".content .company",
    "h2.company",
    "header h2",
    "header img[alt]",
  ];
  for (const sel of titleSelectors) {
    role = text(sel);
    if (role && role.length < 200) break;
  }
  for (const sel of companySelectors) {
    company = text(sel);
    if (!company) {
      const el = document.querySelector(sel);
      if (el?.getAttribute("alt")) company = el.getAttribute("alt") || "";
    }
    if (company && company.length < 200) break;
  }

  if (!role || !company) {
    const ogTitle = getOgTitle() || document.title || "";
    const parsed = deriveCompanyAndRoleFromTitle(ogTitle);
    if (!role) role = parsed.role;
    if (!company) company = parsed.company;
  }

  // Company from page title / meta (e.g. "Careers at Company Name")
  if (!company && url) {
    const title = document.title || getMetaContent("og:title") || "";
    const atMatch = title.match(/\bat\s+(.+?)(?:\s*[|\-–]|$)/i);
    if (atMatch) company = atMatch[1].trim();
  }

  return {
    company: company.slice(0, 200),
    role: role.slice(0, 200),
    sourceUrl: url,
    platform: "greenhouse",
  };
}

// Lever: jobs.lever.co/company-slug/posting-id
function scrapeLever(): PageData {
  const url = getCanonicalOrHref();
  let company = "";
  let role = "";

  // Company from URL: jobs.lever.co/CompanyName or jobs.lever.co/company-name
  const leverMatch = url.match(/jobs\.lever\.co\/([^/]+)/);
  if (leverMatch) {
    const slug = leverMatch[1];
    company = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  const titleSelectors = [
    ".posting-headline h1",
    ".posting-headline h2",
    "h1.posting-headline",
    ".content h1",
    "h1",
    ".main-header h1",
  ];
  for (const sel of titleSelectors) {
    role = text(sel);
    if (role && role.length < 200) break;
  }

  if (!role || !company) {
    const ogTitle = getOgTitle() || document.title || "";
    const parsed = deriveCompanyAndRoleFromTitle(ogTitle);
    if (!role) role = parsed.role;
    if (!company) company = parsed.company;
  }

  return {
    company: company.slice(0, 200),
    role: role.slice(0, 200),
    sourceUrl: url,
    platform: "lever",
  };
}

// Generic job portal fallback (title + meta)
function scrapeJobPortalGeneric(): PageData {
  const url = getCanonicalOrHref();
  const ogTitle = getOgTitle() || document.title || "";
  const { company, role } = deriveCompanyAndRoleFromTitle(ogTitle);
  const desc = getMetaContent("og:description");
  const roleFallback = role || desc.slice(0, 100) || "";
  return {
    company: company.slice(0, 200),
    role: (role || roleFallback).slice(0, 200),
    sourceUrl: url,
    platform: "other",
  };
}

function scrapeGmail(): PageData {
  return {
    company: "",
    role: "",
    sourceUrl: window.location.href,
    platform: "gmail",
  };
}

function scrapeOutlook(): PageData {
  return {
    company: "",
    role: "",
    sourceUrl: window.location.href,
    platform: "outlook",
  };
}

function scrapePage(): PageData {
  const host = window.location.hostname?.toLowerCase() || "";
  if (host.includes(GMAIL_HOST)) {
    return scrapeGmail();
  }
  if (OUTLOOK_HOSTS.some((h) => host.includes(h))) {
    return scrapeOutlook();
  }
  if (host.includes(LINKEDIN_HOST)) return scrapeLinkedIn();
  if (host.includes(GREENHOUSE_HOST)) return scrapeGreenhouse();
  if (host.includes(LEVER_HOST)) return scrapeLever();
  return scrapeJobPortalGeneric();
}

chrome.runtime.onMessage.addListener(
  (
    msg: { type: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: PageData) => void
  ) => {
    if (msg.type === "GET_PAGE_DATA") {
      sendResponse(scrapePage());
    }
    return true;
  }
);
