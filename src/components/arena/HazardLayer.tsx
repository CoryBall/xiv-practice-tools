import { Assets } from 'pixi.js'
import type { Graphics as PixiGraphics, Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Hazard, HazardShape } from '../../engine/types'
import { px, s } from './scale'

type ImageHazardShape = Extract<HazardShape, { type: 'image' }>
type BossHazardShape = Extract<HazardShape, { type: 'boss' }>

function drawHazardShape(g: PixiGraphics, shape: HazardShape, color: number, alpha: number, outlined = false) {
  const outlineStyle = outlined ? { color: 0x000000, alpha: 0.8, width: px(2) } : null
  switch (shape.type) {
    case 'circle': {
      g.setFillStyle({ color, alpha })
      g.setStrokeStyle(outlineStyle ?? { color, alpha: Math.min(alpha + 0.2, 1), width: px(1) })
      g.circle(s(shape.pos.x), s(shape.pos.y), s(shape.radius))
      g.fill()
      g.stroke()
      break
    }
    case 'line': {
      g.setStrokeStyle({ color, alpha, width: px(3) })
      g.moveTo(s(shape.x), 0)
      g.lineTo(s(shape.x), s(1))
      g.stroke()
      break
    }
    case 'cone': {
      const cx = s(shape.pos.x)
      const cy = s(shape.pos.y)
      const r = s(shape.radius)
      const startAngle = ((shape.angleDeg - shape.spreadDeg / 2) * Math.PI) / 180
      const endAngle = ((shape.angleDeg + shape.spreadDeg / 2) * Math.PI) / 180
      g.setFillStyle({ color, alpha })
      g.moveTo(cx, cy)
      g.arc(cx, cy, r, startAngle, endAngle)
      g.closePath()
      g.fill()
      if (outlineStyle) {
        g.setStrokeStyle(outlineStyle)
        g.moveTo(cx, cy)
        g.arc(cx, cy, r, startAngle, endAngle)
        g.closePath()
        g.stroke()
      }
      break
    }
    case 'rect': {
      const minX = s(Math.min(shape.x1, shape.x2))
      const minY = s(Math.min(shape.y1, shape.y2))
      const maxX = s(Math.max(shape.x1, shape.x2))
      const maxY = s(Math.max(shape.y1, shape.y2))
      g.setFillStyle({ color, alpha })
      if (outlineStyle) g.setStrokeStyle(outlineStyle)
      g.rect(minX, minY, maxX - minX, maxY - minY)
      g.fill()
      if (outlineStyle) g.stroke()
      break
    }
    case 'donut': {
      const cx = s(shape.pos.x)
      const cy = s(shape.pos.y)
      g.setFillStyle({ color, alpha })
      g.circle(cx, cy, s(shape.outerR))
      g.fill()
      g.setFillStyle({ color: 0x000000, alpha: 1 })
      g.circle(cx, cy, s(shape.innerR))
      g.fill()
      if (outlineStyle) {
        g.setStrokeStyle(outlineStyle)
        g.circle(cx, cy, s(shape.outerR))
        g.stroke()
        g.circle(cx, cy, s(shape.innerR))
        g.stroke()
      }
      break
    }
    case 'tether': {
      g.setStrokeStyle({ color, alpha, width: px(3) })
      g.moveTo(s(shape.a.x), s(shape.a.y))
      g.lineTo(s(shape.b.x), s(shape.b.y))
      g.stroke()
      break
    }
  }
}

function HazardSprite({ shape, opacity }: { shape: ImageHazardShape; opacity: number }) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    Assets.load(shape.url).then((t: Texture) => {
      if (!cancelled) setTexture(t)
    }).catch(() => {})
    return () => { cancelled = true; setTexture(null) }
  }, [shape.url])

  if (!texture) return null

  const w = shape.width != null ? s(shape.width) : texture.width
  const h = shape.height != null ? s(shape.height) : texture.height

  return (
    <pixiSprite
      texture={texture}
      width={w}
      height={h}
      anchor={{ x: 0.5, y: 0.5 }}
      x={s(shape.pos.x)}
      y={s(shape.pos.y)}
      rotation={shape.rotation ? (shape.rotation * Math.PI) / 180 : 0}
      alpha={opacity}
    />
  )
}

const BOSS_SIZE = px(100)

function BossHazardSprite({ shape, opacity }: { shape: BossHazardShape; opacity: number }) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    Assets.load('/assets/boss.png').then((t: Texture) => {
      if (!cancelled) setTexture(t)
    }).catch(() => {})
    return () => { cancelled = true; setTexture(null) }
  }, [])

  if (!texture) return null

  const size = BOSS_SIZE * (shape.scale ?? 1)

  return (
    <pixiSprite
      texture={texture}
      width={size}
      height={size}
      anchor={{ x: 0.5, y: 0.5 }}
      x={s(shape.pos.x)}
      y={s(shape.pos.y)}
      rotation={shape.rotation ? (shape.rotation * Math.PI) / 180 : 0}
      alpha={opacity}
    />
  )
}

export function HazardLayer({ hazards }: { hazards: Hazard[] }) {
  const shapeHazards = useMemo(() => hazards.filter((h) => h.shape.type !== 'image' && h.shape.type !== 'boss'), [hazards])
  const imageHazards = useMemo(() => hazards.filter((h) => h.shape.type === 'image'), [hazards])
  const bossHazards = useMemo(() => hazards.filter((h) => h.shape.type === 'boss'), [hazards])

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear()
      for (const h of shapeHazards) {
        try {
          const color = h.color ? parseInt(h.color.replace('#', '').slice(0, 6), 16) : 0xff4444
          const alpha = h.opacity ?? 0.5
          drawHazardShape(g, h.shape, color, alpha, h.outlined)
        } catch (err) {
          console.error('[HazardLayer] Failed to draw hazard:', h.id, h.shape, err)
        }
      }
    },
    [shapeHazards],
  )

  return (
    <>
      <pixiGraphics draw={draw} />
      {imageHazards.map((h) => (
        <HazardSprite
          key={h.id}
          shape={h.shape as ImageHazardShape}
          opacity={h.opacity ?? 1}
        />
      ))}
      {bossHazards.map((h) => (
        <BossHazardSprite
          key={h.id}
          shape={h.shape as BossHazardShape}
          opacity={h.opacity ?? 1}
        />
      ))}
    </>
  )
}
