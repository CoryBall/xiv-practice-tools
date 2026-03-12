import type { MechanicDef } from '../../../engine/types'
import BananaCodex from './banana-codex'

export const Replication2: MechanicDef = {
  id: 'rep-2',
  name: 'Replication 2',
  description: 'D is new North, and tethers appear',
  bosses: [
    { pos: { x: 0.5, y: 0.5 }, scale: 1.5, rotation: 180 },
  ],
  strategies: [
    BananaCodex
  ],
}