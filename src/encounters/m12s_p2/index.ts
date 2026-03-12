import type { EncounterDef } from '../../engine/types'
import { Replication2 } from './rep2'

export const m12sP2: EncounterDef = {
  id: 'm12s_p2',
  name: 'M12S P2 — Lindwurm II',
  partySize: 8,
  // Drop your arena screenshot at public/arenas/m12s_p2.png and uncomment:
  arenaImage: '/assets/arenas/m12s_p2/default.png',
  mechanics: [Replication2],
}
