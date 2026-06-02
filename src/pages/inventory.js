import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Warehouse, Download, Upload, Search, Trash2 } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table from "@/components/table";
import { deleteProductById, fetchProducts } from "@/redux/actions/productActions";

// ── Custom cells ─────────────────────────────────────────────────────────────

function ProductCell({ value, row }) {
  const { images, variants } = row.original;
  const image = images?.[0];
  const variantLabel = variants?.length > 1 ? `${variants.length} variants` : null;
  return (
    <div className="flex items-center gap-3">
      {image ? (
        <img
          src={image}
          alt={value}
          className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight max-w-64 truncate">
          {value}
        </p>
        {variantLabel && (
          <span className="mt-1 inline-block text-xs text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
            {variantLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function SkuCell({ value }) {
  return value ? (
    <span className="text-sm text-teal-600">{value}</span>
  ) : (
    <span className="text-sm text-gray-400">No SKU</span>
  );
}

function NumCell({ value }) {
  return (
    <span className="text-sm text-gray-700 tabular-nums">{value ?? 0}</span>
  );
}

// ── Dotted-underline header ───────────────────────────────────────────────────

function DotHeader({ label, title }) {
  return (
    <span
      title={title}
      className="border-b border-dashed border-gray-400 cursor-help"
    >
      {label}
    </span>
  );
}

// ── Columns ───────────────────────────────────────────────────────────────────

const COLUMNS = (onDelete) => [
  {
    Header: "Product",
    accessor: "name",
    Cell: ProductCell,
  },
  {
    Header: "SKU",
    accessor: "sku",
    Cell: SkuCell,
  },
  {
    Header: () => (
      <DotHeader
        label="Unavailable"
        title="Stock that is damaged, on quality hold, or otherwise unavailable for sale"
      />
    ),
    accessor: "unavailable",
    Cell: NumCell,
  },
  {
    Header: () => (
      <DotHeader
        label="Committed"
        title="Stock that is part of an order but has not yet been fulfilled"
      />
    ),
    accessor: "committed",
    Cell: NumCell,
  },
  {
    Header: () => (
      <DotHeader
        label="Available"
        title="Stock available to sell = On hand - Committed - Unavailable"
      />
    ),
    // compute available from stock
    id: "available",
    accessor: (row) => {
      const onHand = row.stock ?? 0;
      const committed = row.committed ?? 0;
      const unavailable = row.unavailable ?? 0;
      return Math.max(0, onHand - committed - unavailable);
    },
    Cell: NumCell,
  },
  {
    Header: () => (
      <DotHeader label="On hand" title="Total physical stock at your location" />
    ),
    accessor: "stock",
    Cell: NumCell,
  },
  {
    Header: () => (
      <DotHeader
        label="Incoming"
        title="Units from purchase orders that are on their way"
      />
    ),
    accessor: "incoming",
    Cell: NumCell,
  },
  {
    Header: "",
    id: "actions",
    disableSortBy: true,
    Cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(row.original?._id);
        }}
        className="p-2 text-red-500 hover:text-red-700"
        aria-label="Delete"
      >
        <Trash2 size={16} />
      </button>
    ),
  },
];

// ── Empty state ───────────────────────────────────────────────────────────────

function InventoryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-gray-300 mb-4">
        <Search size={56} strokeWidth={1.5} />
      </div>
      <p className="text-base font-semibold text-gray-900 mb-1">
        No inventory found
      </p>
      <p className="text-sm text-gray-500 mb-5">
        Try changing the filters or search term.
      </p>
      <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors">
        Clear search and filters
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Inventory() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchProducts(router));
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await dispatch(deleteProductById(id, router));
      if (!res?.status) window.alert(res?.message || "Could not delete");
    } catch (e) {
      window.alert(e?.message || "Could not delete");
    }
  };

  const columns = useMemo(() => COLUMNS(handleDelete), [products.length]);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Warehouse size={18} className="text-gray-700" />
          Inventory
        </h1>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Upload size={13} />
            Export
          </button>
          <button className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Download size={13} />
            Import
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={products}
          emptyComponent={<InventoryEmpty />}
        />
      )}

      {/* Footer */}
      {!loading && (
        <p className="text-center mt-6 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
          Learn more about managing inventory
        </p>
      )}
    </div>
  );
}

export default isAuth(Inventory);
