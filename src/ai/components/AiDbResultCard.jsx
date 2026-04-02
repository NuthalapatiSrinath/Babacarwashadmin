import { useMemo, useRef, useState } from "react";
import {
  Database,
  Download,
  FileText,
  Image,
  LayoutGrid,
  Table,
  BarChart3,
  Code2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PREVIEW_ROW_LIMIT = 10;
const EXPORT_ROW_LIMIT = 200;
const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
];

const safeFilePart = (value) =>
  String(value || "result")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "result";

const stringifyValue = (value, maxLength = 140) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const json = JSON.stringify(value);
  return json.length > maxLength ? `${json.slice(0, maxLength)}...` : json;
};

const pickColumns = (rows) => {
  const keys = [];
  const seen = new Set();

  for (const row of rows.slice(0, 40)) {
    if (!row || typeof row !== "object") continue;

    for (const key of Object.keys(row)) {
      if (seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
    }
  }

  return keys.slice(0, 12);
};

const mapRows = (rows, columns, limit) =>
  rows
    .slice(0, limit)
    .map((row) => columns.map((column) => stringifyValue(row?.[column])));

const inferNumericKey = (rows, columns) => {
  for (const key of columns) {
    const hasNumeric = rows.some((row) => typeof row?.[key] === "number");
    if (hasNumeric) return key;
  }
  return null;
};

const inferCategoryKey = (rows, columns) => {
  const preferred = [
    "name",
    "status",
    "service_type",
    "firstName",
    "mobile",
    "id",
    "_id",
  ];

  for (const key of preferred) {
    if (columns.includes(key)) return key;
  }

  for (const key of columns) {
    const hasText = rows.some((row) => {
      const value = row?.[key];
      return typeof value === "string" || typeof value === "number";
    });
    if (hasText) return key;
  }

  return null;
};

const buildBarData = (rows, categoryKey, numericKey) => {
  if (!categoryKey || !numericKey) return [];

  return rows.slice(0, 25).map((row, index) => ({
    label: stringifyValue(row?.[categoryKey] ?? `Row ${index + 1}`, 24),
    value: Number(row?.[numericKey] || 0),
  }));
};

const buildPieData = (rows, categoryKey) => {
  if (!categoryKey) return [];

  const counts = new Map();
  for (const row of rows.slice(0, 250)) {
    const key =
      stringifyValue(row?.[categoryKey] ?? "Unknown", 24) || "Unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

const AiDbResultCard = ({
  payload,
  messageId,
  onLoadDbPage,
  isPageLoading,
}) => {
  const cardRef = useRef(null);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isImageExporting, setIsImageExporting] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [pageSize, setPageSize] = useState(25);

  const query = payload?.query || {};
  const data = payload?.data || {};
  const results = Array.isArray(data?.results) ? data.results : [];

  const collection = data?.collection || query?.collection || "records";
  const action = data?.action || query?.action || "find";
  const count = Number.isFinite(data?.count) ? data.count : results.length;
  const pagination = data?.pagination || {};
  const currentPage = Number.isFinite(pagination?.page)
    ? pagination.page
    : Number(query?.page || 1);
  const limit = Number.isFinite(pagination?.limit)
    ? pagination.limit
    : Number(query?.limit || pageSize);
  const totalMatched = Number.isFinite(pagination?.totalMatched)
    ? pagination.totalMatched
    : count;
  const totalPages = Number.isFinite(pagination?.totalPages)
    ? pagination.totalPages
    : limit > 0
      ? Math.max(1, Math.ceil(totalMatched / limit))
      : 1;
  const hasMore = Boolean(pagination?.hasMore);

  const effectivePageSize =
    Number.isFinite(limit) && limit > 0 ? limit : pageSize;

  const relations = Array.isArray(data?.populatedRelations)
    ? data.populatedRelations
    : Array.isArray(query?.relations)
      ? query.relations
      : [];

  const columns = useMemo(() => pickColumns(results), [results]);
  const previewRows = useMemo(
    () => mapRows(results, columns, PREVIEW_ROW_LIMIT),
    [results, columns],
  );

  const exportRows = useMemo(
    () => mapRows(results, columns, EXPORT_ROW_LIMIT),
    [results, columns],
  );

  const numericKey = useMemo(
    () => inferNumericKey(results, columns),
    [results, columns],
  );
  const categoryKey = useMemo(
    () => inferCategoryKey(results, columns),
    [results, columns],
  );
  const barData = useMemo(
    () => buildBarData(results, categoryKey, numericKey),
    [results, categoryKey, numericKey],
  );
  const pieData = useMemo(
    () => buildPieData(results, categoryKey),
    [results, categoryKey],
  );

  const baseFileName = `${safeFilePart(collection)}-${Date.now()}`;

  const handlePageChange = async (nextPage) => {
    if (!onLoadDbPage || !messageId) return;
    if (nextPage < 1 || nextPage > totalPages) return;
    await onLoadDbPage(messageId, nextPage, effectivePageSize);
  };

  const handlePageSizeChange = async (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setPageSize(parsed);

    if (onLoadDbPage && messageId) {
      await onLoadDbPage(messageId, 1, parsed);
    }
  };

  const handleJsonDownload = () => {
    const blob = new Blob([JSON.stringify({ query, data }, null, 2)], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${baseFileName}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePdfDownload = async () => {
    if (!columns.length) return;

    setIsPdfExporting(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(14);
      doc.text(`AI Query Result: ${collection}`, 36, 36);

      doc.setFontSize(10);
      doc.text(`Action: ${action}   Count: ${count}`, 36, 56);

      autoTable(doc, {
        startY: 72,
        head: [columns],
        body: exportRows,
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: 255,
        },
        margin: { left: 24, right: 24 },
      });

      doc.save(`${baseFileName}.pdf`);
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleImageDownload = async () => {
    if (!cardRef.current) return;

    setIsImageExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${baseFileName}.png`;
      link.click();
    } finally {
      setIsImageExporting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
          <Database size={16} />
          Structured DB Result
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleJsonDownload}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Download size={14} />
            JSON
          </button>
          <button
            type="button"
            onClick={handlePdfDownload}
            disabled={isPdfExporting || !columns.length}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText size={14} />
            {isPdfExporting ? "Exporting..." : "PDF"}
          </button>
          <button
            type="button"
            onClick={handleImageDownload}
            disabled={isImageExporting}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Image size={14} />
            {isImageExporting ? "Creating..." : "Image"}
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => setViewMode("table")}
          className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
            viewMode === "table"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Table size={14} /> Table
        </button>
        <button
          type="button"
          onClick={() => setViewMode("cards")}
          className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
            viewMode === "cards"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          <LayoutGrid size={14} /> Cards
        </button>
        <button
          type="button"
          onClick={() => setViewMode("chart")}
          className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
            viewMode === "chart"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          <BarChart3 size={14} /> Charts
        </button>
        <button
          type="button"
          onClick={() => setViewMode("raw")}
          className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
            viewMode === "raw"
              ? "bg-blue-600 text-white"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Code2 size={14} /> Raw
        </button>
      </div>

      <div className="mb-4 grid gap-2 text-xs md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="font-semibold text-slate-500">Collection:</span>{" "}
          {collection}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="font-semibold text-slate-500">Action:</span> {action}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="font-semibold text-slate-500">Rows:</span> {count}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          Total Matched: <span className="font-semibold">{totalMatched}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500">Page Size</label>
          <select
            value={effectivePageSize}
            onChange={(event) => handlePageSizeChange(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filters
          </p>
          <pre className="max-h-28 overflow-auto whitespace-pre-wrap text-[11px] text-slate-700">
            {JSON.stringify(query?.filters || {}, null, 2)}
          </pre>
        </div>
        <div className="rounded-lg border border-slate-200 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Relations
          </p>
          <p className="text-xs text-slate-700">
            {relations.length ? relations.join(", ") : "None"}
          </p>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-600">
          Query executed successfully, but there are no records to display.
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-3 py-2 font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {previewRows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <td
                      key={`cell-${rowIndex}-${colIndex}`}
                      className="px-3 py-2 text-slate-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => (
            <div
              key={row?._id || index}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Record {index + 1}
              </p>
              <div className="space-y-1 text-xs">
                {columns.slice(0, 8).map((column) => (
                  <div key={`${index}-${column}`} className="flex gap-2">
                    <span className="min-w-[92px] font-semibold text-slate-500">
                      {column}:
                    </span>
                    <span className="break-words text-slate-700">
                      {stringifyValue(row?.[column], 80)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "chart" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-72 rounded-lg border border-slate-200 bg-white p-2">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                No numeric fields available for charting.
              </div>
            )}
          </div>

          <div className="h-72 rounded-lg border border-slate-200 bg-white p-2">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Not enough category data for pie chart.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-h-[460px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
          <pre className="whitespace-pre-wrap text-[11px] text-slate-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <p>
          Page {currentPage} of {Math.max(totalPages, 1)}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isPageLoading}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={(!hasMore && currentPage >= totalPages) || isPageLoading}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {results.length > PREVIEW_ROW_LIMIT && viewMode !== "raw" && (
        <p className="mt-2 text-xs text-slate-500">
          Showing {Math.min(PREVIEW_ROW_LIMIT, results.length)} rows in{" "}
          {viewMode} mode for readability.
        </p>
      )}
    </div>
  );
};

export default AiDbResultCard;
