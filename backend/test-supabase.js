const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function test() {
  console.log("Checking user_profiles...");
  const { data, error } = await client
    .from("user_profiles")
    .select("user_id, email")
    .limit(1);

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success! Data:", data);
  }
}

test();


