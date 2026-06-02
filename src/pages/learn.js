import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table from "@/components/table";
import { Api } from "@/services/service";

function Learn({ toaster }) {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Api("get", "blogs?limit=100&sort=-createdAt", "", router);
      if (res?.status) {
        setBlogs(res.data?.data || []);
      } else {
        setBlogs([]);
      }
    } catch {
      toaster?.({ type: "error", message: "Failed to load blogs" });
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [router, toaster]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const handleDelete = async (blogId) => {
    if (!window.confirm("Delete this blog post?")) return;
    try {
      const res = await Api("delete", `blogs/${blogId}`, "", router);
      if (res?.status) {
        toaster?.({ type: "success", message: "Deleted" });
        loadBlogs();
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not delete" });
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Title",
        accessor: "title",
        Cell: ({ value }) => (
          <span className="text-sm font-medium text-gray-900 line-clamp-2">{value}</span>
        ),
      },
      {
        Header: "Category",
        accessor: "category",
        Cell: ({ value }) => <span className="text-sm text-gray-600">{value || "—"}</span>,
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span className="text-sm capitalize text-gray-600">{value || "draft"}</span>
        ),
      },
      {
        Header: "Featured",
        accessor: "featured",
        Cell: ({ value }) => (
          <span className="text-sm text-gray-600">{value ? "Yes" : "No"}</span>
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
              handleDelete(row.original._id);
            }}
            className="p-2 text-red-500 hover:text-red-700"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <BookOpen size={18} className="text-gray-700" />
          Learn
        </h1>
        <button
          type="button"
          onClick={() => router.push("/learn/add")}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
        >
          <Plus size={16} />
          New post
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={blogs}
          onRowClick={(row) => router.push(`/learn/${row._id}`)}
        />
      )}
    </div>
  );
}

export default isAuth(Learn);
