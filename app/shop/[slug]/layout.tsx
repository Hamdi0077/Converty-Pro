// app/shop/[slug]/layout.tsx
// Layout for shop pages - injects Facebook Pixel Provider

import { FacebookPixelProvider } from "@/components/FacebookPixelProvider";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FacebookPixelProvider>{children}</FacebookPixelProvider>;
}

