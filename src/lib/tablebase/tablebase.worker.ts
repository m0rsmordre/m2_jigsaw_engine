import { SKIP } from '../pieces'
import { Tablebase, type Scenario, type PlacementScore } from './Tablebase'

type InMsg =
  | { type: 'load'; url: string }
  | {
      type: 'analyze'
      board: number
      figure: number
      deluxeLeft: number
      topK?: number
    }

type OutMsg =
  | { type: 'ready'; nTilings: number; source: string }
  | { type: 'error'; message: string }
  | {
      type: 'result'
      board: number
      figure: number
      bestAction: number
      expected: number
      alive: number
      minRemaining: number
      passReason?: 'no_fit' | 'regret'
      waitPieceId?: number
      placements: PlacementScore[]
      scenarios: Scenario[]
    }

let tb: Tablebase | null = null

self.onmessage = async (ev: MessageEvent<InMsg>) => {
  const msg = ev.data
  try {
    if (msg.type === 'load') {
      tb = await Tablebase.fromUrl(msg.url)
      const out: OutMsg = { type: 'ready', nTilings: tb.nTilings, source: tb.source }
      self.postMessage(out)
      return
    }
    if (msg.type === 'analyze') {
      if (!tb) throw new Error('Tablebase not loaded')
      const { board, figure, deluxeLeft, topK = 10 } = msg
      const stock = Math.max(0, deluxeLeft | 0)
      const fig = figure === 6 && stock <= 0 ? 0 : figure
      const rec0 = tb.recommend(board, fig, { deluxeLeft: stock })
      const alive = tb.aliveStats(board, stock)
      const placements =
        fig === 6 && stock <= 0 ? [] : tb.evaluatePlacements(board, fig, stock)
      // Gerçek en kısa yollar (elindeki taşı zorlamadan)
      const scenarios = tb.shortestContinuations(board, topK, {
        deluxeLeft: stock,
      })

      // Emniyet: elindeki taş global min'i bir düşüremiyorsa → PASS
      const globalMin = alive.minRemaining
      let rec = rec0
      const preservesShortest =
        globalMin >= 0 &&
        placements.some(
          (p) => p.surviving > 0 && p.action !== SKIP && p.minRemaining === globalMin - 1,
        )
      if (rec.action !== SKIP && globalMin >= 0 && !preservesShortest) {
        rec = {
          action: SKIP,
          expected: globalMin + 1,
          passReason: placements.some((p) => p.surviving > 0) ? 'regret' : 'no_fit',
        }
      }

      const out: OutMsg = {
        type: 'result',
        board,
        figure: fig,
        bestAction: rec.action,
        expected: rec.expected,
        alive: alive.count,
        minRemaining: alive.minRemaining,
        passReason: rec.passReason,
        waitPieceId:
          rec.action === SKIP && scenarios[0] ? scenarios[0].nextPieceId : undefined,
        placements,
        scenarios,
      }
      self.postMessage(out)
    }
  } catch (e) {
    const out: OutMsg = {
      type: 'error',
      message: e instanceof Error ? e.message : String(e),
    }
    self.postMessage(out)
  }
}

export type { InMsg, OutMsg }
