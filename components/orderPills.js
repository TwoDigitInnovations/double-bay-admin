// Shared status pills for the orders list and the order detail page.

export function PaymentStatusPill({ value }) {
  const map = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-600",
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

export function OrderStatusPill({ value, label }) {
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
