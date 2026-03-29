import { getLocalDateFromIsoDatetime } from './localDateFromIso'
import { describe, it, expect } from 'vitest'

describe('getLocalDateFromIsoDatetime', () => {
  it('returns correct local date for Asia/Singapore', () => {
    const iso = '2026-03-29T23:30:00+08:00'
    expect(getLocalDateFromIsoDatetime(iso, 'Asia/Singapore')).toBe('2026-03-29')
  })

  it('returns correct local date for Asia/Shanghai', () => {
    const iso = '2026-03-30T02:15:00+08:00'
    expect(getLocalDateFromIsoDatetime(iso, 'Asia/Shanghai')).toBe('2026-03-30')
  })

  it('handles UTC input and converts to local', () => {
    const iso = '2026-03-29T18:00:00Z'
    expect(getLocalDateFromIsoDatetime(iso, 'Asia/Singapore')).toBe('2026-03-30')
  })

  it('falls back to raw date if timezone missing', () => {
    const iso = '2026-03-29T18:00:00Z'
    expect(getLocalDateFromIsoDatetime(iso, '')).toBe('2026-03-29')
  })
})
