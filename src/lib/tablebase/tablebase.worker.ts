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
      const allowDeluxe = deluxeLeft > 0
      const fig = figure === 6 && !allowDeluxe ? 0 : figure
      const rec = tb.recommend(board, fig, { allowDeluxe })
      const alive = tb.aliveStats(board)
      const out: OutMsg = {
        type: 'result',
        board,
        figure: fig,
        bestAction: rec.action,
        expected: rec.expected,
        alive: alive.count,
        minRemaining: alive.minRemaining,
        placements: fig === 6 && !allowDeluxe ? [] : tb.evaluatePlacements(board, fig),
        scenarios: tb.shortestContinuations(board, topK, {
          allowDeluxe,
          preferFigure: fig,
        }),
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
