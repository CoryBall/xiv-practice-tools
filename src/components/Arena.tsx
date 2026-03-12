import { Application, extend } from '@pixi/react'
import { Container, Graphics, Sprite, Text } from 'pixi.js'
import type { FederatedPointerEvent } from 'pixi.js'
import { useCallback, useMemo, useState } from 'react'
import { useSimulator } from '../store/simulator'
import { encounters } from '../encounters'
import type { Hazard, TetherEndpoint, Vec2, Role } from '../engine/types'
import { BossLayer, DEFAULT_BOSSES } from './arena/BossLayer'
import { ClickTarget, FeedbackLayer } from './arena/FeedbackLayer'
import { FloorLayer } from './arena/FloorLayer'
import { HazardLayer } from './arena/HazardLayer'
import { NpcLayer } from './arena/NpcLayer'
import { SCALE } from './arena/scale'
import { WaymarkLayer } from './arena/WaymarkLayer'

// Register Pixi classes for JSX intrinsic elements
extend({ Container, Graphics, Sprite, Text })

export function Arena() {
  const {
    status,
    npcPositions,
    variant,
    state,
    userClick,
    solution,
    wasCorrect,
    handleClick,
    selectedEncounterId,
    selectedMechanicId,
    selectedStrategyId,
    selectedRole,
    phaseIndex,
    showHints,
  } = useSimulator()

  const encounter = encounters.find((e) => e.id === selectedEncounterId)
  const currentMechanic = encounter?.mechanics.find((m) => m.id === selectedMechanicId)
  const currentStrategy = currentMechanic?.strategies.find((s) => s.id === selectedStrategyId)
  const currentPhase = currentStrategy?.phases[phaseIndex] ?? null

  // Phase-level overrides mechanic-level overrides encounter-level.
  // In idle mode (no strategy selected) fall back to the first phase's image as a preview.
  const previewPhase = currentPhase ?? currentStrategy?.phases[0]
  const arenaImage =
    previewPhase?.arenaImage ?? currentMechanic?.arenaImage ?? encounter?.arenaImage

  const waymarks = useMemo(
    () => currentStrategy?.waymarks ?? [],
    [currentStrategy],
  )

  // Phase → strategy → mechanic → encounter → default single centered boss
  const bosses =
    currentPhase?.bosses ??
    currentStrategy?.bosses ??
    currentMechanic?.bosses ??
    encounter?.bosses ??
    DEFAULT_BOSSES

  const allHazards = useMemo(() => {
    const phaseHazards = currentPhase ? currentPhase.hazards(variant, state) : []
    const hintHazards =
      showHints && variant && selectedRole && currentPhase?.getHints
        ? currentPhase.getHints(variant, selectedRole, state).map((h) => ({
            color: '#aaaaaa',
            opacity: 0.35,
            outlined: true,
            ...h,
          }))
        : []

    const tetherHazards: Hazard[] = []
    if (currentPhase?.getTethers && selectedRole) {
      const allPositions: Partial<Record<Role, Vec2>> = { ...npcPositions }
      allPositions[selectedRole] = userClick ?? npcPositions[selectedRole] ?? currentPhase.getSolution(variant, selectedRole, state)

      const resolve = (ep: TetherEndpoint): Vec2 | null =>
        typeof ep === 'string' ? (allPositions[ep] ?? null) : ep

      for (const tether of currentPhase.getTethers(variant, state)) {
        const a = resolve(tether.from)
        const b = resolve(tether.to)
        console.log(`[tether] ${JSON.stringify(tether.from)} → ${JSON.stringify(tether.to)}`, '|', a, b)
        if (a && b) {
          tetherHazards.push({
            id: `tether-${JSON.stringify(tether.from)}-${JSON.stringify(tether.to)}`,
            shape: { type: 'tether', a, b },
            color: tether.color,
            opacity: tether.opacity,
          })
        }
      }
    }

    return [...phaseHazards, ...tetherHazards, ...hintHazards]
  }, [currentPhase, variant, state, showHints, selectedRole, npcPositions, userClick])

  const onPointerDown = useCallback(
    (e: FederatedPointerEvent) => {
      if (status !== 'awaiting-click') return
      handleClick({ x: e.global.x / SCALE, y: e.global.y / SCALE })
    },
    [status, handleClick],
  )

  // Coordinate inspector (dev only)
  const [cursor, setCursor] = useState<Vec2 | null>(null)
  const [copied, setCopied] = useState(false)

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!import.meta.env.DEV) return
    const rect = e.currentTarget.getBoundingClientRect()
    setCursor({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / SCALE)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / SCALE)),
    })
  }, [])

  const onMouseLeave = useCallback(() => setCursor(null), [])

  const onWrapperClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!import.meta.env.DEV) return
      if (status !== 'idle') return  // game clicks handled by Pixi
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = {
        x: +((e.clientX - rect.left) / SCALE).toFixed(3),
        y: +((e.clientY - rect.top) / SCALE).toFixed(3),
      }
      void navigator.clipboard.writeText(`{ x: ${pos.x}, y: ${pos.y} }`).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      })
    },
    [status],
  )

  return (
    <div
      className="arena-wrapper"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onWrapperClick}
    >
      <Application
        width={SCALE}
        height={SCALE}
        background={0x0d0d1a}
        antialias
      >
        <FloorLayer arenaImage={arenaImage} />
        <WaymarkLayer waymarks={waymarks} />
        <BossLayer bosses={bosses} />
        {status !== 'idle' && (
          <>
            <HazardLayer hazards={allHazards} />
            <NpcLayer npcPositions={npcPositions} />
            <FeedbackLayer userClick={userClick} solution={solution} wasCorrect={wasCorrect} />
          </>
        )}
        <ClickTarget onPointerDown={onPointerDown} />
      </Application>

      {cursor && (
        <div className="arena-coords">
          {copied
            ? <span className="arena-coords-copied">copied!</span>
            : <span>x: {cursor.x.toFixed(3)}  y: {cursor.y.toFixed(3)}</span>
          }
        </div>
      )}
    </div>
  )
}
