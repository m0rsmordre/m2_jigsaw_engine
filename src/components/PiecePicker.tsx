import { PIECE_NAMES } from '../lib/pieces'
import { PieceThumb } from './PieceThumb'

type Props = {
  piece: number
  deluxeLeft: number
  onSelect: (p: number) => void
}

export function PiecePicker({ piece, deluxeLeft, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {PIECE_NAMES.map((name, p) => {
        const off = p === 6 && deluxeLeft <= 0
        return (
          <button
            key={p}
            type="button"
            disabled={off}
            onClick={() => onSelect(p)}
            className={[
              'flex w-[4.75rem] flex-col items-center rounded-2xl border px-2 py-2 text-center transition',
              piece === p
                ? 'border-sky-400/50 bg-sky-400/15'
                : 'border-white/10 bg-white/5 hover:border-white/20',
              off ? 'opacity-30' : '',
            ].join(' ')}
          >
            <div className="mb-1.5 flex h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-black/25">
              <PieceThumb pieceId={p} size={40} />
            </div>
            <span className="text-[0.7rem] leading-tight text-slate-400">{name}</span>
          </button>
        )
      })}
    </div>
  )
}
