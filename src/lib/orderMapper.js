const ORDER_STATUS_LABELS = {
  placed: "Placed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const PAYMENT_LABELS = {
  COD: "Cash on delivery",
  UPI: "UPI",
  card: "Card",
  netbanking: "Net banking",
  wallet: "Wallet",
};

export function formatOrderStatus(status) {
  return ORDER_STATUS_LABELS[status] || status || "—";
}

export function formatPaymentMethod(method) {
  return PAYMENT_LABELS[method] || method || "—";
}

export function mapFulfillmentStatus(orderStatus) {
  switch (orderStatus) {
    case "delivered":
      return "fulfilled";
    case "shipped":
    case "out_for_delivery":
      return "partial";
    case "cancelled":
    case "returned":
      return "cancelled";
    default:
      return "unfulfilled";
  }
}

/** Map backend order document → admin table row */
export function mapApiOrderToRow(order) {
  if (!order) return null;

  const customerName =
    order.user?.fullname ||
    order.address?.fullname ||
    (typeof order.user === "string" ? null : null) ||
    "Guest";

  const itemCount = Array.isArray(order.items)
    ? order.items.reduce((sum, i) => sum + (i.quantity || 1), 0)
    : 0;

  return {
    _id: order._id,
    orderNumber: order.orderNumber || order._id,
    createdAt: order.createdAt,
    customer: {
      name: customerName,
      email: order.user?.email || "",
    },
    paymentStatus: order.paymentStatus || "pending",
    orderStatus: order.orderStatus || "placed",
    orderStatusLabel: formatOrderStatus(order.orderStatus),
    fulfillmentStatus: mapFulfillmentStatus(order.orderStatus),
    items: order.items || [],
    itemCount,
    total: order.totalAmount ?? 0,
    deliveryMethod: formatPaymentMethod(order.paymentMethod),
    paymentMethod: order.paymentMethod,
    address: order.address,
    raw: order,
  };
}

export function mapApiOrdersToRows(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.map(mapApiOrderToRow).filter(Boolean);
}
