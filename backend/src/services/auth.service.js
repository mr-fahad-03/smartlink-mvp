const speakeasy = require("speakeasy");

const { env } = require("../config/env");
const { supabase, isSupabaseConfigured } = require("../config/supabase");
const { APP_ROLES, MFA_METHODS, MFA_REQUIRED_ROLES } = require("../constants/auth");
const { appendAdminAuditLog } = require("./admin-audit.service");
const { AppError } = require("../utils/app-error");
const {
  normalizeEmail,
  passwordPolicyCheck,
  throwWeakPassword,
  randomNumericCode,
  randomToken,
  hashText,
  encryptJson,
  decryptJson,
  signAppAccessToken,
  verifyAppAccessToken,
} = require("../utils/security");

const ADMIN_ROLE_PRIORITY = [APP_ROLES.SUPER_ADMIN, APP_ROLES.ADMIN, APP_ROLES.MODERATOR, APP_ROLES.AUDITOR];
const CLIENT_ROLE = APP_ROLES.CLIENT;

function requireSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new AppError("Supabase is not configured.", 500, { code: "supabase_not_configured" });
  }
  return supabase;
}

function getSupabaseAuthBaseUrl() {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  if (!base) {
    throw new AppError("SUPABASE_URL is missing.", 500, { code: "supabase_url_missing" });
  }
  return `${base}/auth/v1`;
}

function getSupabaseAnonKey() {
  const key = env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new AppError("SUPABASE_ANON_KEY is required for auth endpoints.", 500, { code: "supabase_anon_missing" });
  }
  return key;
}

async function supabaseAuthRequest(path, payload) {
  let response;
  try {
    response = await fetch(`${getSupabaseAuthBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: getSupabaseAnonKey(),
      },
      body: JSON.stringify(payload || {}),
    });
  } catch (err) {
    throw new AppError(
      "Database service is unreachable. Please verify SUPABASE_URL and network connectivity in backend/.env.",
      503,
      { code: "supabase_unreachable", raw: err.message }
    );
  }

  const bodyText = await response.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch (_) {
    body = { raw: bodyText };
  }

  if (!response.ok) {
    const message = body?.error_description || body?.msg || body?.error || "Supabase auth request failed.";
    throw new AppError(message, response.status, { code: "supabase_auth_error", raw: body });
  }

  return body;
}

async function resolveAdminRoles(userId) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("admin_user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new AppError("Failed to resolve admin roles.", 500, { code: "admin_role_lookup_failed", raw: error.message });
  }

  return (data || []).map((row) => row.role);
}

function choosePrimaryRole(roles = [], profileRole) {
  for (const role of ADMIN_ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  if (profileRole) return profileRole;
  return CLIENT_ROLE;
}

async function upsertUserProfile(user) {
  const client = requireSupabaseClient();
  const userId = user?.id;
  if (!userId) {
    throw new AppError("User id missing for profile upsert.", 500, { code: "profile_upsert_missing_user" });
  }

  const email = normalizeEmail(user?.email);
  const adminRoles = await resolveAdminRoles(userId);

  const { data: existing, error: existingError } = await client
    .from("user_profiles")
    .select("role, mfa_required_override")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new AppError("Failed to fetch user profile.", 500, { code: "profile_read_failed", raw: existingError.message });
  }

  const resolvedRole = choosePrimaryRole(adminRoles, existing?.role || null);

  const payload = {
    user_id: userId,
    email,
    role: resolvedRole,
    email_verified: Boolean(user?.email_confirmed_at),
    last_login_at: new Date().toISOString(),
    status: "active",
  };

  const { data, error } = await client
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to upsert user profile.", 500, { code: "profile_upsert_failed", raw: error.message });
  }

  return {
    profile: data,
    adminRoles,
    primaryRole: resolvedRole,
  };
}

async function getSecurityState(userId) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("auth_security_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to fetch auth security state.", 500, { code: "security_state_read_failed", raw: error.message });
  }

  if (data) return data;

  const initial = {
    user_id: userId,
    failed_count: 0,
    suspicious_score: 0,
    lock_until: null,
    captcha_required_until: null,
    mfa_pending: false,
  };

  const { data: created, error: createError } = await client
    .from("auth_security_state")
    .insert(initial)
    .select("*")
    .single();

  if (createError) {
    throw new AppError("Failed to initialize auth security state.", 500, { code: "security_state_init_failed", raw: createError.message });
  }

  return created;
}

async function updateSecurityState(userId, patch) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("auth_security_state")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new AppError("Failed to update auth security state.", 500, { code: "security_state_update_failed", raw: error.message });
  }

  return data;
}

async function appendLoginAttempt(row) {
  try {
    const client = requireSupabaseClient();
    const { error } = await client.from("auth_login_attempts").insert({
      email: normalizeEmail(row.email),
      user_id: row.userId || null,
      role: row.role || null,
      ip_address: row.ipAddress || null,
      user_agent: row.userAgent || null,
      success: Boolean(row.success),
      reason: row.reason || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Failed to write login attempt audit log:", error.message);
    }
  } catch (err) {
    console.warn("Failed to write login attempt audit log:", err.message);
  }
}

async function findAuthUserByEmail(email) {
  const client = requireSupabaseClient();
  const target = normalizeEmail(email);
  const perPage = 500;

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new AppError("Failed to lookup auth user.", 500, { code: "auth_user_lookup_failed", raw: error.message });
    }

    const users = data?.users || [];
    const match = users.find((item) => normalizeEmail(item?.email) === target);
    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

async function getAuthUserByIdSafe(userId) {
  const client = requireSupabaseClient();
  try {
    const { data, error } = await client.auth.admin.getUserById(userId);
    if (error) return null;
    return data?.user || null;
  } catch (_) {
    return null;
  }
}

async function checkPasswordReuse(userId, newPassword) {
  const client = requireSupabaseClient();
  const depth = Number(env.PASSWORD_HISTORY_DEPTH || 5);
  const passwordHash = hashText(newPassword);

  const { data, error } = await client
    .from("password_history")
    .select("password_hash")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(depth);

  if (error) {
    throw new AppError("Failed to check password history.", 500, { code: "password_history_read_failed", raw: error.message });
  }

  return (data || []).some((row) => row.password_hash === passwordHash);
}

async function savePasswordHistory(userId, password) {
  const client = requireSupabaseClient();
  const passwordHash = hashText(password);

  const { error } = await client.from("password_history").insert({
    user_id: userId,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new AppError("Failed to save password history.", 500, { code: "password_history_write_failed", raw: error.message });
  }
}

async function deleteOldPasswordHistory(userId) {
  const client = requireSupabaseClient();
  const depth = Number(env.PASSWORD_HISTORY_DEPTH || 5);

  const { data, error } = await client
    .from("password_history")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError("Failed to trim password history.", 500, { code: "password_history_trim_read_failed", raw: error.message });
  }

  const rows = data || [];
  const removable = rows.slice(depth).map((row) => row.id);
  if (removable.length === 0) return;

  const { error: deleteError } = await client.from("password_history").delete().in("id", removable);
  if (deleteError) {
    throw new AppError("Failed to trim password history.", 500, { code: "password_history_trim_delete_failed", raw: deleteError.message });
  }
}

function getSessionLifetime(role) {
  if (MFA_REQUIRED_ROLES.has(role)) {
    return Number(env.ADMIN_SESSION_TTL_HOURS || 12) * 60 * 60 * 1000;
  }
  return Number(env.STANDARD_SESSION_TTL_DAYS || 30) * 24 * 60 * 60 * 1000;
}

function getIdleTimeout(role) {
  if (MFA_REQUIRED_ROLES.has(role)) {
    return Number(env.ADMIN_IDLE_TIMEOUT_MINUTES || 20);
  }
  return Number(env.STANDARD_IDLE_TIMEOUT_MINUTES || 240);
}

async function createSessionTokens({ userId, email, role, mfaVerified, source }) {
  const client = requireSupabaseClient();
  const refreshToken = randomToken(48);
  const refreshHash = hashText(refreshToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + getSessionLifetime(role));

  const { data: sessionRow, error } = await client
    .from("user_sessions")
    .insert({
      user_id: userId,
      role,
      refresh_token_hash: refreshHash,
      mfa_verified: Boolean(mfaVerified),
      session_source: source || "password",
      last_activity_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      idle_timeout_minutes: getIdleTimeout(role),
    })
    .select("id, expires_at")
    .single();

  if (error) {
    throw new AppError("Failed to create session.", 500, { code: "session_create_failed", raw: error.message });
  }

  const accessToken = signAppAccessToken({
    sub: userId,
    sid: sessionRow.id,
    role,
    email,
    mfa_verified: Boolean(mfaVerified),
    typ: "access",
  });

  return {
    accessToken,
    refreshToken,
    expiresAt: sessionRow.expires_at,
    sessionId: sessionRow.id,
  };
}

async function buildActorFromUserId(userId, fallbackEmail = null) {
  const client = requireSupabaseClient();
  const { data: rolesData, error: rolesError } = await client
    .from("admin_user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (rolesError) {
    throw new AppError("Failed to resolve roles.", 500, { code: "role_resolution_failed", raw: rolesError.message });
  }

  const roles = (rolesData || []).map((row) => row.role);
  const { data: profile, error: profileError } = await client
    .from("user_profiles")
    .select("email, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw new AppError("Failed to resolve user profile.", 500, { code: "profile_read_failed", raw: profileError.message });
  }

  const role = choosePrimaryRole(roles, profile?.role || null);

  const email = fallbackEmail || profile?.email || null;

  return {
    userId,
    email,
    role,
    roles,
  };
}

async function auditAdminAuthEvent(req, actor, actionType, notes, newValue = null) {
  if (![APP_ROLES.SUPER_ADMIN, APP_ROLES.ADMIN, APP_ROLES.MODERATOR].includes(actor?.role)) return;

  await appendAdminAuditLog({
    req,
    actor: {
      userId: actor.userId,
      email: actor.email,
      role: actor.role,
    },
    actionType,
    targetType: "auth",
    targetId: actor.userId,
    previousValue: null,
    newValue,
    notes: notes || null,
  });
}

function shouldRequireMfa(role) {
  return MFA_REQUIRED_ROLES.has(role);
}

async function getTotpFactor(userId) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from("mfa_totp_factors")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load MFA factor.", 500, { code: "mfa_factor_read_failed", raw: error.message });
  }
  return data || null;
}

async function createLoginTicket({ userId, role, email, passwordSignInPayload }) {
  const client = requireSupabaseClient();
  const token = randomToken(24);
  const tokenHash = hashText(token);
  const expiresAt = new Date(Date.now() + Number(env.MFA_EMAIL_OTP_TTL_MINUTES || 10) * 60 * 1000);

  const encryptedPayload = encryptJson(passwordSignInPayload);
  const { error } = await client.from("auth_login_tickets").insert({
    user_id: userId,
    role,
    email: normalizeEmail(email),
    token_hash: tokenHash,
    encrypted_payload: encryptedPayload,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new AppError("Failed to create MFA login ticket.", 500, { code: "mfa_ticket_create_failed", raw: error.message });
  }

  await updateSecurityState(userId, { mfa_pending: true });

  return token;
}

async function getLoginTicket(ticketToken, { allowConsumed = false } = {}) {
  const client = requireSupabaseClient();
  const tokenHash = hashText(ticketToken);

  const { data: ticket, error } = await client
    .from("auth_login_tickets")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to verify MFA login ticket.", 500, { code: "mfa_ticket_lookup_failed", raw: error.message });
  }

  if (!ticket) {
    throw new AppError("Invalid MFA ticket.", 400, { code: "mfa_ticket_invalid" });
  }
  if (!allowConsumed && ticket.consumed_at) {
    throw new AppError("MFA ticket already used.", 400, { code: "mfa_ticket_consumed" });
  }

  const expiresAt = new Date(ticket.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    throw new AppError("MFA ticket expired.", 400, { code: "mfa_ticket_expired" });
  }

  return ticket;
}

async function consumeLoginTicket(ticketToken) {
  const client = requireSupabaseClient();
  const ticket = await getLoginTicket(ticketToken);

  const { error: consumeError } = await client
    .from("auth_login_tickets")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", ticket.id);

  if (consumeError) {
    throw new AppError("Failed to consume MFA ticket.", 500, { code: "mfa_ticket_consume_failed", raw: consumeError.message });
  }

  return {
    ...ticket,
    payload: decryptJson(ticket.encrypted_payload),
  };
}

async function ensureCanAttemptLogin(userId, captchaToken) {
  const state = await getSecurityState(userId);
  const now = Date.now();

  if (state.lock_until) {
    const lockUntil = new Date(state.lock_until).getTime();
    if (Number.isFinite(lockUntil) && lockUntil > now) {
      throw new AppError("Account temporarily locked due to failed login attempts.", 423, {
        code: "account_locked",
        lock_until: state.lock_until,
      });
    }
  }

  if (state.captcha_required_until) {
    const requiredUntil = new Date(state.captcha_required_until).getTime();
    if (Number.isFinite(requiredUntil) && requiredUntil > now) {
      await validateHCaptchaToken(captchaToken);
    }
  }
}

async function validateHCaptchaToken(captchaToken) {
  const secret = String(env.HCAPTCHA_SECRET || "");

  if (!secret) {
    if (env.NODE_ENV !== "production") {
      if (captchaToken === "dev-bypass") return true;
      throw new AppError("Captcha required. In development use captchaToken=dev-bypass.", 400, { code: "captcha_required" });
    }
    throw new AppError("Captcha service unavailable.", 500, { code: "captcha_unavailable" });
  }

  if (!captchaToken) {
    throw new AppError("Captcha token is required.", 400, { code: "captcha_required" });
  }

  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: captchaToken,
    }),
  });

  const payload = await response.json();
  if (!payload?.success) {
    throw new AppError("Captcha verification failed.", 400, { code: "captcha_invalid" });
  }

  return true;
}

async function onLoginFailure(userId) {
  if (!userId) return;
  const current = await getSecurityState(userId);
  const failed = Number(current.failed_count || 0) + 1;
  const suspicious = Number(current.suspicious_score || 0) + 1;
  const threshold = Number(env.AUTH_LOCK_THRESHOLD || 5);
  const suspiciousThreshold = Number(env.AUTH_SUSPICIOUS_THRESHOLD || 3);

  let lockUntil = null;
  if (failed >= threshold) {
    lockUntil = new Date(Date.now() + Number(env.AUTH_LOCK_MINUTES || 15) * 60 * 1000).toISOString();
  }

  let captchaRequiredUntil = null;
  if (suspicious >= suspiciousThreshold) {
    captchaRequiredUntil = new Date(Date.now() + Number(env.AUTH_CAPTCHA_REQUIRED_MINUTES || 60) * 60 * 1000).toISOString();
  }

  await updateSecurityState(userId, {
    failed_count: failed,
    suspicious_score: suspicious,
    lock_until: lockUntil,
    captcha_required_until: captchaRequiredUntil,
  });
}

async function onLoginSuccess(userId) {
  await updateSecurityState(userId, {
    failed_count: 0,
    suspicious_score: 0,
    lock_until: null,
    captcha_required_until: null,
    last_success_at: new Date().toISOString(),
  });
}

async function registerUser(req, payload) {
  const role = payload.role;
  if (![APP_ROLES.EXPERT, APP_ROLES.CLIENT].includes(role)) {
    throw new AppError("Only client and expert registration is supported.", 400, { code: "invalid_registration_role" });
  }

  const email = normalizeEmail(payload.email);
  const policy = passwordPolicyCheck(payload.password);
  if (!policy.valid) {
    throwWeakPassword(policy);
  }

  const client = requireSupabaseClient();
  const { data: existingProfile, error: existingProfileError } = await client
    .from("user_profiles")
    .select("user_id, email")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileError) {
    if (existingProfileError.message?.toLowerCase().includes("fetch failed") || existingProfileError.code === "ENOTFOUND") {
      throw new AppError("Database service is unreachable. Please verify SUPABASE_URL in backend/.env.", 503, {
        code: "supabase_unreachable",
        raw: existingProfileError.message,
      });
    }
    if (existingProfileError.code === "PGRST205") {
      throw new AppError("Auth schema is missing. Run backend/sql/supabase_schema.sql in Supabase SQL Editor.", 500, {
        code: "auth_schema_missing",
        raw: {
          message: existingProfileError.message,
          code: existingProfileError.code,
          hint: existingProfileError.hint || null,
        },
      });
    }
    throw new AppError("Failed to verify existing profile.", 500, {
      code: "profile_precheck_failed",
      raw: {
        message: existingProfileError.message,
        code: existingProfileError.code || null,
        hint: existingProfileError.hint || null,
      },
    });
  }

  if (existingProfile?.user_id) {
    const existingAuthUser = await getAuthUserByIdSafe(existingProfile.user_id);
    if (existingAuthUser?.id) {
      throw new AppError("Account already exists. Please sign in.", 409, { code: "account_exists" });
    }

    const { error: staleDeleteError } = await client
      .from("user_profiles")
      .delete()
      .eq("email", email);

    if (staleDeleteError) {
      throw new AppError("Failed to clear stale profile record.", 500, {
        code: "stale_profile_cleanup_failed",
        raw: staleDeleteError.message,
      });
    }
  }

  let user = null;
  let created = null;
  let createError = null;

  try {
    const res = await client.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: !env.AUTH_REQUIRE_EMAIL_VERIFICATION,
      user_metadata: {
        full_name: payload.fullName || null,
        app_role: role,
      },
    });
    created = res?.data || null;
    createError = res?.error || null;
  } catch (err) {
    createError = err;
  }

  if (created?.user?.id) {
    user = created.user;
  } else {
    // If admin creation failed because user already exists
    const errMessage = String(createError?.message || "").toLowerCase();
    if (errMessage.includes("already") || errMessage.includes("exists") || errMessage.includes("registered")) {
      throw new AppError("Account already exists. Please sign in.", 409, { code: "account_exists" });
    }

    // Fallback to public signup endpoint
    try {
      const signup = await supabaseAuthRequest("/signup", {
        email,
        password: payload.password,
        data: {
          full_name: payload.fullName || null,
          app_role: role,
        },
      });
      user = signup?.user || null;
    } catch (signupErr) {
      const signupMsg = String(signupErr?.message || "").toLowerCase();
      const signupRaw = signupErr?.raw?.error_code || signupErr?.raw?.code || "";
      if (signupMsg.includes("rate limit") || signupMsg.includes("too many") || signupRaw === "over_email_send_rate_limit") {
        throw new AppError("Too many signup attempts right now. Please wait a few minutes or adjust Rate Limits in Supabase Dashboard > Authentication > Rate Limits.", 429, {
          code: "over_email_send_rate_limit",
          raw: signupErr.message,
        });
      }
      if (signupMsg.includes("already") || signupMsg.includes("exists") || signupMsg.includes("registered")) {
        throw new AppError("Account already exists. Please sign in.", 409, { code: "account_exists" });
      }
      throw signupErr;
    }

    if (!user?.id) {
      const existingAuthUser = await findAuthUserByEmail(email);
      if (existingAuthUser?.id) {
        if (existingAuthUser.email_confirmed_at) {
          throw new AppError("Account already exists. Please sign in.", 409, { code: "account_exists" });
        }
        user = existingAuthUser;
      } else {
        throw new AppError("Registration could not be completed right now. Please try again in a minute.", 503, {
          code: "registration_incomplete",
        });
      }
    }
  }

  const emailVerified = env.AUTH_REQUIRE_EMAIL_VERIFICATION ? Boolean(user.email_confirmed_at) : true;
  const { data: profile, error: profileError } = await client
    .from("user_profiles")
    .upsert({
      user_id: user.id,
      email,
      role,
      status: "active",
      email_verified: emailVerified,
      full_name: payload.fullName || null,
    }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (profileError) {
    if (profileError.code === "PGRST205") {
      throw new AppError("Auth schema is missing. Run backend/sql/supabase_schema.sql in Supabase SQL Editor.", 500, {
        code: "auth_schema_missing",
        raw: {
          message: profileError.message,
          code: profileError.code,
          hint: profileError.hint || null,
        },
      });
    }
    const message = String(profileError.message || "").toLowerCase();
    const duplicateEmailConflict = profileError.code === "23505" || message.includes("user_profiles_email_key");
    if (duplicateEmailConflict) {
      throw new AppError("Account already exists. Please sign in.", 409, { code: "account_exists" });
    }
    throw new AppError("Failed to create user profile.", 500, {
      code: "profile_create_failed",
      raw: {
        message: profileError.message,
        code: profileError.code || null,
        details: profileError.details || null,
        hint: profileError.hint || null,
      },
    });
  }

  await getSecurityState(user.id);
  await savePasswordHistory(user.id, payload.password);
  await deleteOldPasswordHistory(user.id);

  if (payload.expertId && role === APP_ROLES.EXPERT) {
    const { error: linkError } = await client.from("expert_user_links").upsert({
      expert_id: payload.expertId,
      user_id: user.id,
      status: "linked",
    }, { onConflict: "expert_id" });

    if (linkError) {
      throw new AppError("Failed to link expert account.", 500, { code: "expert_link_failed", raw: linkError.message });
    }
  }

  await appendLoginAttempt({
    email,
    userId: user.id,
    role,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
    success: true,
    reason: "registration",
  });

  let actionLink = null;
  if (env.AUTH_REQUIRE_EMAIL_VERIFICATION && user?.email) {
    let origin = req.headers?.origin || env.AUTH_VERIFY_REDIRECT_URL || "https://linksmartbahamas.com/results?verified=true";
    if (!origin || origin.includes("localhost:5000") || (origin.includes("localhost") && (process.env.NODE_ENV === "production" || !req.headers?.origin))) {
      origin = "https://linksmartbahamas.com/results?verified=true";
    }
    try {
      const { data, error } = await client.auth.admin.generateLink({
        type: "signup",
        email: user.email,
        options: { redirectTo: origin },
      });
      if (!error && data?.properties?.action_link) {
        actionLink = data.properties.action_link;
      }
    } catch (_) {}
    if (!actionLink) {
      try {
        const { data, error } = await client.auth.admin.generateLink({
          type: "magiclink",
          email: user.email,
          options: { redirectTo: origin },
        });
        if (!error && data?.properties?.action_link) {
          actionLink = data.properties.action_link;
        }
      } catch (_) {}
    }
  }

  return {
    userId: user.id,
    email,
    role,
    emailVerified,
    verificationRequired: env.AUTH_REQUIRE_EMAIL_VERIFICATION ? !Boolean(user.email_confirmed_at) : false,
    verificationLink: actionLink,
    profile,
  };
}

async function loginWithPassword(req, payload) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  const client = requireSupabaseClient();
  const { data: profileLookup } = await client
    .from("user_profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (profileLookup?.user_id) {
    await ensureCanAttemptLogin(profileLookup.user_id, payload.captchaToken);
  }

  let authPayload;
  try {
    authPayload = await supabaseAuthRequest("/token?grant_type=password", {
      email,
      password,
    });
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();

    if (!env.AUTH_REQUIRE_EMAIL_VERIFICATION && message.includes("email not confirmed") && profileLookup?.user_id) {
      const client = requireSupabaseClient();
      const { error: confirmError } = await client.auth.admin.updateUserById(profileLookup.user_id, {
        email_confirm: true,
      });

      if (confirmError) {
        throw new AppError("Failed to auto-confirm email for login.", 500, { code: "email_autoconfirm_failed", raw: confirmError.message });
      }

      authPayload = await supabaseAuthRequest("/token?grant_type=password", {
        email,
        password,
      });
    } else {
      if (profileLookup?.user_id) {
        await onLoginFailure(profileLookup.user_id);
        await appendLoginAttempt({
          email,
          userId: profileLookup.user_id,
          role: null,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          success: false,
          reason: "invalid_credentials",
        });
      } else {
        await appendLoginAttempt({
          email,
          userId: null,
          role: null,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || null,
          success: false,
          reason: "invalid_credentials_unknown_user",
        });
      }

      if (message.includes("email not confirmed")) {
        throw new AppError("Please verify your email first (or turn OFF 'Confirm email' in Supabase Dashboard > Authentication > Email for testing).", 403, { code: "email_unverified" });
      }
      throw new AppError("Invalid email or password.", 401, { code: "invalid_credentials" });
    }
  }

  const user = authPayload?.user;
  if (!user?.id) {
    throw new AppError("Login failed. Missing user profile from auth provider.", 500, { code: "login_user_missing" });
  }

  const { profile, adminRoles, primaryRole } = await upsertUserProfile(user);
  const role = primaryRole;

  await ensureCanAttemptLogin(user.id, payload.captchaToken);
  await onLoginSuccess(user.id);

  if (env.AUTH_REQUIRE_EMAIL_VERIFICATION && !profile.email_verified) {
    throw new AppError("Please verify your email first.", 403, { code: "email_unverified" });
  }

  const desiredRole = payload.role ? String(payload.role) : null;
  if (desiredRole && desiredRole !== role && !(desiredRole === APP_ROLES.ADMIN && adminRoles.length > 0)) {
    throw new AppError("Role mismatch for this account.", 403, { code: "role_mismatch", role });
  }

  const factor = await getTotpFactor(user.id);
  const requiresMfa = shouldRequireMfa(role) || Boolean(factor?.is_active && factor?.is_verified);

  await appendLoginAttempt({
    email,
    userId: user.id,
    role,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
    success: true,
    reason: requiresMfa ? "mfa_pending" : "login_success",
  });

  const actor = await buildActorFromUserId(user.id, email);

  if (requiresMfa) {
    const ticket = await createLoginTicket({
      userId: user.id,
      role,
      email,
      passwordSignInPayload: {
        provider_user_id: user.id,
        email,
        role,
      },
    });

    await auditAdminAuthEvent(req, actor, "admin_login_mfa_required", "Password verified. MFA required.", {
      role,
      methods: [MFA_METHODS.TOTP, MFA_METHODS.EMAIL_OTP],
    });

    return {
      mfaRequired: true,
      code: "mfa_required",
      ticket,
      role,
      methods: [MFA_METHODS.TOTP, MFA_METHODS.EMAIL_OTP],
    };
  }

  const session = await createSessionTokens({
    userId: user.id,
    email,
    role,
    mfaVerified: false,
    source: "password",
  });

  await updateSecurityState(user.id, {
    mfa_pending: false,
  });

  await auditAdminAuthEvent(req, actor, "admin_login_success", "Password login successful.", { role, mfaVerified: false });

  return {
    mfaRequired: false,
    role,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

async function sendEmailOtpForTicket(ticketToken) {
  const ticket = await getLoginTicket(ticketToken);
  const client = requireSupabaseClient();

  const otp = randomNumericCode(6);
  const otpHash = hashText(otp);
  const expiresAt = new Date(Date.now() + Number(env.MFA_EMAIL_OTP_TTL_MINUTES || 10) * 60 * 1000);

  const { data: challenge, error } = await client
    .from("mfa_email_challenges")
    .insert({
      user_id: ticket.user_id,
      email: ticket.email,
      code_hash: otpHash,
      login_ticket_hash: ticket.token_hash,
      expires_at: expiresAt.toISOString(),
      max_attempts: Number(env.MFA_EMAIL_OTP_MAX_ATTEMPTS || 5),
      delivery_state: env.NODE_ENV === "production" ? "queued" : "development",
    })
    .select("id, expires_at")
    .single();

  if (error) {
    throw new AppError("Failed to create email OTP challenge.", 500, { code: "email_otp_create_failed", raw: error.message });
  }

  return {
    challengeId: challenge.id,
    expiresAt: challenge.expires_at,
    delivery: env.NODE_ENV === "production" ? "queued" : "development",
    devCode: env.NODE_ENV === "production" ? undefined : otp,
  };
}

async function verifyEmailOtpTicket(req, payload) {
  const client = requireSupabaseClient();
  const ticketHash = hashText(payload.ticket);

  const { data: ticket, error: ticketError } = await client
    .from("auth_login_tickets")
    .select("*")
    .eq("token_hash", ticketHash)
    .maybeSingle();

  if (ticketError) {
    throw new AppError("Failed to read MFA ticket.", 500, { code: "mfa_ticket_read_failed", raw: ticketError.message });
  }

  if (!ticket || ticket.consumed_at) {
    throw new AppError("Invalid MFA ticket.", 400, { code: "mfa_ticket_invalid" });
  }

  const { data: challenge, error: challengeError } = await client
    .from("mfa_email_challenges")
    .select("*")
    .eq("login_ticket_hash", ticketHash)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (challengeError) {
    throw new AppError("Failed to read email OTP challenge.", 500, { code: "email_otp_read_failed", raw: challengeError.message });
  }

  if (!challenge) {
    throw new AppError("No active OTP challenge found.", 400, { code: "otp_challenge_missing" });
  }

  const now = Date.now();
  if (new Date(challenge.expires_at).getTime() < now) {
    throw new AppError("OTP expired.", 400, { code: "otp_expired" });
  }

  const nextAttempts = Number(challenge.attempt_count || 0) + 1;
  if (nextAttempts > Number(challenge.max_attempts || 5)) {
    throw new AppError("OTP attempts exceeded.", 400, { code: "otp_attempts_exceeded" });
  }

  const incoming = hashText(String(payload.code || ""));
  if (incoming !== challenge.code_hash) {
    await client
      .from("mfa_email_challenges")
      .update({ attempt_count: nextAttempts })
      .eq("id", challenge.id);

    throw new AppError("Invalid OTP code.", 400, { code: "otp_invalid" });
  }

  await client
    .from("mfa_email_challenges")
    .update({ consumed_at: new Date().toISOString(), attempt_count: nextAttempts })
    .eq("id", challenge.id);

  await client
    .from("auth_login_tickets")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", ticket.id);

  const session = await createSessionTokens({
    userId: ticket.user_id,
    email: ticket.email,
    role: ticket.role,
    mfaVerified: true,
    source: "mfa_email_otp",
  });

  await updateSecurityState(ticket.user_id, {
    mfa_pending: false,
    mfa_verified_at: new Date().toISOString(),
    preferred_mfa_method: MFA_METHODS.EMAIL_OTP,
  });

  const actor = await buildActorFromUserId(ticket.user_id, ticket.email);
  await auditAdminAuthEvent(req, actor, "admin_mfa_email_verified", "Email OTP challenge completed.", {
    role: ticket.role,
    method: MFA_METHODS.EMAIL_OTP,
  });

  return {
    role: ticket.role,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

async function enrollTotpFactor(userId, email) {
  const client = requireSupabaseClient();

  const secret = speakeasy.generateSecret({
    name: `SmartLinkBahamas (${email})`,
    issuer: "SmartLinkBahamas",
    length: 32,
  });

  const existing = await getTotpFactor(userId);
  if (existing) {
    await client
      .from("mfa_totp_factors")
      .update({ is_active: false })
      .eq("id", existing.id);
  }

  const { data, error } = await client
    .from("mfa_totp_factors")
    .insert({
      user_id: userId,
      secret_encrypted: encryptJson({ base32: secret.base32 }),
      secret_hint: `${secret.base32.slice(0, 4)}...${secret.base32.slice(-4)}`,
      is_active: true,
      is_verified: false,
    })
    .select("id, secret_hint")
    .single();

  if (error) {
    throw new AppError("Failed to enroll TOTP factor.", 500, { code: "totp_enroll_failed", raw: error.message });
  }

  return {
    factorId: data.id,
    otpauthUrl: secret.otpauth_url,
    secretBase32: secret.base32,
    secretHint: data.secret_hint,
  };
}

async function verifyTotpEnrollment(userId, code) {
  const client = requireSupabaseClient();
  const factor = await getTotpFactor(userId);

  if (!factor) {
    throw new AppError("No active TOTP enrollment found.", 404, { code: "totp_not_enrolled" });
  }

  const secret = decryptJson(factor.secret_encrypted).base32;
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: String(code || ""),
    window: 1,
  });

  if (!verified) {
    throw new AppError("Invalid authenticator code.", 400, { code: "totp_invalid" });
  }

  const { error } = await client
    .from("mfa_totp_factors")
    .update({ is_verified: true, verified_at: new Date().toISOString() })
    .eq("id", factor.id);

  if (error) {
    throw new AppError("Failed to verify TOTP factor.", 500, { code: "totp_verify_save_failed", raw: error.message });
  }

  await client
    .from("user_profiles")
    .update({ mfa_preferred_method: MFA_METHODS.TOTP })
    .eq("user_id", userId);

  return { success: true };
}

async function verifyTotpLogin(req, payload) {
  const ticket = await consumeLoginTicket(payload.ticket);
  const factor = await getTotpFactor(ticket.user_id);
  if (!factor || !factor.is_verified) {
    throw new AppError("TOTP is not configured for this account.", 400, { code: "totp_not_configured" });
  }

  const secret = decryptJson(factor.secret_encrypted).base32;
  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: String(payload.code || ""),
    window: 1,
  });

  if (!verified) {
    throw new AppError("Invalid authenticator code.", 400, { code: "totp_invalid" });
  }

  const session = await createSessionTokens({
    userId: ticket.user_id,
    email: ticket.email,
    role: ticket.role,
    mfaVerified: true,
    source: "mfa_totp",
  });

  await updateSecurityState(ticket.user_id, {
    mfa_pending: false,
    mfa_verified_at: new Date().toISOString(),
    preferred_mfa_method: MFA_METHODS.TOTP,
  });

  const actor = await buildActorFromUserId(ticket.user_id, ticket.email);
  await auditAdminAuthEvent(req, actor, "admin_mfa_totp_verified", "TOTP challenge completed.", {
    role: ticket.role,
    method: MFA_METHODS.TOTP,
  });

  return {
    role: ticket.role,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

async function verifyAndLoadSession(accessToken) {
  const payload = verifyAppAccessToken(accessToken);
  if (payload?.typ !== "access") {
    throw new AppError("Invalid access token type.", 401, { code: "invalid_session" });
  }

  const client = requireSupabaseClient();
  const { data: session, error } = await client
    .from("user_sessions")
    .select("*")
    .eq("id", payload.sid)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to verify session.", 500, { code: "session_read_failed", raw: error.message });
  }

  if (!session || session.revoked_at) {
    throw new AppError("Session revoked or missing.", 401, { code: "session_revoked" });
  }

  const now = Date.now();
  const expiresAt = new Date(session.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    throw new AppError("Session expired.", 401, { code: "session_expired" });
  }

  const idleMinutes = Number(session.idle_timeout_minutes || 0);
  if (idleMinutes > 0 && session.last_activity_at) {
    const idleMs = now - new Date(session.last_activity_at).getTime();
    if (idleMs > idleMinutes * 60 * 1000) {
      throw new AppError("Session expired due to inactivity.", 401, {
        code: "session_idle_timeout",
      });
    }
  }

  return {
    tokenPayload: payload,
    session,
  };
}

async function touchSession(sessionId) {
  const client = requireSupabaseClient();
  await client
    .from("user_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("revoked_at", null);
}

async function getMeFromAccessToken(accessToken) {
  const { tokenPayload, session } = await verifyAndLoadSession(accessToken);

  const actor = await buildActorFromUserId(tokenPayload.sub, tokenPayload.email || null);
  return {
    userId: actor.userId,
    email: actor.email,
    role: actor.role,
    roles: actor.roles,
    mfaVerified: Boolean(session.mfa_verified),
    sessionId: session.id,
  };
}

async function refreshSessionTokens(payload) {
  const client = requireSupabaseClient();
  const refreshHash = hashText(payload.refreshToken);

  const { data: session, error } = await client
    .from("user_sessions")
    .select("*")
    .eq("refresh_token_hash", refreshHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to refresh session.", 500, { code: "session_refresh_read_failed", raw: error.message });
  }

  if (!session) {
    throw new AppError("Invalid refresh token.", 401, { code: "refresh_invalid" });
  }

  const now = Date.now();
  if (new Date(session.expires_at).getTime() <= now) {
    throw new AppError("Refresh token expired.", 401, { code: "refresh_expired" });
  }

  const newRefresh = randomToken(48);
  const newRefreshHash = hashText(newRefresh);
  const nextExpiry = new Date(now + getSessionLifetime(session.role));

  const { data: updated, error: updateError } = await client
    .from("user_sessions")
    .update({
      refresh_token_hash: newRefreshHash,
      last_activity_at: new Date().toISOString(),
      expires_at: nextExpiry.toISOString(),
    })
    .eq("id", session.id)
    .select("*")
    .single();

  if (updateError) {
    throw new AppError("Failed to rotate refresh token.", 500, { code: "session_refresh_update_failed", raw: updateError.message });
  }

  const accessToken = signAppAccessToken({
    sub: updated.user_id,
    sid: updated.id,
    role: updated.role,
    mfa_verified: Boolean(updated.mfa_verified),
    typ: "access",
  });

  return {
    accessToken,
    refreshToken: newRefresh,
    expiresAt: updated.expires_at,
  };
}

async function revokeCurrentSession(accessToken) {
  const { session } = await verifyAndLoadSession(accessToken);
  const client = requireSupabaseClient();
  const { error } = await client
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", session.id);

  if (error) {
    throw new AppError("Failed to revoke current session.", 500, { code: "session_revoke_failed", raw: error.message });
  }

  return { success: true };
}

async function revokeAllSessions(req, accessToken) {
  const { tokenPayload } = await verifyAndLoadSession(accessToken);
  const client = requireSupabaseClient();

  const { error } = await client
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", tokenPayload.sub)
    .is("revoked_at", null);

  if (error) {
    throw new AppError("Failed to revoke all sessions.", 500, { code: "session_revoke_all_failed", raw: error.message });
  }

  const actor = await buildActorFromUserId(tokenPayload.sub, tokenPayload.email || null);
  await auditAdminAuthEvent(req, actor, "admin_session_revoke_all", "User revoked all sessions.", {
    role: actor.role,
  });

  return { success: true };
}

async function resendVerificationEmail(email, redirectUrl = null) {
  const normalizedEmail = normalizeEmail(email);
  const client = requireSupabaseClient();
  let targetRedirect = redirectUrl || env.AUTH_VERIFY_REDIRECT_URL || "https://linksmartbahamas.com/results?verified=true";

  if (
    !targetRedirect ||
    targetRedirect.includes("localhost:5000") ||
    (targetRedirect.includes("localhost") && (process.env.NODE_ENV === "production" || !redirectUrl?.includes("localhost:3000")))
  ) {
    targetRedirect = "https://linksmartbahamas.com/results?verified=true";
  } else if (targetRedirect.endsWith("http://localhost:3000") || targetRedirect.endsWith("http://localhost:3000/")) {
    targetRedirect = `${targetRedirect.replace(/\/$/, "")}/results?verified=true`;
  }

  const authUser = await findAuthUserByEmail(normalizedEmail);
  const { data: profile } = await client
    .from("user_profiles")
    .select("email_verified")
    .eq("email", normalizedEmail)
    .maybeSingle();

  const isVerified = Boolean(authUser?.email_confirmed_at) || Boolean(profile?.email_verified);

  if (isVerified) {
    if (profile && !profile.email_verified) {
      await client
        .from("user_profiles")
        .update({ email_verified: true, updated_at: new Date().toISOString() })
        .eq("email", normalizedEmail);
    }
    return {
      success: true,
      alreadyVerified: true,
      message: "Account is already verified. You can sign in now.",
      verificationLink: null,
      emailServiceConfigured: true,
    };
  }

  let actionLink = null;

  try {
    const { data, error } = await client.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      options: { redirectTo: targetRedirect },
    });
    if (!error && data?.properties?.action_link) {
      actionLink = data.properties.action_link;
    }
  } catch (_) {}

  if (!actionLink) {
    try {
      const { data, error } = await client.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: { redirectTo: targetRedirect },
      });
      if (!error && data?.properties?.action_link) {
        actionLink = data.properties.action_link;
      }
    } catch (_) {}
  }

  if (!actionLink) {
    try {
      const { data, error } = await client.auth.admin.generateLink({
        type: "recovery",
        email: normalizedEmail,
        options: { redirectTo: targetRedirect },
      });
      if (!error && data?.properties?.action_link) {
        actionLink = data.properties.action_link;
      }
    } catch (_) {}
  }

  try {
    await supabaseAuthRequest("/resend", {
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: targetRedirect,
      },
    });
  } catch (_) {}

  return {
    success: true,
    alreadyVerified: false,
    verificationLink: actionLink,
    emailServiceConfigured: false,
  };
}

async function changePassword(accessToken, payload) {
  const me = await getMeFromAccessToken(accessToken);
  const client = requireSupabaseClient();

  const policy = passwordPolicyCheck(payload.newPassword);
  if (!policy.valid) throwWeakPassword(policy);

  const reused = await checkPasswordReuse(me.userId, payload.newPassword);
  if (reused) {
    throw new AppError("Password was used recently. Choose a new password.", 400, { code: "password_reused" });
  }

  if (!me.email) {
    throw new AppError("Cannot verify current password without email.", 400, { code: "email_missing" });
  }

  try {
    await supabaseAuthRequest("/token?grant_type=password", {
      email: me.email,
      password: payload.currentPassword,
    });
  } catch (_) {
    throw new AppError("Current password is incorrect.", 400, { code: "current_password_invalid" });
  }

  const { error } = await client.auth.admin.updateUserById(me.userId, {
    password: payload.newPassword,
  });

  if (error) {
    throw new AppError("Failed to update password.", 500, { code: "password_update_failed", raw: error.message });
  }

  await savePasswordHistory(me.userId, payload.newPassword);
  await deleteOldPasswordHistory(me.userId);

  await client
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", me.userId)
    .is("revoked_at", null);

  return { success: true };
}

async function beginSocialLogin(payload) {
  const provider = String(payload.provider || "").toLowerCase();
  if (!["google", "azure"].includes(provider)) {
    throw new AppError("Unsupported social provider.", 400, { code: "provider_not_supported" });
  }

  const redirectTo = payload.redirectTo || env.AUTH_DEFAULT_REDIRECT_URL;
  if (!redirectTo) {
    throw new AppError("redirectTo is required for social login.", 400, { code: "redirect_missing" });
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data?.url) {
    throw new AppError("Failed to start social login.", 500, { code: "social_login_start_failed", raw: error?.message || null });
  }

  return {
    provider,
    authUrl: data.url,
  };
}

async function exchangeSupabaseSession(req, payload) {
  const client = requireSupabaseClient();
  const accessToken = String(payload.supabaseAccessToken || "");
  if (!accessToken) {
    throw new AppError("supabaseAccessToken is required.", 400, { code: "supabase_access_token_missing" });
  }

  const { data: userData, error } = await client.auth.getUser(accessToken);
  if (error || !userData?.user?.id) {
    throw new AppError("Invalid Supabase access token.", 401, { code: "supabase_access_token_invalid" });
  }

  const user = userData.user;
  const { profile, primaryRole } = await upsertUserProfile(user);

  if (!profile.email_verified) {
    throw new AppError("Please verify your email first.", 403, { code: "email_unverified" });
  }

  const factor = await getTotpFactor(user.id);
  const requiresMfa = shouldRequireMfa(primaryRole) || Boolean(factor?.is_active && factor?.is_verified);

  if (requiresMfa) {
    const ticket = await createLoginTicket({
      userId: user.id,
      role: primaryRole,
      email: user.email,
      passwordSignInPayload: {
        provider_user_id: user.id,
        email: normalizeEmail(user.email),
        role: primaryRole,
      },
    });

    return {
      mfaRequired: true,
      code: "mfa_required",
      ticket,
      role: primaryRole,
      methods: [MFA_METHODS.TOTP, MFA_METHODS.EMAIL_OTP],
    };
  }

  const session = await createSessionTokens({
    userId: user.id,
    email: normalizeEmail(user.email),
    role: primaryRole,
    mfaVerified: false,
    source: "social",
  });

  const actor = await buildActorFromUserId(user.id, user.email || null);
  await auditAdminAuthEvent(req, actor, "admin_login_success", "Social login successful.", { role: primaryRole });

  return {
    mfaRequired: false,
    role: primaryRole,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

async function disableTotp(userId) {
  const client = requireSupabaseClient();
  const factor = await getTotpFactor(userId);
  if (!factor) return { success: true };

  const { error } = await client
    .from("mfa_totp_factors")
    .update({ is_active: false })
    .eq("id", factor.id);

  if (error) {
    throw new AppError("Failed to disable TOTP.", 500, { code: "totp_disable_failed", raw: error.message });
  }

  await client
    .from("user_profiles")
    .update({ mfa_preferred_method: MFA_METHODS.EMAIL_OTP })
    .eq("user_id", userId);

  return { success: true };
}

module.exports = {
  registerUser,
  loginWithPassword,
  sendEmailOtpForTicket,
  verifyEmailOtpTicket,
  enrollTotpFactor,
  verifyTotpEnrollment,
  verifyTotpLogin,
  getMeFromAccessToken,
  refreshSessionTokens,
  revokeCurrentSession,
  revokeAllSessions,
  resendVerificationEmail,
  changePassword,
  beginSocialLogin,
  exchangeSupabaseSession,
  disableTotp,
  verifyAndLoadSession,
  touchSession,
  buildActorFromUserId,
  shouldRequireMfa,
  savePasswordHistory,
  deleteOldPasswordHistory,
};
