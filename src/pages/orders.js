import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  InboxIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import isAuth from "@/components/isAuth";
import Table from "@/components/table";
import { fetchOrders } from "@/redux/actions/orderActions";

// ── Analytics bar ───────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div className="flex-1 min-w-0 px-6 py-3 border-r border-gray-200 last:border-r-0">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        <span className="text-xs text-gray-400">—</span>
      </div>
      <div className="mt-2 h-0.5 w-10 bg-blue-400 rounded-full" />
    </div>
  );
}

function AnalyticsBar({ orders }) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today,
  );
  const itemsOrdered = todayOrders.reduce(
    (sum, o) => sum + (o.itemCount ?? o.items?.length ?? 0),
    0,
  );
  const returns = todayOrders
    .filter((o) => o.paymentStatus === "refunded" || o.orderStatus === "returned")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const fulfilled = todayOrders.filter(
    (o) => o.orderStatus === "delivered" || o.fulfillmentStatus === "fulfilled",
  ).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-4 flex items-stretch overflow-x-auto">
      <div className="flex items-center gap-1.5 px-4 py-3 border-r border-gray-200 shrink-0">
        <ChevronLeft size={14} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Today
        </span>
        <ChevronRight size={14} className="text-gray-400" />
      </div>
      <StatCard label="Orders" value={todayOrders.length} />
      <StatCard label="Items ordered" value={itemsOrdered} />
      <StatCard label="Returns" value={`$${Number(returns).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
      <StatCard label="Orders fulfilled" value={fulfilled} />
    </div>
  );
}

// ── More actions dropdown ────────────────────────────────────────────────────

function MoreActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        More actions
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 w-44 z-50 py-1">
          {["Export orders", "Import orders", "Print packing slips"].map(
            (item) => (
              <button
                key={item}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {item}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state illustration ─────────────────────────────────────────────────

function OrderIllustration() {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Teal circle base */}
      <circle cx="70" cy="70" r="70" fill="#e8f5f3" />
      <ellipse cx="70" cy="118" rx="42" ry="12" fill="#00806050" />
      {/* Receipt/document */}
      <rect x="38" y="28" width="64" height="80" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      {/* Top blue bar */}
      <rect x="50" y="42" width="28" height="4" rx="2" fill="#3b82f6" />
      {/* Product row 1 */}
      <rect x="50" y="54" width="16" height="16" rx="3" fill="#6ee7b7" />
      <rect x="72" y="57" width="20" height="3" rx="1.5" fill="#d1d5db" />
      <rect x="72" y="63" width="14" height="2.5" rx="1.25" fill="#e5e7eb" />
      {/* Product row 2 */}
      <rect x="50" y="76" width="16" height="16" rx="3" fill="#fca5a5" />
      <rect x="72" y="79" width="20" height="3" rx="1.5" fill="#d1d5db" />
      <rect x="72" y="85" width="14" height="2.5" rx="1.25" fill="#e5e7eb" />
      {/* Bottom lines */}
      <rect x="50" y="98" width="40" height="2" rx="1" fill="#e5e7eb" />
    </svg>
  );
}

// ── Table columns ────────────────────────────────────────────────────────────

function PaymentStatusPill({ value }) {
  const map = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    refunded: "bg-red-100 text-red-600",
    unpaid: "bg-gray-100 text-gray-500",
  };
  const key = (value || "").toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[key] || "bg-gray-100 text-gray-500"}`}
    >
      {value ? value.charAt(0).toUpperCase() + value.slice(1) : "—"}
    </span>
  );
}

function OrderStatusPill({ value, label }) {
  const map = {
    placed: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    out_for_delivery: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
    returned: "bg-orange-100 text-orange-700",
  };
  const key = (value || "").toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[key] || "bg-gray-100 text-gray-500"}`}
    >
      {label || value || "—"}
    </span>
  );
}

const COLUMNS = [
  {
    Header: "Order",
    accessor: "orderNumber",
    Cell: ({ value }) => (
      <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
        #{value || "—"}
      </span>
    ),
  },
  {
    Header: "Date",
    accessor: "createdAt",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-600">
        {value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
      </span>
    ),
  },
  {
    Header: "Customer",
    accessor: "customer",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-700">
        {value?.name || value || "Guest"}
      </span>
    ),
  },
  {
    Header: "Payment",
    accessor: "paymentStatus",
    Cell: ({ value }) => <PaymentStatusPill value={value} />,
  },
  {
    Header: "Status",
    accessor: "orderStatus",
    Cell: ({ value, row }) => (
      <OrderStatusPill value={value} label={row.original.orderStatusLabel} />
    ),
  },
  {
    Header: "Items",
    accessor: "itemCount",
    Cell: ({ value, row }) => {
      const count = value ?? (Array.isArray(row.original.items) ? row.original.items.length : 0);
      return (
        <span className="text-sm text-gray-600">
          {count} item{count !== 1 ? "s" : ""}
        </span>
      );
    },
  },
  {
    Header: "Total",
    accessor: "total",
    Cell: ({ value }) => (
      <span className="text-sm font-medium text-gray-900">
        ${value != null ? Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
      </span>
    ),
  },
  {
    Header: "Delivery",
    accessor: "deliveryMethod",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-600">{value || "—"}</span>
    ),
  },
];

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 px-6 text-center">
      <OrderIllustration />
      <h2 className="mt-6 text-base font-semibold text-gray-900">
        Your orders will show here
      </h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        When a customer places an order, it will appear here. You can manage,
        fulfill, and track all your orders from this page.
      </p>
      <button className="mt-6 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
        <Plus size={14} />
        Create order
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Orders() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { orders, loading, error, total } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchOrders(router));
  }, [dispatch, router]);

  const columns = useMemo(() => COLUMNS, []);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <InboxIcon size={18} className="text-gray-700" />
          Orders
          {!loading && total > 0 && (
            <span className="text-sm font-normal text-gray-500">({total})</span>
          )}
        </h1>
        <MoreActions />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Analytics bar */}
      {!loading && orders.length > 0 && <AnalyticsBar orders={orders} />}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <Table columns={columns} data={orders} />
      )}

      {/* Footer */}
      {!loading && (
        <p className="text-center mt-6 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
          Learn more about orders
        </p>
      )}
    </div>
  );
}

export default isAuth(Orders);
