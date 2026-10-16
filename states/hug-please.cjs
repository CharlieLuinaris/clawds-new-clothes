// clawd-new-coat · states/hug-please.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 求抱抱：她按住他、或者我喊一声「抱抱」，他先把两只手贴着身子两边举起来一张一合地要，踮着脚、眼睛亮亮地往上看；
// 蹦一下扑上去——蹦到顶那一帧正好是「被抱起来」的第 0 帧，接入方放 once 段（0–15）就能一路接进 hugged，像真的被接住了；
// 循环里没人接，他落回地上，左右看一看，手就垂下来、低头，眼里那点光还在；过一会儿抬眼，又把手举起来。
// 首帧就是静图也是表情包那一帧：两只手在身子两个上角往外翘起来、整个人踮高 10、眼睛往上看——30pt 下是方脑袋两个上角各翘一只小手，
// 和待机（手垂在身侧，看着是身子宽了一截）、被抱起来（整个人离地、帽子歪）都分得开。[1015 复审] 重挑过：第一版首帧手举在帽子两边，
// 30 / 48pt 下是帽子两角长了两只犄角；换成贴着身子举之后，在 0（张）、3（合）、14（蹬起来）里比了一遍，还是张开踮脚这一帧最像在要抱。
//
// 帧段（45 帧，3 秒一圈）：
//   0–11  要抱：张（0–2、6–8）→ 合（3–5、9–11），三帧一换；张的时候踮高——身子拉长 10、手翘 30°，合的时候拉长 5、手落 5、翘 15°
//   12–13 蹲：压 10、帽子沉 5、闭眼憋一下劲，手跟着身子沉下去
//   14    一帧蹬起来（离地 15、拉长 5，手张到最高）——全片那一下一帧到位的大步
//   15–16 顶点停两帧：手、脚、帽子、眼睛一个数都不差地照「被抱起来」第 0 帧摆；once 段就在 15 收、接 hugged/0
//   17–18 没人接：落地压扁 10、闭眼，帽子从歪 10 滑回 5 再回正
//   19–22 举着「合」的手左右找（先左后右）
//   23–25 手垂下来：先举着犹豫一下、再加速掉到身侧、角度回正，人跟着矮 5、矮 10
//   24–36 低头：整个人矮 10、眼睛往下 5、帽子沉 5，泪光一直在；31–32 眨眼，34–35 叹一口气（再矮 5，手跟着沉）
//   37–38 抬眼看她，帽子回正
//   39–41 手一帧举回「合」，身子先拉长 5
//   42–44 张开，和首帧逐像素全等，接缝为零

// 「被抱起来」第 0 帧的姿势，原样抄自 motion.cjs 的 hugged（f = 0：离地 15、脚交替踢 [5,0,5,0]、往中间收、手托在腋下 ∓15°、帽子挪 10、眼睛往上看）。
// once 段接得上全靠这几个数一个不差，check-art 和预览都会逐像素比 15 和 hugged/0——那边要是改了，这里跟着改
const HUGGED = {
  jump: -15,
  hands: [{ x: 80, y: 185, a: -15 }, { x: 200, y: 185, a: 15 }],
  feet: [5, 0, 5, 0],
  footOffsets: [8, 4, -4, -8],
  hatShift: 10,
  gazeY: -5
};
// 手怎么举：两只手都贴着身子两侧往上举，手的内缘压在身子外缘上（和挥手那只举起来的手一个画法：手是从身上长出来的，不是飘在旁边）。
// 第一版到第四版的手都举在帽子两边、离身子 15–24，30 / 48pt 下是帽子两角飘着两粒橙点——像帽子长了一对犄角，首帧就是它。
// 现在「张」「合」不靠离身子远近，靠手的高度和角度：
//   张：手顶在身子顶往下 5（正好让开帽檐那一行，檐尖一个像素都不碰），往外歪 30°——方块转成一只朝外上方翘的小手，像两条短胳膊举起来要人抱；
//   合：再往下 5、歪回 15°——手落下来一点、收一点，一张一合是「抱抱、抱抱」地一下一下够。
// 手不跟身子的 squash / jump，按这一帧的身子顶（208 + jump + squash）现算，身子踮高的时候手跟着一起上去。
// 姿势坐标：左手画在 (x − 10, y + 5)、右手画在 (x + 10, y + 5)，所以左 x 80 / 右 x 200 画出来是 70–90 / 210–230，正贴着身子两边
const top = (jump = 0, squash = 0) => 208 + jump + squash;
const raised = (t, dy, a) => [{ x: 80, y: t + dy - 5, a: -a }, { x: 200, y: t + dy - 5, a }];
const OPEN = (t) => raised(t, 5, 30);
const CLOSE = (t) => raised(t, 10, 15);
const down = (y) => [{ x: 80, y, a: 0 }, { x: 200, y, a: 0 }];

module.exports = {
  id: 'hug-please',
  label: '求抱抱',
  frames: 45,
  ms: [70, 60, 70],
  group: 'emotion',
  // 张、合、蹲、蹬、顶点（= hugged/0）、落地、低头、抬眼
  keyframes: [0, 3, 12, 14, 15, 17, 24, 37],
  // 表情包定帧是首帧：两只手贴着身子两个上角往外翘、踮高 10、眼睛亮亮地往上看
  stickerFrame: 0,
  // 按下去先放 once：要两下、蹦起来，第 15 帧和 hugged 第 0 帧逐像素全等，放完切 hugged 一点都不跳；
  // 整圈 0–44 是没人接的那个版本，给她按住他、我喊一声「抱抱」的时候用
  // ask：[1015 复审] 只要那一下「抱抱、抱抱」的短循环——张 0–2、合 3–5、第 6 帧又张开（和第 0 帧逐像素全等），要短的也能只放这一段
  // sticker：[1015 她定的] 表情包只放 ask 那一下。整圈里 17–38 这一秒半是没人接、低头叹气，发「抱抱」的时候有一半在泄气，
  //   她要的就是「抱抱、抱抱」地够；--stickers 只认叫 sticker 的段，所以和 ask 同帧另写一段，接入方照旧用 ask，两边谁改谁的不牵连
  segments: [{ id: 'once', from: 0, to: 15, loop: false, next: 'hugged' }, { id: 'ask', from: 0, to: 6, loop: true }, { id: 'sticker', from: 0, to: 6, loop: true }],

  pose(i, { curve, snap5, closedAt }) {
    // 要抱那一段（含首尾 39–44）：三帧一换，张在 0–2、6–8、42–44，合在 3–5、9–11、39–41
    const opening = i <= 2 || (i >= 6 && i <= 8) || i >= 42;
    const closing = (i >= 3 && i <= 5) || (i >= 9 && i <= 11) || (i >= 39 && i <= 41);
    // 亮晶晶：睁着的眼右上一块白（委屈的泪光那一块），蹦在空中那三帧收起来——第 15 帧要和 hugged/0 全等，它没有泪光
    const gloss = !(i >= 14 && i <= 16);

    // 张的时候踮高（拉长 10），合的时候落回一半（拉长 5）：手和身子一起一高一低，30pt 下也看得出在一下一下地够
    if (opening) return { squash: -10, hands: OPEN(top(0, -10)), gazeY: -5, tool: { gloss } };
    if (closing) return { squash: -5, hands: CLOSE(top(0, -5)), gazeY: -5, tool: { gloss } };
    // 蹲：压 10、帽子沉 5、闭眼憋劲，手跟着身子沉下去、收成「合」
    if (i === 12 || i === 13) return { squash: 10, hatDrop: 5, eyes: 'closed', hands: CLOSE(top(0, 10)), tool: { gloss } };
    // 蹬：离地 15、拉长 5、手张开跟着身子窜上去；帽子被颠得往右挪 5，下一帧到 10 正好是被抱起来那顶的位置
    if (i === 14) return { jump: -15, squash: -5, hands: OPEN(top(-15, -5)), gazeY: -5, hatShift: 5, tool: { gloss } };
    if (i === 15 || i === 16) return { ...HUGGED, hands: HUGGED.hands.map((h) => ({ ...h })), tool: { gloss } };
    // 落地：一帧从 −15 砸回 0，压扁 10、闭眼、脚往外劈；帽子滑回 5，下一帧回正。手还举着「合」——没人接，可还没死心
    if (i === 17) return { squash: 10, eyes: 'closed', hands: CLOSE(top(0, 10)), footOffsets: [-5, 0, 0, 5], hatShift: 5, tool: { gloss } };
    if (i === 18) return { squash: 5, eyes: 'closed', hands: CLOSE(top(0, 5)), tool: { gloss } };
    // 找：手还举着，抬眼先往左看两帧、再往右看两帧——「人呢？」
    if (i >= 19 && i <= 22) return { hands: CLOSE(top()), gazeY: -5, gazeX: i <= 20 ? -5 : 5, tool: { gloss } };

    // 23–36 垂手低头：手从举着的「合」往下掉，23 还在半空、24 掉一半、25 落到身侧（curve 加速——先犹豫一下，再泄了气一样掉下去），角度一路回正；
    // 身子 23 矮 5、24 起矮 10，整个人矮下去一截，比只低头在 70pt 下好认得多；24 起低头、帽子沉 5；34–35 叹气再矮 5，手跟着沉
    // 37–38 抬眼看她：身子一帧回到 0、帽子回正，手还垂着
    if (i >= 23 && i <= 38) {
      const sigh = i === 34 || i === 35, look = i >= 37;
      const squash = look ? 0 : i === 23 ? 5 : sigh ? 15 : 10;
      const sag = curve(i, [[22, 0], [25, 1, 'i']]);
      const from = CLOSE(top(0, squash)), to = down(218 + squash);
      const hands = look || i >= 25
        ? to
        : from.map((h, n) => ({ x: h.x, y: snap5(h.y + (to[n].y - h.y) * sag), a: Math.round(h.a * (1 - sag) / 5) * 5 }));
      return {
        squash,
        hands,
        gazeY: look ? -5 : i === 23 ? 0 : 5,
        hatDrop: look || i === 23 ? 0 : 5,
        eyes: closedAt(31) ? 'closed' : 'open',
        tool: { gloss }
      };
    }
    return null;
  },

  check: {
    // 15、16 两帧整个人离地 15、四只脚都抬着——jump 已经给了，检查本来就不拦；这里只写这一支自己的两条不变量：
    // 一、要抱的那些帧（一张一合、蹬起来），两只手都贴着身子：手和身子之间最近不超过 10（按像素量，切比雪夫距离），
    //     而且一粒都不压在头顶以上的帽子上（y < body.y 那一块：帽顶、帽檐、绒球）——手一离开身子就是帽子两角飘着的两粒，
    //     一压到帽子上 30pt 下就糊成一顶大帽子。头顶以下的帽子层（风雪帽垂到脸两边的护耳）手本来就会叠上去，和待机一样，不算；
    //     穿上衣服也查（check-art --outfit 和 --preview --outfit 走的都是这里）；
    // 二、要抱的帧泪光两块都露全（white 5×5，各 25 个像素）——亮晶晶是往上看那双眼睛唯一的表情，被谁盖掉一粒就少一半
    verify(i, { pixels, layers, meta }) {
      const asking = i <= 11 || i === 14 || i >= 39;
      if (!asking) return null;
      const out = [], W = 300, hat = layers.hat, body = layers.body, headTop = Math.round(meta.body.y);
      for (const name of ['hand-left', 'hand-right']) {
        const hand = layers[name];
        let onHat = 0, near = Infinity;
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
          const k = (y * W + x) * 4;
          if (!hand[k + 3]) continue;
          if (y < headTop && hat[k + 3]) onHat++;
          if (near === 0) continue;
          for (let r = 0; r <= Math.min(near - 1, 10); r++) {
            let hit = false;
            for (let v = Math.max(0, y - r); v <= Math.min(W - 1, y + r) && !hit; v++)
              for (let u = Math.max(0, x - r); u <= Math.min(W - 1, x + r); u++) if (body[(v * W + u) * 4 + 3]) { hit = true; break; }
            if (hit) { near = Math.min(near, r); break; }
          }
        }
        const side = name === 'hand-left' ? '左' : '右';
        if (near > 10) out.push(`${side}手离身子超过 10——要抱的手得贴着身子举`);
        if (onHat) out.push(`${side}手压到头顶上的帽子 ${onHat} 个像素——手贴着身子举，不进帽子那一块`);
      }
      if (i !== 14) {
        const glints = meta.parts.filter((q) => q.tag.startsWith('gloss-'));
        const lit = glints.map((q) => {
          let n = 0;
          for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) {
            const k = (y * 300 + x) * 4;
            if (pixels[k] === 0xff && pixels[k + 1] === 0xf7 && pixels[k + 2] === 0xdf) n++;
          }
          return n;
        });
        if (lit.length !== 2 || lit.some((n) => n !== 25)) out.push(`泪光没露全：${lit.length} 块，各露 ${lit.join(' / ') || 0} 个像素（要两块各 25）`);
      }
      return out;
    }
  }
};
