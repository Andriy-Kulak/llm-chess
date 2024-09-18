import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export const MoveSchema = z.object({
  move: z.string(),
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("API route hit");
  try {
    const { fen } = await req.json();
    console.log("Received FEN:", fen);

    const prompt = `
    You are a chess engine.
    Given the FEN "${fen}", provide the best next move in UCI format (e.g., "e2e4" or "e7e8q" for promotion).
    Ensure the move is legal and valid. If no moves are possible, return "null".
    Only return the move string, nothing else.
`;

    const { object } = await generateObject({
      model: openai("gpt-4"),
      schema: MoveSchema,
      prompt: prompt,
    });

    console.log("AI move:", object.move);
    return NextResponse.json(object);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
