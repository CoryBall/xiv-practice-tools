import { Role, Strategy, Vec2 } from "../../../engine/types";

interface Replication2State {
  group1Players: Role[];
  group2Players: Role[];
  playerPositions: { role: Role, pos: Vec2 }[];
}

const initialState: Replication2State = {
  group1Players: [],
  group2Players: [],
  playerPositions: [
    { role: 'MT', pos: { x: 0.5, y: 0.4 } },
    { role: 'OT', pos: { x: 0.5, y: 0.6 } },
    { role: 'M1', pos: { x: 0.40, y: 0.575 } },
    { role: 'M2', pos: { x: 0.60, y: 0.575 } },
    { role: 'H1', pos: { x: 0.325, y: 0.575 } },
    { role: 'H2', pos: { x: 0.625, y: 0.375 } },
    { role: 'R1', pos: { x: 0.325, y: 0.35 } },
    { role: 'R2', pos: { x: 0.75, y: 0.625 } }
  ],
}

const BananaCodex: Strategy<Replication2State> = {
  id: 'bc-rep-2',
  name: 'Banana Codex',
  url: 'https://raidplan.io/plan/zLbFvB6R3muGFSK1',
  description: 'Marked players stand on outside corner of waymarks',
  initialState: initialState,
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
        setPlayerPositions: (_, state) => state.playerPositions,
        hazards: () => [
          { id: 'clone-1', shape: { type: 'boss', pos: { x: 0.5, y: 0.2 }, rotation: 0, scale: 0.75 }, },
          { id: 'clone-2', shape: { type: 'boss', pos: { x: 0.725, y: 0.275 }, rotation: 45, scale: 0.75 }, },
          { id: 'clone-3', shape: { type: 'boss', pos: { x: 0.815, y: 0.5 }, rotation: 90, scale: 0.75 }, },
          { id: 'clone-4', shape: { type: 'boss', pos: { x: 0.725, y: 0.725 }, rotation: 135, scale: 0.75 }, },
          { id: 'clone-5', shape: { type: 'boss', pos: { x: 0.5, y: 0.8 }, rotation: 180, scale: 0.75 }, },
          { id: 'clone-6', shape: { type: 'boss', pos: { x: 0.275, y: 0.725 }, rotation: 225, scale: 0.75 }, },
          { id: 'clone-7', shape: { type: 'boss', pos: { x: 0.185, y: 0.5 }, rotation: 270, scale: 0.75 }, },
          { id: 'clone-8', shape: { type: 'boss', pos: { x: 0.275, y: 0.275 }, rotation: 315, scale: 0.75 }, },
        ],
        getSolution: () => ({ x: 0, y: 0 }),
        getHints: (_variant, _role) => [],
        isCorrect: (_click, _variant, _role) => false,
        updateState: (_state, _variant, _role) => {
            return {
              group1Players: [],
              group2Players: [],
              playerPositions: [],
            }
        },
        tolerance: 0,
    },
 ],
}

export default BananaCodex;
