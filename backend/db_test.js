const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/mr-fahad-03/Downloads/Projects/MVP Project/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: links, error: le } = await supabase.from('expert_user_links').select('*');
  console.log('Links:', links);
  const { data: experts, error: ee } = await supabase.from('experts').select('*');
  console.log('Experts:', experts);
  const { data: apps, error: ae } = await supabase.from('expert_applications').select('*');
  console.log('Apps:', apps);
}
run();
