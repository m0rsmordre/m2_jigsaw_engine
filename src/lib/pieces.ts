/** Python/jigsaw bitboard: action = col*4 + row, bit = 23 - action */

export const ROWS = 4
export const COLS = 6
export const ACTIONS = 24
export const SKIP = 24
export const FULL = 0x00ff_ffff

export const PIECE_CELLS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[0, 0]], // 0 Tekli
  [[0, 0], [0, 1], [0, 2]], // 1 Cubuk (dikey col-major)
  [[0, 0], [0, 1], [1, 1]], // 2 L
  [[0, 0], [1, 0], [1, 1]], // 3 Ters L
  [[0, 0], [0, 1], [1, 0], [1, 1]], // 4 Kare
  [[0, 0], [1, 0], [1, 1], [2, 1]], // 5 S
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], // 6 Deluxe
]

export const PIECE_NAMES = ['Tekli', 'Cubuk', 'L', 'Ters L', 'Kare', 'S', 'Deluxe'] as const

/** action -> mask for each figure, -1 if OOB */
export const MASKS: number[][] = PIECE_CELLS.map((cells) => {
  const arr = new Array<number>(ACTIONS).fill(-1)
  for (let a = 0; a < ACTIONS; a++) {
    const bc = a >> 2
    const br = a & 3
    let m = 0
    let bad = false
    for (const [dx, dy] of cells) {
      const c = bc + dx
      const r = br + dy
      if (c >= COLS || r >= ROWS) {
        bad = true
        break
      }
      m |= 1 << (23 - (c * ROWS + r))
    }
    arr[a] = bad ? -1 : m
  }
  return arr
})

export function actionLabel(action: number): string {
  if (action === SKIP) return 'PASS'
  return `${(action >> 2) + 1},${(action & 3) + 1}`
}

export function legalActions(board: number, figure: number): number[] {
  const out: number[] = []
  const masks = MASKS[figure]
  for (let a = 0; a < ACTIONS; a++) {
    const m = masks[a]
    if (m !== -1 && (board & m) === 0) out.push(a)
  }
  return out
}

export function maskToAction(figure: number, mask: number): number {
  const masks = MASKS[figure]
  for (let a = 0; a < ACTIONS; a++) {
    if (masks[a] === mask) return a
  }
  return SKIP
}

/** Tıklanan/hover hücrenin bit'ini örten yasal yerleşimler (action = sol-üst origin). */
export function actionsCoveringCell(
  board: number,
  figure: number,
  cellAction: number,
): number[] {
  if (cellAction < 0 || cellAction >= ACTIONS) return []
  const bit = 1 << (23 - cellAction)
  if (board & bit) return []
  const masks = MASKS[figure]
  const out: number[] = []
  for (let a = 0; a < ACTIONS; a++) {
    const m = masks[a]
    if (m !== -1 && (m & bit) !== 0 && (board & m) === 0) out.push(a)
  }
  return out
}

/**
 * Hücreye tıklayınca/hover'da kullanılacak origin action.
 * Birden fazla aday varsa preferAction (önerilen hamle) öncelikli.
 */
export function resolvePlacementAction(
  board: number,
  figure: number,
  cellAction: number,
  preferAction?: number | null,
): number | null {
  const cands = actionsCoveringCell(board, figure, cellAction)
  if (!cands.length) return null
  if (
    preferAction != null &&
    preferAction >= 0 &&
    preferAction < ACTIONS &&
    cands.includes(preferAction)
  ) {
    return preferAction
  }
  return cands[0]
}
