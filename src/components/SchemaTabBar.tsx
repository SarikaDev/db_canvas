import { useSchemaStore } from "../store/useSchemaStore";
import { SchemaName } from "../types/schema";

const SCHEMA_NAMES: SchemaName[] = ["public", "auth", "app"];

export default function SchemaTabBar() {
  const activeSchema = useSchemaStore((s) => s.activeSchema);
  const setActiveSchema = useSchemaStore((s) => s.setActiveSchema);
  const addTable = useSchemaStore((s) => s.addTable);

  function handleAddTable() {
    addTable(activeSchema, "new_table_" + Date.now());
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
      {SCHEMA_NAMES.map((name) => (
        <button
          key={name}
          onClick={() => setActiveSchema(name)}
          className={`text-sm px-3 py-1 rounded transition-colors font-mono ${activeSchema === name
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
        >
          {name}
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={handleAddTable}
        className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded transition-colors"
      >
        + Add Table
      </button>
    </div>
  );
}
