'use client'

import { QUICK_ACTION_LABELS, type QuickActionType } from '@/lib/ai/today'

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
          <button
            key={action}
            onClick={() => onAction(action)}
            disabled={disabled}
            className="shrink-0 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {QUICK_ACTION_LABELS[action]}
          </button>
        ))}
      </div>
    </div>
  )
}
