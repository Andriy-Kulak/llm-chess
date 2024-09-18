// app/components/ChessGame.tsx
"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const LLM_OPTIONS = ["gpt-4-turbo", "gpt-4o", "claude-3-5-sonnet"];

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [isAIGame, setIsAIGame] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const { width, height } = useWindowSize();
  const [whiteLLM, setWhiteLLM] = useState(LLM_OPTIONS[0]);
  const [blackLLM, setBlackLLM] = useState(LLM_OPTIONS[1]);
  const [gameEndReason, setGameEndReason] = useState<
    "checkmate" | "invalid_move" | "draw" | null
  >(null);

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
        body: JSON.stringify({
          fen: game.fen(),
          llm: game.turn() === "w" ? whiteLLM : blackLLM,
        }),
      });

      const data = await response.json();
      console.log("AI API response:", data);

      const aiMove = data.move;

      if (!aiMove || aiMove === "null") {
        console.error("No valid moves returned by AI.");
        handleGameOver(game, "invalid_move");
        return;
      }

      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move(aiMove);

      if (move === null) {
        console.error("AI made an invalid move:", aiMove);
        handleGameOver(game, "invalid_move");
        return;
      }

      setGame(new Chess(gameCopy.fen()));

      if (gameCopy.isGameOver()) {
        handleGameOver(gameCopy);
      }
    } catch (error) {
      console.error("Error in makeAIMove:", error);
      handleGameOver(game, "invalid_move");
    }
  };

  const handleGameOver = (
    gameInstance: Chess,
    reason: "checkmate" | "invalid_move" | "draw" | null = null
  ) => {
    setGameOver(true);
    setGameEndReason(reason);

    if (reason === "invalid_move") {
      setWinner(gameInstance.turn() === "w" ? "Black" : "White");
    } else if (gameInstance.isCheckmate()) {
      setWinner(gameInstance.turn() === "w" ? "Black" : "White");
      setGameEndReason("checkmate");
    } else if (gameInstance.isDraw()) {
      setWinner("Draw");
      setGameEndReason("draw");
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
      {!isAIGame && (
        <div className="mb-4">
          <label className="mr-2 text-black font-semibold">White LLM:</label>
          <select
            value={whiteLLM}
            onChange={(e) => setWhiteLLM(e.target.value)}
            className="border rounded p-1 text-black bg-white"
          >
            {LLM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {isAIGame && (
        <div className="mb-4 text-black font-semibold">White: {whiteLLM}</div>
      )}

      <Chessboard position={game.fen()} arePiecesDraggable={false} />

      {isAIGame && (
        <div className="mt-4 text-black font-semibold">Black: {blackLLM}</div>
      )}

      {!isAIGame && (
        <div className="mt-4">
          <label className="mr-2 text-black font-semibold">Black LLM:</label>
          <select
            value={blackLLM}
            onChange={(e) => setBlackLLM(e.target.value)}
            className="border rounded p-1 text-black bg-white"
          >
            {LLM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {!isAIGame && !gameOver && (
        <button
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded font-semibold"
          onClick={startAIGame}
        >
          Start AI vs AI Game
        </button>
      )}

      {isAIGame && !gameOver && (
        <p className="mt-4 text-black font-semibold">
          AI is playing... {game.turn() === "w" ? whiteLLM : blackLLM}'s turn
        </p>
      )}

      {gameOver && (
        <>
          <Confetti width={width} height={height} />

          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4 text-black">
                {winner === "Draw" ? "Game Drawn" : `${winner} Won!`}
              </h2>
              {winner !== "Draw" && (
                <p className="text-lg text-gray-700 mb-4">
                  {winner} won by{" "}
                  {gameEndReason === "checkmate" ? "checkmate" : "invalid move"}
                  !
                </p>
              )}
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
