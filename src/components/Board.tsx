import { ACTIONS, COLS, MASKS, ROWS } from '../lib/pieces'

type Props = {
  board: number
  piece: number
  bestAction: number
  previewAction: number | null
  onHover: (action: number | null) => void
  onPlace: (action: number) => void
}

export function Board({
  board,
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
          className={[
            'aspect-square w-full rounded-[clamp(0.4rem,1.2vw,0.75rem)] border transition',
            filled
              ? 'border-sky-400/40 bg-sky-400/80'
              : 'border-white/10 bg-black/35 hover:border-sky-300/40',
            isBest && !filled ? 'ring-2 ring-emerald-400 shadow-[0_0_14px_rgba(16,185,129,.35)]' : '',
            isPrev && !filled ? (illegal ? 'bg-rose-500/45' : 'bg-sky-300/35') : '',
          ].join(' ')}
          onMouseEnter={() => onHover(a)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onPlace(a)}
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
