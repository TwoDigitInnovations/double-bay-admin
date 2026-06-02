import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Layers, Plus, Trash2 } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table from "@/components/table";
import { Api } from "@/services/service";

function ShopConcerns({ toaster }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Api("get", "concerns?limit=100&sort=position", "", router);
      if (res?.status) {
        setItems(res.data?.data || []);
      } else {
        setItems([]);
      }
    } catch {
      toaster?.({ type: "error", message: "Failed to load concerns" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [router, toaster]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete this concern?")) return;
    try {
      const res = await Api("delete", `concerns/${itemId}`, "", router);
      if (res?.status) {
        toaster?.({ type: "success", message: "Deleted" });
        loadItems();
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
        Cell: ({ value }) => <span className="text-sm font-medium text-gray-900">{value}</span>,
      },
      {
        Header: "Slug",
        accessor: "slug",
        Cell: ({ value }) => <span className="text-sm text-gray-600 font-mono">{value}</span>,
      },
      {
        Header: "Order",
        accessor: "position",
        Cell: ({ value }) => <span className="text-sm text-gray-600">{value ?? 0}</span>,
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => <span className="text-sm capitalize text-gray-600">{value}</span>,
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
          <Layers size={18} className="text-gray-700" />
          Shop concerns
        </h1>
        <button
          type="button"
          onClick={() => router.push("/shop-concerns/add")}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-1.5 rounded-lg"
        >
          <Plus size={16} />
          New concern
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={items}
          onRowClick={(row) => router.push(`/shop-concerns/${row._id}`)}
        />
      )}
    </div>
  );
}

export default isAuth(ShopConcerns);
