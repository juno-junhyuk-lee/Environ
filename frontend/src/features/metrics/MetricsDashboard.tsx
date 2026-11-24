import { useRef, useState } from "react";
import {
  useBoard,
  useBoardActions,
  useSimulation,
} from "../board/boardContext.ts";
import { useLastYear } from "../board/useLastYear.ts";
import { Modal } from "../ui/Modal.tsx";
import { METRIC_MEANINGS } from "./metricMeanings.ts";
import {
  WEATHER_WORDS,
  type WorldMetrics,
  worldMetrics,
} from "./worldMetrics.ts";
import "./metrics.css";

interface Metric {
  key: keyof WorldMetrics;
  label: string;
  /** The value as shown. */
  format: (metrics: WorldMetrics) => string;
  /** Number compared with last year, for the change line. */
  compare?: (metrics: WorldMetrics) => number | null;
}

const whole = (value: number) => Math.round(value).toLocaleString("en");

const METRICS: readonly Metric[] = [
  {
    key: "population",
    label: "Population",
    format: (m) => whole(m.population),
    compare: (m) => m.population,
  },
  {
    key: "forestCover",
    label: "Forest cover",
    format: (m) => `${whole(m.forestCover)}%`,
    compare: (m) => m.forestCover,
  },
  {
    key: "waterQuality",
    label: "Water quality",
    format: (m) =>
      m.waterQuality === null ? "—" : `${whole(m.waterQuality)}%`,
    compare: (m) => m.waterQuality,
  },
  {
    key: "airQuality",
    label: "Air quality",
    format: (m) => whole(m.airQuality),
    compare: (m) => m.airQuality,
  },
  {
    key: "temperatureC",
    label: "Temperature",
    format: (m) => `${m.temperatureC.toFixed(1)}°C`,
    compare: (m) => m.temperatureC,
  },
  {
    key: "carbon",
    label: "Carbon",
    format: (m) => whole(m.carbon),
    compare: (m) => m.carbon,
  },
  {
    key: "weather",
    label: "Weather",
    format: (m) => WEATHER_WORDS[m.weather],
  },
];

/** "+1.2", "−0.4", "no change"; null before a year has passed. */
function changeText(now: number | null, before: number | null): string | null {
  if (now === null || before === null) return null;
  const change = Math.round((now - before) * 10) / 10;
  if (change === 0) return "no change";
  return `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}`;
}

/**
 * Every metric again, larger: how to read its number, what it means in real
 * life, and what moves it in the game. Each line's label sits in a fixed
 * column so the text lines up.
 */
function MetricsExplainer({
  metrics,
  onClose,
}: {
  metrics: WorldMetrics;
  onClose: () => void;
}) {
  return (
    <Modal
      title="What the numbers mean"
      closeLabel="Back to my world"
      onClose={onClose}
      fromTop
    >
      <ul className="metrics-meanings">
        {METRICS.map((metric) => {
          const meaning = METRIC_MEANINGS[metric.key];
          return (
            <li key={metric.key} className="metric-meaning">
              <h3>
                {metric.label}
                <span className="metric-meaning-value">
                  {metric.format(metrics)}
                </span>
              </h3>
              <dl className="metric-meaning-lines">
                <dt>The number</dt>
                <dd>{meaning.reading(metrics)}</dd>
                <dt>In real life</dt>
                <dd>{meaning.realLife}</dd>
                {meaning.whyItMatters !== undefined && (
                  <>
                    <dt>Why it matters</dt>
                    <dd>{meaning.whyItMatters}</dd>
                  </>
                )}
                <dt>In Environ</dt>
                <dd>{meaning.inGame}</dd>
              </dl>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/**
 * How the island is doing, at a glance: population, forest, water, air and
 * climate, each with its change since last year. In the header, drawn like
 * the comic speech bubbles. Not a live region: it changes every year, and
 * announcing that would drown out everything else.
 *
 * Clicking it pauses the simulation and opens it out into an explanation of
 * each number; closing that resumes play if it was running.
 */
export function MetricsDashboard() {
  const world = useBoard();
  const lastYearWorld = useLastYear(world);
  const { isRunning } = useSimulation();
  const { play, pause } = useBoardActions();
  const [explaining, setExplaining] = useState(false);
  const resumeOnClose = useRef(false);
  const now = worldMetrics(world);
  const lastYear = lastYearWorld === null ? null : worldMetrics(lastYearWorld);

  function openExplainer() {
    resumeOnClose.current = isRunning;
    pause();
    setExplaining(true);
  }

  function closeExplainer() {
    setExplaining(false);
    if (resumeOnClose.current) play();
  }

  return (
    <section className="metrics" aria-label="How your world is doing">
      {/* Covers the whole panel, so a click anywhere on it opens the
          explanation; the numbers below stay plain text for screen readers. */}
      <button
        type="button"
        className="metrics-open"
        aria-haspopup="dialog"
        aria-expanded={explaining}
        onClick={openExplainer}
      >
        <span className="visually-hidden">What do these numbers mean?</span>
        <span className="metrics-hint" aria-hidden="true">
          ?
        </span>
      </button>
      {explaining && (
        <MetricsExplainer metrics={now} onClose={closeExplainer} />
      )}
      <dl
        className={
          lastYear === null ? "metrics-list" : "metrics-list has-changes"
        }
      >
        {METRICS.map((metric) => {
          const change =
            metric.compare && lastYear
              ? changeText(metric.compare(now), metric.compare(lastYear))
              : null;
          return (
            <div key={metric.key} className="metric" data-metric={metric.key}>
              <dt className="metric-label">{metric.label}</dt>
              <dd className="metric-value">{metric.format(now)}</dd>
              {change !== null && (
                <dd className="metric-change">
                  <span className="visually-hidden">Since last year: </span>
                  {change}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </section>
  );
}
