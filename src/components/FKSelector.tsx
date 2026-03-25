import { useState } from "react";
import { useSchemaStore } from "../store/useSchemaStore";
import { SchemaName } from "../types/schema";
import { ON_DELETE_RULES } from "../lib/constants";

interface FKSelectorProps {
  schemaName: SchemaName;
  tableId: string;
  columnId: string;
  onClose: () => void;
}

export default function FKSelector({
  schemaName,
  tableId,
  columnId,
  onClose,
}: FKSelectorProps) {
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
      ? targetTables.find((t) => t.name === selectedTable)?.columns ?? []
      : [];

  function handleSchemaChange(val: SchemaName) {
    setSelectedSchema(val);
    setSelectedTable("");
    setSelectedColumn("");
  }

  function handleTableChange(val: string) {
    setSelectedTable(val);
    setSelectedColumn("");
  }

  function handleColumnChange(val: string) {
    setSelectedColumn(val);
    if (selectedSchema && selectedTable && val) {
      updateColumn(schemaName, tableId, columnId, {
        fk: {
          schemaName: selectedSchema as SchemaName,
          tableName: selectedTable,
          columnName: val,
          onDelete: selectedOnDelete as any,
        },
      });
    }
  }

  function handleOnDeleteChange(val: string) {
    setSelectedOnDelete(val);
    if (selectedSchema && selectedTable && selectedColumn) {
      updateColumn(schemaName, tableId, columnId, {
        fk: {
          schemaName: selectedSchema as SchemaName,
          tableName: selectedTable,
          columnName: selectedColumn,
          onDelete: val as any,
        },
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-1 ml-2 p-2 bg-gray-50 border border-gray-200 rounded">
      {/* Schema */}
      <select
        className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
        value={selectedSchema}
        onChange={(e) => handleSchemaChange(e.target.value as SchemaName)}
      >
        <option value="">Schema…</option>
        {schemaNames.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Table */}
      <select
        className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
        value={selectedTable}
        onChange={(e) => handleTableChange(e.target.value)}
        disabled={!selectedSchema}
      >
        <option value="">Table…</option>
        {targetTables.map((t) => (
          <option key={t.id} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Column */}
      <select
        className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
        value={selectedColumn}
        onChange={(e) => handleColumnChange(e.target.value)}
        disabled={!selectedTable}
      >
        <option value="">Column…</option>
        {targetColumns.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      {/* ON DELETE */}
      <select
        className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
        value={selectedOnDelete}
        onChange={(e) => handleOnDeleteChange(e.target.value)}
      >
        {ON_DELETE_RULES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {/* Close */}
      <button
        onClick={onClose}
        className="text-xs text-gray-400 hover:text-gray-600 ml-1"
        title="Close FK selector"
      >
        ✕
      </button>
    </div>
  );
}
