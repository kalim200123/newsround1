// src/App.tsx

import "./App.css";
import TopicList from "./components/TopicList";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Different News</h1>
        <p>Isn't wrong, just different</p>
      </header>
      <TopicList />
    </div>
  );
}

export default App;
