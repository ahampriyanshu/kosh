import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const h = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  generateObjectMock: vi.fn(),
  googleSearchMock: vi.fn(() => ({})),
}));

vi.mock('ai', () => ({
  generateText: h.generateTextMock,
  generateObject: h.generateObjectMock,
}));

vi.mock('@ai-sdk/google', () => ({
  google: Object.assign((id: string) => ({ id }), {
    tools: { googleSearch: h.googleSearchMock },
  }),
}));

import { researchWithSearch, structure, generateGroundedObject } from '../../lib/llm';

beforeEach(() => {
  h.generateTextMock.mockReset();
  h.generateObjectMock.mockReset();
  delete process.env.KOSH_GOOGLE_MODEL;
});

describe('llm', () => {
  it('researchWithSearch returns grounded text + sources', async () => {
    h.generateTextMock.mockResolvedValue({ text: 'Nifty up', sources: [{ url: 'x' }] });
    const r = await researchWithSearch('news?');
    expect(r.text).toBe('Nifty up');
    expect(r.sources).toEqual([{ url: 'x' }]);
    expect(h.googleSearchMock).toHaveBeenCalled();
    // model-agnostic: a Gemini model is selected (exact id is configurable via KOSH_GOOGLE_MODEL)
    expect(h.generateTextMock.mock.calls[0][0].model.id).toMatch(/^gemini-/);
  });

  it('structure parses model output through the schema', async () => {
    h.generateObjectMock.mockResolvedValue({ object: { n: 5 } });
    const out = await structure('make n', z.object({ n: z.number() }));
    expect(out).toEqual({ n: 5 });
  });

  it('uses KOSH_GOOGLE_MODEL when provided', async () => {
    process.env.KOSH_GOOGLE_MODEL = 'gemini-custom';
    h.generateObjectMock.mockResolvedValue({ object: { n: 5 } });

    await structure('make n', z.object({ n: z.number() }));

    expect(h.generateObjectMock.mock.calls[0][0].model.id).toBe('gemini-custom');
  });

  it('adds guidance to Google quota errors', async () => {
    h.generateTextMock.mockRejectedValue(
      Object.assign(new Error('RESOURCE_EXHAUSTED: quota exceeded'), { statusCode: 429 }),
    );

    await expect(researchWithSearch('news?')).rejects.toThrow(/KOSH_GOOGLE_MODEL/);
    await expect(researchWithSearch('news?')).rejects.toThrow(/quota/i);
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
