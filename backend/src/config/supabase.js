const { createClient } = require("@supabase/supabase-js");

const { env, getSupabaseKey } = require("./env");

const supabaseKey = getSupabaseKey();
const isSupabaseConfigured = Boolean(env.SUPABASE_URL && supabaseKey);

const supabase = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL, supabaseKey, {
      auth: { persistSession: false },
    })
  : null;
module.exports = {
  supabase,
  isSupabaseConfigured,
};
 
