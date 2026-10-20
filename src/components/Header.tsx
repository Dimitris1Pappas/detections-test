import { useEffect, useState } from "react";
import type { Detection } from "../types";

type Props = {
  detections: Detection[];
  lastUpdated: Date | null;
};

export function Header({ detections, lastUpdated }: Props) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    setSecondsAgo(0);
    setInterval(() => setSecondsAgo((s) => s + 1), 1000);
  }, [lastUpdated]);

  const unacknowledged = detections.filter((d) => !d.acknowledged).length;
  const curtailments = detections.filter((d) => d.curtailed).length;

  return (
    <header className="header">
      <div>
        <h1 className="header__title">Detections</h1>
        <p className="header__site">Wind farm Agios Nikolaos, 8 turbines</p>
      </div>
      <dl className="header__stats">
        <div className="stat stat--attention">
          <dt>Awaiting review</dt>
          <dd data-testid="unacknowledged-count">{unacknowledged}</dd>
        </div>
        <div className="stat">
          <dt>Curtailments</dt>
          <dd>{curtailments}</dd>
        </div>
        <div className="stat stat--quiet">
          <dt>Updated</dt>
          <dd>{lastUpdated ? `${secondsAgo}s ago` : "–"}</dd>
        </div>
      </dl>
    </header>
  );
}
