const ACCESS_TOKEN_KEY = "smartlink_access_token";
const REFRESH_TOKEN_KEY = "smartlink_refresh_token";
const ROLE_KEY = "smartlink_role";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

type AuthRole = "super_admin" | "admin" | "moderator" | "auditor" | "expert" | "client";
type SocialProvider = "google" | "azure";

type AuthApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type LoginResult =
  | {
      mfaRequired: true;
      ticket: string;
      role: AuthRole;
      methods: string[];
    }
  | {
      mfaRequired: false;
      role: AuthRole;
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };

export type RegisterResult = {
  userId: string;
  email: string;
  role: "expert" | "client";
  emailVerified: boolean;
  verificationRequired: boolean;
};

function getStoredRole() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ROLE_KEY) || "";
}

function parseApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const asRecord = payload as Record<string, unknown>;
    const message = typeof asRecord.message === "string" ? asRecord.message : fallback;
    const details = asRecord.details && typeof asRecord.details === "object" ? (asRecord.details as Record<string, unknown>) : null;
    const primaryCode = details && typeof details.code === "string" ? details.code : null;
    const raw = details && details.raw && typeof details.raw === "object" ? (details.raw as Record<string, unknown>) : null;
    const supabaseErrorCode = raw && typeof raw.error_code === "string" ? raw.error_code : null;
    const code = supabaseErrorCode || primaryCode;
    const err = new Error(message);
    (err as Error & { code?: string }).code = code || undefined;
    return err;
  }
  return new Error(fallback);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw parseApiError(payload, `Auth request failed (${response.status})`);
  }

  return payload as T;
}

function persistSession(tokens: { accessToken: string; refreshToken?: string; role?: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
  if (tokens.role) {
    localStorage.setItem(ROLE_KEY, tokens.role);
  }
}

export function getAdminAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function getRefreshToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export async function signInWithPassword(email: string, password: string, role?: AuthRole, captchaToken?: string) {
  const response = await requestJson<AuthApiResponse<LoginResult>>("/auth/login/password", {
    method: "POST",
    body: JSON.stringify({ email, password, role, captchaToken }),
  });

  if (!response.data.mfaRequired) {
    persistSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      role: response.data.role,
    });
  }

  return response.data;
}

export async function signInAdminWithPassword(email: string, password: string) {
  return signInWithPassword(email, password, "admin");
}

export async function startSocialLogin(provider: SocialProvider, redirectTo: string) {
  const response = await requestJson<AuthApiResponse<{ authUrl: string }>>("/auth/login/social", {
    method: "POST",
    body: JSON.stringify({ provider, redirectTo }),
  });
  return response.data;
}

export async function exchangeSocialToken(supabaseAccessToken: string) {
  const response = await requestJson<AuthApiResponse<LoginResult>>("/auth/login/social/exchange", {
    method: "POST",
    body: JSON.stringify({ supabaseAccessToken }),
  });

  if (!response.data.mfaRequired) {
    persistSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      role: response.data.role,
    });
  }

  return response.data;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  role: "expert" | "client";
  fullName?: string;
  expertId?: string;
}) {
  const response = await requestJson<AuthApiResponse<RegisterResult>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function resendVerification(email: string) {
  const response = await requestJson<AuthApiResponse<unknown>>("/auth/email/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return response.data;
}

export async function sendEmailOtp(ticket: string) {
  const response = await requestJson<AuthApiResponse<{ challengeId: string; expiresAt: string; delivery: string; devCode?: string }>>(
    "/auth/mfa/email/send",
    {
      method: "POST",
      body: JSON.stringify({ ticket }),
    },
  );
  return response.data;
}

export async function verifyEmailOtp(ticket: string, code: string) {
  const response = await requestJson<AuthApiResponse<LoginResult>>("/auth/mfa/email/verify", {
    method: "POST",
    body: JSON.stringify({ ticket, code }),
  });

  if (!response.data.mfaRequired) {
    persistSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      role: response.data.role,
    });
  }

  return response.data;
}

export async function verifyTotpChallenge(ticket: string, code: string) {
  const response = await requestJson<AuthApiResponse<LoginResult>>("/auth/mfa/totp/challenge", {
    method: "POST",
    body: JSON.stringify({ ticket, code }),
  });

  if (!response.data.mfaRequired) {
    persistSession({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      role: response.data.role,
    });
  }

  return response.data;
}

export async function getSessionMe() {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Missing access token.");

  const response = await requestJson<AuthApiResponse<{
    userId: string;
    email: string | null;
    role: AuthRole;
    roles: AuthRole[];
    mfaVerified: boolean;
    sessionId: string;
  }>>("/auth/session/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  const response = await requestJson<AuthApiResponse<{ accessToken: string; refreshToken: string; expiresAt: string }>>(
    "/auth/session/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
  );

  persistSession({
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
    role: getStoredRole(),
  });

  return response.data;
}

export async function logoutCurrentSession() {
  const token = getAdminAccessToken();
  if (!token) return;
  await requestJson<AuthApiResponse<unknown>>("/auth/session/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  clearAdminSession();
}

export async function revokeAllSessions() {
  const token = getAdminAccessToken();
  if (!token) return;
  await requestJson<AuthApiResponse<unknown>>("/auth/session/revoke-all", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  clearAdminSession();
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Missing access token.");

  const response = await requestJson<AuthApiResponse<unknown>>("/auth/password/change", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  clearAdminSession();
  return response.data;
}

export async function enrollTotp() {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Missing access token.");

  const response = await requestJson<AuthApiResponse<{ factorId: string; otpauthUrl: string; secretBase32: string; secretHint: string }>>(
    "/auth/mfa/totp/enroll",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
}

export async function verifyTotpSetup(code: string) {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Missing access token.");

  const response = await requestJson<AuthApiResponse<{ success: boolean }>>("/auth/mfa/totp/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });
  return response.data;
}

export async function disableTotp() {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Missing access token.");

  const response = await requestJson<AuthApiResponse<{ success: boolean }>>("/auth/mfa/totp/disable", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
