import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultWorld } from "../src/features/world/world.ts";

test("default world fills all 19 unique board positions at year zero", () => {
  const world = createDefaultWorld();
  assert.equal(world.year, 0);
  assert.equal(world.tiles.length, 19);
  assert.equal(new Set(world.tiles.map((tile) => tile.id)).size, 19);
  assert.deepEqual(
    [-2, -1, 0, 1, 2].map(
      (r) => world.tiles.filter((tile) => tile.r === r).length,
    ),
    [3, 4, 5, 4, 3],
  );
  for (const tile of world.tiles) {
    assert.equal(tile.id, `${tile.q},${tile.r}`);
    assert.ok(
      Math.max(Math.abs(tile.q), Math.abs(tile.r), Math.abs(tile.q + tile.r)) <=
        2,
    );
  }
});

test("default world contains all elements with valid initial conditions", () => {
  const { tiles } = createDefaultWorld();
  assert.deepEqual(
    new Set(tiles.map((tile) => tile.element)),
    new Set(["forest", "water", "settlement"]),
  );
  for (const tile of tiles) {
    assert.equal(tile.condition, tile.element === "settlement" ? 50 : 100);
  }
});

test("reset restores defaults after changes without sharing mutable tiles", () => {
  const original = createDefaultWorld();
  const changed = createDefaultWorld();
  changed.year = 42;
  changed.tiles[0].element = "settlement";
  changed.tiles[0].condition = 3;
  changed.tiles.pop();

  // Reset uses the same factory as startup.
  const reset = createDefaultWorld();
  assert.deepEqual(reset, original);
  assert.notEqual(reset.tiles, original.tiles);
  for (let index = 0; index < reset.tiles.length; index += 1) {
    assert.notEqual(reset.tiles[index], original.tiles[index]);
  }
  assert.deepEqual(createDefaultWorld(), reset);
});
