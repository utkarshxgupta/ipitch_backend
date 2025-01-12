import React from "react";
import ExampleList from "./components/ExampleList";
import { Provider } from "./components/ui/provider";

function App() {
  return (
    <Provider>
      <div className="App">
        <header className="App-header">
          <h1>iPitch</h1>
        </header>
        <ExampleList />
      </div>
    </Provider>
  );
}

export default App;
