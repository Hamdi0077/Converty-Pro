"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    status: "pending",
    paymentMethod: "cash_on_delivery",
    shippingAddress: "",
    notes: "",
    selectedProductId: "",
    selectedQuantity: "1",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) return;

      const { data } = await supabase
        .from("products")
        .select("id, name, price, quantity")
        .eq("shop_id", shop.id)
        .eq("status", "published");

      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = () => {
    if (!formData.selectedProductId) {
      alert("Please select a product");
      return;
    }

    const product = products.find(p => p.id === formData.selectedProductId);
    if (!product) return;

    const quantity = parseInt(formData.selectedQuantity);
    if (quantity <= 0 || quantity > product.quantity) {
      alert("Invalid quantity");
      return;
    }

    // Check if product already in order
    const existingItem = orderItems.find(item => item.productId === formData.selectedProductId);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === formData.selectedProductId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        productId: formData.selectedProductId,
        productName: product.name,
        quantity,
        price: product.price,
      }]);
    }

    setFormData(prev => ({
      ...prev,
      selectedProductId: "",
      selectedQuantity: "1",
    }));
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerEmail) {
      alert("Please fill in customer details");
      return;
    }

    if (orderItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!shop) return;

      const totalAmount = calculateTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          shop_id: shop.id,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          total_amount: totalAmount,
          status: formData.status,
          payment_method: formData.paymentMethod,
          shipping_address: formData.shippingAddress,
          notes: formData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const itemsToInsert = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      router.push(`/dashboard/orders/${order.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order");
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = calculateTotal();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Order</h1>
        <p className="text-muted-foreground mt-2">Add a new customer order</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <textarea
                  id="shippingAddress"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Order Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Special instructions..."
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <select
                  name="selectedProductId"
                  value={formData.selectedProductId}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="col-span-2 px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="">Select product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price}
                    </option>
                  ))}
                </select>

                <Input
                  name="selectedQuantity"
                  type="number"
                  min="1"
                  value={formData.selectedQuantity}
                  onChange={handleInputChange}
                  placeholder="Qty"
                  disabled={isLoading}
                />

                <Button onClick={handleAddItem} disabled={isLoading}>
                  Add
                </Button>
              </div>

              {orderItems.length > 0 && (
                <div className="space-y-2 border-t border-border pt-4">
                  {orderItems.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x ${item.price} = ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items:</span>
                  <span>{orderItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span>{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
              </div>

              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Order Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || orderItems.length === 0}
                  className="flex-1"
                >
                  {isLoading ? "Creating..." : "Create Order"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
