const { z } = require("zod");

function sanitizeEmail(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^['"“”‘’]+|['"“”‘’]+$/g, "")
    .toLowerCase();
}

const emailSchema = z.preprocess((value) => sanitizeEmail(value), z.string().email());

const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  fullName: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["expert", "client"]),
  expertId: z.string().trim().min(2).max(120).optional(),
});

const loginPasswordSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  role: z.enum(["super_admin", "admin", "moderator", "auditor", "expert", "client"]).optional(),
  captchaToken: z.string().trim().optional(),
});

const socialLoginSchema = z.object({
  provider: z.enum(["google", "azure"]),
  redirectTo: z.string().url().optional(),
});

const socialExchangeSchema = z.object({
  supabaseAccessToken: z.string().min(10),
});

const mfaTicketSchema = z.object({
  ticket: z.string().min(16),
});

const mfaTotpVerifySchema = z.object({
  code: z.string().trim().min(6).max(8),
});

const mfaTotpChallengeSchema = z.object({
  ticket: z.string().min(16),
  code: z.string().trim().min(6).max(8),
});

const mfaEmailVerifySchema = z.object({
  ticket: z.string().min(16),
  code: z.string().trim().length(6),
});

const resendVerificationSchema = z.object({
  email: emailSchema,
  redirectUrl: z.string().optional(),
});

const refreshSessionSchema = z.object({
  refreshToken: z.string().min(16),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
});

module.exports = {
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
};
