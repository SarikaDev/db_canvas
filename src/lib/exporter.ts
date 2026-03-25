import { SchemasRecord } from "../types/schema";
import { generateSQL } from "./sqlGenerator";

export function exportSchema(allSchemas: SchemasRecord): void {
  const schemaOrder: Array<keyof SchemasRecord> = ["public", "auth", "app"];

  const sections: string[] = [];

  for (const schemaName of schemaOrder) {
    const schema = allSchemas[schemaName];
    const sql = generateSQL(schema);

    sections.push(`## ${schemaName}\n\n\`\`\`sql\n${sql}\n\`\`\``);
  }

  const content = sections.join("\n\n");

  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "schema-export.md";
  anchor.click();
  URL.revokeObjectURL(url);
}
