const { getEnvSummary } = require("../config/env");
const { isSupabaseConfigured } = require("../config/supabase");

function getHealth(req, res) { // eslint-disable-line no-unused-vars
  res.json({
    success: true,
    message: "Backend is healthy.",
    data: {
      timestamp: new Date().toISOString(),
      env: getEnvSummary(),
      supabaseConfigured: isSupabaseConfigured,
    },
  });
}

module.exports = {
  getHealth,
};

