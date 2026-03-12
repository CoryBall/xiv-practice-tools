import type { FederatedPointerEvent, Graphics as PixiGraphics } from 'pixi.js'
import { useCallback } from 'react'
import type { Vec2 } from '../../engine/types'
import { SCALE, s } from './scale'

export function FeedbackLayer({
  userClick,
  solution,
  wasCorrect,
}: {
  userClick: Vec2 | null
  solution: Vec2 | null
  wasCorrect: boolean | null
}) {
  const drawClick = useCallback(
    (g: PixiGraphics) => {
      g.clear()
      if (!userClick) return
      const color = wasCorrect ? 0x44ff44 : 0xff4444
      g.setFillStyle({ color, alpha: 0.9 })
      g.setStrokeStyle({ color: 0xffffff, width: 2 })
      g.circle(s(userClick.x), s(userClick.y), 10)
      g.fill()
      g.stroke()
    },
    [userClick, wasCorrect],
  )

  const drawSolution = useCallback(
    (g: PixiGraphics) => {
      g.clear()
      if (!solution || wasCorrect !== false) return
      g.setStrokeStyle({ color: 0x44ff44, width: 3, alpha: 0.9 })
      g.circle(s(solution.x), s(solution.y), 14)
      g.stroke()
    },
    [solution, wasCorrect],
  )

  return (
    <>
      <pixiGraphics draw={drawClick} />
      <pixiGraphics draw={drawSolution} />
    </>
  )
}

export function ClickTarget({ onPointerDown }: { onPointerDown: (e: FederatedPointerEvent) => void }) {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    g.setFillStyle({ color: 0x000000, alpha: 0.001 })
    g.rect(0, 0, SCALE, SCALE)
    g.fill()
  }, [])

  return (
    <pixiGraphics
      draw={draw}
      eventMode="static"
      onPointerDown={onPointerDown}
    />
  )
}
