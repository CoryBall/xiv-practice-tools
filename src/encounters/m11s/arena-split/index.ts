import type { MechanicDef } from '../../../engine/types'
import OuterStrategy from './outer'

export const arenaSplit: MechanicDef = {
  id: 'arena-split',
  name: 'Arena Split',
  description: 'The arena splits into two platforms.',
  arenaImage: '/assets/arenas/m11s/split-arena.png',
  bosses: [
    { pos: { x: 0.5, y: 0.5 }, rotation: 180 },
  ],
  strategies: [
    OuterStrategy
  ],
}