import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, Plus, Tag, Trash2, Upload } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table, { AvatarCell, StatusPill } from "@/components/table";
import { deleteProductById, fetchProducts } from "@/redux/actions/productActions";
import { useRouter } from "next/router";

// ── CSV Export utility ───────────────────────────────────────────────────────

function exportToCSV(products, filename = "products.csv") {
  const headers = ["Product Name", "Price", "Category", "Status", "Stock"];
  const rows = products.map((p) => [
    p.name || "",
    p.finalPrice || p.price || 0,
    p.category || "",
    p.status || "",
    p.stock || 0,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
function InventoryCell({ row }) {
  const { trackInventory, stock, variants } = row.original;
  if (!trackInventory) {
    return <span className="text-gray-500 text-sm">Inventory not tracked</span>;
  }
  const count = stock ?? 0;
  const variantCount = variants?.length || 0;
  const lowStock = count > 0 && count <= 10;
  return (
    <span className={`text-sm ${lowStock ? "text-red-500" : "text-gray-700"}`}>
      {count === 0 ? (
        <span className="text-red-500">0 in stock</span>
      ) : (
        `${count} in stock`
      )}
      {variantCount > 1 && (
        <span className="text-gray-400 ml-1">for {variantCount} variants</span>
      )}
    </span>
  );
}

const COLUMNS = (onDelete) => [
  {
    Header: "Product",
    accessor: "name",
    Cell: AvatarCell,
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: ({ value }) => <StatusPill value={value} />,
  },
  {
    Header: "Inventory",
    accessor: "stock",
    Cell: InventoryCell,
  },
  {
    Header: "Price",
    accessor: "finalPrice",
    Cell: ({ value, row }) => (
      <span className="text-sm font-medium text-gray-900">
        ${Number(value || row.original.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    Header: "Category",
    accessor: "category",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-700">{value || "Uncategorized"}</span>
    ),
  },
  {
    Header: "Channels",
    accessor: "channels",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-700">{value ?? "—"}</span>
    ),
  },
  {
    Header: "Product type",
    accessor: "productType",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-700">{value || "—"}</span>
    ),
  },
  {
    Header: "Vendor",
    id: "vendor",
    // The form's "Vendor / Brand" field saves to `brand`; `vendor` is the
    // populated owner account, used as a fallback.
    accessor: (row) => row.brand || row.vendor?.fullname || "",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-700">{value || "—"}</span>
    ),
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

function EmptyState({ router }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Top bar tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <button className="px-3 py-1 text-sm bg-gray-100 rounded-lg text-gray-700 font-medium">
          All
        </button>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <Plus size={16} />
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main empty content */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-8 sm:py-10 gap-6">
        <div className="max-w-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Add your products</h2>
          <p className="text-xs text-gray-500 mb-4">
            Start by stocking your store with products your customers will love
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/products/add")}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Add product
            </button>
            <button className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors">
              <Download size={15} />
              Import
            </button>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-2 gap-3 shrink-0">
          {[
            { src: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=256&h=256&fit=crop&q=80", alt: "Sneakers" },
            { src: "https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=256&h=256&fit=crop&q=80", alt: "Vase" },
            { src: "https://images.unsplash.com/photo-1638609927040-8a7e97cd9d6a?w=256&h=256&fit=crop&q=80", alt: "Cosmetics" },
            { src: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=256&h=256&fit=crop&q=80", alt: "Sunglasses" },
          ].map((img) => (
            <div key={img.alt} className="w-28 h-28 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Find products to sell section */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 sm:px-10 py-6 sm:py-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Find products to sell</h3>
        <p className="text-xs text-gray-500 mb-4 max-w-xl">
          Have dropshipping or print on demand products shipped directly from the supplier to your customer, and only pay for what you sell.
        </p>
        <button className="border border-gray-300 hover:bg-white text-gray-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors bg-white">
          Discover products to sell
        </button>
      </div>
    </div>
  );
}

function Products() {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.product);
  const router = useRouter();
  useEffect(() => {
    dispatch(fetchProducts(router));
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await dispatch(deleteProductById(id, router));
      if (!res?.status) {
        window.alert(res?.message || "Could not delete");
      }
    } catch (e) {
      window.alert(e?.message || "Could not delete");
    }
  };

  const handleExport = () => {
    exportToCSV(products, `products-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const csv = ev.target?.result;
          window.alert("CSV import functionality coming soon! Please add products manually for now.");
        } catch (err) {
          window.alert("Error reading file: " + err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const columns = useMemo(() => COLUMNS(handleDelete), [products.length]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <Tag size={18} className="text-gray-700" />
          Products
        </h1>
        {products.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={loading}
              className="hidden sm:flex items-center gap-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload size={14} />
              Export
            </button>
            <button
              onClick={handleImport}
              className="hidden sm:flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={14} />
              Import
            </button>
            <button
              onClick={() => router.push("/products/add")}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Add product
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState router={router} />
      ) : (
        <Table
          columns={columns}
          data={products}
          onRowClick={(row) => router.push(`/products/${row._id}`)}
        />
      )}
    </div>
  );
}

export default isAuth(Products);
