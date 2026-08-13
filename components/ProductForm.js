import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  Tag,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Pencil,
  X,
  Plus,
  GripVertical,
  ImagePlus,
  Search,
  Check,
  PlusCircle,
  Beaker,
  Droplets,
  Sparkles,
  Zap,
  Leaf,
  Shield,
  Sun,
  Heart,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  fetchProductById,
  createProduct,
  updateProductById,
} from "@/redux/actions/productActions";
import { fetchCollections } from "@/redux/actions/collectionActions";
import ProductMetafieldsSection, {
  buildMetafieldsPayload,
  metafieldsToValues,
  validateMetafields,
} from "@/components/ProductMetafields";
import { Api } from "@/services/service";

// ── Product taxonomy ──────────────────────────────────────────────────────────

const TAXONOMY_GROUPS = {
  product_type: "Product type",
  skin_type: "Skin Type",
  skin_concern: "Skin Concerns",
  age: "Age",
};

// Shown in the Type picker even before the taxonomy API responds
const DEFAULT_PRODUCT_TYPES = [
  "Cleanser",
  "Cleansers",
  "cream",
  "Custom Bundle",
  "Exfoliants",
  "Eye Creams",
  "Facial Cleansers",
  "lotion",
  "Moisturiser",
  "None",
  "Procotols",
  "Professional stamping device",
  "Protocol",
  "Resurfacing",
  "Serum",
  "Skincare mask",
  "Whitening Body skincare",
];

function normalizeList(items) {
  return (items || [])
    .map((x) => (typeof x === "string" ? x : x?.value))
    .filter(Boolean);
}

// Case-insensitive dedupe + alphabetical sort
function mergeOptions(...lists) {
  const seen = new Map();
  lists.flat().forEach((raw) => {
    const val = String(raw || "").trim();
    const key = val.toLowerCase();
    if (val && !seen.has(key)) seen.set(key, val);
  });
  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select",
  single = false,
}) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    if (selected.includes(opt)) onChange([]);
    else onChange(single ? [opt] : [...selected, opt]);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="border border-gray-300 rounded-lg p-2 bg-white">
        {options.length === 0 ? (
          <div className="text-sm text-gray-400 px-1 py-2">{placeholder}</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const on = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${on
                      ? "bg-[#0A4D91] text-white"
                      : "bg-[#f0f2f5] text-[#0A4D91] hover:bg-[#e6eaef]"
                    }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Searchable / creatable single select ──────────────────────────────────────

function SearchSelect({
  value,
  onChange,
  onCreate,
  options,
  placeholder = "Search",
  createLabel = "Add",
  emptyLabel = "No matches",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const query = search.trim();
  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;
  const canCreate =
    !!onCreate &&
    !!query &&
    !options.some((o) => o.toLowerCase() === query.toLowerCase());

  const pick = (val) => {
    onChange(val);
    setSearch("");
    setOpen(false);
  };

  const create = () => {
    onCreate(query);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex items-center gap-2 border rounded-lg px-3 py-2 bg-white transition-colors ${open
            ? "border-gray-400 ring-1 ring-gray-400"
            : "border-gray-300 hover:border-gray-400"
          }`}
      >
        <Search size={13} className="text-gray-400 shrink-0" />
        <input
          value={open ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (canCreate) create();
              else if (filtered.length) pick(filtered[0]);
            }
            if (e.key === "Escape") {
              setOpen(false);
              setSearch("");
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-sm text-gray-800 outline-none placeholder-gray-400 bg-transparent"
        />
        {(open ? search : value) && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSearch("");
            }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && !canCreate ? (
              <p className="px-4 py-5 text-sm text-gray-400 text-center">
                {emptyLabel}
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => pick(opt)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className={value === opt ? "font-medium" : ""}>
                    {opt}
                  </span>
                  {value === opt && (
                    <Check size={13} className="text-gray-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={create}
              className="w-full flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-t border-gray-100 transition-colors text-left"
            >
              <Plus size={12} className="shrink-0" />
              {createLabel} “{query}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Collections multi select ──────────────────────────────────────────────────

function CollectionsPicker({ collections, value, onChange, openSignal }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  const toggle = (id) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  const allSelected =
    collections.length > 0 && selected.length === collections.length;

  const toggleAll = () =>
    onChange(allSelected ? [] : collections.map((c) => c._id));

  const query = search.trim().toLowerCase();
  const filtered = query
    ? collections.filter((c) => (c.name || "").toLowerCase().includes(query))
    : collections;
  const showAllRow = collections.length > 0 && (!query || "all".includes(query));

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(true)}
        className={`flex flex-wrap items-center gap-1.5 border rounded-lg px-2 py-2 min-h-[38px] bg-white cursor-text transition-colors ${open
            ? "border-gray-400 ring-1 ring-gray-400"
            : "border-gray-300 hover:border-gray-400"
          }`}
      >
        {selected.length === 0 ? (
          <span className="px-1 text-sm text-gray-400">Select collections</span>
        ) : allSelected ? (
          <span className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md">
            All
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-gray-400 hover:text-gray-700"
            >
              <X size={10} />
            </button>
          </span>
        ) : (
          selected.map((id) => {
            const item = collections.find((c) => c._id === id);
            return (
              <span
                key={id}
                className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md"
              >
                {item?.name || "Collection"}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(id);
                  }}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections"
              className="flex-1 min-w-0 text-sm text-gray-700 outline-none placeholder-gray-400"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {showAllRow && (
              <button
                type="button"
                onClick={toggleAll}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
              >
                <span className={allSelected ? "font-medium" : ""}>All</span>
                {allSelected && (
                  <Check size={13} className="text-gray-600 shrink-0" />
                )}
              </button>
            )}
            {filtered.length === 0 && !showAllRow ? (
              <p className="px-4 py-5 text-sm text-gray-400 text-center">
                No collections found
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => toggle(c._id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span
                    className={selected.includes(c._id) ? "font-medium" : ""}
                  >
                    {c.name}
                  </span>
                  {selected.includes(c._id) && (
                    <Check size={13} className="text-gray-600 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category picker ───────────────────────────────────────────────────────────

function CategoryPicker({ value, onChange, categories }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [parent, setParent] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((v) => !v);
    setSearch("");
    setParent(null);
  };

  const select = (name) => {
    // Store only the leaf (child name), not the full "Parent > Child" path
    const leaf = name.includes(" > ") ? name.split(" > ").pop().trim() : name;
    onChange(leaf);
    setOpen(false);
    setSearch("");
    setParent(null);
  };

  // When in search mode, flatten all categories + children
  const source = Array.isArray(categories) ? categories : [];
  const searchResults = search.trim()
    ? source.flatMap((cat) => {
      const matches = [];
      if (cat.name.toLowerCase().includes(search.toLowerCase()))
        matches.push(cat.name);
      (cat.children || []).forEach((child) => {
        if (child.toLowerCase().includes(search.toLowerCase()))
          matches.push(`${cat.name} > ${child}`);
      });
      return matches;
    })
    : null;

  const activeCategory = parent ? source.find((c) => c.name === parent) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-white transition-colors ${open
            ? "border-gray-400 ring-1 ring-gray-400"
            : "border-gray-300 hover:border-gray-400"
          }`}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || "Choose a product category"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setParent(null);
              }}
              placeholder="Search categories"
              className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={12} className="text-gray-400" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-64">
            {/* Search results */}
            {searchResults ? (
              searchResults.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-400 text-center">
                  No categories found
                </p>
              ) : (
                searchResults.map((name) => (
                  <button
                    key={name}
                    onClick={() => select(name)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span>{name}</span>
                    {value === name && (
                      <Check size={13} className="text-gray-600 shrink-0" />
                    )}
                  </button>
                ))
              )
            ) : parent ? (
              // Drilldown view
              <>
                <button
                  onClick={() => setParent(null)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <ChevronLeft size={14} className="text-gray-400" />
                  {parent}
                </button>
                <button
                  onClick={() => select(parent)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-500">All {parent}</span>
                  {value === parent && (
                    <Check size={13} className="text-gray-600 shrink-0" />
                  )}
                </button>
                {(activeCategory?.children || []).map((child) => {
                  const full = `${parent} > ${child}`;
                  return (
                    <button
                      key={child}
                      onClick={() => select(full)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>{child}</span>
                      {value === full && (
                        <Check size={13} className="text-gray-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </>
            ) : (
              // Top-level list
              source.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() =>
                    cat.children ? setParent(cat.name) : select(cat.name)
                  }
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span
                    className={
                      value === cat.name || value?.startsWith(cat.name + " >")
                        ? "font-medium text-gray-900"
                        : ""
                    }
                  >
                    {cat.name}
                  </span>
                  <span className="shrink-0 ml-2">
                    {cat.children ? (
                      <ChevronRight size={14} className="text-gray-400" />
                    ) : value === cat.name ? (
                      <Check size={13} className="text-gray-600" />
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
  ssr: false,
});

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

const WEIGHT_UNITS = ["kg", "g", "lb", "oz"];
const DIM_UNITS = ["cm", "in"];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Croatia",
  "Czech Republic",
  "Denmark",
  "Egypt",
  "Ethiopia",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Hong Kong",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kenya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
];

// ── Package modal ─────────────────────────────────────────────────────────────

const PKG_TYPES = [
  { value: "box", label: "Box", icon: "📦" },
  { value: "envelope", label: "Envelope", icon: "✉️" },
  { value: "soft_package", label: "Soft package", icon: "🛍️" },
];

function PackageModal({ pkg, onSave, onClose }) {
  const [local, setLocal] = useState({ ...pkg });
  const setL = (key, val) => setLocal((p) => ({ ...p, [key]: val }));
  const canSave =
    local.name.trim() || (local.length && local.width && local.height);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add package</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Package type */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Package type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PKG_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setL("type", t.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${local.type === t.value
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <div className="grid grid-cols-4 gap-2">
              {["length", "width", "height"].map((dim) => (
                <div key={dim}>
                  <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                    {dim}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={local[dim]}
                    onChange={(e) => setL(dim, e.target.value)}
                    placeholder="—"
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Unit
                </label>
                <select
                  value={local.dimensionUnit}
                  onChange={(e) => setL("dimensionUnit", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-700 outline-none bg-white"
                >
                  {DIM_UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Weight empty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Weight (empty)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={local.emptyWeight}
                onChange={(e) => setL("emptyWeight", e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Unit
              </label>
              <select
                value={local.weightUnit}
                onChange={(e) => setL("weightUnit", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white"
              >
                {WEIGHT_UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Package name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Package name
            </label>
            <input
              value={local.name}
              onChange={(e) => setL("name", e.target.value)}
              placeholder=""
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          {/* Default */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={local.isDefault}
              onChange={(e) => setL("isDefault", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-gray-900"
            />
            <div>
              <p className="text-sm text-gray-700 font-medium">
                Use as default package
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Used to calculate rates at checkout and pre-selected when buying
                labels
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(local);
              onClose();
            }}
            disabled={!canSave}
            className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-40 px-4 py-2 rounded-lg transition-colors"
          >
            Add package
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Media upload ──────────────────────────────────────────────────────────────

function MediaUpload({
  existingImages,
  newFiles,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}) {
  const inputRef = useRef(null);
  const total = existingImages.length + newFiles.length;

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) onAddFiles(files);
  };

  return (
    <div>
      {total > 0 ? (
        <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
            {existingImages.map((url, i) => (
              <div key={`ex-${i}`} className="relative group">
                <img
                  src={url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => onRemoveExisting(i)}
                  className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={11} className="text-gray-600" />
                </button>
              </div>
            ))}
            {newFiles.map((f, i) => (
              <div key={`nw-${i}`} className="relative group">
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => onRemoveNew(i)}
                  className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={11} className="text-gray-600" />
                </button>
              </div>
            ))}
            {total < 10 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Plus size={20} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 cursor-pointer transition-colors py-10 px-4 flex flex-col items-center text-center"
        >
          <ImagePlus size={24} className="text-gray-400 mb-2" />
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Upload new
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Accepts images, up to 10 files
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length) onAddFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Tags input ────────────────────────────────────────────────────────────────

function TagsInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput("");
  };

  return (
    <div className="border border-gray-300 rounded-lg px-3 py-2 min-h-[38px]">
      <div className="flex flex-wrap gap-1.5 mb-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-md"
          >
            {tag}
            <button onClick={() => onChange(tags.filter((t) => t !== tag))}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
        className="text-sm text-gray-700 outline-none w-full placeholder-gray-400"
      />
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
          Add a title and description to see how this product might appear in a
          search engine listing
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
              placeholder="Product meta title"
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
              placeholder="Product meta description"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Meta keywords
            </label>
            <input
              value={(seo.metaKeywords || []).join(", ")}
              onChange={(e) =>
                onChange({
                  ...seo,
                  metaKeywords: e.target.value
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean),
                })
              }
              placeholder="keyword1, keyword2"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Variants section ──────────────────────────────────────────────────────────

function VariantsSection({ variants, onChange }) {
  const addVariant = () =>
    onChange([...variants, { type: "", options: [{ label: "" }] }]);

  const removeVariant = (vi) => onChange(variants.filter((_, i) => i !== vi));

  const setType = (vi, val) => {
    const next = [...variants];
    next[vi] = { ...next[vi], type: val };
    onChange(next);
  };

  const addOption = (vi) => {
    const next = [...variants];
    next[vi] = { ...next[vi], options: [...next[vi].options, { label: "" }] };
    onChange(next);
  };

  const removeOption = (vi, oi) => {
    const next = [...variants];
    next[vi] = {
      ...next[vi],
      options: next[vi].options.filter((_, i) => i !== oi),
    };
    onChange(next);
  };

  const setLabel = (vi, oi, val) => {
    const next = [...variants];
    const opts = [...next[vi].options];
    opts[oi] = { ...opts[oi], label: val };
    next[vi] = { ...next[vi], options: opts };
    onChange(next);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Variants</h3>
      <div className="space-y-3">
        {variants.map((v, vi) => (
          <div key={vi} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <GripVertical size={14} className="text-gray-300 shrink-0" />
              <input
                value={v.type}
                onChange={(e) => setType(vi, e.target.value)}
                placeholder="Option name (e.g., Size, Color)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <label className="block text-xs font-medium text-gray-600 mb-2 ml-6">
              Option values
            </label>
            <div className="space-y-2 ml-6">
              {v.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    value={opt.label}
                    onChange={(e) => setLabel(vi, oi, e.target.value)}
                    placeholder={`Value ${oi + 1}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  {v.options.length > 1 && (
                    <button
                      onClick={() => removeOption(vi, oi)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addOption(vi)}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors mt-1"
              >
                <Plus size={12} /> Add value
              </button>
            </div>
            <div className="mt-3 ml-6">
              <button
                onClick={() => removeVariant(vi)}
                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addVariant}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="w-4 h-4 flex items-center justify-center border border-gray-400 rounded-full">
            <Plus size={10} />
          </span>
          Add another option
        </button>
      </div>
    </div>
  );
}

// ── Ingredients + Benefits / How to use ───────────────────────────────────────

// Values map to the icons rendered on the storefront product detail page
const INGREDIENT_ICONS = [
  { value: "beaker", label: "Beaker", Icon: Beaker },
  { value: "droplet", label: "Droplet", Icon: Droplets },
  { value: "sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "zap", label: "Zap", Icon: Zap },
  { value: "leaf", label: "Leaf", Icon: Leaf },
  { value: "shield", label: "Shield", Icon: Shield },
  { value: "sun", label: "Sun", Icon: Sun },
  { value: "heart", label: "Heart", Icon: Heart },
];

function ProductContentSection({
  ingredientsTitle,
  ingredientCards,
  howToUse,
  onChangeTitle,
  onChangeCards,
  onChangeSteps,
}) {
  // Drag to reorder benefit cards — only the grip handle starts a drag so the
  // inputs inside the card keep normal text selection
  const dragFrom = useRef(null);
  const [dragHandle, setDragHandle] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDrop = (dropIndex) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragHandle(null);
    setDragOver(null);
    if (from == null || from === dropIndex) return;
    const next = [...ingredientCards];
    const [moved] = next.splice(from, 1);
    next.splice(dropIndex, 0, moved);
    onChangeCards(next);
  };

  const setCard = (index, key, val) => {
    const next = [...ingredientCards];
    next[index] = { ...next[index], [key]: val };
    onChangeCards(next);
  };

  const setStep = (index, val) => {
    const next = [...howToUse];
    next[index] = val;
    onChangeSteps(next);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Ingredients + Benefits
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Shown under the “Ingredients + Benefits” tab on the product page
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Ingredients heading
        </label>
        <input
          value={ingredientsTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Ingredients: Aqua, Niacinamide etc"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-medium text-gray-600">
          Benefit cards
        </label>
        {ingredientCards.length === 0 && (
          <p className="text-xs text-gray-400">
            No cards added — the product page will show its default cards.
          </p>
        )}
        {ingredientCards.map((card, i) => (
          <div
            key={i}
            draggable={dragHandle === i}
            onDragStart={() => {
              dragFrom.current = i;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(i);
            }}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              dragFrom.current = null;
              setDragHandle(null);
              setDragOver(null);
            }}
            className={`border rounded-lg p-4 transition-colors ${dragOver === i && dragFrom.current !== i
                ? "border-gray-400 bg-gray-50"
                : "border-gray-200"
              }`}
          >
            <div className="flex items-center gap-2">
              <span
                onMouseDown={() => setDragHandle(i)}
                onMouseUp={() => setDragHandle(null)}
                className="cursor-grab active:cursor-grabbing shrink-0"
              >
                <GripVertical size={14} className="text-gray-300" />
              </span>
              <input
                value={card.title || ""}
                onChange={(e) => setCard(i, "title", e.target.value)}
                placeholder="Ingredient name (e.g., Niacinamide)"
                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button
                type="button"
                onClick={() =>
                  onChangeCards(ingredientCards.filter((_, idx) => idx !== i))
                }
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <div className="ml-6 mt-3">
              <textarea
                value={card.text || ""}
                onChange={(e) => setCard(i, "text", e.target.value)}
                placeholder="What it does for the skin"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div className="ml-6 mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {INGREDIENT_ICONS.map(({ value, label, Icon }) => {
                  const active = (card.icon || "beaker") === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={active}
                      onClick={() => setCard(i, "icon", value)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${active
                          ? "border-gray-900 bg-gray-50 text-gray-900"
                          : "border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600"
                        }`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChangeCards([
              ...ingredientCards,
              { icon: "beaker", title: "", text: "" },
            ])
          }
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="w-4 h-4 flex items-center justify-center border border-gray-400 rounded-full">
            <Plus size={10} />
          </span>
          Add benefit card
        </button>
      </div>

      <div className="border-t border-gray-100 pt-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">How to use</h3>
          <p className="text-xs text-gray-400 mt-1">
            One step per line, shown as a numbered list on the product page
          </p>
        </div>
        {howToUse.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-6 shrink-0 pt-2 text-xs text-gray-400 text-right">
              {i + 1}.
            </span>
            <textarea
              value={step}
              onChange={(e) => setStep(i, e.target.value)}
              placeholder={`Step ${i + 1}`}
              rows={2}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 resize-none"
            />
            <button
              type="button"
              onClick={() => onChangeSteps(howToUse.filter((_, idx) => idx !== i))}
              className="text-gray-300 hover:text-red-500 transition-colors shrink-0 pt-2"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {howToUse.length === 0 && (
          <p className="text-xs text-gray-400">
            No steps added — the product page will show its default steps.
          </p>
        )}
        <button
          type="button"
          onClick={() => onChangeSteps([...howToUse, ""])}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="w-4 h-4 flex items-center justify-center border border-gray-400 rounded-full">
            <Plus size={10} />
          </span>
          Add step
        </button>
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-gray-900" : "bg-gray-200"
        }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"
          }`}
      />
    </button>
  );
}

export default function ProductForm({ mode = "add", id, toaster, loader }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { product, loading } = useSelector((s) => s.product);
  const { collections } = useSelector((s) => s.collection);
  const isEdit = mode === "edit";

  const defaultPkg = {
    type: "box",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "cm",
    emptyWeight: "",
    weightUnit: "kg",
    name: "",
    isDefault: false,
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    ingredientsTitle: "",
    ingredientCards: [],
    howToUse: [],
    price: "",
    compareAtPrice: "",
    chargeTax: true,
    costPerItem: "",
    discountType: "flat",
    discountValue: "",
    sku: "",
    barcode: "",
    continueSellingWhenOutOfStock: false,
    stock: 0,
    category: "",
    collections: [],
    brand: "",
    productType: "",
    skinType: "",
    skinConcerns: [],
    age: "",
    tags: [],
    weight: "",
    weightUnit: "kg",
    dimensions: { length: "", width: "", height: "" },
    package: { ...defaultPkg },
    countryOfOrigin: "",
    hsCode: "",
    seo: { metaTitle: "", metaDescription: "", metaKeywords: [] },
    status: "active",
    featured: false,
    variants: [],
    metafields: {},
    trackInventory: true,
    physicalProduct: true,
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [taxonomy, setTaxonomy] = useState({
    product_type: [],
    skin_type: [],
    skin_concern: [],
    age: [],
  });
  const [extraProductTypes, setExtraProductTypes] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [metafieldDefs, setMetafieldDefs] = useState([]);
  const [metafieldDefsLoading, setMetafieldDefsLoading] = useState(true);
  // Raw metafields as loaded from the product — used to preserve values whose
  // definition has since been deleted
  const [loadedMetafields, setLoadedMetafields] = useState([]);
  const [collectionsOpenSignal, setCollectionsOpenSignal] = useState(0);
  const [ready, setReady] = useState(!isEdit);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [customsOpen, setCustomsOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const setDim = (key, val) =>
    setForm((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [key]: val },
    }));

  const productTypeOptions = useMemo(() => {
    const merged = mergeOptions(
      DEFAULT_PRODUCT_TYPES,
      taxonomy.product_type,
      extraProductTypes,
      form.productType ? [form.productType] : [],
    );
    // "None" is pinned above the alphabetical list
    const none = merged.filter((o) => o.toLowerCase() === "none");
    return [...none, ...merged.filter((o) => o.toLowerCase() !== "none")];
  }, [taxonomy.product_type, extraProductTypes, form.productType]);

  const vendorOptions = useMemo(
    () => mergeOptions(brandOptions, form.brand ? [form.brand] : []),
    [brandOptions, form.brand],
  );

  // New product types are kept in the taxonomy so they show up next time
  const handleCreateProductType = async (value) => {
    const val = String(value || "").trim();
    if (!val) return;
    set("productType", val);
    setExtraProductTypes((prev) => [...prev, val]);
    try {
      await Api(
        "post",
        "product-taxonomy",
        { group: "product_type", value: val },
        router,
      );
    } catch {
      /* already exists or not permitted — keep it on this product anyway */
    }
  };

  useEffect(() => {
    dispatch(fetchCollections(router));
  }, []);

  // Vendor suggestions from brands already used by other products
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await Api("get", "products?limit=100", null, router);
        const list = res?.data?.data || res?.data || [];
        setBrandOptions(normalizeList(list.map((p) => p?.brand)));
      } catch {
        setBrandOptions([]);
      }
    };
    loadBrands();
  }, []);

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const groups = Object.keys(TAXONOMY_GROUPS);
        const results = await Promise.all(
          groups.map((g) =>
            Api(
              "get",
              `product-taxonomy?group=${encodeURIComponent(g)}`,
              null,
              router,
            ),
          ),
        );
        const next = {};
        groups.forEach((g, i) => {
          next[g] = normalizeList(results[i]?.data?.data || []);
        });
        setTaxonomy(next);
      } catch {
        setTaxonomy({
          product_type: [],
          skin_type: [],
          skin_concern: [],
          age: [],
        });
      }
    };
    loadTaxonomy();
  }, []);

  useEffect(() => {
    const loadMetafieldDefs = async () => {
      try {
        const res = await Api("get", "product-metafields", null, router);
        setMetafieldDefs(res?.data?.data || res?.data || []);
      } catch {
        setMetafieldDefs([]);
      } finally {
        setMetafieldDefsLoading(false);
      }
    };
    loadMetafieldDefs();
  }, []);

  const handleCreateMetafieldDefinition = async (payload) => {
    try {
      const res = await Api("post", "product-metafields", payload, router);
      const created = res?.data?.data || res?.data;
      if (!created?.key) throw new Error("Invalid response");
      setMetafieldDefs((prev) => [...prev, created]);
      toaster?.({ type: "success", message: "Metafield definition added" });
      return created;
    } catch (err) {
      toaster?.({
        type: "error",
        message: err?.message || "Could not add the metafield definition",
      });
      return null;
    }
  };

  useEffect(() => {
    if (!isEdit || !id) return;
    dispatch(fetchProductById(id, router)).then(() => setReady(true));
  }, [id]);

  useEffect(() => {
    if (!isEdit || !product) return;
    setForm({
      name: product.name || "",
      description: product.description || "",
      ingredientsTitle: product.ingredientsTitle || "",
      ingredientCards: (product.ingredientCards || []).map((c) => ({
        icon: c?.icon || "beaker",
        title: c?.title || "",
        text: c?.text || "",
      })),
      howToUse: Array.isArray(product.howToUse) ? product.howToUse : [],
      price: product.price ?? "",
      discountType: product.discountType || "flat",
      discountValue: product.discountValue ?? "",
      sku: product.sku || "",
      stock: product.stock ?? 0,
      category:
        typeof product.category === "string"
          ? product.category
          : product.category?.name || "",
      collections: (Array.isArray(product.collections) &&
        product.collections.length
        ? product.collections
        : product.collection
          ? [product.collection]
          : []
      )
        .map((c) => c?._id || c)
        .filter(Boolean),
      brand: product.brand || "",
      productType: product.productType || "",
      skinType: product.skinType || "",
      skinConcerns: product.skinConcerns || [],
      age: product.age || "",
      tags: product.tags || [],
      weight: product.weight ?? "",
      weightUnit: "kg",
      dimensions: {
        length: product.dimensions?.length ?? "",
        width: product.dimensions?.width ?? "",
        height: product.dimensions?.height ?? "",
      },
      seo: {
        metaTitle: product.seo?.metaTitle || "",
        metaDescription: product.seo?.metaDescription || "",
        metaKeywords: product.seo?.metaKeywords || [],
      },
      compareAtPrice: product.compareAtPrice ?? "",
      chargeTax: product.chargeTax ?? true,
      costPerItem: product.costPerItem ?? "",
      barcode: product.barcode || "",
      continueSellingWhenOutOfStock:
        product.continueSellingWhenOutOfStock || false,
      countryOfOrigin: product.countryOfOrigin || "",
      hsCode: product.hsCode || "",
      package: product.package
        ? { ...defaultPkg, ...product.package }
        : { ...defaultPkg },
      status: product.status || "active",
      featured: product.featured || false,
      variants: product.variants || [],
      metafields: metafieldsToValues(product.metafields),
      trackInventory: true,
      physicalProduct: true,
    });
    setLoadedMetafields(
      Array.isArray(product.metafields) ? product.metafields : [],
    );
    if (product.images?.length) setExistingImages(product.images);
    setReady(true);
  }, [product]);

  const handleAddFiles = (files) => {
    const remaining = 10 - existingImages.length - newImageFiles.length;
    setNewImageFiles((prev) =>
      [...prev, ...files].slice(0, prev.length + remaining),
    );
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toaster?.({ type: "error", message: "Product title is required" });
      return;
    }
    if (!form.productType.trim()) {
      toaster?.({ type: "error", message: "Product type is required" });
      return;
    }
    if (form.price === "" || form.price === null || form.price === undefined) {
      toaster?.({ type: "error", message: "Price is required" });
      return;
    }
    if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      toaster?.({
        type: "error",
        message: "Price must be a valid number (0 or more)",
      });
      return;
    }
    if (
      form.compareAtPrice !== "" &&
      Number(form.compareAtPrice) < Number(form.price)
    ) {
      toaster?.({
        type: "error",
        message: "Compare-at price should be higher than the selling price",
      });
      return;
    }
    if (form.costPerItem !== "" && isNaN(Number(form.costPerItem))) {
      toaster?.({
        type: "error",
        message: "Cost per item must be a valid number",
      });
      return;
    }
    if (
      form.discountValue !== "" &&
      (isNaN(Number(form.discountValue)) || Number(form.discountValue) < 0)
    ) {
      toaster?.({
        type: "error",
        message: "Discount value must be a valid non-negative number",
      });
      return;
    }
    if (
      form.stock !== "" &&
      (isNaN(Number(form.stock)) || Number(form.stock) < 0)
    ) {
      toaster?.({ type: "error", message: "Stock quantity must be 0 or more" });
      return;
    }
    // Validate variants — each type must be non-empty and have at least one option
    const invalidVariant = form.variants.find(
      (v) =>
        !v.type.trim() ||
        v.options.length === 0 ||
        v.options.some((o) => !o.label.trim()),
    );
    if (invalidVariant) {
      toaster?.({
        type: "error",
        message:
          "Each variant must have a name and at least one non-empty option",
      });
      return;
    }

    const metafieldError = validateMetafields(metafieldDefs, form.metafields);
    if (metafieldError) {
      toaster?.({ type: "error", message: metafieldError });
      return;
    }

    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages < 1) {
      toaster?.({ type: "error", message: "Please upload at least 1 product image" });
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("ingredientsTitle", form.ingredientsTitle);
    fd.append(
      "ingredientCards",
      JSON.stringify(
        form.ingredientCards
          .filter((c) => (c.title || "").trim() || (c.text || "").trim())
          .map((c) => ({
            icon: c.icon || "beaker",
            title: (c.title || "").trim(),
            text: (c.text || "").trim(),
          })),
      ),
    );
    fd.append(
      "howToUse",
      JSON.stringify(
        form.howToUse.map((s) => (s || "").trim()).filter(Boolean),
      ),
    );
    fd.append("price", form.price);
    if (form.compareAtPrice !== "")
      fd.append("compareAtPrice", form.compareAtPrice);
    fd.append("chargeTax", form.chargeTax);
    if (form.costPerItem !== "") fd.append("costPerItem", form.costPerItem);
    fd.append("discountType", form.discountType);
    if (form.discountValue !== "")
      fd.append("discountValue", form.discountValue);
    fd.append("sku", form.sku);
    fd.append("barcode", form.barcode);
    fd.append(
      "continueSellingWhenOutOfStock",
      form.continueSellingWhenOutOfStock,
    );
    fd.append("stock", form.stock);
    fd.append("collections", JSON.stringify(form.collections));
    // Keep the legacy single-collection field in sync with the first selection
    fd.append("collection", form.collections[0] || "");
    fd.append("brand", form.brand);
    fd.append("productType", form.productType);
    fd.append("skinType", form.skinType);
    fd.append("age", form.age);
    fd.append("skinConcerns", JSON.stringify(form.skinConcerns));
    fd.append("tags", JSON.stringify(form.tags));
    if (form.countryOfOrigin)
      fd.append("countryOfOrigin", form.countryOfOrigin);
    if (form.hsCode) fd.append("hsCode", form.hsCode);
    fd.append("package", JSON.stringify(form.package));
    if (form.weight !== "") fd.append("weight", form.weight);
    fd.append(
      "dimensions",
      JSON.stringify({
        length: form.dimensions.length || 0,
        width: form.dimensions.width || 0,
        height: form.dimensions.height || 0,
      }),
    );
    fd.append("seo", JSON.stringify(form.seo));
    fd.append("status", form.status);
    fd.append("featured", form.featured);
    const cleanVariants = form.variants
      .filter((v) => v.type.trim())
      .map((v) => ({
        type: v.type,
        options: v.options
          .filter((o) => o.label.trim())
          .map((o) => ({ label: o.label })),
      }));
    fd.append("variants", JSON.stringify(cleanVariants));

    // Only send metafields once the definitions are known — otherwise a failed
    // definitions request would wipe the values already stored on the product
    if (!metafieldDefsLoading) {
      const knownKeys = new Set(
        metafieldDefs.map((d) => `${d.namespace || "custom"}.${d.key}`),
      );
      const orphans = loadedMetafields.filter(
        (mf) => mf?.key && !knownKeys.has(`${mf.namespace || "custom"}.${mf.key}`),
      );
      fd.append(
        "metafields",
        JSON.stringify(
          buildMetafieldsPayload(metafieldDefs, form.metafields, orphans),
        ),
      );
    }

    if (isEdit) fd.append("existingImages", JSON.stringify(existingImages));
    newImageFiles.forEach((file) => fd.append("images", file));

    try {
      loader?.(true);
      const action = isEdit
        ? updateProductById(id, fd, router)
        : createProduct(fd, router);
      const res = await action(dispatch);
      if (res?.status) {
        toaster?.({
          type: "success",
          message: isEdit ? "Product updated" : "Product created",
        });
        router.push("/products");
      } else {
        toaster?.({ type: "error", message: res?.message || "Failed to save" });
      }
    } catch {
      toaster?.({ type: "error", message: "Something went wrong" });
    } finally {
      loader?.(false);
    }
  };

  if (isEdit && loading && !ready) {
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
          onClick={() => router.push("/products")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Tag size={15} />
          Products
        </button>
        <ChevronRight size={13} className="text-gray-400" />
        <span className="text-gray-900 font-medium truncate max-w-48">
          {isEdit ? form.name || "Edit product" : "Add product"}
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
                placeholder="Short sleeve t-shirt"
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

          {/* Media */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Media</h3>
            <MediaUpload
              existingImages={existingImages}
              newFiles={newImageFiles}
              onAddFiles={handleAddFiles}
              onRemoveExisting={(i) =>
                setExistingImages((p) => p.filter((_, idx) => idx !== i))
              }
              onRemoveNew={(i) =>
                setNewImageFiles((p) => p.filter((_, idx) => idx !== i))
              }
            />
          </div>

          {/* Product meta */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Product meta
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Skin Type
                </label>
                <select
                  value={form.skinType}
                  onChange={(e) => set("skinType", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                >
                  <option value="">Select</option>
                  {taxonomy.skin_type.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Age
                </label>
                <select
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                >
                  <option value="">Select</option>
                  {taxonomy.age.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <MultiSelect
              label="Skin Concerns"
              options={taxonomy.skin_concern}
              value={form.skinConcerns}
              onChange={(val) => set("skinConcerns", val)}
              placeholder="Add options in Product Categories"
              single
            />
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Price
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden max-w-xs">
                <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 text-sm text-gray-800 outline-none"
                />
              </div>
            </div>

            {/* Additional display prices */}
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => setPricingOpen((v) => !v)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>Additional display prices</span>
                {pricingOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {pricingOpen && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Compare-at price
                      </label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.compareAtPrice}
                          onChange={(e) =>
                            set("compareAtPrice", e.target.value)
                          }
                          placeholder="0.00"
                          className="flex-1 px-3 py-2 text-sm text-gray-800 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Discount
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={form.discountType}
                          onChange={(e) => set("discountType", e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-700 outline-none bg-white"
                        >
                          <option value="flat">₹</option>
                          <option value="percentage">%</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={form.discountValue}
                          onChange={(e) => set("discountValue", e.target.value)}
                          placeholder="0"
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.chargeTax}
                      onChange={(e) => set("chargeTax", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                    />
                    <span className="text-sm text-gray-700">
                      Charge tax on this product
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Cost per item */}
            <div className="border-t border-gray-100 pt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cost per item
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden max-w-xs">
                <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPerItem}
                  onChange={(e) => set("costPerItem", e.target.value)}
                  placeholder="—"
                  className="flex-1 px-3 py-2 text-sm text-gray-800 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Customers won't see this
              </p>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Inventory</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">Inventory tracked</span>
                <Toggle
                  checked={form.trackInventory}
                  onChange={(val) => set("trackInventory", val)}
                />
              </label>
            </div>
            {form.trackInventory && (
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                <div className="grid grid-cols-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-medium text-gray-600">
                    Location
                  </span>
                  <span className="text-xs font-medium text-gray-600 text-right">
                    Quantity
                  </span>
                </div>
                <div className="grid grid-cols-2 items-center px-4 py-2.5">
                  <span className="text-sm text-gray-700">Shop location</span>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                    className="ml-auto w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-800 outline-none text-right focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              </div>
            )}
            {/* More details */}
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => setInventoryOpen((v) => !v)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>More details</span>
                {inventoryOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {inventoryOpen && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        SKU (Stock Keeping Unit)
                      </label>
                      <input
                        value={form.sku}
                        onChange={(e) => set("sku", e.target.value)}
                        placeholder=""
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Barcode (ISBN, UPC, GTIN, etc.)
                      </label>
                      <input
                        value={form.barcode}
                        onChange={(e) => set("barcode", e.target.value)}
                        placeholder=""
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.continueSellingWhenOutOfStock}
                        onChange={(e) =>
                          set("continueSellingWhenOutOfStock", e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                      />
                      <span className="text-sm text-gray-700">
                        Continue selling when out of stock
                      </span>
                    </label>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      POS excluded
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Shipping</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">Physical product</span>
                <Toggle
                  checked={form.physicalProduct}
                  onChange={(val) => set("physicalProduct", val)}
                />
              </label>
            </div>

            {form.physicalProduct && (
              <>
                {/* Package */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Package
                  </label>
                  <button
                    onClick={() => setPackageModalOpen(true)}
                    className="flex items-center gap-2.5 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-base">
                      {PKG_TYPES.find((t) => t.value === form.package.type)
                        ?.icon || "📦"}
                    </span>
                    <span>
                      {form.package.name ||
                        PKG_TYPES.find((t) => t.value === form.package.type)
                          ?.label ||
                        "Box"}
                      {form.package.length &&
                        form.package.width &&
                        form.package.height
                        ? ` · ${form.package.length} × ${form.package.width} × ${form.package.height} ${form.package.dimensionUnit}`
                        : ""}
                    </span>
                  </button>
                </div>

                {/* Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Product weight
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.weight}
                      onChange={(e) => set("weight", e.target.value)}
                      placeholder="0.0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unit
                    </label>
                    <select
                      value={form.weightUnit}
                      onChange={(e) => set("weightUnit", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white"
                    >
                      {WEIGHT_UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Customs information */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setCustomsOpen((v) => !v)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span>Customs information</span>
                    {customsOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {customsOpen && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                          Country/Region of origin
                          <span
                            title="Where the product is manufactured or assembled"
                            className="w-3.5 h-3.5 flex items-center justify-center bg-gray-300 text-white rounded-full text-[9px] cursor-help"
                          >
                            i
                          </span>
                        </label>
                        <select
                          value={form.countryOfOrigin}
                          onChange={(e) =>
                            set("countryOfOrigin", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white"
                        >
                          <option value="">Select</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                          Harmonized System (HS) code
                          <span
                            title="A 6-digit international commodity code used for customs"
                            className="w-3.5 h-3.5 flex items-center justify-center bg-gray-300 text-white rounded-full text-[9px] cursor-help"
                          >
                            i
                          </span>
                        </label>
                        <input
                          value={form.hsCode}
                          onChange={(e) => set("hsCode", e.target.value)}
                          placeholder="Enter a 6-digit code or search by keyword"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Package modal */}
          {packageModalOpen && (
            <PackageModal
              pkg={form.package}
              onSave={(pkg) => set("package", pkg)}
              onClose={() => setPackageModalOpen(false)}
            />
          )}

          {/* Ingredients + Benefits / How to use */}
          <ProductContentSection
            ingredientsTitle={form.ingredientsTitle}
            ingredientCards={form.ingredientCards}
            howToUse={form.howToUse}
            onChangeTitle={(val) => set("ingredientsTitle", val)}
            onChangeCards={(val) => set("ingredientCards", val)}
            onChangeSteps={(val) => set("howToUse", val)}
          />

          {/* Variants */}
          <VariantsSection
            variants={form.variants}
            onChange={(val) => set("variants", val)}
          />

          {/* Product metafields */}
          <ProductMetafieldsSection
            definitions={metafieldDefs}
            values={form.metafields}
            loading={metafieldDefsLoading}
            onChange={(val) => set("metafields", val)}
            onCreateDefinition={handleCreateMetafieldDefinition}
          />

          {/* SEO */}
          <SeoSection seo={form.seo} onChange={(val) => set("seo", val)} />
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-full lg:w-72 lg:shrink-0 space-y-4">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Publishing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Publishing
            </h3>
            <p className="text-sm text-gray-600">All channels</p>
          </div>

          {/* Product organization */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Product organization
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Type
              </label>
              <SearchSelect
                value={form.productType}
                onChange={(val) => set("productType", val)}
                onCreate={handleCreateProductType}
                options={productTypeOptions}
                placeholder="Search or add product type"
                emptyLabel="No product types found"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Vendor / Brand
              </label>
              <SearchSelect
                value={form.brand}
                onChange={(val) => set("brand", val)}
                onCreate={(val) => set("brand", val)}
                options={vendorOptions}
                placeholder="Search or add vendor"
                emptyLabel="No vendors found"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600">
                  Collections
                </label>
                <button
                  type="button"
                  onClick={() => setCollectionsOpenSignal((v) => v + 1)}
                  title="Add collection"
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <PlusCircle size={15} />
                </button>
              </div>
              <CollectionsPicker
                collections={collections}
                value={form.collections}
                onChange={(val) => set("collections", val)}
                openSignal={collectionsOpenSignal}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tags
              </label>
              <TagsInput
                tags={form.tags}
                onChange={(val) => set("tags", val)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900"
              />
              <span className="text-sm text-gray-700">Featured product</span>
            </label>
          </div>

          {/* Theme template */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Theme template
            </h3>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white">
              <option>Default product</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="mt-8 flex justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/products")}
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
