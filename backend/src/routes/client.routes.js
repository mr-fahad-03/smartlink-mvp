const express = require("express");
const { getClientDashboard, postClientReview } = require("../controllers/client.controller");
const { requireUserAuth } = require("../middleware/user-auth");
const { asyncHandler } = require("../utils/async-handler");

const clientRouter = express.Router();

clientRouter.get("/dashboard", requireUserAuth, asyncHandler(getClientDashboard));
clientRouter.post("/reviews", requireUserAuth, asyncHandler(postClientReview));

module.exports = {
  clientRouter,
};
