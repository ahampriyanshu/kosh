import { universe } from '../data/universe';
import { UniverseSchema, type UniverseEntry } from './schemas';

export function getUniverse(): UniverseEntry[] {
  return UniverseSchema.parse(universe);
}
