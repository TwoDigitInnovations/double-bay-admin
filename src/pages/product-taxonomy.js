import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Layers, Plus, Trash2 } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table from "@/components/table";
import { Api } from "@/services/service";

const GROUPS = [
  { key: "product_type", label: "Product type" },
  { key: "skin_type", label: "Skin Type" },
  { key: "skin_concern", label: "Skin Concerns" },
  { key: "age", label: "Age" },
];

function sortItems(items) {
  return [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || String(a.value).localeCompare(String(b.value)));
}

function ProductTaxonomyPage({ toaster }) {
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState("product_type");
  const [items, setItems] = useState([]);
  const [value, setValue] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(true);

  const activeLabel = useMemo(() => GROUPS.find((g) => g.key === activeGroup)?.label || "", [activeGroup]);

  const load = useCallback(
    async (group) => {
      setLoading(true);
      try {
        const res = await Api("get", `product-taxonomy?group=${encodeURIComponent(group)}`, "", router);
        if (res?.status) {
          setItems(sortItems(res.data?.data || []));
        } else {
          setItems([]);
        }
      } catch {
        toaster?.({ type: "error", message: "Failed to load categories" });
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [router, toaster],
  );

  useEffect(() => {
    load(activeGroup);
  }, [activeGroup, load]);

  const create = async () => {
    const v = value.trim();
    if (!v) return;
    try {
      const res = await Api(
        "post",
        "product-taxonomy",
        { group: activeGroup, value: v, position: position === "" ? 0 : Number(position) },
        router,
      );
      if (res?.status) {
        toaster?.({ type: "success", message: "Added" });
      }
      setValue("");
      setPosition("");
      await load(activeGroup);
    } catch (e) {
      toaster?.({ type: "error", message: e?.message || "Failed to save" });
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await Api("delete", `product-taxonomy/${id}`, "", router);
      if (res?.status) toaster?.({ type: "success", message: "Deleted" });
      await load(activeGroup);
    } catch (e) {
      toaster?.({ type: "error", message: e?.message || "Failed to delete" });
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Value",
        accessor: "value",
        Cell: ({ value: v }) => <span className="text-sm font-medium text-gray-900">{v}</span>,
      },
      {
        Header: "Position",
        accessor: "position",
        Cell: ({ value: v }) => <span className="text-sm text-gray-700">{v ?? 0}</span>,
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
              remove(row.original._id);
            }}
            className="p-2 text-red-500 hover:text-red-700"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
    ],
    [activeGroup, items],
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Layers size={18} className="text-gray-700" />
          Product Categories
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setActiveGroup(g.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeGroup === g.key
                  ? "bg-[#0A4D91] text-white"
                  : "bg-[#f0f2f5] text-[#0A4D91] hover:bg-[#e6eaef]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_140px]">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{activeLabel}</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Add ${activeLabel}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={create}
              disabled={!value.trim()}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg w-full disabled:opacity-60"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : (
          <Table columns={columns} data={items} />
        )}
      </div>
    </div>
  );
}

export default isAuth(ProductTaxonomyPage);

