// Shared ActionRow for card actions (move up/down, done, delete)
// Usage: <ActionRow ...props />
import React from 'react';

interface ActionRowProps {
  isActing: boolean;
  onDelete: () => void;
  hideRemove?: boolean;
}

export const ActionRow: React.FC<ActionRowProps> = ({ isActing, onDelete, hideRemove }) => (
  <div className="mt-2.5 flex flex-wrap items-center gap-2">
    <button
      onClick={onToggleDone}
      disabled={isActing}
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
        isDone
          ? 'border-green-500 bg-green-500 text-white'
          : 'border-slate-300 hover:border-emerald-400'
      } disabled:cursor-not-allowed`}
      title={isDone ? 'Mark incomplete' : 'Mark done'}
    >
      {isDone && (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
    <button
      onClick={onMoveUp}
      disabled={!canMoveUp || isActing}
      className="h-8 rounded-full border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 hover:bg-sky-50/70"
    >
      ↑
    </button>
    <button
      onClick={onMoveDown}
      disabled={!canMoveDown || isActing}
      className="h-8 rounded-full border-slate-200 bg-slate-50/70 px-2.5 text-xs text-slate-700 hover:bg-sky-50/70"
    >
      ↓
    </button>
    <button
      onClick={onDelete}
      disabled={isActing}
      className="ml-auto h-8 rounded-full px-2.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
    >
      Remove Now
    </button>
  </div>
);
