import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { MessageCircleQuestion, Trash2, X, Mail } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table from "@/components/table";
import { Api, timeSince } from "@/services/service";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "read", label: "Read" },
  { id: "answered", label: "Answered" },
  { id: "archived", label: "Archived" },
];

const STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700 border-blue-100",
  read: "bg-yellow-50 text-yellow-700 border-yellow-100",
  answered: "bg-green-50 text-green-700 border-green-100",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusPill({ value }) {
  const status = value || "new";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${STATUS_STYLES[status] || STATUS_STYLES.archived
        }`}
    >
      {status}
    </span>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function QuestionModal({ question, onClose, onSave, onDelete, saving }) {
  const [answer, setAnswer] = useState(question.answer || "");

  const formattedDate = question.createdAt
    ? new Date(question.createdAt).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-full overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {question.name}
            </h2>
            <a
              href={`mailto:${question.email}`}
              className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <Mail size={13} />
              {question.email}
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill value={question.status} />
            <span className="text-xs text-gray-400">{formattedDate}</span>
            {question.source && (
              <span className="text-xs text-gray-400">via {question.source}</span>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Question
            </p>
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {question.question}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Response
            </label>
            <textarea
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter a message"
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400"
            />
            {question.answeredBy?.fullname && question.answeredAt && (
              <p className="mt-1.5 text-xs text-gray-400">
                Last answered by {question.answeredBy.fullname} ·{" "}
                {timeSince(question.answeredAt)}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={() => onDelete(question)}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 size={14} />
            Delete
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {question.status !== "archived" && (
              <button
                disabled={saving}
                onClick={() => onSave(question._id, { status: "archived" })}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Archive
              </button>
            )}
            <button
              disabled={saving}
              onClick={() =>
                onSave(question._id, { answer, status: "answered" })
              }
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function FaqQuestions({ toaster }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [search]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", status });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await Api("get", `faq-questions?${params.toString()}`, "", router);
      if (res?.status) {
        setItems(res.data?.data || []);
        setCounts(res.data?.counts || {});
        setPagination(res.data?.pagination || { currentPage: 1, totalPages: 1, total: 0 });
      } else {
        setItems([]);
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Failed to load questions" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch, router, toaster]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const openQuestion = async (row) => {
    setSelected(row);
    // First open marks it as read so the "New" tab stays meaningful.
    if (row.status === "new") {
      try {
        await Api("put", `faq-questions/${row._id}`, { status: "read" }, router);
        setSelected((current) =>
          current?._id === row._id ? { ...current, status: "read" } : current,
        );
        loadItems();
      } catch {
        // Non-critical — the admin can still read and action the question.
      }
    }
  };

  const handleSave = async (id, payload) => {
    setSaving(true);
    try {
      const res = await Api("put", `faq-questions/${id}`, payload, router);
      if (res?.status) {
        toaster?.({ type: "success", message: "Question updated" });
        setSelected(null);
        loadItems();
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not update question" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      const res = await Api("delete", `faq-questions/${row._id}`, "", router);
      if (res?.status) {
        toaster?.({ type: "success", message: "Question deleted" });
        setSelected(null);
        loadItems();
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not delete question" });
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "From",
        accessor: "name",
        Cell: ({ value, row }) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-44">
              {value || "—"}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-44">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        Header: "Question",
        accessor: "question",
        Cell: ({ value }) => (
          <span className="block max-w-md truncate text-sm text-gray-700">{value}</span>
        ),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => <StatusPill value={value} />,
      },
      {
        Header: "Received",
        accessor: "createdAt",
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">{value ? timeSince(value) : "—"}</span>
        ),
      },
      {
        Header: "",
        id: "_actions",
        disableSortBy: true,
        Cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original);
            }}
            className="p-2 text-gray-400 hover:text-red-600"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
    ],
    [loadItems],
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <MessageCircleQuestion size={18} className="text-gray-700" />
            Customer questions
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 ml-7">
            Questions submitted from the storefront FAQ section
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or question"
          className="w-full sm:w-72 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-gray-400"
        />
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatus(tab.id);
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${status === tab.id
              ? "bg-gray-900 text-white font-medium"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span
                className={`ml-1.5 text-xs ${status === tab.id ? "text-white/70" : "text-gray-400"
                  }`}
              >
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={items}
          onRowClick={openQuestion}
          disableClientPagination
          total={pagination.total}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onNextPage={() => setPage((p) => p + 1)}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          emptyComponent={
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-gray-700">No questions yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Questions asked from the storefront FAQ section will appear here.
              </p>
            </div>
          }
        />
      )}

      {selected && (
        <QuestionModal
          question={selected}
          saving={saving}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default isAuth(FaqQuestions);
