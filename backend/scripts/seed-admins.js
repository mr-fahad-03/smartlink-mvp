const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const admins = [
  {
    email: "superadmin@gmail.com",
    password: "Asad@1122@",
    role: "super_admin",
    fullName: "Super Admin"
  },
  {
    email: "admin@gmail.com",
    password: "Asad@1122@",
    role: "admin",
    fullName: "Admin User"
  }
];

async function findAuthUserByEmail(email) {
  const target = email.trim().toLowerCase();
  const perPage = 500;

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const users = data?.users || [];
    const match = users.find((item) => item?.email?.trim()?.toLowerCase() === target);
    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

async function seed() {
  console.log("Starting admin seeding process...");

  for (const admin of admins) {
    console.log(`\nProcessing ${admin.email} (${admin.role})...`);
    let authUser = await findAuthUserByEmail(admin.email);
    let userId = null;

    let targetPassword = admin.password;

    if (authUser) {
      userId = authUser.id;
      console.log(`User already exists in Supabase Auth (ID: ${userId}). Updating password...`);
      
      let { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: targetPassword,
        email_confirm: true,
        user_metadata: {
          full_name: admin.fullName,
          app_role: admin.role
        }
      });

      if (error && admin.fallbackPassword) {
        console.warn(`Failed to update password to '${targetPassword}': ${error.message}. Trying fallback password '${admin.fallbackPassword}'...`);
        targetPassword = admin.fallbackPassword;
        const fallbackRes = await supabase.auth.admin.updateUserById(userId, {
          password: targetPassword,
          email_confirm: true,
          user_metadata: {
            full_name: admin.fullName,
            app_role: admin.role
          }
        });
        if (fallbackRes.error) {
          throw new Error(`Failed to update user with fallback password: ${fallbackRes.error.message}`);
        }
        console.log(`Successfully updated password to fallback password: ${targetPassword}`);
      } else if (error) {
        throw new Error(`Failed to update user password: ${error.message}`);
      } else {
        console.log(`Successfully updated password to: ${targetPassword}`);
      }
    } else {
      console.log(`Creating new user in Supabase Auth...`);
      let { data, error } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: targetPassword,
        email_confirm: true,
        user_metadata: {
          full_name: admin.fullName,
          app_role: admin.role
        }
      });

      if (error && admin.fallbackPassword) {
        console.warn(`Failed to create user with password '${targetPassword}': ${error.message}. Trying fallback password '${admin.fallbackPassword}'...`);
        targetPassword = admin.fallbackPassword;
        const fallbackRes = await supabase.auth.admin.createUser({
          email: admin.email,
          password: targetPassword,
          email_confirm: true,
          user_metadata: {
            full_name: admin.fullName,
            app_role: admin.role
          }
        });
        if (fallbackRes.error) {
          throw new Error(`Failed to create user with fallback password: ${fallbackRes.error.message}`);
        }
        userId = fallbackRes.data.user.id;
        console.log(`Successfully created user with fallback password: ${targetPassword} (ID: ${userId})`);
      } else if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
      } else {
        userId = data.user.id;
        console.log(`Successfully created user with password: ${targetPassword} (ID: ${userId})`);
      }
    }

    // 1. Upsert user_profiles
    console.log(`Upserting user_profile record...`);
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: userId,
        email: admin.email.trim().toLowerCase(),
        role: admin.role,
        full_name: admin.fullName,
        status: "active",
        email_verified: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (profileError) {
      throw new Error(`Failed to upsert user_profile: ${profileError.message}`);
    }
    console.log(`Successfully upserted user_profile.`);

    // 2. Upsert admin_user_roles
    console.log(`Upserting admin_user_role record...`);
    const { error: roleError } = await supabase
      .from("admin_user_roles")
      .upsert({
        user_id: userId,
        role: admin.role,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id,role" });

    if (roleError) {
      throw new Error(`Failed to upsert admin_user_role: ${roleError.message}`);
    }
    console.log(`Successfully upserted admin_user_role.`);

    // 3. Upsert auth_security_state
    console.log(`Upserting auth_security_state record...`);
    const { error: securityError } = await supabase
      .from("auth_security_state")
      .upsert({
        user_id: userId,
        failed_count: 0,
        suspicious_score: 0,
        lock_until: null,
        captcha_required_until: null,
        mfa_pending: false,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (securityError) {
      throw new Error(`Failed to upsert auth_security_state: ${securityError.message}`);
    }
    console.log(`Successfully upserted auth_security_state.`);
  }

  console.log("\nAll administrators seeded successfully!");
}

seed().catch((err) => {
  console.error("\nSeeding failed with error:", err.message);
  process.exit(1);
});
