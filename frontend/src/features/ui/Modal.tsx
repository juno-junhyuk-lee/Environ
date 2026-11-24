import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "./modal.css";

interface ModalProps {
  title: string;
  /** Text of the button that closes it. */
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  /**
   * Grow down from the top of the page (from the metrics dashboard) instead
   * of popping up in the middle.
   */
  fromTop?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A comic panel over the page, framed like the speech bubbles. Closes with
 * its button, Escape, or a press on the shade around it. Keeps keyboard
 * focus inside while open and gives it back to where it was after.
 */
export function Modal({
  title,
  closeLabel,
  onClose,
  children,
  fromTop = false,
}: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Read through a ref so the listeners below don't re-subscribe when a
  // parent passes a new callback on each render.
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const returnTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    // The button is at the bottom of a panel that may scroll: focus it
    // without scrolling, so the panel opens at its top.
    closeButton.current?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      // Keep Tab inside the panel.
      const focusable = [
        ...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    // A press on the shade around the panel closes it (Escape and the close
    // button cover the keyboard).
    function onPointerDown(event: PointerEvent) {
      if (
        panel.current &&
        event.target instanceof Node &&
        !panel.current.contains(event.target)
      ) {
        close.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      returnTo?.focus();
    };
  }, []);

  // Rendered at the end of <body>, not where it's used: a transform on any
  // ancestor (like the dashboard's hover lift) would otherwise trap this
  // fixed overlay in that ancestor's layer, behind the board.
  return createPortal(
    <div className={fromTop ? "modal-backdrop is-from-top" : "modal-backdrop"}>
      <div
        ref={panel}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        {children}
        <div className="modal-actions">
          <button
            ref={closeButton}
            type="button"
            className="modal-button"
            onClick={() => {
              close.current();
            }}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
