/**
 * FJTB flat tablebase — C++/JS active-set modelinin TypeScript portu.
 * Her hamlede 182k tarama YOK: board değişince aktif küme süzülür.
 */

import { ACTIONS, MASKS, SKIP, maskToAction } from '../pieces'
export type Scenario = {
  index: number
  totalMoves: number
  remaining: number
  pieceIds: number[]
  masks: number[]
  nextMask: number
  nextAction: number
  nextPieceId: number
}

export type PlacementScore = {
  action: number
  mask: number
  surviving: number
  minRemaining: number
  weightSum: number
}

export class Tablebase {
  nTilings = 0
  totalMasks = 0
  lengths = new Uint8Array(0)
  offsets = new Uint32Array(0)
  flatMasks = new Uint32Array(0)
  flatPids = new Uint8Array(0)
  weights = new Float32Array(0)
  maskToTilings = new Map<number, Uint32Array>()

  private activeBoard = -1
  private activeIdx: number[] = []
  loaded = false
  source = ''

  static async fromUrl(url: string): Promise<Tablebase> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Fetch failed: ${url} ${res.status}`)
    const buf = await res.arrayBuffer()
    const tb = new Tablebase()
    tb.loadBuffer(buf)
    tb.source = url
    return tb
  }

  loadBuffer(buf: ArrayBuffer): void {
    const u8 = new Uint8Array(buf)
    const magic = String.fromCharCode(u8[0], u8[1], u8[2], u8[3])
    if (magic !== 'FJTB') throw new Error(`Bad magic: ${magic}`)
    const view = new DataView(buf)
    const version = view.getUint16(4, true)
    if (version !== 1) throw new Error(`Unsupported version ${version}`)
    const n = view.getUint32(8, true)
    const total = view.getUint32(12, true)
    let off = 16

    this.nTilings = n
    this.totalMasks = total
    this.lengths = u8.slice(off, off + n)
    off += n
    this.offsets = new Uint32Array(u8.slice(off, off + n * 4).buffer)
    off += n * 4
    this.flatMasks = new Uint32Array(u8.slice(off, off + total * 4).buffer)
    off += total * 4
    this.flatPids = u8.slice(off, off + total)

    this.weights = new Float32Array(n)
    const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800]
    for (let i = 0; i < n; i++) {
      const ln = this.lengths[i]
      const base = this.offsets[i]
      const counts = [0, 0, 0, 0, 0, 0]
      for (let j = 0; j < ln; j++) {
        const pid = this.flatPids[base + j]
        if (pid < 6) counts[pid]++
      }
      let penalty = 1
      for (let k = 0; k < 6; k++) {
        if (counts[k] > 0 && counts[k] < FACT.length) penalty /= FACT[counts[k]]
      }
      this.weights[i] = (6 / Math.max(1, ln)) ** 12 * penalty
    }

    this.buildInvertedIndex()
    this.activeBoard = -1
    this.activeIdx = []
    this.loaded = true
  }

  private buildInvertedIndex(): void {
    const buckets = new Map<number, number[]>()
    for (let i = 0; i < this.nTilings; i++) {
      const base = this.offsets[i]
      const ln = this.lengths[i]
      for (let j = 0; j < ln; j++) {
        const m = this.flatMasks[base + j]
        let arr = buckets.get(m)
        if (!arr) {
          arr = []
          buckets.set(m, arr)
        }
        arr.push(i)
      }
    }
    this.maskToTilings = new Map()
    for (const [m, arr] of buckets) {
      this.maskToTilings.set(m, Uint32Array.from(arr))
    }
  }

  private compatible(idx: number, board: number): boolean {
    const base = this.offsets[idx]
    const ln = this.lengths[idx]
    for (let j = 0; j < ln; j++) {
      const m = this.flatMasks[base + j]
      const ov = m & board
      if (ov !== 0 && ov !== m) return false
    }
    return true
  }

  private placedCount(idx: number, board: number): number {
    const base = this.offsets[idx]
    const ln = this.lengths[idx]
    let placed = 0
    for (let j = 0; j < ln; j++) {
      if (this.flatMasks[base + j] & board) placed++
    }
    return placed
  }

  /** Tahtada henüz örtülmemiş deluxe (pid=6) adedi. */
  private remainingDeluxe(idx: number, board: number): number {
    const base = this.offsets[idx]
    const ln = this.lengths[idx]
    let n = 0
    for (let j = 0; j < ln; j++) {
      if (this.flatPids[base + j] !== 6) continue
      if (this.flatMasks[base + j] & board) continue
      n++
    }
    return n
  }

  private fitsDeluxeStock(idx: number, board: number, deluxeLeft: number): boolean {
    return this.remainingDeluxe(idx, board) <= deluxeLeft
  }

  updateActive(board: number): number[] {
    if (board === this.activeBoard) return this.activeIdx
    const old = this.activeBoard
    this.activeBoard = board

    if (board === 0) {
      this.activeIdx = []
      return this.activeIdx
    }

    if (old === -1 || old === 0) {
      const ids = this.maskToTilings.get(board)
      if (ids) {
        this.activeIdx = Array.from(ids)
        return this.activeIdx
      }
    }

    const progressive = old !== -1 && old !== 0 && (old & board) === old
    if (progressive) {
      if (this.activeIdx.length === 0) return this.activeIdx
      this.activeIdx = this.activeIdx.filter((i) => this.compatible(i, board))
      return this.activeIdx
    }

    const next: number[] = []
    for (let i = 0; i < this.nTilings; i++) {
      if (this.compatible(i, board)) next.push(i)
    }
    this.activeIdx = next
    return this.activeIdx
  }

  aliveStats(
    board: number,
    deluxeLeft = 99,
  ): { count: number; minRemaining: number } {
    if (board === 0) {
      let min = 99
      let count = 0
      for (let i = 0; i < this.nTilings; i++) {
        if (!this.fitsDeluxeStock(i, 0, deluxeLeft)) continue
        count++
        min = Math.min(min, this.lengths[i])
      }
      return { count, minRemaining: count ? min : -1 }
    }
    const active = this.updateActive(board)
    if (!active.length) return { count: 0, minRemaining: -1 }
    let min = 99
    let count = 0
    for (const i of active) {
      if (!this.fitsDeluxeStock(i, board, deluxeLeft)) continue
      count++
      min = Math.min(min, this.lengths[i] - this.placedCount(i, board))
    }
    return { count, minRemaining: count ? min : -1 }
  }

  evaluatePlacements(
    board: number,
    figure: number,
    deluxeLeft = 99,
  ): PlacementScore[] {
    const masks: number[] = []
    const figMasks = MASKS[figure]
    for (let a = 0; a < ACTIONS; a++) {
      const m = figMasks[a]
      if (m !== -1 && (board & m) === 0) masks.push(m)
    }
    const results: PlacementScore[] = masks.map((mask) => ({
      action: maskToAction(figure, mask),
      mask,
      surviving: 0,
      minRemaining: 999,
      weightSum: 0,
    }))
    if (!masks.length) return results

    if (board === 0) {
      this.activeBoard = 0
      this.activeIdx = []
      for (let k = 0; k < masks.length; k++) {
        const ids = this.maskToTilings.get(masks[k])
        if (!ids || !ids.length) {
          results[k].minRemaining = -1
          continue
        }
        let w = 0
        let min = 99
        let surviving = 0
        for (let t = 0; t < ids.length; t++) {
          const i = ids[t]
          if (!this.fitsDeluxeStock(i, 0, deluxeLeft)) continue
          surviving++
          w += this.weights[i]
          min = Math.min(min, this.lengths[i] - 1)
        }
        results[k].surviving = surviving
        results[k].weightSum = w
        results[k].minRemaining = surviving ? min : -1
      }
      return results
    }

    const active = this.updateActive(board)
    if (!active.length) {
      for (const r of results) r.minRemaining = -1
      return results
    }

    const maskIndex = new Map(masks.map((m, k) => [m, k]))
    for (const idx of active) {
      if (!this.fitsDeluxeStock(idx, board, deluxeLeft)) continue
      const base = this.offsets[idx]
      const ln = this.lengths[idx]
      const placed = this.placedCount(idx, board)
      for (let j = 0; j < ln; j++) {
        const m = this.flatMasks[base + j]
        const pid = this.flatPids[base + j]
        if (m & board) continue
        if (pid !== figure) continue
        const k = maskIndex.get(m)
        if (k === undefined) continue
        const rem = ln - placed - 1
        results[k].surviving++
        results[k].weightSum += this.weights[idx]
        if (rem < results[k].minRemaining) results[k].minRemaining = rem
      }
    }
    for (const r of results) {
      if (!r.surviving) r.minRemaining = -1
    }
    return results
  }

  recommend(
    board: number,
    figure: number,
    opts?: { deluxeLeft?: number },
  ): { action: number; expected: number } {
    const deluxeLeft = opts?.deluxeLeft ?? 99
    if (figure === 6 && deluxeLeft <= 0) {
      const { minRemaining } = this.aliveStats(board, deluxeLeft)
      return { action: SKIP, expected: minRemaining >= 0 ? minRemaining : Infinity }
    }
    const evals = this.evaluatePlacements(board, figure, deluxeLeft)
    let best: PlacementScore | null = null
    for (const ev of evals) {
      if (ev.surviving <= 0 || ev.action === SKIP) continue
      if (
        !best ||
        ev.minRemaining < best.minRemaining ||
        (ev.minRemaining === best.minRemaining && ev.weightSum > best.weightSum)
      ) {
        best = ev
      }
    }
    if (!best) {
      const { minRemaining } = this.aliveStats(board, deluxeLeft)
      return { action: SKIP, expected: minRemaining >= 0 ? minRemaining : Infinity }
    }
    return { action: best.action, expected: best.minRemaining + 1 }
  }

  /** En kısa devam yolları. preferFigure varsa kalan parçalar içinde onu next olarak seç. */
  shortestContinuations(
    board: number,
    topK = 10,
    opts?: { deluxeLeft?: number; preferFigure?: number },
  ): Scenario[] {
    const deluxeLeft = opts?.deluxeLeft ?? 99
    const prefer =
      opts?.preferFigure !== undefined && opts.preferFigure >= 0
        ? opts.preferFigure
        : -1
    const out: Scenario[] = []
    const seenKey = new Set<string>()

    const pushFromIdx = (idx: number): boolean => {
      if (board !== 0 && !this.compatible(idx, board)) return false
      if (!this.fitsDeluxeStock(idx, board, deluxeLeft)) return false
      const ln = this.lengths[idx]
      const base = this.offsets[idx]
      const placed = this.placedCount(idx, board)
      const rem = ln - placed
      if (rem <= 0) return false

      let nextMask = -1
      let nextPieceId = -1
      let preferredMask = -1
      let preferredPid = -1

      for (let j = 0; j < ln; j++) {
        const m = this.flatMasks[base + j]
        const pid = this.flatPids[base + j]
        if (m & board) continue
        // Deluxe stok 0 ise kalan deluxe'ı next olarak önerme
        if (pid === 6 && deluxeLeft <= 0) continue
        if (nextMask < 0) {
          nextMask = m
          nextPieceId = pid
        }
        if (prefer >= 0 && pid === prefer && preferredMask < 0) {
          preferredMask = m
          preferredPid = pid
        }
      }

      if (preferredMask >= 0) {
        nextMask = preferredMask
        nextPieceId = preferredPid
      }
      if (nextMask < 0 || nextPieceId < 0) return false
      const nextAction = maskToAction(nextPieceId, nextMask)
      if (nextAction === SKIP) return false
      const key = `${nextPieceId}:${nextMask}`
      if (seenKey.has(key)) return false
      seenKey.add(key)
      out.push({
        index: idx,
        totalMoves: ln,
        remaining: rem,
        pieceIds: Array.from(this.flatPids.subarray(base, base + ln)),
        masks: Array.from(this.flatMasks.subarray(base, base + ln)),
        nextMask,
        nextAction,
        nextPieceId,
      })
      return out.length >= topK
    }

    if (board === 0) {
      const scored: Array<{ idx: number; rem: number; ln: number; hasPrefer: boolean }> = []
      for (let idx = 0; idx < this.nTilings; idx++) {
        if (!this.fitsDeluxeStock(idx, 0, deluxeLeft)) continue
        const rem = this.lengths[idx]
        let hasPrefer = false
        if (prefer >= 0) {
          const base = this.offsets[idx]
          const ln = this.lengths[idx]
          for (let j = 0; j < ln; j++) {
            if (this.flatPids[base + j] === prefer) {
              hasPrefer = true
              break
            }
          }
        }
        scored.push({ idx, rem, ln: this.lengths[idx], hasPrefer })
      }
      scored.sort(
        (a, b) =>
          a.rem - b.rem ||
          Number(b.hasPrefer) - Number(a.hasPrefer) ||
          a.ln - b.ln ||
          a.idx - b.idx,
      )
      for (const s of scored) {
        if (pushFromIdx(s.idx)) break
      }
      return out
    }

    const active = this.updateActive(board)
    const scored = active
      .filter((idx) => this.fitsDeluxeStock(idx, board, deluxeLeft))
      .map((idx) => {
        const rem = this.lengths[idx] - this.placedCount(idx, board)
        let hasPrefer = false
        if (prefer >= 0 && rem > 0) {
          const base = this.offsets[idx]
          const ln = this.lengths[idx]
          for (let j = 0; j < ln; j++) {
            const m = this.flatMasks[base + j]
            const pid = this.flatPids[base + j]
            if (m & board) continue
            if (pid === prefer) {
              hasPrefer = true
              break
            }
          }
        }
        return { idx, rem, ln: this.lengths[idx], hasPrefer }
      })
      .sort(
        (a, b) =>
          a.rem - b.rem ||
          Number(b.hasPrefer) - Number(a.hasPrefer) ||
          a.ln - b.ln ||
          a.idx - b.idx,
      )

    for (const s of scored) {
      if (pushFromIdx(s.idx)) break
    }
    return out
  }
  scenariosForPiece(board: number, figure: number, topK = 8): Scenario[] {
    const figMasks = MASKS[figure]
    const legalMasks: number[] = []
    for (let a = 0; a < ACTIONS; a++) {
      const m = figMasks[a]
      if (m !== -1 && (board & m) === 0) legalMasks.push(m)
    }
    if (!legalMasks.length) return []

    const activeSet = board === 0 ? null : new Set(this.updateActive(board))
    const scored: Array<{
      ln: number
      rem: number
      nextMask: number
      nextAction: number
      idx: number
    }> = []
    const seen = new Set<number>()

    for (const mask of legalMasks) {
      const ids = this.maskToTilings.get(mask)
      if (!ids) continue
      for (let t = 0; t < ids.length; t++) {
        const idx = ids[t]
        if (seen.has(idx)) continue
        seen.add(idx)
        if (activeSet && !activeSet.has(idx)) continue
        const ln = this.lengths[idx]
        if (board !== 0 && !this.compatible(idx, board)) continue
        const base = this.offsets[idx]
        const placed = this.placedCount(idx, board)
        let nextMask = -1
        for (let j = 0; j < ln; j++) {
          const m = this.flatMasks[base + j]
          const pid = this.flatPids[base + j]
          if (m & board) continue
          if (pid === figure) {
            nextMask = m
            break
          }
        }
        if (nextMask < 0) continue
        const nextAction = maskToAction(figure, nextMask)
        if (nextAction === SKIP) continue
        scored.push({
          ln,
          rem: ln - placed,
          nextMask,
          nextAction,
          idx,
        })
      }
    }

    scored.sort((a, b) => a.ln - b.ln || a.rem - b.rem || a.idx - b.idx)
    const out: Scenario[] = []
    const seenKey = new Set<string>()
    for (const s of scored) {
      const base = this.offsets[s.idx]
      const masks = Array.from(this.flatMasks.subarray(base, base + s.ln))
      const key = `${s.ln}:${s.nextMask}:${masks.join(',')}`
      if (seenKey.has(key)) continue
      seenKey.add(key)
      out.push({
        index: s.idx,
        totalMoves: s.ln,
        remaining: s.rem,
        pieceIds: Array.from(this.flatPids.subarray(base, base + s.ln)),
        masks,
        nextMask: s.nextMask,
        nextAction: s.nextAction,
        nextPieceId: figure,
      })
      if (out.length >= topK) break
    }
    return out
  }
}
