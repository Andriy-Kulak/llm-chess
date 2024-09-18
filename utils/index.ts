import { StructuredResponse } from "@/app/api/chat/schema";

export const analyzeCompany = async ({
  // companyName,
  companyWebsite,
}: {
  companyName?: string;
  companyWebsite: string;
}): Promise<string | null> => {
  try {
    const startTime = Date.now();

    const maxTokens = 10000;
    const modelOptions = {
      llamaSmall: "llama-3.1-8b-instruct",
      small: "llama-3.1-sonar-small-128k-online",
      large: "llama-3.1-sonar-large-128k-online", // takes 2 seconds
      huge: "llama-3.1-sonar-huge-128k-online", // takes 17 seconds
    };

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_tokens: maxTokens,
        model: modelOptions.large,
        messages: [
          {
            role: "system",
            content: `User will provide a company name and a website url.
              You will lookup information about the company online & on their website & answer the following questions concisely.
              If unsure, then say 'Maybe'.
              1) Is this a manufacturing company with manufacturing facilities that include metal manufacturing?
              2) Does this company manufacture in China? Yes/No/Maybe
              3) Do they Manufacture in USA? Yes/No/Maybe
              4) Do they manufacture in Mexico? Yes/No/Maybe
              5) Do they manufacture in other countries outside of USA, China, and Mexico? Yes/No/Maybe`,
          },
          {
            role: "user",
            // content: `Company Name: ${companyName}; Company Website: ${companyWebsite}`,
            content: `Company Website: ${companyWebsite}`,
          },
        ],
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1,
      }),
    };

    console.log("xxx trying to execute options", options);

    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );

    if (response.status !== 200) {
      console.log("xxx response status", response.status);
      console.log("xxx response statusText", response.statusText);
      throw new Error(
        `Perplexity AI Error: statusText ${response.statusText} code: ${response.status}`
      );
    }

    console.log("xxx response status", response.status);

    // console.log("xxx response", response);

    const data = (await response.json()) as {
      id: string;
      choices: {
        index: number;
        message: {
          role: string;
          content: string;
        };
      }[];
    };

    console.log("xxx data", data);

    console.log("Time taken part 1:", Date.now() - startTime);
    const startPart2 = Date.now();

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log("perplexity error response", JSON.stringify(data, null, 2));
      throw new Error("No content in Perplexity AI response");
    }

    console.log("xxx time taken part 2", Date.now() - startPart2);
    console.log(
      "Original Perplexity AI response:",
      data?.choices?.[0]?.message?.content
    );

    if (content) {
      return content;
    } else {
      console.log("Unexpected response structure from Perplexity AI");
      return null;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
