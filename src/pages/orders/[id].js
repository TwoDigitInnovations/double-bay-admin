import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Printer,
  Share2,
  Package,
  CreditCard,
  Truck,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import isAuth from "@/components/isAuth";
import {
  fetchOrderById,
  updateOrderById,
  updateOrderNotes,
} from "@/redux/actions/orderActions";
import { formatOrderStatus } from "@/lib/orderMapper";

// ── Formatting helpers ───────────────────────────────────────────────────────

function money(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateHeading(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Status pills ─────────────────────────────────────────────────────────────

const PAYMENT_PILL = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  refunded: "bg-red-100 text-red-600",
  failed: "bg-red-100 text-red-600",
};

const ORDER_PILL = {
  placed: "bg-gray-100 text-gray-600",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  returned: "bg-orange-100 text-orange-700",
};

function Pill({ value, label, map }) {
  const key = (value || "").toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        map[key] || "bg-gray-100 text-gray-500"
      }`}
    >
      {label || (value ? value.charAt(0).toUpperCase() + value.slice(1) : "—")}
    </span>
  );
}

// ── Timeline icons ───────────────────────────────────────────────────────────

function TimelineIcon({ status }) {
  const base = "w-7 h-7 rounded-lg flex items-center justify-center shrink-0";
  switch (status) {
    case "processing":
      return (
        <div className={`${base} bg-orange-50`}>
          <Clock size={14} className="text-orange-500" />
        </div>
      );
    case "shipped":
    case "out_for_delivery":
      return (
        <div className={`${base} bg-indigo-50`}>
          <Truck size={14} className="text-indigo-500" />
        </div>
      );
    case "delivered":
      return (
        <div className={`${base} bg-green-50`}>
          <CheckCircle2 size={14} className="text-green-600" />
        </div>
      );
    case "cancelled":
      return (
        <div className={`${base} bg-red-50`}>
          <XCircle size={14} className="text-red-500" />
        </div>
      );
    case "returned":
      return (
        <div className={`${base} bg-orange-50`}>
          <RotateCcw size={14} className="text-orange-500" />
        </div>
      );
    default:
      return (
        <div className={`${base} bg-blue-50`}>
          <ShoppingBag size={14} className="text-blue-500" />
        </div>
      );
  }
}

// ── Card shell ───────────────────────────────────────────────────────────────

function Card({ title, icon, right, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
    >
      {(title || right) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            {icon}
            {title}
          </h2>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ── More actions ─────────────────────────────────────────────────────────────

function MoreActions({ onCancel, onCopyId, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "Copy order ID", onClick: onCopyId },
    { label: "Cancel order", onClick: onCancel, danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        More actions
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 w-44 z-50 py-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                item.danger ? "text-red-600" : "text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const ORDER_STATUS_OPTIONS = [
  "placed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

const PAYMENT_STATUS_OPTIONS = ["pending", "paid", "failed", "refunded"];

function OrderDetail({ toaster }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id } = router.query;

  const { order, orders, loading } = useSelector((state) => state.order);

  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // The store may still hold a previously viewed order — only trust a match.
  const current = order && order._id === id ? order : null;

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id, router));
  }, [dispatch, id, router]);

  // Seed the status form whenever a different order loads
  useEffect(() => {
    if (!current) return;
    setOrderStatus(current.orderStatus || "placed");
    setPaymentStatus(current.paymentStatus || "pending");
    setTrackingNumber(current.tracking?.trackingNumber || "");
    setNotesDraft(current.notes || "");
    setEditingNotes(false);
  }, [current?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prev / next navigation across the loaded page of orders
  const { prevId, nextId } = useMemo(() => {
    const index = orders?.findIndex((o) => o._id === id) ?? -1;
    if (index === -1) return { prevId: null, nextId: null };
    return {
      prevId: index > 0 ? orders[index - 1]._id : null,
      nextId: index < orders.length - 1 ? orders[index + 1]._id : null,
    };
  }, [orders, id]);

  const dirty =
    !!current &&
    (orderStatus !== current.orderStatus ||
      paymentStatus !== current.paymentStatus ||
      trackingNumber !== (current.tracking?.trackingNumber || ""));

  const handleSave = async () => {
    if (!current || !dirty) return;
    setSaving(true);
    try {
      const payload = {};
      if (orderStatus !== current.orderStatus) payload.orderStatus = orderStatus;
      if (paymentStatus !== current.paymentStatus)
        payload.paymentStatus = paymentStatus;
      if (trackingNumber !== (current.tracking?.trackingNumber || ""))
        payload.trackingNumber = trackingNumber.trim();

      const res = await dispatch(updateOrderById(current._id, payload, router));
      if (res?.status) {
        toaster?.({ type: "success", message: "Order updated" });
        // Re-fetch so the timeline and populated fields stay accurate
        dispatch(fetchOrderById(current._id, router));
      } else {
        toaster?.({
          type: "error",
          message: res?.message || "Failed to update order",
        });
      }
    } catch (err) {
      toaster?.({
        type: "error",
        message: err?.message || "Failed to update order",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!current) return;
    setSavingNotes(true);
    try {
      const res = await dispatch(
        updateOrderNotes(current._id, notesDraft, router),
      );
      if (res?.status) {
        toaster?.({ type: "success", message: "Notes updated" });
        setEditingNotes(false);
        // Re-fetch so populated fields (customer, products) aren't lost
        dispatch(fetchOrderById(current._id, router));
      } else {
        toaster?.({
          type: "error",
          message: res?.message || "Failed to update notes",
        });
      }
    } catch (err) {
      toaster?.({
        type: "error",
        message: err?.message || "Failed to update notes",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotesDraft(current?.notes || "");
    setEditingNotes(false);
  };

  const handleCancel = async () => {
    if (!current) return;
    try {
      const res = await dispatch(
        updateOrderById(current._id, { orderStatus: "cancelled" }, router),
      );
      if (res?.status) {
        toaster?.({ type: "success", message: "Order cancelled" });
        dispatch(fetchOrderById(current._id, router));
      }
    } catch (err) {
      toaster?.({
        type: "error",
        message: err?.message || "Failed to cancel order",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toaster?.({ type: "success", message: "Link copied to clipboard" });
    } catch {
      toaster?.({ type: "error", message: "Could not copy link" });
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(current?._id || "");
      toaster?.({ type: "success", message: "Order ID copied" });
    } catch {
      toaster?.({ type: "error", message: "Could not copy order ID" });
    }
  };

  const timeline = useMemo(() => {
    const entries = [...(current?.statusHistory || [])].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
    const groups = [];
    entries.forEach((entry) => {
      const heading = formatDateHeading(entry.timestamp);
      let group = groups.find((g) => g.date === heading);
      if (!group) {
        group = { date: heading, items: [] };
        groups.push(group);
      }
      group.items.push(entry);
    });
    return groups;
  }, [current]);

  if (loading && !current) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <h2 className="text-base font-semibold text-gray-900">
            Order not found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            This order may have been removed, or the link is incorrect.
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="mt-6 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Back to orders
          </button>
        </div>
      </div>
    );
  }

  const address = current.address || {};
  const itemCount = current.itemCount || 0;
  const discount = current.couponDiscount || 0;

  return (
    <div className="p-4 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push("/orders")}
              className="p-1 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Back to orders"
            >
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              #{current.orderNumber}
            </h1>
            <Pill value={current.paymentStatus} map={PAYMENT_PILL} />
            <Pill
              value={current.orderStatus}
              label={formatOrderStatus(current.orderStatus)}
              map={ORDER_PILL}
            />
          </div>
          <p className="mt-1 ml-6 text-xs text-gray-500">
            Updated {formatDateTime(current.updatedAt || current.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Share2 size={14} />
            Share
          </button>
          <MoreActions onCancel={handleCancel} onCopyId={handleCopyId} />
          <div className="flex items-center">
            <button
              onClick={() => prevId && router.push(`/orders/${prevId}`)}
              disabled={!prevId}
              className="p-1.5 rounded-l-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous order"
            >
              <ChevronUp size={15} className="text-gray-600" />
            </button>
            <button
              onClick={() => nextId && router.push(`/orders/${nextId}`)}
              disabled={!nextId}
              className="p-1.5 rounded-r-lg border border-l-0 border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next order"
            >
              <ChevronDown size={15} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Products */}
          <Card
            title="Products"
            icon={<Package size={15} className="text-gray-500" />}
            right={
              <span className="text-xs text-gray-500">
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
            }
          >
            <div className="p-4 space-y-3">
              {(current.items || []).map((item, i) => (
                <div
                  key={`${item.sku || item.name}-${i}`}
                  className="flex items-center gap-3 border border-gray-100 rounded-lg p-3"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-11 h-11 rounded-lg object-cover border border-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    {item.variant?.label && (
                      <p className="text-xs text-gray-500 truncate">
                        {item.variant.label}
                      </p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-gray-400 truncate">
                        SKU: {item.sku}
                      </p>
                    )}
                  </div>

                  <span className="text-sm text-gray-600 shrink-0">
                    {money(item.price)}
                  </span>
                  <span className="text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-1 shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right shrink-0">
                    {money(item.total ?? item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment */}
          <Card
            title="Payment"
            icon={<CreditCard size={15} className="text-gray-500" />}
          >
            <div className="px-4 py-2 divide-y divide-gray-100">
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700 w-40">Subtotal</span>
                <span className="text-gray-500 flex-1">
                  {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-900">{money(current.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700 w-40">Discount</span>
                <span className="text-gray-500 flex-1">
                  {current.couponCode || "—"}
                </span>
                <span className="text-gray-900">
                  {discount > 0 ? `-${money(discount)}` : money(0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700 w-40">Shipping or delivery</span>
                <span className="text-gray-500 flex-1">—</span>
                <span className="text-gray-900">
                  {money(current.deliveryCharge)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700 w-40">Tax</span>
                <span className="text-gray-500 flex-1">Included</span>
                <span className="text-gray-900">{money(current.tax)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm font-semibold">
                <span className="text-gray-900 w-40">Total</span>
                <span className="flex-1" />
                <span className="text-gray-900">{money(current.total)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700">
                  Paid by customer via {current.paymentMethodLabel}
                </span>
                <Pill value={current.paymentStatus} map={PAYMENT_PILL} />
              </div>
            </div>
          </Card>

          {/* Update status */}
          <Card
            title="Update status"
            icon={<CreditCard size={15} className="text-gray-500" />}
          >
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Order status
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 outline-none text-gray-700 bg-white focus:border-gray-400"
                  >
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {formatOrderStatus(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Payment status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 outline-none text-gray-700 bg-white focus:border-gray-400"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Tracking number
                  </label>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 outline-none text-gray-700 placeholder-gray-400 focus:border-gray-400"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  className="bg-[#008060] hover:bg-[#006e52] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card title="Timeline">
            <div className="p-4">
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                timeline.map((group) => (
                  <div key={group.date} className="mb-5 last:mb-0">
                    <p className="text-xs font-medium text-gray-500 mb-3">
                      {group.date}
                    </p>
                    <div className="space-y-3">
                      {group.items.map((entry, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                          <TimelineIcon status={entry.status} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">
                              Order marked as {formatOrderStatus(entry.status)}
                            </p>
                            {entry.note && (
                              <p className="text-xs text-gray-500 truncate">
                                {entry.note}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Notes */}
          <Card
            title="Notes"
            right={
              !editingNotes && (
                <button
                  onClick={() => {
                    setNotesDraft(current.notes || "");
                    setEditingNotes(true);
                  }}
                  className="text-xs font-medium text-[#008060] hover:underline"
                >
                  Edit
                </button>
              )
            }
          >
            <div className="p-4">
              {editingNotes ? (
                <>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={4}
                    autoFocus
                    placeholder="Add a note about this order"
                    className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2 outline-none text-gray-700 placeholder-gray-400 focus:border-gray-400 resize-y"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={handleCancelNotes}
                      disabled={savingNotes}
                      className="text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes || notesDraft === (current.notes || "")}
                      className="text-sm font-medium text-white bg-[#008060] hover:bg-[#006e52] disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {savingNotes ? "Saving…" : "Save"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {current.notes || (
                    <span className="text-gray-400">No notes added</span>
                  )}
                </p>
              )}
            </div>
          </Card>

          {/* Customer */}
          <Card title="Customer">
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-900">{current.customer?.name}</p>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Contact information
                </p>
                {current.customer?.email ? (
                  <a
                    href={`mailto:${current.customer.email}`}
                    className="block text-sm text-[#008060] hover:underline break-words"
                  >
                    {current.customer.email}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">No email</p>
                )}
                <p className="text-sm text-gray-500">
                  {current.customer?.phone || "No phone number"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Shipping address
                </p>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {address.fullname && <p>{address.fullname}</p>}
                  {address.line1 && <p>{address.line1}</p>}
                  {address.line2 && <p>{address.line2}</p>}
                  {(address.city || address.pincode) && (
                    <p>
                      {[address.city, address.state].filter(Boolean).join(", ")}
                      {address.pincode ? `, ${address.pincode}` : ""}
                    </p>
                  )}
                  {address.country && <p>{address.country}</p>}
                  {address.phone && <p>{address.phone}</p>}
                  {!address.fullname && !address.line1 && (
                    <p className="text-gray-400">No shipping address</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Billing address
                </p>
                <p className="text-sm text-gray-500">
                  Same as shipping address
                </p>
              </div>
            </div>
          </Card>

          {/* Delivery */}
          <Card title="Delivery" icon={<Truck size={15} className="text-gray-500" />}>
            <div className="p-4 space-y-3">
              {current.tracking?.trackingNumber ? (
                <div>
                  <p className="text-sm text-gray-900">
                    {current.tracking.trackingNumber}
                  </p>
                  {current.tracking.partner && (
                    <p className="text-xs text-gray-500">
                      {current.tracking.partner}
                    </p>
                  )}
                  {current.tracking.url && (
                    <a
                      href={current.tracking.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#008060] hover:underline"
                    >
                      Track shipment
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No tracking added</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Delivery charge</span>
                <span className="text-gray-900">
                  {money(current.deliveryCharge)}
                </span>
              </div>
            </div>
          </Card>

          {/* Order details */}
          <Card title="Order details">
            <div className="p-4 space-y-2.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-700 shrink-0">Order ID</span>
                <span className="text-gray-900 text-right break-all">
                  {current._id}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-700 shrink-0">Placed</span>
                <span className="text-gray-900 text-right">
                  {formatDateTime(current.createdAt)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-700 shrink-0">Payment method</span>
                <span className="text-gray-900 text-right">
                  {current.paymentMethodLabel}
                </span>
              </div>
              {current.paymentId && (
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-700 shrink-0">Payment ID</span>
                  <span className="text-gray-900 text-right break-all">
                    {current.paymentId}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default isAuth(OrderDetail);
