/** Etkinlik sandık eşikleri (hamle sayısı). */
export type ChestTier = 'B' | 'O' | 'K'

export function chestFromMoves(moves: number): ChestTier {
  if (moves <= 10) return 'B'
  if (moves <= 24) return 'O'
  return 'K'
}

/** Tur sayacı 1'den başlar; yapılan hamle = turn - 1. */
export function projectedMoves(turn: number, remaining: number): number {
  const t = Number(turn)
  const r = Number(remaining)
  if (!Number.isFinite(t) || !Number.isFinite(r)) return NaN
  return Math.max(0, t - 1) + Math.max(0, r)
}
