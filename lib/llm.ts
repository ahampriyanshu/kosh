import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import type { ZodType } from 'zod';

// @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY from the environment automatically.
const MODEL = 'gemini-3.1-pro-preview';

export interface Grounded {
  text: string;
  sources: unknown[];
}

export async function researchWithSearch(prompt: string): Promise<Grounded> {
  const { text, sources } = await generateText({
    model: google(MODEL),
    tools: { google_search: google.tools.googleSearch({}) },
    prompt,
  });
  return { text, sources: sources ?? [] };
}

export async function structure<T>(prompt: string, schema: ZodType<T>): Promise<T> {
  const { object } = await generateObject({
    model: google(MODEL),
    schema,
    prompt,
  });
  return object;
}

export async function generateGroundedObject<T>(
  researchPrompt: string,
  buildStructurePrompt: (researchText: string) => string,
  schema: ZodType<T>,
): Promise<{ object: T; sources: unknown[] }> {
  const research = await researchWithSearch(researchPrompt);
  const object = await structure(buildStructurePrompt(research.text), schema);
  return { object, sources: research.sources };
}
