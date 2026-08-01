# Product Proposal

## What is the product, and who uses it?

Oru is a private freelance work-order marketplace. A client posts a job with a
description and a budget; a freelancer accepts it, delivers, and the client
marks it complete (or cancels while it's still open). As of Level 3, clients
can also gate a job to "verified freelancers only" — freelancers who have
proven, from their own track record, that they've completed at least one
prior order.

The users are the two sides of any freelance engagement — clients who want to
hire without broadcasting their budgets, hiring patterns, or contractor
relationships to competitors, and freelancers who want to build a provable
track record without publishing their client list or income to the world.
The initial target market is freelancers in price-sensitive, reputation-heavy
markets (e.g. Nigeria) where today's platforms take a cut *and* expose rate
and client data that local competitors and intermediaries can use against
them.

## Why Midnight specifically?

A transparent chain (or a traditional freelance platform's public database)
forces a binary choice: either the deal terms are visible to everyone
(competitors see your rates and clients; clients see each other's budgets),
or the enforcement logic has to live off-chain in a trusted party's database,
which defeats the point of putting it on a blockchain at all.

Midnight lets Oru enforce the marketplace's rules — only the client can
complete or cancel their own order, a freelancer can't accept their own job,
a "verified-only" order can only be accepted by an allowlisted identity — as
zero-knowledge circuits, so the rules are checked and provably satisfied
*without* the underlying job details, budget, or real-world identity ever
touching the public ledger. The `disclose()` boundary in Compact means every
piece of information that does reach the chain (an order's status, a
commitment hash, a pseudonymous identity hash) was a deliberate choice by the
contract author, not an accident of how the platform is built. And because
Midnight's privacy is *provable* rather than merely obscured, a party can
later selectively disclose a committed value (e.g. proving a budget via
`verifyBudget`, or proving completed-order eligibility via `joinAllowlist`)
without ever having published it up front — something a plaintext database
or a transparent chain can't offer without giving up privacy entirely.

## Data Model

| Data Point                                             | Type            | Disclosed To |
|---------------------------------------------------------|----------------|--------------|
| Order id / order count                                   | Public ledger  | Everyone     |
| Order lifecycle status (`OPEN`/`ASSIGNED`/`COMPLETED`/`CANCELLED`) | Public ledger  | Everyone     |
| Client identity hash                                      | Public ledger  | Everyone (pseudonymous — not a wallet address) |
| Freelancer identity hash                                  | Public ledger  | Everyone (pseudonymous — not a wallet address) |
| Job details commitment (SHA-256 hash)                     | Public ledger  | Everyone (hash only, not the preimage) |
| Budget commitment (salted hash)                           | Public ledger  | Everyone (hash only, not the amount) |
| "Verified freelancers only" flag on an order              | Public ledger  | Everyone |
| Completed-order count, per identity hash                  | Public ledger  | Everyone (tied only to the pseudonym, not a person) |
| Verified allowlist membership (set of identity hashes)     | Public ledger  | Everyone |
| Local secret key                                           | Private witness| No one — never leaves the participant's device |
| Job details (plaintext title/description)                  | Private witness| No one — only the client, off-chain |
| Budget amount (plaintext)                                   | Private witness| No one — only the client, off-chain |
| Budget salt                                                 | Private witness| No one — held by the client to later prove the budget via `verifyBudget` |

## Mainnet Feasibility

Technically, yes — the contract itself is small and uses only Compact's
standard ledger primitives (`Map`, `Set`, `Counter`) with no exotic patterns,
so there's no research risk between here and Mainnet; the remaining contract
work (private escrow, described in the roadmap) is an incremental extension
of the same commitment/disclosure pattern already proven out across postOrder,
acceptOrder, and now joinAllowlist.

The real risk to a Level 6 timeline is UX and adoption, not cryptography —
two friction points surfaced firsthand while building Levels 1–3:

- **Proof server UX.** The frontend currently depends on a local proof
  server on `localhost:6300`, which is a real barrier for non-technical
  freelancers. Reaching real users requires either a reliably hosted proof
  server or waiting for wallet-delegated proving to mature to the point it
  no longer times out on Preprod (it did not, as of this build).
- **DUST onboarding.** New wallets hold NIGHT but generate zero DUST until
  it's explicitly designated, and first-time designation has a real
  multi-hour initialization window before fees can be paid at all. That's an
  invisible, confusing wait for a first-time user who just wants to post a
  job.

Neither is a reason to doubt Mainnet feasibility — both are solvable with
product work (a managed proof-server backend, clearer DUST onboarding copy
and status) rather than contract redesign — but they're the actual gating
items for the "50 Preprod users" and "20 real users" milestones in Levels 5–6,
more than any remaining circuit work.
