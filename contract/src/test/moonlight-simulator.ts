import {
  type CircuitContext,
  sampleContractAddress,
  createConstructorContext,
  createCircuitContext
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger
} from "../managed/moonlight/contract/index.js";
import {
  type MoonlightPrivateState,
  createMoonlightPrivateState,
  witnesses
} from "../witnesses.js";

/**
 * Runs the Moonlight contract circuits locally against an in-memory ledger.
 * `as(actor)` switches the private state (secret key) between calls, so a
 * single simulator can play both the client and freelancer roles.
 */
export class MoonlightSimulator {
  readonly contract: Contract<MoonlightPrivateState>;
  circuitContext: CircuitContext<MoonlightPrivateState>;

  constructor(initialActor: Uint8Array = MoonlightSimulator.actorKey(1)) {
    this.contract = new Contract<MoonlightPrivateState>(witnesses);
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext(
          createMoonlightPrivateState(initialActor),
          "0".repeat(64)
        )
      );
    this.circuitContext = createCircuitContext(
      sampleContractAddress(),
      currentZswapLocalState,
      currentContractState,
      currentPrivateState
    );
  }

  /** A deterministic 32-byte secret key for test actor `n`. */
  static actorKey(n: number): Uint8Array {
    const key = new Uint8Array(32);
    key[0] = n;
    return key;
  }

  /** Switch which actor (secret key) signs the next circuit calls. */
  public as(actor: Uint8Array): this {
    this.circuitContext = {
      ...this.circuitContext,
      currentPrivateState: createMoonlightPrivateState(actor)
    };
    return this;
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public postOrder(
    detailsHash: Uint8Array,
    budget: bigint,
    budgetSalt: Uint8Array
  ): bigint {
    const results = this.contract.impureCircuits.postOrder(
      this.circuitContext,
      detailsHash,
      budget,
      budgetSalt
    );
    this.circuitContext = results.context;
    return results.result;
  }

  public acceptOrder(orderId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.acceptOrder(
      this.circuitContext,
      orderId
    ).context;
  }

  public completeOrder(orderId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.completeOrder(
      this.circuitContext,
      orderId
    ).context;
  }

  public cancelOrder(orderId: bigint): void {
    this.circuitContext = this.contract.impureCircuits.cancelOrder(
      this.circuitContext,
      orderId
    ).context;
  }

  public verifyBudget(orderId: bigint, budget: bigint, salt: Uint8Array): boolean {
    const results = this.contract.impureCircuits.verifyBudget(
      this.circuitContext,
      orderId,
      budget,
      salt
    );
    this.circuitContext = results.context;
    return results.result;
  }
}
