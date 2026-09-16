import { actionLabel, PIECE_NAMES } from '../lib/pieces'
import type { Scenario } from '../lib/tablebase/Tablebase'
import { projectedMoves } from '../lib/chest'
import { useLang } from '../hooks/useLang'
import { PieceThumb } from './PieceThumb'
import { ChestBadge } from './ChestBadge'

type Props = {
  scenarios: Scenario[]
  turn: number
  onPick: (scenario: Scenario) => void
}

export function ScenarioList({ scenarios, turn, onPick }: Props) {
  const { d, lang } = useLang()
  if (!scenarios.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        {d.noPaths}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {scenarios.map((sc, i) => {
        const finish = projectedMoves(turn, sc.remaining)
        const finishLabel = Number.isFinite(finish) ? String(finish) : '—'
        return (
          <button
            key={`${sc.index}-${sc.nextMask}-${sc.nextPieceId}`}
            type="button"
            onClick={() => onPick(sc)}
            className={[
              'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
              i === 0
                ? 'border-emerald-400/40 bg-emerald-400/10'
                : 'border-white/10 bg-white/5 hover:border-sky-400/30',
            ].join(' ')}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
              <PieceThumb pieceId={sc.nextPieceId} size={40} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold">
                  {finishLabel} {d.movesLabel} · {d.remainingLabel} {sc.remaining}
                </div>
                {Number.isFinite(finish) && <ChestBadge moves={finish} compact />}
              </div>
              <div className="mt-0.5 truncate text-xs text-slate-400">
                {d.needPiece}: {PIECE_NAMES[sc.nextPieceId]}
              </div>
            </div>
            <div className="shrink-0 text-right text-sm font-bold text-sky-300">
              {actionLabel(sc.nextAction)}
              <div className="text-[0.65rem] font-medium text-slate-500">
                {lang === 'tr' ? 'sonraki' : 'next'}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
