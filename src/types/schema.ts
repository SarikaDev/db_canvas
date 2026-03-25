export type SchemaName = "public" | "auth" | "app";

export type PostgresType =
  | "uuid" | "text" | "varchar" | "char"
  | "int" | "bigint" | "smallint" | "numeric"
  | "float" | "real" | "boolean" | "timestamp"
  | "timestamptz" | "date" | "time" | "jsonb"
  | "json" | "bytea" | "serial" | "bigserial";

export type OnDeleteRule =
  | "RESTRICT" | "CASCADE" | "SET NULL"
  | "SET DEFAULT" | "NO ACTION";

export interface ForeignKey {
  schemaName: SchemaName;
  tableName: string;
  columnName: string;
  onDelete: OnDeleteRule;
}

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  columnId?: string;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  score: number;
}

export interface Column {
  id: string;
  name: string;
  type: PostgresType;
  isPK: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  checkExpr?: string;
  fk?: ForeignKey;
  indexSuggested: boolean;
}

export interface Table {
  id: string;
  name: string;
  schemaName: SchemaName;
  columns: Column[];
  rlsEnabled: boolean;
  position: { x: number; y: number };
}

export interface Schema {
  name: SchemaName;
  tables: Table[];
}

export type SchemasRecord = Record<SchemaName, Schema>;

export interface AppState {
  schemas: SchemasRecord;
  activeSchema: SchemaName;
}
