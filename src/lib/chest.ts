/** Etkinlik sandık eşikleri (hamle sayısı). TR: B/O/K · EN gösterim: B/M/S */
export type ChestTier = 'B' | 'O' | 'K'

export function chestFromMoves(moves: number): ChestTier {
  if (moves <= 10) return 'B'
  if (moves <= 24) return 'O'
  return 'K'
}

/** UI kısaltması: TR B/O/K · EN B/M/S · DE G/M/K (Große / Mittlere / Kleine). */
export function chestCode(tier: ChestTier, lang: 'tr' | 'en' | 'de'): string {
  if (lang === 'tr') return tier
  if (lang === 'de') return tier === 'B' ? 'G' : tier === 'O' ? 'M' : 'K'
  return tier === 'B' ? 'B' : tier === 'O' ? 'M' : 'S'
}

/** Tur sayacı 1'den başlar; yapılan hamle = turn - 1. */
export function projectedMoves(turn: number, remaining: number): number {
  const t = Number(turn)
  const r = Number(remaining)
  if (!Number.isFinite(t) || !Number.isFinite(r)) return NaN
  return Math.max(0, t - 1) + Math.max(0, r)
}
