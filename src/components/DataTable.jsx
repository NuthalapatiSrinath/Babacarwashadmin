import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Inbox,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DataTable = ({
  title = "Data List",
  columns = [],
  data = [],
  loading = false,

  pagination,
  onPageChange,
  onLimitChange,
  onSearch,

  actionButton,
  renderExpandedRow,
}) => {
  const isServer = !!(pagination && onPageChange);

  const [localPage, setLocalPage] = useState(1);
  const [localLimit, setLocalLimit] = useState(10);
  const [localSearch, setLocalSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);

  const handleSearch = (e) => {
    const value = e.target.value;
    if (isServer && onSearch) onSearch(value);
    else {
      setLocalSearch(value);
      setLocalPage(1);
    }
  };

  const processed = useMemo(() => {
    if (!isServer && localSearch) {
      return data.filter((row) =>
        Object.values(row).some((v) =>
          String(v).toLowerCase().includes(localSearch.toLowerCase())
        )
      );
    }
    return data;
  }, [data, localSearch, isServer]);

  const limit = isServer ? pagination.limit : localLimit;
  const page = isServer ? pagination.page : localPage;
  const total = isServer ? pagination.total : processed.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows = isServer
    ? data
    : processed.slice((page - 1) * limit, page * limit);

  const changePage = (p) => {
    if (p < 1 || p > totalPages) return;
    if (isServer) onPageChange(p);
    else setLocalPage(p);
  };

  const changeLimit = (l) => {
    if (isServer && onLimitChange) onLimitChange(l);
    else {
      setLocalLimit(l);
      setLocalPage(1);
    }
  };

  const pages = (() => {
    const list = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else if (page <= 3) list.push(1, 2, 3, 4, "...", totalPages);
    else if (page >= totalPages - 2)
      list.push(
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    else list.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    return list;
  })();

  return (
    // FIX 1: max-w-full prevents the card from pushing the main layout width
    <div className="flex flex-col h-full w-full max-w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* HEADER */}
      <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Found {total} records</p>
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              placeholder="Search..."
              defaultValue={isServer ? "" : localSearch}
              onChange={handleSearch}
              className="pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-sm w-full sm:w-[200px] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          {actionButton}
        </div>
      </div>

      {/* TABLE CONTAINER */}
      {/* FIX 2: min-w-0 is the magic fix for Flexbox overflow issues. It allows this container to shrink below its content size. */}
      <div className="flex-1 min-h-0 min-w-0 relative flex flex-col">
        {/* Loading Overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center"
            >
              <div className="bg-white p-3 rounded-lg shadow-lg border flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-sm font-semibold text-slate-700">
                  Updating...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCROLL AREA */}
        {/* FIX 3: overflow-auto enables BOTH x and y scrollbars automatically when needed */}
        <div className="flex-1 overflow-auto w-full">
          <table className="w-full whitespace-nowrap text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b z-10 shadow-sm">
              <tr>
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-[11px] font-bold uppercase text-slate-500 tracking-wider ${
                      c.className || ""
                    }`}
                  >
                    {c.header}
                  </th>
                ))}
                {renderExpandedRow && <th className="w-8 px-4" />}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + (renderExpandedRow ? 1 : 0)}
                    className="py-12 text-center text-slate-400"
                  >
                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">No records found</p>
                  </td>
                </tr>
              )}

              {rows.map((row, i) => {
                const id = row._id || row.id || i;
                const expanded = expandedRows.includes(id);

                return (
                  <React.Fragment key={id}>
                    <tr
                      className={`hover:bg-slate-50 transition-colors ${
                        expanded ? "bg-slate-50" : ""
                      }`}
                    >
                      {columns.map((c, j) => (
                        <td
                          key={j}
                          className={`px-4 py-3 text-sm text-slate-700 border-b border-transparent ${
                            c.className || ""
                          }`}
                        >
                          {c.render ? c.render(row, i) : row[c.accessor]}
                        </td>
                      ))}

                      {renderExpandedRow && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              setExpandedRows(
                                expanded
                                  ? expandedRows.filter((x) => x !== id)
                                  : [...expandedRows, id]
                              )
                            }
                            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all"
                          >
                            {expanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Content */}
                    {expanded && renderExpandedRow && (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="p-0 border-b-0"
                        >
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-50/50"
                          >
                            <div className="p-4 border-t border-b border-slate-100">
                              {renderExpandedRow(row)}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t bg-white z-10 flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer"
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>rows</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={page === 1 || loading}
            onClick={() => changePage(page - 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex gap-1">
            {pages.map((p, i) => (
              <button
                key={i}
                disabled={p === "..." || loading}
                onClick={() => typeof p === "number" && changePage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  p === page
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                } ${
                  p === "..."
                    ? "border-none hover:bg-transparent cursor-default"
                    : ""
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="sm:hidden text-xs font-bold text-slate-600 px-2">
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages || loading}
            onClick={() => changePage(page + 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
