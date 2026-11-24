import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { Modal } from "./Modal.tsx";

function Harness({ onClose = () => undefined }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      {open && (
        <Modal
          title="Hello"
          closeLabel="Done"
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        >
          <p>Body</p>
          <a href="#more">More</a>
        </Modal>
      )}
    </>
  );
}

function open() {
  const opener = screen.getByRole("button", { name: "Open" });
  // A real click focuses the button; fireEvent.click alone doesn't.
  opener.focus();
  fireEvent.click(opener);
  return screen.getByRole("dialog", { name: "Hello" });
}

it("opens as a labelled dialog with focus on its button", () => {
  render(<Harness />);
  const dialog = open();

  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveTextContent("Body");
  expect(screen.getByRole("button", { name: "Done" })).toHaveFocus();
});

it("closes with its button and gives focus back", () => {
  render(<Harness />);
  open();
  fireEvent.click(screen.getByRole("button", { name: "Done" }));

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
});

it("closes with Escape", () => {
  const onClose = vi.fn();
  render(<Harness onClose={onClose} />);
  open();
  fireEvent.keyDown(document, { key: "Escape" });

  expect(onClose).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("closes on a press outside the panel, but not inside it", () => {
  render(<Harness />);
  const dialog = open();

  fireEvent.pointerDown(screen.getByText("Body"));
  expect(dialog).toBeInTheDocument();

  const shade = dialog.parentElement;
  if (shade === null) throw new Error("expected the shade");
  fireEvent.pointerDown(shade);
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("keeps Tab inside the panel", () => {
  render(<Harness />);
  open();
  const link = screen.getByRole("link", { name: "More" });
  const done = screen.getByRole("button", { name: "Done" });

  fireEvent.keyDown(document, { key: "Tab" });
  expect(link).toHaveFocus();

  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(done).toHaveFocus();
});

it("renders at the end of the page, outside whatever opened it", () => {
  // A transform on an ancestor would otherwise trap the fixed overlay in
  // that ancestor's layer (behind the board).
  const { container } = render(<Harness />);
  const dialog = open();

  expect(container.contains(dialog)).toBe(false);
  expect(dialog.parentElement?.parentElement).toBe(document.body);
});
