import { describe, expect, it } from 'vitest'
import { formatBytes, formatCurrency, formatDate, formatDateTime, formatNumber, isValidTimeZone } from '../../shared/utils/format'

describe('formatDateTime', () => {
  it('renders weekday, date and 24h time in the given time zone', () => {
    expect(formatDateTime('2026-10-14T15:57:00Z', 'Asia/Jakarta')).toBe('Wed, 14 Oct 2026 22:57')
  })

  it('shifts the calendar day across time zones', () => {
    expect(formatDateTime('2026-10-14T20:30:00Z', 'Asia/Jakarta')).toBe('Thu, 15 Oct 2026 03:30')
    expect(formatDateTime('2026-10-14T20:30:00Z', 'America/New_York')).toBe('Wed, 14 Oct 2026 16:30')
  })

  it('renders midnight as 00', () => {
    expect(formatDateTime('2026-01-01T17:00:00Z', 'Asia/Jakarta')).toBe('Fri, 2 Jan 2026 00:00')
  })

  it('uses Sep, not Sept', () => {
    expect(formatDate('2026-09-01T05:00:00Z', 'UTC')).toBe('Tue, 1 Sep 2026')
  })

  it('returns an empty string for missing or invalid input', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDate('not a date')).toBe('')
  })
})

describe('formatCurrency', () => {
  it('formats IDR with comma thousands separators and no decimals', () => {
    expect(formatCurrency(128000)).toBe('IDR 128,000')
    expect(formatCurrency(12500000)).toBe('IDR 12,500,000')
    expect(formatCurrency(0)).toBe('IDR 0')
    expect(formatCurrency(999.6)).toBe('IDR 1,000')
  })
})

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(12500)).toBe('12,500')
  })
})

describe('formatBytes', () => {
  it('picks a readable unit', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})

describe('isValidTimeZone', () => {
  it('accepts IANA zones and rejects garbage', () => {
    expect(isValidTimeZone('Asia/Jakarta')).toBe(true)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
  })
})
