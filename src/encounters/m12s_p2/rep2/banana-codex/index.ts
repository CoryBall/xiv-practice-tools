import type { Role, Strategy } from "../../../../engine/types";
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
} from "./constants";
import { buildInitialPlayerPositions, computeGroups, computePhase2, shuffle } from "./logic";
import type { Replication2State } from "./types";

const BananaCodex: Strategy<Replication2State> = {
  id: 'bc-rep-2',
  name: 'Banana Codex',
  url: 'https://raidplan.io/plan/zLbFvB6R3muGFSK1',
  description: 'Marked players stand on outside corner of waymarks',
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
        return { ...state!, group1Players, group2Players, playerPositions }
      },
      autoAdvance: true,
    },
    {
      id: 'phase-3',
      prompt: 'TODO: phase 3',
      setPlayerPositions: (_, state) => state!.playerPositions,
      hazards: () => [],
      getSolution: () => BOSS_CENTER,
    },
  ],
}

export default BananaCodex;
