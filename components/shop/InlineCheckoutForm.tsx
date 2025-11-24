"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track, initPixel, isPixelReady } from "@/lib/fbpixel";
import { createClient } from "@/lib/supabase/client";

interface InlineCheckoutFormProps {
  product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string | null;
  };
  shopSlug: string;
  shopId: string;
  shopTheme?: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string | null;
  };
}

export function InlineCheckoutForm({ product, shopSlug, shopId, shopTheme }: InlineCheckoutFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = quantity * product.price;
  const maxQuantity = product.quantity || 999;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName || !customerPhone || !customerAddress) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (quantity < 1 || quantity > maxQuantity) {
      setErrorMsg("Quantité invalide.");
      return;
    }

    setIsSubmitting(true);

    try {
      const subtotal = quantity * product.price; // Calculate subtotal

      // Debugging: Log the payload
      console.log("Payload being sent to the API:", {
        productId: product.id,
        quantity,
        unit_price: product.price,
        subtotal,
        customer: {
          name: customerName,
          phone: customerPhone,
          city: customerCity || null,
          address: customerAddress,
          notes: customerNotes || null,
        },
      });

      const response = await fetch(`/api/shop/${shopSlug}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          unit_price: product.price,
          subtotal, // Include subtotal explicitly
          customer: {
            name: customerName,
            phone: customerPhone,
            city: customerCity || null,
            address: customerAddress,
            notes: customerNotes || null,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(data.error || "Erreur lors de la création de la commande");
      }

      // Ensure pixel initialized (fallback) then Track Purchase event
      try {
        if (!isPixelReady()) {
          // Try to initialize pixel quickly using shop config
          try {
            const supabaseClient = createClient();
            const { data: shop } = await supabaseClient
              .from("shops")
              .select("facebook_pixel_id, facebook_pixel_enabled")
              .eq("id", shopId)
              .single();

            if (shop && shop.facebook_pixel_enabled && shop.facebook_pixel_id) {
              await initPixel(shop.facebook_pixel_id);
            }
          } catch (initErr) {
            console.warn("Could not init pixel before tracking purchase:", initErr);
          }
        }

        track("Purchase", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: subtotal,
          currency: "TND",
          num_items: quantity,
          contents: [
            {
              id: product.id,
              quantity: quantity,
              item_price: product.price,
            },
          ],
        });
      } catch (trackErr) {
        console.warn("Purchase track failed:", trackErr);
      }

      // Redirect to success page
      router.push(`/shop/${shopSlug}/success?orderId=${data.orderId}`);
    } catch (err: any) {
      console.error("Checkout error:", err);
      setErrorMsg(err.message || "Erreur lors de la création de la commande");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 p-4 md:p-6 bg-slate-50 rounded-xl border border-slate-200">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">
        Passer la commande
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quantité */}
        <div>
          <Label htmlFor="quantity">Quantité</Label>
          <div className="flex items-center gap-3 mt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              −
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.max(1, Math.min(maxQuantity, val)));
              }}
              className="w-20 text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
            >
              +
            </Button>
            <span className="text-sm text-slate-600">
              Total: <span className="font-bold" style={{ color: shopTheme?.primary_color || '#06b6d4' }}>{total.toFixed(2)} TND</span>
            </span>
          </div>
        </div>

        {/* Nom complet */}
        <div>
          <Label htmlFor="customerName">
            Nom complet <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Jean Dupont"
          />
        </div>

        {/* Téléphone */}
        <div>
          <Label htmlFor="customerPhone">
            Téléphone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            placeholder="+33 6 12 34 56 78"
          />
        </div>

        {/* Ville */}
        <div>
          <Label htmlFor="customerCity">Ville</Label>
          <Input
            id="customerCity"
            value={customerCity}
            onChange={(e) => setCustomerCity(e.target.value)}
            placeholder="Paris"
          />
        </div>

        {/* Adresse complète */}
        <div>
          <Label htmlFor="customerAddress">
            Adresse complète <span className="text-red-500">*</span>
          </Label>
          <textarea
            id="customerAddress"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            required
            placeholder="123 Rue de la Paix, 75001 Paris, France"
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            rows={3}
          />
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="customerNotes">Notes (optionnel)</Label>
          <textarea
            id="customerNotes"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Instructions de livraison..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            rows={2}
          />
        </div>

        {/* Erreur */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {/* Bouton submit */}
        <Button
          type="submit"
          className="w-full text-white"
          style={{ backgroundColor: shopTheme?.primary_color || '#06b6d4' }}
          disabled={isSubmitting || product.quantity === 0}
        >
          {isSubmitting ? "Traitement..." : "Valider la commande"}
        </Button>

        <p className="text-xs text-slate-500 text-center">
          Paiement à la livraison • Service client disponible
        </p>
      </form>
    </div>
  );
}



