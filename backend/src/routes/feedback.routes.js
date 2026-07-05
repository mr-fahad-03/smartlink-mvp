const express = require("express");

const { submitPrivateFeedback } = require("../controllers/feedback.controller");
const { asyncHandler } = require("../utils/async-handler");

const feedbackRouter = express.Router();

feedbackRouter.post("/private", asyncHandler(submitPrivateFeedback));

module.exports = {
  feedbackRouter,
};

