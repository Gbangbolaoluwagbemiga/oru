import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "./managed/moonlight/contract/index.js";

/**
 * Private state held locally by each Moonlight participant. The secret key
 * never leaves the user's machine; circuits derive a public identity hash
 * from it in-circuit.
 */
export type MoonlightPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createMoonlightPrivateState = (
  secretKey: Uint8Array
): MoonlightPrivateState => ({ secretKey });

export const witnesses = {
  localSecretKey: ({
    privateState
  }: WitnessContext<Ledger, MoonlightPrivateState>): [
    MoonlightPrivateState,
    Uint8Array
  ] => [privateState, privateState.secretKey]
};
