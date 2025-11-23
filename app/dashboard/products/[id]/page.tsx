"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  quantity: number;
  category_id: string | null;
  status: string;
  image_url?: string | null; // optionnel si tu as une image principale ici
  is_archived?: boolean;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
  created_at: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [settingMainId, setSettingMainId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Product | null>(null);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (shopError || !shop) return;

      // Load categories
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("shop_id", shop.id);

      setCategories(cats || []);

      // Load product
      const { data: product, error: prodError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("shop_id", shop.id)
        .single();

      if (prodError) {
        console.error("Error loading product:", prodError);
      }

      if (product) {
        setFormData(product as Product);
      }

      // Load product images (no is_primary)
      const { data: imgs, error: imgsError } = await supabase
        .from("product_images")
        .select("id, product_id, image_url, sort_order, created_at")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (imgsError) {
        console.error("Error loading images:", imgsError);
      }

      setImages((imgs || []) as ProductImage[]);
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!formData) return;
    const { name, value } = e.target;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [name]:
              name === "price" ||
              name === "compare_at_price" ||
              name === "quantity"
                ? value
                  ? parseFloat(value)
                  : 0
                : value,
          }
        : null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          compare_at_price: formData.compare_at_price,
          sku: formData.sku,
          quantity: formData.quantity,
          category_id: formData.category_id,
          status: formData.status,
        })
        .eq("id", productId);

      if (error) throw error;

      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete one image
  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;

    try {
      setDeletingImageId(imageId);

      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;

      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  // ✅ Make image main by moving it to front (sort_order=0)
  const makeImageMain = async (imageId: string) => {
    try {
      setSettingMainId(imageId);

      // ordre actuel (local)
      const ordered = [...images].sort(
        (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)
      );

      const mainImg = ordered.find((i) => i.id === imageId);
      if (!mainImg) return;

      const others = ordered.filter((i) => i.id !== imageId);

      const newOrdered = [mainImg, ...others].map((img, idx) => ({
        ...img,
        sort_order: idx,
      }));

      // update DB
      const updates = newOrdered.map((img) =>
        supabase
          .from("product_images")
          .update({ sort_order: img.sort_order })
          .eq("id", img.id)
      );

      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      // update UI
      setImages(newOrdered);
    } catch (e: any) {
      console.error("makeImageMain error:", e);
      alert("Failed to set main image: " + (e?.message || ""));
    } finally {
      setSettingMainId(null);
    }
  };

  // Archive instead of delete
  const handleArchive = async () => {
    if (
      !confirm("Archive this product? It will disappear from the shop.")
    )
      return;

    try {
      setIsArchiving(true);

      const { error } = await supabase
        .from("products")
        .update({ is_archived: true })
        .eq("id", productId);

      if (error) throw error;

      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error archiving product:", error);
      alert("Failed to archive product");
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading)
    return <div className="text-muted-foreground">Loading...</div>;

  if (!formData)
    return <div className="text-muted-foreground">Product not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground mt-2">
          Update product details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images Section */}
            <div className="space-y-2">
              <Label>Images</Label>

              {/* (optionnel) image principale stockée dans products.image_url */}
              {formData.image_url && images.length === 0 && (
                <div className="flex gap-3 mb-2">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden border bg-gray-50">
                    <Image
                      src={formData.image_url}
                      alt="main product image"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {images.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Aucune image trouvée.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {images.map((img) => {
                    const isMain = (img.sort_order ?? 999) === 0;

                    return (
                      <div
                        key={img.id}
                        className="relative h-24 w-24 rounded-md overflow-hidden border bg-gray-50"
                      >
                        <Image
                          src={img.image_url}
                          alt="product image"
                          fill
                          className="object-cover"
                        />

                        {/* badge principale */}
                        {isMain && (
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                            Principale
                          </div>
                        )}

                        {/* bouton mettre en avant */}
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => makeImageMain(img.id)}
                            disabled={settingMainId === img.id}
                            className="absolute bottom-1 right-1 bg-white/90 text-black text-[10px] px-2 py-1 rounded border"
                          >
                            {settingMainId === img.id
                              ? "..."
                              : "Mettre en avant"}
                          </button>
                        )}

                        {/* delete image */}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          disabled={deletingImageId === img.id}
                          className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-2 py-1 rounded"
                        >
                          {deletingImageId === img.id ? "..." : "X"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isSaving || isArchiving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  disabled={isSaving || isArchiving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={isSaving || isArchiving}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  disabled={isSaving || isArchiving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compare_at_price">Compare at Price</Label>
                <Input
                  id="compare_at_price"
                  name="compare_at_price"
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || isArchiving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  disabled={isSaving || isArchiving}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id || ""}
                  onChange={handleInputChange}
                  disabled={isSaving || isArchiving}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isSaving || isArchiving}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSaving || isArchiving}>
                {isSaving ? "Saving..." : "Save Product"}
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleArchive}
                disabled={isSaving || isArchiving}
              >
                {isArchiving ? "Archiving..." : "Archive"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving || isArchiving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
