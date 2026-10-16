#!/usr/bin/env node
// clawd-new-coat · tools/stamp-credits.cjs · by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
'use strict';
// 把署名写进每一张 GIF / PNG 的文件元数据里：图从仓库里拷出去、丢进别的工程，名字还在文件里。
// 只用 Node 内置模块，不依赖 sharp：PNG 插一个 tEXt 块（Author / Comment），GIF 插一个 Comment Extension。
// 幂等：已经盖过的文件原样跳过。像素一个字节不动，只在元数据层加字。
//
// 用法：node tools/stamp-credits.cjs <目录或文件>…  [--dry]  [--credit "一句话"]
// 缺省那一句（和 README / NOTICE 里可抄的那行一致）：
//   Clawd animations & engine by Luin Luinaris (https://github.com/luinluinaris); outfits by Charlie Luinaris.
//   Unofficial fan work. Clawd (c) Anthropic. Code MIT, art CC BY-NC-SA 4.0.

const fs = require('fs');
const path = require('path');

const DEFAULT_CREDIT =
  'Clawd animations & engine by Luin Luinaris (https://github.com/luinluinaris); outfits by Charlie Luinaris. ' +
  'Unofficial fan work. Clawd (c) Anthropic. Code MIT, art CC BY-NC-SA 4.0.';
const AUTHOR = 'Luin Luinaris';

// ── CRC32（PNG 块尾巴要的那一个）──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
// tEXt 的关键字和正文都要 Latin-1；署名那句是 ASCII，够用。非 ASCII 字符降成 '?'，不冒险写坏文件
function latin1(s) { return Buffer.from(String(s).replace(/[^\x20-\x7e]/g, '?'), 'latin1'); }

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function stampPng(buf, credit) {
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('不是 PNG');
  // 走一遍块：已经有我们的 tEXt 就跳过；记下 IHDR 结束的位置
  let pos = 8; let afterIHDR = -1;
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos); const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') afterIHDR = pos + 12 + len;
    if (type === 'tEXt') {
      const z = data.indexOf(0);
      if (z > 0 && data.toString('latin1', 0, z) === 'Comment' && data.toString('latin1', z + 1) === credit) return null;
    }
    if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (afterIHDR < 0) throw new Error('PNG 没有 IHDR');
  const chunks = [
    pngChunk('tEXt', Buffer.concat([latin1('Author'), Buffer.from([0]), latin1(AUTHOR)])),
    pngChunk('tEXt', Buffer.concat([latin1('Comment'), Buffer.from([0]), latin1(credit)])),
  ];
  return Buffer.concat([buf.subarray(0, afterIHDR), ...chunks, buf.subarray(afterIHDR)]);
}

function gifCommentBlock(text) {
  const body = latin1(text);
  const parts = [Buffer.from([0x21, 0xfe])];
  for (let i = 0; i < body.length; i += 255) {
    const sub = body.subarray(i, Math.min(i + 255, body.length));
    parts.push(Buffer.from([sub.length]), sub);
  }
  parts.push(Buffer.from([0x00]));
  return Buffer.concat(parts);
}

function stampGif(buf, credit) {
  const head = buf.toString('latin1', 0, 6);
  if (head !== 'GIF89a' && head !== 'GIF87a') throw new Error('不是 GIF');
  // 逻辑屏描述符 7 字节；有全局色表就跳过它
  const packed = buf[10];
  const gctSize = packed & 0x80 ? 3 * (1 << ((packed & 0x07) + 1)) : 0;
  const insertAt = 13 + gctSize;
  // 已经盖过？从 insertAt 往后扫注释块（只看最前面连着的扩展块，不解码图像数据）
  let p = insertAt;
  while (p < buf.length && buf[p] === 0x21) {
    const label = buf[p + 1];
    let q = p + 2;
    if (label === 0xf9 || label === 0x01 || label === 0xff) { q += 1 + buf[q]; } // 这些扩展有固定长度的头块
    const subs = [];
    while (q < buf.length && buf[q] !== 0) { subs.push(buf.subarray(q + 1, q + 1 + buf[q])); q += 1 + buf[q]; }
    q += 1;
    if (label === 0xfe && Buffer.concat(subs).toString('latin1') === credit) return null;
    p = q;
  }
  const out = [buf.subarray(0, insertAt), gifCommentBlock(credit), buf.subarray(insertAt)];
  const res = Buffer.concat(out);
  if (head === 'GIF87a') res.write('GIF89a', 0, 'latin1'); // 注释扩展是 89a 的东西
  return res;
}

function* walk(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) { for (const n of fs.readdirSync(p).sort()) yield* walk(path.join(p, n)); }
  else yield p;
}

// 给别的脚本调：传目录或文件的列表，回 { stamped, skipped, other }
function stampTree(targets, credit = DEFAULT_CREDIT, { dry = false } = {}) {
  let stamped = 0, skipped = 0, other = 0;
  for (const t of targets) {
    for (const f of walk(t)) {
      const ext = path.extname(f).toLowerCase();
      if (ext !== '.png' && ext !== '.gif') { other++; continue; }
      const buf = fs.readFileSync(f);
      const out = ext === '.png' ? stampPng(buf, credit) : stampGif(buf, credit);
      if (!out) { skipped++; continue; }
      if (!dry) fs.writeFileSync(f, out);
      stamped++;
    }
  }
  return { stamped, skipped, other };
}

function main(argv) {
  const args = argv.slice(2);
  const dry = args.includes('--dry');
  const ci = args.indexOf('--credit');
  const credit = ci >= 0 ? String(args[ci + 1] || DEFAULT_CREDIT) : DEFAULT_CREDIT;
  const targets = args.filter((a, i) => !a.startsWith('--') && !(ci >= 0 && i === ci + 1));
  if (!targets.length) { console.error('用法：node tools/stamp-credits.cjs <目录或文件>… [--dry] [--credit "一句话"]'); process.exit(2); }
  const { stamped, skipped, other } = stampTree(targets, credit, { dry });
  console.log(`${dry ? '（只看不写）' : ''}盖了 ${stamped} 张，已盖过跳过 ${skipped} 张，不是图跳过 ${other} 个。`);
}

if (require.main === module) main(process.argv);
module.exports = { stampPng, stampGif, stampTree, DEFAULT_CREDIT, crc32 };
