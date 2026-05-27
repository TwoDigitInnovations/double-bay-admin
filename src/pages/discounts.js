import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Tag, Upload, X, ChevronRight, Tag as TagIcon, ShoppingCart, Truck } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table, { StatusPill } from "@/components/table";
import { fetchDiscounts } from "@/redux/actions/discountActions";

// ── Illustration ──────────────────────────────────────────────────────────────

function DiscountIllustration() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gray circle base */}
      <circle cx="82" cy="88" r="56" fill="#f3f4f6" />

      {/* Orange coupon/ticket */}
      <rect x="42" y="38" width="76" height="54" rx="6" fill="#F59E0B" />
      {/* Dashed right edge of ticket */}
      <line x1="96" y1="40" x2="96" y2="90" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
      {/* % symbol */}
      <text x="62" y="74" fontSize="26" fontWeight="bold" fill="white" fontFamily="Arial">%</text>

      {/* Scissors */}
      {/* Left blade */}
      <path
        d="M72 102 C68 92 60 86 54 92 C48 98 54 108 62 106 C66 105 70 102 72 102Z"
        fill="#0D9488"
      />
      {/* Right blade */}
      <path
        d="M88 102 C92 92 100 86 106 92 C112 98 106 108 98 106 C94 105 90 102 88 102Z"
        fill="#065F46"
      />
      {/* Scissors pivot circle */}
      <circle cx="80" cy="100" r="5" fill="#9CA3AF" />
      <circle cx="80" cy="100" r="2.5" fill="white" />
      {/* Left handle */}
      <path d="M72 102 L56 130 C54 134 48 136 46 132 C44 128 46 124 50 123 L68 116 Z" fill="#0D9488" />
      {/* Right handle */}
      <path d="M88 102 L104 130 C106 134 112 136 114 132 C116 128 114 124 110 123 L92 116 Z" fill="#065F46" />
      {/* Handle holes */}
      <ellipse cx="49" cy="130" rx="5" ry="4" fill="none" stroke="white" strokeWidth="1.5" />
      <ellipse cx="111" cy="130" rx="5" ry="4" fill="none" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

// ── Discount type modal ───────────────────────────────────────────────────────

const DISCOUNT_TYPES = [
  {
    id: "amount_off_products",
    icon: TagIcon,
    label: "Amount off products",
    description: "Discount specific products or collections of products",
  },
  {
    id: "buy_x_get_y",
    icon: TagIcon,
    label: "Buy X get Y",
    description: "Discount specific products or collections of products",
  },
  {
    id: "amount_off_order",
    icon: ShoppingCart,
    label: "Amount off order",
    description: "Discount the total order amount",
  },
  {
    id: "free_shipping",
    icon: Truck,
    label: "Free shipping",
    description: "Offer free shipping on an order",
  },
];

function DiscountTypeModal({ onClose, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Select discount type</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div className="divide-y divide-gray-100">
          {DISCOUNT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => onSelect(type)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center shrink-0">
                <type.icon size={16} className="text-gray-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 shrink-0 group-hover:text-gray-600 transition-colors" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Table columns ─────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    Header: "Title / Code",
    accessor: "code",
    Cell: ({ value, row }) => (
      <div>
        <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{row.original.description || "—"}</p>
      </div>
    ),
  },
  {
    Header: "Type",
    accessor: "discountType",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-700 capitalize">{value === "percentage" ? "Percentage" : "Fixed amount"}</span>
    ),
  },
  {
    Header: "Value",
    id: "value",
    accessor: (row) =>
      row.discountType === "percentage"
        ? `${row.discountValue}%`
        : `₹${row.discountValue}`,
    Cell: ({ value }) => <span className="text-sm font-medium text-gray-900">{value}</span>,
  },
  {
    Header: "Uses",
    accessor: "usageCount",
    Cell: ({ value, row }) => (
      <span className="text-sm text-gray-600">
        {value ?? 0}{row.original.usageLimit > 0 ? ` / ${row.original.usageLimit}` : ""}
      </span>
    ),
  },
  {
    Header: "Expires",
    accessor: "expiryDate",
    Cell: ({ value }) => {
      if (!value) return <span className="text-sm text-gray-400">—</span>;
      const d = new Date(value);
      if (d.getFullYear() >= 2099) return <span className="text-sm text-gray-400">No expiry</span>;
      return (
        <span className="text-sm text-gray-600">
          {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      );
    },
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: ({ value }) => <StatusPill value={value} />,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

function Discounts() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { discounts, loading } = useSelector((state) => state.discount);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDiscounts(router));
  }, [dispatch]);

  const columns = useMemo(() => COLUMNS, []);

  const handleSelect = (type) => {
    setModalOpen(false);
    router.push(`/discounts/create?type=${type.id}`);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Tag size={18} className="text-gray-700" />
          Discounts
        </h1>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Upload size={13} />
            Export
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Create discount
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 px-6 text-center min-h-96">
          <DiscountIllustration />
          <h2 className="mt-6 text-base font-semibold text-gray-900">
            Manage discounts and promotions
          </h2>
          <p className="mt-2 text-sm text-gray-500 max-w-sm leading-relaxed">
            Add discount codes and automatic discounts that apply at checkout.{" "}
            You can also use discounts with{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">compare at prices</span>.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Create discount
          </button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={discounts}
          onRowClick={(row) => router.push(`/discounts/create?id=${row._id}`)}
        />
      )}

      <p className="text-center mt-6 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
        Learn more about discounts
      </p>

      {/* Modal */}
      {modalOpen && (
        <DiscountTypeModal
          onClose={() => setModalOpen(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}

export default isAuth(Discounts);
