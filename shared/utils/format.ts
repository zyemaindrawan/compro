import { DEFAULT_TIMEZONE } from '../constants'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const partFormatters = new Map<string, Intl.DateTimeFormat>()
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: string
  minute: string
}

function getPartFormatter(timeZone: string) {
  let formatter = partFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    partFormatters.set(timeZone, formatter)
  }
  return formatter
}

function toDate(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(
    getPartFormatter(timeZone).formatToParts(date).map(part => [part.type, part.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour === '24' ? '00' : String(parts.hour),
    minute: String(parts.minute),
  }
}

function formatDay({ year, month, day }: ZonedParts) {
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${weekday}, ${day} ${MONTHS[month - 1]} ${year}`
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  }
  catch {
    return false
  }
}

export function formatDate(value: string | number | Date | null | undefined, timeZone = DEFAULT_TIMEZONE) {
  const date = value == null ? null : toDate(value)
  if (!date) return ''
  return formatDay(zonedParts(date, timeZone))
}

export function formatDateTime(value: string | number | Date | null | undefined, timeZone = DEFAULT_TIMEZONE) {
  const date = value == null ? null : toDate(value)
  if (!date) return ''
  const parts = zonedParts(date, timeZone)
  return `${formatDay(parts)} ${parts.hour}:${parts.minute}`
}

export function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value))
}

export function formatCurrency(value: number) {
  return `IDR ${formatNumber(value)}`
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
