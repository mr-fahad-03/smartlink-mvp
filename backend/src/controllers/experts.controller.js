const { ZodError } = require("zod");

const { AppError } = require("../utils/app-error");
const { appendAdminAuditLog } = require("../services/admin-audit.service");
const { optimizeExpertProfileDraft } = require("../services/expert-profile-optimizer.service");
const { getMeFromAccessToken } = require("../services/auth.service");
const { submitExpertApplication, getMyExpertApplication } = require("../services/expert-applications.service");
const { optimizeProfileSchema, expertApplicationSubmitSchema } = require("../validators/experts.validator");

function getBearerToken(req) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header) return "";
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return "";
  return token.trim();
}

async function postSubmitExpertApplication(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }

  try {
    const payload = expertApplicationSubmitSchema.parse(req.body || {});
    const me = await getMeFromAccessToken(token);
    const data = await submitExpertApplication(me, payload);

    return res.status(201).json({
      success: true,
      message: "Expert application submitted for review.",
      data,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid expert application payload.", 400, error.flatten());
    }
    throw error;
  }
}

async function getMySubmittedApplication(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
  }

  const me = await getMeFromAccessToken(token);
  const data = await getMyExpertApplication(me);

  return res.json({
    success: true,
    data,
  });
}

async function postOptimizeExpertProfile(req, res) {
  try {
    const payload = optimizeProfileSchema.parse(req.body || {});
    const result = await optimizeExpertProfileDraft(req.params.id, payload);
    await appendAdminAuditLog({
      req,
      actor: req.adminActor,
      actionType: "expert_optimize_profile",
      targetType: "expert",
      targetId: req.params.id,
      previousValue: null,
      newValue: { draft_id: result.draft?.id || null, status: result.status || "draft" },
      notes: "Generated AI profile optimizer draft",
    });
    return res.status(201).json({
      success: true,
      message: "AI profile suggestions generated and saved as draft.",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid optimizer payload.", 400, error.flatten());
    }
    throw error;
  }
}

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { mkdirp } = require("mkdirp");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    // We expect the user to be resolved via middleware
    const userId = req.user?.id || req.user?.sub || "anonymous";
    const dir = path.join(__dirname, `../../uploads/experts/${userId}`);
    try {
      await mkdirp(dir);
      cb(null, dir);
    } catch (err) {
      cb(err, dir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

async function postUploadDocument(req, res) {
  if (!req.file) {
    throw new AppError("No file uploaded.", 400);
  }
  
  const userId = req.user?.id || req.user?.sub || "anonymous";
  // Create a relative URL path to be used by the frontend
  const fileUrl = `/uploads/experts/${userId}/${req.file.filename}`;
  
  return res.status(201).json({
    success: true,
    message: "Document uploaded successfully.",
    data: {
      fileUrl: fileUrl,
      fileName: req.file.originalname,
    }
  });
}

const { getDashboardOverview, updateExpertProfile } = require("../services/expert-workspace.service");

async function getExpertDashboardData(req, res) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new AppError("Missing bearer token.", 401, { code: "missing_bearer_token" });
    }

    const me = await getMeFromAccessToken(token);
    // The service expects the internal user ID (uuid)
    const dashboardData = await getDashboardOverview(me.userId);

    return res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    require("fs").appendFileSync("/tmp/debug-error.log", error.stack + "\\n");
    throw error;
  }
}

async function patchUpdateExpertProfile(req, res) {
  const token = getBearerToken(req);
  if (!token) throw new AppError("Missing bearer token.", 401);
  const me = await getMeFromAccessToken(token);

  // Allow partial updates on safe fields including packages and intro bio
  const allowedFields = [
    "name", "role", "organization", "location", "category_tags", "service_tags",
    "budget_range", "availability_status", "remote_available", "hourly_rate_usd",
    "years_experience", "custom_packages", "introduction_bio"
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const updatedProfile = await updateExpertProfile(me.userId, updates);

  return res.json({
    success: true,
    message: "Profile updated successfully.",
    data: updatedProfile,
  });
}

async function patchOpportunityStatus(req, res) {
  const token = getBearerToken(req);
  if (!token) throw new AppError("Missing bearer token.", 401);
  const me = await getMeFromAccessToken(token);

  const { id } = req.params;
  const { status } = req.body;
  if (!['accepted', 'declined', 'more_info'].includes(status)) {
    throw new AppError("Invalid status. Must be accepted, declined, or more_info.", 400);
  }

  const { updateOpportunityStatus } = require("../services/expert-workspace.service");
  const updatedOpp = await updateOpportunityStatus(me.userId, id, status);

  return res.json({
    success: true,
    message: `Opportunity ${status} successfully.`,
    data: updatedOpp,
  });
}

module.exports = {
  getMySubmittedApplication,
  postSubmitExpertApplication,
  postOptimizeExpertProfile,
  uploadMiddleware: upload.single("document"),
  postUploadDocument,
  getExpertDashboardData,
  patchUpdateExpertProfile,
  patchOpportunityStatus,
};
