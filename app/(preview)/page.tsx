"use client";

import ChessGame from "@/components/Chessboard";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-white text-center">
      <h1 className="text-3xl font-bold text-purple-600 pt-10">
        LLM Chess Battle
      </h1>
      <div className="flex-grow">
        <ChessGame />
      </div>
    </div>
  );
}
