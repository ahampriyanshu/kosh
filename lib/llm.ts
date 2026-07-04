import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import type { ZodType } from 'zod';

// @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY from the environment automatically.
const DEFAULT_MODEL = "gemini-2.5-flash";
const MODEL_ENV_VAR = 'GOOGLE_MODEL';
const MODEL_FALLBACK_ENV_VARS = ['GOOGLE_MODEL_FALLBACK_1', 'GOOGLE_MODEL_FALLBACK_2'] as const;
const API_KEY_FALLBACK_ENV_VARS = [
  'GOOGLE_GENERATIVE_AI_API_KEY_FALLBACK_1',
  'GOOGLE_GENERATIVE_AI_API_KEY_FALLBACK_2',
] as const;

interface GoogleRoute {
  model: string;
  apiKey?: string;
  keyLabel: string;
}

export interface Grounded {
  text: string;
  sources: unknown[];
}

function modelId(): string {
  return process.env[MODEL_ENV_VAR]?.trim() || DEFAULT_MODEL;
}

function envValues(names: readonly string[]): string[] {
  return names.map((name) => process.env[name]?.trim()).filter((value): value is string => Boolean(value));
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}

function modelIds(): string[] {
  return uniqueValues([modelId(), ...envValues(MODEL_FALLBACK_ENV_VARS)]);
}

function apiKeyRoutes(): Array<{ apiKey?: string; keyLabel: string }> {
  return [
    { keyLabel: 'primary' },
    ...envValues(API_KEY_FALLBACK_ENV_VARS).map((apiKey, index) => ({
      apiKey,
      keyLabel: `fallback key ${index + 1}`,
    })),
  ];
}

function providerFor(apiKey: string | undefined) {
  return apiKey ? createGoogleGenerativeAI({ apiKey }) : google;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

function nestedErrors(error: unknown): unknown[] {
  if (typeof error !== 'object' || error === null) return [];
  const e = error as { cause?: unknown; lastError?: unknown; errors?: unknown[] };
  return [e.lastError, e.cause, ...(Array.isArray(e.errors) ? e.errors : [])].filter(Boolean);
}

function deepErrorText(error: unknown, seen = new Set<unknown>()): string {
  if (seen.has(error)) return '';
  seen.add(error);
  return [errorText(error), ...nestedErrors(error).map((nested) => deepErrorText(nested, seen))]
    .filter(Boolean)
    .join(' ');
}

function statusCode(error: unknown): number | undefined {
  return deepStatusCode(error);
}

function deepStatusCode(error: unknown, seen = new Set<unknown>()): number | undefined {
  if (seen.has(error)) return undefined;
  seen.add(error);

  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const code = (error as { statusCode?: number }).statusCode;
    if (code !== undefined) return code;
  }

  for (const nested of nestedErrors(error)) {
    const code = deepStatusCode(nested, seen);
    if (code !== undefined) return code;
  }

  return undefined;
}

function isQuotaError(error: unknown): boolean {
  const message = deepErrorText(error);
  return statusCode(error) === 429 || /quota|RESOURCE_EXHAUSTED/i.test(message);
}

function isUnavailableError(error: unknown): boolean {
  const message = deepErrorText(error);
  return statusCode(error) === 503 || /UNAVAILABLE|high demand/i.test(message);
}

function wrapGoogleError(error: unknown, route: GoogleRoute, models: string[], keyRoutes: Array<{ apiKey?: string }>): never {
  if (isQuotaError(error)) {
    throw new Error(
      `Google Gemini API quota/rate limit was exhausted for model "${route.model}" using the ${route.keyLabel} API key. ` +
        `Set ${API_KEY_FALLBACK_ENV_VARS.join(' and ')} to backup Google AI keys, or increase quota for your Google AI project. ` +
        `Configured fallback keys available: ${Math.max(0, keyRoutes.length - 1)}. ` +
        `Original error: ${deepErrorText(error)}`,
      { cause: error },
    );
  }

  if (isUnavailableError(error)) {
    throw new Error(
      `Google Gemini model "${route.model}" is unavailable or under high demand. ` +
        `Tried models: ${models.join(', ')}. ` +
        `Set ${MODEL_FALLBACK_ENV_VARS.join(' and ')} to backup model IDs. ` +
        `Original error: ${deepErrorText(error)}`,
      { cause: error },
    );
  }

  throw error;
}

async function runWithGoogleFallback<T>(call: (route: GoogleRoute) => Promise<T>): Promise<T> {
  const models = modelIds();
  const keyRoutes = apiKeyRoutes();
  let modelIndex = 0;
  let keyIndex = 0;

  while (true) {
    const keyRoute = keyRoutes[keyIndex];
    const route: GoogleRoute = { model: models[modelIndex], ...keyRoute };

    try {
      return await call(route);
    } catch (error) {
      if (isQuotaError(error) && keyIndex + 1 < keyRoutes.length) {
        keyIndex += 1;
        console.warn(`Google Gemini returned 429/quota for ${route.model}; retrying with ${keyRoutes[keyIndex].keyLabel}.`);
        continue;
      }

      if (isUnavailableError(error) && modelIndex + 1 < models.length) {
        modelIndex += 1;
        console.warn(`Google Gemini model ${route.model} is unavailable/high demand; retrying with ${models[modelIndex]}.`);
        continue;
      }

      wrapGoogleError(error, route, models, keyRoutes);
    }
  }
}

export async function researchWithSearch(prompt: string): Promise<Grounded> {
  return runWithGoogleFallback(async (route) => {
    const provider = providerFor(route.apiKey);
    const { text, sources } = await generateText({
      model: provider(route.model),
      tools: { google_search: provider.tools.googleSearch({}) },
      prompt,
    });
    return { text, sources: sources ?? [] };
  });
}

export async function structure<T>(prompt: string, schema: ZodType<T>): Promise<T> {
  return runWithGoogleFallback(async (route) => {
    const provider = providerFor(route.apiKey);
    const { object } = await generateObject({
      model: provider(route.model),
      schema,
      prompt,
    });
    return object;
  });
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
