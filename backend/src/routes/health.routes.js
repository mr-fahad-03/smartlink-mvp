const express = require("express");

const { getHealth } = require("../controllers/health.controller");

const healthRouter = express.Router();

healthRouter.get("/", getHealth);

module.exports = {
  healthRouter,
};

