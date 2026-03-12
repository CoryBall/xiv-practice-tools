# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Type-check (tsc -b) + production build
pnpm preview    # Preview production build
```

No test runner or linter is configured.

> **Note:** `esbuild` must be in `pnpm.onlyBuiltDependencies` in package.json. After dependency changes, run `pnpm install --force`.

## Architecture

The app is an interactive practice simulator for FFXIV raid mechanics. It follows a **state machine**: `idle → awaiting-click → showing-result → complete`.

### Core layers

| Layer | Path | Role |
|---|---|---|
| Types | `src/engine/types.ts` | All shared types (`Role`, `Vec2`, `Hazard`, `Phase`, `Strategy`, `MechanicDef`, `EncounterDef`) |
| Store | `src/store/simulator.ts` | Zustand store; owns selections, game state, and all actions |
| Encounters | `src/encounters/` | Data definitions for encounters, mechanics, strategies |
| Components | `src/components/` | `Selector` (dropdowns + role grid), `Arena` (Pixi canvas), `HUD` (feedback + nav) |
| Geometry | `src/utils/geometry.ts` | `distance()`, `isCorrect()`, `rectHitTest()` |
| URL sync | `src/hooks/useUrlSync.ts` | Syncs `?e=&m=&s=&r=` query params |

### Encounter hierarchy

```
EncounterDef (partySize: 4|8)
  └── MechanicDef[]
        └── Strategy<TState, TVariant>[]
              └── Phase<TState, TVariant>[]
```

- `partySize` belongs to `EncounterDef`, not `MechanicDef`.
- All encounters are registered in `src/encounters/index.ts`.
- To add a new encounter: create a folder under `src/encounters/`, define `EncounterDef`, and register it.

### Coordinates

All positions are normalized to 0–1 range. The canvas is 600×600px (`SCALE = 600`). Convert with `s(v) = v * 600`.

### Phase lifecycle

1. `start()` — rolls `variant`, computes NPC positions, transitions to `awaiting-click`
2. `handleClick(pos)` — validates click against `phase.isCorrect()`, transitions to `showing-result`
3. `nextPhase()` — runs `updateState()`, rolls next variant, transitions to `awaiting-click`

`variantHistory` accumulates rolled variants so later phases can see prior results.

## @pixi/react v8 (NOT v7)

This project uses **@pixi/react v8**, which has a completely different API from v7:

```typescript
// Required at module level — no auto-registration
extend({ Container, Graphics, Sprite, Text })

// JSX intrinsics (lowercase "pixi" prefix)
<pixiContainer>
<pixiGraphics draw={(g: Graphics) => { ... }} />
<pixiSprite texture={t} x={x} y={y} width={w} height={h} />
<pixiText text="..." style={{ fontSize: 16 }} />

// Events are camelCase React style
<pixiGraphics onPointerDown={handler} eventMode="static" />
```

### pixi.js v8 Graphics API

```typescript
g.clear()
g.setFillStyle({ color: 0xff0000, alpha: 0.5 })
g.rect(x, y, w, h); g.fill()
g.setStrokeStyle({ color: 0xffffff, width: 2 })
g.circle(cx, cy, r); g.stroke()
```

## Arena.tsx rendering layers (bottom → top)

1. **FloorLayer** — arena background image or fallback platforms
2. **HazardLayer** — circles, cones, rects, donuts, lines, tethers, image overlays
3. **NpcLayer** — other players' role icons (`/assets/icons/50/*.png`, 50×50px)
4. **BossLayer** — boss sprite (`/assets/boss.png`, 100×100px)
5. **WaymarkLayer** — `/assets/waymarks/{1–4,A–D}.png`
6. **FeedbackLayer** — user click marker (green/red) + solution ring
7. **ClickTarget** — invisible pointer event receiver
