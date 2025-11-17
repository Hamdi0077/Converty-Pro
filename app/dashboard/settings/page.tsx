"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShopSettings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  store_currency: string;
  tax_rate: number;
  facebook_pixel_id: string | null;
}

export default function SettingsPage() {
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    shopName: "",
    shopSlug: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    currency: "USD",
    taxRate: "0",
    facebookPixelId: "",
  });

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setShop(data);
        setFormData({
          shopName: data.name || "",
          shopSlug: data.slug || "",
          description: data.description || "",
          contactEmail: data.contact_email || "",
          contactPhone: data.contact_phone || "",
          address: data.address || "",
          currency: data.store_currency || "USD",
          taxRate: (data.tax_rate || 0).toString(),
          facebookPixelId: data.facebook_pixel_id || "",
        });
      }
    } catch (error) {
      console.error("Error loading shop:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!shop) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          name: formData.shopName,
          slug: formData.shopSlug,
          description: formData.description,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          address: formData.address,
          store_currency: formData.currency,
          tax_rate: parseFloat(formData.taxRate),
        })
        .eq("id", shop.id);

      if (error) throw error;

      alert("Settings updated successfully!");
      loadShop();
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Add logging to debug the saving of Facebook Pixel ID
  const handleSaveIntegrations = async () => {
    if (!shop) return;

    setIsSaving(true);
    try {
      console.log("Saving Facebook Pixel ID:", formData.facebookPixelId);

      const { error } = await supabase
        .from("shops")
        .update({
          facebook_pixel_id: formData.facebookPixelId || null,
        })
        .eq("id", shop.id);

      if (error) {
        console.error("Error saving Facebook Pixel ID:", error);
        alert("Failed to save integration settings");
        return;
      }

      alert("Integration settings updated successfully!");
      loadShop();
    } catch (error) {
      console.error("Unexpected error saving integration settings:", error);
      alert("Failed to save integration settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!shop) return <div className="text-muted-foreground">Shop not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your shop configuration</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="My Shop"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopSlug">Shop URL Slug</Label>
                  <Input
                    id="shopSlug"
                    name="shopSlug"
                    value={formData.shopSlug}
                    onChange={handleInputChange}
                    placeholder="my-shop"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your shop URL: yoursite.com/shop/{formData.shopSlug}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Shop Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell customers about your shop..."
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    placeholder="0"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save General Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="contact@myshop.com"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Shop Address</Label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State, ZIP"
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Contact Information"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-muted-foreground">Accept payments when customers receive orders</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Enabled
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg opacity-50">
                  <div>
                    <p className="font-medium">Credit Card Payment</p>
                    <p className="text-sm text-muted-foreground">Accept credit and debit cards</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg opacity-50">
                  <div>
                    <p className="font-medium">Digital Wallet</p>
                    <p className="text-sm text-muted-foreground">Accept Apple Pay, Google Pay, etc.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border-2 border-primary/20 rounded-lg space-y-4 bg-primary/5">
                  <div>
                    <p className="font-semibold text-lg">Facebook Pixel</p>
                    <p className="text-sm text-muted-foreground">Track conversions and run ads</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebookPixelId" className="text-base font-medium">
                      Facebook Pixel ID
                    </Label>
                    <Input
                      id="facebookPixelId"
                      name="facebookPixelId"
                      value={formData.facebookPixelId}
                      onChange={handleInputChange}
                      placeholder="Enter your Facebook Pixel ID (e.g., 123456789012345)"
                      disabled={isSaving}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Find your Pixel ID in Facebook Events Manager → Settings → Your Pixel
                    </p>
                    {formData.facebookPixelId && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Pixel ID saved: {formData.facebookPixelId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Google Analytics</p>
                    <p className="text-sm text-muted-foreground">Track visitor behavior and sales</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">Email Marketing</p>
                    <p className="text-sm text-muted-foreground">Mailchimp, Klaviyo, and more</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Send order updates via SMS</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveIntegrations} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Integration Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
