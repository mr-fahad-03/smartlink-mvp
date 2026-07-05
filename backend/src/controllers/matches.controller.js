const { ZodError } = require("zod");

const { AppError } = require("../utils/app-error");
const { recommendMatchesSchema } = require("../validators/matches.validator");
const { recommendExperts } = require("../services/matching.service");

async function recommendMatches(req, res) {
  try {
    const payload = recommendMatchesSchema.parse(req.body || {});
    const recommendations = await recommendExperts(payload);
    return res.json({
      success: true,
      data: {
        count: recommendations.length,
        recommendations,
      },
    }); 
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Invalid match recommendation payload.", 400, error.flatten());
    }
    throw error;
  }
}

module.exports = {
  recommendMatches,
};

