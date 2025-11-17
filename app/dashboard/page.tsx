"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Get user's shop
        const { data: shop } = await supabase
          .from("shops")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!shop) return;

        // Get product count
        const { count: productCount } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id);

        // Get order count
        const { count: orderCount } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id);

        // Get pending orders count
        const { count: pendingCount } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("status", "pending");

        // Get total revenue
        const { data: orders } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("shop_id", shop.id)
          .eq("status", "completed");

        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        setStats({
          totalProducts: productCount || 0,
          totalOrders: orderCount || 0,
          pendingOrders: pendingCount || 0,
          totalRevenue,
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back to your shop</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading statistics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No recent activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Next steps to set up your shop:</p>
            <ul className="space-y-2 text-sm">
              <li>✓ Account created</li>
              <li>○ Add your first product</li>
              <li>○ Customize your theme</li>
              <li>○ Share your storefront</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
