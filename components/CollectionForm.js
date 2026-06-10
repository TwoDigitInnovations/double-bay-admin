import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  fetchCollectionById,
  createCollection,
  updateCollectionById,
} from "@/redux/actions/collectionActions";

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

function ProductsSection() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Products</h3>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 border border-gray-300 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            placeholder="Search products"
            className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 min-w-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 sm:flex-none border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Browse
          </button>
          <select className="flex-1 sm:flex-none border border-gray-300 bg-white text-sm text-gray-700 px-3 py-2 rounded-lg outline-none">
            <option>Sort: Most relevant</option>
            <option>Sort: Title A–Z</option>
            <option>Sort: Price low–high</option>
            <option>Sort: Best selling</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-10 text-center border border-gray-100 rounded-xl bg-gray-50">
        <Tag size={32} className="text-gray-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-600">
          There are no products in this collection.
        </p>
        <p className="text-sm text-gray-400">
          Search or browse to add products.
        </p>
      </div>
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
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ready, setReady] = useState(!isEdit);

  // Fetch and prefill for edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    dispatch(fetchCollectionById(id, router)).then(() => setReady(true));
  }, [id]);

  useEffect(() => {
    if (!isEdit || !collection) return;
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
    });
    if (collection.image) setImagePreview(collection.image);
    setReady(true);
  }, [collection]);

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
          {form.type === "manual" && <ProductsSection />}

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
