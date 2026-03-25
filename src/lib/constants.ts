export const POSTGRES_TYPES = [
  "uuid", "text", "varchar", "char", "int", "bigint", "smallint",
  "numeric", "float", "real", "boolean", "timestamp", "timestamptz",
  "date", "time", "jsonb", "json", "bytea", "serial", "bigserial"
];

export const RESERVED_KEYWORDS = [
  "select", "from", "where", "table", "column", "index", "user", "order",
  "group", "by", "having", "limit", "offset", "insert", "update", "delete",
  "create", "drop", "alter", "add", "set", "default", "null", "not", "and",
  "or", "in", "is", "as", "on", "join", "left", "right", "inner", "outer",
  "full", "cross", "union", "all", "any", "case", "when", "then", "else",
  "end", "true", "false", "primary", "key", "foreign", "references", "unique",
  "check", "constraint", "schema", "database", "grant", "revoke", "role",
  "session", "transaction", "begin", "commit", "rollback", "with",
  "returning", "window", "over", "partition", "row", "rows", "range",
  "current", "value", "values", "exists", "between", "like", "ilike",
  "similar", "cast", "coalesce", "nullif", "greatest", "least"
];

export const ON_DELETE_RULES = [
  "RESTRICT", "CASCADE", "SET NULL", "SET DEFAULT", "NO ACTION"
];

export const AUTO_INDEX_COLUMN_NAMES = [
  "email", "username", "slug", "phone", "status", "type", "role"
];
