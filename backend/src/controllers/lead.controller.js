const { ZodError } = require("zod");

const { createLeadSubmission } = require("../services/lead.service");
const { AppError } = require("../utils/app-error");
const { parseLeadSubmission } = require("../validators/lead-submission.validator");

async function createLead(req, res) {
  try {
    const parsedInput = parseLeadSubmission(req.body);
    const createdLead = await createLeadSubmission(parsedInput);
    return res.status(201).json({
      success: true,
      message: "Lead submission created successfully.",
      data: createdLead,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid lead submission payload.", 400, error.flatten());
    }
    throw error;
  }
}

module.exports = {
  createLead,
};

