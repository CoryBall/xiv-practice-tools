import { Hazard, Strategy } from "../../../engine/types";
import { randomizeArray } from "../../../utils/arrays";

interface Replication2State {

}

const BananaCodex: Strategy<Replication2State> = {
  id: 'bc',
  name: 'Banana Codex',
  waymarks: [
    { id: '1', pos: { x: 0.5, y: 0.325 } },
    { id: '2', pos: { x: 0.675, y: 0.5 } },
    { id: '3', pos: { x: 0.5, y: 0.675 } },
    { id: '4', pos: { x: 0.325, y: 0.5 } },
    { id: 'A', pos: { x: 0.5, y: 0.215 } },
    { id: 'B', pos: { x: 0.8, y: 0.5 } },
    { id: 'C', pos: { x: 0.5, y: 0.775 } },
    { id: 'D', pos: { x: 0.215, y: 0.5 } },
  ],
  description: 'Marked players stand on outside corner of waymarks',
  phases: [
    {
        id: 'move-to-side',
        prompt: 'Get ready to be knocked onto your platform',
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
        getHints: (_variant, _role) => [],
        isCorrect: (_click, _variant, _role) => false,
        updateState: (_state, _variant, _role) => {
            return {}
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

export default BananaCodex;
