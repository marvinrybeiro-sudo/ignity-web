'use strict';

/**
 * Minimal, deterministic ZIP writer and reader (no external dependencies).
 *
 * Writer guarantees:
 * - entries sorted by path (byte order of the POSIX path);
 * - fixed DOS timestamp (1980-01-01 00:00:00), no extra fields, no comments;
 * - fixed "version made by" (UNIX) and file mode 0644;
 * - DEFLATE via node:zlib with fixed level, so identical input yields identical bytes.
 *
 * Reader supports STORE (0) and DEFLATE (8) entries without ZIP64, which covers
 * the artifacts produced here and the v1 `dist/` ZIPs.
 */

const zlib = require('node:zlib');

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
const VERSION_NEEDED = 20;
const VERSION_MADE_BY = (3 << 8) | 20; // UNIX, spec 2.0
const FLAG_UTF8 = 0x0800;
const UNIX_FILE_MODE = 0o100644;
const DEFLATE_LEVEL = 9;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function assertSafeEntryName(name) {
  if (
    typeof name !== 'string' ||
    name === '' ||
    name.startsWith('/') ||
    name.includes('\\') ||
    name.split('/').some((part) => part === '..' || part === '')
  ) {
    throw new Error(`Unsafe ZIP entry name: ${JSON.stringify(name)}`);
  }
}

/**
 * @param {{name: string, data: Buffer}[]} entries
 * @returns {Buffer}
 */
function createZip(entries) {
  const sorted = [...entries].sort((a, b) => Buffer.compare(Buffer.from(a.name), Buffer.from(b.name)));
  const seen = new Set();
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const { name, data } of sorted) {
    assertSafeEntryName(name);
    if (seen.has(name)) throw new Error(`Duplicate ZIP entry: ${name}`);
    seen.add(name);

    const nameBuf = Buffer.from(name, 'utf8');
    const compressed = zlib.deflateRawSync(data, { level: DEFLATE_LEVEL });
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(SIG_LOCAL, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);
    local.writeUInt16LE(FLAG_UTF8, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(SIG_CENTRAL, 0);
    central.writeUInt16LE(VERSION_MADE_BY, 4);
    central.writeUInt16LE(VERSION_NEEDED, 6);
    central.writeUInt16LE(FLAG_UTF8, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE((UNIX_FILE_MODE << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + compressed.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(SIG_EOCD, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(sorted.length, 8);
  eocd.writeUInt16LE(sorted.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuf, eocd]);
}

/**
 * @param {Buffer} buf
 * @returns {{name: string, data: Buffer}[]} file entries (directory entries are skipped)
 */
function readZip(buf) {
  let eocdPos = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos < 0) throw new Error('Invalid ZIP: end of central directory not found');

  const count = buf.readUInt16LE(eocdPos + 10);
  let pos = buf.readUInt32LE(eocdPos + 16);
  const entries = [];

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(pos) !== SIG_CENTRAL) throw new Error('Invalid ZIP: bad central directory header');
    const method = buf.readUInt16LE(pos + 10);
    const crc = buf.readUInt32LE(pos + 16);
    const compSize = buf.readUInt32LE(pos + 20);
    const size = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    const name = buf.toString('utf8', pos + 46, pos + 46 + nameLen);
    pos += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith('/')) continue;
    assertSafeEntryName(name);

    if (buf.readUInt32LE(localOffset) !== SIG_LOCAL) throw new Error(`Invalid ZIP: bad local header for ${name}`);
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(start, start + compSize);

    let data;
    if (method === 0) data = Buffer.from(raw);
    else if (method === 8) data = zlib.inflateRawSync(raw);
    else throw new Error(`Unsupported ZIP compression method ${method} for ${name}`);

    if (data.length !== size || crc32(data) !== crc) throw new Error(`Corrupted ZIP entry: ${name}`);
    entries.push({ name, data });
  }

  return entries;
}

module.exports = { createZip, readZip, crc32 };
