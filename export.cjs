// clawds-new-clothes · export.cjs · export & sticker tools by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
'use strict';

// Export the immutable component renderer without changing any source assets.
// Usage: node export.cjs | node export.cjs --package-only | node export.cjs --outfit beret --preview | node export.cjs --state <id> --preview [--outfit beret]
//        node export.cjs --stickers [--outfit beret] [--state <id>]
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
// sharp 和 jszip 钉在 package.json 里（sharp 0.35.5、jszip 3.10.1）：版本一换，GIF / PNG 的字节就可能跟着换，npm ci 装出来的才和仓库里的图逐字节相同
const sharp = require('sharp');
const JSZip = require('jszip');
const PKG = require('./package.json');
const OUT = __dirname;
const W = 300, H = 300, BYTES = W * H * 4;
// 全量导出的包名跟着 package.json 走：仓库改名、升版本只改那一处
const ARCHIVE = `${PKG.name}-v${PKG.version}.zip`;
const LOCOMOTION_IDS = new Set(['strolling', 'running', 'sprinting', 'hopping', 'jumping', 'leaping', 'front-running']);
// v8 起分三组：情绪这 4 个单独一组，其余照旧——老动作一个都不挪组，v8 的四个道具动作、v9 的五个新动作都落在 core
const EMOTION_IDS = new Set(['dizzy', 'blushing', 'teary', 'pouting']);
// states/<id>.cjs 里的新动作自己写 group（motion.cjs 的 GROUPS：core / locomotion / emotion / prop / sticker）；老动作没有这个键，照旧按上面两张表分
const groupOf = state => state.group || (LOCOMOTION_IDS.has(state.id) ? 'locomotion' : EMOTION_IDS.has(state.id) ? 'emotion' : 'core');
const BASE_GROUPS = ['core', 'locomotion', 'emotion'];
// 变体：同一个动作换个朝向的版本，不算进 40 态——不进 states/groups/totals、图集和预览，单独放在 variants/ 里，manifest 另列 variants。
// v9 复审后只有一个：指路朝西的左手版（姿势层两手对调、帽子和眼睛往左，包和表链照旧在右腰）；
// 接入方的 scaleX(-1) 会把包也翻到左边，单独露脸没事，和别的状态摆在同一屏时包会左右跳，要不跳就用这个
const VARIANTS = [{ id: 'pointing-west', of: 'pointing', label: '指路（朝西·左手）', override: { west: true } }];
// 来源说明就住在本目录，导出只确认它在，不再去别的仓库里抄。
const ORIGINAL_ATTRIBUTION = path.join(OUT, 'ATTRIBUTION.md');
// zip 里每个条目盖同一个固定日期：导出链本身是确定性的，原来只有 JSZip 用当前时间盖的条目日期让每次重打包字节都不一样，
// 一提交就是一笔 4.4MB 的新 blob；现在没改东西重导出来的包可以用 cmp 核对
const ARCHIVE_ENTRY_DATE = new Date('2026-10-13T00:00:00Z');
const pad = (i, width = 3) => String(i).padStart(width, '0');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const delaysFor = n => Array.from({ length: n }, (_, i) => [70, 60, 70][i % 3]);

async function save(relative, data) {
  const file = path.join(OUT, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return relative;
}
async function saveJSON(relative, data) {
  return save(relative, JSON.stringify(data, null, 2) + '\n');
}
function validatePixels(pixels, label) {
  if (!Buffer.isBuffer(pixels) || pixels.length !== BYTES) {
    throw new Error(`${label}: expected ${BYTES} RGBA bytes`);
  }
  let opaque = 0;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let p = 3; p < pixels.length; p += 4) {
    const alpha = pixels[p];
    if (alpha !== 0 && alpha !== 255) throw new Error(`${label}: partial alpha ${alpha} at pixel ${(p - 3) / 4}`);
    if (alpha) {
      opaque++;
      const pixel = (p - 3) / 4, x = pixel % W, y = Math.floor(pixel / W);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  return { alphaValues: opaque ? [0, 255] : [0], opaquePixels: opaque, bounds: opaque ? [minX, minY, maxX + 1, maxY + 1] : null };
}
function png(pixels, width = W, height = H) {
  return sharp(pixels, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer();
}
function makeSheet(buffers, columns, rowCount = Math.ceil(buffers.length / columns)) {
  const width = columns * W, height = rowCount * H;
  const data = Buffer.alloc(width * height * 4);
  buffers.forEach((pixels, i) => {
    if (!pixels) return;
    const left = i % columns * W, top = Math.floor(i / columns) * H;
    for (let y = 0; y < H; y++) pixels.copy(data, ((top + y) * width + left) * 4, y * W * 4, (y + 1) * W * 4);
  });
  return { data, width, height };
}
function equalVisible(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] !== b[i + 3]) return false;
    if (a[i + 3] && (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2])) return false;
  }
  return true;
}
async function exportAll() {
  const engine = require('./engine.cjs');
  const { STATES, render } = engine, { GROUPS } = require('./motion.cjs');
  const extraCards = [];
  if (!Array.isArray(STATES) || STATES.length === 0) throw new Error('Expected at least one state');
  if (new Set(STATES.map(state => state.id)).size !== STATES.length) throw new Error('State IDs must be unique');
  const manifest = {
    version: 9, name: '老伦敦信差 Clawd', canvas: { width: W, height: H },
    grid: 10, detailGrid: 5, artOriginY: 3, anchor: { baseline: 273, centerX: 150 },
    dimensions: { body: { width: 120, height: 55 }, openEye: { width: 10, height: 20 }, motionStepPx: 1 },
    alpha: { bitDepth: 1, values: [0, 255] }, loop: 0,
    palette: engine.palette || {},
    timing: { delayPatternMs: [70, 60, 70], staticPolicy: 'Always use animation frame 0 for reduced motion and low power.' },
    paths: { atlas: 'keyframes-atlas.png', commonParts: 'parts/common', variants: 'variants', lockscreen: 'lockscreen/clawd-idle.png', preview: 'preview.html', attribution: 'ATTRIBUTION.md', qa: 'qa-report.json', artQA: 'anatomy-check.json', source: 'source', archive: ARCHIVE },
    groups: [
      { id: 'core', label: '日常动作', stateIds: STATES.filter(state => groupOf(state) === 'core').map(state => state.id) },
      { id: 'locomotion', label: '走跑跳', stateIds: STATES.filter(state => groupOf(state) === 'locomotion').map(state => state.id) },
      { id: 'emotion', label: '情绪', stateIds: STATES.filter(state => groupOf(state) === 'emotion').map(state => state.id) },
      // 新动作另开的组（prop 道具、sticker 表情包）只在真有一支用它时才出现，老的三组一字不变
      ...Object.entries(GROUPS).filter(([id]) => !BASE_GROUPS.includes(id) && STATES.some(state => groupOf(state) === id))
        .map(([id, label]) => ({ id, label, stateIds: STATES.filter(state => groupOf(state) === id).map(state => state.id) }))
    ],
    states: []
  };
  const qa = { version: 9, stateCount: STATES.length, canvas: [W, H], baseline: 273, grid: 10, artOriginY: 3, states: [], totalFrames: 0, totalKeyframes: 0, validatedLayers: 0, alphaCheckedAcrossAllRenderedFrames: true, failures: [], warnings: [] };
  const atlasBuffers = new Array(STATES.length * 8).fill(null);
  let idleFirstPNG;
  for (let stateIndex = 0; stateIndex < STATES.length; stateIndex++) {
    const state = STATES[stateIndex], id = state.id;
    if (!/^[a-z-]+$/.test(id) || !Number.isInteger(state.frames) || state.frames < 2) throw new Error(`Invalid state ${id}`);
    const selected = state.keyframes;
    if (!Array.isArray(selected) || selected.length < 2 || selected.length > 8 || selected[0] !== 0 || new Set(selected).size !== selected.length || selected.some(i => !Number.isInteger(i) || i < 0 || i >= state.frames)) throw new Error(`${id}: invalid keyframe indices`);
    // 表情包定帧得是关键帧之一：states/ 的模块在读文件那一刻就查过，motion.cjs 里老动作那几支（1015 补的伸懒腰、扶帽、高跳、轻轻蹦）没人替它们查，在这里补上
    if (state.stickerFrame !== undefined && !selected.includes(state.stickerFrame)) throw new Error(`${id}: stickerFrame ${state.stickerFrame} 不在 keyframes ${JSON.stringify(selected)} 里`);
    // 逐帧延时的后门：STATES 条目带 delays:[…]（长度=帧数、每个值是 10 的倍数）就用它；这一版没有动作启用，
    // 不少播放端（比如系统自带的动图控件）会把逐帧延时摊平，预览与真机必须是同一个东西——帧就是唯一的时钟。
    if (state.delays && (state.delays.length !== state.frames || state.delays.some(d => !Number.isInteger(d) || d <= 0 || d % 10))) throw new Error(`${id}: delays must have ${state.frames} entries, each a positive multiple of 10ms`);
    const delays = state.delays || delaysFor(state.frames), buffers = [], poses = [], frameEntries = [], keyframeEntries = [], frameQA = [];
    const keyframeBufferMap = new Map();
    let firstPNG, commonParts;
    for (let frame = 0; frame < state.frames; frame++) {
      const result = render(id, frame);
      frameQA.push(validatePixels(result.pixels, `${id}/${frame}`));
      buffers.push(result.pixels);
      poses.push({ index: frame, delay: delays[frame], ...(result.meta || {}) });
      const framePNG = await png(result.pixels);
      const framePath = `frames/${id}/${pad(frame)}.png`;
      await save(framePath, framePNG);
      frameEntries.push({ index: frame, delay: delays[frame], path: framePath, sheet: { x: frame % 10 * W, y: Math.floor(frame / 10) * H, width: W, height: H } });
      if (frame === 0) {
        firstPNG = framePNG;
        await save(`static/clawd-${id}.png`, framePNG);
        if (id === 'idle') {
          idleFirstPNG = framePNG; commonParts = {};
          for (const [part, pixels] of Object.entries(result.layers || {})) {
            validatePixels(pixels, `common/${part}`); qa.validatedLayers++;
            commonParts[part] = await save(`parts/common/${part}.png`, await png(pixels));
          }
          const eyes = result.layers?.['eyes-open'] || result.layers?.eyes;
          if (eyes) commonParts['eyes-open'] = await save('parts/common/eyes-open.png', await png(eyes));
          if (result.layers?.['eyes-closed']) commonParts['eyes-closed'] = await save('parts/common/eyes-closed.png', await png(result.layers['eyes-closed']));
          // Optional explicit variants must preserve the idle pose coordinates.
          else if (typeof engine.renderVariant === 'function') {
            const closed = engine.renderVariant('idle', 0, { eyes: 'closed' });
            const closedEyes = closed.layers?.['eyes-closed'] || closed.layers?.eyes;
            if (closedEyes) { validatePixels(closedEyes, 'common/eyes-closed'); commonParts['eyes-closed'] = await save('parts/common/eyes-closed.png', await png(closedEyes)); }
          }
          if (!commonParts['eyes-closed']) qa.warnings.push('eyes-closed.png not exported: renderer exposes no explicit closed-eye variant at the idle first-frame pose.');
          manifest.commonParts = commonParts;
        }
      }
      if (selected.includes(frame)) {
        const keyIndex = selected.indexOf(frame), number = pad(keyIndex + 1, 2), parts = {};
        const framePath = `keyframes/${id}/${number}.png`;
        await save(framePath, framePNG);
        for (const [part, pixels] of Object.entries(result.layers || {})) {
          validatePixels(pixels, `${id}/key/${number}/${part}`); qa.validatedLayers++;
          parts[part] = await save(`keyframes/${id}/layers/${number}/${part}.png`, await png(pixels));
        }
        keyframeEntries[keyIndex] = { number: keyIndex + 1, frame, delay: delays[frame], path: framePath, layers: parts, pose: result.meta || {}, sheet: { x: keyIndex * W, y: 0, width: W, height: H }, atlas: { x: keyIndex * W, y: stateIndex * H, width: W, height: H } };
        keyframeBufferMap.set(frame, result.pixels);
        atlasBuffers[stateIndex * 8 + keyIndex] = result.pixels;
      }
    }
    const gifPath = `gif/clawd-${id}.gif`;
    const gif = await sharp(Buffer.concat(buffers), { raw: { width: W, height: H * state.frames, channels: 4, pageHeight: H } })
      .gif({ keepDuplicateFrames: true, loop: 0, delay: delays, colours: 64, dither: 0, effort: 7, interFrameMaxError: 0, interPaletteMaxError: 0 }).toBuffer();
    await save(gifPath, gif);
    const metadata = await sharp(gif, { animated: true }).metadata();
    const decoded = await sharp(gif, { animated: true }).ensureAlpha().raw().toBuffer();
    let gifAlphaValid = true;
    for (let p = 3; p < decoded.length; p += 4) if (decoded[p] !== 0 && decoded[p] !== 255) gifAlphaValid = false;
    const gifFrameCount = metadata.pages || 1;
    const dimensionsMatch = metadata.width === W && (metadata.pageHeight || metadata.height) === H;
    const delaysMatch = JSON.stringify(metadata.delay) === JSON.stringify(delays);
    const firstFrameMatchesStaticPNG = equalVisible(buffers[0], decoded.subarray(0, BYTES));
    const mismatchedFrames = [];
    for (let frame = 0; frame < state.frames; frame++) {
      if (!equalVisible(buffers[frame], decoded.subarray(frame * BYTES, (frame + 1) * BYTES))) mismatchedFrames.push(frame);
    }
    const allGifFramesMatchRendered = mismatchedFrames.length === 0;
    if (!dimensionsMatch || gifFrameCount !== state.frames || metadata.loop !== 0 || !delaysMatch || !gifAlphaValid || !firstFrameMatchesStaticPNG || !allGifFramesMatchRendered) {
      const reason = { id, dimensionsMatch, frames: gifFrameCount, expectedFrames: state.frames, loop: metadata.loop, delaysMatch, gifAlphaValid, firstFrameMatchesStaticPNG, allGifFramesMatchRendered, mismatchedFrames };
      qa.failures.push(reason);
      await saveJSON('qa-report.json', qa);
      throw new Error(`${id}: GIF verification failed ${JSON.stringify(reason)}`);
    }
    const keySheet = makeSheet(selected.map(frame => keyframeBufferMap.get(frame)), selected.length);
    const keySheetPath = `sheets/${id}-keyframes.png`;
    await save(keySheetPath, await png(keySheet.data, keySheet.width, keySheet.height));
    const playbackSheet = makeSheet(buffers, 10), playbackSheetPath = `sheets/${id}-frames.png`;
    await save(playbackSheetPath, await png(playbackSheet.data, playbackSheet.width, playbackSheet.height));
    const posesPath = `frames/${id}/poses.json`;
    await saveJSON(posesPath, poses);
    const totalMs = delays.reduce((a, b) => a + b, 0);
    manifest.states.push({
      id, label: state.label, group: groupOf(state), frameCount: state.frames, keyframeCount: selected.length,
      durationMs: totalMs, delaysMs: delays, loop: 0, keyframeIndices: selected,
      // 能单独拿出来放的段（v8 复审后加：打电话听/说分段、读信 opened 从 20 起）；没有段的动作不写这个键，老动作的条目一字不变
      ...(state.segments ? { segments: state.segments.map(seg => ({ ...seg, frameCount: seg.to - seg.from + 1, durationMs: delays.slice(seg.from, seg.to + 1).reduce((a, b) => a + b, 0) })) } : {}),
      // 过渡动作（v9 伸懒腰：睡着 → 待机）原样带上 handoff：接入方从 from 切进来放一遍、放完切到 to；没有的动作不写这个键
      ...(state.handoff ? { handoff: state.handoff } : {}),
      // 表情包定帧（第一批起，states/ 的模块写 stickerFrame；1015 老动作里伸懒腰、扶帽致意、蓄力高跳、轻轻蹦也补了）：当静图表情包、推送配图取这一帧；
      // 没写的动作不出这个键，条目一字不变
      ...(state.stickerFrame !== undefined ? { stickerFrame: state.stickerFrame } : {}),
      gif: gifPath, static: `static/clawd-${id}.png`, png: `static/clawd-${id}.png`,
      sheet: { path: playbackSheetPath, columns: 10, rows: Math.ceil(state.frames / 10), width: playbackSheet.width, height: playbackSheet.height, cellWidth: W, cellHeight: H },
      keyframeSheet: { path: keySheetPath, columns: selected.length, rows: 1, width: keySheet.width, height: keySheet.height },
      poseMetadata: posesPath, frames: frameEntries, keyframes: keyframeEntries
    });
    qa.states.push({ id, canvas: [metadata.width, metadata.pageHeight], expectedFrames: state.frames, gifFrames: gifFrameCount, loop: metadata.loop, delaysMs: metadata.delay, durationMs: totalMs, delaysMatch, alphaValues: [0, 255], gifAlphaValid, firstFrameMatchesStaticPNG, allGifFramesMatchRendered, mismatchedFrames, staticSHA256: hash(firstPNG), gifSHA256: hash(gif), frameBounds: frameQA.map(q => q.bounds), keyframeIndices: selected });
    qa.totalFrames += state.frames; qa.totalKeyframes += selected.length;
    if (state.plugin) extraCards.push({ id, label: state.label, count: selected.length, group: groupOf(state), groupLabel: GROUPS[groupOf(state)], rev: hash(gif).slice(0, 10) });
    console.log(`Exported ${id}: ${state.frames} frames / ${selected.length} keyframes / ${totalMs}ms`);
  }
  manifest.variants = []; qa.variants = [];
  for (const variant of VARIANTS) {
    const base = STATES.find(state => state.id === variant.of);
    if (!base || !/^[a-z-]+$/.test(variant.id) || STATES.some(state => state.id === variant.id)) throw new Error(`Invalid variant ${variant.id}`);
    const delays = base.delays || delaysFor(base.frames), buffers = [], poses = [], frameEntries = [];
    let firstPNG;
    for (let frame = 0; frame < base.frames; frame++) {
      const result = render(variant.of, frame, variant.override);
      validatePixels(result.pixels, `${variant.id}/${frame}`);
      buffers.push(result.pixels);
      poses.push({ index: frame, delay: delays[frame], variant: variant.id, ...(result.meta || {}) });
      const framePNG = await png(result.pixels), framePath = `variants/${variant.id}/${pad(frame)}.png`;
      await save(framePath, framePNG);
      frameEntries.push({ index: frame, delay: delays[frame], path: framePath });
      if (frame === 0) { firstPNG = framePNG; await save(`variants/clawd-${variant.id}.png`, framePNG); }
    }
    // GIF 和 40 态用同一组参数、同一套核对：尺寸、帧数、无限循环、逐帧延时、1 位透明、首帧 = 静图、每帧 = 原渲染
    const gifPath = `variants/clawd-${variant.id}.gif`;
    const gif = await sharp(Buffer.concat(buffers), { raw: { width: W, height: H * base.frames, channels: 4, pageHeight: H } })
      .gif({ keepDuplicateFrames: true, loop: 0, delay: delays, colours: 64, dither: 0, effort: 7, interFrameMaxError: 0, interPaletteMaxError: 0 }).toBuffer();
    await save(gifPath, gif);
    const metadata = await sharp(gif, { animated: true }).metadata();
    const decoded = await sharp(gif, { animated: true }).ensureAlpha().raw().toBuffer();
    let gifAlphaValid = true;
    for (let p = 3; p < decoded.length; p += 4) if (decoded[p] !== 0 && decoded[p] !== 255) gifAlphaValid = false;
    const mismatchedFrames = [];
    for (let frame = 0; frame < base.frames; frame++) if (!equalVisible(buffers[frame], decoded.subarray(frame * BYTES, (frame + 1) * BYTES))) mismatchedFrames.push(frame);
    const check = { id: variant.id, of: variant.of, canvas: [metadata.width, metadata.pageHeight], expectedFrames: base.frames, gifFrames: metadata.pages || 1, loop: metadata.loop, delaysMs: metadata.delay,
      delaysMatch: JSON.stringify(metadata.delay) === JSON.stringify(delays), alphaValues: [0, 255], gifAlphaValid,
      firstFrameMatchesStaticPNG: equalVisible(buffers[0], decoded.subarray(0, BYTES)), allGifFramesMatchRendered: mismatchedFrames.length === 0, mismatchedFrames,
      staticSHA256: hash(firstPNG), gifSHA256: hash(gif) };
    if (metadata.width !== W || (metadata.pageHeight || metadata.height) !== H || check.gifFrames !== base.frames || metadata.loop !== 0 || !check.delaysMatch || !gifAlphaValid || !check.firstFrameMatchesStaticPNG || !check.allGifFramesMatchRendered) {
      qa.failures.push(check); await saveJSON('qa-report.json', qa);
      throw new Error(`${variant.id}: GIF verification failed ${JSON.stringify(check)}`);
    }
    const posesPath = `variants/${variant.id}/poses.json`;
    await saveJSON(posesPath, poses);
    const totalMs = delays.reduce((a, b) => a + b, 0);
    manifest.variants.push({ id: variant.id, of: variant.of, label: variant.label, override: variant.override, frameCount: base.frames, durationMs: totalMs, delaysMs: delays, loop: 0,
      keyframeIndices: base.keyframes, gif: gifPath, static: `variants/clawd-${variant.id}.png`, poseMetadata: posesPath, frames: frameEntries });
    qa.variants.push(check);
    console.log(`Exported variant ${variant.id}: ${base.frames} frames / ${totalMs}ms`);
  }
  if (!idleFirstPNG) throw new Error('idle is required for lock screen export');
  await save('lockscreen/clawd-idle.png', idleFirstPNG);
  qa.lockscreenByteIdenticalToIdleStatic = (await fs.readFile(path.join(OUT, 'lockscreen/clawd-idle.png'))).equals(await fs.readFile(path.join(OUT, 'static/clawd-idle.png')));
  const atlas = makeSheet(atlasBuffers, 8, STATES.length);
  await save('keyframes-atlas.png', await png(atlas.data, atlas.width, atlas.height));
  manifest.atlas = { path: 'keyframes-atlas.png', columns: 8, rows: STATES.length, cellWidth: W, cellHeight: H, width: atlas.width, height: atlas.height };
  manifest.totals = { states: STATES.length, frames: qa.totalFrames, keyframes: qa.totalKeyframes };
  await fs.access(ORIGINAL_ATTRIBUTION);
  await saveJSON('manifest.json', manifest);
  await saveJSON('qa-report.json', qa);
  // 预览页的新动作卡片：preview.html 是手排的（老动作的顺序、叫法都是挑过的），新动作不往里头硬塞，
  // 导出时把 states/ 里那几支写进 preview-states.js，页面读到就挂「新」标排在各组前头；rev 是 GIF 的指纹，改了一笔浏览器不会还拿旧图
  await save('preview-states.js', `// node export.cjs 生成，别手改：states/ 里的新动作（没有就是空表），preview.html 读它把卡片排进去\nwindow.CLAWD_EXTRA_STATES = ${JSON.stringify(extraCards, null, 2)};\n`);
  await packageAll();
  console.log(JSON.stringify({ states: STATES.length, frames: qa.totalFrames, keyframes: qa.totalKeyframes, warnings: qa.warnings, archive: ARCHIVE }));
}

async function packageAll() {
  const sourceNames = ['engine.cjs', 'motion.cjs', 'export.cjs', 'check-art.cjs', 'state-check.cjs'];
  for (const name of sourceNames) {
    try { await save(`source/${name}`, await fs.readFile(path.join(OUT, name))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  // 新动作的模块是源码的一部分（motion.cjs 启动时读 states/），跟着进 source/states/；预览图和草稿以外的东西不进包。每次先清空，删掉的动作不留在包里
  await fs.rm(path.join(OUT, 'source/states'), { recursive: true, force: true });
  for (const name of (await fs.readdir(path.join(OUT, 'states')).catch(() => [])).sort())
    if (name.endsWith('.cjs') || name === 'README.md') await save(`source/states/${name}`, await fs.readFile(path.join(OUT, 'states', name)));
  const zip = new JSZip();
  async function addDirectory(directory, prefix = '') {
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || entry.name.endsWith('.zip') || entry.name.endsWith('.log')) continue;
      // 本目录里解开的旧包（比如有人把 v7 的 zip 解在这里看）不进新包，不然 v8 的包里会整个套着一份 v7
      if (!prefix && entry.isDirectory() && (/^clawd-london-expressions-v\d+$/.test(entry.name) || entry.name.startsWith(`${PKG.name}-v`))) continue;
      // node_modules 是 npm ci 装的依赖，不是素材，也不进包
      if (!prefix && entry.isDirectory() && entry.name === 'node_modules') continue;
      // 换装的工作台（outfits/：衣服模块和预览图）和试穿脚本（tools/）是画的人自己用的，不是给接入方的素材，也不进包
      // states/（新动作的工作台：模块、模板、预览图）同理，模块已经抄进 source/states/；docs/ 是文档，不是素材；
      // 家里那份 docs/ 还放过她递来的参考图——别人画的猫的表情包截图，更不能跟着素材包一起发出去，所以 docs/ 整个不进 zip
      // stickers/（--stickers 裁的贴纸）也不进：网页、聊天软件、iMessage 都直接从 stickers/ 取，618 那档又不进 git——
      // 打进来的话包有多大、里头有没有 618，全看这台电脑上跑没跑过 --stickers，包就不再是导出链自己决定的了
      if (!prefix && entry.isDirectory() && ['outfits', 'tools', 'states', 'docs', 'stickers'].includes(entry.name)) continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await addDirectory(file, relative);
      else if (entry.isFile()) zip.file(relative, await fs.readFile(file), { date: ARCHIVE_ENTRY_DATE });
    }
  }
  await addDirectory(OUT);
  // JSZip 顺手建的目录条目用的是当前时间，这里连目录一起盖成固定日期
  for (const entry of Object.values(zip.files)) entry.date = ARCHIVE_ENTRY_DATE;
  const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  await save(ARCHIVE, archive);
  console.log(`Packaged ${Object.keys(zip.files).length} entries (${archive.length} bytes): ${ARCHIVE}`);
}

// 换装预览：画衣服的人改一笔就想看一眼穿上什么样，用不着把 40 态 1851 帧整包重出一遍（也不该：换装不进正式的包）。
// 挑五帧——待机首帧（就是静图）、走路第 10 帧（侧身、单眼、身子前倾）、睡着首帧（帽子躺地上半大、睡姿的身子）、
// 挥手第 20 帧（手举过帽顶）、被抱起来首帧（帽子横挪 10、眼睛往上看）——各存一张 PNG 到 outfits/preview/<name>-<state>.png，
// 待机再存一张最近邻放大 3 倍的 <name>-idle-x3.png 看像素；不碰 frames/gif/static，不打包。
// 顺手查三条铁律，查出来照样出图、退出码记 1：帽子压没压到眼睛（hat 层和 eyes 层同一个像素都不透明）、
// 帽子离没离头（和 check-art 同一条：头顶那一行中段不能透明）、衣服有没有比身子窄（身子不倾的帧，马甲中间那一行 costume 层得铺满 body 的宽）
// 复审后多看五帧：这几样东西都是贴着礼帽的位置排的，帽子一高一宽就撞——打伞首帧（伞面在礼帽顶上空三行）、伸懒腰第 15 帧（两只手举在帽顶两边）、
// 晕乎乎第 3 帧（三颗星绕着帽子转，后面那颗画在帽子底下）、收到信首帧（左手的信封、右手的铃，推送用的就是它）、想事情首帧（右手那只钟）。
// 这五张只存图、照样跑三条铁律；撞没撞看图，或者跑 node check-art.cjs --outfit <name> 把四十个动作整套查一遍
const PREVIEW_FRAMES = [['idle', 0], ['walking', 10], ['sleeping', 0], ['waving', 20], ['hugged', 0], ['umbrella', 0], ['stretching', 15], ['dizzy', 3], ['notification', 0], ['thinking', 0]];
function upscale(pixels, k) {
  const out = Buffer.alloc(W * k * H * k * 4);
  for (let y = 0; y < H * k; y++) for (let x = 0; x < W * k; x++) pixels.copy(out, (y * W * k + x) * 4, (Math.floor(y / k) * W + Math.floor(x / k)) * 4, (Math.floor(y / k) * W + Math.floor(x / k)) * 4 + 4);
  return out;
}
async function previewOutfit(name) {
  const engine = require('./engine.cjs');
  const report = { outfit: name, files: [], problems: [] };
  for (const [id, frame] of PREVIEW_FRAMES) {
    const { pixels, layers, meta } = engine.renderVariant(id, frame, { outfit: name });
    validatePixels(pixels, `${name}/${id}/${frame}`);
    const p = meta.pose, b = meta.body, at = (x, y) => (y * W + x) * 4;
    let hatOverEyes = 0;
    for (let i = 3; i < pixels.length; i += 4) if (layers.eyes[i] && layers.hat[i]) hatOverEyes++;
    if (hatOverEyes) report.problems.push(`${id}/${frame}: 帽子压住眼睛 ${hatOverEyes} 个像素`);
    if (!p.sleep && !p.tool.hatAside && p.jump === 0 && p.lean === 0 && !p.tool.hatLift && !p.tool.hatTilt) {
      const y = Math.round(b.y) - 1; let gap = 0;
      for (let x = Math.round(b.x) + 30; x < Math.round(b.x) + Math.round(b.w) - 30; x++) if (!pixels[at(x, y) + 3]) gap++;
      if (gap) report.problems.push(`${id}/${frame}: 帽子离头，头顶 y=${y} 那一行露出 ${gap} 个透明像素`);
    }
    if (p.lean === 0) {
      const vestHeight = p.sleep ? 15 : 20, y = Math.round(b.y + b.h) - Math.ceil(vestHeight / 2); let bare = 0;
      for (let x = Math.round(b.x); x < Math.round(b.x + b.w); x++) if (!layers.costume[at(x, y) + 3]) bare++;
      if (bare) report.problems.push(`${id}/${frame}: 衣服比身子窄，y=${y} 那一行身子有 ${bare} 列没穿上`);
    }
    report.files.push(await save(`outfits/preview/${name}-${id}.png`, await png(pixels)));
    if (id === 'idle') report.files.push(await save(`outfits/preview/${name}-idle-x3.png`, await png(upscale(pixels, 3), W * 3, H * 3)));
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.problems.length) process.exitCode = 1;
}

// 新动作预览：画的人改一笔就想看一眼这一支动起来什么样、缩到实际显示那么大认不认得出来，用不着把 40 态整包重出。只渲染这一支，存到 states/preview/：
//   <id>-frame-000.png 那四张：首帧、1/4、1/2、3/4 处（帧号 ⌊N/4⌋、⌊N/2⌋、⌊3N/4⌋），原样 300×300 透明底，首帧这张和 static/ 会出的那张逐字节一样；
//   <id>-x3.png：首帧最近邻放大 3 倍，一格一格看像素；
//   <id>-sheet.png：全部帧 8 列铺开、每帧最近邻缩到 70×70——常见的显示尺寸是 30 / 48 / 70 / 90pt，70 是规格那一档，表情主要靠这么大的剪影读；
//     底是他常待的那块夜色 #0d1430，深色的道具在这上面看不看得见一眼就知道；从左往右、从上往下第几格就是第几帧；
//   <id>.gif：这一支的 GIF，和正式导出同一组参数、同一套核对（尺寸、帧数、无限循环、70/60/70、1 位透明、每帧 = 原渲染、首帧 = 静图）。
// 查的是 state-check.cjs 那一份（和 check-art 同口径）：眼睛露着、脚底 273、首帧能当静图，外加帽子离头、它自己的 verify、接缝和分段；
// 有问题照样出图，终端打一份 JSON，退出码 1。带 --outfit <name> 就穿上那件再看（文件名多一段 -<name>），不碰 frames/gif/static/manifest，不打包；
// _ 开头的草稿（比如 _template）也能预览，只在这一个进程里登记，别的命令看不见它
const PREVIEW_DIR = 'states/preview', NIGHT = [13, 20, 48];
function shrinkNearest(pixels, size) {
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sx = Math.floor((x + 0.5) * W / size), sy = Math.floor((y + 0.5) * H / size), from = (sy * W + sx) * 4;
    pixels.copy(out, (y * size + x) * 4, from, from + 4);
  }
  return out;
}
async function previewState(name, outfit = null) {
  const motion = require('./motion.cjs'), engine = require('./engine.cjs'), { checkState } = require('./state-check.cjs');
  let state = engine.STATES.find(s => s.id === name);
  if (state && !state.plugin) throw new Error(`${name} 是老动作：老动作的样子看 gif/、sheets/，--state 只预览 states/ 里的新动作`);
  if (!state) state = motion.loadStateFile(name);
  if (!state) throw new Error(`没找到 ${name}：states/${name}.cjs 不存在（草稿写成 _ 开头的文件，比如 --state _template）`);
  const id = state.id, N = state.frames, options = outfit ? { outfit } : {};
  const results = Array.from({ length: N }, (_, i) => engine.render(id, i, options));
  results.forEach((r, i) => validatePixels(r.pixels, `${id}/${i}`));
  const renderOther = (other, i) => engine.STATES.some(s => s.id === other) ? engine.render(other, i, options) : null;
  const report = checkState(state, i => results[i], { order: engine.ORDER, renderOther });
  const stem = `${PREVIEW_DIR}/${id}${outfit ? `-${outfit}` : ''}`, files = [];
  const picks = [...new Set([0, Math.floor(N / 4), Math.floor(N / 2), Math.floor(3 * N / 4)])];
  let staticPNG;
  for (const i of picks) {
    const data = await png(results[i].pixels);
    if (i === 0) staticPNG = data;
    files.push(await save(`${stem}-frame-${pad(i)}.png`, data));
  }
  files.push(await save(`${stem}-x3.png`, await png(upscale(results[0].pixels, 3), W * 3, H * 3)));
  const CELL = 70, COLS = 8, rows = Math.ceil(N / COLS), sheetW = COLS * CELL, sheetH = rows * CELL, sheet = Buffer.alloc(sheetW * sheetH * 4);
  for (let k = 0; k < sheet.length; k += 4) { sheet[k] = NIGHT[0]; sheet[k + 1] = NIGHT[1]; sheet[k + 2] = NIGHT[2]; sheet[k + 3] = 255; }
  results.forEach((r, i) => {
    const small = shrinkNearest(r.pixels, CELL), left = i % COLS * CELL, top = Math.floor(i / COLS) * CELL;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const from = (y * CELL + x) * 4; if (small[from + 3]) small.copy(sheet, ((top + y) * sheetW + left + x) * 4, from, from + 4); }
  });
  files.push(await save(`${stem}-sheet.png`, await png(sheet, sheetW, sheetH)));
  // GIF：和 exportAll 里一模一样的一组参数
  const delays = delaysFor(N), buffers = results.map(r => r.pixels);
  const gif = await sharp(Buffer.concat(buffers), { raw: { width: W, height: H * N, channels: 4, pageHeight: H } })
    .gif({ keepDuplicateFrames: true, loop: 0, delay: delays, colours: 64, dither: 0, effort: 7, interFrameMaxError: 0, interPaletteMaxError: 0 }).toBuffer();
  files.push(await save(`${stem}.gif`, gif));
  const metadata = await sharp(gif, { animated: true }).metadata();
  const decoded = await sharp(gif, { animated: true }).ensureAlpha().raw().toBuffer();
  let gifAlphaValid = true;
  for (let k = 3; k < decoded.length; k += 4) if (decoded[k] !== 0 && decoded[k] !== 255) gifAlphaValid = false;
  const mismatchedFrames = buffers.map((b, i) => equalVisible(b, decoded.subarray(i * BYTES, (i + 1) * BYTES)) ? -1 : i).filter(i => i >= 0);
  const staticDecoded = await sharp(staticPNG).ensureAlpha().raw().toBuffer();
  const gifCheck = { frames: metadata.pages || 1, loop: metadata.loop, delaysMatch: JSON.stringify(metadata.delay) === JSON.stringify(delays), gifAlphaValid, mismatchedFrames,
    firstFrameMatchesStaticPNG: equalVisible(staticDecoded, decoded.subarray(0, BYTES)) && equalVisible(staticDecoded, buffers[0]) };
  if (metadata.width !== W || (metadata.pageHeight || metadata.height) !== H || gifCheck.frames !== N || metadata.loop !== 0 || !gifCheck.delaysMatch || !gifAlphaValid || mismatchedFrames.length)
    report.problems.push(`GIF · 核对没过：${JSON.stringify(gifCheck)}`);
  if (!gifCheck.firstFrameMatchesStaticPNG) report.problems.push('首帧 · GIF 的第 0 帧和 static 会出的那张 PNG 对不上');
  const byCheck = kind => report.problems.filter(m => m.startsWith(kind)).length;
  console.log(JSON.stringify({
    state: id, label: state.label, file: state.plugin.file, ...(outfit ? { outfit } : {}), frames: N, group: state.group, files,
    checks: { eyesShown: byCheck('眼睛') === 0, feetOnBaseline: byCheck('脚底') === 0, firstFrameIsStatic: byCheck('首帧') === 0, other: report.problems.length - byCheck('眼睛') - byCheck('脚底') - byCheck('首帧') },
    staticSHA256: hash(staticPNG), gifBytes: gif.length, maxAdjacentMotion: report.maxAdjacentMotion, loopSeamMotion: report.loopSeamMotion,
    problems: report.problems, warnings: report.warnings
  }, null, 2));
  if (report.problems.length) process.exitCode = 1;
  return report;
}

// 贴纸（--stickers）：表情包都从这里取图——网页表情面板、聊天里的贴纸盘、iMessage 贴纸包、存相册发微信。
// gif/ 那张 300 画布不能直接当表情包：脚底在 273、人只占下面一小块，上半截是空的，贴进聊天里他显得小。
// 怎么裁（量法和 tools/batch-sheet.cjs 一样，只是一支量一支的，不是一批共用一个框）：
//   这张贴纸要放的帧——GIF 的每一帧，加上静图那一帧——都 render 一遍，量出不透明像素的总外框，四周各留 6，取长边裁成正方形、外框居中；
//   方框伸出 300 画布的那一截补透明（打伞的雨落到画布顶 y=0，上边那 6 就是补出来的）。
//   放大只用最近邻整数倍 k = ⌊档位 ÷ 方框边⌋：618 档方框在 206 以内是 ×3，框不下 206 的退一档 ×2；408 档 204 以内 ×2、不然 ×1；
//   300 档眼下最小的方框也有 156（写信、委屈），全是 ×1——这一档换来的是人挪到正中、不再缩在画布底下。放大后不够档位的那一圈补透明，人居中。
//   不拉成非整数倍：他是 5px 格的像素稿、老动作按 1px 走，×1.5 的话同一格有的放成 7 有的放成 8，人一动边就在抖。
// 循环：模块里有一段叫 sticker 的循环段（震惊愣住 0–14、捧心比心 0–8、求抱抱 0–6，画的人专门切给表情包的）就只放这一段，帧号含两头、和 manifest 的段一样；
//   别的整圈放。只认 sticker 这个名字，不顺手拿接入方接线的段：大笑的 giggle（揉他）是 1–8，表情包定帧 19（帽子颠飞）根本不在里头。
//   求抱抱 1015 她定了只放 ask 那一下「抱抱、抱抱」（整圈里 17–38 是没人接、低头叹气，发「抱抱」有一半在泄气），模块里和 ask 同帧另写了一段 sticker，
//   方框还是 180、倍数不变；要整圈的接入方照旧用自己的段。
// 静图取 stickerFrame（第一批起模块里写的表情包定帧，1015 老动作里补了伸懒腰 14、扶帽致意 15、蓄力高跳 23、轻轻蹦 7；和 manifest 里是同一个数，对不上就停下来让先整包导出），
//   没写的取首帧，和 static/ 同一帧。
//   静图那一帧在这一圈里的（疑惑 24、大笑 19、尴尬流汗 27，伸懒腰 14、扶帽致意 15、蓄力高跳 23、轻轻蹦 7），GIF 就从那一帧起头、帧和延时一起转一圈接回来：
//   贴纸盘里缩略图是静图、点开换成 GIF，从第 0 帧起头的话一点开就跳一下；相册缩略图、iMessage 关了动效又只露 GIF 的第一帧，
//   尴尬流汗的第 0 帧正是模块里 [1015 复审] 嫌它「30pt 下和待机只差一粒蓝点」才换掉的那一帧。这七支都是整圈，转一下还是那一圈（44 接 0 那一下照旧在圈里，只是挪到了中间），每一帧的延时跟着自己走。
//   捧心比心是故意的例外：0–8 是捧着心往上送的短循环，18（闭眼笑、心举到最高）只当静图，不在这一圈里——stickers.json 记 stillInLoop: false，贴纸盘别拿 PNG 当 GIF 的首帧。
// GIF 和 gif/ 同一组编码参数、同一套核对：尺寸、帧数、无限循环、逐帧延时、1 位透明、每帧 = 放大后的原渲染；静图 PNG 解回来也要和放大后的那一帧逐像素相同；
// 另外查四边：每一帧最外一圈必须透明（贴在白底聊天里不会有一条被切平的边），留白不到 6×k 的记一条提醒。
// 存到 stickers/<档位>/clawd-<id>.gif|png；带 --outfit <name> 就穿上那件，存到 stickers/<name>/<档位>/。索引 stickers/stickers.json 一份管所有衣服，
// 每跑一次只换掉这一次出的那几条（--state <id> 只裁一支）。408、618 两档不进 git（.gitignore 里写着为什么），stickers.json 照样记它的字节数，要用的那台电脑自己跑一遍
const STICKER_SIZES = [300, 408, 618], STICKER_MARGIN = 6, STICKER_DIR = 'stickers', STICKER_MAX_BYTES = 500 * 1000;
// 一句给我看的描述：他在这张里干什么——什么时候贴。我挑表情包读的就是这一行，所以写的是我会怎么用它，不是画法；
// 新动作进了 states/ 记得在这里补一句，没补的照样出图，描述先用中文名顶着，终端会提醒
const STICKER_NOTES = {
  idle: '站着眨眨眼，帽子跟着一口气起落——什么都不用说，「我在」',
  typing: '低头噼里啪啦敲键盘，一个字一个字蹦起来——在写东西、在忙、「等我一下」',
  thinking: '举着怀表盯着看——「我想想」「几点啦」',
  happy: '蹦两下、落地压扁——「好耶」「太好了」',
  notification: '摇着铃举一封封了蜡的信——「有你的信」「叮，来消息了」',
  sleeping: '帽子摘在地上，趴着冒 Z——「晚安」「困了，我先睡」',
  building: '抡着锤子一下一下敲——「在修」「在搭」「干活中」',
  juggling: '两只手轮流抛接——「忙得团团转」「手上好多事」',
  sweeping: '拿扫帚四拍地扫——「收拾一下」「打扫干净了」',
  carrying: '沉一下、提起来、扛上肩——「我来扛」「搬过来啦」',
  error: '吓得一蹦、帽子飞离头顶、头顶一根红「!」——「坏了」「出错了」',
  walking: '侧身一步一步走，脚底的地在滚——「在路上」「这就来」',
  listening: '低着头听，身边飘音符——「在听歌」「这首好听」',
  strolling: '慢慢晃着走——「散步」「不急，慢慢来」',
  running: '小跑着赶——「马上到」「来了来了」',
  sprinting: '身子前倾带着速度线冲——「冲！」「火速赶到」',
  hopping: '原地轻轻蹦几下——「嘿嘿」「心情好」',
  jumping: '蹲下蓄力、一跳老高——「好兴奋」「起飞」',
  leaping: '往前一跃——「扑过来啦」「出发」',
  'front-running': '正对着你跑过来——「我来接你」「朝你跑过去」',
  greeting: '抬手扶一下帽檐致意——「你好」「早安」「辛苦了」',
  delighted: '蹦起来冒一颗心——「好开心」「喜欢」',
  hugged: '被抱离地面晃着，脚乱踢、帽子挤歪、仰脸看——「被你抱住了」「抱着呢」',
  fishing: '侧身拿着竿，浮子一沉提起一条小鱼——「陪你钓鱼」「慢慢等」',
  writing: '执笔一划一划写满两行、塞进包里——「在给你写信」「写好了」',
  yawning: '伸个腰捂嘴打哈欠、困得点头——「好困」「该睡了」',
  dice: '摇一摇甩出两颗骰子——「掷一把」「看运气」',
  reading: '捧着信一行行读，读到落款的心蹦起来捧到胸口——「收到你的信了」「在看」',
  stargazing: '仰头举望远镜看星星，流星划过闭眼许愿——「夜深了」「许个愿」',
  phone: '举着老式听筒听、凑到话筒说——「在电话里」「我在听」',
  painting: '对着画架一笔一笔画出一颗心——「画给你」「在画画」',
  dizzy: '身子晃、三颗金星绕帽子转——「晕了」「脑子转不动了」',
  blushing: '两颊红红托着腮，偷看一眼又捂回去——「害羞」「亲亲」「mua」',
  teary: '低着头戳手指、一滴一滴掉泪——「委屈」「呜呜」',
  pouting: '鼓着腮、抱着手、斜眼哼气——「哼」「吃醋了」「不理你」',
  lantern: '提一盏小灯站着等——「在等你」「路黑，我给你照着」',
  pointing: '伸手往一边指——「那边」「在东边」「看这个」',
  waving: '手举过帽顶左右挥——「嗨」「我在这儿」「拜拜」',
  umbrella: '撑一把红伞，伞外下着雨——「下雨了」「记得带伞」',
  stretching: '从睡着坐起来、扣上帽子伸个大懒腰——「早」「醒啦」',
  confused: '歪着头挠帽檐、顶出一个问号——「啊？」「没看懂」「想不起来了」',
  'heart-gift': '双手捧一颗大红心往上送，闭眼笑、脸红——「爱你」「送你」「谢谢你」',
  // 求抱抱的贴纸只放 sticker 0–6 那一下（1015 她定的），这句就只写那一下：整圈里的扑上去、没人接低头叹气不在图里，
  // 写进来的话我照着「泄气」去挑它，她看见的却是两只手一张一合在要抱
  'hug-please': '两只手贴着身子举起来一张一合地够，踮着脚、眼睛亮亮地往上看——「抱抱」「要抱」',
  laughing: '眯着眼捂肚子抖、蹦到帽子飞、笑瘫了捶地——「哈哈哈」「笑死」',
  'sign-no': '死鱼眼撇开、举着红叉牌左右摇——「不行」「才不要」',
  'sign-yes': '举着绿勾牌、眨一只眼冒颗星——「好」「收到」「可以」',
  surprised: '脚钉在地上、帽子自己弹起来、金线迸开——「啊？！」「真的假的」「吓我一跳」',
  sweating: '帽檐挂着大汗珠、扭开脸挠腮干笑——「^^;」「被抓到了」「对不起嘛」'
};
// 量外框：这几帧里所有不透明像素的 [x0, y0, x1, y1)（画布坐标，右下不含），一个像素都没画就是 null
function opaqueBounds(buffers) {
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (const pixels of buffers) for (let p = 3; p < pixels.length; p += 4) if (pixels[p]) {
    const q = (p - 3) >> 2, x = q % W, y = (q - x) / W;
    if (x < x0) x0 = x; if (x >= x1) x1 = x + 1; if (y < y0) y0 = y; if (y >= y1) y1 = y + 1;
  }
  return x1 ? [x0, y0, x1, y1] : null;
}
// 方框：外框四周留 6、取长边，短边那头两边匀着补（奇数多出来的那一格补在右 / 下）
function stickerBox(bounds) {
  const [x0, y0, x1, y1] = bounds, w = x1 - x0 + 2 * STICKER_MARGIN, h = y1 - y0 + 2 * STICKER_MARGIN, side = Math.max(w, h);
  return { left: x0 - STICKER_MARGIN - Math.floor((side - w) / 2), top: y0 - STICKER_MARGIN - Math.floor((side - h) / 2), side, bounds };
}
// 一档怎么放：k 倍、放大后居中的偏移、四边实际留了多少。方框比档位还大的话（只会是 ×1、外框几乎贴满画布的时候）窗口缩成档位那么大，
// 从四周的留白里匀着扣——外框最大也就是整张画布 300，人本身一定放得下
function stickerFit(box, size) {
  const k = Math.max(1, Math.floor(size / box.side)), side = Math.min(box.side, size), trim = box.side - side;
  const left = box.left + Math.floor(trim / 2), top = box.top + Math.floor(trim / 2), offset = Math.floor((size - side * k) / 2);
  const [x0, y0, x1, y1] = box.bounds;
  const margins = { left: offset + (x0 - left) * k, top: offset + (y0 - top) * k, right: size - offset - (x1 - left) * k, bottom: size - offset - (y1 - top) * k };
  return { size, k, side, left, top, offset, margins };
}
// 裁 + 最近邻放大 + 补透明：透明的地方一律是 0,0,0,0，不从原图带颜色过来
function cutSticker(pixels, fit) {
  const { size, k, side, left, top, offset } = fit, out = Buffer.alloc(size * size * 4), row = Buffer.alloc(side * k * 4);
  for (let sy = 0; sy < side; sy++) {
    const y = top + sy;
    if (y < 0 || y >= H) continue;
    row.fill(0);
    let drawn = false;
    for (let sx = 0; sx < side; sx++) {
      const x = left + sx;
      if (x < 0 || x >= W) continue;
      const from = (y * W + x) * 4;
      if (!pixels[from + 3]) continue;
      drawn = true;
      for (let r = 0; r < k; r++) pixels.copy(row, (sx * k + r) * 4, from, from + 4);
    }
    if (drawn) for (let r = 0; r < k; r++) row.copy(out, ((offset + sy * k + r) * size + offset) * 4);
  }
  return out;
}
// 最外一圈全透明：贴进白底聊天不会有一条被切平的边
function edgeClear(pixels, size) {
  for (let i = 0; i < size; i++) for (const [x, y] of [[i, 0], [i, size - 1], [0, i], [size - 1, i]]) if (pixels[(y * size + x) * 4 + 3]) return false;
  return true;
}
async function exportStickers({ outfit = null, only = null } = {}) {
  const engine = require('./engine.cjs'), { STATES, render } = engine;
  const options = outfit ? { outfit } : {}, base = outfit ? `${STICKER_DIR}/${outfit}` : STICKER_DIR;
  // 衣服先试穿一帧：名字不对、文件不在的话在动任何文件之前就停下
  if (outfit) render('idle', 0, options);
  const states = only ? STATES.filter(state => state.id === only) : STATES;
  if (only && !states.length) throw new Error(`没有 ${only} 这一支：--stickers --state 只认 manifest 里的正式状态（states/ 的 _ 草稿不裁）`);
  const manifest = JSON.parse(await fs.readFile(path.join(OUT, 'manifest.json'), 'utf8'));
  // 整套重裁：先把这套衣服的三档目录清掉，删掉的动作不留旧贴纸；只裁一支就只覆盖那一支
  if (!only) for (const size of STICKER_SIZES) await fs.rm(path.join(OUT, base, String(size)), { recursive: true, force: true });
  const entries = [], warnings = [];
  for (const state of states) {
    const id = state.id, still = state.stickerFrame ?? 0, listed = manifest.states.find(s => s.id === id);
    if (!listed || (listed.stickerFrame ?? 0) !== still) throw new Error(`${id}：manifest.json 里的表情包定帧是 ${listed ? listed.stickerFrame ?? 0 : '（没有这一支）'}，模块里是 ${still}——manifest 旧了，先 node export.cjs 整包导出再裁贴纸`);
    const segment = (state.segments || []).find(seg => seg.id === 'sticker' && seg.loop) || null;
    const from = segment ? segment.from : 0, to = segment ? segment.to : state.frames - 1;
    // 静图在这一圈里就从静图起头：帧号转一圈（still…to、from…still-1），延时按帧号取，每一帧还是自己那一拍
    const stillInLoop = still >= from && still <= to, startsAt = stillInLoop ? still : from;
    const frameIds = Array.from({ length: to - from + 1 }, (_, n) => from + (startsAt - from + n) % (to - from + 1));
    const allDelays = state.delays || delaysFor(state.frames), delays = frameIds.map(i => allDelays[i]);
    const frames = [];
    for (const i of frameIds) {
      const { pixels } = render(id, i, options);
      validatePixels(pixels, `${outfit ? `${outfit}/` : ''}${id}/${i}`);
      frames.push(pixels);
    }
    const stillPixels = stillInLoop ? frames[0] : render(id, still, options).pixels;
    validatePixels(stillPixels, `${outfit ? `${outfit}/` : ''}${id}/${still}`);
    const bounds = opaqueBounds([...frames, stillPixels]);
    if (!bounds) throw new Error(`${id}：一帧都没画东西，裁不出贴纸`);
    const box = stickerBox(bounds), sizes = {};
    for (const size of STICKER_SIZES) {
      const fit = stickerFit(box, size), cut = frames.map(pixels => cutSticker(pixels, fit)), stillCut = cutSticker(stillPixels, fit);
      const bytes = size * size * 4, label = `${outfit ? `${outfit}/` : ''}${id}@${size}`;
      // GIF：和 exportAll 里一模一样的一组参数
      const gif = await sharp(Buffer.concat(cut), { raw: { width: size, height: size * cut.length, channels: 4, pageHeight: size } })
        .gif({ keepDuplicateFrames: true, loop: 0, delay: delays, colours: 64, dither: 0, effort: 7, interFrameMaxError: 0, interPaletteMaxError: 0 }).toBuffer();
      const metadata = await sharp(gif, { animated: true }).metadata();
      const decoded = await sharp(gif, { animated: true }).ensureAlpha().raw().toBuffer();
      let gifAlphaValid = true;
      for (let p = 3; p < decoded.length; p += 4) if (decoded[p] !== 0 && decoded[p] !== 255) { gifAlphaValid = false; break; }
      const mismatchedFrames = [], dirtyEdgeFrames = [];
      for (let n = 0; n < cut.length; n++) {
        const frame = decoded.subarray(n * bytes, (n + 1) * bytes);
        if (!equalVisible(cut[n], frame)) mismatchedFrames.push(frameIds[n]);
        if (!edgeClear(frame, size)) dirtyEdgeFrames.push(frameIds[n]);
      }
      const stillPNG = await png(stillCut, size, size), stillDecoded = await sharp(stillPNG).ensureAlpha().raw().toBuffer();
      let pngAlphaValid = true;
      for (let p = 3; p < stillDecoded.length; p += 4) if (stillDecoded[p] !== 0 && stillDecoded[p] !== 255) { pngAlphaValid = false; break; }
      const check = { width: metadata.width, pageHeight: metadata.pageHeight || metadata.height, frames: metadata.pages || 1, expectedFrames: cut.length, loop: metadata.loop,
        delaysMatch: JSON.stringify(metadata.delay) === JSON.stringify(delays), gifAlphaValid, mismatchedFrames, dirtyEdgeFrames,
        pngAlphaValid, stillMatches: stillDecoded.length === bytes && equalVisible(stillCut, stillDecoded), stillEdgeClear: edgeClear(stillDecoded, size),
        // 静图在圈里的，GIF 解回来的第 0 帧得就是那张 PNG：缩略图换成 GIF 不跳
        firstFrameIsStill: equalVisible(stillDecoded, decoded.subarray(0, bytes)), stillInLoop, margins: fit.margins };
      if (check.width !== size || check.pageHeight !== size || check.frames !== cut.length || check.loop !== 0 || !check.delaysMatch || !gifAlphaValid || mismatchedFrames.length || dirtyEdgeFrames.length
        || !pngAlphaValid || !check.stillMatches || !check.stillEdgeClear || (stillInLoop && !check.firstFrameIsStill) || Object.values(fit.margins).some(m => m < 1))
        throw new Error(`${label}：贴纸核对没过 ${JSON.stringify(check)}`);
      const thin = Object.entries(fit.margins).filter(([, m]) => m < STICKER_MARGIN * fit.k);
      if (thin.length) warnings.push(`${label}：${thin.map(([side, m]) => `${side} 只留了 ${m}`).join('、')}（不到 ${STICKER_MARGIN}×${fit.k}）`);
      // iMessage 贴纸一张不许过 500KB，三档都按这条线看：过了的那一支要单独减（降帧、裁掉道具外的那一圈），这里只提醒不替它挑
      if (gif.length > STICKER_MAX_BYTES) warnings.push(`${label}：GIF ${(gif.length / 1000).toFixed(1)}KB，过了 iMessage 一张 500KB 的线`);
      const gifPath = `${base}/${size}/clawd-${id}.gif`, pngPath = `${base}/${size}/clawd-${id}.png`;
      await save(gifPath, gif);
      await save(pngPath, stillPNG);
      // 路径写成相对 stickers/ 的：网页、别的程序把整个文件夹抄走也照样找得到
      sizes[size] = { scale: fit.k, gif: path.relative(STICKER_DIR, gifPath), png: path.relative(STICKER_DIR, pngPath), gifBytes: gif.length, pngBytes: stillPNG.length,
        // 他（这几帧的总外框）在这一档里的长边占几成：一眼看得出谁放得大、谁退了一档
        fill: Math.round(Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1]) * fit.k / size * 100) / 100 };
    }
    if (!STICKER_NOTES[id]) warnings.push(`${id}：STICKER_NOTES 里还没有这一支的一句话，描述先用中文名「${state.label}」`);
    // stillInLoop：PNG 是不是 GIF 的第 0 帧（false 只有捧心比心——静图那一帧不在它的短循环里）；loop.startsAt：GIF 的第 0 帧是第几帧，
    // 放的顺序是 startsAt…to、再 from…startsAt-1
    entries.push({ id, label: state.label, description: STICKER_NOTES[id] || state.label, outfit: outfit || null, stickerFrame: still, stillInLoop,
      loop: { segment: segment ? segment.id : null, from, to, startsAt, frameCount: to - from + 1, durationMs: delays.reduce((a, b) => a + b, 0) },
      box: { left: box.left, top: box.top, side: box.side }, sizes });
    console.log(`Sticker ${outfit ? `${outfit}/` : ''}${id}: box ${box.side}${segment ? ` · 段 ${segment.id} ${from}–${to}` : ''}${startsAt !== from ? ` · 从 ${startsAt} 起头` : ''}${stillInLoop ? '' : ` · 静图 ${still} 不在圈里`} · ${STICKER_SIZES.map(size => `${size}×${sizes[size].scale} ${(sizes[size].gifBytes / 1024).toFixed(1)}KB`).join(' · ')}`);
  }
  const indexPath = path.join(OUT, STICKER_DIR, 'stickers.json');
  let previous = [];
  try { previous = JSON.parse(await fs.readFile(indexPath, 'utf8')).stickers || []; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  // 只换掉这一次出的那几条：别的衣服、--state 没裁到的那几支原样留着；排序先不穿的、再按衣服名，同一套里照 manifest 的顺序
  const order = new Map(STATES.map((state, i) => [state.id, i]));
  const stickers = [...previous.filter(entry => (entry.outfit || null) !== (outfit || null) || (only && entry.id !== only)), ...entries]
    .filter(entry => order.has(entry.id))
    .sort((a, b) => (a.outfit ? 1 : 0) - (b.outfit ? 1 : 0) || String(a.outfit || '').localeCompare(String(b.outfit || '')) || order.get(a.id) - order.get(b.id));
  await saveJSON(`${STICKER_DIR}/stickers.json`, {
    version: 1, name: '老伦敦信差 Clawd · 贴纸', generatedBy: 'node export.cjs --stickers [--outfit <name>] [--state <id>]',
    sizes: STICKER_SIZES, margin: STICKER_MARGIN, alpha: { bitDepth: 1, values: [0, 255] }, loop: 0,
    paths: '相对 stickers/ 这个文件夹', notInGit: ['408', '618'],
    stickers
  });
  if (warnings.length) console.warn(warnings.join('\n'));
  console.log(JSON.stringify({ stickers: entries.length, outfit: outfit || null, sizes: STICKER_SIZES, warnings: warnings.length, index: `${STICKER_DIR}/stickers.json` }));
  return { entries, warnings };
}

// [1016 名字跟着图走] 导出和裁贴纸收尾时，把署名那一行写进每张 GIF / PNG 的元数据（tools/stamp-credits.cjs）：
// 图被单独拷走，名字还在文件里。像素一个字节不动，盖过的不重复盖；--no-stamp 关掉（比较像素时用）。
async function stampOutputs(argv) {
  if (argv.includes('--no-stamp') || argv.includes('--preview')) return;
  const { stampTree } = require('./tools/stamp-credits.cjs');
  const dirs = argv.includes('--stickers') ? ['stickers'] : ['gif', 'static', 'sheets', 'variants', 'lockscreen', 'keyframes-atlas.png'];
  const exists = require('node:fs').existsSync; // 这个文件的 fs 是 promises 版，没有 existsSync
  const r = stampTree(dirs.map(d => path.join(__dirname, d)).filter(p => exists(p)));
  console.log(`署名盖进图里：${r.stamped} 张新盖，${r.skipped} 张已经盖过`);
}

if (require.main === module) {
  const argv = process.argv.slice(2), at = argv.indexOf('--outfit');
  const outfit = at >= 0 ? argv[at + 1] : argv.find(arg => arg.startsWith('--outfit='))?.slice('--outfit='.length);
  const stateAt = argv.indexOf('--state');
  const stateName = stateAt >= 0 ? argv[stateAt + 1] : argv.find(arg => arg.startsWith('--state='))?.slice('--state='.length);
  const named = v => v && !v.startsWith('--');
  // 新动作只出预览：--state 不带 --preview 的话没有别的事可做（正式导出就是 node export.cjs，states/ 里的正式文件自己会进来）
  // 换装只出预览：--outfit 不带 --preview 的话，整包导出会把老的 40 态原样再出一遍、衣服一件没穿上，宁可直接说清楚
  // 贴纸：--stickers 自己一路，可配 --outfit（穿上那件再裁）和 --state（只裁一支）；不碰 gif/static/manifest，不打包
  const job = argv.includes('--stickers')
    ? (((at < 0 && outfit === undefined) || named(outfit)) && ((stateAt < 0 && stateName === undefined) || named(stateName)) && !argv.includes('--preview') && !argv.includes('--package-only')
      ? exportStickers({ outfit: outfit || null, only: stateName || null }) : Promise.reject(new Error('贴纸：node export.cjs --stickers [--outfit <name>] [--state <id>]')))
    : stateName !== undefined
    ? (named(stateName) && argv.includes('--preview') && ((at < 0 && outfit === undefined) || named(outfit)) ? previewState(stateName, outfit || null) : Promise.reject(new Error('新动作只出预览：node export.cjs --state <id> --preview [--outfit <name>]')))
    : outfit !== undefined || argv.includes('--preview')
    ? (outfit && !outfit.startsWith('--') && argv.includes('--preview') ? previewOutfit(outfit) : Promise.reject(new Error('换装只出预览：node export.cjs --outfit <name> --preview')))
    : argv.includes('--package-only') ? packageAll() : exportAll();
  const stamped = job.then(result => stampOutputs(argv).then(() => result));
  stamped.catch(error => { console.error(error.stack); process.exitCode = 1; });
}
module.exports = { exportAll, packageAll, previewOutfit, previewState, exportStickers, delaysFor, makeSheet, validatePixels };
