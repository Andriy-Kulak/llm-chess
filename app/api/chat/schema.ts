import { DeepPartial } from "ai";
import { z } from "zod";

export const StructuredResponse = z.object({
  is_manufacturing_company: z.string(),
  manufacture_in_usa: z.string(),
  manufacture_in_china: z.string(),
  manufacture_in_mexico: z.string(),
  other_manufacture_outside_of_usa: z.string(),
  score: z.number(),
});
