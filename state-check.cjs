// clawds-new-clothes · state-check.cjs · per-move checks by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
'use strict';
// 新动作（states/<id>.cjs）的体检。export.cjs --state <id> --preview 和 check-art.cjs 用的是这同一份：
// 画的人在预览里过了的，整套查一遍也一定过，不用记两套口径。老动作不走这里——它们的不变量写在 check-art.cjs 里，一条没动。
//
// 每一帧查四样，前三样是规格铁律，查出来就算问题（预览退出码 1、check-art 记进 failures）：
//   一、眼睛露着：正面两只、侧身一只、睡着两只都画出来，而且一个像素都没被手、道具、特效盖住——
//       写了 eyes:'hidden' 的帧要在 check.eyesHidden 登记，故意拿东西挡眼睛的帧要在 check.eyesCovered 登记；
//   二、脚底在 273：没有一只脚踩进地里；首帧、以及 jump 为 0 的帧至少一只脚落在基线上（不然人是飘着的），真要离地在 check.airborne 登记；
//   三、首帧能当静态图：暂停、省电、减少动态效果显示的就是第 0 帧，首帧闭着眼看着像睡着了（check.firstFrameEyesClosed 可以放行）；
//       「GIF 首帧 = static 那张 PNG」要编出 GIF 才查得了，在 export.cjs 的预览里查；
//   四、和老动作同一条的帽子离头（脚在地上、身子不倾、帽子没被抬的帧，头顶那一行中段不许透明），check.hatOffHead 放行；
//       帽子躺在地上（tool.hatAside）也要在 check.hatAside 登记。
// 另外两样只提醒不判死：5px 格（自己画的块、手的落点、位移量不在 5 上）和接缝比平常一步大一倍以上。
const W = 300;
const NONE = Object.freeze({ eyesHidden: false, eyesCovered: false, hatOffHead: false, hatAside: false, airborne: false });

// 这一帧登记了哪些白名单；老动作一律空
function allowAt(state, i) {
  const a = state.plugin?.allow;
  if (!a) return NONE;
  return { eyesHidden: a.eyesHidden.has(i), eyesCovered: a.eyesCovered.has(i), hatOffHead: a.hatOffHead.has(i), hatAside: a.hatAside.has(i), airborne: a.airborne.has(i) };
}
const kindOf = (p, n) => Array.isArray(p.eyes) ? p.eyes[n] : p.eyes;
const onGrid = v => Math.round(v) % 5 === 0;
const onRow = v => [0, 3].includes(((Math.round(v) % 5) + 5) % 5);

// 给 check.verify(i, info) 的帮手：part('sign') 找自己画的那块（tag 不用写 @id/ 前缀）、shown('sign') 数它露出来几个像素
function verifyInfo(state, result) {
  const { pixels, layers, meta } = result, prefix = `@${state.id}/`;
  const part = tag => meta.parts.find(q => q.tag === prefix + tag) || null;
  const shown = tag => {
    const q = part(tag); if (!q) return 0;
    const xs = q.polygon.map(pt => pt[0]), ys = q.polygon.map(pt => pt[1]), layer = layers[q.layer];
    let n = 0;
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(W, Math.ceil(Math.max(...ys))); y++)
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(W, Math.ceil(Math.max(...xs))); x++) {
        const k = (y * W + x) * 4;
        if (layer[k + 3] && pixels[k] === layer[k] && pixels[k + 1] === layer[k + 1] && pixels[k + 2] === layer[k + 2]) n++;
      }
    return n;
  };
  return { pixels, layers, meta, pose: meta.pose, part, parts: () => meta.parts.filter(q => q.tag.startsWith(prefix)), shown };
}

function checkFrame(state, i, result, { order } = {}) {
  const { pixels, layers, meta } = result, p = meta.pose, allow = allowAt(state, i), problems = [], grid = [];
  // 每条问题开头写它属于哪一项（眼睛 / 脚底 / 首帧 / 帽子 / 自查），预览的 checks 按这个数
  const say = (kind, message) => problems.push(`${kind} · 第 ${i} 帧：${message}`);
  // 一、眼睛露着
  const need = p.side && !p.sleep ? 1 : 2, drawn = meta.eyeSprite.visible;
  if (drawn < need && !allow.eyesHidden) say('眼睛', `眼睛只画了 ${drawn}/${need} 只——eyes 写了 hidden 的帧要在 check.eyesHidden 登记`);
  let covered = 0; const over = new Set();
  for (let k = 0; k < pixels.length; k += 4) {
    if (!layers.eyes[k + 3] || (pixels[k] === layers.eyes[k] && pixels[k + 1] === layers.eyes[k + 1] && pixels[k + 2] === layers.eyes[k + 2])) continue;
    covered++;
    if (order) for (const name of order.slice(order.indexOf('eyes') + 1)) if (layers[name]?.[k + 3]) over.add(name);
  }
  if (covered && !allow.eyesCovered) say('眼睛', `眼睛被盖住 ${covered} 个像素${over.size ? `（压在上面的是 ${[...over].join(' / ')} 层）` : ''}——是故意挡的就在 check.eyesCovered 登记`);
  // 二、脚底在 273
  const bottoms = meta.parts.filter(q => q.tag.startsWith('foot-')).map(f => Math.round(f.y + f.h));
  if (bottoms.some(b => b > 273)) say('脚底', `脚踩进地里了：脚底 ${bottoms.join(' / ')}，基线是 273（jump 只能是 0 或负的）`);
  else if (!bottoms.includes(273) && (i === 0 || p.jump === 0) && !allow.airborne)
    say('脚底', i === 0 ? `首帧四只脚都不在基线 273 上（脚底 ${bottoms.join(' / ')}）——静图就是这一帧，他会飘在半空；真要离地（被抱起来那种）在 check.airborne 登记 0`
      : `jump 是 0 四只脚却都抬着（脚底 ${bottoms.join(' / ')}），人悬在半空——要离地就给 jump，或者在 check.airborne 登记`);
  // 三、首帧能当静态图
  if (i === 0) {
    const open = meta.parts.filter(q => q.tag.startsWith('eye-')).map(q => kindOf(p, +q.tag.slice(4) - 1)).filter(k => k !== 'closed');
    if (!open.length && !state.plugin?.firstFrameEyesClosed) say('首帧', '首帧闭着眼（或者眼睛没画）：暂停、省电、减少动态效果都只显示这一帧，看着像睡着了——挪一挪让首帧睁眼，真要闭着就写 check.firstFrameEyesClosed: true');
  }
  // 四、帽子离头：和 check-art 的 hatGapPixels 同一条
  let gap = 0;
  const b = meta.body, headRow = Math.round(b.y) - 1;
  if (!p.sleep && !p.tool.hatAside && p.jump === 0 && p.lean === 0 && !p.tool.hatLift && !p.tool.hatTilt && headRow >= 0)
    for (let x = Math.round(b.x) + 30; x < Math.round(b.x) + Math.round(b.w) - 30; x++) if (pixels[(headRow * W + x) * 4 + 3] === 0) gap++;
  if (gap && !allow.hatOffHead) say('帽子', `帽子离头：头顶 y=${headRow} 那一行露出 ${gap} 个透明像素——是设计（吓飞、被风吹起来）就在 check.hatOffHead 登记`);
  if (p.tool.hatAside && !allow.hatAside) say('帽子', '帽子躺在地上（tool.hatAside）的帧要在 check.hatAside 登记');
  // 这一支自己的不变量
  if (state.plugin?.verify) {
    let out;
    try { out = state.plugin.verify(i, verifyInfo(state, result)); }
    catch (error) { out = `check.verify 自己出错了：${error.message}`; }
    for (const message of [].concat(out || [])) if (message) say('自查', String(message));
  }
  // 5px 格（只提醒）：自己画的不转角的块、两只手的落点、几个位移量
  for (const q of result.paintRects || []) {
    if (q.transform && q.transform.a) continue;
    if (!onGrid(q.x) || !onGrid(q.w) || !onGrid(q.h) || !onRow(q.y)) grid.push(`${q.layer} 层 ${q.tag ? q.tag.split('/').pop() + ' ' : ''}(${q.x}, ${q.y}) ${q.w}×${q.h}`);
  }
  meta.pose.hands.forEach((h, n) => { if (!onGrid(h.x) || !onRow(h.y)) grid.push(`${n ? '右' : '左'}手画在 (${h.x}, ${h.y})`); });
  for (const k of ['dx', 'jump', 'squash', 'gazeX', 'gazeY']) if (!onGrid(p[k])) grid.push(`${k} ${p[k]}`);
  return { problems, grid, coveredEyePixels: allow.eyesCovered ? 0 : covered, hatGapPixels: allow.hatOffHead ? 0 : gap };
}

// 肢体坐标：和 check-art 的接缝口径一模一样（身子三量、两只手、四只脚抬多高）
const limbCoordinates = p => [p.dx, p.jump, p.squash, ...p.hands.flatMap(h => [h.x, h.y]), ...p.feet];

// 整支查一遍：frameAt(i) 给第 i 帧的 render 结果；renderOther(id, i) 给别的状态的帧（segments 的 next、handoff 两头对照用）
function checkState(state, frameAt, { order, renderOther } = {}) {
  const problems = [], warnings = [], gridFrames = new Map(), coords = [], hashes = [];
  for (let i = 0; i < state.frames; i++) {
    const result = frameAt(i), report = checkFrame(state, i, result, { order });
    problems.push(...report.problems);
    for (const g of report.grid) { const key = g.replace(/\(\d+, -?\d+\)|-?\d+(\.\d+)?/g, '#'); if (!gridFrames.has(key)) gridFrames.set(key, { sample: g, frames: [] }); gridFrames.get(key).frames.push(i); }
    coords.push(limbCoordinates(result.meta.pose));
    hashes.push(result.pixels);
  }
  for (const { sample, frames } of gridFrames.values()) warnings.push(`不在 5px 格上：${sample}（第 ${compact(frames)} 帧）`);
  // 接缝：末帧接回首帧那一步，和 check-art 一样比片子里最大的一步、比中位数
  const steps = coords.slice(1).map((c, i) => Math.max(...c.map((v, n) => Math.abs(v - coords[i][n]))));
  const maxStep = Math.max(0, ...steps), seam = Math.max(...coords.at(-1).map((v, n) => Math.abs(v - coords[0][n])));
  const sorted = [...steps].sort((a, b) => a - b), median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  if (seam > maxStep + 1) problems.push(`接缝 · 末帧接回首帧一步就是 ${seam}，比片子里最大的一步 ${maxStep} 还大——GIF 无限循环，这一下每圈都会跳`);
  else if (median > 0 && seam / median > 2 && !(Number.isFinite(state.seamStep) && seam <= state.seamStep)) warnings.push(`接缝 ${seam} 是平常一步（中位 ${median}）的 ${(seam / median).toFixed(2)} 倍；是设计内的一帧甩手就在模块里写 seamStep: ${seam}`);
  // 分段：能循环的段末帧接回段首肢体接缝为零；写了 next 的段末帧和 next 的第 0 帧逐像素全等
  for (const seg of state.segments || []) {
    const limb = Math.max(...coords[seg.to].map((v, n) => Math.abs(v - coords[seg.from][n])));
    if (seg.loop && limb !== 0) problems.push(`分段 · 段 ${seg.id}（${seg.from}–${seg.to}）是 loop，可段末接回段首肢体还差 ${limb}`);
    if (seg.next) {
      const other = renderOther?.(seg.next, 0);
      if (!other) problems.push(`分段 · 段 ${seg.id} 的 next 是 ${seg.next}，可没有这个状态`);
      else if (!other.pixels.equals(hashes[seg.to])) problems.push(`分段 · 段 ${seg.id} 末帧 ${seg.to} 和 ${seg.next} 的第 0 帧不是逐像素全等，切过去会跳`);
    }
  }
  // 过渡（handoff）：两头的状态得存在；首帧接得上 from 的第 0 帧、末帧接得上 to 的第 0 帧最好，不全等只提醒
  if (state.handoff && renderOther) {
    for (const [end, other, frame] of [['from', state.handoff.from, 0], ['to', state.handoff.to, state.frames - 1]]) {
      const r = renderOther(other, 0);
      if (!r) problems.push(`过渡 · handoff.${end} 是 ${other}，可没有这个状态`);
      else if (!r.pixels.equals(hashes[frame])) warnings.push(`handoff：第 ${frame} 帧和 ${other} 的第 0 帧不是逐像素全等，切${end === 'from' ? '进来' : '出去'}那一下会跳`);
    }
  }
  return { id: state.id, file: state.plugin?.file || null, frames: state.frames, problems, warnings, maxAdjacentMotion: maxStep, loopSeamMotion: seam, medianStep: median };
}
function compact(frames) {
  const out = []; let a = frames[0], b = frames[0];
  for (const f of frames.slice(1).concat([null])) { if (f === b + 1) { b = f; continue; } out.push(a === b ? `${a}` : `${a}–${b}`); a = b = f; }
  return out.join('、');
}

module.exports = { allowAt, checkFrame, checkState, limbCoordinates, verifyInfo, NONE };
