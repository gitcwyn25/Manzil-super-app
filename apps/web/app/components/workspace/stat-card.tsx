import type { ReactNode } from "react";
import { IconTile } from "../vm/icon-tile";
import type { IconName } from "../vm/icons";

/**
 * Workspace KPI card (dashboard overview, analytics): 40px accent IconTile,
 * uppercase caption, bold value with an optional muted unit suffix
 * ("/ 5.0"). Deliberately NO trend pill: CrmStats returns no prior-period
 * deltas, and fabricating "+12%" is banned (D7) — TrendPill ships only if
 * the /stats endpoint ever grows a comparison window.
 */
export function StatCard({
  icon,
  accent = "primary",
  caption,
  value,
  suffix
}: {
  icon: IconName;
  accent?: "primary" | "secondary" | "tertiary";
  caption: string;
  value: ReactNode;
  suffix?: string;
}) {
  return (
    <article className="card ws-stat vm-hover-group">
      <div className="card-body ws-stat__body">
        <IconTile accent={accent} icon={icon} size="sm" />
        <div className="ws-stat__text">
          <span className="ws-stat__caption">{caption}</span>
          <strong className="ws-num ws-stat__value">
            {value}
            {suffix ? <span className="ws-stat__suffix">{suffix}</span> : null}
          </strong>
        </div>
      </div>
    </article>
  );
}
