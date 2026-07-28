/**
 * Loading state that matches the final table exactly — same row height, same
 * column count. A spinner of a different shape guarantees a layout shift when
 * the data lands; a matched skeleton means the page never moves.
 */
export function WsSkeleton({ rows = 8, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table aria-hidden="true" className="ws-table ws-skeleton">
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => (
              <td key={c}>
                <span className="ws-skeleton__bar" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
