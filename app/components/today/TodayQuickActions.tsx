'use client'

import { QUICK_ACTION_LABELS, type QuickActionType } from '@/lib/ai/today'
import Chip from '@/app/components/ui/Chip'

const ACTIONS: QuickActionType[] = [
  'replan',
  'lighter',
  'lunch_nearby',
  'shorten',
  'replace_attraction',
]

type TodayQuickActionsProps = {
  onAction: (action: QuickActionType) => void
  disabled?: boolean
}

export default function TodayQuickActions({ onAction, disabled }: TodayQuickActionsProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
        AI Quick Actions
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ACTIONS.map((action) => (
          <Chip
            key={action}
            onClick={() => onAction(action)}
            disabled={disabled}
            className="h-10 shrink-0"
          >
            {QUICK_ACTION_LABELS[action]}
          </Chip>
        ))}
      </div>
    </div>
  )
}
