import { useState, memo } from "react";
import { useSchemaStore } from "../store/useSchemaStore";
import { SchemaName } from "../types/schema";
import { ON_DELETE_RULES } from "../lib/constants";

interface FKSelectorProps {
  schemaName: SchemaName;
  tableId: string;
  columnId: string;
  onClose: () => void;
}

// FIX: Wrap in memo
const FKSelector = memo(
  ({ schemaName, tableId, columnId, onClose }: FKSelectorProps) => {
    const schemas = useSchemaStore((s) => s.schemas);
    const updateColumn = useSchemaStore((s) => s.updateColumn);

    const [selectedSchema, setSelectedSchema] = useState<SchemaName | "">("");
    const [selectedTable, setSelectedTable] = useState("");
    const [selectedColumn, setSelectedColumn] = useState("");
    const [selectedOnDelete, setSelectedOnDelete] = useState("RESTRICT");

    const schemaNames: SchemaName[] = ["public", "auth", "app"];
    const targetTables =
      selectedSchema !== "" ? schemas[selectedSchema].tables : [];
    const targetColumns =
      selectedTable !== ""
        ? (targetTables.find((t) => t.name === selectedTable)?.columns ?? [])
        : [];

    // Helper to sync with store
    const syncWithStore = (col: string, del: string) => {
      if (selectedSchema && selectedTable && col) {
        updateColumn(schemaName, tableId, columnId, {
          fk: {
            schemaName: selectedSchema as SchemaName,
            tableName: selectedTable,
            columnName: col,
            onDelete: del as any,
          },
        });
      }
    };

    return (
      <div className="flex flex-wrap items-center gap-2 mt-1 ml-2 p-2 bg-blue-50 border border-blue-100 rounded shadow-sm">
        <select
          className="text-[11px] border border-gray-300 rounded px-1 py-0.5 bg-white"
          value={selectedSchema}
          onChange={(e) => {
            setSelectedSchema(e.target.value as SchemaName);
            setSelectedTable("");
            setSelectedColumn("");
          }}
        >
          <option value="">Schema…</option>
          {schemaNames.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="text-[11px] border border-gray-300 rounded px-1 py-0.5 bg-white"
          value={selectedTable}
          onChange={(e) => {
            setSelectedTable(e.target.value);
            setSelectedColumn("");
          }}
          disabled={!selectedSchema}
        >
          <option value="">Table…</option>
          {targetTables.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          className="text-[11px] border border-gray-300 rounded px-1 py-0.5 bg-white"
          value={selectedColumn}
          onChange={(e) => {
            setSelectedColumn(e.target.value);
            syncWithStore(e.target.value, selectedOnDelete);
          }}
          disabled={!selectedTable}
        >
          <option value="">Column…</option>
          {targetColumns.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="text-[11px] border border-gray-300 rounded px-1 py-0.5 bg-white"
          value={selectedOnDelete}
          onChange={(e) => {
            setSelectedOnDelete(e.target.value);
            syncWithStore(selectedColumn, e.target.value);
          }}
        >
          {ON_DELETE_RULES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 ml-1"
        >
          ✕
        </button>
      </div>
    );
  },
);

export default FKSelector;
