const express = require("express");

const { createIntroductions } = require("../controllers/introduction.controller");
const { asyncHandler } = require("../utils/async-handler");

const introductionRouter = express.Router();

introductionRouter.post("/", asyncHandler(createIntroductions));

module.exports = {
  introductionRouter,
};

