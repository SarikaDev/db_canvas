import React from "react";

interface TopBarProps {
  onExport: () => void;
  onClear: () => void;
}

export default function TopBar({ onExport, onClear }: TopBarProps) {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [exported, setExported] = React.useState(false);

  function handleExport() {
    onExport();
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  function handleConfirmClear() {
    onClear();
    setShowConfirm(false);
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 h-12">
        <span className="text-white font-bold text-lg tracking-tight">DB Architect</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
          >
            {exported ? "Exported!" : "Export"}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-colors"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <p className="text-gray-800 font-medium text-sm leading-relaxed">
              This will permanently delete your entire schema. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="text-sm px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
