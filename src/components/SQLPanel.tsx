import { useState } from "react";
import ScoreBadge from "./ScoreBadge";
import { ValidationIssue } from "../types/schema";

interface SQLPanelProps {
  sql: string;
  score: number;
  issues: ValidationIssue[];
  selectedTableName?: string;
  onShowAll: () => void;
}

export default function SQLPanel({
  sql,
  score,
  issues,
  selectedTableName,
  onShowAll,
}: SQLPanelProps) {
  const [copied, setCopied] = useState(false);

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const hasErrors = errors.length > 0;
  const hasSchema = sql.length > 0 || issues.length > 0;

  function handleCopy() {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      {/* Score Badge */}
      <ScoreBadge score={score} hasErrors={hasErrors} hasSchema={hasSchema} />

      {/* SQL Code Block */}
      <div className="flex flex-col gap-2">
        {selectedTableName && (
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-700">{selectedTableName}</span>
            <button
              onClick={onShowAll}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Show All
            </button>
          </div>
        )}

        <div className="relative rounded-lg bg-gray-900 overflow-hidden">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition-colors"
          >
            {copied ? "Copied!" : "Copy SQL"}
          </button>
          {sql ? (
            <pre className="text-sm text-green-300 font-mono p-4 pt-8 overflow-x-auto whitespace-pre-wrap">
              {sql}
            </pre>
          ) : (
            <p className="text-sm text-gray-500 font-mono p-4 pt-8">
              Add a table to see generated SQL
            </p>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex flex-col gap-2">
        {errors.length === 0 && warnings.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">
            No issues found. Schema is valid.
          </p>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Errors
                </span>
                {errors.map((issue, idx) => (
                  <div key={idx} className="flex gap-2 text-sm text-red-700">
                    <code className="font-mono font-semibold shrink-0">{issue.code}</code>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Warnings
                </span>
                {warnings.map((issue, idx) => (
                  <div key={idx} className="flex gap-2 text-sm text-amber-700">
                    <code className="font-mono font-semibold shrink-0">{issue.code}</code>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
