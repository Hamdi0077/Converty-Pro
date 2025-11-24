import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import PurchaseTracker from "@/components/shop/PurchaseTracker";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_city: string | null;
  customer_address: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image_url: string | null;
    } | null;
  }>;
}

async function OrderSummary({ orderId, shopSlug }: { orderId: string; shopSlug: string }) {
  const supabase = await createClient();

  // Get shop first (include theme fields)
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, primary_color, secondary_color")
    .eq("slug", shopSlug)
    .single();

  const primary = shop?.primary_color || "#06b6d4";

  if (!shop) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">Boutique introuvable</p>
        <Link href={`/shop/${shopSlug}`} className="text-xs hover:underline" style={{ color: primary }}>
          Retour à la boutique
        </Link>
      </div>
    );
  }

  // Get order with items
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      customer_name,
      customer_phone,
      customer_city,
      customer_address,
      total_amount,
      status,
      created_at,
      order_items (
        id,
        product_name,
        quantity,
        price,
        product:products (
          id,
          name,
          image_url
        )
      )
    `
    )
    .eq("id", orderId)
    .eq("shop_id", shop.id)
    .single();

  if (error || !order) {
    // If order lookup fails, still show a friendly confirmation card so the customer
    // sees a success message and clear action to return to the shop.
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100 max-w-xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Votre commande a été validée</h1>
          <p className="text-slate-600 mb-4">Merci — votre commande a bien été prise en compte.</p>
          {orderId && (
            <p className="text-sm text-slate-500 mb-4">Numéro de commande: <span className="font-mono">{orderId.toString().slice(0,8)}</span></p>
          )}
          <div className="mt-4">
            <Link href={`/shop/${shopSlug}`} className="inline-block px-6 py-3 rounded-full text-white font-semibold" style={{ backgroundColor: primary }}>
              Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderData = order as unknown as Order;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100">
      {/* Purchase tracker (client) - dynamically import to avoid SSR */}
      {/**/}
      <DynamicPurchaseTracker
        orderId={orderData.id}
        total={orderData.total_amount}
        currency={"TND"}
        items={orderData.order_items || []}
      />
      {/* Success message */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <svg
            className="w-8 h-8 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          Merci pour votre achat !
        </h1>
        <p className="text-slate-600">
          Votre commande a été enregistrée avec succès.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Numéro de commande: <span className="font-mono">{orderData.id.slice(0, 8)}</span>
        </p>
      </div>

      {/* Order summary */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Résumé de la commande
        </h2>

        {/* Order items */}
        <div className="space-y-3">
          {orderData.order_items?.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              {item.product?.image_url && (
                <div className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 flex-shrink-0">
                  <Image
                    src={item.product.image_url}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">
                  {item.product_name}
                </p>
                <p className="text-sm text-slate-600">
                  Quantité: {item.quantity} × {item.price} TND
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">
                  {(item.quantity * item.price).toFixed(2)} TND
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-slate-800">Total</span>
            <span className="text-2xl font-bold" style={{ color: primary }}>
              {orderData.total_amount.toFixed(2)} TND
            </span>
          </div>
        </div>

        {/* Customer info */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <h3 className="font-semibold text-slate-800">Informations de livraison</h3>
          <div className="text-sm text-slate-600 space-y-1">
            <p>
              <span className="font-medium">Nom:</span> {orderData.customer_name}
            </p>
            {orderData.customer_phone && (
              <p>
                <span className="font-medium">Téléphone:</span> {orderData.customer_phone}
              </p>
            )}
            {orderData.customer_address && (
              <p>
                <span className="font-medium">Adresse:</span> {orderData.customer_address}
              </p>
            )}
            {orderData.customer_city && (
              <p>
                <span className="font-medium">Ville:</span> {orderData.customer_city}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Statut</span>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
              {orderData.status === "pending" ? "En attente" : orderData.status}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <Link
          href={`/shop/${shopSlug}`}
          className="block w-full text-center py-3 rounded-full text-white font-semibold transition-colors"
          style={{ backgroundColor: primary }}
        >
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { slug: shopSlug } = await params;
  const { orderId } = await searchParams;

  // Fetch shop to get theme colors for the header
  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, primary_color, secondary_color")
    .eq("slug", shopSlug)
    .single();

  if (!orderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Aucune commande spécifiée</p>
          <Link
            href={`/shop/${shopSlug}`}
            className="text-sky-600 hover:underline"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  // build header gradient using shop theme if available
  const primary = shop?.primary_color || "#06b6d4"; // sky-500 fallback
  const secondary = shop?.secondary_color || "#6366f1"; // indigo-600 fallback
  const headerStyle = { background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 100%)` };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER - themed */}
      <section style={headerStyle} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
          <div className="text-[11px] text-white/85 flex items-center gap-1">
            <Link href={`/shop/${shopSlug}`} className="hover:underline">
              Boutique
            </Link>
            <span className="opacity-60">/</span>
            <span>Confirmation</span>
          </div>
          {shop?.name && (
            <h2 className="mt-2 text-xl font-semibold">{shop.name}</h2>
          )}
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-3xl mx-auto px-4 py-12 -mt-12 relative z-10">
        <div className="flex items-start justify-center">
          <Suspense
            fallback={
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center w-full">
                <div className="animate-pulse text-slate-500">Chargement de la commande...</div>
              </div>
            }
          >
            <OrderSummary orderId={orderId} shopSlug={shopSlug} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

