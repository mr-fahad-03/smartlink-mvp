const { ZodError } = require("zod");

const { AppError } = require("../utils/app-error");
const { privateFeedbackSchema } = require("../validators/feedback.validator");
const { createPrivateFeedback } = require("../services/feedback.service");

async function submitPrivateFeedback(req, res) {
  try {
    const payload = privateFeedbackSchema.parse(req.body || {});
    const created = await createPrivateFeedback(payload);
    return res.status(201).json({
      success: true,
      message: "Feedback saved.",
      data: created,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid private feedback payload.", 400, error.flatten());
    }
    throw error;
  }
}

module.exports = {
  submitPrivateFeedback,
};

