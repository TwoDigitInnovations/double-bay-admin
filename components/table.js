import React, { useState, useRef, useEffect } from "react";
import {
  useTable,
  useFilters,
  useGlobalFilter,
  useSortBy,
  usePagination,
  useColumnOrder,
  useRowSelect,
} from "react-table";
import {
  Eye,
  EyeOff,
  GripVertical,
  Columns3,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  X,
} from "lucide-react";

// ─── Exported helpers ──────────────────────────────────────────────────────────

export function StatusPill({ value }) {
  const status = (value || "").toLowerCase();
  if (status === "active")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    );
  if (status === "archived")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Archived
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      {value}
    </span>
  );
}

export function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  const options = React.useMemo(() => {
    const s = new Set();
    preFilteredRows.forEach((row) => s.add(row.values[id]));
    return [...s.values()];
  }, [id, preFilteredRows]);

  return (
    <select
      className="rounded-lg border border-gray-200 text-sm px-3 py-1.5 outline-none text-gray-700 bg-white"
      value={filterValue || ""}
      onChange={(e) => setFilter(e.target.value || undefined)}
    >
      <option value="">All</option>
      {options.map((o, i) => (
        <option key={i} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function indexID({ row }) {
  return <span className="text-gray-500 text-sm">{parseInt(row.id) + 1}</span>;
}

export function AvatarCell({ value, row }) {
  const image =
    row?.original?.images?.[0] ||
    row?.original?.image ||
    row?.original?.photo;
  return (
    <div className="flex items-center gap-3">
      {image ? (
        <img
          src={image}
          alt={value}
          className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
      )}
      <span className="text-sm font-medium text-gray-900 max-w-55 truncate">
        {value}
      </span>
    </div>
  );
}

// ─── Checkbox cell ─────────────────────────────────────────────────────────────

const IndeterminateCheckbox = React.forwardRef(
  ({ indeterminate, ...rest }, ref) => {
    const innerRef = useRef();
    const resolvedRef = ref || innerRef;

    useEffect(() => {
      if (resolvedRef.current)
        resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <input
        type="checkbox"
        ref={resolvedRef}
        className="w-4 h-4 rounded border-gray-300 accent-[#008060] cursor-pointer"
        {...rest}
      />
    );
  },
);
IndeterminateCheckbox.displayName = "IndeterminateCheckbox";

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-[#008060]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Main Table ────────────────────────────────────────────────────────────────

function Table({ columns, data, pageSize: defaultPageSize = 50, emptyComponent, onRowClick }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hideArchived, setHideArchived] = useState(false);
  const [dragOver, setDragOver] = useState(null);
  const dragFrom = useRef(null);
  const settingsRef = useRef(null);

  // Close settings on outside click
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredData = React.useMemo(
    () =>
      hideArchived
        ? data.filter((d) => (d.status || "").toLowerCase() !== "archived")
        : data,
    [data, hideArchived],
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    state: { pageIndex, pageSize, globalFilter },
    setGlobalFilter,
    allColumns,
    setColumnOrder,
    selectedFlatRows,
  } = useTable(
    {
      columns,
      data: filteredData,
      initialState: { pageSize: defaultPageSize },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
    useColumnOrder,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((cols) => [
        {
          id: "_select",
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
          ),
          Cell: ({ row }) => (
            <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
          ),
        },
        ...cols,
      ]);
    },
  );

  // Drag to reorder columns in settings panel
  const draggableColumns = allColumns.filter((c) => c.id !== "_select");

  const handleDragStart = (index) => {
    dragFrom.current = index;
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOver(index);
  };
  const handleDrop = (dropIndex) => {
    const from = dragFrom.current;
    if (from == null || from === dropIndex) {
      setDragOver(null);
      return;
    }
    const ids = allColumns.map((c) => c.id);
    const draggable = ids.filter((id) => id !== "_select");
    const [moved] = draggable.splice(from, 1);
    draggable.splice(dropIndex, 0, moved);
    setColumnOrder(["_select", ...draggable]);
    dragFrom.current = null;
    setDragOver(null);
  };

  // Pagination display
  const total = filteredData.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1 flex-1 max-w-xs">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              value={globalFilter || ""}
              onChange={(e) => setGlobalFilter(e.target.value || undefined)}
              placeholder="Search and filter"
              className="bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400 w-full min-w-0"
            />
            {globalFilter && (
              <button onClick={() => setGlobalFilter(undefined)}>
                <X size={12} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {selectedFlatRows.length > 0 && (
            <span className="text-xs text-gray-500 shrink-0">
              {selectedFlatRows.length} selected
            </span>
          )}
        </div>

        {/* Column settings button */}
        <div className="relative shrink-0" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              settingsOpen
                ? "bg-gray-100 text-gray-800"
                : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <Columns3 size={18} />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 w-60 z-50 py-2">
              {/* Sort by */}
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ArrowUpDown size={13} className="text-gray-400" />
                  Sort by
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  Created <ChevronDown size={12} />
                </span>
              </div>

              {/* Hide archived */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 pb-3 mb-1">
                <span className="text-sm text-gray-700">Hide archived</span>
                <Toggle checked={hideArchived} onChange={setHideArchived} />
              </div>

              {/* Columns */}
              <p className="px-4 pt-1 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Columns
              </p>

              {draggableColumns.map((col, i) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => setDragOver(null)}
                  className={`flex items-center gap-2 px-4 py-1.5 cursor-grab select-none transition-colors ${
                    dragOver === i ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <GripVertical size={14} className="text-gray-300 shrink-0" />
                  <span
                    className={`flex-1 text-sm ${
                      col.isVisible ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {typeof col.Header === "string" ? col.Header : col.id}
                  </span>
                  <button
                    onClick={() => col.toggleHidden()}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {col.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="min-w-full">
          <thead className="border-b border-gray-200">
            {headerGroups.map((hg, i) => (
              <tr {...hg.getHeaderGroupProps()} key={i}>
                {hg.headers.map((col, j) => (
                  <th
                    {...col.getHeaderProps(col.getSortByToggleProps?.())}
                    key={j}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.render("Header")}
                      {col.isSorted ? (
                        col.isSortedDesc ? (
                          <ChevronDown size={12} className="text-gray-400" />
                        ) : (
                          <ChevronUp size={12} className="text-gray-400" />
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="divide-y divide-gray-100">
            {page.length === 0 ? (
              <tr>
                <td colSpan={headerGroups[0]?.headers.length || 1}>
                  {emptyComponent ?? (
                    <div className="px-4 py-12 text-center text-sm text-gray-400">
                      No results found.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              page.map((row, i) => {
                prepareRow(row);
                return (
                  <tr
                    {...row.getRowProps()}
                    key={i}
                    onClick={() => onRowClick?.(row.original)}
                    className={`transition-colors ${onRowClick ? "cursor-pointer" : ""} ${
                      row.isSelected ? "bg-green-50/50" : "hover:bg-gray-50"
                    }`}
                  >
                    {row.cells.map((cell, j) => (
                      <td
                        {...cell.getCellProps()}
                        key={j}
                        className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap"
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200">
        <span className="text-sm text-gray-500">
          {total === 0 ? "0" : `${from}–${to}`}{" "}
          {total > 0 && <span className="text-gray-400">of {total}</span>}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Table;
