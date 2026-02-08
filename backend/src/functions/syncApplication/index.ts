// GhostLog syncApplication HTTP trigger: POST (create), GET (list)

import { validateGoogleToken } from "../../middleware/validateGoogleToken";
import { createApplication, listApplicationsByUser, updateApplicationStatus } from "../../services/tableStorage";
import type { SyncPayload } from "../../types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface HttpRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string> | { get(name: string): string | null };
}

interface Context {
  res?: {
    status?: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
  log?: { error: (x: unknown) => void };
}

function getAuthHeader(req: HttpRequest): string | undefined {
  if (!req.headers) return undefined;
  if (typeof (req.headers as Record<string, string>).authorization === "string") {
    return (req.headers as Record<string, string>).authorization;
  }
  if (typeof (req.headers as { get(name: string): string | null }).get === "function") {
    return (req.headers as { get(name: string): string | null }).get("authorization") ?? undefined;
  }
  return undefined;
}

async function handler(context: Context, req: HttpRequest): Promise<void> {
  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers: CORS_HEADERS,
      body: undefined,
    };
    return;
  }

  const authHeader = getAuthHeader(req);
  const payload = await validateGoogleToken(authHeader);
  if (!payload) {
    context.res = {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unauthorized" }),
    };
    return;
  }

  const userId = payload.sub;

  if (req.method === "POST") {
    const body = req.body as Partial<SyncPayload>;
    const company = typeof body?.company === "string" ? body.company.trim() : "";
    const sourceUrl = typeof body?.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    const role = typeof body?.role === "string" ? body.role.trim() : "";
    const status = body?.status ?? "Applied";
    const validStatuses = ["Applied", "Interviewing", "Offer", "Rejected"];
    if (!company || !sourceUrl) {
      context.res = {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "company and sourceUrl are required" }),
      };
      return;
    }
    if (!validStatuses.includes(status)) {
      context.res = {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "invalid status" }),
      };
      return;
    }
    try {
      const created = await createApplication(userId, {
        company,
        role,
        sourceUrl,
        status,
      });
      context.res = {
        status: 201,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify(created),
      };
    } catch (err) {
      if (context.log) context.log.error(err);
      context.res = {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
    return;
  }

  if (req.method === "PATCH") {
    const body = req.body as { rowKey?: string; status?: string };
    const rowKey = typeof body?.rowKey === "string" ? body.rowKey.trim() : "";
    const status = body?.status ?? "";
    const validStatuses = ["Applied", "Interviewing", "Offer", "Rejected"];
    if (!rowKey || !validStatuses.includes(status)) {
      context.res = {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "rowKey and status (Applied|Interviewing|Offer|Rejected) are required" }),
      };
      return;
    }
    try {
      const updated = await updateApplicationStatus(userId, rowKey, status);
      if (!updated) {
        context.res = {
          status: 404,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Application not found" }),
        };
        return;
      }
      context.res = {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      };
    } catch (err) {
      if (context.log) context.log.error(err);
      context.res = {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
    return;
  }

  if (req.method === "GET") {
    try {
      const list = await listApplicationsByUser(userId);
      context.res = {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify(list),
      };
    } catch (err) {
      if (context.log) context.log.error(err);
      context.res = {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
    return;
  }

  context.res = {
    status: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
}

export default handler;
