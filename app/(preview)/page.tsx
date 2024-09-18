"use client";

import ChessGame from "@/components/Chessboard";

export default function Home() {
  return (
    <div className="flex flex-row justify-center pt-20 h-dvh bg-white text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-black">LLM vs LLM Chess</h1>
        <p className="text-lg text-black">
          Pick LLMs to play 1 vs 1 and let the games begin!
        </p>
        <ChessGame />
      </div>
    </div>
  );
}
