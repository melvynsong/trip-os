import { describe, expect, it } from 'vitest'
import { normalizeFlightNumber } from './service'

describe('normalizeFlightNumber', () => {
  it('normalizes two-letter airline code with no space', () => {
    expect(normalizeFlightNumber('SQ895')).toEqual({
      normalized: 'SQ 895',
      airlineCode: 'SQ',
      flightNumber: '895',
    })
  })

  it('normalizes three-letter airline code', () => {
    expect(normalizeFlightNumber('LHA10')).toEqual({
      normalized: 'LHA 10',
      airlineCode: 'LHA',
      flightNumber: '10',
    })
  })

  it('normalizes with spaces and lowercase input', () => {
    expect(normalizeFlightNumber(' sq  895 ')).toEqual({
      normalized: 'SQ 895',
      airlineCode: 'SQ',
      flightNumber: '895',
    })
  })

  it('does not greedily consume digits into airline code', () => {
    expect(normalizeFlightNumber('SQ895')).toEqual({
      normalized: 'SQ 895',
      airlineCode: 'SQ',
      flightNumber: '895',
    })
  })

  it('throws for invalid inputs', () => {
    expect(() => normalizeFlightNumber('S895')).toThrow()
    expect(() => normalizeFlightNumber('SQAB')).toThrow()
    expect(() => normalizeFlightNumber('SQ12AB')).toThrow()
    expect(() => normalizeFlightNumber('U2807')).toThrow()
  })
})
