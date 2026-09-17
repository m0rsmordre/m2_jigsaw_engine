import { ACTIONS, COLS, MASKS, ROWS, resolvePlacementAction } from '../lib/pieces'
import { PIECE_COLORS } from '../lib/pieceAssets'

export type Placement = { figure: number; action: number }

type Props = {
  board: number
  placements: Placement[]
  piece: number
  bestAction: number
  previewAction: number | null
  onHover: (action: number | null) => void
  onPlace: (action: number) => void
}

function cellFigure(placements: Placement[], bit: number): number | null {
  for (let i = placements.length - 1; i >= 0; i--) {
    const { figure, action } = placements[i]
    const mask = MASKS[figure]?.[action]
    if (mask !== undefined && mask !== -1 && (mask & (1 << bit)) !== 0) return figure
  }
  return null
}

export function Board({
  board,
  placements,
  piece,
  bestAction,
  previewAction,
  onHover,
  onPlace,
}: Props) {
  const cells = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const a = c * ROWS + r
      const bit = 23 - (c * ROWS + r)
      const filled = (board & (1 << bit)) !== 0
      const fig = filled ? cellFigure(placements, bit) : null
      const fillColor = fig !== null ? PIECE_COLORS[fig] : undefined
      const bestMask = bestAction >= 0 && bestAction < ACTIONS ? MASKS[piece][bestAction] : -1
      const isBest = bestMask !== -1 && (bestMask & (1 << bit)) !== 0
      const prevMask =
        previewAction !== null && previewAction >= 0 && previewAction < ACTIONS
          ? MASKS[piece][previewAction]
          : -1
      const isPrev = prevMask !== -1 && (prevMask & (1 << bit)) !== 0
      const illegal =
        isPrev &&
        previewAction !== null &&
        (MASKS[piece][previewAction] === -1 || (board & MASKS[piece][previewAction]!) !== 0)

      cells.push(
        <button
          key={a}
          type="button"
          style={
            filled && fillColor
              ? {
                  background: fillColor,
                  borderColor: 'rgba(0,0,0,0.45)',
                  boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.28)`,
                }
              : undefined
          }
          className={[
            'aspect-square w-full rounded-[clamp(0.4rem,1.2vw,0.75rem)] border transition',
            filled
              ? 'border-black/40'
              : 'border-white/10 bg-black/35 hover:border-sky-300/40',
            isBest && !filled ? 'ring-2 ring-emerald-400 shadow-[0_0_14px_rgba(16,185,129,.35)]' : '',
            isPrev && !filled ? (illegal ? 'bg-rose-500/45' : 'bg-sky-300/35') : '',
          ].join(' ')}
          onMouseEnter={() => {
            const resolved = resolvePlacementAction(board, piece, a, bestAction)
            onHover(resolved)
          }}
          onMouseLeave={() => onHover(null)}
          onClick={() => {
            const resolved = resolvePlacementAction(board, piece, a, bestAction)
            if (resolved !== null) onPlace(resolved)
          }}
        />,
      )
    }
  }

  return (
    <div
      className="grid w-full max-w-[min(100%,24rem)] gap-[clamp(0.25rem,0.8vw,0.4rem)] rounded-2xl bg-black/40 p-[clamp(0.75rem,2vw,1rem)] shadow-inner"
      style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
    >
      {cells}
    </div>
  )
}
