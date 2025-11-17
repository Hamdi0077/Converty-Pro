"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { initPixel } from "@/lib/fbpixel";

interface Shop {
  id: string;
  name: string;
  description?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category_id: string | null;
  status?: string | null;
}

export default function ShopPage() {
  const params = useParams();
  const slug = params.slug as string; // ex: "tech-store"

  const supabase = createClient();

  const [shop, setShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // 1) Boutique par slug
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("*, facebook_pixel_id") // inclure le pixel ID
          .eq("slug", slug)
          .single();

        if (shopError || !shopData) {
          console.error("Shop error:", shopError);
          setErrorMsg(`Boutique introuvable pour le slug : ${slug}`);
          setIsLoading(false);
          return;
        }

        setShop({
          id: shopData.id,
          name: shopData.name,
          description: shopData.description ?? null,
        });

        // Initialiser le Facebook Pixel si disponible
        if (shopData.facebook_pixel_id) {
          console.log(`[Shop Page] Shop: ${shopData.name} (ID: ${shopData.id}, Slug: ${shopData.slug})`);
          console.log(`[Shop Page] Using Pixel ID: ${shopData.facebook_pixel_id} for this shop`);
          initPixel(shopData.facebook_pixel_id);
        } else {
          console.warn(`[Shop Page] Shop: ${shopData.name} (ID: ${shopData.id}, Slug: ${shopData.slug})`);
          console.warn("[Shop Page] No Facebook Pixel ID configured for this shop");
          console.log("[Shop Page] Each shop can have its own Pixel ID in Settings → Integrations");
        }

        // 2) Catégories
        const { data: cats, error: catError } = await supabase
          .from("categories")
          .select("id, name")
          .eq("shop_id", shopData.id)
          .order("name", { ascending: true });

        if (!catError && cats) {
          setCategories(cats);
        }

        // 3) Produits
        const { data: prods, error: prodError } = await supabase
          .from("products")
          .select(
            "id, name, price, compare_at_price, image_url, category_id, status"
          )
          .eq("shop_id", shopData.id)
          .order("created_at", { ascending: false });

        if (prodError) {
          console.error("Products error:", prodError);
          setErrorMsg("Erreur lors du chargement des produits");
          setIsLoading(false);
          return;
        }

        // garder seulement les produits publiés si status existe
        const cleanProds = (prods || []).filter((p: any) => {
          if (p.status === undefined || p.status === null) return true;
          return p.status === "published";
        });

        setProducts(cleanProds as Product[]);
      } catch (err) {
        console.error("Unexpected shop page error:", err);
        setErrorMsg("Erreur lors du chargement de la boutique");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug, supabase]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.category_id === selectedCategory;

      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, search]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-gray-500">
          Chargement de la boutique...
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-red-500 mb-2">{errorMsg}</div>
        <div className="text-xs text-gray-500">
          Vérifie dans Supabase que la table <code>shops</code> a bien une
          colonne <code>slug</code> = "{slug}"
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-gray-600">Boutique introuvable.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Boutique en ligne
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">
              {shop.name}
            </h1>
            {shop.description && (
              <p className="text-sm md:text-base text-white/80 max-w-xl">
                {shop.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs border border-white/20 backdrop-blur">
                🚚 Livraison rapide
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs border border-white/20 backdrop-blur">
                💳 Paiement à la livraison
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-sm w-full">
            {/* Carte résumé */}
            <div className="bg-white/95 text-slate-900 rounded-2xl shadow-lg p-4 md:p-5">
              <p className="text-sm font-semibold mb-3">
                Bienvenue dans la boutique {shop.name}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Découvrez nos meilleures offres et passez commande en quelques clics.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-xl bg-slate-50 py-3">
                  <p className="font-semibold text-slate-900">
                    {products.length}
                  </p>
                  <p className="text-[11px] text-slate-500">Produits</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-3">
                  <p className="font-semibold text-slate-900">
                    {categories.length}
                  </p>
                  <p className="text-[11px] text-slate-500">Catégories</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-3">
                  <p className="font-semibold text-emerald-600">COD</p>
                  <p className="text-[11px] text-slate-500">Paiement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <main className="max-w-6xl mx-auto px-4 pb-12 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-slate-100 space-y-6">
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Catégories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  selectedCategory === "all"
                    ? "bg-sky-500 text-white border-sky-500"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Tous les produits
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    selectedCategory === cat.id
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Recherche */}
            <div className="w-full md:w-64">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Grille produits */}
          {filteredProducts.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Aucun produit trouvé.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${slug}/product/${product.id}`}
                  className="group bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Image */}
                  <div className="relative w-full pt-[100%] bg-slate-50 overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs">
                        Aucune image
                      </div>
                    )}
                    {product.compare_at_price && (
                      <span className="absolute left-2 top-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Promo
                      </span>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="p-3 flex flex-col gap-1 flex-1">
                    <p className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px]">
                      {product.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-sky-600">
                        {product.price} TND
                      </span>
                      {product.compare_at_price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {product.compare_at_price} TND
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-[11px] font-medium w-full py-1.5 rounded-full bg-sky-500 text-white group-hover:bg-sky-600 transition-colors"
                    >
                      Voir le produit
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
