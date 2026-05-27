import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { Users, MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import isAuth from "@/components/isAuth";
import Table from "@/components/table";
import { fetchCustomers, blockUnblockCustomer, deleteCustomer } from "@/redux/actions/customerActions";

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Main section */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-8 sm:px-12 py-10 sm:py-14 gap-8">
        <div className="max-w-md">
          <p className="text-xs font-semibold text-[#008060] uppercase tracking-widest mb-3">
            Customers
          </p>
          <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
            Everything customers-related in one place
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Manage customer details, view order history, and group customers into segments to personalise their experience.
          </p>
        </div>

        {/* Illustration image */}
        <div className="hidden sm:block shrink-0">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 rounded-full bg-[#e8f5f3]" />
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=320&h=320&fit=crop&crop=face&q=80"
              alt="Customer"
              className="relative w-full h-full rounded-full object-cover border-4 border-white shadow-md"
            />
            {/* Floating card */}
            <div className="absolute -bottom-2 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-800 leading-none">Active</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="bg-gray-50 border-t border-gray-100 px-8 sm:px-12 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Get customers with apps</h3>
            <p className="text-xs text-gray-500">
              Grow your customer list by adding a lead capture form to your store and marketing.
            </p>
          </div>
          <button className="shrink-0 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
            See app recommendations
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Customer name + avatar cell ───────────────────────────────────────────────

function CustomerCell({ value, row }) {
  const { image, email } = row.original;
  const initials = value
    ? value.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return (
    <div className="flex items-center gap-3">
      {image ? (
        <img
          src={image}
          alt={value}
          className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#008060] to-teal-400 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-white">{initials}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate max-w-44">{value || "—"}</p>
        <p className="text-xs text-gray-400 truncate max-w-44">{email}</p>
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ value }) {
  if (value)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        Blocked
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      Active
    </span>
  );
}

// ── Row actions dropdown ──────────────────────────────────────────────────────

function RowActions({ row, onBlock, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 w-40 z-50 py-1 overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); onBlock(row); setOpen(false); }}
            className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {row.isBlocked ? (
              <><ShieldCheck size={14} className="text-green-600 shrink-0" /><span>Unblock</span></>
            ) : (
              <><ShieldOff size={14} className="text-yellow-600 shrink-0" /><span>Block</span></>
            )}
          </button>
          <div className="border-t border-gray-100 mx-2" />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(row); setOpen(false); }}
            className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} className="shrink-0" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function Customers() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { customers, loading } = useSelector((state) => state.customer);

  useEffect(() => {
    dispatch(fetchCustomers(router));
  }, [dispatch]);

  const handleBlock = (customer) => {
    dispatch(blockUnblockCustomer(customer._id, !customer.isBlocked, router));
  };

  const handleDelete = (customer) => {
    if (confirm(`Delete ${customer.fullname}? This cannot be undone.`)) {
      dispatch(deleteCustomer(customer._id, router));
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Customer",
        accessor: "fullname",
        Cell: CustomerCell,
      },
      {
        Header: "Phone",
        accessor: "phone",
        Cell: ({ value }) => (
          <span className="text-sm text-gray-600">{value || "—"}</span>
        ),
      },
      {
        Header: "Status",
        accessor: "isBlocked",
        Cell: ({ value }) => <StatusPill value={value} />,
      },
      {
        Header: "Verified",
        accessor: "isVerified",
        Cell: ({ value }) =>
          value ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Verified
            </span>
          ) : (
            <span className="text-xs text-gray-400">Not verified</span>
          ),
      },
      {
        Header: "Joined",
        accessor: "createdAt",
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">
            {value
              ? new Date(value).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        Header: "",
        id: "_actions",
        Cell: ({ row }) => (
          <RowActions
            row={row.original}
            onBlock={handleBlock}
            onDelete={handleDelete}
          />
        ),
      },
    ],
    [customers]
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users size={18} className="text-gray-700" />
            Customers
          </h1>
          {customers.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5 ml-7">
              {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState />
      ) : (
        <Table columns={columns} data={customers} />
      )}

      <p className="text-center mt-6 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
        Learn more about customers
      </p>
    </div>
  );
}

export default isAuth(Customers);
