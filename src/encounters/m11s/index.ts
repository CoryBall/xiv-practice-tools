import type { EncounterDef } from '../../engine/types'
import { arenaSplit } from './arena-split'

export const m11s: EncounterDef = {
  id: 'm11s',
  name: 'M11S — Tyrant',
  partySize: 8,
  // Drop your arena screenshot at public/arenas/m11s.png and uncomment:
  arenaImage: '/arenas/m11s/default.png',
  mechanics: [arenaSplit],
}
