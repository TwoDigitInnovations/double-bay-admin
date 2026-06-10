import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import {
  ChevronRight,
  Tag,
  ShoppingCart,
  Truck,
  Search,
  Plus,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import {
  createDiscount,
  updateDiscountById,
  fetchDiscountById,
} from "@/redux/actions/discountActions";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META = {
  amount_off_products: {
    label: "Amount off products",
    sub: "Product discount",
    icon: Tag,
  },
  buy_x_get_y: { label: "Buy X get Y", sub: "Product discount", icon: Tag },
  amount_off_order: {
    label: "Amount off order",
    sub: "Order discount",
    icon: ShoppingCart,
  },
  free_shipping: {
    label: "Free shipping",
    sub: "Shipping discount",
    icon: Truck,
  },
};

function randomCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function nowTimeStr() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toISO(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    const [time, meridiem] = timeStr?.split(" ") || ["12:00", "AM"];
    let [h, m] = (time || "12:00").split(":").map(Number);
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    const d = new Date(dateStr);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  } catch {
    return new Date(dateStr).toISOString();
  }
}

// ── Shared UI atoms ────────────────────────────────────────────────────────────

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-gray-900 mb-4">{children}</h2>
  );
}

function Label({ children, className = "" }) {
  return (
    <p className={`text-xs font-medium text-gray-700 mb-1 ${className}`}>
      {children}
    </p>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-300 ${className}`}
      {...props}
    />
  );
}

function Select({ children, className = "", ...props }) {
  return (
    <select
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-300 bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Radio({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-gray-900 cursor-pointer"
      />
      <span className="text-sm text-gray-800">{children}</span>
    </label>
  );
}

function Checkbox({ checked, onChange, children }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
      />
      <span className="text-sm text-gray-800">{children}</span>
    </label>
  );
}

function SearchBrowse({ placeholder }) {
  return (
    <div className="flex gap-2 mt-2">
      <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
        <Search size={13} className="text-gray-400 shrink-0" />
        <input
          placeholder={placeholder}
          className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
        />
      </div>
      <button className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
        Browse
      </button>
    </div>
  );
}

// ── Section: Method ───────────────────────────────────────────────────────────

function MethodSection({ type, form, set }) {
  const meta = TYPE_META[type];
  return (
    <Card>
      <SectionTitle>{meta.label}</SectionTitle>
      <Label>Method</Label>
      <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit mb-4">
        {["discount_code", "automatic"].map((m) => (
          <button
            key={m}
            onClick={() => set("method", m)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              form.method === m
                ? "bg-gray-200 text-gray-900"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {m === "discount_code" ? "Discount code" : "Automatic discount"}
          </button>
        ))}
      </div>

      {form.method === "discount_code" ? (
        <>
          <div className="flex items-center justify-between mb-1">
            <Label className="mb-0">Discount code</Label>
            <button
              onClick={() => set("code", randomCode())}
              className="text-xs text-blue-600 hover:underline"
            >
              Generate random code
            </button>
          </div>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder=""
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Customers must enter this code at checkout.
          </p>
        </>
      ) : (
        <>
          <Label>Title</Label>
          <Input
            value={form.autoTitle}
            onChange={(e) => set("autoTitle", e.target.value)}
            placeholder="e.g. Summer Sale"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Customers will see this in their cart and at checkout.
          </p>
        </>
      )}
    </Card>
  );
}

// ── Section: Discount value (amount_off_products, amount_off_order) ───────────

function DiscountValueSection({ form, set }) {
  const isPercent = form.discountValueType === "percentage";
  return (
    <Card>
      <SectionTitle>Discount value</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Select
          value={form.discountValueType}
          onChange={(e) => set("discountValueType", e.target.value)}
        >
          <option value="percentage">Percentage</option>
          <option value="flat">Fixed amount</option>
        </Select>
        <div className="relative">
          <Input
            type="number"
            min="0"
            value={form.discountValue}
            onChange={(e) => set("discountValue", e.target.value)}
            className="pr-7"
            placeholder="0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {isPercent ? "%" : "₹"}
          </span>
        </div>
      </div>
      {isPercent && (
        <>
          <Label>Maximum discount amount (₹)</Label>
          <Input
            type="number"
            min="0"
            placeholder="No limit"
            value={form.maxDiscountAmount}
            onChange={(e) => set("maxDiscountAmount", e.target.value)}
          />
        </>
      )}
    </Card>
  );
}

// ── Section: Applies to (amount_off_products) ─────────────────────────────────

function AppliesToSection({ form, set }) {
  return (
    <Card>
      <div className="mb-4">
        <Label>Applies to</Label>
        <Select
          value={form.appliesTo}
          onChange={(e) => set("appliesTo", e.target.value)}
        >
          <option value="all_products">All products</option>
          <option value="specific_collections">Specific collections</option>
          <option value="specific_products">Specific products</option>
        </Select>
      </div>
      {form.appliesTo === "specific_collections" && (
        <SearchBrowse placeholder="Search collections" />
      )}
      {form.appliesTo === "specific_products" && (
        <SearchBrowse placeholder="Search products" />
      )}
    </Card>
  );
}

// ── Section: Buy X Get Y ──────────────────────────────────────────────────────

function BuyXGetYSection({ form, set }) {
  return (
    <>
      {/* Customer buys */}
      <Card>
        <SectionTitle>Customer buys</SectionTitle>
        <div className="flex flex-col gap-2 mb-4">
          <Radio
            checked={form.buyType === "min_qty"}
            onChange={() => set("buyType", "min_qty")}
          >
            Minimum quantity of items
          </Radio>
          <Radio
            checked={form.buyType === "min_amount"}
            onChange={() => set("buyType", "min_amount")}
          >
            Minimum purchase amount
          </Radio>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <Label>
              {form.buyType === "min_qty" ? "Quantity" : "Amount (₹)"}
            </Label>
            <Input
              type="number"
              min="1"
              value={form.buyType === "min_qty" ? form.buyQty : form.buyAmount}
              onChange={(e) =>
                set(
                  form.buyType === "min_qty" ? "buyQty" : "buyAmount",
                  e.target.value,
                )
              }
            />
          </div>
          <div className="col-span-2">
            <Label>Any items from</Label>
            <Select
              value={form.buyFrom}
              onChange={(e) => set("buyFrom", e.target.value)}
            >
              <option value="specific_products">Specific products</option>
              <option value="specific_collections">Specific collections</option>
            </Select>
          </div>
        </div>
        <SearchBrowse
          placeholder={
            form.buyFrom === "specific_products"
              ? "Search products"
              : "Search collections"
          }
        />
      </Card>

      {/* Customer gets */}
      <Card>
        <SectionTitle>Customer gets</SectionTitle>
        <p className="text-xs text-gray-500 mb-4">
          Customers must add the quantity of items specified below to their
          cart.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={form.getQty}
              onChange={(e) => set("getQty", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label>Any items from</Label>
            <Select
              value={form.getFrom}
              onChange={(e) => set("getFrom", e.target.value)}
            >
              <option value="specific_products">Specific products</option>
              <option value="specific_collections">Specific collections</option>
            </Select>
          </div>
        </div>
        <SearchBrowse
          placeholder={
            form.getFrom === "specific_products"
              ? "Search products"
              : "Search collections"
          }
        />

        <p className="text-sm font-semibold text-gray-900 mt-5 mb-3">
          At a discounted value
        </p>
        <div className="flex flex-col gap-2 mb-3">
          <Radio
            checked={form.getDiscountType === "percentage"}
            onChange={() => set("getDiscountType", "percentage")}
          >
            Percentage
          </Radio>
          {form.getDiscountType === "percentage" && (
            <div className="ml-6 relative w-36">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.getDiscountValue}
                onChange={(e) => set("getDiscountValue", e.target.value)}
                className="pr-7"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                %
              </span>
            </div>
          )}
          <Radio
            checked={form.getDiscountType === "amount_off"}
            onChange={() => set("getDiscountType", "amount_off")}
          >
            Amount off each
          </Radio>
          {form.getDiscountType === "amount_off" && (
            <div className="ml-6 relative w-36">
              <Input
                type="number"
                min="0"
                value={form.getDiscountValue}
                onChange={(e) => set("getDiscountValue", e.target.value)}
                className="pl-6"
                placeholder="0"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                ₹
              </span>
            </div>
          )}
          <Radio
            checked={form.getDiscountType === "free"}
            onChange={() => {
              set("getDiscountType", "free");
              set("getDiscountValue", "100");
            }}
          >
            Free
          </Radio>
        </div>
        <Checkbox
          checked={form.maxUsesPerOrder}
          onChange={(e) => set("maxUsesPerOrder", e.target.checked)}
        >
          Set a maximum number of uses per order
        </Checkbox>
        {form.maxUsesPerOrder && (
          <Input
            type="number"
            min="1"
            className="mt-2 w-32"
            value={form.maxUsesPerOrderValue}
            onChange={(e) => set("maxUsesPerOrderValue", e.target.value)}
            placeholder="1"
          />
        )}
      </Card>
    </>
  );
}

// ── Section: Free shipping ────────────────────────────────────────────────────

function FreeShippingValueSection() {
  return (
    <Card>
      <SectionTitle>Countries</SectionTitle>
      <Select defaultValue="all">
        <option value="all">All countries</option>
        <option value="specific">Specific countries</option>
      </Select>
      <p className="text-xs text-gray-400 mt-1.5">
        Free shipping will apply to orders shipped to all countries.
      </p>
    </Card>
  );
}

// ── Section: Min purchase requirements ───────────────────────────────────────

function MinPurchaseSection({ form, set }) {
  return (
    <Card>
      <SectionTitle>Minimum purchase requirements</SectionTitle>
      <div className="flex flex-col gap-2.5">
        <Radio
          checked={form.minPurchaseType === "none"}
          onChange={() => set("minPurchaseType", "none")}
        >
          No minimum requirements
        </Radio>
        <Radio
          checked={form.minPurchaseType === "amount"}
          onChange={() => set("minPurchaseType", "amount")}
        >
          Minimum purchase amount (₹)
        </Radio>
        {form.minPurchaseType === "amount" && (
          <div className="ml-6 relative w-48">
            <Input
              type="number"
              min="0"
              value={form.minOrderAmount}
              onChange={(e) => set("minOrderAmount", e.target.value)}
              className="pl-6"
              placeholder="0.00"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              ₹
            </span>
          </div>
        )}
        <Radio
          checked={form.minPurchaseType === "qty"}
          onChange={() => set("minPurchaseType", "qty")}
        >
          Minimum quantity of items
        </Radio>
        {form.minPurchaseType === "qty" && (
          <Input
            type="number"
            min="1"
            className="ml-6 w-32"
            value={form.minQty}
            onChange={(e) => set("minQty", e.target.value)}
            placeholder="1"
          />
        )}
      </div>
    </Card>
  );
}

// ── Section: Eligibility ──────────────────────────────────────────────────────

function EligibilitySection({ form, set }) {
  return (
    <Card>
      <SectionTitle>Eligibility</SectionTitle>
      <Select
        value={form.eligibility}
        onChange={(e) => set("eligibility", e.target.value)}
      >
        <option value="all">All customers</option>
        <option value="specific">Specific customers</option>
      </Select>
    </Card>
  );
}

// ── Section: Max uses ─────────────────────────────────────────────────────────

function MaxUsesSection({ form, set }) {
  return (
    <Card>
      <SectionTitle>Maximum discount uses</SectionTitle>
      <div className="flex flex-col gap-3">
        <div>
          <Checkbox
            checked={form.limitTotal}
            onChange={(e) => set("limitTotal", e.target.checked)}
          >
            Limit number of times this discount can be used in total
          </Checkbox>
          {form.limitTotal && (
            <Input
              type="number"
              min="1"
              className="mt-2 w-32"
              value={form.limitTotalValue}
              onChange={(e) => set("limitTotalValue", e.target.value)}
              placeholder="0"
            />
          )}
        </div>
        <Checkbox
          checked={form.limitPerCustomer}
          onChange={(e) => set("limitPerCustomer", e.target.checked)}
        >
          Limit to one use per customer
        </Checkbox>
      </div>
    </Card>
  );
}

// ── Section: Combinations ─────────────────────────────────────────────────────

function CombinationsSection({ form, set }) {
  return (
    <Card>
      <SectionTitle>Combinations</SectionTitle>
      <p className="text-xs text-gray-500 mb-3">
        This discount can be combined with:
      </p>
      <div className="flex flex-col gap-2.5">
        <Checkbox
          checked={form.combineProduct}
          onChange={(e) => set("combineProduct", e.target.checked)}
        >
          Product discounts
        </Checkbox>
        <Checkbox
          checked={form.combineOrder}
          onChange={(e) => set("combineOrder", e.target.checked)}
        >
          Order discounts
        </Checkbox>
        <Checkbox
          checked={form.combineShipping}
          onChange={(e) => set("combineShipping", e.target.checked)}
        >
          Shipping discounts
        </Checkbox>
      </div>
    </Card>
  );
}

// ── Section: Active dates ─────────────────────────────────────────────────────

function ActiveDatesSection({ form, set }) {
  return (
    <Card>
      <SectionTitle>Active dates</SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label>Start date</Label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <Label>Start time (IST)</Label>
          <div className="relative">
            <Clock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>
      <Checkbox
        checked={form.hasEndDate}
        onChange={(e) => set("hasEndDate", e.target.checked)}
      >
        Set end date
      </Checkbox>
      {form.hasEndDate && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label>End date</Label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <Label>End time (IST)</Label>
            <div className="relative">
              <Clock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Right sidebar: Summary ────────────────────────────────────────────────────

function SummaryPanel({ type, form }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  const code =
    form.method === "discount_code"
      ? form.code || "No discount code yet"
      : form.autoTitle || "No title yet";
  const label = form.method === "discount_code" ? "Code" : "Title";

  const details = [
    form.eligibility === "all" ? "All customers" : "Specific customers",
    "For Online Store",
    form.minPurchaseType === "amount"
      ? `Minimum purchase of ₹${form.minOrderAmount || "0"}`
      : form.minPurchaseType === "qty"
        ? `Minimum quantity of ${form.minQty || "0"}`
        : "No minimum purchase requirement",
    form.limitTotal
      ? `${form.limitTotalValue || "0"} total uses`
      : "No usage limits",
    form.combineProduct || form.combineOrder || form.combineShipping
      ? "Can combine with other discounts"
      : "Can't combine with other discounts",
    form.startDate ? `Active from ${form.startDate}` : "Active from today",
  ];

  return (
    <div className="sticky top-6 flex flex-col gap-4">
      {/* Summary */}
      <Card>
        <p className="text-sm font-semibold text-gray-400 mb-0.5">{code}</p>
        <p className="text-xs text-gray-400 mb-4">{label}</p>

        <p className="text-xs font-semibold text-gray-900 mb-1">Type</p>
        <p className="text-sm text-gray-700 mb-1">{meta.label}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Icon size={13} strokeWidth={1.5} />
          {meta.sub}
        </div>

        <p className="text-xs font-semibold text-gray-900 mb-2">Details</p>
        <ul className="space-y-1">
          {details.map((d, i) => (
            <li
              key={i}
              className="text-xs text-gray-600 flex items-start gap-1.5"
            >
              <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </Card>

      {/* Sales channel */}
      <Card>
        <SectionTitle>Sales channel access</SectionTitle>
        <Checkbox checked={form.salesChannel} onChange={() => {}}>
          Allow discount to be featured on selected channels
        </Checkbox>
      </Card>

      {/* Tags */}
      <Card>
        <SectionTitle>Tags</SectionTitle>
        <TagsInput form={form} />
      </Card>
    </div>
  );
}

function TagsInput({ form }) {
  const [input, setInput] = useState("");
  const [tags, setTags] = useState(form.tags || []);

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) setTags([...tags, val]);
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
          >
            {t}
            <button onClick={() => setTags(tags.filter((x) => x !== t))}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 cursor-text">
        <Plus size={13} className="text-gray-400 shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add tags"
          className="flex-1 text-sm outline-none placeholder-gray-400"
        />
      </div>
    </div>
  );
}

// ── Main DiscountForm ─────────────────────────────────────────────────────────

const defaultForm = () => ({
  method: "discount_code",
  code: "",
  autoTitle: "",
  discountValueType: "percentage",
  discountValue: "",
  maxDiscountAmount: "",
  appliesTo: "specific_collections",
  buyType: "min_qty",
  buyQty: "",
  buyAmount: "",
  buyFrom: "specific_products",
  getQty: "",
  getFrom: "specific_products",
  getDiscountType: "percentage",
  getDiscountValue: "",
  maxUsesPerOrder: false,
  maxUsesPerOrderValue: "",
  minPurchaseType: "none",
  minOrderAmount: "",
  minQty: "",
  eligibility: "all",
  limitTotal: false,
  limitTotalValue: "",
  limitPerCustomer: false,
  combineProduct: false,
  combineOrder: false,
  combineShipping: false,
  startDate: todayStr(),
  startTime: new Date().toTimeString().slice(0, 5),
  hasEndDate: false,
  endDate: "",
  endTime: "",
  salesChannel: false,
  tags: [],
});

export default function DiscountForm({
  type = "amount_off_products",
  mode = "add",
  id,
  toaster,
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [loadingCoupon, setLoadingCoupon] = useState(mode === "edit");

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    let cancelled = false;
    setLoadingCoupon(true);

    dispatch(fetchDiscountById(id, router))
      .then((res) => {
        if (cancelled || !res?.status) return;
        const c = res.data?.data || res.data;
        if (!c) return;

        const expiry = c.expiryDate ? new Date(c.expiryDate) : null;
        const noExpiry = expiry && expiry.getFullYear() >= 2099;

        setForm((prev) => ({
          ...prev,
          method: "discount_code",
          code: c.code || "",
          discountValue: String(c.discountValue ?? ""),
          discountValueType:
            c.discountType === "percentage" ? "percentage" : "fixed",
          minOrderAmount: String(c.minOrderAmount ?? ""),
          minPurchaseType: c.minOrderAmount > 0 ? "amount" : "none",
          limitTotal: (c.usageLimit ?? 0) > 0,
          limitTotalValue: String(c.usageLimit ?? ""),
          limitPerCustomer: (c.perUserLimit ?? 1) <= 1,
          maxDiscountAmount: c.maxDiscountAmount
            ? String(c.maxDiscountAmount)
            : "",
          startDate: c.startDate
            ? new Date(c.startDate).toISOString().split("T")[0]
            : todayStr(),
          hasEndDate: !noExpiry,
          endDate:
            !noExpiry && expiry ? expiry.toISOString().split("T")[0] : "",
        }));
      })
      .finally(() => {
        if (!cancelled) setLoadingCoupon(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, id, dispatch, router]);

  const buildPayload = () => {
    const isPercent = form.discountValueType === "percentage";
    const payload = {
      code:
        form.method === "discount_code"
          ? form.code || randomCode()
          : form.autoTitle?.toUpperCase().replace(/\s+/g, "_") || randomCode(),
      description: `${TYPE_META[type].label}${form.autoTitle ? " - " + form.autoTitle : ""}`,
      discountType:
        type === "free_shipping" ? "flat" : isPercent ? "percentage" : "flat",
      discountValue:
        type === "free_shipping"
          ? 0
          : type === "buy_x_get_y"
            ? form.getDiscountType === "free"
              ? 100
              : Number(form.getDiscountValue) || 0
            : Number(form.discountValue) || 0,
      minOrderAmount:
        form.minPurchaseType === "amount"
          ? Number(form.minOrderAmount) || 0
          : 0,
      maxDiscountAmount:
        isPercent && form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : undefined,
      usageLimit: form.limitTotal ? Number(form.limitTotalValue) || 0 : 0,
      perUserLimit: form.limitPerCustomer ? 1 : 99,
      startDate: toISO(form.startDate, form.startTime),
      expiryDate: form.hasEndDate
        ? toISO(form.endDate, form.endTime)
        : new Date("2099-12-31").toISOString(),
      status: "active",
    };
    return payload;
  };

  const handleSave = async () => {
    if (form.method === "discount_code" && !form.code.trim()) {
      toaster?.({ type: "error", message: "Discount code is required" });
      return;
    }
    if (
      type !== "free_shipping" &&
      type !== "buy_x_get_y" &&
      !form.discountValue
    ) {
      toaster?.({ type: "error", message: "Discount value is required" });
      return;
    }
    if (form.hasEndDate && !form.endDate) {
      toaster?.({
        type: "error",
        message: "End date is required when set end date is checked",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      const res =
        mode === "edit"
          ? await dispatch(updateDiscountById(id, payload, router))
          : await dispatch(createDiscount(payload, router));

      if (res?.status) {
        toaster?.({
          type: "success",
          message: mode === "edit" ? "Discount updated" : "Discount created",
        });
        router.push("/discounts");
      } else {
        toaster?.({
          type: "error",
          message: res?.data?.message || "Something went wrong",
        });
      }
    } catch (err) {
      toaster?.({
        type: "error",
        message: err?.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = TYPE_META[type]?.label || "Create discount";

  if (loadingCoupon) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
        <button
          onClick={() => router.push("/discounts")}
          className="hover:text-gray-800 transition-colors"
        >
          Discounts
        </button>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{typeLabel}</span>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left column */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          <MethodSection type={type} form={form} set={set} />

          {type === "amount_off_products" && (
            <>
              <DiscountValueSection form={form} set={set} />
              <AppliesToSection form={form} set={set} />
              <EligibilitySection form={form} set={set} />
              <MinPurchaseSection form={form} set={set} />
              <MaxUsesSection form={form} set={set} />
              <CombinationsSection form={form} set={set} />
            </>
          )}

          {type === "buy_x_get_y" && (
            <>
              <BuyXGetYSection form={form} set={set} />
              <EligibilitySection form={form} set={set} />
              <MaxUsesSection form={form} set={set} />
              <CombinationsSection form={form} set={set} />
            </>
          )}

          {type === "amount_off_order" && (
            <>
              <DiscountValueSection form={form} set={set} />
              <EligibilitySection form={form} set={set} />
              <MinPurchaseSection form={form} set={set} />
              <MaxUsesSection form={form} set={set} />
              <CombinationsSection form={form} set={set} />
            </>
          )}

          {type === "free_shipping" && (
            <>
              <FreeShippingValueSection />
              <EligibilitySection form={form} set={set} />
              <MinPurchaseSection form={form} set={set} />
              <MaxUsesSection form={form} set={set} />
              <CombinationsSection form={form} set={set} />
            </>
          )}

          <ActiveDatesSection form={form} set={set} />
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <SummaryPanel type={type} form={form} />
        </div>
      </div>

      {/* Sticky footer save */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-3 z-40">
        <button
          onClick={() => router.push("/discounts")}
          className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
