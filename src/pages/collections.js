import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Layers, Plus } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table, { StatusPill } from "@/components/table";
import { fetchCollections } from "@/redux/actions/collectionActions";

function CollectionTitleCell({ value, row }) {
  const { image, type, channels } = row.original;
  const isPos = channels?.includes("pos");
  const subtitle = !isPos ? "Excluded from Point of Sale" : null;
  return (
    <div className="flex items-center gap-3">
      {image ? (
        <img
          src={image}
          alt={value}
          className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <Layers size={14} className="text-gray-400" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

const COLUMNS = [
  {
    Header: "Title",
    accessor: "name",
    Cell: CollectionTitleCell,
  },
  {
    Header: "Products",
    accessor: "products",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-700">
        {Array.isArray(value) ? value.length : 0}
      </span>
    ),
  },
  {
    Header: "Product conditions",
    accessor: "type",
    Cell: ({ value }) => (
      <span className="text-sm text-gray-500 capitalize">
        {value === "smart" ? "Automated" : "—"}
      </span>
    ),
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: ({ value }) => <StatusPill value={value} />,
  },
];

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-gray-200 mb-4">
        <Layers size={56} strokeWidth={1} />
      </div>
      <p className="text-base font-semibold text-gray-900 mb-1">
        No collections yet
      </p>
      <p className="text-sm text-gray-500 mb-5">
        Group products into collections to make it easier for customers to find them.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={14} />
        Add collection
      </button>
    </div>
  );
}

function Collections() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { collections, loading } = useSelector((state) => state.collection);

  useEffect(() => {
    dispatch(fetchCollections(router));
  }, [dispatch]);

  const columns = useMemo(() => COLUMNS, []);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Layers size={18} className="text-gray-700" />
          Collections
        </h1>
        <button
          onClick={() => router.push("/collections/add")}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add collection
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <EmptyState onAdd={() => router.push("/collections/add")} />
        </div>
      ) : (
        <Table
          columns={columns}
          data={collections}
          onRowClick={(row) => router.push(`/collections/${row._id}`)}
        />
      )}

      <p className="text-center mt-6 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
        Learn more about collections
      </p>
    </div>
  );
}

export default isAuth(Collections);
