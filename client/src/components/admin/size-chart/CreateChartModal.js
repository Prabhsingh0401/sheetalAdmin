"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { createSizeChart } from "@/services/sizeChartService";
import toast from "react-hot-toast";

const DEFAULT_HEADERS = ["Size", "Bust", "Waist"];
const MAX_COLUMNS = 8;

const createEmptyRow = (columnCount) => ({
  cells: Array.from({ length: columnCount }, () => ""),
});

const normalizeRow = (row = {}, columnCount = DEFAULT_HEADERS.length) => {
  const cells = Array.isArray(row.cells)
    ? row.cells
    : [row.label, row.bust, row.waist, row.hip, row.shoulder, row.length];

  return {
    cells: Array.from({ length: columnCount }, (_, index) => cells[index] || ""),
  };
};

export default function CreateChartModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [headers, setHeaders] = useState([...DEFAULT_HEADERS]);
  const [rows, setRows] = useState([createEmptyRow(DEFAULT_HEADERS.length)]);
  const [loading, setLoading] = useState(false);

  const rowCount = useMemo(() => rows.length, [rows]);
  const columnCount = headers.length;

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setHeaders([...DEFAULT_HEADERS]);
    setRows([createEmptyRow(DEFAULT_HEADERS.length)]);
  };

  const syncRowsToColumnCount = (nextColumnCount) => {
    setRows((prev) => prev.map((row) => normalizeRow(row, nextColumnCount)));
  };

  const updateHeader = (index, value) => {
    setHeaders((prev) =>
      prev.map((header, idx) => (idx === index ? value : header)),
    );
  };

  const addColumn = () => {
    if (headers.length >= MAX_COLUMNS) {
      toast.error(`You can add up to ${MAX_COLUMNS} columns only.`);
      return;
    }

    setHeaders((prev) => [...prev, `Column ${prev.length + 1}`]);
    syncRowsToColumnCount(headers.length + 1);
  };

  const removeColumn = (index) => {
    if (index === 0) {
      toast.error("The first column is required for sizes.");
      return;
    }

    const nextHeaders = headers.filter((_, idx) => idx !== index);
    setHeaders(nextHeaders);
    setRows((prev) =>
      prev.map((row) => ({
        cells: row.cells.filter((_, cellIndex) => cellIndex !== index),
      })),
    );
  };

  const updateRowCell = (rowIndex, cellIndex, value) => {
    setRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex
          ? {
              cells: row.cells.map((cell, idx) =>
                idx === cellIndex ? value : cell,
              ),
            }
          : row,
      ),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow(headers.length)]);
  };

  const removeRow = (index) => {
    setRows((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [createEmptyRow(headers.length)];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Chart name is required.");
      return;
    }

    const cleanedHeaders = headers.map((header) => header.trim());
    if (cleanedHeaders.some((header) => !header)) {
      toast.error("All column headers are required.");
      return;
    }

    const cleanedRows = rows
      .map((row) => ({
        cells: row.cells.map((cell) => String(cell || "").trim()),
      }))
      .filter((row) => row.cells[0]);

    if (cleanedRows.length === 0) {
      toast.error("Add at least one size row.");
      return;
    }

    setLoading(true);
    try {
      const data = await createSizeChart({
        name: name.trim(),
        headers: cleanedHeaders,
        table: cleanedRows,
      });
      onSuccess(data.data);
      resetForm();
    } catch (error) {
      console.error("Failed to create chart", error);
      toast.error(error.message || "Failed to create size chart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[120]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex flex-col text-black">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-black">New Size Chart</h2>
            <p className="text-xs text-black/70 mt-1">
              Create the chart, rename headers, and configure up to 8 columns.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-black mb-1.5">Chart name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Women's tops, Men's bottoms..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                autoFocus
              />
            </div>
            <div className="flex items-end">
              <div className="text-xs text-black/70">
                {rowCount} row{rowCount !== 1 ? "s" : ""} and {columnCount} column
                {columnCount !== 1 ? "s" : ""} in this chart
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black">Columns</h3>
              <button
                type="button"
                onClick={addColumn}
                disabled={headers.length >= MAX_COLUMNS}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                Add Column
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {headers.map((header, index) => (
                <div
                  key={`header-${index}`}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      Header {index + 1}
                    </span>
                    {index > 0 ? (
                      <button
                        type="button"
                        onClick={() => removeColumn(index)}
                        className="text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => updateHeader(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder={`Column ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">Size Rows</h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
            >
              <Plus size={14} />
              Add Row
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {headers.map((header, cellIndex) => (
                    <Field
                      key={`cell-${rowIndex}-${cellIndex}`}
                      label={header || `Column ${cellIndex + 1}`}
                      value={row.cells[cellIndex] || ""}
                      onChange={(value) =>
                        updateRowCell(rowIndex, cellIndex, value)
                      }
                      placeholder={cellIndex === 0 ? "S, M, L" : "Value"}
                    />
                  ))}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Remove row
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? "Creating..." : "Create Chart"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-black uppercase tracking-wider mb-1">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
      />
    </label>
  );
}
