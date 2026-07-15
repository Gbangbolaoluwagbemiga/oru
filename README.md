# 🌙 Moonlight

**A privacy-first freelance marketplace on [Midnight](https://midnight.network).**

Freelance platforms today leak everything: what you charge, who you work for, and how often. Moonlight keeps the *coordination* of freelance work on-chain while keeping the *content* of it private — job details, budgets, and identities never touch the public ledger.

> Built for the **Monthly Moonshots on Midnight** builder program.
> Current level: **Level 1 — New Moon** 🌑

## Privacy model

The Level 1 contract ([contract/src/moonlight.compact](contract/src/moonlight.compact)) is a private work-order registry written in [Compact](https://docs.midnight.network/develop/reference/compact/), Midnight's zero-knowledge circuit language:

| Data | On-chain representation | Who can see the real value |
|---|---|---|
| Job details (title, description) | SHA-256 commitment | Client (and whoever they share it with) |
| Budget | Salted hash commitment | Client; provable on demand via `verifyBudget` |
| Client / freelancer identity | In-circuit hash of a local secret key | Nobody — not even linkable to a wallet address |
| Order status (`OPEN → ASSIGNED → COMPLETED/CANCELLED`) | Public enum | Everyone (minimum needed for coordination) |

Key mechanics:

- **Inputs are private by default.** Every circuit argument is witness data; only values explicitly wrapped in `disclose()` and written to the ledger become public.
- **Authorization without identification.** "Only the client can complete an order" is enforced by re-deriving the identity hash from the local secret key *inside the circuit* — no signature, no address, no doxxing.
- **Selective disclosure.** `verifyBudget` proves a claimed budget matches the on-chain commitment without the ledger ever storing the amount.

## Repository layout

```
contract/            Compact contract + TypeScript witness bindings
  src/moonlight.compact    The contract (5 circuits)
  src/witnesses.ts         Private state (local secret key)
  src/test/                Simulator-based unit tests (vitest)
cli/                 Deploy & interact with the contract on Preprod
  src/api.ts               Wallet + provider plumbing, contract operations
  src/cli.ts               Interactive marketplace menu
```

## Prerequisites

- Node.js ≥ 22, npm
- [Compact developer tools](https://docs.midnight.network/getting-started/installation):
  ```sh
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
  compact update
  ```
- Docker (for the local proof server, needed to deploy/interact)

## Build & test

```sh
npm install
npm run compact      # compile the Compact contract (generates ZK keys + TS API)
npm test             # run the contract test suite (9 tests)
npm run build        # build both packages
```

## Deploy to Preprod

```sh
# Terminal 1 — proof server (or use `npm run preprod-ps --workspace cli` to auto-start it)
docker run -p 6300:6300 midnightntwrk/proof-server:8.0.3 -- midnight-proof-server -v

# Terminal 2 — interactive CLI
npm run preprod --workspace cli
```

The CLI walks you through:

1. Creating or restoring a wallet (fund it with tNight from the [Preprod faucet](https://faucet.preprod.midnight.network/))
2. Registering NIGHT UTXOs for DUST generation (DUST pays transaction fees)
3. Deploying the Moonlight contract (or joining an existing one by address)
4. Posting, browsing, accepting, completing, and cancelling work orders — each action generates a real ZK proof

**Deployed contract (Preprod):** _pending — address will be published here after first deployment_

## Roadmap (lunar cycle)

- 🌑 **Level 1 — New Moon:** toolchain, first contract, Preprod deployment ← *you are here*
- 🌒 **Level 2 — Waxing Crescent:** React frontend + Lace wallet connection
- 🌓 **Level 3 — First Quarter:** polished dApp, CI/CD, program problem statement
- 🌔 **Level 4 — Waxing Gibbous:** MVP live on Preprod with docs + public profile
- 🌕 **Level 5 — Full Moon:** feedback loop, 50 Preprod users
- 🌝 **Level 6 — Supermoon:** Mainnet launch, 20 real users

## Acknowledgements

Wallet and provider plumbing in `cli/` is adapted from the official [midnightntwrk/example-counter](https://github.com/midnightntwrk/example-counter) (Apache-2.0), including its documented workarounds for wallet SDK signing issues. The contract, tests, and marketplace logic are Moonlight's own.

## License

Apache-2.0
