const { ZodError } = require("zod");

const { AppError } = require("../utils/app-error");
const { createIntroductionRequestsSchema } = require("../validators/introduction.validator");
const { createIntroductionRequests } = require("../services/introduction.service");

async function createIntroductions(req, res) {
  try {
    const payload = createIntroductionRequestsSchema.parse(req.body || {});
    const created = await createIntroductionRequests(payload);
    return res.status(201).json({
      success: true,
      message: "Introduction requests created.",
      data: created,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid introduction payload.", 400, error.flatten());
    }
    throw error;
  }
}

module.exports = {
  createIntroductions,
};

