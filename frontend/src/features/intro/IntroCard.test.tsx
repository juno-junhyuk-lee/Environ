import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { IntroCard } from "./IntroCard.tsx";

it("explains the game when it starts", () => {
  render(<IntroCard />);
  const card = screen.getByRole("dialog", { name: "Welcome to Environ!" });

  for (const heading of [
    "Build your island",
    "Press play",
    "Forests",
    "Lakes",
    "Towns",
    "Watch the colours",
    "Climate",
    "Check the numbers",
  ]) {
    expect(
      screen.getByRole("heading", { name: heading, level: 3 }),
    ).toBeInTheDocument();
  }
  expect(card).toHaveTextContent("Each year takes ten seconds");
});

it("closes for good with “Let's build!”", () => {
  render(<IntroCard />);
  fireEvent.click(screen.getByRole("button", { name: "Let's build!" }));

  expect(screen.queryByRole("dialog")).toBeNull();
});
