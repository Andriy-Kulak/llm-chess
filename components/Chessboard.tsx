// app/components/ChessGame.tsx
"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [isAIGame, setIsAIGame] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (isAIGame && !gameOver) {
      console.log("Scheduling AI move...");
      setTimeout(makeAIMove, 500);
    }
  }, [game, isAIGame, gameOver]);

  const makeAIMove = async () => {
    console.log("Making AI move... Current FEN:", game.fen());
    try {
      const response = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: game.fen() }),
      });

      const data = await response.json();
      console.log("AI API response:", data);

      const aiMove = data.move;

      if (!aiMove || aiMove === "null") {
        console.error("No valid moves returned by AI.");
        handleGameOver(game, true);
        return;
      }

      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move(aiMove);

      if (move === null) {
        console.error("AI made an invalid move:", aiMove);
        handleGameOver(game, true);
        return;
      }

      setGame(new Chess(gameCopy.fen()));

      if (gameCopy.isGameOver()) {
        handleGameOver(gameCopy);
      }
    } catch (error) {
      console.error("Error in makeAIMove:", error);
      handleGameOver(game, true);
    }
  };

  const handleGameOver = (
    gameInstance: Chess,
    invalidMove: boolean = false
  ) => {
    setGameOver(true);
    if (invalidMove) {
      setWinner(gameInstance.turn() === "w" ? "Black" : "White");
    } else if (gameInstance.isCheckmate()) {
      setWinner(gameInstance.turn() === "w" ? "Black" : "White");
    } else if (gameInstance.isDraw()) {
      setWinner("Draw");
    } else {
      setWinner("Game Over");
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setGameOver(false);
    setWinner("");
    setIsAIGame(false);
  };

  const startAIGame = () => {
    console.log("Starting AI vs AI game...");
    setIsAIGame(true);
    setGame(new Chess());
    setGameOver(false);
    setWinner("");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen relative">
      <Chessboard position={game.fen()} arePiecesDraggable={false} />

      {!isAIGame && !gameOver && (
        <button
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
          onClick={startAIGame}
        >
          Start AI vs AI Game
        </button>
      )}

      {isAIGame && !gameOver && <p className="mt-4">AI is playing...</p>}

      {gameOver && (
        <>
          <Confetti width={width} height={height} />

          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">
                {winner === "Draw" ? "Game Drawn" : `${winner} Won!`}
              </h2>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={resetGame}
              >
                Reset Game
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
