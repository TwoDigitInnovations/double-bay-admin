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
  stripe: "Stripe",
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
      phone: order.user?.phone || order.address?.phone || "",
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
    paymentMethodLabel: formatPaymentMethod(order.paymentMethod),
    paymentId: order.paymentId || "",
    address: order.address,

    // Detail-view fields
    updatedAt: order.updatedAt,
    subtotal: order.subtotal ?? 0,
    tax: order.tax ?? 0,
    deliveryCharge: order.deliveryCharge ?? 0,
    couponCode: order.couponCode || "",
    couponDiscount: order.couponDiscount ?? 0,
    statusHistory: order.statusHistory || [],
    tracking: order.tracking || null,
    notes: order.notes || "",
    returnRequest: order.returnRequest || null,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,

    raw: order,
  };
}

export function mapApiOrdersToRows(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.map(mapApiOrderToRow).filter(Boolean);
}
