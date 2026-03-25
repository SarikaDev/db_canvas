import { NodeProps, Handle, Position } from "reactflow";
import { useSchemaStore } from "../store/useSchemaStore";
import { validateTable } from "../lib/validator";
import { Table, SchemaName } from "../types/schema";
import ColumnRow from "./ColumnRow";

interface TableNodeData {
  table: Table;
  schemaName: SchemaName;
}

export default function TableNode({ data }: NodeProps<TableNodeData>) {
  const { table, schemaName } = data;
  const schemas = useSchemaStore((s) => s.schemas);
  const updateTableName = useSchemaStore((s) => s.updateTableName);
  const toggleRLS = useSchemaStore((s) => s.toggleRLS);
  const deleteTable = useSchemaStore((s) => s.deleteTable);
  const addColumn = useSchemaStore((s) => s.addColumn);

  const { errors, warnings } = validateTable(table, schemas);

  const borderColor =
    errors.length > 0
      ? "border-l-red-500"
      : warnings.length > 0
        ? "border-l-amber-400"
        : "border-l-green-500";

  const allIssues = [...errors, ...warnings];

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border border-gray-200 border-l-4 ${borderColor} min-w-[320px] max-w-[400px]`}
    >
      {/* React Flow handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!bg-blue-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!bg-blue-400"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <input
          type="text"
          value={table.name}
          onChange={(e) =>
            updateTableName(schemaName, table.id, e.target.value)
          }
          onKeyDown={(e) =>
            e.key === "Enter" && (e.target as HTMLInputElement).blur()
          }
          className="flex-1 text-sm font-semibold font-mono bg-transparent border-none outline-none text-gray-800 min-w-0"
          placeholder="table_name"
        />
        {/* Phase-02 disabled RLS option flex items-center */}
        <label className="gap-1 hidden  text-xs text-gray-500 cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={table.rlsEnabled}
            onChange={() => toggleRLS(schemaName, table.id)}
            className="w-3 h-3"
          />
          RLS
        </label>

        <button
          onClick={() => deleteTable(schemaName, table.id)}
          className="text-gray-400 hover:text-red-500 text-xs transition-colors shrink-0"
          title="Delete table"
        >
          🗑
        </button>
      </div>

      {/* Columns */}
      <div className="flex flex-col divide-y divide-gray-100">
        {table.columns.length === 0 ? (
          <p className="text-xs text-gray-400 px-3 py-2 italic">
            No columns yet
          </p>
        ) : (
          table.columns.map((col) => (
            <ColumnRow
              key={col.id}
              column={col}
              tableId={table.id}
              schemaName={schemaName}
              issues={allIssues}
            />
          ))
        )}
      </div>

      {/* Add Column */}
      <div className="px-3 py-2 border-t border-gray-100 rounded-b-lg">
        <button
          onClick={() => addColumn(schemaName, table.id)}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          + Add Column
        </button>
      </div>
    </div>
  );
}
