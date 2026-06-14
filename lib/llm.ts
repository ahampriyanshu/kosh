import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import type { ZodType } from 'zod';

// @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY from the environment automatically.
const DEFAULT_MODEL = "gemini-2.5-flash";
const MODEL_ENV_VAR = 'KOSH_GOOGLE_MODEL';

export interface Grounded {
  text: string;
  sources: unknown[];
}

function modelId(): string {
  return process.env[MODEL_ENV_VAR]?.trim() || DEFAULT_MODEL;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

function statusCode(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'statusCode' in error
    ? (error as { statusCode?: number }).statusCode
    : undefined;
}

function isQuotaError(error: unknown): boolean {
  const message = errorText(error);
  return statusCode(error) === 429 || /quota|RESOURCE_EXHAUSTED/i.test(message);
}

function wrapGoogleError(error: unknown, model: string): never {
  if (!isQuotaError(error)) throw error;

  throw new Error(
    `Google Gemini API quota was exhausted for model "${model}". ` +
      `Set ${MODEL_ENV_VAR} in .env to a model with available quota, or enable billing/increase quota for your Google AI project. ` +
      `Original error: ${errorText(error)}`,
    { cause: error },
  );
}

export async function researchWithSearch(prompt: string): Promise<Grounded> {
  const model = modelId();
  try {
    const { text, sources } = await generateText({
      model: google(model),
      tools: { google_search: google.tools.googleSearch({}) },
      prompt,
    });
    return { text, sources: sources ?? [] };
  } catch (error) {
    wrapGoogleError(error, model);
  }
}

export async function structure<T>(prompt: string, schema: ZodType<T>): Promise<T> {
  const model = modelId();
  try {
    const { object } = await generateObject({
      model: google(model),
      schema,
      prompt,
    });
    return object;
  } catch (error) {
    wrapGoogleError(error, model);
  }
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
