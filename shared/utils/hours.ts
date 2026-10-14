import { WEEKDAY_KEYS, type WeekdayKey } from '../constants'
import type { WorkHour } from '../schemas/settings.schema'

const SHORT: Record<WeekdayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

export interface WorkHourLine {
  days: string
  hours: string
}

function hoursLabel(entry: WorkHour | undefined) {
  if (!entry || entry.closed || !entry.open || !entry.close) return 'Closed'
  return `${entry.open}–${entry.close}`
}

export function summarizeWorkHours(workHours: WorkHour[]): WorkHourLine[] {
  const byDay = new Map(workHours.map(entry => [entry.day, entry]))
  const lines: { from: WeekdayKey, to: WeekdayKey, hours: string }[] = []

  for (const day of WEEKDAY_KEYS) {
    const hours = hoursLabel(byDay.get(day))
    const last = lines.at(-1)
    if (last && last.hours === hours) last.to = day
    else lines.push({ from: day, to: day, hours })
  }

  return lines.map(line => ({
    days: line.from === line.to ? SHORT[line.from] : `${SHORT[line.from]}–${SHORT[line.to]}`,
    hours: line.hours,
  }))
}
