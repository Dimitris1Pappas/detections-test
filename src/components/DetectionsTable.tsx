import type { Detection } from "../types";
import { DetectionRow } from "./DetectionRow";

export type SortKey = "time" | "confidence";

type Props = {
  detections: Detection[];
  loading: boolean;
  onSort: (key: SortKey) => void;
};

export function DetectionsTable({ detections, loading, onSort }: Props) {
  if (!loading && detections.length === 0) {
    return <p className="empty">No detections match your search. Clear the search to see all detections.</p>;
  }

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
          {detections.map((detection, index) => (
            <DetectionRow key={index} detection={detection} />
          ))}
        </tbody>
      </table>
      {loading && <div className="loading">Loading detections…</div>}
    </div>
  );
}
