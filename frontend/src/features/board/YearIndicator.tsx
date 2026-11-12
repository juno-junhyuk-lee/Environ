import { useMemo, useState } from "react";
import { useBoard } from "./boardContext.ts";
import { prefersReducedMotion } from "./motion.ts";

/**
 * One digit of the year. When it changes, the old digit rolls up out of its
 * window and the new one rolls in from below, like an odometer.
 */
function RollingDigit({ digit }: { digit: string }) {
  const instant = useMemo(() => prefersReducedMotion(), []);
  // The digit last shown, and the one rolling out (null: not rolling).
  const [shown, setShown] = useState(digit);
  const [rollingOut, setRollingOut] = useState<string | null>(null);

  // Adjust state while rendering when the digit changes (React's pattern for
  // reacting to a new prop without an extra effect pass).
  if (digit !== shown) {
    setShown(digit);
    setRollingOut(instant ? null : shown);
  }

  return (
    <span className="year-digit">
      {rollingOut === null ? (
        <span>{digit}</span>
      ) : (
        <span
          // A new key restarts the roll if the digit changes again mid-roll.
          key={`${rollingOut}-${digit}`}
          className="year-digit-roll"
          onAnimationEnd={() => {
            setRollingOut(null);
          }}
        >
          <span>{rollingOut}</span>
          <span>{digit}</span>
        </span>
      )}
    </span>
  );
}

/**
 * The world's year, as a caption in the empty strip under the island. Its
 * digits roll like an odometer when a year passes.
 *
 * Not a live region: once the simulation runs it ticks every few seconds,
 * and announcing each year would drown out everything else.
 */
export function YearIndicator() {
  const { year } = useBoard();
  const digits = String(year).split("");

  return (
    <p className="year-indicator">
      <span className="visually-hidden">Year {year}</span>
      <span className="year-visual" aria-hidden="true">
        <span className="year-word">Year</span>
        {digits.map((digit, i) => (
          // Keyed from the right, so the ones digit stays the same digit as
          // the year grows (9 -> 10 rolls the ones and adds a tens).
          <RollingDigit key={digits.length - i} digit={digit} />
        ))}
      </span>
    </p>
  );
}
