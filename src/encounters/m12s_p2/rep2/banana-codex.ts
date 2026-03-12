import { Strategy } from "../../../engine/types";

interface Replication2State {

}

const BananaCodex: Strategy<Replication2State> = {
  id: 'bc-rep-2',
  name: 'Banana Codex',
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
  description: 'Marked players stand on outside corner of waymarks',
  phases: [
    {
        id: 'player-clones',
        prompt: 'Move to your tethered clone',
        hazards: () => [],
        getSolution: () => ({ x: 0, y: 0 }),
        getHints: (_variant, _role) => [],
        isCorrect: (_click, _variant, _role) => false,
        updateState: (_state, _variant, _role) => {
            return {}
        },
        tolerance: 0,
    },
 ],
}

export default BananaCodex;
