import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Api, ApiFormData } from "@/services/service";

const CATEGORIES = ["Patients", "Providers", "Security", "Tips"];
const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
const ICONS = [
  { value: "check", label: "✓ Check" },
  { value: "triangle", label: "△ Triangle" },
  { value: "sun", label: "☼ Sun" },
  { value: "dot", label: "● Dot" },
];

const emptyItem = () => ({ icon: "check", title: "", description: "" });
const emptySection = () => ({
  heading: "",
  intro: "",
  subheading: "",
  items: [emptyItem()],
  image: "",
  position: 0,
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

export default function LearnBlogForm({ mode = "create", id, toaster, loader }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Patients");
  const [excerpt, setExcerpt] = useState("");
  const [articleIntro, setArticleIntro] = useState("");
  const [sections, setSections] = useState([emptySection()]);
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newContentImages, setNewContentImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadBlog = useCallback(async () => {
    if (!id) return;
    loader?.(true);
    try {
      const res = await Api("get", `blogs/${id}`, "", router);
      if (res?.status && res.data?.data) {
        const b = res.data.data;
        setTitle(b.title || "");
        setSlug(b.slug || "");
        setCategory(b.category || "Patients");
        setExcerpt(b.excerpt || "");
        setArticleIntro(b.articleIntro || "");
        setStatus(b.status || "draft");
        setFeatured(Boolean(b.featured));
        if (b.thumbnail) setThumbnailPreview(mediaPreviewUrl(b.thumbnail));
        setExistingImages(
          (b.images || []).map((src) => ({ src, preview: mediaPreviewUrl(src) })),
        );
        if (b.articleSections?.length) {
          setSections(
            b.articleSections.map((s, i) => ({
              heading: s.heading || "",
              intro: s.intro || "",
              subheading: s.subheading || "",
              image: s.image || "",
              imagePreview: s.image ? mediaPreviewUrl(s.image) : "",
              position: s.position ?? i,
              items: (s.items || []).length
                ? s.items.map((item) => ({
                    icon: item.icon || "check",
                    title: item.title || "",
                    description: item.description || "",
                  }))
                : [emptyItem()],
            })),
          );
        }
      }
    } catch {
      toaster?.({ type: "error", message: "Failed to load blog" });
    } finally {
      loader?.(false);
    }
  }, [id, router, toaster, loader]);

  useEffect(() => {
    if (mode === "edit") loadBlog();
  }, [mode, loadBlog]);

  const autoSlug = useMemo(() => slugify(title), [title]);

  const addSection = () => setSections((prev) => [...prev, emptySection()]);

  const updateSection = (index, field, value) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeSection = (index) => {
    setSections((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const addItem = (sectionIndex) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex ? { ...s, items: [...s.items, emptyItem()] } : s,
      ),
    );
  };

  const updateItem = (sectionIndex, itemIndex, field, value) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          items: s.items.map((item, j) => (j === itemIndex ? { ...item, [field]: value } : item)),
        };
      }),
    );
  };

  const removeItem = (sectionIndex, itemIndex) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        const items = s.items.length <= 1 ? s.items : s.items.filter((_, j) => j !== itemIndex);
        return { ...s, items };
      }),
    );
  };

  const onThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const onContentImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewContentImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toaster?.({ type: "error", message: "Title is required" });
      return;
    }
    if (!articleIntro.trim() && !sections.some((s) => s.heading.trim())) {
      toaster?.({ type: "error", message: "Add intro or at least one section" });
      return;
    }

    const payloadSections = sections.map((s, index) => ({
      heading: s.heading.trim(),
      intro: s.intro.trim(),
      subheading: s.subheading.trim(),
      image: s.image || "",
      position: index,
      items: s.items
        .filter((item) => item.description.trim() || item.title.trim())
        .map((item) => ({
          icon: item.icon || "check",
          title: item.title.trim(),
          description: item.description.trim(),
        })),
    }));

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("slug", (slug.trim() || autoSlug).toLowerCase());
      fd.append("category", category);
      fd.append("excerpt", excerpt.trim());
      fd.append("articleIntro", articleIntro.trim());
      fd.append("articleSections", JSON.stringify(payloadSections));
      fd.append("status", status);
      fd.append("featured", featured ? "true" : "false");
      fd.append("existingImages", JSON.stringify(existingImages.map((img) => img.src)));
      if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
      newContentImages.forEach((img) => fd.append("contentImages", img.file));

      const res =
        mode === "edit"
          ? await ApiFormData("put", `blogs/${id}`, fd, router)
          : await ApiFormData("post", "blogs/", fd, router);

      if (res?.status) {
        toaster?.({ type: "success", message: mode === "edit" ? "Blog updated" : "Blog created" });
        router.push("/learn");
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
        <Link href="/learn" className="hover:text-gray-800">
          Learn
        </Link>
        <span>/</span>
        <span className="text-gray-900">{mode === "edit" ? "Edit post" : "New post"}</span>
      </div>

      <h1 className="text-lg font-semibold text-gray-900">
        {mode === "edit" ? "Edit blog post" : "Create blog post"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Hero image, intro paragraphs, sections with ✦ headings, and optional full-width images.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="text-xs font-medium text-gray-700">Title (hero card)</label>
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
            <label className="text-xs font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Excerpt (cards / featured)</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Hero image</label>
          <input
            type="file"
            accept="image/*"
            onChange={onThumbnailChange}
            className="mt-1 block w-full text-sm text-gray-700"
          />
          {thumbnailPreview ? (
            <img
              src={thumbnailPreview}
              alt=""
              className="mt-3 h-40 w-auto rounded-lg border border-gray-200 object-cover"
            />
          ) : null}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">Intro paragraphs (centered text)</label>
          <textarea
            value={articleIntro}
            onChange={(e) => setArticleIntro(e.target.value)}
            rows={6}
            placeholder="Separate paragraphs with a blank line"
            className="mt-1 w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-700">
            Extra full-width images (text inside image OK)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onContentImagesChange}
            className="mt-1 block w-full text-sm text-gray-700"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            {existingImages.map((img, i) => (
              <div key={`ex-${i}`} className="relative">
                <img src={img.preview} alt="" className="h-20 rounded border object-contain" />
                <button
                  type="button"
                  onClick={() => setExistingImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-500 shadow"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {newContentImages.map((img, i) => (
              <div key={`new-${i}`} className="relative">
                <img src={img.preview} alt="" className="h-20 rounded border object-contain" />
                <button
                  type="button"
                  onClick={() => setNewContentImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-500 shadow"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Article sections</label>
            <button
              type="button"
              onClick={addSection}
              className="flex items-center gap-1 text-xs font-medium text-gray-700"
            >
              <Plus size={14} />
              Add section
            </button>
          </div>

          <div className="mt-3 space-y-5">
            {sections.map((section, sIndex) => (
              <div key={sIndex} className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-600">Section {sIndex + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSection(sIndex)}
                    className="text-red-500 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={section.heading}
                  onChange={(e) => updateSection(sIndex, "heading", e.target.value)}
                  placeholder="✦ Heading e.g. 1. Cleanse Without Compromising Your Barrier"
                  className="w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <textarea
                  value={section.intro}
                  onChange={(e) => updateSection(sIndex, "intro", e.target.value)}
                  placeholder="Intro paragraph"
                  rows={3}
                  className="w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  value={section.subheading}
                  onChange={(e) => updateSection(sIndex, "subheading", e.target.value)}
                  placeholder="Subheading e.g. Start with:"
                  className="w-full border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
                />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">List items</span>
                    <button
                      type="button"
                      onClick={() => addItem(sIndex)}
                      className="text-xs text-gray-700 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Add item
                    </button>
                  </div>
                  {section.items.map((item, iIndex) => (
                    <div key={iIndex} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                      <select
                        value={item.icon}
                        onChange={(e) => updateItem(sIndex, iIndex, "icon", e.target.value)}
                        className="sm:col-span-2 border text-gray-700 border-gray-300 rounded-lg px-2 py-2 text-sm bg-white"
                      >
                        {ICONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        value={item.title}
                        onChange={(e) => updateItem(sIndex, iIndex, "title", e.target.value)}
                        placeholder="Bold title (optional)"
                        className="sm:col-span-3 border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(sIndex, iIndex, "description", e.target.value)}
                        placeholder="Description"
                        className="sm:col-span-6 border text-gray-700 border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(sIndex, iIndex)}
                        className="sm:col-span-1 text-red-500 p-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded border-gray-300"
          />
          Featured post
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <Link
            href="/learn"
            className="border border-gray-300 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
