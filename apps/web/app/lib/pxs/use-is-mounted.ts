"use client";

import { useSyncExternalStore } from "react";

/** Never changes, so React never needs to re-subscribe or re-read. */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` during SSR and the hydration pass, `true` on the client afterwards.
 *
 * The portal guard. `createPortal` needs `document.body`, which does not exist
 * on the server, so anything portalled must render `null` until the client
 * takes over.
 *
 * The usual spelling of this is `useState(false)` plus `useEffect(() =>
 * setMounted(true), [])`, which works but sets state synchronously inside an
 * effect — an extra render pass on every mount, and exactly what
 * `react-hooks/set-state-in-effect` warns about. `useSyncExternalStore` gives
 * the same result with no state and no second render: React simply reads a
 * different snapshot on the server than on the client, which is precisely what
 * this hook is trying to express.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
