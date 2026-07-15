import { Moonlight, type MoonlightPrivateState } from '@moonlight/contract';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js/types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js/contracts';
import type { ProvableCircuitId } from '@midnight-ntwrk/compact-js';

export type MoonlightCircuits = ProvableCircuitId<Moonlight.Contract<MoonlightPrivateState>>;

export const MoonlightPrivateStateId = 'moonlightPrivateState';

export type MoonlightProviders = MidnightProviders<
  MoonlightCircuits,
  typeof MoonlightPrivateStateId,
  MoonlightPrivateState
>;

export type MoonlightContract = Moonlight.Contract<MoonlightPrivateState>;

export type DeployedMoonlightContract = DeployedContract<MoonlightContract> | FoundContract<MoonlightContract>;
