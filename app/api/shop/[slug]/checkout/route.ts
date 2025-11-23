import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { productId, quantity, customer } = body;

    if (!productId || !quantity || !customer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!customer.name || !customer.phone || !customer.address) {
      return NextResponse.json(
        { error: "Missing required customer fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1) Get shop by slug
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", slug)
      .single();

    if (shopError || !shop) {
      console.error("Shop error:", shopError);
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    // 2) Get product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price, quantity")
      .eq("shop_id", shop.id)
      .eq("id", productId)
      .single();

    if (productError || !product) {
      console.error("Product error:", productError);
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 3) Validate quantity
    const qty = Math.max(1, parseInt(quantity) || 1);
    if (qty > (product.quantity || 0)) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 }
      );
    }

    // 4) Calculate total
    const total = qty * product.price;

    // 5) Create order
    // Note: customer_email is required in schema, generate one if not provided
    const customerEmail = customer.email || `customer-${Date.now()}@checkout.local`;
    
    // Build order data - use both old and new column names for compatibility
    const orderData: any = {
      shop_id: shop.id,
      customer_email: customerEmail,
      customer_name: customer.name,
      customer_phone: customer.phone,
      status: "pending",
      total_amount: total,
      payment_method: "cash_on_delivery",
    };

    // Add optional fields if columns exist
    if (customer.city) orderData.customer_city = customer.city;
    if (customer.address) {
      orderData.customer_address = customer.address;
      orderData.shipping_address = customer.address; // Also set shipping_address for compatibility
    }
    if (customer.notes) {
      orderData.customer_notes = customer.notes;
      orderData.notes = customer.notes; // Also set notes for compatibility
    }
    
    // Insert order with fallback: if Supabase schema cache complains about a missing column,
    // remove that field and retry. This makes the API resilient to slightly different schemas.
    async function insertWithFallback(table: string, payload: any) {
      const triedRemoved: Set<string> = new Set();
      let dataToInsert = { ...payload };

      for (let attempt = 0; attempt < 10; attempt++) {
        const { data: result, error } = await supabase
          .from(table)
          .insert(dataToInsert)
          .select("id")
          .single();

        if (!error && result) return { data: result, error: null };

        const msg = error?.message || "";
        console.error(`${table} insert error:`, msg);

        // supabase/schema cache message pattern:
        // Could not find the 'customer_email' column of 'orders' in the schema cache
        const match1 = msg.match(/Could not find the '([^']+)' column of '([^']+)'/);
        // postgres style: column "unit_price" of relation "order_items" does not exist
        const match2 = msg.match(/column "([^"]+)" of relation "([^"]+)" does not exist/);

        const missingCol = match1 ? match1[1] : match2 ? match2[1] : null;

        if (missingCol && missingCol in dataToInsert && !triedRemoved.has(missingCol)) {
          // remove the offending column and retry
          triedRemoved.add(missingCol);
          delete dataToInsert[missingCol];
          // continue to next attempt
          continue;
        }

        // If we can't parse a missing column or already removed it, return the error
        return { data: null, error };
      }

      return { data: null, error: { message: "Exceeded insert retry attempts" } };
    }

    const { data: order, error: orderError } = await insertWithFallback("orders", orderData);

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: orderError?.message || "Failed to create order" },
        { status: 500 }
      );
    }

    // 6) Create order item
    // Prepare possible item payloads - include common variants (price, unit_price, subtotal)
    const itemPayload: any = {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      price: product.price,
      unit_price: product.price,
      subtotal: qty * product.price,
    };

    const { data: itemData, error: itemError } = await insertWithFallback("order_items", itemPayload);

    if (itemError || !itemData) {
      console.error("Order item insert error:", itemError);
      // Try to delete the order if item creation fails
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: itemError?.message || "Failed to create order item" },
        { status: 500 }
      );
    }

    // 7) Update product stock
    const newStock = (product.quantity || 0) - qty;
    if (newStock >= 0) {
      await supabase
        .from("products")
        .update({ quantity: newStock })
        .eq("id", product.id);
    }

    return NextResponse.json({ orderId: order.id });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

