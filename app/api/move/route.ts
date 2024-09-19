import { generateObject, generateText } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { createOpenAI } from "@ai-sdk/openai";

export const MoveSchema = z.object({
  move: z.string(),
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
    You are a chess engine. Given the FEN "${fen}", provide the best next move in UCI format (e.g., "e2e4" or "e7e8q" for promotion).
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
      prompt: prompt,
    });
    moveAttempt = text.trim();
  } else {
    let modelWithWrapper;
    switch (llm) {
      case "gpt-4-turbo":
      case "gpt-4o":
        modelWithWrapper = openai(llm);
        break;
      case "claude-3-5-sonnet":
        modelWithWrapper = anthropic("claude-3-5-sonnet-20240620");
        break;
      case "llama-3.1-70b":
        const groq = createOpenAI({
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: process.env.GROQ_API_KEY,
        });
        modelWithWrapper = groq("llama-3.1-70b-versatile");
        break;
      default:
        throw new Error("Invalid LLM selected");
    }

    const { object } = await generateObject({
      model: modelWithWrapper,
      schema: MoveSchema,
      prompt: prompt,
    });
    moveAttempt = object.move;
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
