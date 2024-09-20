import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI, openai } from "@ai-sdk/openai";
import {
  experimental_customProvider as customProvider,
  generateObject,
  generateText,
} from "ai";
import { Chess } from "chess.js";
import { NextResponse } from "next/server";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const provider = customProvider({
  languageModels: {
    "gpt-4-turbo": openai("gpt-4-turbo"),
    "gpt-4o": openai("gpt-4o-2024-08-06", { structuredOutputs: true }),
    "gpt-4o-mini": openai("gpt-4o-mini", { structuredOutputs: true }),
    "claude-3-5-sonnet": anthropic("claude-3-5-sonnet-20240620"),
    "llama-3.1-70b": groq("llama-3.1-70b-versatile"),
  },
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { fen, llm }: { fen: string; llm: string } = await req.json();

  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });

  if (legalMoves.length === 0) {
    return NextResponse.json({ move: "null" });
  }

  console.log("xxx llm", llm);
  console.log("Received FEN:", fen);
  console.log(
    "xxx all possible legal moves",
    legalMoves.map((m) => m.san)
  );

  const prompt = `
    You are a chess engine that has the skill level of Magnus Carlsen. Given the FEN "${fen}", provide the best next move in UCI format (e.g., "e2e4" or "e7e8q" for promotion).
    You MUST choose from the following legal moves: ${JSON.stringify(
      legalMoves.map((m) => m.lan)
    )}.
    Only return the move string in UCI format, nothing else. If you can't make a move, return "null".
  `;

  let moveAttempt: string;

  if (llm === "o1-mini" || llm === "o1-preview") {
    const { text } = await generateText({
      model: openai("o1-mini"),
      temperature: 1,
      prompt,
    });
    moveAttempt = text.trim();
  } else {
    const { object: move } = await generateObject({
      model: provider.languageModel(llm),
      output: "enum",
      enum: legalMoves.map((m) => m.lan),
      prompt,
    });

    moveAttempt = move;
  }

  console.log("xxx AI move attempt:", moveAttempt);

  // Validate the AI's move
  const isValidMove = legalMoves.some(
    (m) => m.lan === moveAttempt || m.san === moveAttempt
  );
  if (!isValidMove) {
    console.error("AI suggested an invalid move:", moveAttempt);
    return NextResponse.json({ move: "null" });
  }

  return NextResponse.json({ move: moveAttempt });
}
