import type { Rect, Vec2 } from '../engine/types'

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function isCorrect(click: Vec2, solution: Vec2, tolerance = 0.1): boolean {
  return distance(click, solution) <= tolerance
}

/**
 * Returns an isCorrect function that passes when the click lands inside the
 * described rectangle. Coordinates are normalized 0–1. Corner order doesn't matter.
 *
 * Usage:
 *   const LEFT: Rect = { x1: 0.04, y1: 0.04, x2: 0.46, y2: 0.96 }
 *   isCorrect: rectHitTest(LEFT)
 *   getHints:  () => [{ id: 'hint', shape: { type: 'rect', ...LEFT } }]
 */
export function rectHitTest(rect: Rect): (click: Vec2) => boolean {
  const minX = Math.min(rect.x1, rect.x2)
  const maxX = Math.max(rect.x1, rect.x2)
  const minY = Math.min(rect.y1, rect.y2)
  const maxY = Math.max(rect.y1, rect.y2)
  return (click) =>
    click.x >= minX && click.x <= maxX && click.y >= minY && click.y <= maxY
}
