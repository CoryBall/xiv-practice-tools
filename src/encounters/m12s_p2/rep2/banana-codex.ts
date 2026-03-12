import { Hazard, HazardShape, Role, Strategy, Vec2 } from "../../../engine/types";
import { distance } from "../../../utils/geometry";

type BossCloneMechanic = { type: string; url?: string }

interface Replication2State {
  group1Players: Role[];
  group2Players: Role[];
  playerPositions: { role: Role, pos: Vec2 }[];
  cloneAssignments: Record<Role, Vec2>;
  /** Shuffled mechanics, indexed parallel to BOSS_CLONE_POSITIONS */
  bossCloneMechanics: BossCloneMechanic[];
}

const ALL_ROLES: Role[] = ['MT', 'OT', 'H1', 'H2', 'M1', 'M2', 'R1', 'R2']

const CLONE_POSITIONS: Vec2[] = [
  { x: 0.5, y: 0.2 },
  { x: 0.725, y: 0.275 },
  { x: 0.815, y: 0.5 },
  { x: 0.725, y: 0.725 },
  { x: 0.5, y: 0.8 },
  { x: 0.275, y: 0.725 },
  { x: 0.185, y: 0.5 },
  { x: 0.275, y: 0.275 },
]
const CLONE_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315]
const CLONE_HAZARDS = CLONE_POSITIONS.map((pos, i) => ({
    id: `clone-${i + 1}`,
    shape: { type: 'boss' as const, pos, rotation: CLONE_ROTATIONS[i], scale: 0.75 },
  }));

const BOSS_CLONE_POSITIONS: Vec2[] = [
  { x: 0.615, y: 0.3 },
  { x: 0.715, y: 0.5 },
  { x: 0.615, y: 0.7 },
  { x: 0.385, y: 0.7 },
  { x: 0.285, y: 0.5 },
  { x: 0.385, y: 0.3 },
];
const BOSS_CLONE_ROTATIONS = [30, 90, 150, 210, 270, 330];
const BOSS_CLONE_MECHANICS: BossCloneMechanic[] = [
  { type: 'prox', url: '/assets/hazards/m12_p2_prox.png' },
  { type: 'prox', url: '/assets/hazards/m12_p2_prox.png' },
  { type: 'stack', url: '/assets/hazards/m12_p2_stack.png' },
  { type: 'stack', url: '/assets/hazards/m12_p2_stack.png' },
  { type: 'cone' },
  { type: 'cone' },
]
const BOSS_CLONE_HAZARDS = BOSS_CLONE_POSITIONS.map((pos, i) => ({
    id: `boss-clone-${i + 1}`,
    shape: { type: 'boss' as const, pos, rotation: BOSS_CLONE_ROTATIONS[i], scale: 1 },
  }));

const CLONE_RADIUS = 0.07

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const BananaCodex: Strategy<Replication2State> = {
  id: 'bc-rep-2',
  name: 'Banana Codex',
  url: 'https://raidplan.io/plan/zLbFvB6R3muGFSK1',
  description: 'Marked players stand on outside corner of waymarks',
  rollState: () => {
    const shuffled = shuffle(CLONE_POSITIONS)
    const cloneAssignments = Object.fromEntries(
      ALL_ROLES.map((role, i) => [role, shuffled[i]])
    ) as Record<Role, Vec2>
    return {
      group1Players: [],
      group2Players: [],
      bossCloneMechanics: shuffle(BOSS_CLONE_MECHANICS),
      playerPositions: [
        { role: 'MT', pos: { x: 0.5, y: 0.4 } },
        { role: 'OT', pos: { x: 0.5, y: 0.6 } },
        { role: 'M1', pos: { x: 0.40, y: 0.575 } },
        { role: 'M2', pos: { x: 0.60, y: 0.575 } },
        { role: 'H1', pos: { x: 0.325, y: 0.575 } },
        { role: 'H2', pos: { x: 0.625, y: 0.375 } },
        { role: 'R1', pos: { x: 0.325, y: 0.35 } },
        { role: 'R2', pos: { x: 0.75, y: 0.625 } },
      ],
      cloneAssignments,
    }
  },
  waymarks: [
    { id: '4', pos: { x: 0.5, y: 0.325 } },
    { id: 'D', pos: { x: 0.5, y: 0.215 } },
    { id: '1', pos: { x: 0.675, y: 0.5 } },
    { id: 'A', pos: { x: 0.8, y: 0.5 } },
    { id: '2', pos: { x: 0.5, y: 0.675 } },
    { id: 'B', pos: { x: 0.5, y: 0.775 } },
    { id: '3', pos: { x: 0.325, y: 0.5 } },
    { id: 'C', pos: { x: 0.215, y: 0.5 } },
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
        group1Players: [],
        group2Players: [],
        cloneAssignments: state?.cloneAssignments ?? {} as Record<Role, Vec2>,
        bossCloneMechanics: state?.bossCloneMechanics ?? [],
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
      prompt: "Go to the tether with the correct mechanic for your clone's position",
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
              pos: { x: indicatorPos.x - 0.05 , y: indicatorPos.y },
              angleDeg: 0,
              spreadDeg: 45,
              radius: 0.1,
            },
          }
        }),
      ],
      getSolution: (_, role, state) => ({ x: 0, y: 0 }),
    }
  ],
}

export default BananaCodex;
