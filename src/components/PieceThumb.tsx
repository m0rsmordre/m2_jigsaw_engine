import { PIECE_NAMES } from '../lib/pieces'
import { pieceImg } from '../lib/pieceAssets'

type Props = {
  pieceId: number
  className?: string
  /** Sabit kutu boyutu (px). Tüm taşlar aynı alanı kaplar. */
  size?: number
}

export function PieceThumb({ pieceId, className = '', size = 48 }: Props) {
  const name = PIECE_NAMES[pieceId] ?? `piece_${pieceId}`
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      title={name}
    >
      <img
        src={pieceImg(pieceId)}
        alt={name}
        className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
        draggable={false}
      />
    </span>
  )
}
