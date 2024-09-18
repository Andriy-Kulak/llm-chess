// components/Chessboard.js
import { useState, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const ChessGame = () => {
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState("");
  const { width, height } = useWindowSize();

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) return false;

      setGame(new Chess(game.fen()));

      if (game.isGameOver()) {
        setGameOver(true);
        if (game.isCheckmate()) {
          setWinner(game.turn() === "w" ? "Black" : "White");
        } else {
          setWinner("Draw");
        }
      }

      return true;
    },
    [game]
  );

  const resetGame = () => {
    setGame(new Chess());
    setGameOver(false);
    setWinner("");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      {gameOver && (
        <>
          <Confetti width={width} height={height} />
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold">
              {winner === "Draw" ? "Game Drawn" : `${winner} Won!`}
            </p>
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={resetGame}
            >
              Reset Game
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChessGame;
