const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: __dirname + "/../.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const TARGET_EMAIL = (process.env.TARGET_EMAIL || "expert@gmail.com").trim().toLowerCase();
const TARGET_PASSWORD = process.env.TARGET_PASSWORD || "Asad@1122@";
const TARGET_ROLE = "expert";

async function findAuthUserByEmail(email) {
  const target = email.trim().toLowerCase();
  const perPage = 500;

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users || [];
    const match = users.find((item) => item?.email?.trim()?.toLowerCase() === target);
    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

async function run() {
  console.log(`Setting role '${TARGET_ROLE}' for email '${TARGET_EMAIL}'...`);

  let authUser = null;
  let userId = null;

  try {
    authUser = await findAuthUserByEmail(TARGET_EMAIL);
  } catch (err) {
    console.warn("Notice: supabase.auth.admin.listUsers requires SUPABASE_SERVICE_ROLE_KEY.");
    console.warn(`Reason: ${err.message}`);
  }

  if (authUser) {
    userId = authUser.id;
    console.log(`Found existing auth user ID: ${userId}`);

    const existingMetadata = authUser.user_metadata || {};
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: {
          ...existingMetadata,
          role: TARGET_ROLE,
          app_role: TARGET_ROLE,
        },
        app_metadata: {
          ...(authUser.app_metadata || {}),
          role: TARGET_ROLE,
          app_role: TARGET_ROLE,
        },
      });

      if (error) {
        console.error(`Failed to update Auth user: ${error.message}`);
      } else {
        console.log(`Updated Auth user password & confirmed email for ID: ${userId}`);
      }
    } catch (err) {
      console.warn(`Admin user update notice: ${err.message}`);
    }
  } else {
    console.log(`Attempting to create Auth user '${TARGET_EMAIL}'...`);
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: "Expert User",
          role: TARGET_ROLE,
          app_role: TARGET_ROLE,
        },
        app_metadata: {
          role: TARGET_ROLE,
          app_role: TARGET_ROLE,
        },
      });

      if (error) {
        console.error(`Failed to create Auth user via Admin API: ${error.message}`);
      } else if (data?.user) {
        userId = data.user.id;
        console.log(`Created Auth user ID: ${userId} with specified password.`);
      }
    } catch (err) {
      console.warn(`Admin createUser notice: ${err.message}`);
    }
  }

  // If userId is still unknown, try looking up user_profiles or signup via REST
  if (!userId) {
    const { data: prof } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("email", TARGET_EMAIL)
      .maybeSingle();
    if (prof?.user_id) {
      userId = prof.user_id;
      console.log(`Found user_id from user_profiles: ${userId}`);
    }
  }

  if (!userId) {
    console.log("No existing user_id found and Admin API unavailable. Attempting standard signup...");
    const base = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const anonKey = process.env.SUPABASE_ANON_KEY || supabaseServiceKey;
    const res = await fetch(`${base}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({
        email: TARGET_EMAIL,
        password: TARGET_PASSWORD,
        data: { full_name: "Expert User", app_role: TARGET_ROLE },
      }),
    });
    const body = await res.json();
    if (body?.user?.id) {
      userId = body.user.id;
      console.log(`Successfully signed up user ID: ${userId}`);
    } else {
      console.error("Signup response:", body);
    }
  }

  if (!userId) {
    console.error("Could not obtain user ID for expert. Please check SUPABASE_SERVICE_ROLE_KEY or delete existing user in Supabase Dashboard.");
    process.exit(1);
  }

  // 1. Upsert user_profiles
  console.log("Upserting user_profiles table...");
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        email: TARGET_EMAIL,
        role: TARGET_ROLE,
        full_name: authUser?.user_metadata?.full_name || "Expert User",
        status: "active",
        email_verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select();

  if (profileError) {
    console.error("user_profiles upsert error:", profileError.message);
  } else {
    console.log("Successfully updated user_profiles record:", profileData);
  }

  // 2. Check/Upsert experts record
  const expertId = `exp_${userId.replace(/-/g, "").substring(0, 12)}`;
  console.log(`Checking experts table for expert_id: ${expertId} or userId: ${userId}...`);

  const { data: existingExpert } = await supabase
    .from("experts")
    .select("*")
    .or(`expert_id.eq.${expertId},expert_id.eq.${userId}`)
    .maybeSingle();

  let finalExpertId = existingExpert?.expert_id || expertId;

  if (!existingExpert) {
    console.log(`Creating expert profile in 'experts' table with ID: ${finalExpertId}...`);
    const { error: expertErr } = await supabase.from("experts").upsert(
      {
        expert_id: finalExpertId,
        name: authUser?.user_metadata?.full_name || "Expert User",
        role: "Financial & Business Consultant",
        organization: "SmartLink Experts",
        tier: "verified",
        is_verified: true,
        matching_visibility: "visible",
        hourly_rate_usd: 150,
        years_experience: 5,
        rating: 5.0,
        review_count: 0,
      },
      { onConflict: "expert_id" }
    );

    if (expertErr) {
      console.error("experts upsert error:", expertErr.message);
    } else {
      console.log("Successfully created experts record.");
    }
  } else {
    console.log("Existing expert profile found:", existingExpert.expert_id);
  }

  // 3. Link user_id to expert_id in expert_user_links if table exists
  try {
    const { error: linkErr } = await supabase
      .from("expert_user_links")
      .upsert(
        {
          user_id: userId,
          expert_id: finalExpertId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (linkErr) {
      console.warn("expert_user_links warning (table may not exist or optional):", linkErr.message);
    } else {
      console.log("Successfully updated expert_user_links table.");
    }
  } catch (err) {
    console.warn("expert_user_links note:", err.message);
  }

  console.log("\n==========================================");
  console.log(`SUCCESS: Role '${TARGET_ROLE}' assigned to ${TARGET_EMAIL}`);
  console.log(`User ID: ${userId}`);
  console.log(`Expert ID: ${finalExpertId}`);
  console.log(`Password set to: ${TARGET_PASSWORD}`);
  console.log("==========================================");
}

run().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});

