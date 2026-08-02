const express = require("express");

const { healthRouter } = require("./health.routes");
const { leadRouter } = require("./lead.routes");
const { matchesRouter } = require("./matches.routes");
const { introductionRouter } = require("./introduction.routes");
const { feedbackRouter } = require("./feedback.routes");
const { reviewsRouter } = require("./reviews.routes");
const { adminRouter } = require("./admin.routes");
const { expertsRouter } = require("./experts.routes");
const { authRouter } = require("./auth.routes");
const { clientRouter } = require("./client.routes");

const apiRouter = express.Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/leads", leadRouter);
apiRouter.use("/matches", matchesRouter);
apiRouter.use("/introduction-requests", introductionRouter);
apiRouter.use("/feedback", feedbackRouter);
apiRouter.use("/reviews", reviewsRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/experts", expertsRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/client", clientRouter);

module.exports = {
  apiRouter,
};
