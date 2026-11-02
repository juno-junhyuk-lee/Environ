# Environ Frontend

React + TypeScript web app for Environ. See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for setup.

## Default world

Each session starts at year 0 with 19 tiles: forests, fresh water bodies, and human settlements. Forest health and water quality start at 100; settlement population starts at 50. Reset world restores this layout, year, and conditions.

## Verification

Run from `frontend/` with Node.js 24:

```bash
npm test
npm run check
npm run build
```

Tests use Node's built-in test runner and cover board positions, initial elements and conditions, and independent world instances for resets.

For a visual check, run `npm run dev`. Confirm that the board has 19 tiles with green F, blue W, and tan S labels, the year is 0, and Reset world preserves the default layout on repeated clicks. Tile editing and simulation are not implemented yet.
