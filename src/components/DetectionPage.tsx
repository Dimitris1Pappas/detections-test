import { useEffect, useState } from "react";
import { fetchDetectionReport } from "../api/detections";
import type { DetectionReport } from "../types";

type Props = {
  detectionId: string;
  onBack: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "Europe/Athens",
});

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded";
}

function getShutdownStatus(report: DetectionReport) {
  const { shutdown, track } = report;

  if (!shutdown.required) {
    return {
      label: "Shutdown not required",
      detail: "No shutdown was requested by the site rule.",
      attention: false,
    };
  }

  if (!shutdown.rotorStoppedAt) {
    return {
      label: "Shutdown not confirmed",
      detail: "No rotor standstill was recorded. Investigate the event.",
      attention: true,
    };
  }

  const stoppedAt = Date.parse(shutdown.rotorStoppedAt);
  const closestAt = Date.parse(track.closestApproachAt);

  if (stoppedAt <= closestAt) {
    return {
      label: "Stopped before closest approach",
      detail: "Rotor standstill was recorded before the bird's closest approach.",
      attention: false,
    };
  }

  return {
    label: "Stopped after closest approach",
    detail: "Rotor standstill was recorded after the bird's closest approach.",
    attention: true,
  };
}

export function DetectionPage({
  detectionId,
  onBack,
}: Props) {
  const [report, setReport] = useState<DetectionReport | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setReport(null);
    setLoading(true);
    setError(null);

    fetchDetectionReport(detectionId, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setReport(data);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Could not load detection report."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [detectionId]);

  if (loading) {
    return (
      <main data-testid="detection-page" className="main">
        <button className="button" onClick={onBack}>
          ← Back to detections
        </button>
        <p role="status">Loading detection report…</p>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main data-testid="detection-page" className="main">
        <button className="button" onClick={onBack}>
          ← Back to detections
        </button>
        <p role="alert">
          {error ?? "Detection report unavailable."}
        </p>
      </main>
    );
  }

  const {
    detection,
    identification,
    track,
    shutdown,
    camera,
    weather,
    history,
    review,
  } = report;

  const shutdownStatus = getShutdownStatus(report);
  const needsReview = !detection.acknowledged;
  const needsAction = shutdownStatus.attention || needsReview;

  return (
    <main data-testid="detection-page" className="main detection-page">
      <button
        type="button"
        className="button"
        onClick={onBack}
      >
        ← Back to detections
      </button>

      <header className="detection-page__header">
        <div>
          <p className="detection-page__eyebrow">
            Detection report · {detection.id}
          </p>
          <h1>{detection.species}</h1>
          <p>
            {detection.turbineId} · {formatDate(detection.detectedAt)}
          </p>
        </div>
      </header>

      <section className="decision-grid" aria-label="Operator decisions">
        <article
          className={
            shutdownStatus.attention
              ? "decision-card decision-card--warning"
              : "decision-card decision-card--ok"
          }
          role={shutdownStatus.attention ? "alert" : undefined}
        >
          <h2>Turbine shutdown</h2>
          <strong>{shutdownStatus.label}</strong>
          <p>{shutdownStatus.detail}</p>
        </article>

        <article
          className={
            needsAction
              ? "decision-card decision-card--warning"
              : "decision-card decision-card--ok"
          }
          role={needsAction ? "alert" : undefined}
        >
          <h2>Operator action</h2>
          <strong>
            {needsAction ? "Action required" : "No action required"}
          </strong>

          {needsReview && (
            <p>This detection is awaiting acknowledgement.</p>
          )}

          {shutdownStatus.attention && (
            <p>Investigate the shutdown sequence.</p>
          )}

          {!needsAction && (
            <p>No outstanding review or shutdown issue identified.</p>
          )}
        </article>
      </section>

      <section className="report-card">
        <h2>Detection overview</h2>

        <dl className="report-grid">
          <div>
            <dt>Species</dt>
            <dd>{detection.species}</dd>
          </div>
          <div>
            <dt>Confidence</dt>
            <dd>
              {Math.round(detection.confidence * 100)}%
            </dd>
          </div>
          <div>
            <dt>Turbine</dt>
            <dd>{detection.turbineId}</dd>
          </div>
          <div>
            <dt>Camera</dt>
            <dd>{detection.cameraId}</dd>
          </div>
          <div>
            <dt>Closest approach</dt>
            <dd>{track.closestApproachMeters} m</dd>
          </div>
          <div>
            <dt>At rotor height</dt>
            <dd>{track.atRotorHeight ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>IUCN category</dt>
            <dd>{identification.iucnStatus}</dd>
          </div>
          <div>
            <dt>Permit species</dt>
            <dd>{identification.permitSpecies ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Review status</dt>
            <dd>
              {detection.acknowledged
                ? "Reviewed"
                : "Awaiting review"}
            </dd>
          </div>
        </dl>
      </section>

      <details className="report-card report-details">
        <summary>Technical details and event history</summary>

        <h3>Shutdown sequence</h3>
        <dl className="report-grid">
          <div>
            <dt>Shutdown required</dt>
            <dd>{shutdown.required ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Command sent</dt>
            <dd>{formatDate(shutdown.commandSentAt)}</dd>
          </div>
          <div>
            <dt>Command confirmed</dt>
            <dd>{formatDate(shutdown.confirmedAt)}</dd>
          </div>
          <div>
            <dt>Rotor stopped</dt>
            <dd>{formatDate(shutdown.rotorStoppedAt)}</dd>
          </div>
          <div>
            <dt>Closest approach time</dt>
            <dd>{formatDate(track.closestApproachAt)}</dd>
          </div>
          <div>
            <dt>Turbine restarted</dt>
            <dd>{formatDate(shutdown.restartedAt)}</dd>
          </div>
        </dl>

        <h3>Camera and environment</h3>
        <dl className="report-grid">
          <div>
            <dt>Camera status</dt>
            <dd>
              {camera.status}
              {camera.statusDetail
                ? ` — ${camera.statusDetail}`
                : ""}
            </dd>
          </div>
          <div>
            <dt>Weather station</dt>
            <dd>{weather.station}</dd>
          </div>
          <div>
            <dt>Wind speed</dt>
            <dd>
              {weather.windSpeedMps === null
                ? "Unavailable"
                : `${weather.windSpeedMps} m/s`}
            </dd>
          </div>
          <div>
            <dt>Reviewed by</dt>
            <dd>{review.acknowledgedBy ?? "Not reviewed"}</dd>
          </div>
        </dl>

        <h3>Event history</h3>
        <ol className="event-history">
          {history.map((event, index) => (
            <li key={`${event.at}-${index}`}>
              <time dateTime={event.at}>
                {formatDate(event.at)}
              </time>
              <span>
                {event.event} · {event.actor}
              </span>
            </li>
          ))}
        </ol>
      </details>
    </main>
  );
}