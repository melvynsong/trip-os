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
      {/* Remove button deleted as per requirements */}
  </div>
);
