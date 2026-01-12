// Run with: node create-users.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAccount(email, role) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: 'password123',
    email_confirm: true,
    user_metadata: { full_name: role.toUpperCase(), role: role }
  });

  if (error) console.log(`❌ Error for ${role}:`, error.message);
  else console.log(`✅ ${role.toUpperCase()} Created:`, data.user.email);
}

async function main() {
  await createAccount('saltondeveloper@gmail.com', 'admin');
  await createAccount('ubumwehouseltd@gmail.com', 'manager');
}

main();