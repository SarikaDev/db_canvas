
interface ScoreBadgeProps {
  score: number;
  hasErrors: boolean;
  hasSchema: boolean;
}

export default function ScoreBadge({ score, hasErrors, hasSchema }: ScoreBadgeProps) {
  if (!hasSchema) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-100 px-4 py-3">
        <span className="text-gray-500 font-medium">No schema yet</span>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-100 px-4 py-3">
        <span className="text-2xl font-bold text-red-700">0</span>
        <span className="text-red-700 font-medium">Fix errors to generate SQL</span>
      </div>
    );
  }

  if (score >= 90) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-green-100 px-4 py-3">
        <span className="text-2xl font-bold text-green-700">{score}</span>
        <span className="text-green-700 font-medium">Production ready</span>
      </div>
    );
  }

  if (score >= 70) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-amber-100 px-4 py-3">
        <span className="text-2xl font-bold text-amber-700">{score}</span>
        <span className="text-amber-700 font-medium">Good, minor issues</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg bg-red-100 px-4 py-3">
      <span className="text-2xl font-bold text-red-700">{score}</span>
      <span className="text-red-700 font-medium">Needs fixes</span>
    </div>
  );
}
