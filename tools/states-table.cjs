// clawds-new-clothes · tools/states-table.cjs · tools by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 动作总表：把 manifest.json 里的 48 支排成 docs/states.md 那一张表——id、中文、英文、组、帧数、一圈多久、关键帧、表情包定帧、段、来路。
// 搬出来住那天写的：家里的说明散在一本很厚的开发日记里，外面来的人想先知道「都有哪些动作」，一张表就够了。
// manifest 是 npm run export 现出的，所以先导出再跑这个；新动作进了 states/ 记得在 EN 和 ORIGIN 里各补一行，没补的照样出表，英文那格先空着、来路写「新画」。
// 跑法：npm run export && node tools/states-table.cjs [输出路径]（默认 docs/states.md）
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'docs/states.md');
const MANIFEST = path.join(ROOT, 'manifest.json');
// 新克隆里没有 manifest（它在 .gitignore 里），照表直接跑会吐一串 ENOENT 的堆栈，像脚本坏了；先说一句人话再走
if (!fs.existsSync(MANIFEST)) {
  console.error('还没有 manifest.json：先跑 npm run export，再跑这个 · manifest.json not found, run `npm run export` first');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const EN = {
  idle: 'Idle', typing: 'Typing', thinking: 'Checking the pocket watch', happy: 'Happy', notification: 'Ringing the bell, a letter for you',
  sleeping: 'Sleeping', building: 'Hammering', juggling: 'Juggling', sweeping: 'Sweeping', carrying: 'Carrying', error: 'Error',
  walking: 'Walking', listening: 'Listening to music', strolling: 'Strolling', running: 'Running', sprinting: 'Sprinting',
  hopping: 'Hopping', jumping: 'Charged jump', leaping: 'Leaping forward', 'front-running': 'Running toward you', greeting: 'Tipping the hat',
  delighted: 'Heart hop', hugged: 'Being hugged', fishing: 'Fishing', writing: 'Writing a letter', yawning: 'Yawning', dice: 'Rolling dice',
  reading: 'Reading a letter', stargazing: 'Stargazing', phone: 'On the phone', painting: 'Painting', dizzy: 'Dizzy', blushing: 'Blushing',
  teary: 'Teary', pouting: 'Pouting', lantern: 'Holding a lantern', pointing: 'Pointing the way', waving: 'Waving', umbrella: 'Umbrella',
  stretching: 'Stretching, waking up', confused: 'Confused', 'heart-gift': 'Heart gift', 'hug-please': 'Hug, please', laughing: 'Laughing',
  'sign-no': '"No" sign', 'sign-yes': '"Yes" sign', surprised: 'Surprised', sweating: 'Sweating'
};
// 来路：v6 原型里的 22 支在 v7 一帧一帧重做；后面每一版新画的接在 STATES 末尾，第一批住在 states/ 里，一支一个文件
const V6 = ['idle', 'typing', 'thinking', 'happy', 'notification', 'sleeping', 'building', 'juggling', 'sweeping', 'carrying', 'error', 'walking',
  'listening', 'strolling', 'running', 'sprinting', 'hopping', 'jumping', 'leaping', 'front-running', 'greeting', 'delighted'];
const ORIGIN = Object.fromEntries([
  ...V6.map(id => [id, 'v6 → v7 redrawn · 逐帧重做']),
  ...['hugged', 'fishing', 'writing', 'yawning', 'dice'].map(id => [id, 'v7 new · 新画']),
  ...['reading', 'stargazing', 'phone', 'painting', 'dizzy', 'blushing', 'teary', 'pouting'].map(id => [id, 'v8 new · 新画']),
  ...['lantern', 'pointing', 'waving', 'umbrella', 'stretching'].map(id => [id, 'v9 new · 新画']),
  ...['confused', 'heart-gift', 'hug-please', 'laughing', 'sign-no', 'sign-yes', 'surprised', 'sweating'].map(id => [id, 'batch 1 · 第一批'])
]);
const groupLabel = Object.fromEntries(manifest.groups.map(g => [g.id, g.label]));
const seconds = ms => `${Number((ms / 1000).toFixed(2))} s`;
const segs = s => [
  ...(s.segments || []).map(seg => `${seg.id} ${seg.from}–${seg.to}${seg.next ? ` → ${seg.next}` : ''}`),
  ...(s.handoff ? [`handoff ${s.handoff.from} → ${s.handoff.to}`] : [])
].join('<br>') || '';

const rows = manifest.states.map(s => `| \`${s.id}\` | ${s.label} | ${EN[s.id] || ''} | ${s.group} · ${groupLabel[s.group] || ''} | ${s.frameCount} | ${seconds(s.durationMs)} | ${s.keyframeCount} | ${s.stickerFrame ?? 0} | ${segs(s)} | ${ORIGIN[s.id] || '新画'} |`);
const t = manifest.totals;
const md = `<!-- tools/states-table.cjs 从 manifest.json 生成，别手改：改了动作就 npm run export，再 node tools/states-table.cjs -->
# 48 个动作 · All moves

${t.states} moves, ${t.frames} frames, ${t.keyframes} keyframes. Every GIF is 300 × 300, loops forever, and plays at 70 / 60 / 70 ms per frame.
The PNG in \`static/\` is always frame 0, for paused, low-power and reduced-motion views. The sticker still uses \`stickerFrame\` instead.

一共 ${t.states} 支、${t.frames} 帧、${t.keyframes} 个关键帧。每支 GIF 都是 300 × 300、无限循环、每帧 70 / 60 / 70 毫秒轮着来；
\`static/\` 里的 PNG 一律是第 0 帧（暂停、省电、减少动态效果用它），贴纸的静图取「表情包定帧」那一帧。

| id | 中文 | English | 组 · group | 帧 | 一圈 | 关键帧 | 表情包定帧 | 段 · segments | 来路 · origin |
|---|---|---|---|---:|---:|---:|---:|---|---|
${rows.join('\n')}

- **段**：能单独拿出来放的一段，帧号含两头。\`once\` 放一遍就接 \`→\` 后面那个动作的第 0 帧；\`sticker\` 是贴纸只放的那一小圈；\`handoff\` 是两个动作之间的过渡（伸懒腰：睡着 → 待机）。
- **Segments**: frame ranges (inclusive) that can be played on their own. \`once\` plays one time and hands over to the move after \`→\`; \`sticker\` is the short loop used for stickers; \`handoff\` marks a transition between two moves.
- 朝西的指路（\`variants/clawd-pointing-west.*\`）不算进 48 支：左手指、包还在右腰。
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
console.log(`${manifest.states.length} 支 → ${path.relative(ROOT, OUT)}`);
