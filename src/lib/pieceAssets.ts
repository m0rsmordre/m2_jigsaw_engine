/** Logic figure index → hd_assets fish_*.png (autoplay_batch LOGIC_TO_VISUAL) */
export const PIECE_IMG = [
  '/pieces/fish_2.png', // 0 Tekli
  '/pieces/fish_1.png', // 1 Cubuk
  '/pieces/fish_3.png', // 2 L
  '/pieces/fish_4.png', // 3 Ters L
  '/pieces/fish_5.png', // 4 Kare
  '/pieces/fish_6.png', // 5 S
  '/pieces/fish_7.png', // 6 Deluxe
] as const

export function pieceImg(pieceId: number): string {
  return PIECE_IMG[pieceId] ?? PIECE_IMG[0]
}
