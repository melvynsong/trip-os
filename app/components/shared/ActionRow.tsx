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
    {!hideRemove && (
      <button
        onClick={onDelete}
        disabled={isActing}
        className="ml-auto h-8 rounded-full px-2.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
      >
        Remove Now
      </button>
    )}
  </div>
);
