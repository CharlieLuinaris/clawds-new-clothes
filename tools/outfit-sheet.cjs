// clawd-new-coat · tools/outfit-sheet.cjs · tools by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 换装总表：一行一套衣服，旁边是他原样站着，再往右是他穿上以后待机（放大 2 倍看格子）、走路、睡着、挥手、被抱起来。
// 家里那张表最左边还有一格放她画的原稿，她一眼就能对上「我画的」和「他穿上的」，也能看出帽子跟着动作走没走、眼睛露没露。
// 原稿留在家里没跟着搬出来，所以那一格默认不画；手上有自己的原稿，就用 --originals 指过去，文件照 <衣服名>-b.png（正面）、<衣服名>-a.png（背面）起名——
// 每套 b 是正面、a 是背面（10/15 她点破的，之前一直把 a 当正面穿）。正面原样大小放在前头，对的是右边那几格正面的他；
// 背面缩一半放在旁边，对的是「走路」那一格侧身时露出来的后背
// 跑法：node tools/outfit-sheet.cjs [--originals <原稿目录>] [输出路径]
// 默认存到 outfits/preview/sheet-outfits.png（不进 git）；深蓝底 #0d1430 是他常待的那块夜色，看得出深色衣服在真底色上认不认得出来
'use strict';
const path = require('node:path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const { renderVariant } = require(path.join(ROOT, 'engine.cjs'));
const argv = process.argv.slice(2), originalsAt = argv.indexOf('--originals');
if (originalsAt >= 0 && (!argv[originalsAt + 1] || argv[originalsAt + 1].startsWith('--'))) throw Error('node tools/outfit-sheet.cjs [--originals <原稿目录>] [输出路径]');
const ORIGINALS = originalsAt >= 0 ? path.resolve(argv[originalsAt + 1]) : null;
const rest = argv.filter((_, i) => originalsAt < 0 || (i !== originalsAt && i !== originalsAt + 1));
const OUT = rest[0] || path.join(ROOT, 'outfits/preview/sheet-outfits.png');

// 一行一件：a、b 是同一件衣服的背面和正面，不再分两行（上一版把 a、b 当两件，一套占两行，四个 *-b.cjs 也跟着删了）
const ROWS = [
  { outfit: 'aviator', label: '飞行帽', front: 'aviator-b', back: 'aviator-a' },
  { outfit: 'beret', label: '贝雷帽', front: 'beret-b', back: 'beret-a' },
  { outfit: 'nightcap', label: '睡帽', front: 'nightcap-b', back: 'nightcap-a' },
  { outfit: 'winter-fur', label: '风雪帽', front: 'winter-fur-b', back: 'winter-fur-a' }
];
// 动作那几列：和 --preview 前五张同一组帧（待机首帧就是静图；走路第 10 帧侧身；睡着首帧帽子躺地上；挥手第 20 帧手举过帽顶；被抱起来首帧帽子横挪）
const ACTIONS = [['walking', 10, '走路'], ['sleeping', 0, '睡着'], ['waving', 20, '挥手'], ['hugged', 0, '被抱起来']];
// 裁到他所在的下半区：不再写死，每次按这几帧、这几件衣服（含不穿）实际画出来的外框量，四周各留 6——
// 衣服一改，帽子高了宽了（睡帽的绒球挪到 x 55、风雪帽的圆顶顶到 y 148）裁剪框自己跟上，不会切掉半个绒球
function bboxOf(list) {
  let x0 = 300, y0 = 300, x1 = 0, y1 = 0;
  for (const [id, i, outfit] of list) {
    const { pixels } = renderVariant(id, i, outfit ? { outfit } : {});
    for (let y = 0; y < 300; y++) for (let x = 0; x < 300; x++) if (pixels[(y * 300 + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1); }
  }
  const left = Math.max(0, x0 - 6), top = Math.max(0, y0 - 6);
  return { left, top, width: Math.min(300, x1 + 6) - left, height: Math.min(300, y1 + 6) - top };
}
const WEARS = [null, ...ROWS.map((r) => r.outfit)];
const CROP1 = bboxOf(WEARS.flatMap((o) => [['idle', 0, o], ...ACTIONS.map(([id, i]) => [id, i, o])]));   // 1 倍的格子（原样、走路、睡着、挥手、被抱起来）
const CROP2 = bboxOf(WEARS.map((o) => ['idle', 0, o]));                                                     // 穿上待机放大 2 倍那一格：只框待机那一帧
// 原稿格宽 360：正面 b 留 230（她画了东西的外框二百二十来宽，基本不用缩），背面 a 留 120、最多缩到一半
// 没给原稿时最左边那一格只写衣服名，窄成 120
const PAD = 10, HEAD = 44, FRONT_W = 230, BACK_W = 120, ORIG_W = ORIGINALS ? FRONT_W + PAD + BACK_W : 120, ROW_H = CROP2.height * 2 + PAD * 2;
const BG = { r: 13, g: 20, b: 48, alpha: 1 };
const INK = '#edddba', DIM = '#94958d', RULE = '#1d2850';
const FONT = 'PingFang SC, Hiragino Sans GB, Heiti SC, sans-serif';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (w, h, s, { size = 20, color = INK, anchor = 'middle', x = w / 2 } = {}) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${x}" y="${Math.round(h / 2 + size * 0.36)}" font-family="${FONT}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text></svg>`);
const rule = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: RULE } }).png().toBuffer();

async function frame(id, i, outfit, crop, k) {
  const { pixels } = renderVariant(id, i, outfit ? { outfit } : {});
  const img = sharp(pixels, { raw: { width: 300, height: 300, channels: 4 } }).extract(crop);
  // 放大只用最近邻：一格就是一格，放大了看的是她要的像素，不是糊开的边
  return k === 1 ? img.png().toBuffer() : sharp(await img.png().toBuffer()).resize(crop.width * k, crop.height * k, { kernel: 'nearest' }).png().toBuffer();
}

// 原稿（只在给了 --originals 时画）：先裁到她画了东西的那一块，再按格子缩（只缩不放，缩用最近邻，她的 2px 格缩下来还是方的）。
// maxScale 给背面用：背面封顶缩一半，正好她一格 2px 缩成 1px，比随便缩个 0.55 不会一格宽一格窄
async function original(name, maxW, maxH, maxScale = 1) {
  const file = path.join(ORIGINALS, name + '.png');
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const w = x1 - x0 + 1, h = y1 - y0 + 1, s = Math.min(maxScale, maxW / w, maxH / h);
  const buf = await sharp(file).extract({ left: x0, top: y0, width: w, height: h }).resize(Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), { kernel: 'nearest' }).png().toBuffer();
  return { buf, w: Math.round(w * s), h: Math.round(h * s) };
}

(async () => {
  const cols = [ORIG_W, CROP1.width, CROP2.width * 2, ...ACTIONS.map(() => CROP1.width)];
  const xs = cols.reduce((a, w, i) => (a.push(i ? a[i - 1] + cols[i - 1] + PAD : PAD), a), []);
  const W = xs.at(-1) + cols.at(-1) + PAD, H = HEAD + ROWS.length * ROW_H;
  const comps = [];
  // 表头
  [ORIGINALS ? '她的原稿 · 正面 b ｜ 背面 a' : '衣服', '他原样 · 待机', '穿上 · 待机（放大 2 倍）', ...ACTIONS.map((a) => a[2])].forEach((s, c) => comps.push({ input: text(cols[c], HEAD, s), left: xs[c], top: 0 }));
  comps.push({ input: await rule(W, 2), left: 0, top: HEAD - 2 });
  for (const [r, row] of ROWS.entries()) {
    const top = HEAD + r * ROW_H, floor = top + ROW_H - PAD;   // 每格贴着这一行的底边放，地面大致齐平
    if (r) comps.push({ input: await rule(W, 1), left: 0, top });
    // 原稿格：左上角写这是哪一套，下面摆她的图——正面 b 在前、原样大小；背面 a 在旁边、小一号，头上各标一行是哪一面
    comps.push({ input: text(ORIG_W, 30, row.label, { size: 18, color: DIM, anchor: 'start', x: 4 }), left: xs[0], top: top + 4 });
    if (ORIGINALS) {
      const room = ROW_H - PAD * 2 - 30, cap = 20;
      const front = await original(row.front, FRONT_W, room - cap);
      const back = await original(row.back, BACK_W, Math.round((room - cap) * 0.6), 0.5);
      const fx = xs[0] + Math.round((FRONT_W - front.w) / 2), bx = xs[0] + FRONT_W + PAD + Math.round((BACK_W - back.w) / 2);
      comps.push({ input: front.buf, left: fx, top: floor - front.h });
      comps.push({ input: back.buf, left: bx, top: floor - back.h });
      comps.push({ input: text(FRONT_W, cap, '正面 b', { size: 13, color: DIM }), left: xs[0], top: floor - front.h - cap });
      comps.push({ input: text(BACK_W, cap, '背面 a', { size: 13, color: DIM }), left: xs[0] + FRONT_W + PAD, top: floor - back.h - cap });
    }
    comps.push({ input: await frame('idle', 0, null, CROP1, 1), left: xs[1], top: floor - CROP1.height });
    comps.push({ input: await frame('idle', 0, row.outfit, CROP2, 2), left: xs[2], top: floor - CROP2.height * 2 });
    for (const [c, [id, i]] of ACTIONS.entries()) comps.push({ input: await frame(id, i, row.outfit, CROP1, 1), left: xs[3 + c], top: floor - CROP1.height });
  }
  require('node:fs').mkdirSync(path.dirname(OUT), { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } }).composite(comps).png().toFile(OUT);
  console.log(`${W}×${H} → ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
