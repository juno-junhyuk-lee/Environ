import { useState } from "react";
import { Modal } from "../ui/Modal.tsx";
import "./intro.css";

interface Rule {
  title: string;
  text: string;
}

// Keep these true to the yearly rules in `world/rules.ts` and `worldly.ts`.
const INTRO_RULES: readonly Rule[] = [
  {
    title: "Build your island",
    text: "Drag a forest, a lake or a town from the left onto any tile. Hover over a tile to see how it is doing.",
  },
  {
    title: "Press play",
    text: "Each year takes ten seconds. You can keep building while time passes. Pause to reset or load a world.",
  },
  {
    title: "Forests",
    text: "Grow healthier every year, faster beside a lake. Every town next door wears them down.",
  },
  {
    title: "Lakes",
    text: "Refill themselves, faster with forests around them. Every town next door uses some of the water.",
  },
  {
    title: "Towns",
    text: "Grow only with both a forest and a lake next door. The bigger they get, the harder they press on nature.",
  },
  {
    title: "Watch the colours",
    text: "Tiles fade to grey as they get weaker. A town with nothing left turns back into forest, and a forest worn down to nothing becomes a town.",
  },
  {
    title: "Climate",
    text: "More towns and fewer forests mean more carbon, a warmer island and more droughts. Rain helps lakes and forests; droughts make it hard for them to recover.",
  },
  {
    title: "Check the numbers",
    text: "The panel at the top shows how your world is doing. Click it to find out what each number means in real life.",
  },
];

/**
 * How to play, shown each time the game starts (each visitor at a kiosk
 * gets a fresh start). The simulation is paused until it's closed.
 */
export function IntroCard() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <Modal
      title="Welcome to Environ!"
      closeLabel="Let's build!"
      onClose={() => {
        setOpen(false);
      }}
    >
      <p className="intro-lead">
        Build an island of forests, lakes and towns, then watch how people and
        nature shape each other over the years.
      </p>
      <ul className="intro-rules">
        {INTRO_RULES.map((rule) => (
          <li key={rule.title} className="intro-rule">
            <h3>{rule.title}</h3>
            <p>{rule.text}</p>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
