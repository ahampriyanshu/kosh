import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const h = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  generateObjectMock: vi.fn(),
  createGoogleGenerativeAIMock: vi.fn(),
  googleSearchMock: vi.fn(() => ({})),
}));

vi.mock('ai', () => ({
  generateText: h.generateTextMock,
  generateObject: h.generateObjectMock,
}));

vi.mock('@ai-sdk/google', () => ({
  google: Object.assign((id: string) => ({ id, apiKey: undefined }), {
    tools: { googleSearch: h.googleSearchMock },
  }),
  createGoogleGenerativeAI: h.createGoogleGenerativeAIMock,
}));

import { researchWithSearch, structure, generateGroundedObject } from '../../lib/llm';

beforeEach(() => {
  h.generateTextMock.mockReset();
  h.generateObjectMock.mockReset();
  h.createGoogleGenerativeAIMock.mockReset();
  h.createGoogleGenerativeAIMock.mockImplementation((options?: { apiKey?: string }) =>
    Object.assign((id: string) => ({ id, apiKey: options?.apiKey }), {
      tools: { googleSearch: h.googleSearchMock },
    }),
  );
  delete process.env.GOOGLE_MODEL;
  delete process.env.GOOGLE_MODEL_FALLBACK_1;
  delete process.env.GOOGLE_MODEL_FALLBACK_2;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY_FALLBACK_1;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY_FALLBACK_2;
});

describe('llm', () => {
  it('researchWithSearch returns grounded text + sources', async () => {
    h.generateTextMock.mockResolvedValue({ text: 'Nifty up', sources: [{ url: 'x' }] });
    const r = await researchWithSearch('news?');
    expect(r.text).toBe('Nifty up');
    expect(r.sources).toEqual([{ url: 'x' }]);
    expect(h.googleSearchMock).toHaveBeenCalled();
    // model-agnostic: a Gemini model is selected (exact id is configurable via GOOGLE_MODEL)
    expect(h.generateTextMock.mock.calls[0][0].model.id).toMatch(/^gemini-/);
  });

  it('structure parses model output through the schema', async () => {
    h.generateObjectMock.mockResolvedValue({ object: { n: 5 } });
    const out = await structure('make n', z.object({ n: z.number() }));
    expect(out).toEqual({ n: 5 });
  });

  it('uses GOOGLE_MODEL when provided', async () => {
    process.env.GOOGLE_MODEL = 'gemini-custom';
    h.generateObjectMock.mockResolvedValue({ object: { n: 5 } });

    await structure('make n', z.object({ n: z.number() }));

    expect(h.generateObjectMock.mock.calls[0][0].model.id).toBe('gemini-custom');
  });

  it('adds guidance to Google quota errors', async () => {
    h.generateTextMock.mockRejectedValue(
      Object.assign(new Error('RESOURCE_EXHAUSTED: quota exceeded'), { statusCode: 429 }),
    );

    await expect(researchWithSearch('news?')).rejects.toThrow(/GOOGLE_GENERATIVE_AI_API_KEY_FALLBACK_1/);
    await expect(researchWithSearch('news?')).rejects.toThrow(/quota/i);
  });

  it('falls back to alternate API keys for 429 errors', async () => {
    process.env.GOOGLE_MODEL = 'gemini-primary';
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_FALLBACK_1 = 'key-1';
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_FALLBACK_2 = 'key-2';
    h.generateObjectMock
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { statusCode: 429 }))
      .mockRejectedValueOnce({ lastError: Object.assign(new Error('quota exceeded'), { statusCode: 429 }) })
      .mockResolvedValueOnce({ object: { n: 5 } });

    const out = await structure('make n', z.object({ n: z.number() }));

    expect(out).toEqual({ n: 5 });
    expect(h.generateObjectMock).toHaveBeenCalledTimes(3);
    expect(h.generateObjectMock.mock.calls.map(([call]) => call.model)).toEqual([
      { id: 'gemini-primary', apiKey: undefined },
      { id: 'gemini-primary', apiKey: 'key-1' },
      { id: 'gemini-primary', apiKey: 'key-2' },
    ]);
  });

  it('falls back to alternate models for 503 errors', async () => {
    process.env.GOOGLE_MODEL = 'gemini-primary';
    process.env.GOOGLE_MODEL_FALLBACK_1 = 'gemini-fallback-1';
    process.env.GOOGLE_MODEL_FALLBACK_2 = 'gemini-fallback-2';
    h.generateObjectMock
      .mockRejectedValueOnce(Object.assign(new Error('UNAVAILABLE'), { statusCode: 503 }))
      .mockRejectedValueOnce({ errors: [Object.assign(new Error('high demand'), { statusCode: 503 })] })
      .mockResolvedValueOnce({ object: { n: 5 } });

    const out = await structure('make n', z.object({ n: z.number() }));

    expect(out).toEqual({ n: 5 });
    expect(h.generateObjectMock).toHaveBeenCalledTimes(3);
    expect(h.generateObjectMock.mock.calls.map(([call]) => call.model)).toEqual([
      { id: 'gemini-primary', apiKey: undefined },
      { id: 'gemini-fallback-1', apiKey: undefined },
      { id: 'gemini-fallback-2', apiKey: undefined },
    ]);
  });

  it('generateGroundedObject runs research then structuring', async () => {
    h.generateTextMock.mockResolvedValue({ text: 'context', sources: [] });
    h.generateObjectMock.mockResolvedValue({ object: { ok: true } });
    const { object, sources } = await generateGroundedObject(
      'research prompt',
      (ctx) => `structure this: ${ctx}`,
      z.object({ ok: z.boolean() }),
    );
    expect(object).toEqual({ ok: true });
    expect(sources).toEqual([]);
    expect(h.generateObjectMock.mock.calls[0][0].prompt).toContain('context');
  });
});
