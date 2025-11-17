"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ShopTheme {
  id: string;
  name: string;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
}

export default function ThemePage() {
  const [shop, setShop] = useState<ShopTheme | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    accentColor: "#f59e0b",
    fontFamily: "sans",
  });

  const supabase = createClient();

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("shops")
        .select("id, name, logo_url, banner_url, primary_color, secondary_color, accent_color, font_family")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setShop({
          ...data,
          accent_color: data.accent_color || "#f59e0b",
          font_family: data.font_family || "sans",
        });
        setFormData({
          primaryColor: data.primary_color || "#3b82f6",
          secondaryColor: data.secondary_color || "#1e40af",
          accentColor: data.accent_color || "#f59e0b",
          fontFamily: data.font_family || "sans",
        });
      }
    } catch (error) {
      console.error("Error loading shop:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (colorName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [colorName]: value,
    }));
  };

  const handleFontChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      fontFamily: value,
    }));
  };

  const handleSave = async () => {
    if (!shop) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          accent_color: formData.accentColor,
          font_family: formData.fontFamily,
        })
        .eq("id", shop.id);

      if (error) throw error;

      alert("Theme colors updated successfully!");
      loadShop();
    } catch (error) {
      console.error("Error saving theme:", error);
      alert("Failed to save theme colors");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!shop) return <div className="text-muted-foreground">Shop not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Theme Customization</h1>
        <p className="text-muted-foreground mt-2">Customize your storefront appearance</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="primary">Primary Color</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="primary"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    className="flex-1"
                    placeholder="#3b82f6"
                  />
                  <span className="text-sm text-muted-foreground">Main brand color</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="secondary">Secondary Color</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="secondary"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    className="flex-1"
                    placeholder="#1e40af"
                  />
                  <span className="text-sm text-muted-foreground">Complementary color</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="accent">Accent Color</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    id="accent"
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => handleColorChange("accentColor", e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => handleColorChange("accentColor", e.target.value)}
                    className="flex-1"
                    placeholder="#f59e0b"
                  />
                  <span className="text-sm text-muted-foreground">Call-to-action color</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <select
                  id="fontFamily"
                  value={formData.fontFamily}
                  onChange={(e) => handleFontChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="sans">Sans Serif (Modern, Clean)</option>
                  <option value="serif">Serif (Professional, Classic)</option>
                  <option value="mono">Monospace (Technical, Bold)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? "Saving..." : "Save Theme"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="p-6 rounded-lg text-white font-semibold"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Primary
              </div>
              <div
                className="p-6 rounded-lg text-white font-semibold"
                style={{ backgroundColor: formData.secondaryColor }}
              >
                Secondary
              </div>
              <div
                className="p-6 rounded-lg text-white font-semibold"
                style={{ backgroundColor: formData.accentColor }}
              >
                Accent
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  className="w-full py-2 rounded font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="w-full py-2 rounded font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: formData.secondaryColor }}
                >
                  Secondary Button
                </button>
                <button
                  className="w-full py-2 rounded font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: formData.accentColor }}
                >
                  Call to Action
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
