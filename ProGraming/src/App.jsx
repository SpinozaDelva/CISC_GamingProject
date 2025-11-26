import { useEffect } from "react";
import { startGame } from "./game";

function App() {
  useEffect(() => {
    startGame();
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        backgroundColor: "#111",
        color: "#eee",
        minHeight: "100vh",
        paddingTop: "20px",
      }}
    >
      <h1>CISC 3140 JavaScript Game</h1>
      <p>Use the arrow keys to move the square.</p>

      <canvas
        id="gameCanvas"
        width="600"
        height="400"
        style={{ border: "1px solid #555", backgroundColor: "black" }}
      ></canvas>
    </div>
  );
}

export default App;
