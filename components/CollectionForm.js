import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  Layers,
  ChevronRight,
  Pencil,
  Search,
  Tag,
  ImagePlus,
  X,
  Check,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  fetchCollectionById,
  createCollection,
  updateCollectionById,
} from "@/redux/actions/collectionActions";
import { searchProducts } from "@/redux/actions/productActions";

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
  ssr: false,
});

const CHANNELS = [
  { key: "online_store", label: "Online Store" },
  { key: "pos", label: "Point of Sale" },
];

const THEME_TEMPLATES = ["Default collection", "Custom collection", "Featured"];

// ── Image drop zone ───────────────────────────────────────────────────────────

function ImageDropZone({ preview, onChange, onRemove }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) onChange(dropped);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => !preview && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl transition-colors ${
        preview
          ? "border-transparent"
          : "border-gray-300 hover:border-gray-400 cursor-pointer"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) onChange(f);
        }}
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-gray-50"
          >
            <X size={14} className="text-gray-600" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <ImagePlus size={24} className="text-gray-400 mb-2" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Add image
          </button>
          <p className="text-xs text-gray-400 mt-2">
            or drop an image to upload
          </p>
        </div>
      )}
    </div>
  );
}

// ── SEO section ───────────────────────────────────────────────────────────────

function SeoSection({ seo, onChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Search engine listing
        </h3>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Pencil size={15} />
        </button>
      </div>
      {!expanded ? (
        <p className="text-xs text-gray-500 mt-2">
          Add a title and description to see how this collection might appear in
          a search engine listing
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Meta title
            </label>
            <input
              value={seo.metaTitle}
              onChange={(e) => onChange({ ...seo, metaTitle: e.target.value })}
              placeholder="Collection meta title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Meta description
            </label>
            <textarea
              value={seo.metaDescription}
              onChange={(e) =>
                onChange({ ...seo, metaDescription: e.target.value })
              }
              placeholder="Collection meta description"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products section ──────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: "manual", label: "Sort: Manual" },
  { key: "title-asc", label: "Sort: Title A–Z" },
  { key: "title-desc", label: "Sort: Title Z–A" },
  { key: "price-asc", label: "Sort: Price low–high" },
  { key: "price-desc", label: "Sort: Price high–low" },
];

const priceOf = (p) => Number(p?.finalPrice ?? p?.price ?? 0);

const formatPrice = (p) => `$${priceOf(p).toFixed(2)}`;

function sortProducts(list, key) {
  const sorted = [...list];
  switch (key) {
    case "title-asc":
      return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "title-desc":
      return sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    case "price-asc":
      return sorted.sort((a, b) => priceOf(a) - priceOf(b));
    case "price-desc":
      return sorted.sort((a, b) => priceOf(b) - priceOf(a));
    default:
      return sorted;
  }
}

function ProductThumb({ product, size = 40 }) {
  const src = product?.images?.[0];
  return src ? (
    <img
      src={src}
      alt={product.name}
      style={{ width: size, height: size }}
      className="rounded-lg object-cover border border-gray-200 shrink-0"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0"
    >
      <Tag size={16} className="text-gray-300" />
    </div>
  );
}

// Modal listing every product so the admin can tick several at once
function BrowseProductsModal({ open, onClose, selected, onConfirm, router }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    if (!open) return;
    setChecked(selected);
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingList(true);
    const t = setTimeout(async () => {
      const res = await searchProducts({ search: query, limit: 50 }, router);
      if (!active) return;
      setItems(res);
      setLoadingList(false);
    }, query ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [open, query]);

  if (!open) return null;

  const isChecked = (id) => checked.some((p) => p._id === id);
  const toggle = (product) =>
    setChecked((prev) =>
      prev.some((p) => p._id === product._id)
        ? prev.filter((p) => p._id !== product._id)
        : [...prev, product],
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Add products</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 min-w-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={18} className="text-gray-400 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">
              No products found.
            </p>
          ) : (
            items.map((p) => (
              <label
                key={p._id}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <input
                  type="checkbox"
                  checked={isChecked(p._id)}
                  onChange={() => toggle(p)}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900 shrink-0"
                />
                <ProductThumb product={p} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatPrice(p)} · {p.stock ?? 0} in stock
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {checked.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(checked)}
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsSection({ products, onChange, router }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [sort, setSort] = useState("manual");
  const searchBoxRef = useRef(null);

  // Close the suggestion dropdown when clicking outside of the search box
  useEffect(() => {
    const onClickAway = (e) => {
      if (!searchBoxRef.current?.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await searchProducts({ search: query, limit: 10 }, router);
      if (!active) return;
      setResults(res);
      setSearching(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const selectedIds = useMemo(
    () => new Set(products.map((p) => p._id)),
    [products],
  );

  const addProduct = (product) => {
    if (selectedIds.has(product._id)) return;
    onChange([...products, product]);
  };

  const removeProduct = (id) =>
    onChange(products.filter((p) => p._id !== id));

  const applySort = (key) => {
    setSort(key);
    if (key !== "manual") onChange(sortProducts(products, key));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Products</h3>
        {products.length > 0 && (
          <span className="text-xs text-gray-500">
            {products.length} product{products.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div ref={searchBoxRef} className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search products"
              className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 min-w-0"
            />
            {searching && (
              <Loader2 size={14} className="text-gray-400 animate-spin shrink-0" />
            )}
          </div>

          {showResults && query.trim() && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {searching ? (
                <p className="text-sm text-gray-500 px-3 py-4">Searching…</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-gray-500 px-3 py-4">
                  No products match “{query}”.
                </p>
              ) : (
                results.map((p) => {
                  const added = selectedIds.has(p._id);
                  return (
                    <button
                      key={p._id}
                      type="button"
                      disabled={added}
                      onClick={() => addProduct(p)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left border-b border-gray-100 last:border-0 ${
                        added ? "cursor-default" : "hover:bg-gray-50"
                      }`}
                    >
                      <ProductThumb product={p} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatPrice(p)}
                        </p>
                      </div>
                      {added && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                          <Check size={12} /> Added
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBrowseOpen(true)}
            className="flex-1 sm:flex-none border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Browse
          </button>
          <select
            value={sort}
            onChange={(e) => applySort(e.target.value)}
            className="flex-1 sm:flex-none border border-gray-300 bg-white text-sm text-gray-700 px-3 py-2 rounded-lg outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-gray-100 rounded-xl bg-gray-50">
          <Tag size={32} className="text-gray-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-600">
            There are no products in this collection.
          </p>
          <p className="text-sm text-gray-400">
            Search or browse to add products.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {products.map((p) => (
            <div
              key={p._id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
            >
              <ProductThumb product={p} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400">
                  {formatPrice(p)} · {p.stock ?? 0} in stock
                </p>
              </div>
              {p.status && p.status !== "active" && (
                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 capitalize shrink-0">
                  {p.status}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeProduct(p._id)}
                title="Remove from collection"
                className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <BrowseProductsModal
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        selected={products}
        router={router}
        onConfirm={(next) => {
          onChange(next);
          setBrowseOpen(false);
        }}
      />
    </div>
  );
}

// ── Main form component ───────────────────────────────────────────────────────

export default function CollectionForm({ mode = "add", id, toaster, loader }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { collection, loading } = useSelector((state) => state.collection);
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "manual",
    status: "active",
    featured: false,
    channels: ["online_store"],
    themeTemplate: "Default collection",
    seo: { metaTitle: "", metaDescription: "" },
    products: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ready, setReady] = useState(!isEdit);

  // Fetch and prefill for edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    dispatch(fetchCollectionById(id, router)).then(() => setReady(true));
  }, [id]);

  // `collection` can still hold the previously opened one — only prefill once
  // the fetched document actually matches the id in the URL.
  useEffect(() => {
    if (!isEdit || !collection || String(collection._id) !== String(id)) return;
    setForm({
      name: collection.name || "",
      description: collection.description || "",
      type: collection.type || "manual",
      status: collection.status || "active",
      featured: collection.featured || false,
      channels: collection.channels || ["online_store"],
      themeTemplate: collection.themeTemplate || "Default collection",
      seo: {
        metaTitle: collection.seo?.metaTitle || "",
        metaDescription: collection.seo?.metaDescription || "",
      },
      // getById populates these; guard in case an id-only array comes back
      products: (collection.products || []).filter(
        (p) => p && typeof p === "object" && p._id,
      ),
    });
    if (collection.image) setImagePreview(collection.image);
    setReady(true);
  }, [collection, id]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleImage = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const toggleChannel = (key) => {
    set(
      "channels",
      form.channels.includes(key)
        ? form.channels.filter((c) => c !== key)
        : [...form.channels, key],
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toaster?.({ type: "error", message: "Title is required" });
      return;
    }
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("type", form.type);
    fd.append("status", form.status);
    fd.append("featured", form.featured);
    fd.append("channels", JSON.stringify(form.channels));
    fd.append("themeTemplate", form.themeTemplate);
    fd.append("seo", JSON.stringify(form.seo));
    fd.append(
      "products",
      JSON.stringify(form.type === "manual" ? form.products.map((p) => p._id) : []),
    );
    if (imageFile) fd.append("image", imageFile);

    try {
      loader?.(true);
      const action = isEdit
        ? updateCollectionById(id, fd, router)
        : createCollection(fd, router);
      const res = await action(dispatch);
      if (res?.status) {
        toaster?.({
          type: "success",
          message: isEdit ? "Collection updated" : "Collection created",
        });
        router.push("/collections");
      } else {
        toaster?.({ type: "error", message: res?.message || "Failed to save" });
      }
    } catch {
      toaster?.({ type: "error", message: "Something went wrong" });
    } finally {
      loader?.(false);
    }
  };

  // Hold the spinner until the fetched collection lands — rendering the empty
  // form first would flash a blank title and an empty product list.
  if (isEdit && !ready) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-5">
        <button
          onClick={() => router.push("/collections")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Layers size={15} />
          Collections
        </button>
        <ChevronRight size={13} className="text-gray-400" />
        <span className="text-gray-900 font-medium truncate max-w-48">
          {isEdit ? form.name || "Edit collection" : "Add collection"}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Title + Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Title
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g., Summer collection, Under $100, Staff picks"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <TipTapEditor
                value={form.description}
                onChange={(val) => set("description", val)}
              />
            </div>
          </div>

          {/* Collection type */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Collection type
            </h3>
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="manual"
                  checked={form.type === "manual"}
                  onChange={() => set("type", "manual")}
                  className="mt-0.5 accent-gray-900"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Manual</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add products to this collection one by one.{" "}
                    <span className="underline cursor-pointer">
                      Learn more about manual collections
                    </span>
                    .
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="smart"
                  checked={form.type === "smart"}
                  onChange={() => set("type", "smart")}
                  className="mt-0.5 accent-gray-900"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Smart</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Existing and future products that match the conditions you
                    set will automatically be added.{" "}
                    <span className="underline cursor-pointer">
                      Learn more about smart collections
                    </span>
                    .
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Products (manual only) */}
          {form.type === "manual" && (
            <ProductsSection
              products={form.products}
              onChange={(val) => set("products", val)}
              router={router}
            />
          )}

          {/* SEO */}
          <SeoSection seo={form.seo} onChange={(val) => set("seo", val)} />
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-full lg:w-72 lg:shrink-0 space-y-4">
          {/* Publishing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Publishing
              </h3>
              <button className="text-xs font-medium text-blue-600 hover:underline">
                Manage
              </button>
            </div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              Sales channels
            </p>
            <div className="space-y-2">
              {CHANNELS.map((ch) => (
                <label
                  key={ch.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.channels.includes(ch.key)}
                    onChange={() => toggleChannel(ch.key)}
                    className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                  />
                  <span className="text-sm text-gray-700">{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Image</h3>
            <ImageDropZone
              preview={imagePreview}
              onChange={handleImage}
              onRemove={removeImage}
            />
          </div>

          {/* Theme template */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Theme template
            </h3>
            <select
              value={form.themeTemplate}
              onChange={(e) => set("themeTemplate", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white"
            >
              {THEME_TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="mt-8 flex justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/collections")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
