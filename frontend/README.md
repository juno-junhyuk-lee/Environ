# Environ Frontend

React + TypeScript web app for Environ. See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for setup.

## Default world

Each session starts at year 0 with 19 tiles: seven forests on the left, five fresh water bodies through the center, and seven human settlements on the right. All conditions start at 50, using the shared element defaults. Reset world restores this layout, year, and conditions.

## Saving and loading

Click **Save world** to download `environ-world.json`. Click **Load world** and select a saved JSON file to restore its tiles, conditions, and year. Loading replaces the current world after validation; invalid or unreadable files show an error and leave the world unchanged. Reset world always restores the original defaults.

The version 1 JSON format contains `format: "environ-world"`, `version: 1`, a nonnegative integer `year`, and 19 `tiles`. Each tile contains its `id`, axial coordinates `q` and `r`, `element`, and `conditionValue` from 0–100. Tile IDs must match their coordinates and cover the 19 unique board positions. Element names are `forest`, `fresh_water_body`, and `human_settlement`.

## Verification

Run from `frontend/` with Node.js 24:

```bash
npm test
npm run check
npm run build
```

Tests use Vitest and React Testing Library and cover board positions, initial elements and conditions, independent world instances, and the reset control.

For a visual check, run `npm run dev`. Confirm that the 3D board has 19 tiles with forests, water, and settlements, and the year is 0. Use the development controls to change a tile, then verify that Reset world restores the default layout on repeated clicks. Simulation controls are not connected yet.

To verify saving and loading, edit a tile, save the world, reset, and load the downloaded file. Confirm the edited tile returns. Set `year` to 37 and a tile's `conditionValue` to 83 in the JSON, then load it and confirm the year updates and saving again preserves both values. Try malformed JSON or a duplicate tile position and confirm an error appears without changing the board. Finally, reset and confirm the default layout and year 0 return.
