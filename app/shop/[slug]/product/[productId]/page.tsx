"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
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

interface ProductImage {
  image_url: string;
  sort_order: number;
}

export default function ProductPage() {
  const params = useParams();
  const shopSlug = params.slug as string;       // ex: "tech-store"
  const productId = params.productId as string; // vient de [productId]

  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!shopSlug || !productId) return;

    const load = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // 1) Trouver la boutique par slug
        const { data: shop, error: shopError } = await supabase
          .from("shops")
          .select("id, name, facebook_pixel_id")
          .eq("slug", shopSlug)
          .single();

        if (shopError || !shop) {
          console.error("Shop error:", shopError);
          setErrorMsg("Boutique introuvable");
          setIsLoading(false);
          return;
        }

        // 2) Trouver le produit dans cette boutique
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
          setIsLoading(false);
          return;
        }

        // 3) Charger les images supplémentaires
        const { data: imgs } = await supabase
          .from("product_images")
          .select("image_url, sort_order")
          .eq("product_id", prod.id)
          .order("sort_order", { ascending: true });

        setProduct(prod as Product);

        const imgsArray = (imgs || []) as ProductImage[];
        setImages(imgsArray);

        const firstImage =
          imgsArray[0]?.image_url || prod.image_url || null;
        setActiveImage(firstImage);

        // Initialiser le Facebook Pixel si disponible
        if (shop?.facebook_pixel_id) {
          console.log(`[Product Page] Shop: ${shop.name} (ID: ${shop.id})`);
          console.log(`[Product Page] Using Pixel ID: ${shop.facebook_pixel_id} for this shop`);
          initPixel(shop.facebook_pixel_id);

          // Check if Pixel is initialized before tracking
          const trackEvent = () => {
            if (typeof window.fbq === "function") {
              console.log(`[Product Page] Tracking ViewContent for product: ${prod.name}`);
              track("ViewContent", {
                content_name: prod.name,
                content_ids: [prod.id],
                content_type: "product",
                value: prod.price,
                currency: "TND",
              });
            } else {
              console.warn("[Product Page] Facebook Pixel is not initialized. Retrying...");
              setTimeout(trackEvent, 500); // Retry after 500ms
            }
          };

          // Start tracking after a short delay
          setTimeout(trackEvent, 300);
        } else {
          console.warn(`[Product Page] Shop: ${shop?.name || 'Unknown'} (ID: ${shop?.id || 'Unknown'})`);
          console.warn("[Product Page] No Facebook Pixel ID configured for this shop");
          console.log("[Product Page] Shop data:", shop);
        }
      } catch (err) {
        console.error("Error loading product page:", err);
        setErrorMsg("Erreur lors du chargement du produit");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [shopSlug, productId, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-gray-500">
          Chargement du produit...
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-red-500 mb-2">{errorMsg}</div>
        <Link
          href={`/shop/${shopSlug}`}
          className="text-xs text-sky-600 hover:underline"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-gray-600 mb-2">Produit introuvable.</div>
        <Link
          href={`/shop/${shopSlug}`}
          className="text-xs text-sky-600 hover:underline"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const fallbackImage = product.image_url || null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER / BREADCRUMB */}
      <section className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-3">
          <div className="text-[11px] text-white/80 flex items-center gap-1">
            <Link href={`/shop/${shopSlug}`} className="hover:underline">
              Boutique
            </Link>
            <span className="opacity-60">/</span>
            <span className="line-clamp-1">{product.name}</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {product.name}
            </h1>
            <p className="text-xs md:text-sm text-white/80 mt-1">
              Découvrez les détails de ce produit et commandez en quelques clics.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <main className="max-w-6xl mx-auto px-4 pb-10 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {/* GALERIE D'IMAGES */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Miniatures */}
              <div className="flex md:flex-col gap-2 md:w-24">
                {images.length > 0
                  ? images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(img.image_url)}
                        className={`relative h-20 w-20 rounded-md overflow-hidden border ${
                          activeImage === img.image_url
                            ? "ring-2 ring-sky-500"
                            : "border-slate-200"
                        }`}
                      >
                        <Image
                          src={img.image_url}
                          alt={`Image ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))
                  : fallbackImage && (
                      <div className="relative h-20 w-20 rounded-md overflow-hidden border border-slate-200">
                        <Image
                          src={fallbackImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
              </div>

              {/* Image principale */}
              <div className="relative flex-1 h-[360px] md:h-[420px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {activeImage || fallbackImage ? (
                  <Image
                    src={activeImage || (fallbackImage as string)}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Aucune image
                  </div>
                )}
              </div>
            </div>

            {/* INFOS PRODUIT */}
            <div className="flex flex-col gap-4">
              {/* Prix */}
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-sky-600">
                    {product.price} TND
                  </span>
                  {product.compare_at_price && (
                    <span className="text-sm line-through text-slate-400">
                      {product.compare_at_price} TND
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  TVAC • Paiement à la livraison
                </p>
              </div>

              {/* Stock */}
              <div className="text-xs">
                {product.quantity > 0 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    ✅ En stock • {product.quantity} pièce
                    {product.quantity > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                    ❌ Rupture de stock
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              )}

              {/* CTA */}
              <div className="mt-2">
                <a
                  href={`/shop/${shopSlug}/product/${product.id}/checkout`}
                  onClick={() => {
                    // Tracker AddToCart
                    track("AddToCart", {
                      content_name: product.name,
                      content_ids: [product.id],
                      content_type: "product",
                      value: product.price,
                      currency: "TND",
                    });
                  }}
                  className={`block w-full text-center py-3 rounded-full text-sm font-semibold shadow-sm ${
                    product.quantity > 0
                      ? "bg-sky-500 hover:bg-sky-600 text-white"
                      : "bg-slate-300 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  {product.quantity > 0
                    ? "Commander maintenant"
                    : "Actuellement indisponible"}
                </a>
                <p className="mt-2 text-[11px] text-slate-500 text-center">
                  Paiement à la livraison • Service client disponible
                </p>
              </div>

              {/* Lien retour */}
              <div className="mt-4 text-xs">
                <Link
                  href={`/shop/${shopSlug}`}
                  className="text-sky-600 hover:underline"
                >
                  ← Retour à la boutique
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
