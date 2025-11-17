// Script to create test users in Supabase Auth
// Run with: node scripts/006_create_test_users.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const testUsers = [
  {
    email: 'merchant1@test.com',
    password: 'TestPassword123!',
    shopName: 'Tech Store',
    shopSlug: 'tech-store',
    shopId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440000',
  },
  {
    email: 'merchant2@test.com',
    password: 'TestPassword123!',
    shopName: 'Fashion Hub',
    shopSlug: 'fashion-hub',
    shopId: '550e8400-e29b-41d4-a716-446655440002',
    userId: '550e8400-e29b-41d4-a716-446655440001',
  },
];

async function createTestUsers() {
  console.log('Creating test users in Supabase Auth...\n');

  for (const user of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`Error creating auth user for ${user.email}:`, authError);
        continue;
      }

      console.log(`✓ Created auth user: ${user.email}`);

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: user.email,
          shop_name: user.shopName,
          shop_slug: user.shopSlug,
        });

      if (profileError) {
        console.error(`Error creating user profile:`, profileError);
        continue;
      }

      console.log(`✓ Created user profile for ${user.email}`);

      // Create shop
      const { error: shopError } = await supabase
        .from('shops')
        .insert({
          id: user.shopId,
          user_id: authData.user.id,
          name: user.shopName,
          slug: user.shopSlug,
          description: `Welcome to ${user.shopName}! We offer quality products.`,
          primary_color: '#3b82f6',
          secondary_color: '#1e40af',
        });

      if (shopError) {
        console.error(`Error creating shop:`, shopError);
        continue;
      }

      console.log(`✓ Created shop: ${user.shopName}\n`);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  console.log('Test user creation completed!\n');
  console.log('TEST CREDENTIALS:');
  console.log('================\n');
  testUsers.forEach((user, index) => {
    console.log(`Merchant ${index + 1}:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Shop: ${user.shopName}`);
    console.log(`Shop URL: http://localhost:3000/shop/${user.shopSlug}\n`);
  });
}

createTestUsers().catch(console.error);
