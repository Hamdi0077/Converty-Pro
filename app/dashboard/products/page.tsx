"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
  image_url: string | null;
  created_at: string;
  is_archived?: boolean; // ✅ nouvel attribut
}

export default function ProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // 1) Récupérer l'utilisateur
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 2) Récupérer la boutique de l'utilisateur (id + slug)
      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("id, slug")
        .eq("user_id", user.id)
        .single();

      if (shopError || !shop) {
        console.error("Shop error:", shopError);
        setLoading(false);
        return;
      }

      setShopSlug(shop.slug);

      // 3) Charger les produits NON ARCHIVÉS de cette boutique ✅
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, price, quantity, status, image_url, created_at, is_archived"
        )
        .eq("shop_id", shop.id)
        .eq("is_archived", false) // ✅ filtre important
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Products error:", error);
        setLoading(false);
        return;
      }

      setProducts((data || []) as Product[]);
    } catch (err) {
      console.error("Unexpected error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ARCHIVER produit (au lieu de supprimer)
  const handleArchiveProduct = async (productId: string) => {
    const confirmArchive = window.confirm(
      "Are you sure you want to archive this product? It will disappear from your shop but stay in past orders."
    );
    if (!confirmArchive) return;

    try {
      setArchivingId(productId);

      const { error } = await supabase
        .from("products")
        .update({ is_archived: true })
        .eq("id", productId);

      if (error) {
        console.error("Error archiving product:", error);
        alert("Failed to archive product: " + error.message);
        return;
      }

      // ✅ enlever du UI directement
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err: any) {
      console.error("Unexpected archive error:", err);
      alert("Failed to archive product: " + (err?.message || "Unexpected error"));
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Produits</h1>
        <Link href="/dashboard/products/new">
          <Button>Ajouter un produit</Button>
        </Link>
      </div>

      {/* Contenu */}
      {loading ? (
        <p>Chargement...</p>
      ) : products.length === 0 ? (
        <div className="border rounded-lg p-6 text-center text-sm text-gray-500">
          Vous n&apos;avez encore aucun produit.
          <br />
          <Link href="/dashboard/products/new">
            <Button className="mt-3" size="sm">
              Ajouter votre premier produit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg divide-y bg-white">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50"
            >
              {/* Image */}
              <div className="h-16 w-16 overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-gray-400 text-center px-1">
                    Aucune image
                  </span>
                )}
              </div>

              {/* Infos produit */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Stock : {p.quantity} • Statut : {p.status}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Créé le {new Date(p.created_at).toLocaleString()}
                </div>
              </div>

              {/* Prix & actions */}
              <div className="flex flex-col items-end gap-1">
                <div className="font-bold">{p.price} TND</div>

                <div className="flex flex-col gap-1">
                  {/* Modifier (admin) */}
                  <Link href={`/dashboard/products/${p.id}`}>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </Link>

                  {/* Voir sur la boutique (public) */}
                  {shopSlug && (
                    <Link
                      href={`/shop/${shopSlug}/product/${p.id}`}
                      target="_blank"
                    >
                      <Button variant="ghost" size="sm">
                        Voir sur la boutique
                      </Button>
                    </Link>
                  )}

                  {/* ✅ Archiver */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleArchiveProduct(p.id)}
                    disabled={archivingId === p.id}
                  >
                    {archivingId === p.id ? "Archivage..." : "Archiver"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
