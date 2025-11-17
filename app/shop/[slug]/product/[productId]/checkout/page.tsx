"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { initPixel, track } from "@/lib/fbpixel";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  quantity: number;
  image_url: string | null;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const shopSlug = params.slug as string;
  const productId = params.productId as string;

  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [shopId, setShopId] = useState<string | null>(null);
  const [pixelId, setPixelId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!shopSlug || !productId) return;

    const load = async () => {
      try {
        // 1) boutique
        const { data: shop, error: shopError } = await supabase
          .from("shops")
          .select("id, facebook_pixel_id")
          .eq("slug", shopSlug)
          .single();

        if (shopError || !shop) {
          console.error("Shop error:", shopError);
          setErrorMsg("Boutique introuvable");
          return;
        }
        setShopId(shop.id);
        setPixelId(shop.facebook_pixel_id || null);
        
        // Initialiser le pixel si disponible
        if (shop.facebook_pixel_id) {
          initPixel(shop.facebook_pixel_id);
        }

        // 2) produit
        const { data: prod, error: prodError } = await supabase
          .from("products")
          .select(
            "id, name, description, price, compare_at_price, quantity, image_url"
          )
          .eq("shop_id", shop.id)
          .eq("id", productId)
          .single();

        if (prodError || !prod) {
          console.error("Product error:", prodError);
          setErrorMsg("Produit introuvable");
          return;
        }

        setProduct(prod as Product);
      } catch (err) {
        console.error("Checkout load error:", err);
        setErrorMsg("Erreur lors du chargement du produit");
      }
    };

    load();
  }, [shopSlug, productId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!product || !shopId) {
      setErrorMsg("Produit ou boutique introuvable");
      return;
    }

    if (!customerName || !customerPhone || !customerAddress) {
      setErrorMsg("Veuillez remplir au moins nom, téléphone et adresse.");
      return;
    }

    const qty = Math.max(1, quantity);
    const total = qty * product.price;

    setIsSubmitting(true);

    try {
      // 1) créer la commande
      const { data: insertedOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          shop_id: shopId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_city: customerCity || null,
          customer_address: customerAddress,
          customer_notes: customerNotes || null,
          status: "pending",
          total_amount: total,
        })
        .select("id")
        .single();

      console.log("order insert result:", insertedOrder, orderError);

      if (orderError || !insertedOrder) {
        console.error("Order insert error:", orderError);
        setErrorMsg(
          "Erreur lors de la création de la commande : " +
            (orderError?.message || "voir console")
        );
        setIsSubmitting(false);
        return;
      }

      const orderId = insertedOrder.id;

      // 2) créer la ligne de commande
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: orderId,
        product_id: product.id,
        quantity: qty,
        unit_price: product.price,
        subtotal: total,
      });

      console.log("order_items insert error:", itemError);

      if (itemError) {
        setErrorMsg(
          "Commande créée mais erreur sur les articles : " +
            (itemError.message || "")
        );
        setIsSubmitting(false);
        return;
      }

      // 3) (optionnel) décrémenter le stock
      const newStock = product.quantity - qty;
      if (newStock >= 0) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ quantity: newStock })
          .eq("id", product.id);

        if (stockError) {
          console.error("Stock update error:", stockError);
        }
      }

      setSuccessMsg(
        "Merci ! Votre commande a été bien enregistrée. Nous vous contacterons pour la livraison."
      );

      // Tracker Purchase
      if (pixelId && product) {
        track("Purchase", {
          content_name: product.name,
          content_ids: [product.id],
          content_type: "product",
          value: total,
          currency: "TND",
          num_items: qty,
        });
      }

      setCustomerName("");
      setCustomerPhone("");
      setCustomerCity("");
      setCustomerAddress("");
      setCustomerNotes("");
      setQuantity(1);
    } catch (err: any) {
      console.error("Checkout submit error:", err);
      setErrorMsg(
        "Erreur inattendue lors de la commande : " +
          (err?.message || "voir console")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        {errorMsg ? (
          <p className="text-red-500 text-center">{errorMsg}</p>
        ) : (
          <p className="text-center">Chargement...</p>
        )}
      </div>
    );
  }

  const total = quantity * product.price;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        ← Retour au produit
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Récap produit */}
        <Card>
          <CardHeader>
            <CardTitle>Votre commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    Aucune image
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-500 whitespace-pre-line">
                  {product.description?.slice(0, 120)}...
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Prix unitaire</span>
                <span className="font-semibold">{product.price} TND</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Quantité</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </Button>
                  <span>{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setQuantity((q) =>
                        product.quantity
                          ? Math.min(product.quantity, q + 1)
                          : q + 1
                      )
                    }
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex justify-between text-base border-t pt-2">
                <span>Total</span>
                <span className="font-bold text-red-600">
                  {total.toFixed(2)} TND
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire COD */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Nom complet *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Téléphone *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Ville</Label>
                <Input
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                />
              </div>

              <div>
                <Label>Adresse complète *</Label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full border rounded-md p-2 min-h-[80px]"
                  required
                />
              </div>

              <div>
                <Label>Notes (optionnel)</Label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full border rounded-md p-2 min-h-[60px]"
                />
              </div>

              {errorMsg && (
                <p className="text-sm text-red-500 whitespace-pre-line">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="text-sm text-green-600 whitespace-pre-line">
                  {successMsg}
                </p>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Envoi de la commande..."
                  : "Confirmer la commande"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
