import { Assets } from 'pixi.js'
import type { Graphics as PixiGraphics, Texture } from 'pixi.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Waymark, WaymarkId } from '../../engine/types'
import { px, s } from './scale'

const WAYMARK_ICON_SIZE = px(32)
const WAYMARK_BG_RADIUS = px(21)
const WAYMARK_BG_HALF_SQUARE = px(20)

const WAYMARK_COLORS: Record<WaymarkId, number> = {
  '1': 0xfc4043,
  '2': 0xfeff41,
  '3': 0x47c6ff,
  '4': 0xd760ff,
  A: 0xfc4043,
  B: 0xfeff41,
  C: 0x47c6ff,
  D: 0xd760ff,
}

const WAYMARK_PATHS: Record<WaymarkId, string> = {
  '1': '/assets/waymarks/1.png',
  '2': '/assets/waymarks/2.png',
  '3': '/assets/waymarks/3.png',
  '4': '/assets/waymarks/4.png',
  A: '/assets/waymarks/A.png',
  B: '/assets/waymarks/B.png',
  C: '/assets/waymarks/C.png',
  D: '/assets/waymarks/D.png',
}

const NUMBERED: ReadonlySet<WaymarkId> = new Set(['1', '2', '3', '4'])

function WaymarkMarker({ waymark, texture }: { waymark: Waymark; texture: Texture }) {
  const cx = s(waymark.pos.x)
  const cy = s(waymark.pos.y)
  const color = WAYMARK_COLORS[waymark.id]
  const numbered = NUMBERED.has(waymark.id)
  const half = WAYMARK_ICON_SIZE / 2

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear()
      g.setFillStyle({ color, alpha: 0.55 })
      g.setStrokeStyle({ color: 0x000000, width: px(1.5), alpha: 0.6 })
      if (!numbered) {
        g.circle(cx, cy, WAYMARK_BG_RADIUS)
      } else {
        g.rect(cx - WAYMARK_BG_HALF_SQUARE, cy - WAYMARK_BG_HALF_SQUARE, WAYMARK_BG_HALF_SQUARE * 2, WAYMARK_BG_HALF_SQUARE * 2)
      }
      g.fill()
      g.stroke()
    },
    [cx, cy, color, numbered],
  )

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBg} />
      <pixiSprite
        texture={texture}
        width={WAYMARK_ICON_SIZE}
        height={WAYMARK_ICON_SIZE}
        x={cx - half}
        y={cy - half}
      />
    </pixiContainer>
  )
}

export function WaymarkLayer({ waymarks }: { waymarks: Waymark[] }) {
  const [textures, setTextures] = useState<Partial<Record<WaymarkId, Texture>>>({})

  // Stable key so the effect only re-runs when the actual waymark set changes
  const key = useMemo(
    () => waymarks.map((w) => `${w.id}:${w.pos.x},${w.pos.y}`).join('|'),
    [waymarks],
  )

  useEffect(() => {
    if (waymarks.length === 0) {
      setTextures({})
      return
    }
    let cancelled = false
    const ids = [...new Set(waymarks.map((w) => w.id))]
    Promise.all(ids.map((id) => Assets.load(WAYMARK_PATHS[id]).then((t: Texture) => ({ id, t }))))
      .then((results) => {
        if (cancelled) return
        const map: Partial<Record<WaymarkId, Texture>> = {}
        for (const { id, t } of results) map[id] = t
        setTextures(map)
      })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <>
      {waymarks.map((w) => {
        const tex = textures[w.id]
        if (!tex) return null
        return <WaymarkMarker key={w.id} waymark={w} texture={tex} />
      })}
    </>
  )
}
