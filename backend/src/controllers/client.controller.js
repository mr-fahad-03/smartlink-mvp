const { AppError } = require("../utils/app-error");
const { getClientDashboardOverview, submitClientReview } = require("../services/client-workspace.service");

async function getClientDashboard(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      throw new AppError("No email associated with this token.", 400);
    }
    const data = await getClientDashboardOverview(email);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    throw error;
  }
}

async function postClientReview(req, res) {
  try {
    const userId = req.user?.userId;
    const email = req.user?.email;
    if (!userId || !email) {
      throw new AppError("Missing authenticated user details.", 401);
    }
    
    const { leadId, expertId, publicStarRating, publicReviewComment, wouldRecommend, matchHelpfulRating, feedbackReason } = req.body;
    
    if (!leadId || !expertId || !publicStarRating) {
      throw new AppError("Missing required fields: leadId, expertId, publicStarRating", 400);
    }
    
    const rating = Number(publicStarRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new AppError("Rating must be a number between 1 and 5.", 400);
    }

    const data = await submitClientReview(userId, email, {
      leadId,
      expertId,
      publicStarRating: rating,
      publicReviewComment,
      wouldRecommend,
      matchHelpfulRating,
      feedbackReason,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully and is pending moderation.",
      data,
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getClientDashboard,
  postClientReview,
};
