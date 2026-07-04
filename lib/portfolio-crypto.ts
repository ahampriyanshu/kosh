import { z } from 'zod';
import { PortfolioSchema, type Portfolio } from './schemas';

const ENVELOPE_VERSION = 1;
const PBKDF2_ITERATIONS = 210_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export const EncryptedPortfolioEnvelopeSchema = z.object({
  version: z.literal(ENVELOPE_VERSION),
  algorithm: z.literal('AES-GCM'),
  kdf: z.literal('PBKDF2-SHA-256'),
  iterations: z.number().int().positive(),
  salt: z.string(),
  iv: z.string(),
  ciphertext: z.string(),
});
export type EncryptedPortfolioEnvelope = z.infer<typeof EncryptedPortfolioEnvelopeSchema>;

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return Uint8Array.from(Buffer.from(value, 'base64'));
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function getCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is required for portfolio encryption.');
  }
  return globalThis.crypto;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<any> {
  if (!passphrase) throw new Error('PORTFOLIO_KEY is required for encrypted portfolio data.');
  const crypto = getCrypto();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(new TextEncoder().encode(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: toArrayBuffer(salt), iterations },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptPortfolioEnvelope(
  portfolio: Portfolio,
  passphrase: string,
): Promise<EncryptedPortfolioEnvelope> {
  const crypto = getCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(PortfolioSchema.parse(portfolio)));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext)));

  return {
    version: ENVELOPE_VERSION,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };
}

export async function decryptPortfolioEnvelope(
  envelope: unknown,
  passphrase: string,
): Promise<Portfolio> {
  const parsed = EncryptedPortfolioEnvelopeSchema.parse(envelope);
  const salt = base64ToBytes(parsed.salt);
  const iv = base64ToBytes(parsed.iv);
  const key = await deriveKey(passphrase, salt, parsed.iterations);
  const ciphertext = base64ToBytes(parsed.ciphertext);
  const plaintext = await getCrypto().subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext));
  return PortfolioSchema.parse(JSON.parse(new TextDecoder().decode(plaintext)));
}
