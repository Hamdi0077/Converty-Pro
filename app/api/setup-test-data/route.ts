import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    // Create test users
    const users = [
      {
        email: 'merchant1@test.com',
        password: 'TestPassword123!',
        shop: 'tech-store',
        name: 'Tech Store',
      },
      {
        email: 'merchant2@test.com',
        password: 'TestPassword123!',
        shop: 'fashion-hub',
        name: 'Fashion Hub',
      },
    ];

    const createdUsers = [];

    for (const user of users) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (error && !error.message.includes('already exists')) {
        console.error(`Error creating user ${user.email}:`, error);
        continue;
      }

      if (data?.user) {
        createdUsers.push({
          userId: data.user.id,
          email: user.email,
          shop: user.shop,
          name: user.name,
        });
      }
    }

    // Create shops
    for (const user of createdUsers) {
      const { error } = await supabase
        .from('shops')
        .insert({
          user_id: user.userId,
          name: user.name,
          slug: user.shop,
          description: `${user.name} - Test Shop`,
          currency: 'USD',
          tax_rate: 10,
        })
        .select();

      if (error && !error.message.includes('duplicate')) {
        console.error(`Error creating shop for ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test data setup completed',
      users: createdUsers,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup test data' },
      { status: 500 }
    );
  }
}
