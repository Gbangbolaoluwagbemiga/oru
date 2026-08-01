# Level 3 — First Quarter: Submission Notes

Chosen idea-list problem: **Private Allowlist Access** — prove membership without revealing identity.

Status against the Rise In requirements:

| Requirement | Status |
|---|---|
| 3+ tests: circuit logic, state transitions, privacy | ✅ 14 tests total in [contract/src/test/oru.test.ts](../contract/src/test/oru.test.ts) (10 from Level 1/2 + 4 new for the allowlist) |
| CI/CD pipeline on push/PR | ✅ [.github/workflows/ci.yml](../.github/workflows/ci.yml) — checkout, Node 22, install, `compact compile`, build, typecheck, test |
| CI status badge in README | ✅ top of [README.md](../README.md) |
| Contract address in README (mandatory) | ✅ Preprod: `43417527ae01b89855ed4befa4fc3a064bcb0f182d142cf3c15c00ad50051fa2` |
| Privacy Model section in README | ✅ updated for the new ledger state and `joinAllowlist` |
| PROPOSAL.md with correct structure | ✅ [PROPOSAL.md](../PROPOSAL.md) — filled in |
| dApp builds with zero errors | ✅ `tsc` + `vite build` clean across `contract`, `cli`, `web` |
| Demo video | ✅ [Watch on Loom](https://www.loom.com/share/1f8b2270477e4a34a2a049f2e78c38e9) |

## What was added

A sixth circuit, `joinAllowlist`, plus three new ledger fields:

- `verifiedOnly: Map<Field, Boolean>` — per-order gate, set at `postOrder` time.
- `completedCounts: Map<Bytes<32>, Uint<64>>` — per-freelancer-identity completed-order count, bumped by `completeOrder`.
- `verifiedFreelancers: Set<Bytes<32>>` — the allowlist itself.

A freelancer who has completed at least one order can call `joinAllowlist`, which checks their own completed-order count in-circuit and discloses only their identity hash — the same pseudonymous hash used everywhere else in the contract — to the public allowlist. `acceptOrder` then enforces the gate: if an order was posted with `requireVerified: true`, only an allowlisted identity may accept it.

Nothing about *why* a freelancer qualifies (their exact count, which orders, when) ever reaches the chain — only the yes/no fact of membership.

## Reproducing locally

```sh
npm install
npm run compact
npm run build --workspace @oru/contract
docker run -d --name oru-proof-server -p 6300:6300 midnightntwrk/proof-server:8.0.3 'midnight-proof-server -v'
npm run dev --workspace web   # http://localhost:5173
```

Connect Lace (Preprod, funded, NIGHT designated for DUST), then:

1. Post an order with **"Require a verified freelancer"** checked.
2. Try to accept it from an account that hasn't completed any orders — it's rejected with `"This order requires a verified freelancer — join the allowlist first"`.
3. Post and complete an ordinary (ungated) order as that same freelancer, to earn a completed-order count.
4. Click **Join Allowlist**.
5. Accept the original gated order — it now succeeds.

## Demo video checklist

1. Connect Lace wallet.
2. Post a verified-only order, then show an unverified freelancer's `acceptOrder` get rejected.
3. Complete an ordinary order as that freelancer, call `joinAllowlist`, then accept the gated order successfully.
4. Terminal: `npm test` showing 14 tests passing.
5. README: the green CI badge.

## Remaining steps

Submit the repo URL, live demo URL ([oru-web-beta.vercel.app](https://oru-web-beta.vercel.app/)), contract address, and the video link above on the Rise In portal.
