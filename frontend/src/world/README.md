# World simulation (years passing)

Each simulation step is one year. Every year, every tile updates from its own
condition and its six axial neighbours (radius 1 only). Updates are **two-phase**:
the next condition for every tile is computed from the board at the start of the
year, then a new board is built. Order of processing does not matter, and the
input board is never mutated.

Condition values stay in **0–100** with **one decimal place**, so small yearly
changes (for example +0.9) accumulate instead of rounding away to zero.

Wall-clock pacing is **1 year = 10 seconds** (`DEFAULT_TIME_STEP_INTERVAL_MS =
10000`). Changing that interval only changes how often a step runs; it does not
change any simulation math.

## Why v1 was replaced

The first rules used flat point rates (forest +3, −8 per neighbouring settlement,
and similar hard numbers for water and settlements). That ignored neighbour
_quality_, created a hard “healthy at 50” cliff for settlements, and could not
express soft growth that slows near capacity. The v2 model below is logistic:
growth depends on current condition, resource quality, and settlement load, with
explicit caps so one bad year cannot erase a tile instantly.

## Notation

| Symbol | Meaning                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| **C**  | This tile’s own condition (0–100).                                                                                |
| **F**  | Mean condition of adjacent forest tiles (0 if none).                                                              |
| **W**  | Mean condition of adjacent water tiles (0 if none). For water’s own formula, **W_tile** is this tile’s condition. |
| **S**  | Sum of adjacent settlement conditions ÷ 100. One settlement at 50 → S = 0.5; two at 70 → S = 1.4.                 |
| **Δ**  | Change in points for one year, then clamp to 0–100.                                                               |

Neighbours are the six axial cells from `getNeighbors` only — no second ring.

All numeric coefficients live in the exported `SIMULATION_RATES` object so they
can be tuned without rewriting formulas.

## Forest

- Growth rises with current health, slows as the forest nears 100, and is helped
  by nearby water quality.
- Pressure rises with forest health and settlement load **S**.
- Yearly change is capped to **[−8, +6]**.

```
growth   = 0.10 × C × (1 − C/100) × (0.8 + 0.4 × W/100)
pressure = 0.15 × C × S
Δ        = growth − pressure, capped to [−8, +6]
```

**Worked example:** C = 50, W = 50, S = 0.5 → growth = 2.5, pressure = 3.75, Δ = −1.25.

**Isolated forest** (no settlements, W = 0) at C = 50 → Δ = +2.0.

## Fresh water

- Recharge is stronger when the water is dirty (far from 100) and when nearby
  forests are healthy.
- Use rises with current quality and settlement load.
- Cap **[−8, +6]**.

```
recharge = 0.10 × (100 − W_tile) × (0.6 + 0.6 × F/100)
use      = 0.12 × W_tile × S
Δ        = recharge − use, capped to [−8, +6]
```

**Worked example:** W_tile = 50, F = 50, S = 0.5 → recharge = 4.5, use = 3.0, Δ = +1.5.

## Human settlement

Settlements need **both** forest and water. Resource quality is the geometric
mean of the two neighbour averages:

```
R = √((F/100) × (W/100))
```

If either F or W is 0, R = 0. If both are 70, R = 0.7 (not 0.49).

Local carrying capacity:

```
K = 10 + 90 × R
```

K ranges from **10 to 100**. The floor is 10 (not 30) so a settlement with no
resources can shrink far enough to convert; a floor of 30 would leave stranded
settlements forever and the Allee rule below would never finish the job.

```
Δ = 0.08 × C × (1 − C/K)
if C < 18: Δ −= 1.5   (soft Allee / minimum-viable-community penalty)
then cap Δ to [−5, +4]
```

**Worked example:** C = 50, F = 70, W = 70 → R = 0.7, K = 73, Δ ≈ +1.26.

**Worked example:** C = 50, water only (no forest) → R = 0, K = 10, raw Δ = −16, capped to −5.

## Caps and the Allee rule

Caps stop single-year swings from wiping a tile or exploding growth. The Allee
penalty (−1.5 when C &lt; 18) models a community that is too small to sustain
itself, so collapse finishes instead of hovering forever just above zero.

## Conversions

After clamping to 0–100:

- **Forest at exactly 0** → Human Settlement at **30**
- **Settlement at exactly 0** → Forest at **30**
- **Water at 0** never converts; it stays water

Conversion behaviour itself maps to SSDS Req **2.10 / 2.11**. The restart value
**30** is a **design choice**, not in the SSDS (the SSDS gives no restart
number; element `defaultCondition` for newly placed tiles remains **50**).
Conversion restart is applied only in `convertTile`.

A tile that just converted at 30 must not flip again in the next year solely
because of that restart. The Δ caps keep that from happening in normal cases;
tests cover the one-year-after-conversion case.

## Default striped world under this logic

The current default layout is forests west (q &lt; 0), a north–south river (q = 0),
and settlements east (q &gt; 0). Eastern settlements have water neighbours but no
forest, so R = 0 and K = 10: they decline (capped at −5 per year) and begin
converting to forest in roughly **8–10 years** with no intervention. Western
forests grow. River water stays fairly stable between forest recharge and
settlement use.

## SSDS mapping

| Requirement   | How this module meets it                                                            |
| ------------- | ----------------------------------------------------------------------------------- |
| **2.5–2.6**   | Two-phase yearly update via `applyToBoard`                                          |
| **2.10–2.12** | Forest↔settlement conversion at 0; water never converts                             |
| **2.15**      | Rates live in adjustable `SIMULATION_RATES`                                         |
| Timing note   | SSDS mentioned a provisional 2-second step; this build uses **10 seconds** per year |

## Worldly metrics

Four climate numbers sit beside the per-tile logistic rules. Three are
**global state** carried year to year; one is **derived each year per tile**.

| Metric           | Kind    | Default | Saved? |
| ---------------- | ------- | ------- | ------ |
| Air quality      | Derived | —       | No     |
| Temperature (°C) | State   | 15      | Yes    |
| Weather          | State   | sunny   | Yes    |
| Carbon           | State   | 50      | Yes    |

Air quality is recomputed every year from the current board. Temperature,
carbon, and weather are stored on the time simulation and in saves (additive
`worldly` field on format `environ-world` version **1** — no version bump).
Old saves without `worldly` load as `{ temperatureC: 15, carbon: 50, weather: "sunny" }`.

### Air quality (per tile, 0–100)

```
AQI = 100
    − 0.5 × meanAdjacentSettlement
    − 0.3 × ownSettlement
    + 0.3 × meanAdjacentForest
```

Means are over neighbouring tiles of that element (0 if none). `ownSettlement`
is this tile’s condition when it is a settlement, otherwise 0. Result is
clamped to 0–100 at one decimal (`clampCondition`). A board with no
settlements yields AQI 100 on non-settlement tiles.

Air quality scales **growth only** (not pressure / use / Allee):

```
forest growth      × (0.7 + 0.3 × AQI/100)
settlement growth  × (0.8 + 0.2 × AQI/100)
water              (no air factor)
```

### Carbon (global, 0–100)

```
carbon' = carbon + 0.001 × (Σ settlement conditions − Σ forest conditions)
```

Clamped to 0–100 at one decimal. Equal settlement and forest totals leave
carbon unchanged; a board with neither leaves it unchanged as well.

### Temperature (°C)

```
target     = 15 + (carbon − 50) × 0.2
temperature' = temperature + 0.1 × (target − temperature)
```

Rounded to one decimal. At carbon 50 the target is 15 °C, so temperature holds
still there.

### Weather

Kinds: `sunny` | `rainy` | `cloudy` | `drought` | `storm`.

Base weights (sum 100): sunny 35, rainy 25, cloudy 20, drought 10, storm 10.
Each year a seeded RNG draws `rng() × 100` against the cumulative weights in
that order. Heat shifts weight from sunny into drought:

```
drought += 2 × max(0, temperatureC − 20)   (taken from sunny; sunny floors at 0)
```

Total weight stays 100. Missing RNG falls back to `createSeededRng(Date.now())`.

### Climate modifiers on tile rules

Temperature factors (then multiplied by weather factors):

| Element    | Rule                                                         |
| ---------- | ------------------------------------------------------------ |
| Forest     | &lt; 10 °C → 0.85; ≤ 20 → 1.0; else max(0.5, 1 − 0.1×(T−20)) |
| Water      | ≤ 15 °C → 1.0; else max(0.6, 1 − 0.04×(T−15))                |
| Settlement | ≤ 22 °C → 1.0; else max(0.8, 1 − 0.07×(T−22))                |

Weather factors `{ forest, water, settlement }`:

| Weather | Factors       |
| ------- | ------------- |
| sunny   | 1, 1, 1       |
| rainy   | 1.2, 1.5, 1   |
| cloudy  | 0.9, 1, 1     |
| drought | 0.5, 0.3, 0.9 |
| storm   | 0.7, 1.3, 0.9 |

`ruleModifiersFor(T, weather)` multiplies the two tables per element. Only
**growth** (forest / settlement) or **recharge** (water) is scaled; pressure,
use, Allee, Δ caps, and conversions are unchanged. All tunable numbers live in
`WORLDLY_RATES`. At sunny / 15 °C every climate multiplier is 1.0
(`NEUTRAL_CONTEXT`).

### Yearly order (`advanceStep`)

Everything below reads the board at the **start** of the year:

1. `weather = drawWeather(rng, temperatureC)`
2. `carbon = nextCarbon(carbon, board)`
3. `temperatureC = nextTemperature(temperatureC, carbon)`
4. `ctx = { temperatureC, weather }`
5. `board = applyToBoard(board, ctx)`
6. `year += 1`
7. `onStep(board, year, worldly)`

`applyToBoard(board)` with **no** context keeps plain v2 logistic rules (so
existing unit tests stay valid). The time loop always passes `ctx`.

### Edge cases

- NaN temperature or carbon falls back to the defaults (15 / 50).
- Very hot weather: sunny weight floors at 0; drought absorbs only what sunny
  can give, so totals stay 100.
- AQI always clamps 0–100.
- Conversions at condition 0 are unchanged; Δ caps still bound one-year swings.
- `World` / `createDefaultWorld` are unchanged — climate lives on the time
  simulation, not on the world value.

## Files

- `rules.ts` — rates, evaluate\*, convertTile, applyToBoard
- `worldly.ts` — air quality, carbon, temperature, weather, modifiers
- `tile.ts` — condition helpers and 1-decimal clamp
- `time.ts` — year clock / pause / resume / worldly state (interval injectable for tests)
- `save.ts` — serialize / validate; optional `worldly` on version 1 saves
