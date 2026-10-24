# Contributing to Environ

Welcome! This guide walks you through everything you need to contribute to Environ, from installing tools to getting your pull request merged. It is written assuming you have **not** done this before, so don't worry if some of it is new. Follow it step by step, and ask in the team chat if you get stuck.

> **Golden rule:** if a step in this guide doesn't work for you, that's a bug in the guide. Tell the team so we can fix it for the next person.

---

## Quick steps

A one-screen summary for when you're opening a PR. New to the project? Start with the [full guide](#table-of-contents) below.

**First time only:** install Git, [uv](#23-install-uv-python-tooling), and [Node.js 24](#24-install-nodejs-frontend-tooling), then:

```bash
cd backend && uv sync && cd ..
cd frontend && npm ci && cd ..
```

**Every PR:**

1. **Update `main` and branch off it**
   ```bash
   git checkout main && git pull
   git checkout -b feature/short-description    # or fix/, docs/, refactor/, chore/
   ```
2. **Sync dependencies** (in case they changed): `uv sync` in `backend/`, `npm ci` in `frontend/`
3. **Make your changes** and commit in small steps using [Conventional Commits](#6-commit-messages):
   ```bash
   git add <files>
   git commit -m "feat(backend): add forest health regeneration rule"
   ```
4. **Run the checks** for whatever you touched:
   ```bash
   # backend/
   uv run ruff format && uv run ruff check --fix && uv run mypy
   # frontend/
   npm run format && npm run lint:fix && npm run typecheck
   ```
5. **Push and open a PR** against `main`:
   ```bash
   git push -u origin feature/short-description
   ```
6. **Before requesting review, confirm:**
   - [ ] All checks pass
   - [ ] PR title follows Conventional Commits; description says **what**, **why** (requirement/issue), and **how to test**
   - [ ] Screenshots included for UI changes
   - [ ] `uv.lock` / `package-lock.json` committed if dependencies changed
   - [ ] No secrets, `.env` files, debug prints, or commented-out code
   - [ ] PR is small and focused (one feature or fix)
7. **Get one approval**, address every comment, then **Squash and merge** and delete the branch.

**Never:** commit directly to `main`, `git push --force` on shared branches, `pip install` / `npm install -g` project tools, or edit lockfiles by hand.

---

## Table of contents

0. [Quick steps](#quick-steps)
1. [Project layout](#1-project-layout)
2. [One-time setup](#2-one-time-setup)
3. [Backend development (Python)](#3-backend-development-python)
4. [Frontend development (React)](#4-frontend-development-react)
5. [Git workflow](#5-git-workflow)
6. [Commit messages](#6-commit-messages)
7. [Pull requests and code review](#7-pull-requests-and-code-review)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Project layout

Environ is a **monorepo**: the frontend and backend live in the same Git repository, in separate folders.

```
Environ/
├── .github/          # CI workflows and issue/PR templates
├── backend/          # Python API (simulation, metrics, LLM events)
│   ├── app/          # Application source code
│   ├── tests/        # Automated tests
│   ├── pyproject.toml    # Python project config: dependencies + tool settings
│   ├── uv.lock           # Exact versions of every dependency (auto-generated)
│   └── .python-version   # The Python version everyone must use
├── frontend/         # React + TypeScript web app (built with Vite)
│   ├── src/          # Application source code
│   ├── public/       # Static files served as-is (favicon, etc.)
│   ├── package.json      # Node project config: dependencies + scripts
│   ├── package-lock.json # Exact versions of every dependency (auto-generated)
│   ├── .nvmrc            # The Node.js version everyone must use
│   └── eslint.config.js  # Linter rules
├── docs/             # Design documents and diagrams
├── README.md
└── CONTRIBUTING.md   # You are here
```

**Rule of thumb:** backend commands are run from inside `backend/`, and frontend commands are run from inside `frontend/`.

---

## 2. One-time setup

You only need to do this once per computer.

### 2.1 Install Git

- **Windows:** download from <https://git-scm.com/download/win>. Accept the defaults. This also installs **Git Bash**, a terminal that understands the same commands as macOS/Linux.
- **macOS:** run `xcode-select --install` in Terminal, or install via [Homebrew](https://brew.sh): `brew install git`.
- **Linux:** `sudo apt install git` (Ubuntu/Debian) or your distro's equivalent.

Then tell Git who you are (use the email linked to your GitHub account):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 2.2 Clone the repository

```bash
git clone <repository-url>
cd Environ
```

### 2.3 Install uv (Python tooling)

We use **[uv](https://docs.astral.sh/uv/)** to manage Python. It replaces `pip`, `venv`, and `pyenv` with one fast tool.

**You do not need to install Python yourself.** uv downloads the correct Python version for you automatically.

- **Windows (PowerShell):**
  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
- **macOS / Linux:**
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

**Close and reopen your terminal**, then check it worked:

```bash
uv --version
```

You need **uv 0.10 or newer**. If yours is older, run `uv self update`. (The project enforces this: uv will refuse to run with an older version.)

### 2.4 Install Node.js (frontend tooling)

The frontend needs **Node.js 24** (the current LTS, "Long Term Support", release). Node comes with **npm**, the package manager we use for the frontend.

Node.js is the **only** frontend tool you install on your computer. React, Vite, TypeScript, ESLint, and everything else are installed *inside the project* (see section 4).

**Recommended: use a version manager.** It lets you switch Node versions per project instead of having one fixed version on your computer. We suggest **fnm**:

- **Windows (PowerShell):**
  ```powershell
  winget install Schniz.fnm
  ```
  Then follow the "Shell setup" instructions at <https://github.com/Schniz/fnm#shell-setup> so `fnm` works in new terminals.
- **macOS:** `brew install fnm`, then follow the same shell setup link.
- **Linux:** `curl -fsSL https://fnm.vercel.app/install | bash`

Then, from the repository root:

```bash
cd frontend
fnm install    # Reads frontend/.nvmrc and installs Node 24
fnm use        # Switches this terminal to Node 24
```

**Alternative: plain installer.** Download the **LTS** installer from <https://nodejs.org> (or on Windows: `winget install OpenJS.NodeJS.LTS`).

**Close and reopen your terminal**, then check it worked:

```bash
node --version    # Should print v24.x.x
npm --version     # Should print 11.x.x or newer
```

### 2.5 Recommended editor setup (VS Code)

Install these extensions so you see errors as you type instead of only when CI fails:

**All files:**
- **EditorConfig** (`editorconfig.editorconfig`): applies the shared indentation and line-ending rules from `.editorconfig`

**Backend:**
- **Python** (`ms-python.python`)
- **Ruff** (`charliermarsh.ruff`): lint + format on save
- **Mypy Type Checker** (`ms-python.mypy-type-checker`)

**Frontend:**
- **ESLint** (`dbaeumer.vscode-eslint`): shows lint errors inline
- **Prettier** (`esbenp.prettier-vscode`): formats on save

After running `uv sync` (section 3), open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **Python: Select Interpreter** → choose the one inside `backend/.venv`.

---

## 3. Backend development (Python)

### 3.1 How we keep everyone on the same Python version

Different Python versions can behave differently, which leads to "works on my machine" bugs. We prevent that in three layers:

| File | What it does |
|---|---|
| `backend/.python-version` | Tells uv **exactly** which Python to use (`3.13`). uv downloads it if missing. |
| `backend/pyproject.toml` → `requires-python = ">=3.13,<3.14"` | Refuses to install the project on any other Python version. |
| `backend/uv.lock` | Records the **exact** version of every dependency (and their dependencies), so everyone installs identical packages. |

**Never edit `uv.lock` by hand.** uv updates it for you. **Always commit it** when it changes.

**Changing the Python version** is a team decision. If agreed, update *both* `.python-version` and `requires-python` in the same PR, then run `uv sync`.

### 3.2 Install backend dependencies

```bash
cd backend
uv sync
```

This will:
1. Download Python 3.13 if you don't have it.
2. Create a virtual environment in `backend/.venv/` (an isolated folder of packages just for this project; it's git-ignored).
3. Install every dependency at the exact version in `uv.lock`.

**Run `uv sync` again whenever you pull changes** that touch `pyproject.toml` or `uv.lock`. It's safe to run any time.

### 3.3 Running commands: always use `uv run`

Prefix Python commands with `uv run`. This guarantees the command uses the project's Python and packages, without you needing to "activate" anything.

```bash
uv run python --version     # Should print Python 3.13.x
```

### 3.4 Code quality tools

We use three checks. **All three must pass before your PR can be merged**, so run them before you push.

| Tool | Command | What it does |
|---|---|---|
| Ruff formatter | `uv run ruff format` | Automatically rewrites your code into the standard style (spacing, quotes, line breaks). |
| Ruff linter | `uv run ruff check` | Finds bugs, bad practices, and style problems. |
| mypy | `uv run mypy` | Checks that your type hints are correct and complete. |

**Run all three at once (copy-paste this):**

```bash
uv run ruff format && uv run ruff check --fix && uv run mypy
```

`--fix` lets Ruff automatically fix the problems it safely can. Read what's left and fix those by hand.

### 3.5 Adding or removing dependencies

**Never use `pip install`.** It won't be recorded and teammates won't get the package. Use uv:

```bash
uv add fastapi              # A package the app needs to run
uv add --dev pytest         # A tool only developers need (testing, linting, ...)
uv remove fastapi           # Remove a package
```

These commands update `pyproject.toml` **and** `uv.lock`. Commit both files together.

Before adding a new dependency, mention it in your PR description: what it's for and why we need it. Fewer dependencies means fewer things that can break.

### 3.6 Backend command cheat sheet

| I want to... | Command (run inside `backend/`) |
|---|---|
| Install / update packages after pulling | `uv sync` |
| Format code | `uv run ruff format` |
| Lint and auto-fix | `uv run ruff check --fix` |
| Type-check | `uv run mypy` |
| Run every check | `uv run ruff format && uv run ruff check --fix && uv run mypy` |
| Explain a lint rule | `uv run ruff rule <CODE>` |
| Add a package | `uv add <name>` (or `uv add --dev <name>`) |

---

## 4. Frontend development (React)

The frontend is a **React** app written in **TypeScript**, built and served by **Vite**. All commands in this section are run from inside `frontend/`.

### 4.1 How we keep everyone on the same Node version

Just like the backend pins Python, the frontend pins Node.js in three layers:

| File | What it does |
|---|---|
| `frontend/.nvmrc` | Tells fnm/nvm **exactly** which Node to use (`24`). |
| `frontend/package.json` → `"engines"` | Declares the allowed versions: Node `>=24 <25`, npm `>=11`. |
| `frontend/.npmrc` → `engine-strict=true` | Makes `npm install` / `npm ci` **fail** if your Node or npm version doesn't match `"engines"`. |
| `frontend/package-lock.json` | Records the **exact** version of every dependency, so everyone installs identical packages. |

**Never edit `package-lock.json` by hand.** npm updates it for you. **Always commit it** when it changes.

**Changing the Node version** is a team decision. If agreed, update *both* `.nvmrc` and `"engines"` in the same PR.

#### Why TypeScript is pinned to 6.0.x

`package.json` has `"typescript": "~6.0.3"`, which allows only 6.0.x patch updates. **Do not upgrade to TypeScript 7** yet: our linter (`typescript-eslint`) doesn't support it, and linting would break. We'll upgrade once it does.

### 4.2 Install frontend dependencies

```bash
cd frontend
npm ci
```

This installs every package at the exact version in `package-lock.json` into `frontend/node_modules/` (git-ignored, like the backend's `.venv/`).

**Run `npm ci` again whenever you pull changes** that touch `package.json` or `package-lock.json`.

> **`npm ci` vs `npm install`:** `npm ci` installs exactly what the lockfile says and never changes it. Use it for day-to-day setup. Only use `npm install <package>` when you're intentionally adding a dependency (section 4.5).

### 4.3 Running the app

```bash
npm run dev
```

Open the URL it prints (usually <http://localhost:5173>). The page reloads automatically when you save a file. Press `Ctrl+C` in the terminal to stop it.

Other useful commands:

```bash
npm run build      # Type-check and build a production version into frontend/dist/
npm run preview    # Serve the production build locally to test it
```

### 4.4 Code quality tools

We use three checks, mirroring the backend. **All three must pass before your PR can be merged**, so run them before you push.

| Tool | Command | What it does | Backend equivalent |
|---|---|---|---|
| Prettier | `npm run format` | Automatically rewrites your code into the standard style. | `ruff format` |
| ESLint | `npm run lint` | Finds bugs, bad practices, and accessibility problems. | `ruff check` |
| TypeScript | `npm run typecheck` | Checks that your types are correct. | `mypy` |

**Run all three at once (copy-paste this):**

```bash
npm run format && npm run lint:fix && npm run typecheck
```

`lint:fix` lets ESLint automatically fix the problems it safely can. Read what's left and fix those by hand.

`npm run check` runs the same three checks **without changing any files**. This is what CI will run.

Like the backend, both ESLint and TypeScript are configured in **strict** mode:

- **ESLint** (`eslint.config.js`) uses `typescript-eslint`'s `strictTypeChecked` and `stylisticTypeChecked` rule sets, plus rules for React hooks and accessibility (`jsx-a11y`). Accessibility matters for Environ: our users include children and first-time users, and the app should work on touchscreen kiosks.
- **TypeScript** (`tsconfig.app.json`) has `strict` on, plus extra safety checks like `noUncheckedIndexedAccess`.

### 4.5 Adding or removing dependencies

```bash
npm install <package>          # A package the app needs to run (e.g. a UI library)
npm install -D <package>       # A tool only developers need (linters, type definitions, ...)
npm uninstall <package>        # Remove a package
```

These commands update `package.json` **and** `package-lock.json`. Commit both files together.

- **Never use `npm install -g`** for project tools. Global installs aren't recorded, so teammates won't get them.
- As with the backend, mention any new dependency in your PR description: what it's for and why we need it.

### 4.6 Testing

Testing for the frontend (Vitest + React Testing Library) **will be set up later**. This section will be updated when it is.

### 4.7 Frontend command cheat sheet

| I want to... | Command (run inside `frontend/`) |
|---|---|
| Install packages after pulling | `npm ci` |
| Start the dev server | `npm run dev` |
| Format code | `npm run format` |
| Lint and auto-fix | `npm run lint:fix` |
| Type-check | `npm run typecheck` |
| Run every check (no changes) | `npm run check` |
| Build for production | `npm run build` |
| Add a package | `npm install <name>` (or `npm install -D <name>`) |

---

## 5. Git workflow

We use **feature branches + pull requests**. Nobody commits directly to `main`.

`main` should always be in a working state. All work happens on a separate branch, gets reviewed, and is then merged.

### 5.1 Step by step

**1. Start from an up-to-date `main`:**

```bash
git checkout main
git pull
```

**2. Create a branch for your task:**

```bash
git checkout -b feature/hex-board-palette
```

Branch naming: `<type>/<short-description-with-dashes>`

| Prefix | Use for | Example |
|---|---|---|
| `feature/` | New functionality | `feature/sustainability-score` |
| `fix/` | Bug fixes | `fix/import-crash-on-empty-file` |
| `docs/` | Documentation only | `docs/update-setup-guide` |
| `refactor/` | Restructuring without behaviour change | `refactor/split-metrics-module` |
| `chore/` | Tooling, config, dependencies | `chore/add-pytest` |

**3. Make changes and commit often** (small commits are easier to review and undo):

```bash
git status                 # See what changed
git add <file1> <file2>    # Stage specific files
git commit -m "feat(backend): add forest health regeneration rule"
```

> Prefer `git add <file>` over `git add .` so you don't accidentally commit stray files.

**4. Run all checks** before pushing: backend (section 3.4) and/or frontend (section 4.4), depending on what you changed.

**5. Push your branch:**

```bash
git push -u origin feature/hex-board-palette
```

(`-u` is only needed the first time; after that, plain `git push` works.)

**6. Open a pull request** on GitHub (see section 7).

### 5.2 Keeping your branch up to date

If `main` has moved on while you were working:

```bash
git checkout main
git pull
git checkout feature/hex-board-palette
git merge main
```

If Git reports a **merge conflict**, open the listed files, look for the `<<<<<<<`, `=======`, `>>>>>>>` markers, keep the correct code, delete the markers, then:

```bash
git add <resolved-file>
git commit
```

Not sure how to resolve it? **Stop and ask.** It's much easier to fix together than to untangle afterwards.

### 5.3 Things to never do

- ❌ Commit directly to `main`.
- ❌ `git push --force` on a shared branch (it can delete teammates' work).
- ❌ Commit secrets (API keys, passwords, `.env` files). If you do by accident, tell the team **immediately**: the key must be revoked, not just deleted.
- ❌ Commit generated folders like `.venv/`, `node_modules/`, or `__pycache__/` (they're in `.gitignore`).

---

## 6. Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary in present tense>
```

- **type:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`
- **scope** (optional): `backend`, `frontend`, `ci`, `docs`
- **summary:** lowercase, imperative ("add", not "added"/"adds"), no full stop, under ~72 characters

Good examples:

```
feat(backend): add water quality decay for adjacent settlements
fix(frontend): keep board unchanged when drag ends outside it
docs: explain uv setup on Windows
chore(backend): add pytest as dev dependency
```

Bad examples:

```
fixed stuff
WIP
update
```

If you need more detail, leave a blank line after the summary and write a body explaining **why** the change was made.

---

## 7. Pull requests and code review

### 7.1 Opening a PR

1. On GitHub, click **Compare & pull request** for your branch.
2. Base branch: `main`.
3. **Title:** same format as a commit message, e.g. `feat(backend): add forest health rule`.
4. **Description:** include
   - **What** changed, in a few bullet points.
   - **Why**: link the requirement or issue (e.g. "Implements Req 2.7", "Closes #12").
   - **How to test**: steps a reviewer can follow.
   - Screenshots for any UI change.
5. Keep PRs **small and focused**: one feature or fix per PR. Aim for under ~400 changed lines. Big PRs get slow, shallow reviews.

### 7.2 Before requesting review: checklist

- [ ] All checks pass locally: backend (`ruff format`, `ruff check`, `mypy`) and/or frontend (`npm run check`)
- [ ] New backend code has type hints and docstrings
- [ ] No leftover debug code, commented-out code, `print()`, or `console.log()` calls
- [ ] No secrets or personal files committed
- [ ] `uv.lock` / `package-lock.json` is committed if dependencies changed
- [ ] Documentation updated if behaviour or setup changed

### 7.3 Review and merge

- Every PR needs **at least one approving review** from a teammate.
- **As an author:** respond to every comment, either by making the change or explaining why not. Push fixes as new commits on the same branch; the PR updates automatically.
- **As a reviewer:** be kind and specific. Explain *why* something should change. Distinguish must-fix issues from optional suggestions (prefix those with `nit:`).
- Once approved and checks pass, merge using **Squash and merge**, which combines your commits into one tidy commit on `main`.
- Delete your branch after merging (GitHub shows a button).

---

## 8. Troubleshooting

**`uv: command not found` / `'uv' is not recognized`**
Close and reopen your terminal after installing. If it still fails, re-run the installer and check the end of its output for a PATH instruction.

**`Required uv version >=0.10 does not match the running version`**
Run `uv self update`.

**`No interpreter found for Python 3.13`**
Run `uv python install 3.13`, then `uv sync`.

**VS Code shows import errors, but `uv run` works fine**
VS Code is using the wrong Python. Command Palette → **Python: Select Interpreter** → pick `backend/.venv`.

**Ruff says something is wrong but I don't understand it**
Run `uv run ruff rule <CODE>` for a full explanation with examples.

**`uv.lock` has a merge conflict**
Don't edit it by hand. Accept either side, then run `uv lock` to regenerate it, and commit the result.

**`npm ERR! code EBADENGINE` / `Unsupported engine`**
Your Node or npm version doesn't match the project. Run `node --version`: it must be 24.x. With fnm, run `fnm use` inside `frontend/`. Otherwise, install Node 24 LTS (section 2.4).

**`node: command not found` / `fnm: command not found`**
Close and reopen your terminal. With fnm, make sure you completed its "Shell setup" step (section 2.4).

**`npm ci` fails with "package.json and package-lock.json are not in sync"**
Someone changed `package.json` without committing the updated lockfile. Run `npm install`, then commit the updated `package-lock.json`.

**`package-lock.json` has a merge conflict**
Don't edit it by hand. Accept the version from `main`, then run `npm install` to regenerate it, and commit the result.

**ESLint errors appear in VS Code but not in the terminal (or the other way round)**
Restart the ESLint server: Command Palette → **ESLint: Restart ESLint Server**.

**Every file shows as changed, or Prettier fails on files you didn't touch (Windows)**
This is a line-ending problem. Our `.gitattributes` forces LF line endings for everyone, but files checked out *before* it existed may still have CRLF. Commit or stash your work, then run from the repository root:
```bash
git rm --cached -r . && git reset --hard
```

**Something else**
Ask in the team chat. Include the exact command you ran and the full error message (copy-paste, not a screenshot if possible).
