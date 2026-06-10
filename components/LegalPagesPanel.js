import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Api } from "@/services/service";

const RichTextEditor = dynamic(() => import("@/components/JoditEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
  ),
});

const TABS = [
  { slug: "refund-policy", label: "Refund Policy" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "shipping-policy", label: "Shipping Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
];

export default function LegalPagesPanel({ toaster }) {
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState(TABS[0].slug);
  const [pagesBySlug, setPagesBySlug] = useState({});
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Api("get", "cms/policies", "", router);
      if (res?.status) {
        const list = res.data?.data || [];
        const map = {};
        list.forEach((p) => {
          map[p.slug] = p;
        });
        setPagesBySlug(map);
      }
    } catch {
      toaster?.({ type: "error", message: "Failed to load policy pages" });
    } finally {
      setLoading(false);
    }
  }, [router, toaster]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useEffect(() => {
    const page = pagesBySlug[activeSlug];
    setContent(page?.content || "");
  }, [activeSlug, pagesBySlug]);

  const handleSave = async () => {
    const page = pagesBySlug[activeSlug];
    
    if (!page?._id) {
      toaster?.({ type: "error", message: "Page not found. Refresh and try again." });
      return;
    }

    setSaving(true);
    try {
      const res = await Api(
        "put",
        `cms/${page._id}`,
        { content, title: page.title },
        router,
      );
      if (res?.status) {
        const updated = res.data?.data || res.data;
        setPagesBySlug((prev) => ({
          ...prev,
          [activeSlug]: { ...prev[activeSlug], ...updated, content },
        }));
        toaster?.({ type: "success", message: "Policy saved" });
      } else {
        toaster?.({ type: "error", message: res?.message || "Could not save" });
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  const activeLabel = TABS.find((t) => t.slug === activeSlug)?.label || "";

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActiveSlug(tab.slug)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeSlug === tab.slug
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        {loading ? (
          <div className="h-[360px] rounded-lg bg-gray-100 animate-pulse" />
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              Editing: <span className="font-medium text-gray-800">{activeLabel}</span>
            </p>
            <RichTextEditor
              key={activeSlug}
              value={content}
              onChange={setContent}
              placeholder={`Write ${activeLabel} content…`}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
