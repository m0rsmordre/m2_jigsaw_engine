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
  /** En iyi (minRemaining) tiling'lerde kalan Tekli adedi — düşük daha iyi */
  minTekliLeft: number
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

  private remainingPidCount(
    idx: number,
    board: number,
    pid: number,
    excludeMask = 0,
  ): number {
    const base = this.offsets[idx]
    const ln = this.lengths[idx]
    let n = 0
    for (let j = 0; j < ln; j++) {
      const m = this.flatMasks[base + j]
      if (m & board) continue
      if (excludeMask && m === excludeMask) continue
      if (this.flatPids[base + j] === pid) n++
    }
    return n
  }

  /** En kısa tiling'lerdeki olası sonraki taş maskelerinin birleşimi (kritik hücreler). */
  shortestNextMaskUnion(board: number, deluxeLeft = 99): number {
    const { minRemaining: globalMin } = this.aliveStats(board, deluxeLeft)
    if (globalMin < 0) return 0
    let union = 0

    const addNextOnly = (idx: number, b: number) => {
      const base = this.offsets[idx]
      const ln = this.lengths[idx]
      for (let j = 0; j < ln; j++) {
        const m = this.flatMasks[base + j]
        if (m & b) continue
        union |= m
        return
      }
    }

    if (board === 0) {
      for (let idx = 0; idx < this.nTilings; idx++) {
        if (!this.fitsDeluxeStock(idx, 0, deluxeLeft)) continue
        if (this.lengths[idx] !== globalMin) continue
        addNextOnly(idx, 0)
      }
      return union
    }

    const active = this.updateActive(board)
    for (const idx of active) {
      if (!this.fitsDeluxeStock(idx, board, deluxeLeft)) continue
      const rem = this.lengths[idx] - this.placedCount(idx, board)
      if (rem !== globalMin) continue
      addNextOnly(idx, board)
    }
    return union
  }

  private pickBestPlacement(
    evals: PlacementScore[],
    criticalUnion = 0,
  ): PlacementScore | null {
    let best: PlacementScore | null = null
    let bestBlocks = false
    for (const ev of evals) {
      if (ev.surviving <= 0 || ev.action === SKIP || ev.minRemaining < 0) continue
      const blocks =
        criticalUnion !== 0 && (ev.mask & criticalUnion) !== 0
      if (!best) {
        best = ev
        bestBlocks = blocks
        continue
      }
      // Kritik hücreleri bozmayan yerleşim öncelikli (Ters L / Cubuk slotunu koru)
      if (blocks !== bestBlocks) {
        if (!blocks) {
          best = ev
          bestBlocks = false
        }
        continue
      }
      if (ev.minRemaining !== best.minRemaining) {
        if (ev.minRemaining < best.minRemaining) {
          best = ev
          bestBlocks = blocks
        }
        continue
      }
      // Aynı uzunlukta Tekli az olanı tercih et (nokta beklemek dezavantaj)
      if (ev.minTekliLeft !== best.minTekliLeft) {
        if (ev.minTekliLeft < best.minTekliLeft) {
          best = ev
          bestBlocks = blocks
        }
        continue
      }
      if (ev.weightSum !== best.weightSum) {
        if (ev.weightSum > best.weightSum) {
          best = ev
          bestBlocks = blocks
        }
        continue
      }
      if (ev.action < best.action) {
        best = ev
        bestBlocks = blocks
      }
    }
    return best
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
      minTekliLeft: 99,
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
          results[k].minTekliLeft = -1
          continue
        }
        let w = 0
        let min = 99
        let minTekli = 99
        let surviving = 0
        for (let t = 0; t < ids.length; t++) {
          const i = ids[t]
          if (!this.fitsDeluxeStock(i, 0, deluxeLeft)) continue
          surviving++
          w += this.weights[i]
          const rem = this.lengths[i] - 1
          const tekli = this.remainingPidCount(i, 0, 0, masks[k])
          if (rem < min) {
            min = rem
            minTekli = tekli
          } else if (rem === min && tekli < minTekli) {
            minTekli = tekli
          }
        }
        results[k].surviving = surviving
        results[k].weightSum = w
        results[k].minRemaining = surviving ? min : -1
        results[k].minTekliLeft = surviving ? minTekli : -1
      }
      return results
    }

    const active = this.updateActive(board)
    if (!active.length) {
      for (const r of results) {
        r.minRemaining = -1
        r.minTekliLeft = -1
      }
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
        const tekli = this.remainingPidCount(idx, board, 0, m)
        results[k].surviving++
        results[k].weightSum += this.weights[idx]
        if (rem < results[k].minRemaining) {
          results[k].minRemaining = rem
          results[k].minTekliLeft = tekli
        } else if (rem === results[k].minRemaining && tekli < results[k].minTekliLeft) {
          results[k].minTekliLeft = tekli
        }
      }
    }
    for (const r of results) {
      if (!r.surviving) {
        r.minRemaining = -1
        r.minTekliLeft = -1
      }
    }
    return results
  }

  /** Elindeki taş, en kısa (minRemaining) tiling'lerin kalan parçalarından biri mi? */
  figureOnShortestPaths(
    board: number,
    figure: number,
    deluxeLeft = 99,
  ): boolean {
    const { minRemaining: globalMin } = this.aliveStats(board, deluxeLeft)
    if (globalMin < 0) return false

    if (board === 0) {
      for (let idx = 0; idx < this.nTilings; idx++) {
        if (!this.fitsDeluxeStock(idx, 0, deluxeLeft)) continue
        if (this.lengths[idx] !== globalMin) continue
        const base = this.offsets[idx]
        const ln = this.lengths[idx]
        for (let j = 0; j < ln; j++) {
          if (this.flatPids[base + j] === figure) return true
        }
      }
      return false
    }

    const active = this.updateActive(board)
    for (const idx of active) {
      if (!this.fitsDeluxeStock(idx, board, deluxeLeft)) continue
      const ln = this.lengths[idx]
      const placed = this.placedCount(idx, board)
      if (ln - placed !== globalMin) continue
      const base = this.offsets[idx]
      for (let j = 0; j < ln; j++) {
        const m = this.flatMasks[base + j]
        if (m & board) continue
        if (this.flatPids[base + j] === figure) return true
      }
    }
    return false
  }

  /**
   * Hamle önerisi:
   * - Varsayılan: elindeki taş için en iyi yerleşim (kalan, Tekli azlığı, ağırlık).
   * - Son aşama (globalMin <= 3): taş en kısa gidişatı koruyamıyorsa PASS.
   * - placeAction: mümkünse en kısa yolun kritik hücrelerini bozmayan yerleşim.
   */
  recommend(
    board: number,
    figure: number,
    opts?: { deluxeLeft?: number },
  ): {
    action: number
    expected: number
    placeAction?: number
    placeExpected?: number
    placeTekliLeft?: number
    blocksCritical?: boolean
    passReason?: 'no_fit' | 'regret'
    offShortest?: boolean
  } {
    const deluxeLeft = opts?.deluxeLeft ?? 99
    const ENDGAME_PASS_AT = 3
    const { minRemaining: globalMin } = this.aliveStats(board, deluxeLeft)
    const passExpected =
      globalMin >= 0 ? globalMin + 1 : Infinity

    if (figure === 6 && deluxeLeft <= 0) {
      return { action: SKIP, expected: passExpected, passReason: 'no_fit' }
    }

    const evals = this.evaluatePlacements(board, figure, deluxeLeft)
    const criticalUnion =
      globalMin >= 0 ? this.shortestNextMaskUnion(board, deluxeLeft) : 0
    const bestAny = this.pickBestPlacement(evals, criticalUnion)

    if (!bestAny) {
      return { action: SKIP, expected: passExpected, passReason: 'no_fit' }
    }

    const blocksCritical =
      criticalUnion !== 0 && (bestAny.mask & criticalUnion) !== 0
    const placeAction = bestAny.action
    const placeExpected = bestAny.minRemaining + 1
    const placeTekliLeft = bestAny.minTekliLeft
    const onShortest =
      globalMin >= 0 && this.figureOnShortestPaths(board, figure, deluxeLeft)
    const preserves =
      globalMin >= 0 && bestAny.minRemaining === globalMin - 1
    const endgame =
      globalMin >= 0 && globalMin <= ENDGAME_PASS_AT

    // Son aşama + en kısa yolu koruyamıyor → PASS.
    // placeAction yine seçili taşın (mümkünse kritik-bozmayan) en iyi yeri.
    if (endgame && !preserves) {
      return {
        action: SKIP,
        expected: passExpected,
        placeAction,
        placeExpected,
        placeTekliLeft,
        blocksCritical,
        passReason: 'regret',
        offShortest: true,
      }
    }

    return {
      action: placeAction,
      expected: placeExpected,
      placeAction,
      placeExpected,
      placeTekliLeft,
      blocksCritical,
      offShortest: !onShortest && !preserves,
    }
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
