/** Event schedules. Wiki times are Europe/Berlin; convert to absolute Date for countdowns. */

export type TimedEvent = {
  id: string
  label: string
  serverGroup: string
  start: Date
  end: Date
}

const BERLIN = 'Europe/Berlin'
const ISTANBUL = 'Europe/Istanbul'

export function europeLocalToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: BERLIN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  let t = Date.UTC(year, month - 1, day, hour, minute)
  for (let i = 0; i < 6; i++) {
    const parts = Object.fromEntries(
      fmt
        .formatToParts(new Date(t))
        .filter((p) => p.type !== 'literal')
        .map((p) => [p.type, p.value]),
    )
    const got = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    )
    const want = Date.UTC(year, month - 1, day, hour, minute)
    t += want - got
  }
  return new Date(t)
}

function berlinYmd(d: Date): { y: number; m: number; day: number; wd: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: BERLIN,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const parts = Object.fromEntries(
    fmt
      .formatToParts(d)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  )
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    day: Number(parts.day),
    wd: parts.weekday,
  }
}

export function formatTrRange(start: Date, end: Date): string {
  const day = new Intl.DateTimeFormat('tr-TR', {
    timeZone: ISTANBUL,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start)
  const tf = new Intl.DateTimeFormat('tr-TR', {
    timeZone: ISTANBUL,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${day} · ${tf.format(start)} – ${tf.format(end)} TSİ`
}

export type CountdownParts = {
  mode: 'until-start' | 'until-end' | 'ended'
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function countdown(start: Date, end: Date, now = Date.now()): CountdownParts {
  const target = now < start.getTime() ? start.getTime() : now < end.getTime() ? end.getTime() : null
  if (target === null) {
    return { mode: 'ended', days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const s = Math.max(0, Math.floor((target - now) / 1000))
  return {
    mode: now < start.getTime() ? 'until-start' : 'until-end',
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export function formatCountdown(c: CountdownParts, lang: 'tr' | 'en'): string {
  const body =
    lang === 'tr'
      ? `${c.days} gün ${c.hours} saat ${c.minutes} dakika ${c.seconds} saniye`
      : `${c.days}d ${c.hours}h ${c.minutes}m ${c.seconds}s`
  if (c.mode === 'until-start') {
    return lang === 'tr' ? `${body} sonra etkinlik başlayacak` : `Event starts in ${body}`
  }
  if (c.mode === 'until-end') {
    return lang === 'tr' ? `${body} sonra etkinlik bitecek` : `Event ends in ${body}`
  }
  return lang === 'tr' ? 'Etkinlik bitti' : 'Event ended'
}

export const EZEL_FISHING_TSI = [
  { start: '2026-03-22T22:00:00+03:00', end: '2026-03-23T02:00:00+03:00' },
  { start: '2026-04-19T21:00:00+03:00', end: '2026-04-20T01:00:00+03:00' },
  { start: '2026-05-17T21:00:00+03:00', end: '2026-05-18T01:00:00+03:00' },
  { start: '2026-06-14T21:00:00+03:00', end: '2026-06-15T01:00:00+03:00' },
  { start: '2026-07-12T21:00:00+03:00', end: '2026-07-13T01:00:00+03:00' },
  { start: '2026-08-09T21:00:00+03:00', end: '2026-08-10T01:00:00+03:00' },
  { start: '2026-09-06T21:00:00+03:00', end: '2026-09-07T01:00:00+03:00' },
  { start: '2026-10-04T21:00:00+03:00', end: '2026-10-05T01:00:00+03:00' },
  { start: '2026-11-01T22:00:00+03:00', end: '2026-11-02T02:00:00+03:00' },
] as const

export type MarmaraDay = { date: string; e1: string; e2: string }

export const MARMARA_MARCH_2026: MarmaraDay[] = [
  { date: '2026-03-01', e1: 'Arttırma Kağıdı', e2: 'Nesneyi Efsunla' },
  { date: '2026-03-02', e1: 'Nugget', e2: 'SüperTaş' },
  { date: '2026-03-03', e1: 'Münzevi Tavsiyesi', e2: 'Yeşil Ejderha Fasülyesi' },
  { date: '2026-03-04', e1: 'Kötü Ruh Kovma Kağıdı', e2: 'Cor Draconis' },
  { date: '2026-03-05', e1: 'İnce Kumaş', e2: 'Muffin' },
  { date: '2026-03-06', e1: 'Kutsama Kağıdı', e2: 'Küçük Kutsama' },
  { date: '2026-03-07', e1: 'Pet Kitabı Sandığı', e2: 'Kırmızı Abanoz Sandık' },
  { date: '2026-03-08', e1: 'Balıkçılık', e2: 'Kutsama Küresi' },
  { date: '2026-03-09', e1: 'Geçit Bileti', e2: 'Yeşil Ejderha Fasülyesi' },
  { date: '2026-03-10', e1: 'SüperTaş', e2: 'Cor Draconis' },
  { date: '2026-03-11', e1: 'İnce Kumaş', e2: 'Nugget' },
  { date: '2026-03-12', e1: 'Münzevi Tavsiyesi', e2: 'Kötü Ruh Kovma Kağıdı' },
  { date: '2026-03-13', e1: 'Kutsama Kağıdı', e2: 'Küçük Kutsama' },
  { date: '2026-03-14', e1: 'Işınlanma Yüzüğü', e2: 'Balıkçılık' },
  { date: '2026-03-15', e1: 'Arttırma Kağıdı', e2: 'Kırmızı Abanoz Sandık' },
  { date: '2026-03-16', e1: 'Muffin', e2: 'Cor Draconis' },
  { date: '2026-03-17', e1: 'Yeşil Ejderha Fasülyesi', e2: 'SüperTaş' },
  { date: '2026-03-18', e1: 'İnce Kumaş', e2: 'Kötü Ruh Kovma Kağıdı' },
  { date: '2026-03-19', e1: 'Cor Draconis', e2: 'Münzevi Tavsiyesi' },
  { date: '2026-03-20', e1: 'Kutsama Kağıdı', e2: 'Küçük Kutsama' },
  { date: '2026-03-21', e1: 'Arttırma Kağıdı', e2: 'Ay Işığı' },
  { date: '2026-03-22', e1: 'Nesneyi Efsunla', e2: 'Envanter Genişletme' },
  { date: '2026-03-23', e1: 'Geçit Bileti', e2: 'Yeşil Ejderha Fasülyesi' },
  { date: '2026-03-24', e1: 'SüperTaş', e2: 'Cor Draconis' },
  { date: '2026-03-25', e1: 'İnce Kumaş', e2: 'Nugget' },
  { date: '2026-03-26', e1: 'Münzevi Tavsiyesi', e2: 'Kötü Ruh Kovma Kağıdı' },
  { date: '2026-03-27', e1: 'Kutsama Kağıdı', e2: 'Küçük Kutsama' },
  { date: '2026-03-28', e1: 'Balıkçılık', e2: 'Işınlanma Yüzüğü' },
  { date: '2026-03-29', e1: 'Kırmızı Abanoz Sandık', e2: 'Ejderha Alevi' },
  { date: '2026-03-30', e1: 'İnce Kumaş', e2: 'Cor Draconis' },
  { date: '2026-03-31', e1: 'Kötü Ruh Kovma Kağıdı', e2: 'SüperTaş' },
]

function marmaraEventsFromDay(day: MarmaraDay): TimedEvent[] {
  const [y, m, d] = day.date.split('-').map(Number)
  const mk = (label: string, h0: number, h1: number, i: number): TimedEvent => {
    const start = europeLocalToDate(y, m, d, h0, 0)
    const end =
      h1 >= 24
        ? new Date(europeLocalToDate(y, m, d, 0, 0).getTime() + 24 * 3600 * 1000)
        : europeLocalToDate(y, m, d, h1, 0)
    return {
      id: `marmara-${day.date}-${i}`,
      label,
      serverGroup: 'Marmara / Bagjanamu',
      start,
      end,
    }
  }
  return [mk(day.e1, 16, 20, 0), mk(day.e2, 20, 24, 1)]
}

export function upcomingEzelFishing(now = Date.now()): TimedEvent[] {
  return EZEL_FISHING_TSI.map((e, i) => ({
    id: `ezel-${i}`,
    label: 'Balıkçılık',
    serverGroup: 'Ezel / Barbaros',
    start: new Date(e.start),
    end: new Date(e.end),
  })).filter((e) => e.end.getTime() > now)
}

export function upcomingMarmara(now = Date.now()): TimedEvent[] {
  return MARMARA_MARCH_2026.flatMap(marmaraEventsFromDay).filter((e) => e.end.getTime() > now)
}

export function nextCharonFishing(from = Date.now(), count = 10): TimedEvent[] {
  const out: TimedEvent[] = []
  const seen = new Set<string>()
  for (let i = 0; i < 90 && out.length < count; i++) {
    const probe = new Date(from + i * 86400000)
    const { y, m, day, wd } = berlinYmd(probe)
    const key = `${y}-${m}-${day}`
    if (seen.has(key)) continue
    if (wd === 'Wed') {
      seen.add(key)
      const start = europeLocalToDate(y, m, day, 2, 0)
      const end = europeLocalToDate(y, m, day, 14, 0)
      if (end.getTime() > from) {
        out.push({
          id: `charon-wed-${key}`,
          label: 'Balıkçılık Etkinliği',
          serverGroup: 'Charon / Lucifer / Safir / Star',
          start,
          end,
        })
      }
    } else if (wd === 'Sat') {
      seen.add(key)
      const start = europeLocalToDate(y, m, day, 14, 0)
      const end = europeLocalToDate(y, m, day, 18, 0)
      if (end.getTime() > from) {
        out.push({
          id: `charon-sat-${key}`,
          label: 'Balıkçılık Etkinliği',
          serverGroup: 'Charon / Lucifer / Safir / Star',
          start,
          end,
        })
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}

export const CHARON_WEEKLY = [
  {
    dayTr: 'Pazartesi',
    slots: [
      ['02:00–14:00', 'Münzevi Tavsiyesi'],
      ['14:00–18:00', 'Yeşil Ejderha Fasulyesi'],
      ['18:00–22:00', 'Kutsama Kağıdı'],
      ['22:00–02:00', 'Nugget'],
    ],
  },
  {
    dayTr: 'Salı',
    slots: [
      ['02:00–14:00', 'Güneş Özütü'],
      ['14:00–18:00', 'Cor Draconis'],
      ['18:00–22:00', 'Küçük Kutsama'],
      ['22:00–02:00', 'Nesneyi Efsunla'],
    ],
  },
  {
    dayTr: 'Çarşamba',
    slots: [
      ['02:00–14:00', 'Balıkçılık Etkinliği'],
      ['14:00–18:00', 'Kutsama Küresi'],
      ['18:00–22:00', 'Münzevi Tavsiyesi'],
      ['22:00–02:00', 'Süper Taş'],
    ],
  },
  {
    dayTr: 'Perşembe',
    slots: [
      ['02:00–14:00', 'Ay Özütü'],
      ['14:00–18:00', 'Küçük Kutsama'],
      ['18:00–22:00', 'Cor Draconis'],
      ['22:00–02:00', 'Arttırma Kağıdı'],
    ],
  },
  {
    dayTr: 'Cuma',
    slots: [
      ['02:00–14:00', 'Yeşil Ejderha Fasulyesi'],
      ['14:00–18:00', 'Nesneyi Efsunla'],
      ['18:00–22:00', 'Süper Taş'],
      ['22:00–02:00', 'Cor Draconis'],
    ],
  },
  {
    dayTr: 'Cumartesi',
    slots: [
      ['02:00–14:00', 'Kutsama Kağıdı'],
      ['14:00–18:00', 'Balıkçılık Etkinliği'],
      ['18:00–22:00', 'Robin (Yağma) (1 Gün)'],
      ['22:00–02:00', 'Ay Işığı'],
    ],
  },
  {
    dayTr: 'Pazar',
    slots: [
      ['02:00–14:00', 'Kötü Ruh Kovma Kağıdı'],
      ['14:00–18:00', 'Arttırma Kağıdı'],
      ['18:00–22:00', 'Kötü Ruh Kovma Kağıdı'],
      ['22:00–02:00', 'Liderin Kitabı'],
    ],
  },
] as const

/** TSİ for Europe slot — summer (CEST +1) vs winter (CET +2). */
export function euToTsi(eu: string, summer: boolean): string {
  const s: Record<string, string> = {
    '02:00–14:00': '03:00–15:00',
    '14:00–18:00': '15:00–19:00',
    '18:00–22:00': '19:00–23:00',
    '22:00–02:00': '23:00–03:00',
  }
  const w: Record<string, string> = {
    '02:00–14:00': '04:00–16:00',
    '14:00–18:00': '16:00–20:00',
    '18:00–22:00': '20:00–00:00',
    '22:00–02:00': '00:00–04:00',
  }
  return `${(summer ? s : w)[eu] ?? eu} TSİ`
}

export function isEuropeSummer(now = Date.now()): boolean {
  const d = new Date(now)
  const y = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: BERLIN, year: 'numeric' }).format(d),
  )
  const noon = europeLocalToDate(y, Number(new Intl.DateTimeFormat('en-US', { timeZone: BERLIN, month: 'numeric' }).format(d)), Number(new Intl.DateTimeFormat('en-US', { timeZone: BERLIN, day: 'numeric' }).format(d)), 12, 0)
  return noon.getUTCHours() === 10
}
