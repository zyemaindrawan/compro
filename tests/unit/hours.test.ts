import { describe, expect, it } from 'vitest'
import { summarizeWorkHours } from '../../shared/utils/hours'
import type { WorkHour } from '../../shared/schemas/settings.schema'

const day = (d: WorkHour['day'], open = '09:00', close = '18:00', closed = false): WorkHour => ({ day: d, open, close, closed })

describe('summarizeWorkHours', () => {
  it('groups consecutive days with identical hours', () => {
    const hours = [
      day('mon'), day('tue'), day('wed'), day('thu'),
      day('fri', '09:00', '17:00'),
      day('sat', '', '', true), day('sun', '', '', true),
    ]
    expect(summarizeWorkHours(hours)).toEqual([
      { days: 'Mon–Thu', hours: '09:00–18:00' },
      { days: 'Fri', hours: '09:00–17:00' },
      { days: 'Sat–Sun', hours: 'Closed' },
    ])
  })

  it('treats missing days as closed', () => {
    expect(summarizeWorkHours([day('mon')])).toEqual([
      { days: 'Mon', hours: '09:00–18:00' },
      { days: 'Tue–Sun', hours: 'Closed' },
    ])
  })
})
