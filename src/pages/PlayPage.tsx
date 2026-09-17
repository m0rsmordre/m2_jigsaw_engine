import { useEffect, useState } from 'react'
import { Board, type Placement } from '../components/Board'
import { ChestBadge } from '../components/ChestBadge'
import { PiecePicker } from '../components/PiecePicker'
import { PieceThumb } from '../components/PieceThumb'
import { ScenarioList } from '../components/ScenarioList'
import { useLang } from '../hooks/useLang'
import { projectedMoves } from '../lib/chest'
import { actionLabel, FULL, MASKS, PIECE_NAMES, SKIP } from '../lib/pieces'
import type { Scenario } from '../lib/tablebase/Tablebase'
import { useTablebase } from '../lib/tablebase/useTablebase'

type Snap = {
  board: number
  piece: number
  deluxe: number
  turn: number
  placements: Placement[]
}

export function PlayPage() {
  const { d } = useLang()
  const [board, setBoard] = useState(0)
  const [piece, setPiece] = useState(1)
  const [deluxe, setDeluxe] = useState(4)
  const [turn, setTurn] = useState(1)
  const [preview, setPreview] = useState<number | null>(null)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [history, setHistory] = useState<Snap[]>([])
  const { ready, loading, error, result, analyze } = useTablebase('/data/tilings_full.bin')

  useEffect(() => {
    if (piece === 6 && deluxe <= 0) setPiece(0)
  }, [piece, deluxe])

  useEffect(() => {
    if (ready) analyze(board, piece, deluxe)
  }, [ready, board, piece, deluxe, analyze])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft') return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return
      }
      e.preventDefault()
      setHistory((h) => {
        if (!h.length) return h
        const prev = h[h.length - 1]
        setBoard(prev.board)
        setPiece(prev.piece)
        setDeluxe(prev.deluxe)
        setTurn(prev.turn)
        setPlacements(prev.placements)
        return h.slice(0, -1)
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const best = result?.bestAction ?? -1
  const done = board === FULL
  const movesUsed = Math.max(0, turn - 1)
  const expectedLeft =
    result && Number.isFinite(result.expected) ? result.expected : NaN
  const projected = done
    ? movesUsed
    : Number.isFinite(expectedLeft)
      ? projectedMoves(turn, Math.ceil(expectedLeft))
      : NaN
  const forcePass = piece === 6 && deluxe <= 0
  const recommendPass = !done && (best === SKIP || best < 0 || forcePass)
  const passReason = forcePass ? 'no_fit' : result?.passReason
  const waitPieceId = result?.waitPieceId ?? result?.scenarios?.[0]?.nextPieceId
  const waitPieceName =
    waitPieceId !== undefined && waitPieceId >= 0 && waitPieceId < PIECE_NAMES.length
      ? PIECE_NAMES[waitPieceId]
      : null
  const passHint =
    recommendPass && passReason === 'regret'
      ? d.mustPassRegret.replace('{piece}', waitPieceName ?? '—')
      : recommendPass
        ? d.mustPass
        : null
  const offShortestHint =
    !recommendPass && result?.offShortest && waitPieceName
      ? d.offShortestHint.replace('{piece}', waitPieceName)
      : null

  function pushHistory() {
    setHistory((h) => [...h, { board, piece, deluxe, turn, placements }])
  }

  function place(action: number, figure = piece) {
    if (figure === 6 && deluxe <= 0) return
    const mask = MASKS[figure][action]
    if (mask === -1 || (board & mask) !== 0) return
    pushHistory()
    if (figure === 6) setDeluxe((x) => x - 1)
    setPiece(figure)
    setBoard((b) => b | mask)
    setPlacements((p) => [...p, { figure, action }])
    setTurn((t) => t + 1)
  }

  function discard() {
    pushHistory()
    setTurn((t) => t + 1)
  }

  function undo() {
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setBoard(prev.board)
      setPiece(prev.piece)
      setDeluxe(prev.deluxe)
      setTurn(prev.turn)
      setPlacements(prev.placements)
      return h.slice(0, -1)
    })
  }

  function resetAll() {
    setBoard(0)
    setPiece(1)
    setDeluxe(4)
    setTurn(1)
    setPlacements([])
    setHistory([])
  }

  function applyScenario(sc: Scenario) {
    if (sc.nextPieceId === 6 && deluxe <= 0) return
    place(sc.nextAction, sc.nextPieceId)
  }

  function applyBest() {
    if (best === SKIP || best < 0) {
      discard()
      return
    }
    place(best, piece)
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {loading && (
        <div className="text-sm text-amber-200">{d.loading}</div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <h2 className="text-sm font-bold">{d.yourPiece}</h2>
          <PiecePicker piece={piece} deluxeLeft={deluxe} onSelect={setPiece} />
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            <span className="text-sm">{d.deluxeStock}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-white/15"
                onClick={() => setDeluxe((x) => Math.max(0, x - 1))}
              >
                -
              </button>
              <strong>{deluxe}</strong>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-white/15"
                onClick={() => setDeluxe((x) => Math.min(4, x + 1))}
              >
                +
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            {d.turn} <strong className="text-sky-300">{turn}</strong>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm font-bold"
              onClick={discard}
            >
              {d.discard}
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold disabled:opacity-40"
              onClick={undo}
              disabled={!history.length}
            >
              {d.undo}
            </button>
            <button
              type="button"
              className="col-span-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm font-bold"
              onClick={resetAll}
            >
              {d.reset}
            </button>
          </div>
          <p className="text-xs text-slate-500">{d.placeHint}</p>
        </section>

        <section className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 lg:sticky lg:top-5">
          <h2 className="text-lg font-bold">{d.board}</h2>
          <div className="flex w-full flex-1 items-center justify-center py-2">
            <Board
              board={board}
              placements={placements}
              piece={piece}
              bestAction={recommendPass ? -1 : best}
              previewAction={preview}
              onHover={setPreview}
              onPlace={(a) => place(a)}
            />
          </div>
          <div className="min-h-6 text-center text-sm font-bold text-emerald-300">
            {board === FULL ? d.boardFull : '\u00a0'}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div>
            <h2 className="text-sm font-bold">{d.analysis}</h2>
            <p className="text-xs text-slate-400">
              {done ? d.gameOverHint : d.analysisHint}
            </p>
          </div>

          {done ? (
            <div className="space-y-4 rounded-2xl border border-amber-300/30 bg-gradient-to-b from-amber-400/15 to-black/20 p-5 text-center">
              <div className="text-lg font-extrabold text-amber-100">{d.gameOver}</div>
              <div className="text-sm text-slate-300">{d.boardFull}</div>
              <div className="mx-auto mt-2 max-w-xs space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {d.yourMoves}
                </div>
                <div className="text-4xl font-black text-white">{movesUsed}</div>
                <div className="flex justify-center pt-1">
                  <ChestBadge moves={movesUsed} />
                </div>
              </div>
              <p className="text-[0.7rem] text-slate-500">{d.chestHint}</p>
              <button
                type="button"
                className="rounded-xl border border-sky-400/40 bg-sky-400/15 px-4 py-2 text-sm font-bold"
                onClick={resetAll}
              >
                {d.playAgain}
              </button>
            </div>
          ) : (
            <>
              <div
                className={`rounded-2xl border p-3 ${
                  recommendPass
                    ? 'border-amber-400/35 bg-amber-400/10'
                    : 'border-white/10 bg-black/25'
                }`}
              >
                <div className="text-xs text-slate-400">{d.bestMove}</div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    {recommendPass && waitPieceId !== undefined ? (
                      <PieceThumb pieceId={waitPieceId} size={40} />
                    ) : (
                      <PieceThumb pieceId={piece} size={40} />
                    )}
                  </div>
                  <button
                    type="button"
                    className={`text-2xl font-extrabold hover:text-emerald-300 ${
                      recommendPass ? 'text-amber-200' : ''
                    }`}
                    onClick={applyBest}
                    title={d.bestMove}
                  >
                    {actionLabel(recommendPass ? SKIP : best)}
                  </button>
                </div>
                {passHint && (
                  <p className="mt-2 text-xs font-medium text-amber-200/90">{passHint}</p>
                )}
                {offShortestHint && (
                  <p className="mt-2 text-xs font-medium text-sky-200/90">{offShortestHint}</p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white/5 p-2" title={d.estRemainingHint}>
                    <div className="text-slate-400">{d.estRemaining}</div>
                    <div className="font-bold">
                      {Number.isFinite(expectedLeft) ? expectedLeft.toFixed(2) : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <div className="text-slate-400">{d.remainingPaths}</div>
                    <div className="font-bold">
                      {result?.alive.toLocaleString() ?? '—'}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-white/5 p-2">
                  <div className="text-xs text-slate-400">{d.projectedChest}</div>
                  {Number.isFinite(projected) ? (
                    <>
                      <span className="text-sm font-bold">{projected}</span>
                      <ChestBadge moves={projected} />
                    </>
                  ) : (
                    <span className="text-sm font-bold">—</span>
                  )}
                </div>
                <p className="mt-2 text-[0.7rem] leading-snug text-slate-500">{d.chestHint}</p>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {d.shortestPaths}
                </h3>
                <ScenarioList
                  scenarios={result?.scenarios ?? []}
                  turn={turn}
                  onPick={applyScenario}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
