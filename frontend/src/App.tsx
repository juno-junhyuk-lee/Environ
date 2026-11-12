import { Board3D } from "./features/board/Board3D.tsx";
import { BoardProvider } from "./features/board/BoardProvider.tsx";
import { ElementDragProvider } from "./features/board/ElementDragProvider.tsx";
import { PlaybackControls } from "./features/board/PlaybackControls.tsx";
import { YearIndicator } from "./features/board/YearIndicator.tsx";
import { WorldControls } from "./features/board/WorldControls.tsx";
import { ElementsPane } from "./features/elements/ElementsPane.tsx";

function App() {
  return (
    <BoardProvider>
      <ElementDragProvider>
        <div className="app">
          <header className="app-header">
            <div>
              <h1>Environ</h1>
              <p>Build a world. See how your choices shape its future.</p>
            </div>
            <WorldControls />
          </header>
          <main className="app-main">
            <ElementsPane />
            {/* The year sits over the board, outside its role="img" box, so
                screen readers still read it. */}
            <div className="board-area">
              <Board3D />
              <YearIndicator />
            </div>
            <PlaybackControls />
          </main>
          {/* Required by the Icons8 and Friconix free licences. */}
          <p className="app-credit">
            Icons by{" "}
            <a href="https://icons8.com" target="_blank" rel="noreferrer">
              Icons8
            </a>{" "}
            and{" "}
            <a href="https://friconix.com" target="_blank" rel="noreferrer">
              Friconix
            </a>
          </p>
        </div>
      </ElementDragProvider>
    </BoardProvider>
  );
}

export default App;
