"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  product: {
    id: string;
    name: string;
  } | null;
}

interface Order {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string | null;
  customer_address: string;
  customer_notes: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  order_items?: OrderItem[];
}

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "cancelled"];

export default function OrdersPage() {
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1) current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
      }

      if (!user) {
        setErrorMsg("You must be logged in to see your orders.");
        setLoading(false);
        return;
      }

      // 2) shops of this user
      const { data: shops, error: shopsError } = await supabase
        .from("shops")
        .select("id, name")
        .eq("user_id", user.id);

      if (shopsError) {
        console.error("Shops error:", shopsError);
        setErrorMsg("Error loading your shops.");
        setLoading(false);
        return;
      }

      if (!shops || shops.length === 0) {
        setErrorMsg("No shop found for this user.");
        setLoading(false);
        return;
      }

      const shopIds = shops.map((s) => s.id);

      // 3) orders + items + product names
      const { data: orderRows, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          shop_id,
          customer_name,
          customer_phone,
          customer_city,
          customer_address,
          customer_notes,
          status,
          total_amount,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            product:products (
              id,
              name
            )
          )
        `
        )
        .in("shop_id", shopIds)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Orders error:", ordersError);
        setErrorMsg("Error loading orders.");
        setLoading(false);
        return;
      }

      setOrders((orderRows || []) as unknown as Order[]);
    } catch (err) {
      console.error("Unexpected orders error:", err);
      setErrorMsg("Unexpected error while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatProducts = (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) return "-";

    return order.order_items
      .map((item) => {
        const name = item.product?.name || "Unknown product";
        return `${name} x${item.quantity}`;
      })
      .join(", ");
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      setErrorMsg(null);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        console.error("Status update error:", error);
        setErrorMsg("Error updating order status: " + error.message);
        return;
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
              }
            : o
        )
      );
    } catch (err: any) {
      console.error("Unexpected status update error:", err);
      setErrorMsg(
        "Unexpected error updating status: " + (err?.message || "see console")
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Orders</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {errorMsg && (
        <p className="text-sm text-red-500 whitespace-pre-line">{errorMsg}</p>
      )}

      {/* Content */}
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="border rounded-lg p-6 text-center text-sm text-gray-500">
          You don&apos;t have any orders yet.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Products</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50 align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(o.created_at)}
                  </td>

                  <td className="px-3 py-2">
                    <div className="font-semibold">{o.customer_name}</div>
                    <div className="text-xs text-gray-500">
                      {o.customer_address}
                    </div>
                    {o.customer_notes && (
                      <div className="text-xs text-gray-400 mt-1">
                        Note: {o.customer_notes}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {o.customer_phone}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {o.customer_city || "-"}
                  </td>

                  {/* Product names */}
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-800">
                      {formatProducts(o)}
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap font-semibold">
                    {o.total_amount} TND
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {/* Status badge + select */}
                    <div className="flex flex-col gap-1">
                      <span
                        className={
                          "inline-flex px-2 py-1 rounded-full text-xs font-medium " +
                          statusBadgeClass(o.status)
                        }
                      >
                        {o.status}
                      </span>

                      <select
                        className="border rounded-md px-2 py-1 text-xs"
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) =>
                          handleStatusChange(o.id, e.target.value)
                        }
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
