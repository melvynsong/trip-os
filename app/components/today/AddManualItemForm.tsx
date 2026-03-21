'use client'

import { useState } from 'react'
import { ActivityType } from '@/types/trip'
import Button from '@/app/components/ui/Button'

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'food', label: '🍜 Food' },
  { value: 'attraction', label: '📍 Attraction' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'transport', label: '🚗 Transport' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'note', label: '📝 Note' },
  { value: 'other', label: '📌 Other' },
]

type AddManualItemFormProps = {
  onAdd: (item: {
    title: string
    activity_time: string | null
    type: ActivityType
    notes: string | null
  }) => Promise<void>
  isAdding: boolean
  onCancel: () => void
}

export default function AddManualItemForm({ onAdd, isAdding, onCancel }: AddManualItemFormProps) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState<ActivityType>('other')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    try {
      await onAdd({
        title: title.trim(),
        activity_time: time || null,
        type,
        notes: notes.trim() || null,
      })
      // Reset on success
      setTitle('')
      setTime('')
      setType('other')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-4 font-semibold">Add Item</h3>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunch at Tsukiji Market"
            className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-black/10"
            autoFocus
          />
        </div>

        {/* Time + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
              className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-black/10"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any details…"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-black/10"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={onCancel}
            disabled={isAdding}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isAdding || !title.trim()}
            variant="primary"
            loading={isAdding}
            className="flex-1"
          >
            Add Item
          </Button>
        </div>
      </div>
    </form>
  )
}
