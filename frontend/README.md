# Environ Frontend

React + TypeScript web app for Environ. See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for setup.

## Default world

Each session starts at year 0 with 19 tiles: seven forests on the left, five fresh water bodies through the center, and seven human settlements on the right. All conditions start at 50, using the shared element defaults. Reset world restores this layout, year, and conditions.

## Verification

Run from `frontend/` with Node.js 24:

```bash
npm test
npm run check
npm run build
```

Tests use Vitest and React Testing Library and cover board positions, initial elements and conditions, independent world instances, and the reset control.

For a visual check, run `npm run dev`. Confirm that the 3D board has 19 tiles with forests, water, and settlements, and the year is 0. Use the development controls to change a tile, then verify that Reset world restores the default layout on repeated clicks. Simulation controls are not connected yet.
