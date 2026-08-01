import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { JoinedAllowlist, PostedOrder } from '../lib/contract';

interface CircuitCallProps {
  connected: boolean;
  onPostOrder: (details: string, budget: bigint, requireVerified: boolean) => Promise<PostedOrder>;
  onJoinAllowlist: () => Promise<JoinedAllowlist>;
}

type CallState = { phase: 'idle' } | { phase: 'proving' } | { phase: 'done'; result: PostedOrder } | { phase: 'error'; message: string };
type AllowlistState =
  | { phase: 'idle' }
  | { phase: 'joining' }
  | { phase: 'done'; result: JoinedAllowlist }
  | { phase: 'error'; message: string };

export function CircuitCall({ connected, onPostOrder, onJoinAllowlist }: CircuitCallProps) {
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');
  const [requireVerified, setRequireVerified] = useState(false);
  const [call, setCall] = useState<CallState>({ phase: 'idle' });
  const [allowlist, setAllowlist] = useState<AllowlistState>({ phase: 'idle' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!connected || !details || !budget) return;

    setCall({ phase: 'proving' });
    try {
      // `details` and `budget` are passed straight into the circuit call —
      // they are never rendered anywhere in this UI, only their on-chain
      // commitments (returned inside `result`) are.
      const result = await onPostOrder(details, BigInt(budget), requireVerified);
      setCall({ phase: 'done', result });
      setDetails('');
      setBudget('');
      setRequireVerified(false);
    } catch (err) {
      setCall({ phase: 'error', message: err instanceof Error ? err.message : 'Circuit call failed' });
    }
  };

  const handleJoinAllowlist = async () => {
    if (!connected || allowlist.phase === 'joining') return;
    setAllowlist({ phase: 'joining' });
    try {
      const result = await onJoinAllowlist();
      setAllowlist({ phase: 'done', result });
    } catch (err) {
      setAllowlist({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Circuit call failed',
      });
    }
  };

  return (
    <div className="circuit-call">
      <h2>Post a Work Order</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Job details (private — never sent to the chain in plaintext)
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. Build a landing page for..."
            disabled={!connected || call.phase === 'proving'}
            required
          />
        </label>
        <label>
          Budget in tNight (private — only a salted commitment is stored)
          <input
            type="number"
            min="1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            disabled={!connected || call.phase === 'proving'}
            required
          />
        </label>
        <label className="circuit-call__checkbox">
          <input
            type="checkbox"
            checked={requireVerified}
            onChange={(e) => setRequireVerified(e.target.checked)}
            disabled={!connected || call.phase === 'proving'}
          />
          Require a verified freelancer (allowlist-gated)
        </label>
        <motion.button
          type="submit"
          disabled={!connected || call.phase === 'proving'}
          whileHover={{ scale: connected && call.phase !== 'proving' ? 1.02 : 1 }}
          whileTap={{ scale: connected && call.phase !== 'proving' ? 0.98 : 1 }}
        >
          {call.phase === 'proving' ? 'Generating proof…' : 'Call postOrder'}
        </motion.button>
      </form>

      <AnimatePresence mode="wait">
        {call.phase === 'proving' && (
          <motion.p
            key="proving"
            className="circuit-call__status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span className="spinner" />
            <span>
              Generating a zero-knowledge proof in your wallet and submitting the transaction. This proves the order
              was posted correctly — <strong>without revealing the details or budget you entered.</strong>
            </span>
          </motion.p>
        )}

        {call.phase === 'done' && (
          <motion.div
            key="done"
            className="circuit-call__result"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <motion.p
              className="circuit-call__proved-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 15 }}
              >
                ✓
              </motion.span>
              Proved without revealing your input
            </motion.p>
            <dl>
              <dt>Order ID</dt>
              <dd>{call.result.orderId.toString()}</dd>
              <dt>Transaction ID</dt>
              <dd>{call.result.txId}</dd>
              <dt>Block height</dt>
              <dd>{call.result.blockHeight}</dd>
            </dl>
            <p className="circuit-call__hint">
              Only a commitment hash of the details and budget is now on-chain — save the budget salt below if you'll
              need to prove the budget later via <code>verifyBudget</code>:
            </p>
            <code className="circuit-call__salt">{Buffer.from(call.result.budgetSalt).toString('hex')}</code>
          </motion.div>
        )}

        {call.phase === 'error' && (
          <motion.p
            key="error"
            className="circuit-call__error"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {call.message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="circuit-call__allowlist">
        <div className="circuit-call__allowlist-row">
          <div>
            <h3>Verified Allowlist</h3>
            <p className="circuit-call__hint circuit-call__hint--tight">
              After completing at least one order, join the allowlist to accept orders marked "verified freelancers
              only" — proven from your own private completed-order count, without revealing it.
            </p>
          </div>
          <motion.button
            type="button"
            className="ghost"
            onClick={handleJoinAllowlist}
            disabled={!connected || allowlist.phase === 'joining'}
            whileHover={{ scale: connected && allowlist.phase !== 'joining' ? 1.02 : 1 }}
            whileTap={{ scale: connected && allowlist.phase !== 'joining' ? 0.98 : 1 }}
          >
            {allowlist.phase === 'joining' ? 'Generating proof…' : 'Join Allowlist'}
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {allowlist.phase === 'done' && (
            <motion.p
              key="allowlist-done"
              className="circuit-call__allowlist-status circuit-call__allowlist-status--good"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ✓ Joined the allowlist in block {allowlist.result.blockHeight}
            </motion.p>
          )}
          {allowlist.phase === 'error' && (
            <motion.p
              key="allowlist-error"
              className="circuit-call__allowlist-status circuit-call__error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {allowlist.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
