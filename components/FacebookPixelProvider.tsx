// components/FacebookPixelProvider.tsx
// Client component to inject Facebook Pixel on shop pages

"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initPixel, trackPageView, isPixelReady } from "@/lib/fbpixel";

interface FacebookPixelProviderProps {
  children: React.ReactNode;
}

export function FacebookPixelProvider({ children }: FacebookPixelProviderProps) {
  const params = useParams();
  const pathname = usePathname();
  const supabase = createClient();
  const [pixelInitialized, setPixelInitialized] = useState(false);

  useEffect(() => {
    // Only run on shop pages
    if (!params?.slug || typeof params.slug !== "string") {
      return;
    }

    const slug = params.slug;

    // Fetch shop's Facebook Pixel configuration
    const loadPixel = async () => {
      try {
        console.log("[FB Pixel] Loading pixel config for shop:", slug);
        const { data: shop, error } = await supabase
          .from("shops")
          .select("facebook_pixel_id, facebook_pixel_enabled")
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("[FB Pixel] Error fetching shop config:", error);
          setPixelInitialized(false);
          return;
        }

        if (!shop) {
          console.warn("[FB Pixel] Shop not found for slug:", slug);
          setPixelInitialized(false);
          return;
        }

        console.log("[FB Pixel] Shop config:", {
          enabled: shop.facebook_pixel_enabled,
          pixelId: shop.facebook_pixel_id ? "***" + shop.facebook_pixel_id.slice(-4) : "none",
        });

        // Only initialize if enabled and pixel ID is valid
        if (shop.facebook_pixel_enabled && shop.facebook_pixel_id) {
          console.log("[FB Pixel] Initializing pixel with ID:", shop.facebook_pixel_id);
          
          // Retry logic in case of failure
          const tryInit = async (retries = 2) => {
            try {
              await initPixel(shop.facebook_pixel_id);
              
              // Verify initialization after a short delay
              setTimeout(() => {
                const w = window as any;
                if (w.fbq && (w.fbq.loaded || w.fbq.callMethod)) {
                  console.log("[FB Pixel] Pixel initialized and verified");
                  setPixelInitialized(true);
                } else {
                  console.warn("[FB Pixel] Pixel init called but script not ready, retrying...");
                  if (retries > 0) {
                    setTimeout(() => tryInit(retries - 1), 1000);
                  } else {
                    console.warn("[FB Pixel] Max retries reached, pixel may not be fully functional");
                    setPixelInitialized(false);
                  }
                }
              }, 500);
            } catch (err) {
              console.error("[FB Pixel] Failed to initialize:", err);
              if (retries > 0) {
                console.log(`[FB Pixel] Retrying initialization (${retries} attempts left)...`);
                setTimeout(() => tryInit(retries - 1), 1000);
              } else {
                setPixelInitialized(false);
              }
            }
          };
          
          tryInit();
        } else {
          console.warn("[FB Pixel] Pixel not enabled or missing ID");
          setPixelInitialized(false);
        }
      } catch (err) {
        console.error("[FB Pixel] Unexpected error:", err);
        setPixelInitialized(false);
      }
    };

    loadPixel();
  }, [params?.slug, supabase]);

  // Track PageView on route change
  useEffect(() => {
    // Only track on shop pages and if pixel is initialized
    if (!params?.slug || typeof params.slug !== "string" || !pixelInitialized) {
      return;
    }

    // Wait a bit more to ensure pixel script is fully loaded
    const timer = setTimeout(() => {
      const w = window as any;
      if (w.fbq && w.fbq.loaded) {
        trackPageView();
      } else {
        // Retry after a short delay if not ready
        setTimeout(() => {
          if (w.fbq && w.fbq.loaded) {
            trackPageView();
          }
        }, 300);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, params?.slug, pixelInitialized]);

  return <>{children}</>;
}

