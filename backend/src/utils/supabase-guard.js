const { isSupabaseConfigured, supabase } = require("../config/supabase");
const { AppError } = require("./app-error");

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new AppError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).",
      500,
    );
  }
  return supabase;
}

module.exports = {
  requireSupabase,
};

