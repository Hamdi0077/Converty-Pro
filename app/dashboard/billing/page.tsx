"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  price: number;
  current_period_start: string;
  current_period_end: string;
}

interface BillingHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: ["Up to 10 products", "Basic analytics", "Email support"],
  },
  starter: {
    name: "Starter",
    price: 29,
    features: ["Up to 100 products", "Advanced analytics", "Priority support", "API access"],
  },
  pro: {
    name: "Pro",
    price: 99,
    features: ["Unlimited products", "Full analytics", "24/7 support", "API access", "Custom domain", "Advanced integrations"],
  },
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) return;

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("shop_id", shop.id)
        .single();

      if (subData) {
        setSubscription(subData);

        const { data: historyData } = await supabase
          .from("billing_history")
          .select("*")
          .eq("subscription_id", subData.id)
          .order("created_at", { ascending: false });

        setBillingHistory(historyData || []);
      }
    } catch (error) {
      console.error("Error loading billing info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = (planName: string) => {
    alert(`Upgrade to ${planName} plan coming soon! Payment processing will be available soon.`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  const currentPlan = subscription?.plan || "free";
  const currentPrice = subscription?.price || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and payment methods</p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Active Plan</p>
                <p className="text-2xl font-bold capitalize">{currentPlan}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold">${currentPrice}/month</p>
              </div>
              {subscription.current_period_end && (
                <div>
                  <p className="text-sm text-muted-foreground">Renews on</p>
                  <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                  subscription.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {subscription.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <Card key={key} className={currentPlan === key ? "border-primary border-2" : ""}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold mt-2">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgradePlan(plan.name)}
                  disabled={currentPlan === key}
                  className="w-full"
                >
                  {currentPlan === key ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((entry) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">{formatDate(entry.created_at)}</td>
                      <td className="py-3 px-4 font-semibold">${entry.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
