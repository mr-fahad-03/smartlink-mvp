const express = require("express");

const { recommendMatches } = require("../controllers/matches.controller");
const { asyncHandler } = require("../utils/async-handler");

const matchesRouter = express.Router();

matchesRouter.post("/recommend", asyncHandler(recommendMatches));

module.exports = {
  matchesRouter,
};

