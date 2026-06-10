import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Api, ApiFormData } from "@/services/service";

const RichTextEditor = dynamic(() => import("@/components/JoditEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
  ),
});

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function mediaPreviewUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = "http://localhost:8001".replace(/\/$/, "");
  return `${base}/${String(path).replace(/^\//, "")}`;
}

export default function ConcernForm({ mode = "create", id, toaster, loader }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [position, setPosition] = useState(0);
  const [status, setStatus] = useState("active");
  const [isNew, setIsNew] = useState(false);
  const [content, setContent] = useState("");
  const [cardFile, setCardFile] = useState(null);
  const [cardPreview, setCardPreview] = useState("");
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const autoSlug = useMemo(() => slugify(title), [title]);

  const loadConcern = useCallback(async () => {
    if (!id) return;
    loader?.(true);
    try {
      const res = await Api("get", `concerns/${id}`, "", router);
      if (res?.status && res.data?.data) {
        const c = res.data.data;
        setTitle(c.title || "");
        setSlug(c.slug || "");
        setPosition(c.position ?? 0);
        setStatus(c.status || "active");
        setIsNew(Boolean(c.isNew));
        setContent(c.content || "");
        if (c.cardImage) setCardPreview(mediaPreviewUrl(c.cardImage));
        if (c.heroImage) setHeroPreview(mediaPreviewUrl(c.heroImage));
      }
    } catch {
      toaster?.({ type: "error", message: "Failed to load concern" });
    } finally {
      loader?.(false);
    }
  }, [id, router, toaster, loader]);

  useEffect(() => {
    if (mode === "edit") loadConcern();
  }, [mode, loadConcern]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toaster?.({ type: "error", message: "Title is required" });
      return;
    }
    if (mode === "create" && !cardFile) {
      toaster?.({ type: "error", message: "Grid image is required" });
      return;
    }
    if (!content.trim()) {
      toaster?.({ type: "error", message: "Article content is required" });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("slug", (slug.trim() || autoSlug).toLowerCase());
      fd.append("position", String(position));
      fd.append("status", status);
      fd.append("isNew", isNew ? "true" : "false");
      fd.append("content", content);
      if (cardFile) fd.append("cardImage", cardFile);
      if (heroFile) fd.append("heroImage", heroFile);

      const res =
        mode === "edit"
          ? await ApiFormData("put", `concerns/${id}`, fd, router)
          : await ApiFormData("post", "concerns/", fd, router);

      if (res?.status) {
        toaster?.({
          type: "success",
          message: mode === "edit" ? "Updated" : "Created",
        });
        router.push("/shop-concerns");
      } else {
        toaster?.({ type: "error", message: res?.message || "Could not save" });
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/shop-concerns" className="hover:text-gray-800">
          Shop concerns
        </Link>
        <span>/</span>
        <span className="text-gray-900">
          {mode === "edit" ? "Edit" : "New"}
        </span>
      </div>

      <h1 className="text-lg font-semibold text-gray-900">
        {mode === "edit" ? "Edit shop concern" : "New shop concern"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Homepage grid image, hero image, and full article (Jodit) for the detail
        page.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="text-xs font-medium text-gray-700">
            Title (hero card)
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={autoSlug || "auto-from-title"}
              className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">
              Sort order
            </label>
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show &quot;New!&quot; badge on detail page
        </label>

        <div>
          <label className="text-xs font-medium text-gray-700">
            Grid image (homepage)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCardFile(file);
              setCardPreview(URL.createObjectURL(file));
            }}
            className="mt-1 block w-full text-sm text-gray-700"
          />
          {cardPreview ? (
            <img
              src={cardPreview}
              alt=""
              className="mt-3 h-32 rounded-lg border object-cover"
            />
          ) : null}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">
            Hero image (detail page)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setHeroFile(file);
              setHeroPreview(URL.createObjectURL(file));
            }}
            className="mt-1 block w-full text-sm text-gray-700"
          />
          {heroPreview ? (
            <img
              src={heroPreview}
              alt=""
              className="mt-3 h-40 rounded-2xl border object-cover"
            />
          ) : null}
          <p className="mt-1 text-xs text-gray-400">
            Leave empty to use grid image on detail page.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">
            Article content
          </label>
          <div className="mt-1">
            <RichTextEditor
              value={content}
              onChange={setContent}
              height={420}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link
            href="/shop-concerns"
            className="border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
