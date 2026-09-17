import { useCallback, useEffect, useRef, useState } from 'react'
import type { InMsg, OutMsg } from './tablebase.worker'
import type { PlacementScore, Scenario } from './Tablebase'

export type AnalyzeResult = {
  bestAction: number
  expected: number
  placeAction?: number
  placeExpected?: number
  alive: number
  minRemaining: number
  passReason?: 'no_fit' | 'regret'
  waitPieceId?: number
  offShortest?: boolean
  placements: PlacementScore[]
  scenarios: Scenario[]
}

const FULL_PACK = '/data/tilings_full.bin'

export function useTablebase(packUrl = FULL_PACK) {
  const workerRef = useRef<Worker | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<AnalyzeResult | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('./tablebase.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    worker.onmessage = (ev: MessageEvent<OutMsg>) => {
      const msg = ev.data
      if (msg.type === 'ready') {
        setReady(true)
        setLoading(false)
        setError(null)
      } else if (msg.type === 'error') {
        setError(msg.message)
        setLoading(false)
      } else if (msg.type === 'result') {
        setResult({
          bestAction: msg.bestAction,
          expected: msg.expected,
          placeAction: msg.placeAction,
          placeExpected: msg.placeExpected,
          alive: msg.alive,
          minRemaining: msg.minRemaining,
          passReason: msg.passReason,
          waitPieceId: msg.waitPieceId,
          offShortest: msg.offShortest,
          placements: msg.placements,
          scenarios: msg.scenarios,
        })
      }
    }
    const loadMsg: InMsg = { type: 'load', url: packUrl }
    worker.postMessage(loadMsg)
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [packUrl])

  const analyze = useCallback(
    (board: number, figure: number, deluxeLeft: number, topK = 10) => {
      const w = workerRef.current
      if (!w || !ready) return
      const msg: InMsg = { type: 'analyze', board, figure, deluxeLeft, topK }
      w.postMessage(msg)
    },
    [ready],
  )

  return { ready, loading, error, result, analyze }
}
