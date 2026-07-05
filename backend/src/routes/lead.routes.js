const express = require("express");

const { createLead } = require("../controllers/lead.controller");
const { asyncHandler } = require("../utils/async-handler");

const leadRouter = express.Router();

leadRouter.post("/", asyncHandler(createLead));

module.exports = {
  leadRouter,
};

