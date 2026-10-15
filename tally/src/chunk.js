import { sha256 } from '@noble/hashes/sha2.js';
import {
  b64ToBytes,
  bytesToB64,
  concat,
  equal,
  readU16,
  readU32,
  utf8,
  utf8Decode,
  writeU16,
  writeU32,
} from './bytes.js';

export const HEADER_NAME = 'stl:h';
const PREFIX = 'stl:';
const RAW_CHUNK = 48;
const MAX_CHUNKS = 99;

function chunkName(index) {
  return `${PREFIX}${index.toString(16).padStart(2, '0')}`;
}

function toEntry(bytes) {
  if (bytes.length > RAW_CHUNK) throw new Error('Chunk is too large');
  const text = bytesToB64(bytes);
  if (text.length > 64) throw new Error('Chunk is too large');
  return text;
}

function fromEntry(ascii) {
  return b64ToBytes(ascii);
}

export function planEntries(envelopeText, existingNames = []) {
  const bytes = utf8(envelopeText);
  const chunks = [];
  for (let i = 0; i < bytes.length; i += RAW_CHUNK) {
    chunks.push(bytes.subarray(i, i + RAW_CHUNK));
  }
  if (chunks.length > MAX_CHUNKS) {
    throw new Error(
      'The tally is too large for Stellar account data. Export a JSON backup or switch to the GitHub Gist fallback.',
    );
  }
  const header = new Uint8Array(42);
  header.set(utf8('STL1'), 0);
  writeU16(header, 4, chunks.length);
  writeU32(header, 6, bytes.length);
  header.set(sha256(bytes), 10);

  const writes = [{ name: HEADER_NAME, value: toEntry(header) }];
  chunks.forEach((chunk, index) => {
    writes.push({ name: chunkName(index), value: toEntry(chunk) });
  });
  const keep = new Set(writes.map((op) => op.name));
  const deletes = [];
  for (const name of existingNames) {
    if (name.startsWith(PREFIX) && !keep.has(name)) deletes.push({ name, value: null });
  }
  return { writes, deletes };
}

export function batchEntries(writes, deletes) {
  if (writes.length > 100) {
    throw new Error(
      'The tally is too large for one Stellar transaction. Export a JSON backup or switch to the GitHub Gist fallback.',
    );
  }
  const room = 100 - writes.length;
  const batches = [[...writes, ...deletes.slice(0, room)]];
  for (let i = room; i < deletes.length; i += 100) {
    batches.push(deletes.slice(i, i + 100));
  }
  return batches.filter((batch) => batch.length > 0);
}

export function envelopeFromData(data) {
  const headerAscii = data[HEADER_NAME];
  if (!headerAscii) return null;
  const header = fromEntry(headerAscii);
  if (header.length < 42) throw new Error('The Stellar tally header is damaged');
  const magic = utf8Decode(header.subarray(0, 4));
  if (magic !== 'STL1') throw new Error('The Stellar tally header is damaged');
  const count = readU16(header, 4);
  const total = readU32(header, 6);
  const hash = header.subarray(10, 42);
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const piece = data[chunkName(i)];
    if (!piece) throw new Error(`Missing Stellar tally chunk ${i}`);
    parts.push(fromEntry(piece));
  }
  const all = concat(parts);
  if (all.length !== total) throw new Error('The Stellar tally length does not match');
  if (!equal(sha256(all), hash)) throw new Error('The Stellar tally checksum does not match');
  return utf8Decode(all);
}

export function maxEnvelopeBytes() {
  return RAW_CHUNK * MAX_CHUNKS;
}
