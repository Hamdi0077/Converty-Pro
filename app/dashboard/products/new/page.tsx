"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    sku: "",
    quantity: "",
    categoryId: "",
    status: "published",
  });

  // 📷 multi images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data: session } = await supabase.auth.getUser();
      const user = session?.user;
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) return;

      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("shop_id", shop.id)
        .order("name", { ascending: true });

      setCategories(cats || []);
    } catch (err) {
      console.error("Category error:", err);
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // 📷 sélection multiple
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const arr = Array.from(files);
    setImageFiles(arr);
    setImagePreviews(arr.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: session } = await supabase.auth.getUser();
      const user = session?.user;

      if (!user) {
        alert("Non connecté");
        return;
      }

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) {
        alert("Boutique introuvable");
        return;
      }

      // 1) Créer produit
      const { data: prod, error: prodErr } = await supabase
        .from("products")
        .insert({
          shop_id: shop.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price || "0"),
          compare_at_price: formData.compareAtPrice
            ? parseFloat(formData.compareAtPrice)
            : null,
          sku: formData.sku || null,
          quantity: parseInt(formData.quantity || "0"),
          category_id: formData.categoryId || null,
          status: formData.status,
        })
        .select("id")
        .single();

      if (prodErr || !prod) {
        alert("Erreur création produit");
        return;
      }

      const productId = prod.id;
      let mainImageUrl: string | null = null;
      const imgRows: any[] = [];

      // 2) Upload images
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${ext}`;
        const filePath = `${shop.id}/${productId}/${fileName}`;

        const { data: upload, error: upErr } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (upErr) continue;

        const { data: publicData } = supabase.storage
          .from("product-images")
          .getPublicUrl(upload?.path || filePath);

        imgRows.push({
          product_id: productId,
          image_url: publicData.publicUrl,
          sort_order: i,
        });

        if (!mainImageUrl) mainImageUrl = publicData.publicUrl;
      }

      // 3) Insert product_images
      if (imgRows.length > 0) {
        await supabase.from("product_images").insert(imgRows);
      }

      // 4) Update image principale
      if (mainImageUrl) {
        await supabase
          .from("products")
          .update({ image_url: mainImageUrl })
          .eq("id", productId);
      }

      router.push("/dashboard/products");
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un produit</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Données produit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Nom</Label>
                <Input name="name" onChange={handleChange} required />
              </div>

              <div>
                <Label>Prix</Label>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Prix barré</Label>
                <Input
                  name="compareAtPrice"
                  type="number"
                  step="0.01"
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Stock</Label>
                <Input name="quantity" type="number" onChange={handleChange} />
              </div>

              <div>
                <Label>SKU</Label>
                <Input name="sku" onChange={handleChange} />
              </div>

              <div>
                <Label>Catégorie</Label>
                <select
                  name="categoryId"
                  className="w-full border rounded-md p-2"
                  onChange={handleChange}
                >
                  <option value="">Aucune</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload multi images */}
              <div className="md:col-span-2">
                <Label>Images du produit</Label>
                <Input type="file" accept="image/*" multiple onChange={handleImagesChange} />

                {imagePreviews.length > 0 && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {imagePreviews.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        className="h-20 w-20 object-cover border rounded-md"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <textarea
                name="description"
                className="w-full border rounded-md p-2 h-32"
                onChange={handleChange}
              />
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <select
                name="status"
                className="w-full border rounded p-2"
                onChange={handleChange}
              >
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>

            {/* Bouton */}
            <div className="flex justify-end">
              <Button disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Créer le produit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
