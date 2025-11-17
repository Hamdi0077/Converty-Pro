import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  console.log('Creating test users...\n');

  const testUsers = [
    {
      email: 'merchant1@test.com',
      password: 'TestPassword123!',
      name: 'Tech Store Owner',
      shop: 'Tech Store',
    },
    {
      email: 'merchant2@test.com',
      password: 'TestPassword123!',
      name: 'Fashion Shop Owner',
      shop: 'Fashion Hub',
    },
  ];

  for (const user of testUsers) {
    try {
      // Create auth user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email for testing
      });

      if (error) {
        console.error(`Error creating user ${user.email}:`, error.message);
        continue;
      }

      console.log(`✓ Created user: ${user.email}`);
      console.log(`  User ID: ${data.user?.id}`);
      console.log(`  Shop: ${user.shop}\n`);
    } catch (err) {
      console.error(`Failed to create user ${user.email}:`, err);
    }
  }

  console.log('\nTest users created successfully!');
  console.log('\nNext steps:');
  console.log('1. Copy the user IDs from above');
  console.log('2. Update scripts/007_seed_correct_order.sql with the user IDs');
  console.log('3. Run the SQL script to create shops, categories, and products');
}

createTestUsers().catch(console.error);
