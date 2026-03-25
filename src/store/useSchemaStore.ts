import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { SchemaName, Table, Column, SchemasRecord } from "../types/schema";
import { AUTO_INDEX_COLUMN_NAMES } from "../lib/constants";

const initialSchemas: SchemasRecord = {
  public: { name: "public", tables: [] },
  auth: { name: "auth", tables: [] },
  app: { name: "app", tables: [] },
};

interface SchemaStore {
  schemas: SchemasRecord;
  activeSchema: SchemaName;

  setActiveSchema: (name: SchemaName) => void;
  addTable: (schemaName: SchemaName, tableName: string) => void;
  updateTableName: (schemaName: SchemaName, tableId: string, newName: string) => void;
  updateTablePosition: (schemaName: SchemaName, tableId: string, position: { x: number; y: number }) => void;
  toggleRLS: (schemaName: SchemaName, tableId: string) => void;
  deleteTable: (schemaName: SchemaName, tableId: string) => void;
  addColumn: (schemaName: SchemaName, tableId: string) => void;
  updateColumn: (schemaName: SchemaName, tableId: string, columnId: string, patch: Partial<Column>) => void;
  deleteColumn: (schemaName: SchemaName, tableId: string, columnId: string) => void;
  clearCanvas: () => void;
}

export const useSchemaStore = create<SchemaStore>()(
  persist(
    (set) => ({
      schemas: initialSchemas,
      activeSchema: "public",

      setActiveSchema: (name) =>
        set({ activeSchema: name }),

      addTable: (schemaName, tableName) =>
        set((state) => {
          const tables = state.schemas[schemaName].tables;
          const newTable: Table = {
            id: uuidv4(),
            name: tableName,
            schemaName,
            columns: [],
            rlsEnabled: false,
            position: { x: 100 + tables.length * 320, y: 80 },
          };
          return {
            schemas: {
              ...state.schemas,
              [schemaName]: {
                ...state.schemas[schemaName],
                tables: [...tables, newTable],
              },
            },
          };
        }),

      updateTableName: (schemaName, tableId, newName) =>
        set((state) => ({
          schemas: {
            ...state.schemas,
            [schemaName]: {
              ...state.schemas[schemaName],
              tables: state.schemas[schemaName].tables.map((t) =>
                t.id === tableId ? { ...t, name: newName } : t
              ),
            },
          },
        })),

      updateTablePosition: (schemaName, tableId, position) =>
        set((state) => ({
          schemas: {
            ...state.schemas,
            [schemaName]: {
              ...state.schemas[schemaName],
              tables: state.schemas[schemaName].tables.map((t) =>
                t.id === tableId ? { ...t, position } : t
              ),
            },
          },
        })),

      toggleRLS: (schemaName, tableId) =>
        set((state) => ({
          schemas: {
            ...state.schemas,
            [schemaName]: {
              ...state.schemas[schemaName],
              tables: state.schemas[schemaName].tables.map((t) =>
                t.id === tableId ? { ...t, rlsEnabled: !t.rlsEnabled } : t
              ),
            },
          },
        })),

      deleteTable: (schemaName, tableId) =>
        set((state) => ({
          schemas: {
            ...state.schemas,
            [schemaName]: {
              ...state.schemas[schemaName],
              tables: state.schemas[schemaName].tables.filter((t) => t.id !== tableId),
            },
          },
        })),

      addColumn: (schemaName, tableId) =>
        set((state) => {
          const newColumn: Column = {
            id: uuidv4(),
            name: "",
            type: "text",
            isPK: false,
            isNullable: true,
            isUnique: false,
            indexSuggested: false,
          };
          return {
            schemas: {
              ...state.schemas,
              [schemaName]: {
                ...state.schemas[schemaName],
                tables: state.schemas[schemaName].tables.map((t) =>
                  t.id === tableId
                    ? { ...t, columns: [...t.columns, newColumn] }
                    : t
                ),
              },
            },
          };
        }),

      updateColumn: (schemaName, tableId, columnId, patch) =>
        set((state) => ({
          schemas: {
            ...state.schemas,
            [schemaName]: {
              ...state.schemas[schemaName],
              tables: state.schemas[schemaName].tables.map((t) => {
                if (t.id !== tableId) return t;
                return {
                  ...t,
                  columns: t.columns.map((col) => {
                    if (col.id !== columnId) return col;
                    const merged: Column = { ...col, ...patch };
                    if (merged.fk !== undefined) {
                      merged.indexSuggested = true;
                    }
                    if (AUTO_INDEX_COLUMN_NAMES.includes(merged.name)) {
                      merged.indexSuggested = true;
                    }
                    return merged;
                  }),
                };
              }),
            },
          },
        })),

      deleteColumn: (schemaName, tableId, columnId) =>
        set((state) => ({
          schemas: {
            ...state.schemas,
            [schemaName]: {
              ...state.schemas[schemaName],
              tables: state.schemas[schemaName].tables.map((t) =>
                t.id === tableId
                  ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
                  : t
              ),
            },
          },
        })),

      clearCanvas: () =>
        set({
          schemas: {
            public: { name: "public", tables: [] },
            auth: { name: "auth", tables: [] },
            app: { name: "app", tables: [] },
          },
          activeSchema: "public",
        }),
    }),
    {
      name: "dbarchitect-state",
    }
  )
);
