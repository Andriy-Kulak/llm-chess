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

  // Validate the FEN and get legal moves
  const chess = new Chess(fen);

  // if (!chess.isLegal()) {
  //   return NextResponse.json({ error: "Invalid FEN" }, { status: 400 });
  // }

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

  if (llm === "o1-mini" || llm === "o1-preview") {
    const { text } = await generateText({
      model: openai("o1-mini"),
      temperature: 1,
      prompt: `
    You are a chess engine.
    Given the FEN "${fen}", provide the best next move in UCI format (e.g., "e2e4" or "e7e8q" for promotion).
    Ensure the move is legal and valid. Here are the legal moves: ${JSON.stringify(
      legalMoves.map((m) => m.san)
    )}.
    Only return the move string in UCI format, nothing else.`,
    });

    console.log("xxx O1 AI move attempt:", text);
    return NextResponse.json({ move: text.trim() });
  } else {
    // Use a switch statement to select the appropriate model and wrapper
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

    const prompt = `
    You are a chess engine.
    Given the FEN "${fen}", provide the best next move in UCI format (e.g., "e2e4" or "e7e8q" for promotion).
    Ensure the move is legal and valid. Here are the legal moves: ${JSON.stringify(
      legalMoves.map((m) => m.san)
    )}.
    Only return the move string in UCI format, nothing else.
  `;

    const { object } = await generateObject({
      model: modelWithWrapper,
      schema: MoveSchema,
      prompt: prompt,
    });

    console.log("xxx AI suggested move:", object.move);

    // // Validate the AI's move
    // const moveObject = legalMoves.find(
    //   (m) => m.lan === object.move || m.san === object.move
    // );
    // if (!moveObject) {
    //   console.error("AI suggested an invalid move:", object.move);
    //   return NextResponse.json(
    //     { error: "Invalid move suggested by AI" },
    //     { status: 400 }
    //   );
    // }

    console.log("xxx regular object.move", object.move);

    return NextResponse.json({ move: object.move });
  }
}
