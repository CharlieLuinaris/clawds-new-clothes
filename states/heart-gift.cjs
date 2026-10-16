// clawds-new-clothes · states/heart-gift.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 捧心比心：双手捧一颗大红心，一帧往上送到帽檐底下，闭眼笑，两颊红，四周冒四颗小星小心。
// 用在收到她递来的小礼物、信寄出去、说「爱你」的时候；0–8 帧单独拿出来就是一张短循环的表情包（segments 里的 sticker），
// 当静图表情包用定在第 18 帧：心送到最高、闭着眼、四颗小星小心都整颗亮着。
//
// 她递的两格参考（ref-2 第四格爱心 !! 脸红、ref-6 第二格捧花脸红）读出来靠的是三样：东西捧在胸前、两颊红、身边飘心。
// 翻成他会的词：心是 props 层一整块红，手 skinSide 夹在心的两侧下沿；红脸借害羞的 tool.blush；
// 「送」是一帧到位的大步——身子拉长离地、心从胸口一下顶到帽檐底下、大一圈（往她那边推过去，近了就大），帽子被这一下掀起来；
// 送到顶的那几帧闭眼笑，四角各冒一颗小星或小心。
//
// 心只在两眼之间那条缝里走（连白边 x 125–175，眼睛那两格在 115–125 / 175–185），所以睁着眼也盖不到眼睛；
// 送上去的时候白边顶钉在 body.y（帽檐底那一行），不进帽子框——四套换装的帽子在那一块各长各的，道具进去就撞。
//
// 心描一圈 white 边：红心直接压在 skin 身子上，70pt 下红和肉色糊成一团，下半截还压着马甲和肩带，认不出是心；
// 试过 ink 边（送到顶时和闭着的两只眼连成一道黑线，像一张咧开的嘴）、paperEdge 边（太淡）、补一个深红（还是糊），
// 白边一描，深底浅底都是一颗贴纸似的心，19 色也不用加。胸口那颗 6 格宽（连边 40），送出去和「砰」那一下长成 8 格（连边 50）
const SMALL = ['110011', '111111', '111111', '011110', '001100'];   // 30×25，捧在胸口
const BIG = ['01100110', '11111111', '11111111', '01111110', '00111100', '00011000'];   // 40×30，送出去、砰
// 白边：每一格往上下左右各扩一格（不扩斜角，边是一级一级的台阶，和帽子的阶梯一个画法）
function rim(rows) {
  const h = rows.length, w = rows[0].length, on = (y, x) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] === '1', out = [];
  for (let y = -1; y <= h; y++) {
    let s = '';
    for (let x = -1; x <= w; x++) s += on(y, x) || on(y - 1, x) || on(y + 1, x) || on(y, x - 1) || on(y, x + 1) ? '1' : '0';
    out.push(s);
  }
  return out;
}
const cells = rows => rows.join('').split('').filter(c => c === '1').length * 25;
const HEART = { small: SMALL, big: BIG, beat: BIG };

// 四颗小星小心，25×25 一颗：第一版是 15×15 的 sparkle 和 miniHeart，70pt 下只剩 3 个点，红的那两颗落在深底上几乎看不见。
// 小心也描白边（和大心一个画法，3 格的心连边 5 格），小星是长臂的十字 gold，闪的时候缩回 15×15 那颗。
// 星用 gold 不用 goldLight：goldLight 落在纸色浅底（paper）上几乎看不见。
// 位置都在好放的地方：左边 40–65、右边 235–260（帽子框到 220，睡帽尾巴到 231），对着中线 150 左右对称；
// 上面那两颗在送到顶时帽子的外侧，右下那颗比包（189–224）靠外，一颗都不进帽子框、不碰包和脚。
// 只往上飘、不往两边散：第一版每两帧往外挪 5，最后散到 x 10–290，以后裁表情包（目录里那个 206 宽的框）整张就得退一档
const MINI = ['101', '111', '010'], MINI_RIM = rim(MINI);
const STAR = ['00100', '00100', '11111', '00100', '00100'], TWINKLE = ['010', '111', '010'];
const SPARKS = [
  { kind: 'heart', x: 40, y: 135 },
  { kind: 'star', x: 235, y: 120 },
  { kind: 'star', x: 40, y: 190 },
  { kind: 'heart', x: 235, y: 180 }
];
// 两次送：3 那一下短的（表情包循环 0–8 里），17 那一下长的、送到帽檐底下多捧一会儿
const BURSTS = [{ from: 3, life: 5 }, { from: 17, life: 12 }];
const UP = [[3, 5], [17, 27]], BEATS = [31, 34];
const giftAt = i => UP.some(([a, b]) => i >= a && i <= b) ? 'big' : BEATS.includes(i) ? 'beat' : 'small';

module.exports = {
  id: 'heart-gift',
  label: '捧心比心',
  frames: 45,
  ms: [70, 60, 70],
  group: 'emotion',
  keyframes: [0, 2, 3, 16, 18, 22, 28, 31],
  // 表情包定帧是第 18 帧：心送到最高、闭着眼、两颊红、四颗小星小心整颗亮着
  stickerFrame: 18,
  segments: [{ id: 'sticker', from: 0, to: 8, loop: true }],

  pose(i, { curve, closedAt }) {
    // 0–8 短的一圈：1–2 蹲 5；3 一帧离地 10、拉长 5（送）；4–5 空中停；6 落地压 5、还眯着眼；7–8 回到首帧，8 和 0 姿势全等。
    // 9–14 捧着，10 起抬眼看她；15–16 把心搂紧、蹲得更深（10）；17 一帧蹬到 −20、拉长 5，心顶到帽檐底；
    // 18 最高——再拉长 5，心顶在 178（表情包定帧）；19 空中停；20 往下落、21 落地压 5；
    // 22–27 脚落了地心还举着，身子拉长 5 够着往前送；28 一帧收回胸口、压 5；29 站好；
    // 30–35 抬眼看她，心在手里「砰、砰」大两下（31、34）——不然 29–44 连着十几帧一模一样，循环放着像一张贴图；
    // 36–44 和首帧全等，43–44 眨眼（45 帧里还空着的起始帧，不和老动作撞）
    const jump = curve(i, [[0, 0], [2, 0], [3, -10], [5, -10], [6, 0], [16, 0], [17, -20], [19, -20], [20, -10], [21, 0], [44, 0]]);
    const squash = curve(i, [[0, 0], [1, 5], [2, 5], [3, -5], [4, 0], [5, 0], [6, 5], [7, 0], [14, 0], [15, 10], [16, 10], [17, -5], [18, -10], [19, -5], [20, 0], [21, 5], [22, -5], [27, -5], [28, 5], [29, 0], [44, 0]]);
    const gift = giftAt(i), up = gift === 'big', bodyY = 208 + jump + squash;
    // 手：捧在胸口时左右夹着心（画在 120–140 / 160–180 × 238–258），送上去时并拢托在心尖底下（125–145 / 155–175）；
    // 都在眼睛那一格底下，睁眼闭眼都不盖。胸口那档手底最多到 258：再往下就贴到脚上，70pt 下像多了两只脚。
    // 15–16 蹲深 10 时眼睛落到 223–243，夹在心两边的手（238 起）会盖住眼睛底那 5 行——这两帧手跟着身子沉 5（画到 243–263），
    // 只有蹲下去这两帧手底挨着脚，人整个缩着，看着是把心往怀里搂
    const hy = up ? bodyY + 25 : squash >= 10 ? 238 : Math.min(bodyY + 25, 233);
    const hands = up
      ? [{ x: 135, y: hy, color: 'skinSide' }, { x: 145, y: hy, color: 'skinSide' }]
      : [{ x: 130, y: hy, color: 'skinSide' }, { x: 150, y: hy, color: 'skinSide' }];
    // 帽子被送的那一下掀起来：收尾自动算的落后（往上冲时压低 jump 差的一半）减去这里的抬，檐底和头顶之间正好空一格 5——
    // 3：落后 5、抬 10；4：落后 0、抬 5；17：落后 10、抬 15；18：落后 0、抬 5。其余帧帽子扣在头上
    const hatLift = { 3: 10, 4: 5, 17: 15, 18: 5 }[i] || 0;
    const eyes = (i >= 3 && i <= 6) || (i >= 17 && i <= 27) || closedAt(43) ? 'closed' : 'open';
    const gazeY = (i >= 10 && i <= 14) || (i >= 30 && i <= 35) ? -5 : 0;
    return {
      jump, squash, hands, eyes, gazeY, hatLift,
      // watch：马甲上的怀表摘掉——心捧在胸口时正压在它上头，心尖两边会漏出几粒金，70pt 下像掉了渣
      tool: { blush: true, watch: true, gift }
    };
  },

  paint(ctx, p, i) {
    const gift = p.tool.gift, rows = HEART[gift], w = rows[0].length * 5, h = rows.length * 5;
    // 胸口：心落在马甲上，连边的顶在 233（眼睛那一格的底）以下、尖到 268 夹在中间两只脚之间（身子蹲下去心不跟着沉）；
    // [1015 复审] 原来连边的底停在 258、顶在 223，正好落在两眼之间偏下——喝茶那一条特意躲开的「脸正中下方一块白读成嘴」：
    // 48pt 下像一张描白边张开的嘴，30pt 下首帧和待机只差 34 个像素。往下挪 10，脸的正中空出来，白边压在马甲的棕色上更跳，读出来是捧在胸口的一颗心。
    // 送上去：白边顶钉在 body.y，也就是帽檐底那一行（那一下眼睛是闭着笑的，心在两只闭眼中间，审的人看过不像嘴）
    const x = ctx.body.x + 60 - w / 2, y = gift === 'big' ? ctx.body.y + 5 : 263 - h;
    ctx.props.pattern(rim(rows), x - 5, y - 5, 'white', 5, 'heart-rim');
    ctx.props.pattern(rows, x, y, 'red', 5, 'heart');
    ctx.props.rect(x + 5, y + 5, 5, 5, 'redLight', 'heart-shine');
    for (const { from, life } of BURSTS) {
      const a = i - from;
      if (a < 0 || a >= life) continue;
      SPARKS.forEach((s, n) => {
        // 冒出来那一帧和最后一帧是缩着的 15×15，中间整颗 25×25；星在原地每两帧闪一下（整颗 ↔ 缩着），心不闪、每两帧往上飘 5
        const step = Math.max(0, Math.floor((a - 1) / 2)), sx = s.x, sy = s.kind === 'heart' ? s.y - 5 * step : s.y;
        const small = a === 0 || a === life - 1 || (s.kind === 'star' && step % 2 === 1), tag = `spark-${n + 1}`;
        if (s.kind === 'star') ctx.effects.pattern(small ? TWINKLE : STAR, small ? sx + 5 : sx, small ? sy + 5 : sy, 'gold', 5, tag);
        else if (small) ctx.effects.pattern(MINI, sx + 5, sy + 5, 'red', 5, tag);
        else { ctx.effects.pattern(MINI_RIM, sx, sy, 'white', 5, tag); ctx.effects.pattern(MINI, sx + 5, sy + 5, 'red', 5); }
      });
    }
  },

  check: {
    verify(i, { shown, part, pose, meta, pixels, layers }) {
      const out = [], gift = pose.tool.gift;
      // 心连白边一整颗都得露着：它是这一支的意思，被什么压掉一角 70pt 下就不是心了。
      // 心、边、高光画在同一层，shown 数的是这一层在白边那块框里露出来的像素，所以按白边的格子数比
      const need = cells(rim(HEART[gift]));
      if (shown('heart-rim') < need) out.push(`心只露出 ${shown('heart-rim')} 个像素，应该 ${need}`);
      // 心不进帽子框：檐底 = body.y + hatLag + hatDrop − 抬起
      const lift = Math.round(Math.max(pose.tool.hatLift || 0, Math.abs(pose.tool.hatTilt || 0) * 1.3));
      const brim = meta.body.y + pose.hatLag + pose.hatDrop - lift, edge = part('heart-rim');
      if (edge && edge.y < brim) out.push(`心顶 ${edge.y} 进了帽子框（檐底 ${brim}）`);
      // 两只手都得看得见一块：手全被心盖住，就成了一颗心自己飘在肚子前面
      for (const name of ['hand-left', 'hand-right']) {
        const layer = layers[name];
        let n = 0;
        for (let k = 0; k < layer.length; k += 4)
          if (layer[k + 3] && pixels[k] === layer[k] && pixels[k + 1] === layer[k + 1] && pixels[k + 2] === layer[k + 2]) n++;
        if (n < 150) out.push(`${name === 'hand-left' ? '左' : '右'}手只露出 ${n} 个像素，看不出是捧着`);
      }
      // 冒星冒心的帧四颗都得在、都落在画布里；别的帧一颗都没有
      const burst = BURSTS.some(({ from, life }) => i >= from && i < from + life);
      const sparks = [1, 2, 3, 4].map(n => part(`spark-${n}`)).filter(Boolean);
      if (burst && sparks.length !== 4) out.push(`这一帧该冒四颗小星小心，只画了 ${sparks.length} 颗`);
      if (!burst && sparks.length) out.push('这一帧不该有小星小心');
      sparks.forEach((q, n) => { if (q.x < 0 || q.y < 0 || q.x + q.w > 300 || q.y + q.h > 300) out.push(`第 ${n + 1} 颗出了画布`); });
      return out;
    }
  }
};
