import { Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { useEffect, useState } from 'react'
import type { Boss } from '../../engine/types'
import { px, s } from './scale'

const BOSS_SIZE = px(100)
export const DEFAULT_BOSSES: Boss[] = [{ pos: { x: 0.5, y: 0.5 } }]

export function BossLayer({ bosses }: { bosses: Boss[] }) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    Assets.load('/boss.png').then((t: Texture) => {
      if (!cancelled) setTexture(t)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!texture) return null

  return (
    <>
      {bosses.map((boss, i) => (
        <pixiSprite
          key={i}
          texture={texture}
          width={BOSS_SIZE * (boss.scale ?? 1)}
          height={BOSS_SIZE * (boss.scale ?? 1)}
          anchor={{ x: 0.5, y: 0.5 }}
          x={s(boss.pos.x)}
          y={s(boss.pos.y)}
          rotation={boss.rotation ? (boss.rotation * Math.PI) / 180 : 0}
        />
      ))}
    </>
  )
}
