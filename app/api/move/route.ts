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
  const { fen } = await req.json();

  const prompt = `
  You are a chess engine.
  Given the FEN "${fen}", provide the best next move in UCI format.
  Ensure the move is legal and valid. If no moves are possible, return "null".
`;
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: MoveSchema,
    prompt: prompt,
  });

  return NextResponse.json(object);
}
