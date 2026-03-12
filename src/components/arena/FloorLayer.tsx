import { Assets } from 'pixi.js'
import type { Graphics as PixiGraphics, Texture } from 'pixi.js'
import { useCallback, useEffect, useState } from 'react'
import { SCALE, s } from './scale'

const LEFT_PLATFORM = { x1: 0.04, x2: 0.46, y1: 0.04, y2: 0.96 }
const RIGHT_PLATFORM = { x1: 0.54, x2: 0.96, y1: 0.04, y2: 0.96 }

export function FloorLayer({ arenaImage }: { arenaImage?: string }) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    if (!arenaImage) return
    let cancelled = false
    Assets.load(arenaImage).then((t: Texture) => {
      if (!cancelled) setTexture(t)
    })
    return () => {
      cancelled = true
      setTexture(null)
    }
  }, [arenaImage])

  const drawFallback = useCallback((g: PixiGraphics) => {
    g.clear()
    g.setFillStyle({ color: 0x1a1a2e })
    g.rect(0, 0, SCALE, SCALE)
    g.fill()
    g.setFillStyle({ color: 0x2a2a4e })
    g.setStrokeStyle({ color: 0x4444aa, width: 2, alpha: 0.8 })
    g.rect(
      s(LEFT_PLATFORM.x1),
      s(LEFT_PLATFORM.y1),
      s(LEFT_PLATFORM.x2 - LEFT_PLATFORM.x1),
      s(LEFT_PLATFORM.y2 - LEFT_PLATFORM.y1),
    )
    g.fill()
    g.stroke()
    g.rect(
      s(RIGHT_PLATFORM.x1),
      s(RIGHT_PLATFORM.y1),
      s(RIGHT_PLATFORM.x2 - RIGHT_PLATFORM.x1),
      s(RIGHT_PLATFORM.y2 - RIGHT_PLATFORM.y1),
    )
    g.fill()
    g.stroke()
  }, [])

  if (arenaImage && texture) {
    return <pixiSprite texture={texture} width={SCALE} height={SCALE} />
  }
  return <pixiGraphics draw={drawFallback} />
}
