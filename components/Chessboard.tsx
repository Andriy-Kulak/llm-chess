// app/components/ChessGame.tsx
"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const LLM_OPTIONS = [
  "gpt-4-turbo",
  "gpt-4o",
  "claude-3-5-sonnet",
  "llama-3.1-70b",
];

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
    <div className="flex flex-col justify-between items-center gap-4 py-4">
      {!isAIGame && (
        <div className="text-center">
          <label className="block text-xl font-bold text-purple-600 mb-1">
            Choose White's Champion:
          </label>
          <select
            value={whiteLLM}
            onChange={(e) => setWhiteLLM(e.target.value)}
            className="border-2 border-purple-400 rounded-full p-1 text-lg text-black bg-white font-semibold"
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
        <div className="text-2xl font-bold text-blue-600 animate-pulse">
          ⚔️ {whiteLLM} ⚔️
        </div>
      )}

      <div className="w-[80vw] max-w-[400px]">
        <Chessboard position={game.fen()} arePiecesDraggable={false} />
      </div>

      {isAIGame && (
        <div className="text-2xl font-bold text-red-600 animate-pulse">
          ⚔️ {blackLLM} ⚔️
        </div>
      )}

      {!isAIGame && (
        <div className="text-center">
          <label className="block text-xl font-bold text-purple-600 mb-1">
            Choose Black's Champion:
          </label>
          <select
            value={blackLLM}
            onChange={(e) => setBlackLLM(e.target.value)}
            className="border-2 border-purple-400 rounded-full p-1 text-lg text-black bg-white font-semibold"
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
          className="px-6 py-3 bg-purple-600 text-white rounded-full font-bold text-xl hover:bg-purple-700 transition-colors duration-300 animate-pulse"
          onClick={startAIGame}
        >
          Unleash the AI Battle!
        </button>
      )}

      {isAIGame && !gameOver && (
        <p className="text-lg font-bold text-green-600 animate-bounce">
          Epic showdown in progress...{" "}
          {game.turn() === "w" ? whiteLLM : blackLLM} is plotting its next move!
        </p>
      )}

      {gameOver && (
        <>
          <Confetti
            width={width}
            height={height}
            style={{ position: "fixed", top: 0, left: 0, zIndex: 1000 }}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <h2 className="text-4xl font-extrabold mb-4 text-purple-600">
                {winner === "Draw" ? "Epic Stalemate!" : `${winner} Triumphs!`}
              </h2>
              {winner !== "Draw" && (
                <p className="text-2xl text-gray-700 mb-4">
                  {winner} clinched victory by{" "}
                  {gameEndReason === "checkmate"
                    ? "an earth-shattering checkmate"
                    : "outsmarting its opponent"}
                  !
                </p>
              )}
              <button
                className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-full font-bold text-lg hover:bg-blue-600 transition-colors duration-300"
                onClick={resetGame}
              >
                Prepare for Another Epic Battle!
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
