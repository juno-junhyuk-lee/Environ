import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import "./playback.css";

// Icons: Friconix fi-hnluxl-play and fi-hnluxl-pause (free with a link back,
// see the credit in App.tsx), split into the hexagon frame and the symbol so
// the frame can be turned to match the board's tiles.
const HEX_FRAME =
  "M 300 54C 264 54 231 73 213 104C 213 104 13 450 13 450C -4 481 -4 519 13 550C 13 550 213 896 213 896C 231 927 264 946 300 946C 300 946 700 946 700 946C 736 946 769 927 787 896C 787 896 987 550 987 550C 1004 519 1004 481 987 450C 987 450 787 104 787 104C 769 73 736 54 700 54C 700 54 300 54 300 54ZM 300 103C 300 103 700 103 700 103C 718 103 734 113 743 129C 743 129 943 475 943 475C 952 491 952 509 943 525C 943 525 743 871 743 871C 734 887 718 897 700 897C 700 897 300 897 300 897C 282 897 266 887 257 871C 257 871 57 525 57 525C 48 509 48 491 57 475C 57 475 257 129 257 129C 266 113 282 103 300 103Z";
/** The frame's inside, filled so the icon reads against the sky. */
const HEX_INSIDE = "300,103 700,103 943,500 700,897 300,897 57,500";

const PLAY_SYMBOL =
  "M 395 311C 390 311 385 312 380 315 369 321 360 334 360 350 360 450 360 550 360 650 360 666 369 678 380 685 392 691 405 692 420 680 487 630 554 580 620 530 635 519 640 509 640 500 640 492 636 482 620 470 554 420 487 370 420 320 412 314 405 311 398 311 397 311 396 311 395 311ZM 310 350C 310 316 328 287 355 271 366 266 377 262 389 262 410 260 431 266 450 280 517 330 584 380 650 430 674 448 690 474 690 500 690 527 674 552 650 570 584 620 517 670 450 720 421 742 384 743 356 729 329 714 310 684 310 650 310 550 310 450 310 350Z";
const PAUSE_SYMBOL =
  "M 412 250C 440 250 462 273 462 300C 462 433 462 567 462 700C 462 727 440 750 412 750C 387 750 362 750 337 750C 310 750 287 727 287 700C 287 567 287 433 287 300C 287 273 310 250 337 250C 362 250 387 250 412 250ZM 662 250C 690 250 712 273 712 300C 712 433 712 567 712 700C 712 727 690 750 662 750C 637 750 612 750 587 750C 560 750 537 727 537 700C 537 567 537 433 537 300C 537 273 560 250 587 250C 612 250 637 250 662 250ZM 337 700C 362 700 387 700 412 700C 412 567 412 433 412 300C 387 300 362 300 337 300C 337 433 337 567 337 700ZM 587 700C 612 700 637 700 662 700C 662 567 662 433 662 300C 637 300 612 300 587 300C 587 433 587 567 587 700Z";

/** A hexagon with a symbol inside, pointy-top like the board's tiles. */
function HexIcon({ symbol }: { symbol: string }) {
  return (
    <svg className="playback-icon" viewBox="0 0 1000 1000" aria-hidden="true">
      {/* Friconix draws it flat-top; the board's tiles are pointy-top. */}
      <g transform="rotate(90 500 500)">
        <polygon className="playback-icon-inside" points={HEX_INSIDE} />
        <path d={HEX_FRAME} />
      </g>
      <path d={symbol} />
    </svg>
  );
}

/**
 * Large play and pause buttons on the right of the board. The one matching
 * the current state is greyed out.
 *
 * UI only for now: nothing runs yet. This state is what will start and pause
 * the time simulation (world/time.ts) once it's wired up.
 */
export function PlaybackControls() {
  const [playing, setPlaying] = useState(false);
  const playButton = useRef<HTMLButtonElement>(null);
  const pauseButton = useRef<HTMLButtonElement>(null);

  // The pressed button becomes disabled, which would drop keyboard focus, so
  // move focus to the other one. It must be enabled first: hence flushSync.
  function play() {
    flushSync(() => {
      setPlaying(true);
    });
    pauseButton.current?.focus();
  }

  function pause() {
    flushSync(() => {
      setPlaying(false);
    });
    playButton.current?.focus();
  }

  return (
    <aside className="playback" aria-label="Playback">
      <button
        ref={playButton}
        type="button"
        className="playback-button"
        aria-label="Play"
        disabled={playing}
        onClick={play}
      >
        <HexIcon symbol={PLAY_SYMBOL} />
      </button>
      <button
        ref={pauseButton}
        type="button"
        className="playback-button"
        aria-label="Pause"
        disabled={!playing}
        onClick={pause}
      >
        <HexIcon symbol={PAUSE_SYMBOL} />
      </button>
    </aside>
  );
}
