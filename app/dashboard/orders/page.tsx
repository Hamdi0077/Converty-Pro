"use client";

import { useEffect, useState } from "react";
// import Link from "next/link"; // navigation replaced with inline drawer
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [shopIds, setShopIds] = useState<string[] | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState<{
    customer_name: string;
    customer_phone: string;
    customer_city: string | null;
    customer_address: string;
    customer_notes: string | null;
  }>({
    customer_name: "",
    customer_phone: "",
    customer_city: null,
    customer_address: "",
    customer_notes: null,
  });

  // Filters & pagination
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    // Debounce search
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, debouncedSearch, startDate, endDate, page, pageSize]);

  useEffect(() => {
    if (selectedOrder) {
      setDetailsForm({
        customer_name: selectedOrder.customer_name,
        customer_phone: selectedOrder.customer_phone,
        customer_city: selectedOrder.customer_city,
        customer_address: selectedOrder.customer_address,
        customer_notes: selectedOrder.customer_notes,
      });
    }
  }, [selectedOrder]);

  const loadOrders = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1) Ensure we have current user's shop ids (cached in state)
      let currentShopIds = shopIds;
      if (!currentShopIds) {
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

        currentShopIds = shops.map((s) => s.id);
        setShopIds(currentShopIds);
      }

      // 2) Build filters
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
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
        `,
          { count: "exact" }
        )
        .in("shop_id", currentShopIds!)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (debouncedSearch) {
        const like = `%${debouncedSearch}%`;
        query = query.or(
          `customer_name.ilike.${like},customer_phone.ilike.${like},customer_city.ilike.${like}`
        );
      }
      if (startDate) {
        const startIso = new Date(startDate).toISOString();
        query = query.gte("created_at", startIso);
      }
      if (endDate) {
        // Include end of the selected day
        const end = new Date(`${endDate}T23:59:59.999Z`);
        query = query.lte("created_at", end.toISOString());
      }

      // 3) Fetch orders + items + product names with count
      const { data: orderRows, error: ordersError, count } = await query;

      if (ordersError) {
        console.error("Orders error:", ordersError);
        setErrorMsg("Error loading orders.");
        setLoading(false);
        return;
      }

      setOrders((orderRows || []) as unknown as Order[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Unexpected orders error:", err);
      setErrorMsg("Unexpected error while loading orders.");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleSaveDetails = async () => {
    if (!selectedOrder) return;
    try {
      setSavingDetails(true);
      setErrorMsg(null);

      const prevOrders = orders;
      const updated: Order = { ...selectedOrder, ...detailsForm } as Order;
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updated : o)));

      const { error } = await supabase
        .from("orders")
        .update({
          customer_name: detailsForm.customer_name,
          customer_phone: detailsForm.customer_phone,
          customer_city: detailsForm.customer_city,
          customer_address: detailsForm.customer_address,
          customer_notes: detailsForm.customer_notes,
        })
        .eq("id", selectedOrder.id);

      if (error) {
        setOrders(prevOrders);
        setErrorMsg("Error saving order details: " + error.message);
        return;
      }

      setSelectedOrder(updated);
      setDetailsOpen(false);
    } catch (err: any) {
      setErrorMsg("Unexpected error saving details: " + (err?.message || "see console"));
    } finally {
      setSavingDetails(false);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // manual refresh keeps current filters
              loadOrders();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status</label>
          <select
            className="w-full border rounded-md px-2 py-2 text-sm bg-white"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Search (name, phone, city)</label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="e.g. John, +33..., Paris"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            className="w-full border rounded-md px-2 py-2 text-sm"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            className="w-full border rounded-md px-2 py-2 text-sm"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
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
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t hover:bg-gray-50 align-top cursor-pointer"
                  onClick={(e) => {
                    // avoid opening when interacting with inputs/buttons
                    const tag = (e.target as HTMLElement).tagName.toLowerCase();
                    if (
                      tag === "select" ||
                      tag === "button" ||
                      (e.target as HTMLElement).closest("select") ||
                      (e.target as HTMLElement).closest("button")
                    )
                      return;
                    openDetails(o);
                  }}
                >
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
                        className="border rounded-md px-2 py-1 text-xs bg-white"
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetails(o);
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t bg-gray-50 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span>
                Showing {orders.length === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
              </span>
              <select
                className="border rounded-md px-2 py-1 bg-white"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= totalCount || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order details drawer */}
      <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DrawerContent className="sm:max-w-2xl lg:max-w-3xl">
          <DrawerHeader>
            <DrawerTitle>Order details</DrawerTitle>
            {selectedOrder && (
              <DrawerDescription>
                #{selectedOrder.id.slice(0, 8)} • {formatDate(selectedOrder.created_at)}
              </DrawerDescription>
            )}
          </DrawerHeader>

          {selectedOrder && (
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="customer_name">Customer name</Label>
                  <Input
                    id="customer_name"
                    value={detailsForm.customer_name}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, customer_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customer_phone">Phone</Label>
                  <Input
                    id="customer_phone"
                    value={detailsForm.customer_phone}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, customer_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customer_city">City</Label>
                  <Input
                    id="customer_city"
                    value={detailsForm.customer_city ?? ""}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, customer_city: e.target.value || null }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customer_address">Address</Label>
                  <Input
                    id="customer_address"
                    value={detailsForm.customer_address}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, customer_address: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customer_notes">Notes</Label>
                  <Textarea
                    id="customer_notes"
                    value={detailsForm.customer_notes ?? ""}
                    onChange={(e) => setDetailsForm((s) => ({ ...s, customer_notes: e.target.value || null }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        "inline-flex px-2 py-1 rounded-full text-xs font-medium " +
                        statusBadgeClass(selectedOrder.status)
                      }
                    >
                      {selectedOrder.status}
                    </span>
                    <select
                      className="border rounded-md px-2 py-1 text-xs bg-white"
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Items</Label>
                    <div className="text-sm text-gray-700">
                      {selectedOrder.order_items.map((it) => (
                        <div key={it.id} className="flex justify-between py-0.5">
                          <span>{it.product?.name ?? "Unknown product"} × {it.quantity}</span>
                          <span className="tabular-nums">{it.unit_price} TND</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DrawerFooter>
            <div className="flex items-center justify-end gap-2">
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
              <Button onClick={handleSaveDetails} disabled={savingDetails || !selectedOrder}>
                {savingDetails ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
