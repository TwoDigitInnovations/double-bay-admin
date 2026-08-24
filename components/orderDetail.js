import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CircleAlert,
  Lock,
  Package,
  Search,
  Tag,
  TicketPercent,
  TriangleAlert,
  X,
} from "lucide-react";
import { searchProducts } from "@/redux/actions/productActions";
import { formatMoney } from "@/lib/orderMapper";

// Building blocks and edit dialogs for the order detail page.

export const inputClass =
  "w-full rounded-lg border border-gray-300 text-sm px-3 py-2 outline-none text-gray-800 placeholder-gray-400 focus:border-gray-900";

export function Card({ title, icon: Icon, action, children, bodyClass = "p-4" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {title && (
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            {Icon && <Icon size={15} className="text-gray-500" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  width = "max-w-lg",
  headerClass = "",
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${width} flex flex-col max-h-[85vh]`}
      >
        <div
          className={`flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 ${headerClass}`}
        >
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalFooter({ onCancel, onConfirm, confirmLabel = "Done", busy, disabled }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy || disabled}
        className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
      >
        {busy ? "Working…" : confirmLabel}
      </button>
    </>
  );
}

/** Click-outside dropdown used by the header and card overflow menus. */
export function DropdownMenu({ trigger, items, align = "right", width = "w-56" }) {
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
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 ${width} z-50 py-1`}
        >
          {items
            .filter((item) => !item.hidden)
            .map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  item.tone === "danger" ? "text-red-600" : "text-gray-700"
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

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  tone = "danger",
  busy,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width="max-w-md"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-40 ${
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
    </Modal>
  );
}

/** Browse the catalogue and drop products onto the order. */
export function AddProductModal({ onClose, onConfirm, router, currency = "USD" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  // Keyed by id so a product stays picked when the search results change.
  const [picked, setPicked] = useState(() => new Map());

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(
      async () => {
        const list = await searchProducts({ search: query, limit: 50 }, router);
        if (!active) return;
        setResults(list);
        setLoading(false);
      },
      query ? 300 : 0,
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, router]);

  const toggle = (product) =>
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(product._id)) next.delete(product._id);
      else next.set(product._id, { product, quantity: 1 });
      return next;
    });

  const setQuantity = (id, value) =>
    setPicked((prev) => {
      const next = new Map(prev);
      const entry = next.get(id);
      if (entry) next.set(id, { ...entry, quantity: Math.max(1, value || 1) });
      return next;
    });

  const confirm = () =>
    onConfirm(
      [...picked.values()].map(({ product, quantity }) => ({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        sku: product.sku || "",
        price: Number(product.finalPrice ?? product.price ?? 0),
        quantity,
      })),
    );

  return (
    <Modal
      title="Add products"
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-gray-500">
            {picked.size} selected
          </span>
          <ModalFooter
            onCancel={onClose}
            onConfirm={confirm}
            confirmLabel="Add"
            disabled={picked.size === 0}
          />
        </>
      }
    >
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 mb-3">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products by name, SKU or brand"
          className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 min-w-0"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag size={28} className="text-gray-300 mb-2" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">
            {query ? `No products match "${query}".` : "No products available."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {results.map((product) => {
            const entry = picked.get(product._id);
            return (
              <div key={product._id} className="flex items-center gap-3 py-2.5">
                <input
                  type="checkbox"
                  checked={!!entry}
                  onChange={() => toggle(product)}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900 shrink-0"
                />
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 grid place-items-center shrink-0">
                    <Package size={14} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {[product.sku, `${product.stock ?? 0} in stock`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {entry && (
                  <input
                    type="number"
                    min={1}
                    value={entry.quantity}
                    onChange={(e) =>
                      setQuantity(product._id, parseInt(e.target.value, 10))
                    }
                    className="w-16 h-8 rounded-lg border border-gray-300 text-sm text-center text-gray-800 outline-none shrink-0"
                  />
                )}
                <span className="text-sm text-gray-600 shrink-0 w-20 text-right">
                  {formatMoney(product.finalPrice ?? product.price, currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

/** A one-off line that isn't in the catalogue — a fee, a sample, a service. */
export function CustomItemModal({ onClose, onConfirm, currency = "USD" }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [taxable, setTaxable] = useState(true);
  const [requiresShipping, setRequiresShipping] = useState(true);

  const submit = () => {
    if (!name.trim()) return;
    onConfirm({
      custom: true,
      name: name.trim(),
      price: Number(price) || 0,
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      taxable,
      requiresShipping,
    });
  };

  return (
    <Modal
      title="Add custom item"
      onClose={onClose}
      width="max-w-md"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={submit}
          confirmLabel="Add item"
          disabled={!name.trim()}
        />
      }
    >
      <div className="space-y-3">
        <Field label="Item name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Consultation fee"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Price (${currency})`}>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={taxable}
            onChange={(e) => setTaxable(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-gray-900"
          />
          Charge tax on this item
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={requiresShipping}
            onChange={(e) => setRequiresShipping(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-gray-900"
          />
          This is a physical product
        </label>
      </div>
    </Modal>
  );
}

/** Order-level discount: a percentage or a fixed amount off. */
export function DiscountModal({ value, subtotal = 0, currency = "USD", onClose, onConfirm }) {
  const [type, setType] = useState(value?.type || "flat");
  const [amount, setAmount] = useState(value?.value ?? "");
  const [title, setTitle] = useState(value?.title || "");
  const [reason, setReason] = useState(value?.reason || "");

  const preview = useMemo(() => {
    const raw = Number(amount) || 0;
    if (raw <= 0) return 0;
    const off = type === "percentage" ? (subtotal * raw) / 100 : raw;
    return Math.min(Math.max(off, 0), subtotal);
  }, [amount, type, subtotal]);

  return (
    <Modal
      title="Add discount"
      onClose={onClose}
      width="max-w-md"
      footer={
        <>
          {value && (
            <button
              type="button"
              onClick={() => onConfirm(null)}
              className="mr-auto text-sm font-medium text-red-600 hover:underline"
            >
              Remove discount
            </button>
          )}
          <ModalFooter
            onCancel={onClose}
            onConfirm={() =>
              onConfirm({
                title: title.trim() || "Discount",
                type,
                value: Number(amount) || 0,
                reason: reason.trim(),
              })
            }
            confirmLabel="Apply"
            disabled={!(Number(amount) > 0)}
          />
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "percentage", label: "Percentage" },
            { key: "flat", label: "Fixed amount" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setType(option.key)}
              className={`text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
                type === option.key
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Field label={type === "percentage" ? "Percentage off" : `Amount off (${currency})`}>
          <input
            autoFocus
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={type === "percentage" ? "10" : "0.00"}
            className={inputClass}
          />
        </Field>
        <Field label="Discount name" hint="Shown to the customer on the invoice.">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Discount"
            className={inputClass}
          />
        </Field>
        <Field label="Reason" hint="Staff only.">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Goodwill, price match, damaged packaging…"
            className={inputClass}
          />
        </Field>
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-gray-600">Comes off the order</span>
          <span className="text-sm font-semibold text-gray-900">
            -{formatMoney(preview, currency)}
          </span>
        </div>
      </div>
    </Modal>
  );
}

const SHIPPING_PRESETS = [
  { label: "Free shipping", amount: 0 },
  { label: "Standard shipping", amount: 5 },
  { label: "Express shipping", amount: 15 },
  { label: "Local pickup", amount: 0 },
];

/** Shipping or delivery line on the payment summary. */
export function ShippingModal({ label, amount, currency = "USD", onClose, onConfirm }) {
  const [name, setName] = useState(label || "");
  const [value, setValue] = useState(amount ?? "");

  return (
    <Modal
      title="Add shipping or delivery"
      onClose={onClose}
      width="max-w-md"
      footer={
        <>
          {(label || Number(amount) > 0) && (
            <button
              type="button"
              onClick={() => onConfirm({ label: "", amount: 0 })}
              className="mr-auto text-sm font-medium text-red-600 hover:underline"
            >
              Remove shipping
            </button>
          )}
          <ModalFooter
            onCancel={onClose}
            onConfirm={() =>
              onConfirm({ label: name.trim(), amount: Number(value) || 0 })
            }
            confirmLabel="Apply"
          />
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SHIPPING_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setName(preset.label);
                setValue(preset.amount);
              }}
              className="text-xs font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-full transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Field label="Delivery method">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Standard shipping"
            className={inputClass}
          />
        </Field>
        <Field label={`Shipping charge (${currency})`}>
          <input
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </Field>
      </div>
    </Modal>
  );
}

/** Tax on the order — a rate, a flat amount, or none at all. */
export function TaxModal({ rate, amount, included, currency = "USD", onClose, onConfirm }) {
  const [mode, setMode] = useState(
    Number(rate) > 0 ? "rate" : Number(amount) > 0 ? "manual" : "none",
  );
  const [taxRate, setTaxRate] = useState(rate || "");
  const [taxAmount, setTaxAmount] = useState(amount || "");
  const [taxIncluded, setTaxIncluded] = useState(!!included);

  const submit = () => {
    if (mode === "none") {
      onConfirm({ taxRate: 0, tax: 0, taxIncluded: false });
      return;
    }
    if (mode === "rate") {
      onConfirm({
        taxRate: Number(taxRate) || 0,
        taxIncluded,
      });
      return;
    }
    onConfirm({ taxRate: 0, tax: Number(taxAmount) || 0, taxIncluded });
  };

  return (
    <Modal
      title="Estimated tax"
      onClose={onClose}
      width="max-w-md"
      footer={
        <ModalFooter onCancel={onClose} onConfirm={submit} confirmLabel="Apply" />
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "none", label: "No tax" },
            { key: "rate", label: "Tax rate" },
            { key: "manual", label: "Fixed amount" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMode(option.key)}
              className={`text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
                mode === option.key
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {mode === "rate" && (
          <Field label="Tax rate (%)" hint="Applied to the discounted subtotal.">
            <input
              autoFocus
              type="number"
              min={0}
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="10"
              className={inputClass}
            />
          </Field>
        )}

        {mode === "manual" && (
          <Field label={`Tax amount (${currency})`}>
            <input
              autoFocus
              type="number"
              min={0}
              step="0.01"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </Field>
        )}

        {mode !== "none" && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={taxIncluded}
              onChange={(e) => setTaxIncluded(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-gray-900"
            />
            Item prices already include tax
          </label>
        )}
      </div>
    </Modal>
  );
}

const ADDRESS_FIELDS = [
  { key: "fullname", label: "Full name", span: 2 },
  { key: "phone", label: "Phone", span: 2 },
  { key: "line1", label: "Address", span: 2 },
  { key: "line2", label: "Apartment, suite, etc.", span: 2 },
  { key: "city", label: "City" },
  { key: "state", label: "State / region" },
  { key: "pincode", label: "Postcode" },
  { key: "country", label: "Country" },
];

/** Edit the shipping or billing address snapshot held on the order. */
export function AddressModal({ title, address, onClose, onConfirm }) {
  const [draft, setDraft] = useState(() => ({ ...(address || {}) }));

  const set = (key) => (e) =>
    setDraft((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={() => onConfirm(draft)}
          confirmLabel="Save address"
        />
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {ADDRESS_FIELDS.map((field) => (
          <div
            key={field.key}
            className={field.span === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}
          >
            <Field label={field.label}>
              <input
                value={draft[field.key] || ""}
                onChange={set(field.key)}
                className={inputClass}
              />
            </Field>
          </div>
        ))}
      </div>
    </Modal>
  );
}

const CURRENCIES = ["USD", "AUD", "INR", "EUR", "GBP", "CAD", "NZD", "SGD", "AED"];

/** Market and currency the order settles in. */
export function CurrencyModal({ market, currency, onClose, onConfirm }) {
  const [draftMarket, setDraftMarket] = useState(market || "");
  const [code, setCode] = useState(currency?.code || "USD");
  const [displayCode, setDisplayCode] = useState(currency?.displayCode || "");
  const [rate, setRate] = useState(currency?.rate ?? 1);

  return (
    <Modal
      title="Market and currency"
      onClose={onClose}
      width="max-w-md"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={() =>
            onConfirm({
              market: draftMarket.trim(),
              currency: {
                code,
                displayCode: displayCode || "",
                rate: Number(rate) || 1,
              },
            })
          }
          confirmLabel="Save"
        />
      }
    >
      <div className="space-y-3">
        <Field label="Market">
          <input
            value={draftMarket}
            onChange={(e) => setDraftMarket(e.target.value)}
            placeholder="United States"
            className={inputClass}
          />
        </Field>
        <Field label="Order currency">
          <select
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputClass} bg-white`}
          >
            {CURRENCIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Also show total in"
          hint="Optional second currency shown next to the order total."
        >
          <select
            value={displayCode}
            onChange={(e) => setDisplayCode(e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">None</option>
            {CURRENCIES.filter((option) => option !== code).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        {displayCode && (
          <Field label={`Conversion rate (1 ${code} = ? ${displayCode})`}>
            <input
              type="number"
              min={0}
              step="0.0001"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}
      </div>
    </Modal>
  );
}

/**
 * Sender identities the invoice can go out as. Postmark only delivers from a
 * verified signature, so this reflects the store's configured sender and is
 * shown for confirmation — the backend sets the real From header.
 */
const INVOICE_SENDERS = [
  '"Double Bay Cosmeceuticals" <info@doublebaycosmeceuticals.com>',
];

const invoiceCancelClass =
  "text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 px-4 py-2 rounded-lg transition-colors cursor-pointer";

const invoicePrimaryClass =
  "bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer";

/** Pill switch used by the invoice option rows. */
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function InvoiceOption({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

/** One labelled line of the read-only review step. */
function ReviewRow({ label, value }) {
  return (
    <div className="flex gap-3 px-4 py-2.5 text-sm">
      <span className="w-20 shrink-0 text-gray-500">{label}</span>
      <span className="flex-1 text-gray-900 break-words whitespace-pre-wrap">
        {value}
      </span>
    </div>
  );
}

/**
 * Email the customer an invoice for the order. The message is composed first,
 * then shown back as a read-only review so nothing goes out unseen.
 */
export function SendInvoiceModal({
  email,
  orderNumber,
  needsShipping,
  busy,
  onClose,
  onAddShipping,
  onConfirm,
}) {
  const [step, setStep] = useState("compose");
  const [to, setTo] = useState(email || "");
  const [from, setFrom] = useState(INVOICE_SENDERS[0]);
  const [showCopies, setShowCopies] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("Invoice {{name}}");
  const [message, setMessage] = useState("");
  const [lockPrices, setLockPrices] = useState(true);
  const [allowDiscountCodes, setAllowDiscountCodes] = useState(false);

  // {{name}} stands in for the order this invoice belongs to.
  const resolvedSubject = subject
    .replace(/\{\{\s*name\s*\}\}/g, orderNumber || "")
    .trim();

  const send = () =>
    onConfirm({
      email: to.trim(),
      cc: cc.trim(),
      bcc: bcc.trim(),
      subject: resolvedSubject,
      message: message.trim(),
      lockPrices,
      allowDiscountCodes,
    });

  const compose = (
    <div className="space-y-4">
      {needsShipping && (
        <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              Before the customer can complete checkout, these changes need to
              be made:
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>
                There are no shipping and delivery options for the
                customer&apos;s address.{" "}
                {onAddShipping ? (
                  <button
                    type="button"
                    onClick={onAddShipping}
                    className="font-medium underline underline-offset-2 hover:no-underline cursor-pointer"
                  >
                    Add custom shipping
                  </button>
                ) : (
                  "Add custom shipping"
                )}
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="To">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="customer@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="From">
          <div className="relative">
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={`${inputClass} appearance-none pr-9 cursor-pointer`}
            >
              {INVOICE_SENDERS.map((sender) => (
                <option key={sender} value={sender}>
                  {sender}
                </option>
              ))}
            </select>
            <ChevronsUpDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </Field>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowCopies((v) => !v)}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
        >
          Cc and Bcc recipients
          {showCopies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showCopies && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Cc" hint="Separate addresses with commas.">
              <input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className={inputClass}
              />
            </Field>
            <Field label="Bcc" hint="Separate addresses with commas.">
              <input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </div>

      <Field label="Subject">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Custom message (optional)">
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
        <InvoiceOption
          icon={Lock}
          title="Product prices"
          description="Lock all product prices so they don't change"
          checked={lockPrices}
          onChange={setLockPrices}
        />
        <InvoiceOption
          icon={TicketPercent}
          title="Discount codes"
          description="Allow your customer to enter discount codes"
          checked={allowDiscountCodes}
          onChange={setAllowDiscountCodes}
        />
      </div>
    </div>
  );

  const review = (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        This is what will be emailed. Go back to change anything.
      </p>
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
        <ReviewRow label="To" value={to.trim()} />
        {!!cc.trim() && <ReviewRow label="Cc" value={cc.trim()} />}
        {!!bcc.trim() && <ReviewRow label="Bcc" value={bcc.trim()} />}
        <ReviewRow label="From" value={from} />
        <ReviewRow
          label="Subject"
          value={resolvedSubject || `Invoice ${orderNumber || ""}`.trim()}
        />
        <ReviewRow
          label="Message"
          value={message.trim() || "Here is the invoice for your order."}
        />
      </div>
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
        <ReviewRow label="Prices" value={lockPrices ? "Locked" : "Not locked"} />
        <ReviewRow
          label="Discounts"
          value={
            allowDiscountCodes
              ? "Customer can enter discount codes"
              : "Discount codes not allowed"
          }
        />
      </div>
    </div>
  );

  const footer =
    step === "compose" ? (
      <>
        <button type="button" onClick={onClose} className={invoiceCancelClass}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setStep("review")}
          disabled={!to.trim()}
          className={invoicePrimaryClass}
        >
          Review invoice
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={() => setStep("compose")}
          disabled={busy}
          className={invoiceCancelClass}
        >
          Back
        </button>
        <button
          type="button"
          onClick={send}
          disabled={busy || !to.trim()}
          className={invoicePrimaryClass}
        >
          {busy ? "Sending…" : "Send invoice"}
        </button>
      </>
    );

  return (
    <Modal
      title="Send invoice"
      onClose={onClose}
      width="max-w-2xl"
      headerClass="bg-gray-50 rounded-t-2xl"
      footer={footer}
    >
      {step === "compose" ? compose : review}
    </Modal>
  );
}

/**
 * Save bar that sits at the foot of the page while the order draft holds
 * unsaved edits. It scrolls with the page rather than floating over it, so it
 * never covers the timeline, and it is non-blocking: the page stays
 * interactive so several changes can be batched and then applied — or
 * dropped — in one go.
 */
export function UnsavedChangesBar({ saving, blocked, onDiscard, onSave }) {
  return (
    <div className="mt-5">
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <CircleAlert size={16} className="text-amber-500 shrink-0" />
            Unsaved changes
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || blocked}
              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {blocked && (
          <p className="mx-4 mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
            An order needs at least one product before it can be saved. Discard
            to bring the removed products back.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Asked only when the user tries to leave the page while the draft still holds
 * edits — the point at which the changes would otherwise be lost silently.
 */
export function UnsavedChangesDialog({
  saving,
  blocked,
  onStay,
  onDiscard,
  onSave,
}) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onStay} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <CircleAlert size={16} className="text-amber-500 shrink-0" />
            Leave with unsaved changes?
          </h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            This order has edits that haven&apos;t been saved yet. Save them to
            apply the changes before leaving, or leave to go back to the last
            saved version of the order.
          </p>
          {blocked && (
            <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              An order needs at least one product before it can be saved. Leave
              without saving to bring the removed products back.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Leave without saving
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || blocked}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {saving ? "Saving…" : "Save and leave"}
          </button>
        </div>

        <button
          type="button"
          onClick={onStay}
          disabled={saving}
          className="absolute right-2 top-1 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 px-3 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4" />
        </button>
      </div>
    </div>
  );
}
