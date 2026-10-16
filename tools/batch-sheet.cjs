// clawd-new-coat · tools/batch-sheet.cjs · tools by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 第一批（10/15）八支的总表：给她一眼看完这一批画成了什么样。一支一行，从左到右——
//   中文名（底下一行 id、两三行「什么时候放」）｜首帧放大 2 倍（暂停、省电、减少动态效果显示的就是它，也是 static/ 那张）｜
//   四个关键帧（底下写第几帧、这一下在干什么）｜表情包定帧（模块里的 stickerFrame，manifest 里也有，裁贴纸就取这一帧）。
// 家里那张表在名字后面还有一格「她递的参考格」，裁的是她递来的几张猫咪表情包截图；那几张是别人画的，没跟着搬出来，这一格也就拿掉了。
// 排法借 tools/outfit-sheet.cjs：深蓝底 #0d1430（他常待的那块夜色），只裁他所在的下半区；裁剪框不写死，
// 按这一批每一支每一帧实际画出来的外框量、四周留 6——谁的问号、牌子、小星往外多长一格，框自己跟上，不会切掉半颗星。
// 每格都贴着这一行的底边放，八行的地面一样高，蹦起来的那几格看得出离地多少。
// 跑法：node tools/batch-sheet.cjs [输出路径]
// 默认存到 states/preview/sheet-batch1.png（states/preview/ 不进 git、不进包）
'use strict';
const path = require('node:path');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const { STATES, render } = require(path.join(ROOT, 'engine.cjs'));
const OUT = process.argv[2] || path.join(ROOT, 'states/preview/sheet-batch1.png');
const OUT_DIR = path.dirname(OUT);

// 一支一行：关键帧挑四个最能看出「这一支在干什么」的，都在模块的 keyframes 里；表情包定帧不在这里写，读模块的 stickerFrame
const ROWS = [
  { id: 'surprised', use: ['被点一下', '睡着时被叫醒、听到大新闻'],
    keys: [[15, '砸回来'], [18, '半眼眨'], [41, '缩一下'], [42, '炸开']] },
  { id: 'hug-please', use: ['被按住、拖起来之前', '喊一声「抱抱」'],
    keys: [[3, '合'], [14, '蹬起来'], [15, '= 被抱起来 0'], [24, '没人接，低头']] },
  { id: 'confused', use: ['我想不起来 / 看不懂'],
    keys: [[14, '问号瘪了'], [19, 'loading…'], [30, '往左歪着挠'], [39, '一帧甩回']] },
  { id: 'heart-gift', use: ['收到她递来的券', '回信寄出、说「爱你」'],
    keys: [[3, '送（短的一下）'], [16, '搂紧蹲下'], [22, '落地还举着'], [31, '心砰一下']] },
  { id: 'sweating', use: ['被抓到熬夜', '部署崩了来认错'],
    keys: [[12, '汗往下滑'], [18, '偷看一眼'], [21, '被逮住'], [31, '又扭开']] },
  { id: 'laughing', use: ['揉他（rub、长按）', '被逗笑、下棋她赢了'],
    keys: [[2, '一抽'], [10, '蹦'], [21, '笑瘫'], [23, '捶地']] },
  { id: 'sign-yes', use: ['「好」「收到」', '勾掉一件事'],
    keys: [[7, '晃'], [23, '垂着歇'], [35, '一帧举起'], [37, '蹦到顶']] },
  { id: 'sign-no', use: ['「不行」', '回绝、耍赖'],
    keys: [[12, '看她一眼'], [23, '垂着歇'], [37, '往左摇'], [40, '往右摇']] }
];

const stateOf = (id) => {
  const s = STATES.find((x) => x.id === id);
  if (!s || !s.plugin) throw Error(`${id} 不是 states/ 里的新动作`);
  return s;
};
// 裁剪框：这一批每一支的每一帧都量，四周各留 6
function bbox() {
  let x0 = 300, y0 = 300, x1 = 0, y1 = 0;
  for (const row of ROWS) {
    const s = stateOf(row.id);
    for (let i = 0; i < s.frames; i++) {
      const { pixels } = render(s.id, i);
      for (let y = 0; y < 300; y++) for (let x = 0; x < 300; x++) if (pixels[(y * 300 + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1); }
    }
  }
  const left = Math.max(0, x0 - 6), top = Math.max(0, y0 - 6);
  return { left, top, width: Math.min(300, x1 + 6) - left, height: Math.min(300, y1 + 6) - top };
}
const CROP = bbox();
const PAD = 12, HEAD = 46, NAME_W = 230, CAP = 26;
const ROW_H = CROP.height * 2 + CAP + PAD * 2;
const BG = { r: 13, g: 20, b: 48, alpha: 1 };
const INK = '#edddba', DIM = '#94958d', GOLD = '#dbaa39', RULE = '#1d2850';
const FONT = 'PingFang SC, Hiragino Sans GB, Heiti SC, sans-serif';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (w, h, s, { size = 20, color = INK, anchor = 'middle', x = w / 2 } = {}) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${x}" y="${Math.round(h / 2 + size * 0.36)}" font-family="${FONT}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text></svg>`);
// 举牌那两支的中文名里带 ✅ ❌：librsvg 画不出彩色 emoji（第一版表头上是一块米色方块），表上换成字
const plain = (label) => label.replace('✅', '勾').replace('❌', '叉');
const rule = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: RULE } }).png().toBuffer();

async function frame(id, i, k) {
  const { pixels } = render(id, i);
  const img = await sharp(pixels, { raw: { width: 300, height: 300, channels: 4 } }).extract(CROP).png().toBuffer();
  // 放大只用最近邻：一格就是一格
  return k === 1 ? img : sharp(img).resize(CROP.width * k, CROP.height * k, { kernel: 'nearest' }).png().toBuffer();
}
(async () => {
  const cols = [NAME_W, CROP.width * 2, ...Array(4).fill(CROP.width), CROP.width];
  const xs = cols.reduce((a, w, i) => (a.push(i ? a[i - 1] + cols[i - 1] + PAD : PAD), a), []);
  const W = xs.at(-1) + cols.at(-1) + PAD, H = HEAD + ROWS.length * ROW_H;
  const comps = [];
  ['中文名 · 什么时候放', '首帧（放大 2 倍）', '关键帧', '', '', '', '表情包定帧'].forEach((s, c) => {
    if (s) comps.push({ input: text(c === 2 ? cols[2] * 4 + PAD * 3 : cols[c], HEAD, s), left: xs[c], top: 0 });
  });
  comps.push({ input: await rule(W, 2), left: 0, top: HEAD - 2 });
  for (const [r, row] of ROWS.entries()) {
    const s = stateOf(row.id), sticker = s.stickerFrame ?? 0;
    const top = HEAD + r * ROW_H, floor = top + ROW_H - PAD - CAP;   // 每格贴着这一行的底边放，帧号写在底边下面那一条里
    if (r) comps.push({ input: await rule(W, 1), left: 0, top });
    // 名字格：中文名大字、id 和一圈多少帧小字、底下两行用在哪
    comps.push({ input: text(NAME_W, 40, plain(s.label), { size: 28, anchor: 'start', x: 4 }), left: xs[0], top: top + PAD + 10 });
    comps.push({ input: text(NAME_W, 24, `${s.id} · ${s.frames} 帧`, { size: 16, color: DIM, anchor: 'start', x: 4 }), left: xs[0], top: top + PAD + 54 });
    row.use.forEach((line, n) => comps.push({ input: text(NAME_W, 22, line, { size: 16, color: DIM, anchor: 'start', x: 4 }), left: xs[0], top: top + PAD + 92 + n * 26 }));
    comps.push({ input: await frame(s.id, 0, 2), left: xs[1], top: floor - CROP.height * 2 });
    comps.push({ input: text(cols[1], CAP, '第 0 帧 · static', { size: 15, color: DIM }), left: xs[1], top: floor + 2 });
    for (const [c, [i, what]] of row.keys.entries()) {
      if (!s.keyframes.includes(i)) throw Error(`${s.id} 的第 ${i} 帧不在 keyframes 里`);
      comps.push({ input: await frame(s.id, i, 1), left: xs[2 + c], top: floor - CROP.height });
      comps.push({ input: text(cols[2 + c], CAP, `${i} · ${what}`, { size: 15, color: DIM }), left: xs[2 + c], top: floor + 2 });
    }
    comps.push({ input: await frame(s.id, sticker, 1), left: xs[6], top: floor - CROP.height });
    comps.push({ input: text(cols[6], CAP, `第 ${sticker} 帧`, { size: 16, color: GOLD }), left: xs[6], top: floor + 2 });
  }
  require('node:fs').mkdirSync(OUT_DIR, { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } }).composite(comps).png().toFile(OUT);
  console.log(`${W}×${H}（裁 ${JSON.stringify(CROP)}）→ ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
