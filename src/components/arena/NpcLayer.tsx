import { Assets } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { useEffect, useState } from 'react'
import { ROLE_ICONS } from '../../config/roleIcons'
import type { Role, Vec2 } from '../../engine/types'
import { s } from './scale'

const ICON_SIZE = 50 // matches source image size

function NpcDot({ role, pos }: { role: Role; pos: Vec2 }) {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let cancelled = false
    Assets.load(ROLE_ICONS[role])
      .then((t: Texture) => { if (!cancelled) setTexture(t) })
      .catch(() => {})
    return () => { cancelled = true; setTexture(null) }
  }, [role])

  if (!texture) return null

  return (
    <pixiSprite
      texture={texture}
      width={ICON_SIZE}
      height={ICON_SIZE}
      x={s(pos.x) - ICON_SIZE / 2}
      y={s(pos.y) - ICON_SIZE / 2}
    />
  )
}

export function NpcLayer({ npcPositions }: { npcPositions: Partial<Record<Role, Vec2>> }) {
  return (
    <>
      {(Object.entries(npcPositions) as [Role, Vec2][]).map(([role, pos]) => (
        <NpcDot key={role} role={role} pos={pos} />
      ))}
    </>
  )
}
