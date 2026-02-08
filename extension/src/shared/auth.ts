// GhostLog auth - Google ID token via chrome.identity, storage, sign-out

import { STORAGE_KEYS } from "./types";

export interface AuthState {
  idToken: string | null;
  userId: string | null;
  signedIn: boolean;
}

export function getStoredAuth(): Promise<AuthState> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER_ID], (result) => {
      const idToken = (result[STORAGE_KEYS.TOKEN] as string) || null;
      const userId = (result[STORAGE_KEYS.USER_ID] as string) || null;
      resolve({
        idToken,
        userId,
        signedIn: !!(idToken && userId),
      });
    });
  });
}

/**
 * Get Google ID token. Uses chrome.identity.getAuthToken then exchanges
 * for ID token via Google's tokeninfo (or backend). For Chrome extension
 * we use getAuthToken; the backend can accept access token or we exchange
 * for ID token. Plan says backend validates ID token - so we need ID token.
 * chrome.identity.getAuthToken returns an access token; to get ID token we
 * can use launchWebAuthFlow with Google OAuth or use a backend endpoint
 * that exchanges access token for ID token. Simpler: use getAuthToken
 * and pass that to backend; backend would need to accept OAuth2 access
 * token and call Google userinfo. Alternatively: use launchWebAuthFlow
 * with response_type=id_token to get ID token directly.
 * Per plan: "send ID token" - so we'll use getAuthToken and assume backend
 * can validate it, OR we decode the access token... Actually Google's
 * getAuthToken returns an access token, not ID token. So we have two options:
 * 1) Backend accepts access token and uses it to call Google userinfo, then
 *    uses sub from there as userId.
 * 2) Extension uses launchWebAuthFlow with openid and get id_token in the
 *    redirect fragment.
 * Plan says "Validate Authorization: Bearer <id_token>" and "verify ID token"
 * so backend expects ID token. So we need to get ID token in the extension.
 * Google Sign-In for Chrome extension: getAuthToken gives access token.
 * To get ID token we can use the tokeninfo API: GET
 * https://oauth2.googleapis.com/tokeninfo?id_token=XXX - but that expects
 * id_token, not access_token. So we need to use OAuth flow that returns
 * id_token. With launchWebAuthFlow we can use Google's OAuth with
 * response_type=id_token and nonce to get id_token in the redirect.
 * For simplicity: use getAuthToken (access token), send it to backend,
 * and have backend use Google's tokeninfo with access_token to validate
 * and get user info (sub). So backend would call
 * https://www.googleapis.com/oauth2/v2/userinfo?access_token=XXX
 * and get sub from the response. Then we don't need id_token in the
 * extension. Let me keep the plan's "ID token" wording but implement
 * with getAuthToken; we'll store the access token and send it as
 * Bearer. Backend can be updated to accept access token and call userinfo
 * (many backends do this). If we want strict ID token validation, we'd
 * use launchWebAuthFlow. I'll implement getAuthToken and store/send that
 * token; backend middleware can verify either ID token or access token
 * (userinfo endpoint). So auth.ts will: getAuthToken (interactive),
 * store token and optionally get userId from backend or from decoding
 * (we can't decode access token for sub without calling userinfo).
 * So: getAuthToken -> store token -> call backend /me or first POST with
 * token -> backend returns or we get userId from backend response on first
 * call. So we don't need to store userId from token; we get it from backend
 * after first successful call. For now store idToken (which is actually
 * access token from getAuthToken) and userId we get from backend after
 * first validated request. Backend will return userId in response or we
 * derive from token. Actually plan says "backend validates token and uses
 * sub as userId" - so backend gets sub from token. So backend must receive
 * ID token to decode sub. So we need ID token in extension. Way to get
 * ID token in Chrome extension: use launchWebAuthFlow with
 * https://accounts.google.com/o/oauth2/v2/auth?client_id=...&response_type=id_token
 * &redirect_uri=...&scope=openid%20email%20profile&nonce=...
 * Redirect URI for extension: use chrome.identity.getRedirectURL().
 * So in auth.ts we'll implement getGoogleIdToken() that uses
 * launchWebAuthFlow with Google's OAuth URL for id_token, then parse
 * the fragment and return id_token. Let me implement that.
 */
const getRedirectUrl = (): string => {
  return chrome.identity.getRedirectURL();
};

const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
};

export async function getGoogleIdToken(interactive: boolean): Promise<{ idToken: string; userId: string }> {
  // Use launchWebAuthFlow to get ID token (openid connect)
  const clientId = chrome.runtime.getManifest().oauth2?.client_id;
  if (!clientId || clientId.includes("YOUR_GOOGLE")) {
    throw new Error("Google OAuth client ID not configured. Update manifest.json oauth2.client_id.");
  }
  const redirectUrl = getRedirectUrl();
  const nonce = generateNonce();
  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      response_type: "id_token",
      redirect_uri: redirectUrl,
      scope: "openid email profile",
      nonce,
      prompt: interactive ? "consent" : "none",
    }).toString();

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url,
        interactive,
      },
      (callbackUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!callbackUrl) {
          reject(new Error("No callback URL"));
          return;
        }
        const hash = new URL(callbackUrl).hash.slice(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get("id_token");
        if (!idToken) {
          reject(new Error("No id_token in response"));
          return;
        }
        // Decode JWT payload to get sub (userId) without verification (backend will verify)
        try {
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          const userId = payload.sub as string;
          if (!userId) reject(new Error("No sub in token"));
          else resolve({ idToken, userId });
        } catch {
          reject(new Error("Invalid id_token payload"));
        }
      }
    );
  });
}

export async function signInWithGoogle(): Promise<AuthState> {
  const { idToken, userId } = await getGoogleIdToken(true);
  await new Promise<void>((resolve, reject) => {
    chrome.storage.local.set(
      {
        [STORAGE_KEYS.TOKEN]: idToken,
        [STORAGE_KEYS.USER_ID]: userId,
      },
      () => (chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve())
    );
  });
  return { idToken, userId, signedIn: true };
}

export async function ensureSignedIn(interactive: boolean): Promise<AuthState> {
  const stored = await getStoredAuth();
  if (stored.signedIn && stored.idToken) {
    // Optionally refresh token (try non-interactive first)
    try {
      const { idToken, userId } = await getGoogleIdToken(false);
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set(
          {
            [STORAGE_KEYS.TOKEN]: idToken,
            [STORAGE_KEYS.USER_ID]: userId,
          },
          () => (chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve())
        );
      });
      return { idToken, userId, signedIn: true };
    } catch {
      // Token expired or invalid; fall through to interactive if requested
    }
  }
  if (!interactive) return stored;
  return signInWithGoogle();
}

export async function signOut(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER_ID], () =>
      chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve()
    );
  });
}
