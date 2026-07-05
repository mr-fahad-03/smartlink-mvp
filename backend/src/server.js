const { app } = require("./app");
const { env, getEnvSummary } = require("./config/env");

app.listen(env.PORT, () => {
  const summary = getEnvSummary();
  console.log(`Server listening on port ${summary.port} (${summary.nodeEnv})`);
  console.log(`API ready at ${summary.apiPrefix}`);
});
 