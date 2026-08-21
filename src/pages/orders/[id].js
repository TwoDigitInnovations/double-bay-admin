import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  AtSign,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  Link2,
  Lock,
  LockOpen,
  MapPin,
  MoreHorizontal,
  Globe,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
  ShoppingBag,
  Smile,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import isAuth from "@/components/isAuth";
import { OrderStatusPill, PaymentStatusPill } from "@/components/orderPills";
import {
  AddProductModal,
  AddressModal,
  Card,
  ConfirmDialog,
  CurrencyModal,
  CustomItemModal,
  DiscountModal,
  DropdownMenu,
  SendInvoiceModal,
  ShippingModal,
  TaxModal,
  UnsavedChangesDialog,
  inputClass,
} from "@/components/orderDetail";
import {
  addOrderComment,
  deleteOrderById,
  deleteOrderComment,
  duplicateOrderById,
  fetchOrderById,
  sendOrderInvoice,
  updateOrderDetails,
} from "@/redux/actions/orderActions";
import { setOrder } from "@/redux/slices/orderSlice";
import {
  formatMoney,
  formatOrderStatus,
  formatPaymentMethod,
} from "@/lib/orderMapper";

const ORDER_STATUSES = [
  "placed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

const PAYMENT_METHODS = ["COD", "UPI", "card", "netbanking", "wallet", "stripe"];

const STATUS_ICONS = {
  placed: ShoppingBag,
  processing: Clock,
  shipped: Truck,
  out_for_delivery: Truck,
  delivered: Check,
  cancelled: X,
  returned: RotateCcw,
};

const STATUS_ICON_COLORS = {
  placed: "bg-blue-50 text-blue-600",
  processing: "bg-amber-50 text-amber-600",
  shipped: "bg-indigo-50 text-indigo-600",
  out_for_delivery: "bg-purple-50 text-purple-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
  returned: "bg-orange-50 text-orange-600",
};

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "—";

const formatDay = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "—";

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

/** "today at 3:00 pm" / "yesterday at 9:12 am" / "on 13 December 2024 at …" */
const formatWhen = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.floor((startOfToday - date) / 86400000);
  const time = formatTime(value);
  if (date >= startOfToday) return `today at ${time}`;
  if (days === 0) return `yesterday at ${time}`;
  return `on ${formatDay(value)} at ${time}`;
};

// ── Draft state ─────────────────────────────────────────────────────────────
// Every edit on this page lands in a local draft first; the contextual save
// bar pushes the whole thing to the API in one request.

let lineSeq = 0;
const nextLineKey = () => `line-${++lineSeq}`;

function buildDraft(raw = {}) {
  return {
    items: (raw.items || []).map((item) => ({
      key: nextLineKey(),
      product: item.productId || item.product?._id || item.product || null,
      custom: !!item.custom || !(item.productId || item.product),
      name: item.name || "",
      image: item.image || "",
      sku: item.sku || "",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      variant: item.variant || {},
      taxable: item.taxable !== false,
      requiresShipping: item.requiresShipping !== false,
    })),
    address: { ...(raw.address || {}) },
    billingAddress: {
      sameAsShipping: raw.billingAddress?.sameAsShipping !== false,
      ...(raw.billingAddress || {}),
    },
    tags: [...(raw.tags || [])],
    manualDiscount:
      Number(raw.manualDiscount?.value) > 0
        ? {
          title: raw.manualDiscount.title || "Discount",
          type: raw.manualDiscount.type || "flat",
          value: Number(raw.manualDiscount.value) || 0,
          reason: raw.manualDiscount.reason || "",
        }
        : null,
    deliveryCharge: Number(raw.deliveryCharge) || 0,
    shippingLabel: raw.shippingLabel || "",
    tax: Number(raw.tax) || 0,
    taxRate: Number(raw.taxRate) || 0,
    taxIncluded: !!raw.taxIncluded,
    currency: {
      code: raw.currency?.code || "USD",
      displayCode: raw.currency?.displayCode || "",
      rate: Number(raw.currency?.rate) || 1,
    },
    market: raw.market || raw.address?.country || "",
    paymentDueLater: !!raw.paymentDueLater,
    orderStatus: raw.orderStatus || "placed",
    paymentStatus: raw.paymentStatus || "pending",
    paymentMethod: raw.paymentMethod || "COD",
    tracking: {
      trackingNumber: raw.tracking?.trackingNumber || "",
      partner: raw.tracking?.partner || "",
      url: raw.tracking?.url || "",
    },
  };
}

/** Comparable form of the draft — line keys are local and don't count. */
const serializeDraft = (draft) =>
  JSON.stringify({
    ...draft,
    items: (draft?.items || []).map(({ key, ...rest }) => rest),
  });

const discountOff = (discount, base) => {
  const value = Number(discount?.value) || 0;
  if (value <= 0 || base <= 0) return 0;
  const off = discount.type === "percentage" ? (base * value) / 100 : value;
  return round2(Math.min(Math.max(off, 0), base));
};

/** Mirrors recalculateTotals() on the server so the summary stays honest. */
function computeTotals(draft, couponDiscount = 0) {
  const items = draft?.items || [];
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const coupon = round2(Math.min(Number(couponDiscount) || 0, subtotal));
  const manual = discountOff(draft?.manualDiscount, subtotal - coupon);
  const discounted = Math.max(0, subtotal - coupon - manual);

  const rate = Number(draft?.taxRate) || 0;
  const tax = round2(
    rate > 0
      ? draft.taxIncluded
        ? discounted - discounted / (1 + rate / 100)
        : (discounted * rate) / 100
      : Number(draft?.tax) || 0,
  );

  const shipping = round2(draft?.deliveryCharge);
  const total = round2(discounted + shipping + (draft?.taxIncluded ? 0 : tax));

  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    coupon,
    manual,
    discount: round2(coupon + manual),
    shipping,
    tax,
    total,
  };
}

/** Draft → request body for PUT /orders/:id */
const toPayload = (draft) => ({
  items: draft.items.map((item) =>
    item.custom
      ? {
        custom: true,
        name: item.name,
        sku: item.sku,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        taxable: item.taxable,
        requiresShipping: item.requiresShipping,
      }
      : {
        product: item.product,
        name: item.name,
        image: item.image,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant,
        taxable: item.taxable,
        requiresShipping: item.requiresShipping,
      },
  ),
  address: draft.address,
  billingAddress: draft.billingAddress,
  tags: draft.tags,
  manualDiscount: draft.manualDiscount,
  deliveryCharge: draft.deliveryCharge,
  shippingLabel: draft.shippingLabel,
  tax: draft.tax,
  taxRate: draft.taxRate,
  taxIncluded: draft.taxIncluded,
  currency: draft.currency,
  market: draft.market,
  paymentDueLater: draft.paymentDueLater,
  orderStatus: draft.orderStatus,
  paymentStatus: draft.paymentStatus,
  paymentMethod: draft.paymentMethod,
  tracking: draft.tracking,
});

// ── Presentational pieces ───────────────────────────────────────────────────

const LINK = "text-[#005bd3] hover:underline";

/** Payment summary line: label · detail · amount. */
function SummaryRow({ label, detail, value, strong, onEdit }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5">
      <div className="w-32 sm:w-44 shrink-0">
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className={`text-sm text-left cursor-pointer ${LINK}`}
          >
            {label}
          </button>
        ) : (
          <span
            className={`text-sm ${strong ? "font-semibold text-gray-900" : "text-gray-700"}`}
          >
            {label}
          </span>
        )}
      </div>
      <span className="flex-1 text-sm text-gray-500 min-w-0 wrap-break-word">
        {detail || "—"}
      </span>
      <span
        className={`shrink-0 text-sm text-right ${strong ? "font-semibold text-gray-900" : "text-gray-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 text-right wrap-break-word">
        {value || "—"}
      </span>
    </div>
  );
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

/** Order note the admin can add, edit or clear. Saves on its own. */
function NotesCard({ value = "", onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // Keep the draft in step with the order while not editing.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const submit = async () => {
    const next = draft.trim();
    if (next === value.trim()) {
      setEditing(false);
      return;
    }
    if (await onSave(next)) setEditing(false);
  };

  return (
    <Card
      title="Notes"
      bodyClass="px-4 pb-4 pt-1"
      action={
        !editing && (
          <IconButton label="Edit notes" onClick={() => setEditing(true)}>
            <Pencil size={14} />
          </IconButton>
        )
      }
    >
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Add a note about this order"
            className={`${inputClass} resize-y`}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setDraft(value);
                setEditing(false);
              }}
              disabled={saving}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </>
      ) : value ? (
        <p className="text-sm text-gray-700 whitespace-pre-wrap wrap-break-word">
          {value}
        </p>
      ) : (
        <p className="text-sm text-gray-400">No notes</p>
      )}
    </Card>
  );
}

/** Free-form tags, kept in the draft and saved with everything else. */
function TagsCard({ tags, onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    const value = input.trim();
    if (!value) return;
    if (!tags.includes(value)) onChange([...tags, value]);
    setInput("");
  };

  return (
    <Card title="Tags" bodyClass="px-4 pb-4 pt-1">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="Add a tag and press Enter"
        className={inputClass}
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                aria-label={`Remove ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Staff comments and system events, newest first, grouped by day. */
function TimelineCard({ groups, initial, posting, onPost, onDelete }) {
  const [comment, setComment] = useState("");
  const [focused, setFocused] = useState(false);

  const post = async () => {
    const text = comment.trim();
    if (!text) return;
    if (await onPost(text)) setComment("");
  };

  return (
    <Card title="Timeline" bodyClass="px-4 pb-4 pt-1">
      <div className="rounded-xl border border-gray-200 focus-within:border-gray-400 transition-colors">
        <div className="flex items-start gap-3 px-3 py-3">
          <span className="w-7 h-7 rounded-full bg-[#005bd3] text-white text-xs font-semibold grid place-items-center shrink-0 uppercase">
            {initial}
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={focused || comment ? 3 : 1}
            placeholder="Leave a comment…"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none bg-transparent pt-1"
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2">
          <div className="flex items-center gap-3 text-gray-400">
            <Smile size={15} />
            <AtSign size={15} />
            <Hash size={15} />
            <Link2 size={15} />
          </div>
          <button
            type="button"
            onClick={post}
            disabled={!comment.trim() || posting}
            className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-right mt-2">
        Only you and other staff can see comments
      </p>

      {groups.length === 0 ? (
        <p className="text-sm text-gray-400 py-3">
          Nothing has happened on this order yet.
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.day} className="pt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">{group.day}</p>
            <ol className="relative ml-1 border-l border-gray-200 pl-5 space-y-4">
              {group.events.map((event) => {
                const isComment = event.kind === "comment";
                const Icon = isComment ? Pencil : STATUS_ICONS[event.status] || Clock;
                const tone = isComment
                  ? "bg-gray-100 text-gray-500"
                  : STATUS_ICON_COLORS[event.status] || "bg-gray-100 text-gray-500";

                return (
                  <li key={event.id} className="relative group">
                    <span className="absolute -left-6.5 top-2 w-2 h-2 rounded-full bg-gray-300" />
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 rounded-md grid place-items-center shrink-0 ${tone}`}
                      >
                        <Icon size={13} />
                      </span>
                      <div className="min-w-0 flex-1">
                        {isComment ? (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap wrap-break-word">
                              {event.message}
                            </p>
                            {event.authorName && (
                              <p className="text-xs text-gray-500 mt-1">
                                {event.authorName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-900">{event.message}</p>
                            {event.note && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {event.note}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {isComment && event.id && (
                        <button
                          type="button"
                          onClick={() => onDelete(event.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all shrink-0 cursor-pointer"
                          aria-label="Delete comment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <span className="text-xs text-gray-500 shrink-0">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))
      )}
    </Card>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

function OrderDetail({ toaster }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { id } = router.query;
  const { order, orders, loading, error } = useSelector((state) => state.order);
  const admin = useSelector((state) => state.user?.user);

  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [posting, setPosting] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(null);
  // Edits in flight survive the re-fetch that follows a note or comment.
  const keepDraftRef = useRef(null);
  const [unlocked, setUnlocked] = useState(() => new Set());

  useEffect(() => {
    if (!id) return;
    dispatch(fetchOrderById(id, router));
    // Drop the previously viewed order so a stale one never flashes.
    return () => dispatch(setOrder(null));
  }, [dispatch, router, id]);

  const raw = useMemo(() => order?.raw || {}, [order]);

  // Rebuild the draft whenever a fresh copy of the order arrives.
  useEffect(() => {
    if (!order) return;
    const fresh = buildDraft(order.raw || {});
    setBaseline(serializeDraft(fresh));
    if (keepDraftRef.current) {
      setDraft(keepDraftRef.current);
      keepDraftRef.current = null;
      return;
    }
    setDraft(fresh);
    setUnlocked(new Set());
  }, [order]);

  const items = draft?.items || [];
  const totals = useMemo(
    () => computeTotals(draft, raw.couponDiscount),
    [draft, raw.couponDiscount],
  );
  const currency = draft?.currency?.code || "USD";
  const money = (value) => formatMoney(value, currency);
  const isDirty = !!draft && serializeDraft(draft) !== baseline;

  const patch = (changes) => setDraft((prev) => ({ ...prev, ...changes }));

  // Prev/next within the list the user came from (empty on a direct visit).
  const index = orders?.findIndex((o) => o._id === id) ?? -1;
  const prevOrder = index > 0 ? orders[index - 1] : null;
  const nextOrder =
    index >= 0 && index < (orders?.length || 0) - 1 ? orders[index + 1] : null;

  // Timeline entries, newest first, grouped by day. Orders placed before the
  // timeline existed fall back to their status history.
  const timeline = useMemo(() => {
    const entries = raw.timeline?.length
      ? raw.timeline.map((entry) => ({
        id: entry._id,
        kind: entry.kind || "event",
        message: entry.message,
        authorName: entry.authorName,
        timestamp: entry.timestamp,
      }))
      : (raw.statusHistory || []).map((entry, i) => ({
        id: `history-${i}`,
        kind: "event",
        status: entry.status,
        message: `Order marked as ${formatOrderStatus(entry.status)}`,
        note: entry.note,
        timestamp: entry.timestamp,
      }));

    if (!entries.length && raw.createdAt) {
      entries.push({
        id: "created",
        kind: "event",
        status: raw.orderStatus || "placed",
        message: "Order placed",
        timestamp: raw.createdAt,
      });
    }

    const sorted = [...entries].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    const groups = [];
    sorted.forEach((event) => {
      const day = formatDay(event.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.events.push(event);
      else groups.push({ day, events: [event] });
    });
    return groups;
  }, [raw.timeline, raw.statusHistory, raw.createdAt, raw.orderStatus]);

  const copy = async (text, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toaster?.({ type: "success", message: `${label} copied` });
    } catch {
      toaster?.({ type: "error", message: "Could not copy to clipboard" });
    }
  };

  /** Re-read the order, holding on to any edits the save bar hasn't taken. */
  const reload = () => {
    if (isDirty) keepDraftRef.current = draft;
    return dispatch(fetchOrderById(id, router));
  };

  const notify = (res, fallback, success) => {
    if (res?.status) {
      if (success) toaster?.({ type: "success", message: success });
      return true;
    }
    toaster?.({ type: "error", message: res?.message || fallback });
    return false;
  };

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      const res = await dispatch(updateOrderDetails(id, toPayload(draft), router));
      if (notify(res, "Failed to update order", "Order updated")) {
        // Re-fetch so populated customer and product data isn't lost. The
        // server's copy wins here, so the local draft is deliberately dropped.
        keepDraftRef.current = null;
        await dispatch(fetchOrderById(id, router));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    const next = buildDraft(raw);
    setDraft(next);
    setBaseline(serializeDraft(next));
    setUnlocked(new Set());
  };

  const handleSaveNotes = async (notes) => {
    setSavingNotes(true);
    try {
      const res = await dispatch(updateOrderDetails(id, { notes }, router));
      if (!notify(res, "Failed to save note", notes ? "Note saved" : "Note removed")) {
        return false;
      }
      await reload();
      return true;
    } finally {
      setSavingNotes(false);
    }
  };

  const handlePostComment = async (message) => {
    setPosting(true);
    try {
      const res = await dispatch(addOrderComment(id, message, router));
      if (!notify(res, "Failed to add comment")) return false;
      await reload();
      return true;
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (entryId) => {
    const res = await dispatch(deleteOrderComment(id, entryId, router));
    if (notify(res, "Failed to delete comment", "Comment deleted")) await reload();
  };

  const handleSendInvoice = async (payload) => {
    setSending(true);
    try {
      const res = await dispatch(sendOrderInvoice(id, payload, router));
      if (notify(res, "Failed to send invoice", "Invoice sent")) {
        setModal(null);
        await reload();
      }
    } finally {
      setSending(false);
    }
  };

  const handleDuplicate = async () => {
    const res = await dispatch(duplicateOrderById(id, router));
    if (notify(res, "Failed to duplicate order", "Order duplicated")) {
      const copyId = res.order?._id;
      if (copyId) router.push(`/orders/${copyId}`);
    }
    setConfirm(null);
  };

  const handleDelete = async () => {
    try {
      const res = await dispatch(deleteOrderById(id, router));
      if (notify(res, "Failed to delete order", "Order deleted")) {
        router.push("/orders");
      }
    } catch (err) {
      notify(err, "Failed to delete order");
    } finally {
      setConfirm(null);
    }
  };

  // ── Line item edits ──────────────────────────────────────────────────────

  const addLines = (lines) => {
    setDraft((prev) => {
      const next = [...prev.items];
      lines.forEach((line) => {
        // Adding a product already on the order just bumps its quantity.
        const existing = next.findIndex(
          (item) => !item.custom && item.product === line.product,
        );
        if (existing !== -1) {
          next[existing] = {
            ...next[existing],
            quantity: next[existing].quantity + line.quantity,
          };
        } else {
          next.push({
            key: nextLineKey(),
            custom: false,
            variant: {},
            taxable: true,
            requiresShipping: true,
            ...line,
          });
        }
      });
      return { ...prev, items: next };
    });
    setModal(null);
  };

  const addCustomLine = (line) => {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, { key: nextLineKey(), product: null, ...line }],
    }));
    setModal(null);
  };

  const updateLine = (key, changes) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.key === key ? { ...item, ...changes } : item,
      ),
    }));

  const removeLine = (key) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.key !== key),
    }));

  const toggleLock = (key) =>
    setUnlocked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if ((loading && !order) || (order && !draft)) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-500">
            {error || "This order could not be found."}
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="mt-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Back to orders
          </button>
        </div>
      </div>
    );
  }

  const user = raw.user || {};
  const address = draft.address || {};
  const billing = draft.billingAddress || {};
  const customerName =
    user.fullname || order.customer?.name || address.fullname || "Guest";
  const customerEmail = user.email || order.customer?.email;
  const customerPhone = user.phone || address.phone;
  const customerOrders = raw.customerStats?.orders || 0;
  const adminInitial = (admin?.fullname || admin?.email || "A").charAt(0);
  const updatedBy = raw.updatedBy?.fullname || raw.updatedBy?.email;
  const addressLines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(" "),
    address.country,
  ].filter(Boolean);
  const mapQuery = encodeURIComponent(addressLines.join(", "));

  const discountDetail = draft.manualDiscount
    ? `${draft.manualDiscount.title}${draft.manualDiscount.type === "percentage"
      ? ` (${draft.manualDiscount.value}%)`
      : ""
    }`
    : raw.couponCode || "";

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-2 min-w-0">
          <button
            onClick={() => router.push("/orders")}
            className="p-1.5 rounded-lg hover:bg-gray-200/70 text-gray-600 transition-colors shrink-0 cursor-pointer"
            aria-label="Back to orders"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">
                #{order.orderNumber}
              </h1>
              <PaymentStatusPill value={order.paymentStatus} />
              <OrderStatusPill
                value={order.orderStatus}
                label={formatOrderStatus(order.orderStatus)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {updatedBy
                ? `Updated by ${updatedBy} ${formatWhen(raw.updatedAt)}`
                : `Placed ${formatDate(order.createdAt)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setConfirm({
                title: "Duplicate this order?",
                message:
                  "A new order is created with the same products, customer and totals. Stock is reserved for the copy.",
                confirmLabel: "Duplicate",
                tone: "dark",
                onConfirm: handleDuplicate,
              })
            }
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Duplicate
          </button>
          <button
            onClick={() => copy(window.location.href, "Order link")}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Share2 size={14} />
            Share
          </button>
          <DropdownMenu
            trigger={
              <button className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                More actions
                <ChevronDown size={14} />
              </button>
            }
            items={[
              { label: "Print order", onClick: () => window.print() },
              { label: "Send invoice", onClick: () => setModal("invoice") },
              {
                label: "Copy order number",
                onClick: () => copy(order.orderNumber, "Order number"),
              },
              { label: "Copy order ID", onClick: () => copy(order._id, "Order ID") },
              {
                label: "Copy customer email",
                hidden: !customerEmail,
                onClick: () => copy(customerEmail, "Email"),
              },
              {
                label: "Copy tracking number",
                hidden: !raw.tracking?.trackingNumber,
                onClick: () => copy(raw.tracking.trackingNumber, "Tracking number"),
              },
              {
                label: "Delete order",
                tone: "danger",
                onClick: () =>
                  setConfirm({
                    title: "Delete this order?",
                    message:
                      "The order is removed for good and its stock goes back to the catalogue. This cannot be undone.",
                    confirmLabel: "Delete order",
                    onConfirm: handleDelete,
                  }),
              },
            ]}
          />
          <div className="flex items-center">
            <button
              onClick={() => prevOrder && router.push(`/orders/${prevOrder._id}`)}
              disabled={!prevOrder}
              className="p-1.5 rounded-l-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Previous order"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => nextOrder && router.push(`/orders/${nextOrder._id}`)}
              disabled={!nextOrder}
              className="p-1.5 rounded-r-lg border border-l-0 border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="Next order"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Products */}
          <Card
            title="Products"
            icon={Package}
            bodyClass="p-4 pt-2"
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModal("product")}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  Add product
                </button>
                <button
                  onClick={() => setModal("custom")}
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  Add custom item
                </button>
                <DropdownMenu
                  trigger={
                    <button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">
                      <MoreHorizontal size={16} />
                    </button>
                  }
                  items={[
                    {
                      label: "Reset line items",
                      onClick: () => patch({ items: buildDraft(raw).items }),
                    },
                    {
                      label: "Copy line items",
                      onClick: () =>
                        copy(
                          items
                            .map(
                              (item) =>
                                `${item.quantity} x ${item.name} — ${money(
                                  item.price * item.quantity,
                                )}`,
                            )
                            .join("\n"),
                          "Line items",
                        ),
                    },
                  ]}
                />
              </div>
            }
          >
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {items.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">
                  No products on this order yet. Add one to get started.
                </p>
              )}
              {items.map((item) => {
                const editable = unlocked.has(item.key);
                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 grid place-items-center shrink-0">
                        <Package size={15} className="text-gray-400" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[
                          item.variant?.label,
                          item.sku,
                          item.custom && "Custom item",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 sm:hidden">
                        {money(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleLock(item.key)}
                        aria-label={editable ? "Lock price" : "Edit price"}
                        title={editable ? "Lock price" : "Edit price"}
                        className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        {editable ? <LockOpen size={14} /> : <Lock size={14} />}
                      </button>
                      {editable ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            updateLine(item.key, {
                              price: Number(e.target.value) || 0,
                            })
                          }
                          className="w-24 h-9 rounded-lg border border-gray-300 text-sm text-right px-2 text-gray-800 outline-none focus:border-gray-900"
                        />
                      ) : (
                        <span className="w-24 text-sm text-gray-700 text-right">
                          {money(item.price)}
                        </span>
                      )}
                    </div>

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateLine(item.key, {
                          quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-16 h-9 shrink-0 rounded-lg border border-gray-300 bg-white text-sm text-center text-gray-800 outline-none focus:border-gray-900"
                    />

                    <span className="w-20 sm:w-24 text-sm font-medium text-gray-900 text-right shrink-0">
                      {money(item.price * item.quantity)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeLine(item.key)}
                      aria-label={`Remove ${item.name}`}
                      className="text-gray-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Payment */}
          <Card title="Payment" icon={CreditCard} bodyClass="p-4 pt-2">
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              <SummaryRow
                label="Subtotal"
                detail={`${totals.itemCount} ${totals.itemCount === 1 ? "item" : "items"}`}
                value={money(totals.subtotal)}
              />
              <SummaryRow
                label={
                  draft.manualDiscount || totals.discount > 0
                    ? "Discount"
                    : "Add discount"
                }
                detail={discountDetail}
                value={
                  totals.discount > 0 ? `-${money(totals.discount)}` : money(0)
                }
                onEdit={() => setModal("discount")}
              />
              <SummaryRow
                label={
                  draft.shippingLabel || draft.deliveryCharge > 0
                    ? "Shipping or delivery"
                    : "Add shipping or delivery"
                }
                detail={draft.shippingLabel || raw.tracking?.partner || ""}
                value={money(totals.shipping)}
                onEdit={() => setModal("shipping")}
              />
              <SummaryRow
                label="Estimated tax"
                detail={
                  draft.taxRate > 0
                    ? `${draft.taxRate}%${draft.taxIncluded ? " (included)" : ""}`
                    : totals.tax > 0
                      ? draft.taxIncluded
                        ? "Included in prices"
                        : "Fixed amount"
                      : "Not calculated"
                }
                value={money(totals.tax)}
                onEdit={() => setModal("tax")}
              />
              <SummaryRow
                label="Total"
                detail={
                  draft.currency.displayCode
                    ? `Approximately ${formatMoney(
                      totals.total * (draft.currency.rate || 1),
                      draft.currency.displayCode,
                    )} ${draft.currency.displayCode}`
                    : ""
                }
                value={`${money(totals.total)} ${currency}`}
                strong
              />
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-sm text-gray-700">Payment due later</span>
                <button
                  type="button"
                  onClick={() => patch({ paymentDueLater: !draft.paymentDueLater })}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors cursor-pointer ${draft.paymentDueLater
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {draft.paymentDueLater ? "Yes" : "No"}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-sm text-gray-700">
                  Paid by customer via {formatPaymentMethod(draft.paymentMethod)}
                </span>
                <div className="flex items-center gap-2">
                  <PaymentStatusPill value={draft.paymentStatus} />
                  {/* {draft.paymentStatus !== "paid" && (
                    <button
                      type="button"
                      onClick={() => patch({ paymentStatus: "paid" })}
                      className={`text-sm font-medium cursor-pointer ${LINK}`}
                    >
                      Mark as paid
                    </button>
                  )} */}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex flex-wrap items-center gap-4">
                {raw.paymentId && (
                  <span className="text-xs text-gray-500">
                    Payment ID:{" "}
                    <span className="text-gray-700">{raw.paymentId}</span>
                  </span>
                )}
                {raw.invoiceSentAt && (
                  <span className="text-xs text-gray-500">
                    Invoice sent to {raw.invoiceSentTo} {formatWhen(raw.invoiceSentAt)}
                  </span>
                )}
                {raw.invoice && (
                  <a
                    href={raw.invoice}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1 text-xs font-medium ${LINK}`}
                  >
                    <FileText size={13} />
                    View invoice
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModal("invoice")}
                className="text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Send invoice
              </button>
            </div>
          </Card>

          {/* Fulfillment */}
          <Card title="Fulfillment" icon={Truck} bodyClass="p-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Order status
                </span>
                <select
                  value={draft.orderStatus}
                  onChange={(e) => patch({ orderStatus: e.target.value })}
                  className={`${inputClass} bg-white`}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatOrderStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Payment status
                </span>
                <select
                  value={draft.paymentStatus}
                  onChange={(e) => patch({ paymentStatus: e.target.value })}
                  className={`${inputClass} bg-white capitalize`}
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Payment method
                </span>
                <select
                  value={draft.paymentMethod}
                  onChange={(e) => patch({ paymentMethod: e.target.value })}
                  className={`${inputClass} bg-white`}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {formatPaymentMethod(method)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Tracking number
                </span>
                <input
                  value={draft.tracking.trackingNumber}
                  onChange={(e) =>
                    patch({
                      tracking: {
                        ...draft.tracking,
                        trackingNumber: e.target.value,
                      },
                    })
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Carrier
                </span>
                <input
                  value={draft.tracking.partner}
                  onChange={(e) =>
                    patch({
                      tracking: { ...draft.tracking, partner: e.target.value },
                    })
                  }
                  placeholder="Delhivery, Blue Dart…"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-600 mb-1">
                  Tracking link
                </span>
                <input
                  value={draft.tracking.url}
                  onChange={(e) =>
                    patch({ tracking: { ...draft.tracking, url: e.target.value } })
                  }
                  placeholder="https://"
                  className={inputClass}
                />
              </label>
            </div>
            {raw.tracking?.url && (
              <a
                href={raw.tracking.url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1 mt-3 text-sm font-medium ${LINK}`}
              >
                Track shipment
                <ExternalLink size={13} />
              </a>
            )}
          </Card>

          {/* Timeline */}
          <TimelineCard
            groups={timeline}
            initial={adminInitial}
            posting={posting}
            onPost={handlePostComment}
            onDelete={handleDeleteComment}
          />
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <NotesCard
            value={raw.notes || ""}
            onSave={handleSaveNotes}
            saving={savingNotes}
          />

          {/* Customer */}
          <Card
            title="Customer"
            bodyClass="px-4 pb-4 pt-1"
            action={
              <DropdownMenu
                trigger={
                  <button className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">
                    <MoreHorizontal size={16} />
                  </button>
                }
                items={[
                  {
                    label: "Edit shipping address",
                    onClick: () => setModal("shipping-address"),
                  },
                  {
                    label: "Edit billing address",
                    onClick: () => setModal("billing-address"),
                  },
                  {
                    label: billing.sameAsShipping
                      ? "Use a separate billing address"
                      : "Same as shipping address",
                    onClick: () =>
                      patch({
                        billingAddress: {
                          ...billing,
                          sameAsShipping: !billing.sameAsShipping,
                        },
                      }),
                  },
                  {
                    label: "Copy email",
                    hidden: !customerEmail,
                    onClick: () => copy(customerEmail, "Email"),
                  },
                  {
                    label: "View all customers",
                    onClick: () => router.push("/customers"),
                  },
                ]}
              />
            }
          >
            <p className="text-sm font-medium text-gray-900">{customerName}</p>
            {customerOrders > 0 && (
              <button
                type="button"
                onClick={() => router.push("/orders")}
                className={`text-sm cursor-pointer ${LINK}`}
              >
                {customerOrders} {customerOrders === 1 ? "order" : "orders"}
              </button>
            )}

            <p className="mt-4 text-xs font-semibold text-gray-900">
              Contact information
            </p>
            {customerEmail ? (
              <a
                href={`mailto:${customerEmail}`}
                className={`block text-sm break-all ${LINK}`}
              >
                {customerEmail}
              </a>
            ) : (
              <p className="text-sm text-gray-400">No email address</p>
            )}
            <p className="text-sm text-gray-700">
              {customerPhone || "No phone number"}
            </p>

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-900">
                Shipping address
              </p>
              <IconButton
                label="Edit shipping address"
                onClick={() => setModal("shipping-address")}
              >
                <Pencil size={13} />
              </IconButton>
            </div>
            {addressLines.length ? (
              <address className="not-italic text-sm text-gray-700 leading-relaxed">
                {address.fullname && <div>{address.fullname}</div>}
                {addressLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                {address.phone && (
                  <div className="text-gray-500">{address.phone}</div>
                )}
              </address>
            ) : (
              <p className="text-sm text-gray-400">No address on file</p>
            )}
            {addressLines.length > 0 && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1 mt-1 text-sm ${LINK}`}
              >
                <MapPin size={12} />
                View map
              </a>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-900">
                Billing address
              </p>
              <IconButton
                label="Edit billing address"
                onClick={() => setModal("billing-address")}
              >
                <Pencil size={13} />
              </IconButton>
            </div>
            {billing.sameAsShipping ? (
              <p className="text-sm text-gray-500">Same as shipping address</p>
            ) : (
              <address className="not-italic text-sm text-gray-700 leading-relaxed">
                {billing.fullname && <div>{billing.fullname}</div>}
                {[
                  billing.line1,
                  billing.line2,
                  [billing.city, billing.state, billing.pincode]
                    .filter(Boolean)
                    .join(" "),
                  billing.country,
                ]
                  .filter(Boolean)
                  .map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
              </address>
            )}
          </Card>

          {/* Markets and currency */}
          <Card
            title="Markets"
            bodyClass="px-4 pb-4 pt-1"
            action={
              <IconButton
                label="Edit market and currency"
                onClick={() => setModal("currency")}
              >
                <Pencil size={14} />
              </IconButton>
            }
          >
            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium px-2.5 py-1 rounded-lg">
              <Globe size={13} className="text-gray-500" />
              {draft.market || "Not set"}
            </span>

            <p className="mt-4 text-xs font-semibold text-gray-900">Currency</p>
            <button
              type="button"
              onClick={() => setModal("currency")}
              className="mt-1 w-full flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {currency}
              {draft.currency.displayCode && (
                <span className="text-xs text-gray-500">
                  shown with {draft.currency.displayCode}
                </span>
              )}
              <ChevronDown size={14} className="text-gray-400" />
            </button>
          </Card>

          {/* Tags */}
          <TagsCard tags={draft.tags} onChange={(tags) => patch({ tags })} />

          {/* Additional details */}
          <Card title="Additional details" bodyClass="px-4 pb-4 pt-1">
            <Row label="Order ID" value={order._id} />
            <Row label="Placed" value={formatDate(order.createdAt)} />
            <Row
              label="Payment method"
              value={formatPaymentMethod(draft.paymentMethod)}
            />
            {raw.couponCode && <Row label="Coupon" value={raw.couponCode} />}
            {draft.manualDiscount?.reason && (
              <Row label="Discount reason" value={draft.manualDiscount.reason} />
            )}
            {raw.deliveredAt && (
              <Row label="Delivered" value={formatDate(raw.deliveredAt)} />
            )}
            {raw.cancelledAt && (
              <Row label="Cancelled" value={formatDate(raw.cancelledAt)} />
            )}
            {raw.returnRequest?.requested && (
              <Row
                label="Return"
                value={`${raw.returnRequest.status || "pending"}${raw.returnRequest.reason ? ` · ${raw.returnRequest.reason}` : ""
                  }`}
              />
            )}
          </Card>
        </div>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      {modal === "product" && (
        <AddProductModal
          router={router}
          currency={currency}
          onClose={() => setModal(null)}
          onConfirm={addLines}
        />
      )}

      {modal === "custom" && (
        <CustomItemModal
          currency={currency}
          onClose={() => setModal(null)}
          onConfirm={addCustomLine}
        />
      )}

      {modal === "discount" && (
        <DiscountModal
          value={draft.manualDiscount}
          subtotal={totals.subtotal - totals.coupon}
          currency={currency}
          onClose={() => setModal(null)}
          onConfirm={(manualDiscount) => {
            patch({ manualDiscount });
            setModal(null);
          }}
        />
      )}

      {modal === "shipping" && (
        <ShippingModal
          label={draft.shippingLabel}
          amount={draft.deliveryCharge}
          currency={currency}
          onClose={() => setModal(null)}
          onConfirm={({ label, amount }) => {
            patch({ shippingLabel: label, deliveryCharge: amount });
            setModal(null);
          }}
        />
      )}

      {modal === "tax" && (
        <TaxModal
          rate={draft.taxRate}
          amount={draft.tax}
          included={draft.taxIncluded}
          currency={currency}
          onClose={() => setModal(null)}
          onConfirm={(changes) => {
            patch(changes);
            setModal(null);
          }}
        />
      )}

      {modal === "shipping-address" && (
        <AddressModal
          title="Edit shipping address"
          address={draft.address}
          onClose={() => setModal(null)}
          onConfirm={(next) => {
            patch({ address: next });
            setModal(null);
          }}
        />
      )}

      {modal === "billing-address" && (
        <AddressModal
          title="Edit billing address"
          address={
            billing.sameAsShipping ? { ...draft.address } : draft.billingAddress
          }
          onClose={() => setModal(null)}
          onConfirm={(next) => {
            patch({ billingAddress: { ...next, sameAsShipping: false } });
            setModal(null);
          }}
        />
      )}

      {modal === "currency" && (
        <CurrencyModal
          market={draft.market}
          currency={draft.currency}
          onClose={() => setModal(null)}
          onConfirm={(changes) => {
            patch(changes);
            setModal(null);
          }}
        />
      )}

      {modal === "invoice" && (
        <SendInvoiceModal
          email={customerEmail}
          orderNumber={order.orderNumber}
          needsShipping={!draft.shippingLabel && draft.deliveryCharge <= 0}
          busy={sending}
          onClose={() => setModal(null)}
          onAddShipping={() => setModal("shipping")}
          onConfirm={handleSendInvoice}
        />
      )}

      {/* Blocks the page whenever the draft holds edits. Never stacked on
          top of another dialog, which would trap the one underneath. */}
      {isDirty && !modal && !confirm && (
        <UnsavedChangesDialog
          saving={saving}
          blocked={items.length === 0}
          onDiscard={handleDiscard}
          onSave={handleSave}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          tone={confirm.tone}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
        />
      )}
    </div>
  );
}

export default isAuth(OrderDetail);
