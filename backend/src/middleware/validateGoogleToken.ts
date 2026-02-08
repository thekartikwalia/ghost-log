// Validate Google ID token and return userId (sub)

import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface TokenPayload {
  sub: string;
  email?: string;
}

export async function validateGoogleToken(authHeader: string | undefined): Promise<TokenPayload | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return null;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) return null;
    return {
      sub: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}
