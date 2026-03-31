"use client";
import React from 'react'
import { useRouter } from 'next/navigation'
import BetaBadge from '@/components/shared/BetaBadge'

export function GeneratePackingListButton({ tripId }: { tripId: string }) {
  const router = useRouter()
  return (
    <button
      className="btn btn-primary flex items-center gap-2"
      onClick={() => router.push(`/trips/${tripId}/packing`)}
    >
      Generate Packing List
      <BetaBadge tooltip="Packing List is in Beta. Results may vary." />
    </button>
  )
}
