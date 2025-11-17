// API endpoint to populate test data
// GET /api/seed - Seeds the database with test data

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Fetch existing categories and products to verify seeding
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: products } = await supabase.from('products').select('*');
    const { data: orders } = await supabase.from('orders').select('*');

    return NextResponse.json(
      {
        success: true,
        message: 'Database seeded with test data',
        summary: {
          categories: categories?.length || 0,
          products: products?.length || 0,
          orders: orders?.length || 0,
        },
        testCredentials: [
          {
            email: 'merchant1@test.com',
            password: 'TestPassword123!',
            shop: 'Tech Store',
            shopUrl: '/shop/tech-store',
          },
          {
            email: 'merchant2@test.com',
            password: 'TestPassword123!',
            shop: 'Fashion Hub',
            shopUrl: '/shop/fashion-hub',
          },
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
