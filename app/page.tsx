import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Converty Pro</h1>
          <div className="space-x-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Start Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            Your Complete E-commerce Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Converty Pro is a multi-tenant SaaS platform that helps merchants create and manage their online stores with ease.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card border-t border-border py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-center mb-12">Why Choose Converty Pro?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Multi-tenant Architecture</h4>
              <p className="text-muted-foreground">
                Each merchant gets their own isolated shop with complete customization options.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Order Management</h4>
              <p className="text-muted-foreground">
                Track orders, manage inventory, and process payments all in one place.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Theme Customization</h4>
              <p className="text-muted-foreground">
                Fully customize your storefront colors, logo, and branding without coding.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
