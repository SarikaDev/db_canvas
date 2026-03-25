import { Schema, Table, Column } from "../types/schema";

function generateColumnDef(col: Column): string {
  const parts: string[] = [];

  parts.push(`  "${col.name}" ${col.type}`);

  if (!col.isNullable) {
    parts[0] += " NOT NULL";
  }

  if (col.isUnique) {
    parts[0] += " UNIQUE";
  }

  if (col.defaultValue !== undefined && col.defaultValue !== "") {
    parts[0] += ` DEFAULT ${col.defaultValue}`;
  }

  if (col.checkExpr !== undefined && col.checkExpr !== "") {
    parts[0] += ` CHECK (${col.checkExpr})`;
  }

  return parts[0];
}

function generateTableSQL(schema: Schema, table: Table): string {
  const qualifiedName = `"${schema.name}"."${table.name}"`;
  const lines: string[] = [];

  // 1. CREATE TABLE with schema-qualified name
  lines.push(`CREATE TABLE ${qualifiedName} (`);

  // 2. All columns with type, NOT NULL, UNIQUE, DEFAULT, CHECK
  const colDefs = table.columns.map((col) => generateColumnDef(col));

  // 3. PRIMARY KEY constraint
  const pkCols = table.columns.filter((c) => c.isPK);
  if (pkCols.length > 0) {
    const pkNames = pkCols.map((c) => `"${c.name}"`).join(", ");
    colDefs.push(`  PRIMARY KEY (${pkNames})`);
  }

  // 4. FOREIGN KEY constraints with ON DELETE rule
  for (const col of table.columns) {
    if (col.fk) {
      const fkLine =
        `  FOREIGN KEY ("${col.name}") REFERENCES "${col.fk.schemaName}"."${col.fk.tableName}" ("${col.fk.columnName}") ON DELETE ${col.fk.onDelete}`;
      colDefs.push(fkLine);
    }
  }

  lines.push(colDefs.join(",\n"));

  // 5. Closing semicolon
  lines.push(");");

  // 6. CREATE INDEX for every column with indexSuggested true
  for (const col of table.columns) {
    if (col.indexSuggested) {
      const indexName = `idx_${table.name}_${col.name}`;
      lines.push(
        `CREATE INDEX "${indexName}" ON ${qualifiedName} ("${col.name}");`
      );
    }
  }

  // 7. ALTER TABLE ENABLE ROW LEVEL SECURITY if rlsEnabled
  if (table.rlsEnabled) {
    lines.push(`ALTER TABLE ${qualifiedName} ENABLE ROW LEVEL SECURITY;`);

    // 8. CREATE POLICY stub referencing auth.uid() if rlsEnabled
    lines.push(
      `CREATE POLICY "select_policy" ON ${qualifiedName}`
    );
    lines.push(`  FOR SELECT USING (auth.uid() IS NOT NULL);`);
    lines.push(
      `-- TODO: Add INSERT, UPDATE, DELETE policies for ${qualifiedName}`
    );
  }

  return lines.join("\n");
}

export function generateSQL(schema: Schema): string {
  if (schema.tables.length === 0) {
    return "";
  }

  // 9. Blank line between tables
  return schema.tables.map((table) => generateTableSQL(schema, table)).join("\n\n");
}
