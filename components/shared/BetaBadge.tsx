import React from 'react'
export default function BetaBadge({ tooltip }: { tooltip: string }) {
  return (
    <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs" title={tooltip}>
      Beta
    </span>
  )
}
