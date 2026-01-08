const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  const users = [
    { email: 'admin@alansari.com', password: 'admin', full_name: 'Admin User', role: 'Admin', linked_engineer_id: null },
    { email: 'frontdesk@alansari.com', password: 'admin', full_name: 'Front Desk User', role: 'Front Desk', linked_engineer_id: null },
    { email: 'engineer1@alansari.com', password: 'admin', full_name: 'Engineer One', role: 'Engineer', linked_engineer_id: 'ENG1' },
    { email: 'engineer2@alansari.com', password: 'admin', full_name: 'Engineer Two', role: 'Engineer', linked_engineer_id: 'ENG2' },
  ];

  for (const user of users) {
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
          },
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠ ${user.email} already exists, skipping...`);
          
          // Try to get existing user and update users table
          const { data: { user: existingUser }, error: getUserError } = await supabase.auth.getUser();
          continue;
        } else {
          console.error(`✗ Error creating ${user.email}:`, authError.message);
          continue;
        }
      }

      console.log(`✓ Auth created: ${user.email}`);

      if (authData.user) {
        // Insert into users table
        const { error: dbError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            linked_engineer_id: user.linked_engineer_id,
          }, { onConflict: 'id' });

        if (dbError) {
          console.error(`✗ DB error for ${user.email}:`, dbError.message);
        } else {
          console.log(`✓ User record: ${user.email} (${user.role})`);
        }
      }
    } catch (err) {
      console.error(`✗ Error with ${user.email}:`, err.message);
    }
  }
}

createUsers().then(() => {
  console.log('\n✅ User creation process completed!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
