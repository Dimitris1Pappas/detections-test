import { useState, type CSSProperties } from "react";
import type { Detection } from "../types";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Athens",
});

type Props = {
  detection: Detection;
  onAcknowledge: (id: string) => void;
  isPending: boolean;
};

export function DetectionRow({
  detection,
  onAcknowledge,
  isPending,
}: Props) {

const [expanded, setExpanded] = useState(false);
const percent = Math.round(detection.confidence * 100);
  return (
    <>
      <tr className={expanded ? "row row--open" : "row"}>
        <td>
          <button
            type="button"
            className="row__toggle"
            aria-expanded={expanded}
            aria-label={`Details for ${detection.species} at ${detection.turbineId}`}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "−" : "+"}
          </button>
        </td>
        <td className="cell--time">{timeFormat.format(new Date(detection.detectedAt))}</td>
        <td className="cell--species">{detection.species}</td>
        <td>{detection.turbineId}</td>
        <td>
          <span className="confidence" style={{ "--confidence": `${percent}%` } as CSSProperties}>
            {percent}%
          </span>
        </td>
        <td>{detection.curtailed ? <span className="tag tag--curtailed">Curtailed</span> : null}</td>
        <td>
  {detection.acknowledged ? (
    <span className="tag tag--done">
      Reviewed
    </span>
  ) : (
    <div className="review-actions">
      <span className="tag tag--pending">
        Awaiting review
      </span>

      <button
        type="button"
        className="acknowledge-btn"
        onClick={() => onAcknowledge(detection.id)}
        disabled={isPending}
      >
        Acknowledge
      </button>
    </div>
  )}
</td>
      </tr>
      {expanded && (
        <tr className="details">
          <td />
          <td colSpan={6}>
            <dl className="details__grid">
              <div>
                <dt>Detection</dt>
                <dd>{detection.id}</dd>
              </div>
              <div>
                <dt>Camera</dt>
                <dd>{detection.cameraId}</dd>
              </div>
              <div>
                <dt>Distance from rotor</dt>
                <dd>{detection.distanceMeters} m</dd>
              </div>
              <div>
                <dt>Detected at (UTC)</dt>
                <dd>{detection.detectedAt.replace("T", " ").slice(0, 19)}</dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
