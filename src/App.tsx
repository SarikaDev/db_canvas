import { useState, useCallback, useEffect, useMemo } from "react";
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
import { ValidationIssue } from "./types/schema";

// CRITICAL: Move nodeTypes OUTSIDE the component to prevent re-mounting nodes on every render
const nodeTypes = { tableNode: TableNode };

export default function App() {
  const schemas = useSchemaStore((s) => s.schemas);
  const activeSchema = useSchemaStore((s) => s.activeSchema);
  const updateTablePosition = useSchemaStore((s) => s.updateTablePosition);
  const clearCanvas = useSchemaStore((s) => s.clearCanvas);

  const activeSchemaTables = schemas[activeSchema].tables;

  // Local nodes state
  const [nodes, setNodes] = useState<Node[]>([]);

  // FIX 1: Stable Node Synchronization
  // This ensures we only update the 'data' property of existing nodes
  // instead of creating entirely new Node objects which kills focus in Edge.
  useEffect(() => {
    setNodes((currentNodes) => {
      return activeSchemaTables.map((table) => {
        const existingNode = currentNodes.find((n) => n.id === table.id);

        if (existingNode) {
          // If the table data is exactly the same, return the existing object reference
          if (existingNode.data.table === table) {
            return existingNode;
          }
          // If data changed, only update the 'data' object, keep the rest of the node stable
          return {
            ...existingNode,
            data: { ...existingNode.data, table, schemaName: activeSchema },
          };
        }

        // New node creation
        return {
          id: table.id,
          type: "tableNode",
          position: table.position,
          data: { table, schemaName: activeSchema },
        };
      });
    });
  }, [activeSchema, activeSchemaTables]);

  // FIX 2: Memoize Edges to prevent recalculating on every keystroke
  const edges = useMemo(() => {
    const newEdges: Edge[] = [];
    for (const table of activeSchemaTables) {
      for (const col of table.columns) {
        if (col.fk && col.fk.schemaName === activeSchema) {
          const targetTable = activeSchemaTables.find(
            (t) => t.name === col.fk!.tableName,
          );
          if (targetTable) {
            newEdges.push({
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
    return newEdges;
  }, [activeSchema, activeSchemaTables]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
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
    [activeSchema, updateTablePosition],
  );

  // SQL and Validation pre-calculations
  const fullSQL = useMemo(
    () => generateSQL(schemas[activeSchema]),
    [schemas, activeSchema],
  );

  const allIssues: ValidationIssue[] = useMemo(() => {
    return activeSchemaTables.flatMap((table) => {
      const result = validateTable(table, schemas);
      return [...result.errors, ...result.warnings];
    });
  }, [activeSchemaTables, schemas]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar onExport={() => exportSchema(schemas)} onClear={clearCanvas} />

      <div className="flex flex-row flex-1 overflow-hidden pt-12">
        <div className="flex flex-col" style={{ width: "60%" }}>
          <SchemaTabBar />
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              // Prevent clicking the canvas from stealing focus while typing
              deleteKeyCode={null}
              selectionKeyCode={null}
              multiSelectionKeyCode={null}
              fitView
              fitViewOptions={{ padding: 0.2 }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls />
            </ReactFlow>
          </div>
        </div>

        <div
          className="overflow-y-auto border-l border-gray-200 bg-gray-50"
          style={{ width: "40%" }}
        >
          <SQLPanel
            sql={fullSQL}
            score={0}
            issues={allIssues}
            onShowAll={() => {}} // Cleaned up unused state logic
          />
        </div>
      </div>
    </div>
  );
}
