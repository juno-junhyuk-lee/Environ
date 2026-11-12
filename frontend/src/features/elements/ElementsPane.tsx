import { type PointerEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ELEMENTS, type ElementName } from "../../world/index.ts";
import { TilePreview } from "../board/TilePreview.tsx";
import { ELEMENT_CARDS, PANE_ORDER } from "./elementCards.ts";
import { usePickUp } from "./usePickUp.ts";
import "./elements.css";

/** Wait before the first card opens, so passing the mouse over doesn't flash one. */
const CARD_OPEN_DELAY_MS = 350;

/** Tight framing so the model fills its icon. */
const ICON_FOV = 30;

const FIRST_ELEMENT: ElementName = PANE_ORDER[0] ?? "forest";

interface ElementSlotProps {
  element: ElementName;
  lifted: boolean;
  cardOpen: boolean;
  /** Its piece is out (held or on its way back): the slot shows empty. */
  empty: boolean;
  /** A new piece is appearing after the last one was placed. */
  refilling: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onRefilled: () => void;
}

function slotClassName(cardOpen: boolean, empty: boolean, refilling: boolean) {
  return [
    "element-slot",
    cardOpen && "is-open",
    empty && "is-empty",
    refilling && "is-refilling",
  ]
    .filter(Boolean)
    .join(" ");
}

function ElementSlot({
  element,
  lifted,
  cardOpen,
  empty,
  refilling,
  onHover,
  onUnhover,
  onFocus,
  onBlur,
  onPointerDown,
  onRefilled,
}: ElementSlotProps) {
  const { label } = ELEMENTS[element];
  const card = ELEMENT_CARDS[element];
  const cardId = `element-card-${element}`;

  return (
    <li
      className={slotClassName(cardOpen, empty, refilling)}
      data-element={element}
    >
      <button
        type="button"
        className="element-icon"
        aria-label={label}
        aria-describedby={cardId}
        onMouseEnter={onHover}
        onMouseLeave={onUnhover}
        onFocus={onFocus}
        onBlur={onBlur}
        onPointerDown={onPointerDown}
        onAnimationEnd={onRefilled}
      >
        <TilePreview element={element} lifted={lifted} fov={ICON_FOV} />
      </button>

      <div id={cardId} role="tooltip" className="element-card">
        <strong className="element-card-name">{label}</strong>
        <ul className="element-card-moves">
          {card.moves.map((move) => (
            <li key={move.name} className="element-card-move">
              <strong>{move.name}</strong>
              <span>{move.text}</span>
            </li>
          ))}
        </ul>
        <p className="element-card-weakness">
          <span className="element-card-label">Weakness:</span> {card.weakness}
        </p>
        <p className="element-card-flavor">{card.flavor}</p>
      </div>
    </li>
  );
}

/**
 * Icon-only palette. Hovering lifts the tile at once; its card opens like a
 * native tooltip: after a short wait the first time, then instantly while
 * moving between icons. Pick a piece up and put it down on a board tile to
 * place it; its slot stays empty while it's held.
 */
export function ElementsPane() {
  const [hovered, setHovered] = useState<ElementName | null>(null);
  const [openCard, setOpenCard] = useState<ElementName | null>(null);
  const [refilling, setRefilling] = useState<ElementName | null>(null);
  const openTimer = useRef<number | undefined>(undefined);

  function cancelOpen() {
    window.clearTimeout(openTimer.current);
  }

  function openCardFor(element: ElementName, immediately: boolean) {
    cancelOpen();
    if (immediately) {
      setOpenCard(element);
    } else {
      openTimer.current = window.setTimeout(() => {
        setOpenCard(element);
      }, CARD_OPEN_DELAY_MS);
    }
  }

  function closeCard() {
    cancelOpen();
    setOpenCard(null);
  }

  useEffect(() => cancelOpen, []);

  const { held, pieceElement, pieceRef, onPointerDown } = usePickUp(
    FIRST_ELEMENT,
    {
      onPickUp: () => {
        closeCard();
        setRefilling(null);
      },
      onSettled: (element, placed) => {
        setHovered(null);
        if (placed) setRefilling(element);
      },
    },
  );

  // Escape dismisses an open card wherever focus is, as with a native tooltip.
  // Listening on the document (not the pane) also covers cards opened by hover.
  useEffect(() => {
    if (openCard === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      window.clearTimeout(openTimer.current);
      setOpenCard(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openCard]);

  // Leaving one icon for the next keeps the card open; leaving the whole
  // column closes it. Mouse-only: keyboard users close it via blur or Escape.
  // A native listener, since the list itself isn't an interactive element.
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const node = list.current;
    if (!node) return;
    function onMouseLeave() {
      window.clearTimeout(openTimer.current);
      setOpenCard(null);
    }
    node.addEventListener("mouseleave", onMouseLeave);
    return () => {
      node.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <aside className="elements-pane" aria-label="Elements">
      <ul ref={list} className="elements-list">
        {PANE_ORDER.map((element) => (
          <ElementSlot
            key={element}
            element={element}
            lifted={hovered === element || held === element}
            cardOpen={held === null && openCard === element}
            empty={held === element}
            refilling={refilling === element}
            onHover={() => {
              setHovered(element);
              if (held === null) openCardFor(element, openCard !== null);
            }}
            onUnhover={() => {
              setHovered(null);
            }}
            onFocus={() => {
              openCardFor(element, true);
            }}
            onBlur={closeCard}
            onPointerDown={(event) => {
              onPointerDown(element, event);
            }}
            onRefilled={() => {
              setRefilling(null);
            }}
          />
        ))}
      </ul>
      {createPortal(
        <div ref={pieceRef} className="held-piece">
          <TilePreview element={pieceElement} lifted fov={ICON_FOV} />
        </div>,
        document.body,
      )}
    </aside>
  );
}
