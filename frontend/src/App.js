// frontend/src/App.js
 
import React from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import ICUPredictor from "./components/ICUPredictor";
import "./App.css";

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <ICUPredictor />
      </ErrorBoundary>
    </div>
  );
}

export default App;