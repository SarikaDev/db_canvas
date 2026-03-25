import { Table, SchemasRecord, ValidationIssue, ValidationResult } from "../types/schema";
import { RESERVED_KEYWORDS } from "./constants";

export function validateTable(table: Table, allSchemas: SchemasRecord): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // ── HARD ERRORS ────────────────────────────────────────────────────────────

  // ERR_EMPTY_TABLE_NAME
  if (!table.name || table.name.trim() === "") {
    errors.push({
      level: "error",
      code: "ERR_EMPTY_TABLE_NAME",
      message: "Table name is empty or whitespace only.",
    });
  }

  // ERR_RESERVED_TABLE (table name)
  if (table.name && RESERVED_KEYWORDS.includes(table.name.trim().toLowerCase())) {
    errors.push({
      level: "error",
      code: "ERR_RESERVED_TABLE",
      message: `"${table.name}" is a PostgreSQL reserved keyword and cannot be used as a table name.`,
    });
  }

  // ERR_DUPLICATE_COL
  const colNames: string[] = [];
  for (const col of table.columns) {
    const lowerName = col.name.trim().toLowerCase();
    if (lowerName !== "" && colNames.includes(lowerName)) {
      errors.push({
        level: "error",
        code: "ERR_DUPLICATE_COL",
        message: `Duplicate column name "${col.name}" in table "${table.name}".`,
        columnId: col.id,
      });
    } else {
      colNames.push(lowerName);
    }
  }

  for (const col of table.columns) {
    // ERR_EMPTY_COL_NAME
    if (!col.name || col.name.trim() === "") {
      errors.push({
        level: "error",
        code: "ERR_EMPTY_COL_NAME",
        message: "Column name is empty or whitespace only.",
        columnId: col.id,
      });
    }

    // ERR_RESERVED_TABLE (column name)
    if (col.name && RESERVED_KEYWORDS.includes(col.name.trim().toLowerCase())) {
      errors.push({
        level: "error",
        code: "ERR_RESERVED_TABLE",
        message: `"${col.name}" is a PostgreSQL reserved keyword and cannot be used as a column name.`,
        columnId: col.id,
      });
    }

    // FK validation
    if (col.fk) {
      const targetSchema = allSchemas[col.fk.schemaName];
      const targetTable = targetSchema?.tables.find((t) => t.name === col.fk!.tableName);
      const targetCol = targetTable?.columns.find((c) => c.name === col.fk!.columnName);

      // ERR_FK_TARGET_MISSING
      if (!targetSchema || !targetTable || !targetCol) {
        errors.push({
          level: "error",
          code: "ERR_FK_TARGET_MISSING",
          message: `Foreign key references "${col.fk.schemaName}.${col.fk.tableName}.${col.fk.columnName}" which does not exist.`,
          columnId: col.id,
        });
      } else {
        // ERR_FK_TYPE_MISMATCH
        if (col.type !== targetCol.type) {
          errors.push({
            level: "error",
            code: "ERR_FK_TYPE_MISMATCH",
            message: `Foreign key type "${col.type}" does not match referenced column type "${targetCol.type}".`,
            columnId: col.id,
          });
        }

        // ERR_FK_NOT_PK_UNIQUE
        if (!targetCol.isPK && !targetCol.isUnique) {
          errors.push({
            level: "error",
            code: "ERR_FK_NOT_PK_UNIQUE",
            message: `Referenced column "${col.fk.columnName}" is neither a primary key nor unique.`,
            columnId: col.id,
          });
        }
      }
    }
  }

  // If any hard errors: score is 0, return immediately
  if (errors.length > 0) {
    return { errors, warnings, score: 0 };
  }

  // ── WARNINGS ───────────────────────────────────────────────────────────────

  let score = 100;

  const pkColumns = table.columns.filter((c) => c.isPK);

  // WARN_NO_PK
  if (pkColumns.length === 0) {
    warnings.push({
      level: "warning",
      code: "WARN_NO_PK",
      message: "No primary key defined. Every table should have a primary key.",
    });
    score -= 20;
  }

  // WARN_SERIAL_PK
  for (const pk of pkColumns) {
    if (pk.type === "serial" || pk.type === "bigserial") {
      warnings.push({
        level: "warning",
        code: "WARN_SERIAL_PK",
        message: `Primary key "${pk.name}" uses ${pk.type} instead of uuid with gen_random_uuid().`,
        columnId: pk.id,
      });
      score -= 8;
      break; // deduct once
    }
  }

  // WARN_PK_NOT_NAMED_ID
  for (const pk of pkColumns) {
    if (pk.name !== "id") {
      warnings.push({
        level: "warning",
        code: "WARN_PK_NOT_NAMED_ID",
        message: `Primary key column "${pk.name}" is not named "id".`,
        columnId: pk.id,
      });
      score -= 5;
      break; // deduct once
    }
  }

  // WARN_INT_PK_LARGE_TABLE
  for (const pk of pkColumns) {
    if (pk.type === "int") {
      warnings.push({
        level: "warning",
        code: "WARN_INT_PK_LARGE_TABLE",
        message: `Primary key "${pk.name}" uses int instead of bigint or uuid.`,
        columnId: pk.id,
      });
      score -= 5;
      break;
    }
  }

  // WARN_CAMEL_CASE_TABLE
  if (/[A-Z]/.test(table.name)) {
    warnings.push({
      level: "warning",
      code: "WARN_CAMEL_CASE_TABLE",
      message: `Table name "${table.name}" contains uppercase letters. Use snake_case instead.`,
    });
    score -= 5;
  }

  // WARN_SINGULAR_TABLE
  if (table.name && !table.name.trim().endsWith("s")) {
    warnings.push({
      level: "warning",
      code: "WARN_SINGULAR_TABLE",
      message: `Table name "${table.name}" does not end in "s". Table names should be plural.`,
    });
    score -= 3;
  }

  // WARN_RLS_NO_POLICY
  if (table.rlsEnabled) {
    warnings.push({
      level: "warning",
      code: "WARN_RLS_NO_POLICY",
      message: "RLS is enabled but no custom policies have been defined. Add INSERT, UPDATE, and DELETE policies.",
    });
    score -= 10;
  }

  // Per-column warnings with caps
  let timestampNoTzDeduction = 0;
  let floatMoneyDeduction = 0;
  let fkNoIndexDeduction = 0;
  let camelCaseColDeduction = 0;
  let fkColNotIdSuffixDeduction = 0;
  let charTypeDeduction = 0;
  let varcharUnboundedDeduction = 0;

  for (const col of table.columns) {
    // WARN_TIMESTAMP_NO_TZ — deduct 8 per column, max 16
    if (col.type === "timestamp" && timestampNoTzDeduction < 16) {
      const deduct = Math.min(8, 16 - timestampNoTzDeduction);
      warnings.push({
        level: "warning",
        code: "WARN_TIMESTAMP_NO_TZ",
        message: `Column "${col.name}" uses timestamp instead of timestamptz. This loses timezone information.`,
        columnId: col.id,
      });
      timestampNoTzDeduction += deduct;
    }

    // WARN_FLOAT_MONEY — deduct 10 per column, max 10
    if ((col.type === "float" || col.type === "real") && floatMoneyDeduction < 10) {
      warnings.push({
        level: "warning",
        code: "WARN_FLOAT_MONEY",
        message: `Column "${col.name}" uses ${col.type} which is imprecise for monetary or exact values. Use numeric instead.`,
        columnId: col.id,
      });
      floatMoneyDeduction += 10;
    }

    // WARN_FK_NO_INDEX — deduct 10 per FK, max 20
    if (col.fk && !col.indexSuggested && fkNoIndexDeduction < 20) {
      const deduct = Math.min(10, 20 - fkNoIndexDeduction);
      warnings.push({
        level: "warning",
        code: "WARN_FK_NO_INDEX",
        message: `Foreign key column "${col.name}" has no index. Add an index to improve join performance.`,
        columnId: col.id,
      });
      fkNoIndexDeduction += deduct;
    }

    // WARN_CAMEL_CASE_COL — deduct 5 per column, max 15
    if (/[A-Z]/.test(col.name) && camelCaseColDeduction < 15) {
      const deduct = Math.min(5, 15 - camelCaseColDeduction);
      warnings.push({
        level: "warning",
        code: "WARN_CAMEL_CASE_COL",
        message: `Column "${col.name}" contains uppercase letters. Use snake_case instead.`,
        columnId: col.id,
      });
      camelCaseColDeduction += deduct;
    }

    // WARN_FK_COL_NOT_ID_SUFFIX — deduct 5 per column, max 10
    if (col.fk && !col.name.endsWith("_id") && fkColNotIdSuffixDeduction < 10) {
      const deduct = Math.min(5, 10 - fkColNotIdSuffixDeduction);
      warnings.push({
        level: "warning",
        code: "WARN_FK_COL_NOT_ID_SUFFIX",
        message: `Foreign key column "${col.name}" does not end in "_id".`,
        columnId: col.id,
      });
      fkColNotIdSuffixDeduction += deduct;
    }

    // WARN_CHAR_TYPE — deduct 5 per column, max 10
    if (col.type === "char" && charTypeDeduction < 10) {
      const deduct = Math.min(5, 10 - charTypeDeduction);
      warnings.push({
        level: "warning",
        code: "WARN_CHAR_TYPE",
        message: `Column "${col.name}" uses char type. Prefer text or varchar instead.`,
        columnId: col.id,
      });
      charTypeDeduction += deduct;
    }

    // WARN_VARCHAR_UNBOUNDED — deduct 3 per column, max 9
    if (col.type === "varchar" && !col.checkExpr && varcharUnboundedDeduction < 9) {
      const deduct = Math.min(3, 9 - varcharUnboundedDeduction);
      warnings.push({
        level: "warning",
        code: "WARN_VARCHAR_UNBOUNDED",
        message: `Column "${col.name}" uses varchar without a CHECK constraint to limit length.`,
        columnId: col.id,
      });
      varcharUnboundedDeduction += deduct;
    }
  }

  score -= timestampNoTzDeduction;
  score -= floatMoneyDeduction;
  score -= fkNoIndexDeduction;
  score -= camelCaseColDeduction;
  score -= fkColNotIdSuffixDeduction;
  score -= charTypeDeduction;
  score -= varcharUnboundedDeduction;

  score = Math.max(0, score);

  return { errors, warnings, score };
}
