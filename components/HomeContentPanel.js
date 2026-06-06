import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ImagePlus, Trash2, ToggleLeft, ToggleRight, Edit } from "lucide-react";
import { Api, ApiFormData } from "@/services/service";

const TABS = [
  { id: "hero", label: "Hero slides" },
  { id: "brand", label: "Brand logos" },
];

function mediaSrc(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return path;
}

export default function HomeContentPanel({ toaster, embedded = false }) {
  const router = useRouter();
  const [tab, setTab] = useState("hero");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [position, setPosition] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Api("get", `banners?type=${tab}&limit=50&sort=position`, "", router);
      if (res?.status) {
        setItems(res.data?.data || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
      toaster?.({ type: "error", message: "Failed to load banners" });
    } finally {
      setLoading(false);
    }
  }, [tab, router, toaster]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setTitle("");
    setLink("");
    setPosition(0);
    setImageFile(null);
    setPreview("");
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setTitle(item.title || "");
    setLink(item.link || "");
    setPosition(item.position ?? 0);
    setPreview(mediaSrc(item.image));
    setImageFile(null);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!editingId && !imageFile) {
      toaster?.({ type: "error", message: "Image is required" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (title?.trim?.()) fd.append("title", title.trim());
      if (!editingId) fd.append("type", tab);
      fd.append("position", String(position || 0));
      if (!editingId) fd.append("status", "active");
      if (link?.trim?.()) fd.append("link", link.trim());
      if (imageFile) fd.append("image", imageFile);

      const method = editingId ? "put" : "post";
      const endpoint = editingId ? `banners/${editingId}` : "banners";
      const res = await ApiFormData(method, endpoint, fd, router);

      if (res?.status) {
        toaster?.({
          type: "success",
          message: editingId ? "Updated successfully" : "Saved successfully"
        });
        resetForm();
        loadItems();
      } else {
        console.error("API Error:", res);
        toaster?.({ type: "error", message: res?.message || "Could not save" });
      }
    } catch (err) {
      console.error("Request Error:", err);
      toaster?.({ type: "error", message: err?.message || "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await Api("patch", `banners/${id}/toggle`, {}, router);
      if (res?.status) loadItems();
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not update status" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await Api("delete", `banners/${id}`, "", router);
      if (res?.status) {
        toaster?.({ type: "success", message: "Deleted" });
        loadItems();
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not delete" });
    }
  };

  return (
    <div className={embedded ? "" : "p-4 sm:p-6 max-w-5xl"}>
      {!embedded && (
        <>
          <h1 className="text-lg font-semibold text-gray-900">Homepage content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage hero carousel images and brand logos shown on the storefront home page.
          </p>
        </>
      )}

      <div className={`flex gap-2 border-b border-gray-200 ${embedded ? "mt-0" : "mt-5"}`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              resetForm();
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 bg-white rounded-xl border border-gray-200 p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {editingId ? "Edit" : "Add"} {tab === "hero" ? "hero slide" : "brand logo"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => resetForm()}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>

        <div className={tab === "brand" ? "max-w-xs" : "grid gap-4 sm:grid-cols-2"}>
          {tab === "hero" && (
            <div>
              <label className="text-xs font-medium text-gray-700">
                Title <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Admin label only — not shown on site"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-700">Sort order</label>
            <input
              type="number"
              min={0}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value) || 0)}
              className="mt-1 w-full text-gray-700 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {tab === "brand" && (
          <p className="text-xs text-gray-500">
            Upload logo image only. Text on the image is fine — no title needed.
          </p>
        )}

        <div>
          <label className="text-xs font-medium text-gray-700">Link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Image</label>
          <label className="mt-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:bg-gray-50">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="max-h-32 object-contain" />
            ) : (
              <>
                <ImagePlus size={24} className="text-gray-400" />
                <span className="text-xs text-gray-500">Click to upload image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          </label>
          <p className="mt-1 text-xs text-gray-400">
            {tab === "hero"
              ? "Upload full-width hero image. Text can be part of the image — title is optional."
              : "PNG or JPG with transparent background works best for logos."}
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
        >
          {saving ? "Saving…" : editingId ? "Update" : "Add"}
        </button>
      </form>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Published items</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No items yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item._id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-24 h-14 shrink-0 rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaSrc(item.image)}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title?.trim() || (tab === "brand" ? "Logo image" : "Hero slide")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Order: {item.position ?? 0} · {item.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-500 hover:text-gray-800"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(item._id)}
                    className="p-2 text-gray-500 hover:text-gray-800"
                    title="Toggle active"
                  >
                    {item.status === "active" ? (
                      <ToggleRight size={20} className="text-green-600" />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
