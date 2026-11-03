import { Board3D } from "./features/board/Board3D.tsx";
import { BoardProvider } from "./features/board/BoardProvider.tsx";
import { DevBoardControls } from "./features/board/DevBoardControls.tsx";

function App() {
  return (
    <BoardProvider>
      <div className="app">
        <header className="app-header">
          <h1>Environ</h1>
          <p>Build a world. See how your choices shape its future.</p>
        </header>
        <main className="app-main">
          <aside className="app-side">
            {import.meta.env.DEV && <DevBoardControls />}
          </aside>
          <Board3D />
        </main>
      </div>
    </BoardProvider>
  );
}

export default App;
