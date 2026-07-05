const express = require("express");

const {
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
} = require("../controllers/auth.controller");
const { authLoginRateLimit } = require("../middleware/auth-rate-limit");
const { asyncHandler } = require("../utils/async-handler");

const authRouter = express.Router();

authRouter.post("/register", asyncHandler(postRegister));
authRouter.post("/login/password", authLoginRateLimit, asyncHandler(postLoginPassword));
authRouter.post("/login/social", asyncHandler(postLoginSocial));
authRouter.post("/login/social/exchange", asyncHandler(postLoginSocialExchange));

authRouter.post("/mfa/totp/enroll", asyncHandler(postMfaTotpEnroll));
authRouter.post("/mfa/totp/verify", asyncHandler(postMfaTotpVerify));
authRouter.post("/mfa/totp/challenge", asyncHandler(postMfaTotpChallenge));
authRouter.post("/mfa/totp/disable", asyncHandler(postMfaTotpDisable));

authRouter.post("/mfa/email/send", asyncHandler(postMfaEmailSend));
authRouter.post("/mfa/email/verify", asyncHandler(postMfaEmailVerify));

authRouter.post("/email/resend-verification", asyncHandler(postEmailResendVerification));

authRouter.get("/session/me", asyncHandler(getSessionMe));
authRouter.post("/session/refresh", asyncHandler(postSessionRefresh));
authRouter.post("/session/logout", asyncHandler(postSessionLogout));
authRouter.post("/session/revoke-all", asyncHandler(postSessionRevokeAll));
authRouter.post("/logout", asyncHandler(postSessionLogout));

authRouter.post("/password/change", asyncHandler(postPasswordChange));

module.exports = {
  authRouter,
};
