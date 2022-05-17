/**
 * @template StateKey - Any value used to index a Map of Q
 * @template Transition - Any value used to index a Map of Transitions and an undefined value is an epsilon acceptor. Non-epsilon transitions are attempted first
 * @param {Map<StateKey & any, ((transition?: any & StateKey) => StateKey)>} delta - Where q0 is first q in Q, and final states are q in Q with empty transitions
 * @param {StateKey} q0
 * @param {StateKey[]} F
 * @returns {Iterable<StateKey>} - Iterable machine where `machine.next(transition)` steps machine and returns next q.
 */
export function nfaFactory(delta, q0, F) {
  let q = q0;
  let done = F.includes(q0);
  const machine = {
    /** @param {Transition} [transition] */
    next(transition) {
      if (!done) {
        q = delta.get(q)?.(transition) ?? q0; // no match! Reset
        done = F.includes(q);
      }
      return { done, value: q };
    },
    get q() {
      return q;
    },
    [Symbol.iterator]() {
      return this;
    },
  };
  return machine;
}
