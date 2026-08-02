const { ZodError } = require("zod");

const { AppError } = require("../utils/app-error");
const {
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
} = require("../services/auth.service");
const {
  registerSchema,
  loginPasswordSchema,
  socialLoginSchema,
  socialExchangeSchema,
  mfaTicketSchema,
  mfaTotpVerifySchema,
  mfaTotpChallengeSchema,
  mfaEmailVerifySchema,
  resendVerificationSchema,
  refreshSessionSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");

function parseWithSchema(schema, payload, message) {
  try {
    return schema.parse(payload || {});
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(message, 400, {
        code: "validation_error",
        fields: error.flatten(),
      });
    }
    throw error;
  }
}

function getBearerToken(req) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header) return "";
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return "";
  return token.trim();
}

async function postRegister(req, res) {
  const payload = parseWithSchema(registerSchema, req.body, "Invalid registration payload.");
  const data = await registerUser(req, payload);
  return res.status(201).json({
    success: true,
    message: "Registration successful. Verify email before login.",
    data,
  });
}

async function postLoginPassword(req, res) {
  const payload = parseWithSchema(loginPasswordSchema, req.body, "Invalid login payload.");
  const data = await loginWithPassword(req, payload);
  return res.json({
    success: true,
    message: data.mfaRequired ? "MFA challenge required." : "Login successful.",
    data,
  });
}

async function postLoginSocial(req, res) {
  const payload = parseWithSchema(socialLoginSchema, req.body, "Invalid social login payload.");
  const data = await beginSocialLogin(payload);
  return res.json({ success: true, data });
}

async function postLoginSocialExchange(req, res) {
  const payload = parseWithSchema(socialExchangeSchema, req.body, "Invalid social exchange payload.");
  const data = await exchangeSupabaseSession(req, payload);
  return res.json({
    success: true,
    message: data.mfaRequired ? "MFA challenge required." : "Login successful.",
    data,
  });
}

async function postMfaEmailSend(req, res) {
  const payload = parseWithSchema(mfaTicketSchema, req.body, "Invalid MFA email payload.");
  const data = await sendEmailOtpForTicket(payload.ticket);
  return res.json({
    success: true,
    message: "OTP challenge created.",
    data,
  });
}

async function postMfaEmailVerify(req, res) {
  const payload = parseWithSchema(mfaEmailVerifySchema, req.body, "Invalid email OTP verification payload.");
  const data = await verifyEmailOtpTicket(req, payload);
  return res.json({
    success: true,
    message: "MFA verified successfully.",
    data,
  });
}

async function postMfaTotpEnroll(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }
  const me = await getMeFromAccessToken(token);
  const data = await enrollTotpFactor(me.userId, me.email || "user@smartlink.local");
  return res.status(201).json({ success: true, data });
}

async function postMfaTotpVerify(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }
  const payload = parseWithSchema(mfaTotpVerifySchema, req.body, "Invalid TOTP verification payload.");
  const me = await getMeFromAccessToken(token);
  const data = await verifyTotpEnrollment(me.userId, payload.code);
  return res.json({ success: true, data });
}

async function postMfaTotpChallenge(req, res) {
  const payload = parseWithSchema(mfaTotpChallengeSchema, req.body, "Invalid TOTP challenge payload.");
  const data = await verifyTotpLogin(req, payload);
  return res.json({
    success: true,
    message: "MFA verified successfully.",
    data,
  });
}

async function postMfaTotpDisable(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }
  const me = await getMeFromAccessToken(token);
  const data = await disableTotp(me.userId);
  return res.json({ success: true, data });
}

async function postEmailResendVerification(req, res) {
  const payload = parseWithSchema(resendVerificationSchema, req.body, "Invalid resend verification payload.");
  const origin = payload.redirectUrl || req.headers.origin || (req.headers.host ? `${req.secure ? "https" : "http"}://${req.headers.host}` : null);
  const data = await resendVerificationEmail(payload.email, origin);
  return res.json({ success: true, data });
}

async function getSessionMe(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }
  const data = await getMeFromAccessToken(token);
  return res.json({ success: true, data });
}

async function postSessionRefresh(req, res) {
  const payload = parseWithSchema(refreshSessionSchema, req.body, "Invalid refresh payload.");
  const data = await refreshSessionTokens(payload);
  return res.json({ success: true, data });
}

async function postSessionLogout(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }
  const data = await revokeCurrentSession(token);
  return res.json({ success: true, data });
}

async function postSessionRevokeAll(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }
  const data = await revokeAllSessions(req, token);
  return res.json({ success: true, data });
}

async function postPasswordChange(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }
  const payload = parseWithSchema(changePasswordSchema, req.body, "Invalid password change payload.");
  const data = await changePassword(token, payload);
  return res.json({ success: true, data });
}

module.exports = {
  postRegister,
  postLoginPassword,
  postLoginSocial,
  postLoginSocialExchange,
  postMfaEmailSend,
  postMfaEmailVerify,
  postMfaTotpEnroll,
  postMfaTotpVerify,
  postMfaTotpChallenge,
  postMfaTotpDisable,
  postEmailResendVerification,
  getSessionMe,
  postSessionRefresh,
  postSessionLogout,
  postSessionRevokeAll,
  postPasswordChange,
};
