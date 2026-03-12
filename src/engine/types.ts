export type Role = 'MT' | 'OT' | 'H1' | 'H2' | 'M1' | 'M2' | 'R1' | 'R2'

export type Vec2 = { x: number; y: number } // normalized 0–1

export type Rect = { x1: number; y1: number; x2: number; y2: number } // normalized 0–1, corner order doesn't matter

export type HazardShape =
  | { type: 'circle'; pos: Vec2; radius: number }
  | { type: 'cone'; pos: Vec2; angleDeg: number; spreadDeg: number; radius: number }
  | ({ type: 'rect' } & Rect)
  | { type: 'donut'; pos: Vec2; innerR: number; outerR: number }
  | { type: 'line'; x: number } // vertical divider (arena split)
  | { type: 'tether'; a: Vec2; b: Vec2 }
  | { type: 'image'; url: string; pos: Vec2; width?: number; height?: number; rotation?: number }
  | { type: 'boss'; pos: Vec2; rotation?: number; scale?: number }

/** A tether endpoint — either a role (resolved to that role's position) or a fixed arena point. */
export type TetherEndpoint = Role | Vec2

export interface TetherDef {
  from: TetherEndpoint
  to: TetherEndpoint
  color?: string
  opacity?: number
}

export interface Hazard {
  id: string
  shape: HazardShape
  color?: string
  opacity?: number
  /** Draw a black outline around the shape */
  outlined?: boolean
}

export interface Variant {
  id: string
  label: string
  [key: string]: unknown
}

export type WaymarkId = '1' | '2' | '3' | '4' | 'A' | 'B' | 'C' | 'D'

export interface Waymark {
  id: WaymarkId
  pos: Vec2
}

export interface Boss {
  pos: Vec2
  /** Rotation in degrees (0 = facing right, clockwise). Default 0. */
  rotation?: number
  /** Scale multiplier for the boss sprite. 1.0 = default (100px). Default 1.0. */
  scale?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Phase<TState = unknown, TVariant extends Variant | null | unknown = Variant> {
  id: string
  prompt: string
  /** Overrides mechanic/encounter arenaImage for this phase only */
  arenaImage?: string
  /** Omit for phases that require no random variant. */
  rollVariant?: (prev: TVariant[]) => TVariant
  hazards: (variant: TVariant | null, state: TState) => Hazard[]
  /** Optional hint shapes shown when the player enables the hint overlay. */
  getHints?: (variant: TVariant, role: Role, state: TState) => Hazard[]
  /**
   * Static per-role positions shown as NPC markers on the arena.
   * When provided, replaces the per-role getSolution NPC rendering.
   * getSolution is still required for the user's own click validation.
   */
  setPlayerPositions?: (variant: TVariant | null, state: TState) => { role: Role; pos: Vec2 }[]
  /**
   * Tethers between roles or fixed arena points. Role endpoints are automatically
   * resolved to that role's current position (from setPlayerPositions or getSolution).
   * The user's own role is resolved to their solution position.
   */
  getTethers?: (variant: TVariant | null, state: TState) => TetherDef[]
  getSolution: (variant: TVariant | null, role: Role, state: TState) => Vec2
  /**
   * Custom correctness check. When present, replaces the default distance+tolerance test.
   * getSolution is still used to show the solution indicator if the click is wrong.
   */
  isCorrect?: (click: Vec2, variant: TVariant | null, role: Role, state: TState) => boolean
  tolerance?: number // default 0.1 — ignored when isCorrect is provided
  /** When true, automatically advances to the next phase after a correct click (with a brief delay). */
  autoAdvance?: boolean
  /**
   * Called at the end of this phase (before the next one loads) to produce the
   * state object that feeds into all subsequent phases. Return a new object —
   * do not mutate the input.
   */
  updateState?: (state: TState, variant: TVariant | null, role: Role, click: Vec2 | null, wasCorrect: boolean) => TState
  /** Overrides boss positions for this phase only. */
  bosses?: Boss[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Strategy<TState = any, TVariant extends Variant = any> {
  id: string
  name: string
  description?: string
  /** Link to an external guide or explanation for this strategy. */
  url?: string
  /** Waymarks placed on the arena for this strategy. Rendered below hazards. */
  waymarks?: Waymark[]
  /** Overrides boss positions for all phases of this strategy. */
  bosses?: Boss[]
  /**
   * Initial state passed to all phase callbacks. Use `rollState` instead when
   * the starting state needs to be randomized. If both are provided, `rollState` wins.
   * If neither is provided, state is null.
   */
  initialState?: TState
  /**
   * Called once when the mechanic starts. The returned value is the initial
   * state object passed to all phase callbacks. If omitted, state is null.
   */
  rollState?: () => TState
  phases: Phase<TState, TVariant>[]
}

export interface MechanicDef {
  id: string
  name: string
  description?: string
  /** Overrides encounter arenaImage for all phases of this mechanic */
  arenaImage?: string
  /** Overrides boss positions for all phases of this mechanic. */
  bosses?: Boss[]
  strategies: Strategy[]
}

export interface EncounterDef {
  id: string
  name: string
  partySize: 4 | 8
  /** Path to a background image, relative to /public. E.g. '/assets/arenas/m11s.png' */
  arenaImage?: string
  /** Default boss positions. If omitted, a single boss is shown centered at (0.5, 0.5). */
  bosses?: Boss[]
  mechanics: MechanicDef[]
}
