import { useState, useEffect } from "react";
import { useSchemaStore } from "../store/useSchemaStore";
import { Column, SchemaName, ValidationIssue } from "../types/schema";
import { POSTGRES_TYPES } from "../lib/constants";
import FKSelector from "./FKSelector";

interface ColumnRowProps {
  column: Column;
  tableId: string;
  schemaName: SchemaName;
  issues: ValidationIssue[];
}

export default function ColumnRow({ column, tableId, schemaName, issues }: ColumnRowProps) {
  const updateColumn = useSchemaStore((s) => s.updateColumn);
  const deleteColumn = useSchemaStore((s) => s.deleteColumn);
  const [showFKSelector, setShowFKSelector] = useState(false);

  const colErrors = issues.filter((i) => i.level === "error" && i.columnId === column.id);
  const colWarnings = issues.filter((i) => i.level === "warning" && i.columnId === column.id);

  const hasFk = !!column.fk;

  // Close FK selector automatically when FK is deselected / cleared
  useEffect(() => {
    if (!hasFk) {
      setShowFKSelector(false);
    }
  }, [hasFk]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 py-1 px-2">
        {/* Column name */}
        <input
          type="text"
          value={column.name}
          onChange={(e) => updateColumn(schemaName, tableId, column.id, { name: e.target.value })}
          placeholder="col_name"
          className="text-xs border border-gray-300 rounded px-1 py-0.5 w-24 font-mono"
        />

        {/* Data type */}
        <select
          value={column.type}
          onChange={(e) =>
            updateColumn(schemaName, tableId, column.id, { type: e.target.value as any })
          }
          className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
        >
          {POSTGRES_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* PK */}
        <label className="flex items-center gap-0.5 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={column.isPK}
            onChange={(e) => updateColumn(schemaName, tableId, column.id, { isPK: e.target.checked })}
            className="w-3 h-3"
          />
          PK
        </label>

        {/* NN (not null) */}
        <label className="flex items-center gap-0.5 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!column.isNullable}
            onChange={(e) =>
              updateColumn(schemaName, tableId, column.id, { isNullable: !e.target.checked })
            }
            className="w-3 h-3"
          />
          NN
        </label>

        {/* UQ */}
        <label className="flex items-center gap-0.5 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={column.isUnique}
            onChange={(e) =>
              updateColumn(schemaName, tableId, column.id, { isUnique: e.target.checked })
            }
            className="w-3 h-3"
          />
          UQ
        </label>

        {/* FK button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent React Flow node click from interfering
            setShowFKSelector((v) => !v);
          }}
          className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${hasFk
              ? "bg-blue-100 border-blue-400 text-blue-700"
              : "border-gray-300 text-gray-500 hover:border-gray-400"
            }`}
          title={hasFk ? "FK defined" : "Add foreign key"}
        >
          FK{hasFk ? " ✓" : ""}
        </button>

        {/* Delete */}
        <button
          onClick={() => deleteColumn(schemaName, tableId, column.id)}
          className="ml-auto text-gray-400 hover:text-red-500 text-xs transition-colors"
          title="Delete column"
        >
          ✕
        </button>
      </div>

      {/* FK Selector */}
      {showFKSelector && (
        <FKSelector
          schemaName={schemaName}
          tableId={tableId}
          columnId={column.id}
          onClose={() => setShowFKSelector(false)}
        />
      )}

      {/* Column-level errors */}
      {colErrors.map((issue, idx) => (
        <p key={idx} className="text-xs text-red-600 ml-2 mt-0.5">
          {issue.message}
        </p>
      ))}

      {/* Column-level warnings */}
      {colWarnings.map((issue, idx) => (
        <p key={idx} className="text-xs text-amber-600 ml-2 mt-0.5">
          {issue.message}
        </p>
      ))}
    </div>
  );
}
