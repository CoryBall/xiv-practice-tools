import type { Role, Strategy, Vec2 } from "../../../../engine/types";
import { distance } from "../../../../utils/geometry";
import {
  ALL_ROLES,
  BOSS_CENTER,
  BOSS_CLONE_HAZARDS,
  BOSS_CLONE_MECHANICS,
  BOSS_CLONE_POSITIONS,
  CLONE_HAZARDS,
  CLONE_POSITIONS,
  CLONE_RADIUS,
  PHASE3_POSITIONS,
  PHASE3_RADIUS,
  PHASE4_CONE_RADIUS,
  PHASE4_POSITIONS,
  PHASE4_RADIUS,
  PHASE5_POSITIONS,
  PHASE5_RADIUS,
} from "./constants";
import { buildInitialPlayerPositions, computeGroups, computePhase2, computePhase3, getPhase4Target, getPhase5Target, shuffle } from "./logic";
import type { Replication2State } from "./types";

const BananaCodex: Strategy<Replication2State> = {
  id: 'bc-rep-2',
  name: 'Banana Codex',
  url: 'https://raidplan.io/plan/zLbFvB6R3muGFSK1',
  description: 'Marked players stand on outside corner of waymarks',
  hintsDefault: true,
  rollState: () => {
    const shuffledPositions = shuffle(CLONE_POSITIONS)
    const cloneAssignments = Object.fromEntries(
      ALL_ROLES.map((role, i) => [role, shuffledPositions[i]])
    ) as Record<Role, typeof shuffledPositions[number]>
    const bossCloneMechanics = shuffle(BOSS_CLONE_MECHANICS)
    const { assignments: phase2Assignments, hintPositions: phase2HintPositions } =
      computePhase2(cloneAssignments, bossCloneMechanics)
    return {
      group1Players: [],
      group2Players: [],
      bossCloneMechanics,
      cloneAssignments,
      phase2Assignments,
      phase2HintPositions,
      phase3Assignments: {} as Record<Role, Vec2>,
      playerPositions: buildInitialPlayerPositions(),
    }
  },
  waymarks: [
    { id: '4', pos: { x: 0.5,   y: 0.325 } },
    { id: 'D', pos: { x: 0.5,   y: 0.215 } },
    { id: '1', pos: { x: 0.675, y: 0.5   } },
    { id: 'A', pos: { x: 0.8,   y: 0.5   } },
    { id: '2', pos: { x: 0.5,   y: 0.675 } },
    { id: 'B', pos: { x: 0.5,   y: 0.775 } },
    { id: '3', pos: { x: 0.325, y: 0.5   } },
    { id: 'C', pos: { x: 0.215, y: 0.5   } },
  ],
  phases: [
    {
      id: 'player-clones',
      prompt: 'Move to your tethered clone',
      setPlayerPositions: (_, state) => state!.playerPositions,
      hazards: () => CLONE_HAZARDS,
      getTethers: (_, state) => state ? ALL_ROLES.map((role) => ({
        from: role,
        to: state.cloneAssignments[role],
      })) : [],
      getSolution: (_, role, state) => state?.cloneAssignments[role] ?? { x: 0, y: 0 },
      getHints: (_, _role, state) => state ? CLONE_POSITIONS.map((pos, i) => ({
        id: `hint-clone-${i + 1}`,
        shape: { type: 'circle' as const, pos, radius: CLONE_RADIUS },
      })) : [],
      isCorrect: (click, _, role, state) =>
        !!state && distance(click, state.cloneAssignments[role]) <= CLONE_RADIUS,
      updateState: (state, _variant, role, click, wasCorrect) => ({
        ...state!,
        playerPositions: ALL_ROLES.map((r) => ({
          role: r,
          pos: r === role
            ? (wasCorrect ? state!.cloneAssignments[r] : (click ?? state!.cloneAssignments[r]))
            : state!.cloneAssignments[r],
        })),
      }),
      tolerance: 0,
      autoAdvance: true,
    },
    {
      id: 'get-mech-tether',
      prompt: "Go to the boss clone with the correct mechanic for your position",
      setPlayerPositions: (_, state) => state!.playerPositions,
      hazards: (_, state) => [
        ...BOSS_CLONE_HAZARDS,
        ...(state?.bossCloneMechanics ?? []).map((mech, i) => {
          const pos = BOSS_CLONE_POSITIONS[i]
          const indicatorPos = { x: pos.x, y: pos.y - 0.1 }
          if (mech.url) {
            return {
              id: `boss-clone-mech-${i}`,
              shape: { type: 'image' as const, url: mech.url, pos: indicatorPos, width: 0.05, height: 0.05 },
            }
          }
          return {
            id: `boss-clone-mech-${i}`,
            shape: {
              type: 'cone' as const,
              pos: { x: indicatorPos.x - 0.05, y: indicatorPos.y },
              angleDeg: 0,
              spreadDeg: 45,
              radius: 0.1,
            },
          }
        }),
      ],
      getSolution: (_, role, state) => state?.phase2Assignments[role] ?? BOSS_CENTER,
      getHints: () => [
        ...BOSS_CLONE_POSITIONS.map((pos, i) => ({
          id: `hint-p2-boss-clone-${i}`,
          shape: { type: 'circle' as const, pos, radius: CLONE_RADIUS },
        })),
        {
          id: 'hint-p2-south',
          shape: { type: 'circle' as const, pos: { x: 0.5, y: 0.8 }, radius: CLONE_RADIUS },
        },
        {
          id: 'hint-p2-center',
          shape: { type: 'circle' as const, pos: BOSS_CENTER, radius: CLONE_RADIUS },
        },
      ],
      isCorrect: (click, _, role, state) =>
        !!state && distance(click, state.phase2Assignments[role]) <= CLONE_RADIUS,
      updateState: (state, _variant, role, click, wasCorrect) => {
        const playerPositions = ALL_ROLES.map((r) => ({
          role: r,
          pos: r === role
            ? (wasCorrect ? state!.phase2Assignments[r] : (click ?? state!.phase2Assignments[r]))
            : state!.phase2Assignments[r],
        }))
        const { group1Players, group2Players } = computeGroups(state!.playerPositions)
        const phase3Assignments = computePhase3(state!.cloneAssignments, group1Players)
        return { ...state!, group1Players, group2Players, playerPositions, phase3Assignments }
      },
      autoAdvance: true,
    },
    {
      id: 'tethered-player-mechs',
      prompt: 'Move to your assigned position',
      setPlayerPositions: (_, state) => state!.playerPositions,
      hazards: () => [],
      getSolution: (_, role, state) => state?.phase3Assignments[role] ?? BOSS_CENTER,
      getHints: () => Object.values(PHASE3_POSITIONS).map((pos, i) => ({
        id: `hint-p3-${i}`,
        shape: { type: 'circle' as const, pos, radius: PHASE3_RADIUS },
      })),
      isCorrect: (click, _, role, state) =>
        !!state && distance(click, state.phase3Assignments[role]) <= PHASE3_RADIUS,
      updateState: (state, _variant, role, click, wasCorrect) => ({
        ...state!,
        playerPositions: ALL_ROLES.map((r) => ({
          role: r,
          pos: r === role
            ? (wasCorrect ? state!.phase3Assignments[r] : (click ?? state!.phase3Assignments[r]))
            : state!.phase3Assignments[r],
        })),
      }),
      tolerance: 0,
      autoAdvance: true,
    },
    {
      id: 'player-tether-stacks',
      prompt: "Move to your group's safe spot",
      bosses: [{ pos: { x: 0.5, y: 0.265 }, scale: 1.5 }],
      setPlayerPositions: (_, state) => state!.playerPositions,
      hazards: () => [],
      getSolution: (_, role, state) =>
        state ? getPhase4Target(role, state.cloneAssignments, state.group1Players) : BOSS_CENTER,
      getHints: () => [
        { id: 'hint-p4-g1',      shape: { type: 'circle' as const, pos: PHASE4_POSITIONS.group1,      radius: PHASE4_RADIUS } },
        { id: 'hint-p4-g2',      shape: { type: 'circle' as const, pos: PHASE4_POSITIONS.group2,      radius: PHASE4_RADIUS } },
        { id: 'hint-p4-cone-g1', shape: { type: 'circle' as const, pos: PHASE4_POSITIONS.cone_group1, radius: PHASE4_CONE_RADIUS } },
        { id: 'hint-p4-cone-g2', shape: { type: 'circle' as const, pos: PHASE4_POSITIONS.cone_group2, radius: PHASE4_CONE_RADIUS } },
      ],
      isCorrect: (click, _, role, state) => {
        if (!state) return false
        const target = getPhase4Target(role, state.cloneAssignments, state.group1Players)
        const isCone = target === PHASE4_POSITIONS.cone_group1 || target === PHASE4_POSITIONS.cone_group2
        return distance(click, target) <= (isCone ? PHASE4_CONE_RADIUS : PHASE4_RADIUS)
      },
      updateState: (state, _variant, role, click, wasCorrect) => ({
        ...state!,
        playerPositions: ALL_ROLES.map((r) => {
          const target = getPhase4Target(r, state!.cloneAssignments, state!.group1Players)
          return {
            role: r,
            pos: r === role ? (wasCorrect ? target : (click ?? target)) : target,
          }
        }),
      }),
      tolerance: 0,
      autoAdvance: true,
    },
     {
      id: 'snaking-kick',
      prompt: "Stand behind the boss",
      bosses: [],
      setPlayerPositions: (_, state) => state!.playerPositions,
      rollVariant: () => {
        const rotations = [45, 135, 225, 315]
        const rotation = rotations[Math.floor(Math.random() * rotations.length)]
        return { id: `rot-${rotation}`, label: `${rotation}°`, rotation }
      },
      hazards: (variant) => variant ? [{
        id: 'p5-boss',
        // +180 so the sprite's visual face points in the game-facing direction
        shape: { type: 'boss' as const, pos: { x: 0.5, y: 0.265 }, rotation: (variant.rotation as number) + 180, scale: 1.5 },
      }] : [],
      getSolution: (variant) => {
        if (!variant) return BOSS_CENTER
        const bossPos = { x: 0.5, y: 0.265 }
        const rad = (variant.rotation as number) * Math.PI / 180
        // facing = (sin, -cos); behind = (-sin, +cos)
        return { x: bossPos.x - Math.sin(rad) * 0.15, y: bossPos.y + Math.cos(rad) * 0.15 }
      },
      getHints: (variant) => {
        if (!variant) return []
        const bossPos = { x: 0.5, y: 0.265 }
        const rad = (variant.rotation as number) * Math.PI / 180
        const center = { x: bossPos.x - Math.sin(rad) * 0.15, y: bossPos.y + Math.cos(rad) * 0.15 }
        return [{ id: 'p5-hint', shape: { type: 'circle' as const, pos: center, radius: 0.12 } }]
      },
      isCorrect: (click, variant) => {
        if (!variant) return false
        const bossPos = { x: 0.5, y: 0.265 }
        const rad = (variant.rotation as number) * Math.PI / 180
        const dx = click.x - bossPos.x
        const dy = click.y - bossPos.y
        // behind = dot with facing (sin, -cos) < 0
        return (dx * Math.sin(rad) - dy * Math.cos(rad)) < 0
      },
      updateState: (state) => state!,
      tolerance: 0,
      autoAdvance: true,
    },
    {
      id: 'near-far',
      prompt: 'Move to your safe spot',
      bosses: [{ pos: { x: 0.5, y: 0.265 }, scale: 1.5, rotation: 180 }],
      setPlayerPositions: (_, state) => state!.playerPositions,
      hazards: () => [],
      getSolution: (_, role, state) =>
        state ? getPhase5Target(role, state.cloneAssignments, state.group1Players) : BOSS_CENTER,
      getHints: () => [
        { id: 'hint-p5-cone-g1',  shape: { type: 'circle' as const, pos: PHASE5_POSITIONS.cone_g1,    radius: PHASE5_RADIUS } },
        { id: 'hint-p5-cone-g2',  shape: { type: 'circle' as const, pos: PHASE5_POSITIONS.cone_g2,    radius: PHASE5_RADIUS } },
        { id: 'hint-p5-stack-g1', shape: { type: 'circle' as const, pos: PHASE5_POSITIONS.stack_g1,   radius: PHASE5_RADIUS } },
        { id: 'hint-p5-stack-g2', shape: { type: 'circle' as const, pos: PHASE5_POSITIONS.stack_g2,   radius: PHASE5_RADIUS } },
        { id: 'hint-p5-rest',     shape: { type: 'circle' as const, pos: PHASE5_POSITIONS.stack_rest, radius: PHASE5_RADIUS } },
      ],
      isCorrect: (click, _, role, state) => {
        if (!state) return false
        const target = getPhase5Target(role, state.cloneAssignments, state.group1Players)
        return distance(click, target) <= PHASE5_RADIUS
      },
      updateState: (state, _variant, role, click, wasCorrect) => ({
        ...state!,
        playerPositions: ALL_ROLES.map((r) => {
          const target = getPhase5Target(r, state!.cloneAssignments, state!.group1Players)
          return {
            role: r,
            pos: r === role ? (wasCorrect ? target : (click ?? target)) : target,
          }
        }),
      }),
      tolerance: 0,
      autoAdvance: true,
    },
  ],
}

export default BananaCodex;
