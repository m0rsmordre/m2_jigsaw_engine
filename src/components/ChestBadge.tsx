import { chestCode, chestFromMoves, type ChestTier } from '../lib/chest'
import { useLang } from '../hooks/useLang'

type Props = {
  moves: number
  compact?: boolean
}

const TIER_STYLE: Record<ChestTier, string> = {
  B: 'border-amber-300/50 bg-amber-400/15 text-amber-200',
  O: 'border-sky-300/40 bg-sky-400/10 text-sky-200',
  K: 'border-slate-400/40 bg-white/10 text-slate-300',
}

export function ChestBadge({ moves, compact }: Props) {
  const { lang, d } = useLang()
  if (!Number.isFinite(moves) || moves < 0) return null
  const tier = chestFromMoves(moves)
  const code = chestCode(tier, lang)
  const label =
    tier === 'B' ? d.chestB : tier === 'O' ? d.chestO : d.chestK
  return (
    <span
      className={[
        'inline-flex items-center rounded-lg border font-semibold',
        compact ? 'px-1.5 py-0.5 text-[0.65rem]' : 'px-2 py-1 text-xs',
        TIER_STYLE[tier],
      ].join(' ')}
      title={`${moves} ${d.movesLabel} → ${label}`}
    >
      {compact ? `${code} · ${moves}` : label}
    </span>
  )
}
