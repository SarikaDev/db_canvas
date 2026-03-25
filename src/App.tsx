import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  NodeChange,
  applyNodeChanges,
  Node,
  Edge,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

import { useSchemaStore } from "./store/useSchemaStore";
import { validateTable } from "./lib/validator";
import { generateSQL } from "./lib/sqlGenerator";
import { exportSchema } from "./lib/exporter";
import TableNode from "./components/TableNode";
import SQLPanel from "./components/SQLPanel";
import TopBar from "./components/TopBar";
import SchemaTabBar from "./components/SchemaTabBar";
import { Schema, ValidationIssue } from "./types/schema";

const nodeTypes = { tableNode: TableNode };

export default function App() {
  const schemas = useSchemaStore((s) => s.schemas);
  const activeSchema = useSchemaStore((s) => s.activeSchema);
  const updateTablePosition = useSchemaStore((s) => s.updateTablePosition);
  const clearCanvas = useSchemaStore((s) => s.clearCanvas);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const activeSchemaTables = schemas[activeSchema].tables;

  // Local nodes state — React Flow needs to own node positions during drag
  const [nodes, setNodes] = useState<Node[]>(() =>
    activeSchemaTables.map((table) => ({
      id: table.id,
      type: "tableNode",
      position: table.position,
      data: { table, schemaName: activeSchema },
    }))
  );

  // Re-sync local nodes whenever the active schema or its tables change
  useEffect(() => {
    setNodes((currentNodes) =>
      activeSchemaTables.map((table) => {
        const existing = currentNodes.find((n) => n.id === table.id);
        return {
          id: table.id,
          type: "tableNode",
          position: existing ? existing.position : table.position,
          data: { table, schemaName: activeSchema },
        };
      })
    );
  }, [activeSchema, activeSchemaTables]);

  // Derive edges (only cross-table FK within the active schema)
  const edges: Edge[] = [];
  for (const table of activeSchemaTables) {
    for (const col of table.columns) {
      if (col.fk && col.fk.schemaName === activeSchema) {
        const targetTable = activeSchemaTables.find(
          (t) => t.name === col.fk!.tableName
        );
        if (targetTable) {
          edges.push({
            id: `${table.id}-${col.id}`,
            source: table.id,
            target: targetTable.id,
            label: `${col.name} → ${col.fk.columnName}`,
            animated: true,
          });
        }
      }
    }
  }

  // All validation issues for active schema
  const allIssues: ValidationIssue[] = activeSchemaTables.flatMap((table) => {
    const result = validateTable(table, schemas);
    return [...result.errors, ...result.warnings];
  });

  // Full SQL for active schema
  const fullSQL = generateSQL(schemas[activeSchema]);

  // Display SQL — single table or full schema
  let displaySQL = fullSQL;
  let selectedTableName: string | undefined;
  if (selectedTableId) {
    const selectedTable = activeSchemaTables.find((t) => t.id === selectedTableId);
    if (selectedTable) {
      selectedTableName = selectedTable.name;
      const tempSchema: Schema = { name: activeSchema, tables: [selectedTable] };
      displaySQL = generateSQL(tempSchema);
    }
  }

  // Score — average across all tables, floor 0
  let score = 0;
  if (activeSchemaTables.length > 0) {
    const totalScore = activeSchemaTables.reduce((sum, table) => {
      return sum + validateTable(table, schemas).score;
    }, 0);
    score = Math.max(0, Math.floor(totalScore / activeSchemaTables.length));
  }

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to local state so React Flow sees drag positions immediately
      setNodes((nds) => applyNodeChanges(changes, nds));
      // Persist final position to store only when drag ends
      for (const change of changes) {
        if (
          change.type === "position" &&
          change.dragging === false &&
          change.position
        ) {
          updateTablePosition(activeSchema, change.id, change.position);
        }
      }
    },
    [activeSchema, updateTablePosition]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedTableId((prev) => (prev === node.id ? null : node.id));
    },
    []
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar
        onExport={() => exportSchema(schemas)}
        onClear={clearCanvas}
      />

      {/* Main content pushed below fixed top bar */}
      <div className="flex flex-row flex-1 overflow-hidden pt-12">
        {/* Left — Canvas 60% */}
        <div className="flex flex-col" style={{ width: "60%" }}>
          <SchemaTabBar />
          <div className="flex-1 relative">
            {activeSchemaTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <p className="text-gray-400 text-sm">
                  Click Add Table to start building your schema.
                </p>
              </div>
            )}
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls />
            </ReactFlow>
          </div>
        </div>

        {/* Right — SQL Panel 40% */}
        <div
          className="overflow-y-auto border-l border-gray-200 bg-gray-50"
          style={{ width: "40%" }}
        >
          <SQLPanel
            sql={displaySQL}
            score={score}
            issues={allIssues}
            selectedTableName={selectedTableName}
            onShowAll={() => setSelectedTableId(null)}
          />
        </div>
      </div>
    </div>
  );
}
