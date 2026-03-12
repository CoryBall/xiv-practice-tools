import { Hazard, Role, Strategy, Variant, Vec2 } from "../../../engine/types";
import { randomizeArray } from "../../../utils/arrays";
import { rectHitTest } from "../../../utils/geometry";

interface ArenaSplitVariant extends Variant{
    leftPortals: Vec2[]
    leftLineAoeX: number;

    rightPortals: Vec2[]
    rightLineAoeX: number;
}

const VARIANTS: ArenaSplitVariant[] = [
    {
        id: 'variant-1',
        label: 'Variant 1',
        leftPortals: [
            { x: 0, y: 0.125 },
            { x: 0, y: 0.875 },
        ],
        leftLineAoeX: 0.29,

        rightPortals: [
            { x: 1, y: 0.125 },
            { x: 1, y: 0.875 },
        ],
        rightLineAoeX: 0.9,
    },
];

interface SplitArenaState {
    tetheredPlayers: Role[]
    platformRoles: {
        platform1: Role[]
        platform2: Role[]
    }
}

const isGroup1 = (role: Role) => ['MT', 'H1', 'M1', 'R1'].includes(role)

const group1KnockbackRect = { x1: 0.38, x2: 0.5, y1: 0.375, y2: 0.625 }
const group2KnockbackRect = { x1: 0.5, x2: 0.63, y1: 0.375, y2: 0.625 }

const OuterStrategy: Strategy<SplitArenaState, ArenaSplitVariant> = {
  id: 'outer',
  name: 'Outer Waymarks',
  waymarks: [
    { id: '1', pos: { x: 0.2, y: 0.2 } },
    { id: '2', pos: { x: 0.8, y: 0.2 } },
    { id: '3', pos: { x: 0.8, y: 0.8 } },
    { id: '4', pos: { x: 0.2, y: 0.8 } },
    { id: 'A', pos: { x: 0.50, y: 0.25 } },
    { id: 'B', pos: { x: 0.75, y: 0.5 } },
    { id: 'C', pos: { x: 0.5, y: 0.75 } },
    { id: 'D', pos: { x: 0.25, y: 0.5 } },
  ],
  description: 'Marked players stand on outside corner of waymarks',
  phases: [
    {
        id: 'move-to-side',
        prompt: 'Get ready to be knocked onto your platform',
        arenaImage: '/arenas/m11s/default.png',
        hazards: () => [
            {
                id: 'knockback-indicator',
                color: '#ff4444',
                opacity: 0.8,
                shape: {
                    type: 'rect',
                    x1: 0.38,
                    y1: 0,
                    x2: 0.63,
                    y2: 1,
                }
            }
        ],
        getSolution: () => ({ x: 0, y: 0 }),
        getHints: (_variant, _role) => [
            {
                id: 'hint-group-1',
                shape: { type: 'rect', ...group1KnockbackRect },
                opacity: 0.8,
                outlined: true,
            },
            {
                id: 'hint-group-2',
                shape: { type: 'rect', ...group2KnockbackRect },
                opacity: 0.8,
                outlined: true,
            }
        ],
        isCorrect: (click, _variant, role) => {
            const rect = isGroup1(role)
                ? rectHitTest(group1KnockbackRect) // left
                : rectHitTest(group2KnockbackRect) // right
            return rect(click);
        },
        updateState: (_state, _variant, _role) => {
            const group1: Role[] = ['MT', 'H1', 'M1', 'R1']
            const group1Tethers = group1
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);

            const group2: Role[] = ['OT', 'H2', 'M2', 'R2'];
            const group2Tethers = group2
                .sort(() => Math.random() - 0.5)
                .slice(0, 2);

            return {
                platformRoles: {
                    platform1: ['MT', 'H1', 'M1', 'R1'],
                    platform2: ['OT', 'H2', 'M2', 'R2'],
                },
                tetheredPlayers: [...group1Tethers, ...group2Tethers],
            }
        },
        tolerance: 0,
    },
    {
        id: 'tower-1',
        prompt: 'Stand on your tower to get knocked back onto the correct platform',
        arenaImage: '/arenas/m11s/split-arena.png',
        rollVariant: () => VARIANTS[Math.floor(Math.random() * VARIANTS.length)]!,
        hazards: (variant, _s) => {
            const LineAoeHazards: Hazard[] = [
                {
                    id: 'left-line-aoe',
                    opacity: 1,
                    shape: {
                        type: 'line',
                        x: variant!.leftLineAoeX,
                    }
                },
                {
                    id: 'right-line-aoe',
                    opacity: 1,
                    shape: {
                        type: 'line',
                        x: variant!.rightLineAoeX,
                    }
                }
            ];
            return [
                ...LineAoeHazards,
                {
                    id: 'top-left-tower',
                    opacity: 1,
                    shape: {
                        type: 'image',
                        url: '/hazards/knockback_aoe.png',
                        pos: { x: 0.2, y: 0.22 },
                        width: 0.4,
                        height: 0.4,
                        rotation: 0,
                    }
                },
                {
                    id: 'top-left-aoe',
                    opacity: 1,
                    shape: {
                        type: 'circle',
                        pos: { x: 0.2, y: 0.22 },
                        radius: 0.1,
                    }
                },
                {
                    id: 'top-right-tower',
                    opacity: 1,
                    shape: {
                        type: 'image',
                        url: '/hazards/knockback_aoe.png',
                        pos: { x: 0.2, y: 0.22 },
                        width: 0.4,
                        height: 0.4,
                        rotation: 0,
                    }
                },
                {
                    id: 'top-left-aoe',
                    opacity: 1,
                    shape: {
                        type: 'circle',
                        pos: { x: 0.2, y: 0.22 },
                        radius: 0.1,
                    }
                }
            ]
        },
        setPlayerPositions: (_v, _s) => [
            { role: 'R1', pos: { x: 0.35, y: 0.35 } },
            { role: 'MT', pos: { x: 0.35, y: 0.45 } },
            { role: 'M1', pos: { x: 0.35, y: 0.55 } },
            { role: 'H1', pos: { x: 0.35, y: 0.65 } },
            { role: 'R2', pos: { x: 0.65, y: 0.35 } },
            { role: 'OT', pos: { x: 0.65, y: 0.45 } },
            { role: 'M2', pos: { x: 0.65, y: 0.55 } },
            { role: 'H2', pos: { x: 0.65, y: 0.65 } },
        ],
        getTethers: (variant, state) => {
            const tetherOrigins = randomizeArray([...variant!.leftPortals, ...variant!.rightPortals]);
            const tetheredPlayers = randomizeArray(state.tetheredPlayers);

            return tetheredPlayers.map((role, i) => ({
                from: tetherOrigins[i],
                to: role,
                color: '#bd3535ff',
                opacity: 1,
            }));
        },
        getSolution: (_v, role) => {
            const isGroup1 = ['MT', 'H1', 'M1', 'R1'].includes(role)
            return isGroup1 ? { x: 0.25, y: 0.25 } : { x: 0.75, y: 0.25 }
        },
        updateState: (state, _v, _r) => {
            return {
                ...state,
                tetheredPlayers: [],
            }
        },
        tolerance: 0.1,
    }
 ],
}

// type Platform_Position = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';
// const TOWER_SAFE_SPOTS: Record<Platform_Position, { samePlatform: Rect, otherPlatform: Rect }> = {
//     'TopLeft': {
//         samePlatform: { x1: 0.175, x2: 0.23, y1: 0.15, y2: 0.3 },
//         otherPlatform: { x1: 0.25, x2: 0.275, y1: 0.2, y2: 0.275 },
//     },
//     'TopRight': {
//         samePlatform: { x1: 0.77, x2: 0.83, y1: 0.15, y2: 0.3 },
//         otherPlatform: { x1: 0.725, x2: 0.75, y1: 0.2, y2: 0.275 },
//     },
//     'BottomLeft': {
//         samePlatform: { x1: 0.175, x2: 0.23, y1: 0.7, y2: 0.85 },
//         otherPlatform: { x1: 0.25, x2: 0.275, y1: 0.725, y2: 0.8 },
//     },
//     'BottomRight': {
//         samePlatform: { x1: 0.77, x2: 0.83, y1: 0.7, y2: 0.85 },
//         otherPlatform: { x1: 0.725, x2: 0.75, y1: 0.725, y2: 0.8 },
//     },
// }

export default OuterStrategy;
