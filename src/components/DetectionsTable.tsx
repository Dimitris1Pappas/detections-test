import type { Detection } from "../types";
import { DetectionRow } from "./DetectionRow";

export type SortKey = "time" | "confidence";

type Props = {
  detections: Detection[];
  loading: boolean;
  onSort: (key: SortKey) => void;
  onAcknowledge: (id: string) => void;
  pendingIds: Set<string>;
};

export function DetectionsTable({
  detections,
  loading,
  onSort,
  onAcknowledge,
  pendingIds,
}: Props) 

{

  return (
    <div className="table-wrap" aria-busy={loading}>
      <table className="table">
        <thead>
          <tr>
            <th className="col--toggle" aria-label="Details" />
            <th>
              <button type="button" className="sort" onClick={() => onSort("time")}>
                Time
              </button>
            </th>
            <th>Species</th>
            <th>Turbine</th>
            <th>
              <button type="button" className="sort" onClick={() => onSort("confidence")}>
                Confidence
              </button>
            </th>
            <th>Action</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {detections.map((detection) => (
  <DetectionRow
    key={detection.id}
    detection={detection}
    onAcknowledge={onAcknowledge}
    isPending={pendingIds.has(detection.id)}
  />
))}
        </tbody>
      </table>
      {loading && <div className="loading">Loading detections…</div>}
    </div>
  );
}
