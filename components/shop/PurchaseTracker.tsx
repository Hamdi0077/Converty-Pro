"use client";

import { useEffect } from "react";
import { track, initPixel } from "@/lib/fbpixel";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  product?: { id?: string } | null;
}

interface Props {
  orderId: string;
  total: number;
  currency?: string;
  items: OrderItem[];
  pixelId?: string; // optional if you want to init here
}

export default function PurchaseTracker({ orderId, total, currency = "TND", items, pixelId }: Props) {
  useEffect(() => {
    // Optionally initialize pixel here if you store pixel id in env and want to force init
    if (pixelId) {
      initPixel(pixelId).catch((e) => console.warn("FB init failed:", e));
    }

    try {
      const content_ids = items
        .map((it) => it.product?.id || null)
        .filter(Boolean) as string[];

      const num_items = items.reduce((s, it) => s + (it.quantity || 0), 0);

      const payload: Record<string, any> = {
        content_ids: content_ids.length ? content_ids : undefined,
        content_type: "product",
        value: total,
        currency,
        num_items,
        order_id: orderId,
      };

      // Track Purchase event client-side — fbq will queue if not ready
      track("Purchase", payload);
      // Also track a custom event_id for potential dedup if server-side CAPI is used
    } catch (err) {
      console.warn("PurchaseTracker error:", err);
    }
  }, [orderId, total, currency, items, pixelId]);

  return null;
}
