import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { StructuredResponse } from "./schema";
import { analyzeCompany } from "@/utils";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    companyName,
    companyWebsite,
  }: { companyName: string; companyWebsite: string } = await req.json();

  console.log("xxx companyWebsite", companyWebsite);
  const response = await analyzeCompany({ companyWebsite });

  const result = await streamObject({
    model: openai("gpt-4o-mini"),
    system: `You are a helpful assistant that standardizes information into JSON format.
           Please convert the user input content which is a reponse from Perplexity AI into a JSON format
           with keys 'is_manufacturing_company', 'manufacture_in_china', 'manufacture_in_usa', and 'manufacture_in_mexico', 'other_manufacture_outside_of_usa'.
           The values should be 'Yes', 'No', or 'Maybe'.
           -  other_manufacture_outside_of_usa is other countries of manufacture outside of USA, Mexico, and China.
           Once you have the answers, calculate a score from 1-10 based on 3 answers and fill in 'score' The criteria is as follows:
           - 10/10: If Manufacturing is Yes, USA is Yes, China is No, and Mexico is No, and Other is No
           - 8/10: If Manufacturing is Yes, USA is Yes, China is No, and Mexico is No, and Other is Yes
           - 7/10: If Manufacturing is Maybe/Yes, USA is Yes, China is Maybe, and Mexico is No, and Other is Maybe
           - 5/10: If Manufacturing is Maybe/Yes, USA is No, China is Yes, and Mexico is Yes, and Other is Yes
           - 3/10: If Manufacturing is Maybe/Yes, USA is Yes, China is No, and Mexico is Yes, and Other is Yes
           - 2/10: If Manufacturing is Maybe/Yes, USA is No, China is Yes, and Mexico is Yes, and Other is Yes
           - 0/10: Is Manufacturing Company is No. Then other answers are not relevant.
           Here's the content:`,
    prompt: `Content: "${response}"`,
    schema: StructuredResponse,
    onFinish({ object }) {
      // save object to database
      console.log("xxx finished", object);
    },
  });

  return result.toTextStreamResponse();
}
