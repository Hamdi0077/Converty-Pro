"use client";

import { redirect } from 'next/navigation';
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";

const navigationItems = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/products", label: "Products", icon: "📦" },
  { href: "/dashboard/orders", label: "Orders", icon: "🛒" },
  { href: "/dashboard/categories", label: "Categories", icon: "🏷️" },
  { href: "/dashboard/theme", label: "Theme", icon: "🎨" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect("/auth/login");
      }
      setUser(user);
      setIsLoading(false);
    };

    checkAuth();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    redirect("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold">Converty Pro</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            </Link>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="px-4 py-2 text-sm">
            <p className="text-muted-foreground">Logged in as</p>
            <p className="font-medium truncate text-foreground">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
