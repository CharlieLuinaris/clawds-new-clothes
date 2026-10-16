// clawd-new-coat · states/laughing.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 大笑：被她逗得眼睛眯成两道弯，捂着肚子一抖一抖，越笑越厉害、蹦起来连帽子都颠飞，最后笑瘫在地上两只手轮流捶地。
// 用在被她揉一揉的时候——揉一揉和点一下原来是同一张开心，有了这张两样就分开了；被她逗笑、输给她一局也放它。
//
// 她这一条没有参考图，照动作目录。目录里说的五样，在 70pt 下各靠什么读出来：
//   一、「闭着的眼线往上挑」：引擎的闭眼是 10×5 一道横，我在它两头各往下补一格 5×5（effects 层），横 + 两只脚就是一个倒 U「∩」。
//       全程 gazeY −5 把这道弯提到脸的半中腰：不提的话它落在 body.y+20–30，笑瘫压扁时整道弯掉到马甲和肩带上，深色叠深色当场看不见（第一版就是这样丢了眼睛）。
//   二、「整个人上下抖」：开心的节拍——压一下、蹿一下，两帧一换（一帧一换会闪）。前 10 帧小抖（只拉长 10），10–20 三下蹦起来（离地 10、10、20），
//       越蹦越高，第三下到顶时帽子被颠起来 15，这就是表情包定的那一帧（第 19 帧）。
//   三、「捂着肚子」：两只手 skinSide 按在肚子上，一边一只、中间隔着怀表。第一版两只手并在正中，40×20 一整块正好在两眼下面，乍一看是张开的大嘴——他没有嘴，所以分开。
//   四、「两侧有抖动线」：身子两边各一道 15×30 的括号「( )」，蹦的时候往外抖 5、再多一道成「(( ))」。grey：深底和纸色浅底上都看得见。
//   五、「眼角笑出泪 / 笑瘫了拍地」：委屈那颗 10×10 的蓝泪挂在两个外眼角；每蹦一下从眼角甩出一对泪珠，往外上方飞三帧。
//       第 21 帧一帧到位地瘫下去（从离地 20 一下砸到压扁 10、帽子再沉 5，整个人矮 35），两手甩到帽檐两边，然后左右轮流往地上捶，
//       捶哪边身子就往哪边歪 5，落手那一帧手边炸一颗小金星（开心那颗 smallStar 的新版 sparkle）加一小撮灰；最后两手一起砸一下，趴着喘三帧，爬起来接回首帧。
//
// 首帧闭着眼（check.firstFrameEyesClosed）：大笑的脸本来就是这两道弯，首帧睁眼反倒不像在笑。它不会被看成睡着——
// 弯是往上挑的、眼角挂着泪、两边有抖动线、手捂着肚子，四样一起在静图里。

// 每一帧在干什么：B 站着捂肚子、u 笑得往上一抽（拉长 10）、U 蹦起来、D 落地压一下、P 第三下蹦到顶（帽子颠飞）、
// W 瘫下去两手甩起、sL / sR 左手 / 右手捶地、sB 两手一起砸、Z 趴着喘、R 爬起来
const PHASE = [
  'B', 'B', 'u', 'u', 'B', 'B', 'u', 'u', 'B', 'B',
  'U', 'U', 'D', 'D', 'U', 'U', 'D', 'D', 'P', 'P',
  'P', 'W', 'W', 'sL', 'sL', 'sR', 'sR', 'sL', 'sL', 'sR',
  'sR', 'sB', 'sB', 'Z', 'Z', 'Z', 'R', 'R', 'B', 'B',
  'u', 'u', 'B', 'B', 'B'
];
// 瘫下去只压到 10：压 15 闭眼那道弯的两只脚就落进肩带，压 20 整道弯都在马甲上——马甲钉在身子底边往上 20，不跟着压扁走。
// 矮下去的那一截靠帽子再沉 5、从半空砸下来那一下的落差（35）、和两只手趴到地上来补
const SQUASH = { B: 0, u: -10, U: -5, P: -5, D: 5, W: 10, sL: 10, sR: 10, sB: 10, Z: 10, R: 5 };
const JUMP = { U: -10, P: -20 };
const DX = { sL: -5, sR: 5 };
const LOW = new Set(['W', 'sL', 'sR', 'sB', 'Z']);
const SHAKE = new Set(['B', 'u', 'U', 'D', 'P']);
const HOPS = [10, 14, 18];                       // 每一下蹦起来的那一帧，从眼角甩一对泪珠
const HIT = { sL: [23, 27, 31], sR: [25, 29, 31] };   // 手落地的那一帧
const bodyY = i => 263 + (JUMP[PHASE[i]] || 0) - 55 + SQUASH[PHASE[i]];
// 泪珠离开眼角之后三帧的位置（相对左眼角那颗泪；右边左右对称）：先往外上方甩，再往下掉一点就没了。
// 第一版头一帧只甩出 15（落在 85–95 / 205–215），礼帽底下是空的，可风雪帽的护耳顺着脸两边一直垂到 80–100 / 200–220——
// 10、14、18 三下蹦起来，两颗泪珠整颗压在毛护耳上（各 100 个像素，effects 在最上层，一粒蓝贴在米色毛上）。
// 现在头一帧就甩到护耳外头（左 70–80、右 220–230），后两帧再往外 10、5：泪离开眼角那一下本来就是「甩」，一帧到位比贴着脸挪更像。
// 最高到起跳那一帧的头顶那一行、最外到 x 55 / 245——都在帽子框和护耳外头、抖动线（y ≥ 228）上面，五顶帽子都不撞（verify 每帧量）
const DROP = [[-30, -10], [-40, -20], [-45, -15]];
const ARC_L = ['001', '010', '100', '100', '010', '001'];
const ARC_R = ['100', '010', '001', '001', '010', '100'];
const cells = rows => rows.join('').split('').filter(c => c === '1').length * 25;

module.exports = {
  id: 'laughing',
  label: '大笑',
  frames: 45,
  ms: [70, 60, 70],
  group: 'emotion',
  keyframes: [0, 2, 10, 19, 21, 23, 25, 33],
  // 表情包定帧是第 19 帧：第三下蹦到顶、帽子颠飞 15、两边「(( ))」、眼角甩出一对泪
  stickerFrame: 19,
  // giggle：[1015 复审] 揉他一下要是整圈放，连笑瘫捶地都得等三秒放完；1–8 是捂着肚子咯咯地抖（站着两帧、一抽两帧），
  // 第 8 帧和第 1 帧逐像素全等，接回去还是两帧一换，揉他放这一段
  segments: [{ id: 'giggle', from: 1, to: 8, loop: true }],

  pose(i) {
    const ph = PHASE[i], jump = JUMP[ph] || 0, low = LOW.has(ph);
    const dx = DX[ph] || 0, prevDx = DX[PHASE[(i + 44) % 45]] || 0;
    // 捂肚子：画出来在 110–130 / 170–190 × 238–258，一只眼睛底下一只。手底最多到 258，再往下就贴到脚顶连成一条，像多了两只脚；
    // 落地压 5 时眼睛那道弯的脚正好落到 238，和手顶挨着不叠。蹦起来手跟着身子走（手不自己跟 jump）
    const belly = [{ x: 120, y: 233 + jump, color: 'skinSide' }, { x: 160, y: 233 + jump, color: 'skinSide' }];
    // 瘫下去的两只手：甩起来在帽檐两头外面（55–75 / 225–245 × 213–233，离身子正好 15，不进帽子框），捶下去手底贴着地 273。
    // 身子往哪边歪 5 手就跟着挪 5，离身子永远是 15 和 10
    // [1015 复审] 捶在地上的手用 skinSide：和脚同色同大、也落在 263–273，70pt 下像脚往两边劈开又多长了两只；暗一档就分得出是手
    const up = [{ x: 65 + dx, y: 208 }, { x: 215 + dx, y: 208 }], ground = [{ x: 70 + dx, y: 248, color: 'skinSide' }, { x: 210 + dx, y: 248, color: 'skinSide' }];
    const hands = ph === 'W' ? up
      : ph === 'sL' ? [ground[0], up[1]]
      : ph === 'sR' ? [up[0], ground[1]]
      : ph === 'sB' || ph === 'Z' ? ground
      : ph === 'R' ? [{ x: 85, y: 228 }, { x: 195, y: 228 }]   // 爬起来：两手从地上收回身侧，下一帧按回肚子
      : belly;
    return {
      dx, jump, squash: SQUASH[ph],
      eyes: 'closed', gazeY: -5,
      // 瘫着的时候帽子再沉 5：闭眼又提了 5，帽檐离那道弯还空 10 行，不压
      hatDrop: low ? 5 : 0,
      // 第三下蹦到顶：18 那一帧抬 10，正好抵掉收尾自动算的落后（往上冲压低一半 = 10），帽子还扣在头上；
      // 19 一帧颠飞、离头 15（70pt 下 3 个点的缝，10 只剩 2 个点，看不出是「飞」），20 往回落到 10，21 跟着人一起砸回来
      hatLift: i === 19 ? 15 : ph === 'P' ? 10 : 0,
      hands,
      // 左右歪 5 时包会被收尾按横移自动甩 ±10–20°，包角会甩进右脸，这里把它摆正
      bag: { a: -2 * (dx - prevDx) },
      // 瘫着两只脚往外劈 5；身子左右歪的时候脚钉在地上不跟着滑
      footOffsets: low ? [-5 - dx, -dx, -dx, 5 - dx] : [0, 0, 0, 0]
    };
  },

  paint(ctx, p, i) {
    const ph = PHASE[i];
    // 倒 U 的两只脚：贴在闭眼那道横的两头下面（ink，和眼睛同色），这样 70pt 下读出来是「^ ^」不是「– –」
    ctx.eyes.forEach((e, n) => {
      const d = e.drawn;
      ctx.effects.rect(d.x - 5, d.y + 5, 5, 5, 'ink', `smile-${n + 1}-a`);
      ctx.effects.rect(d.x + 10, d.y + 5, 5, 5, 'ink', `smile-${n + 1}-b`);
    });
    // 外眼角挂着的泪：委屈那颗 10×10 blue，挨着弯的外脚往下挂一格。
    // [1015 复审] 笑瘫在地上那几帧（W / 捶地 / 趴着喘）不挂：身子压扁 10，眼睛那道弯落到马甲顶上，右边那颗泪正好掉在包盖上（蓝压在米色上）、
    // 左边那颗压在马甲边上；穿睡衣时两颗蓝泪又挂在那道奶白领口两头，像咧开的嘴角。泪在蹦的那三下已经甩出去了，瘫下去只剩捶地，意思不少
    const l = ctx.eyes[0].drawn, r = ctx.eyes[1].drawn;
    if (!LOW.has(ph)) {
      ctx.effects.rect(l.x - 15, l.y + 5, 10, 10, 'blue', 'tear-left');
      ctx.effects.rect(r.x + 15, r.y + 5, 10, 10, 'blue', 'tear-right');
    }
    // 每蹦一下甩出去的一对泪珠：轨迹按起跳那一帧的眼角算（离开眼角就不再跟着身子走）
    for (const h of HOPS) {
      const k = i - h;
      if (k < 0 || k >= DROP.length) continue;
      const sy = bodyY(h) + 20, [ox, oy] = DROP[k];
      ctx.effects.rect(100 + ox, sy + oy, 10, 10, 'blue', 'spray-left');
      ctx.effects.rect(190 - ox, sy + oy, 10, 10, 'blue', 'spray-right');
    }
    // 抖动线：站着、落地是一道贴在 55 / 230，往上抽、蹦起来的帧往外抖 5；蹦起来再多一道成「(( ))」。
    // 左边 x ≤ 70、右边 x ≥ 230：风雪帽的毛领宽到 80–220、包到 224，都让开了
    if (SHAKE.has(ph)) {
      const out = ph === 'B' || ph === 'D' ? 0 : 5;
      ctx.effects.pattern(ARC_L, 55 - out, 228, 'grey', 5, 'shake-left');
      ctx.effects.pattern(ARC_R, 230 + out, 228, 'grey', 5, 'shake-right');
      if (ph === 'U' || ph === 'P') {
        ctx.effects.pattern(ARC_L, 35, 228, 'grey', 5, 'shake-left-2');
        ctx.effects.pattern(ARC_R, 250, 228, 'grey', 5, 'shake-right-2');
      }
    }
    // 捶地：手落地那一帧，手外侧冒一颗 15×15 金星、地上一小撮灰；下一帧灰往外散 5、星没了。
    // 只往外侧冒：内侧是脚，effects 压到脚上引擎直接报错
    const hl = ctx.hands[0], hr = ctx.hands[1];
    if (HIT.sL.includes(i)) {
      ctx.effects.pattern(ctx.shapes.sparkle, hl.x - 25, 238, 'gold', 5, 'hit-left');
      ctx.effects.pattern(['01', '11'], hl.x - 15, 263, 'grey', 5, 'dust-left');
    }
    if (HIT.sR.includes(i)) {
      ctx.effects.pattern(ctx.shapes.sparkle, hr.x + 30, 238, 'gold', 5, 'hit-right');
      ctx.effects.pattern(['10', '11'], hr.x + 25, 263, 'grey', 5, 'dust-right');
    }
    if (HIT.sL.includes(i - 1)) ctx.effects.pattern(['01', '11'], hl.x - 20, 258, 'grey', 5, 'dust-left');
    if (HIT.sR.includes(i - 1)) ctx.effects.pattern(['10', '11'], hr.x + 30, 258, 'grey', 5, 'dust-right');
  },

  check: {
    firstFrameEyesClosed: true,
    // 这一支自己的不变量：笑的那几样每一帧都得在、都露全，不然 70pt 下这张就只剩一个闭眼的小人
    verify(i, { shown, pose, meta, layers }) {
      const out = [], ph = PHASE[i];
      // 我画的东西（泪、泪珠、星、灰、抖动线）一粒都不许落在帽子上：effects 在最上层，压上去就是帽子上多一块色。
      // 礼帽底下量着是空的不算数——风雪帽的护耳垂到脸两边，第一版甩出去的泪珠就整颗贴在护耳上（check-art --outfit 也跑这一条）
      let onHat = 0;
      for (let k = 3; k < layers.hat.length; k += 4) if (layers.hat[k] && layers.effects[k]) onHat++;
      if (onHat) out.push(`泪、星、灰或抖动线压在帽子上 ${onHat} 个像素`);
      for (const n of [1, 2]) for (const s of ['a', 'b']) if (shown(`smile-${n}-${s}`) < 25) out.push(`眼睛那道弯缺了一只脚（smile-${n}-${s}）`);
      if (!LOW.has(ph)) for (const tag of ['tear-left', 'tear-right']) if (shown(tag) < 100) out.push(`外眼角的泪（${tag}）被盖住了`);
      if (SHAKE.has(ph)) for (const tag of ['shake-left', 'shake-right']) if (shown(tag) < cells(ARC_L)) out.push(`抖动线 ${tag} 没露全`);
      const [hl, hr] = pose.hands;
      if (ph === 'sL' && hl.y + 20 !== 273) out.push('左手捶地那几帧手底要贴着地 273');
      if (ph === 'sR' && hr.y + 20 !== 273) out.push('右手捶地那几帧手底要贴着地 273');
      if ((ph === 'B' || ph === 'u' || ph === 'D') && Math.max(hl.y, hr.y) + 20 > 258) out.push('捂肚子的手底低过 258，要贴到脚上了');
      // 表情包那一帧（19）帽子得真离开头顶：帽檐底离身子顶至少 10
      if (i === 19) {
        const hatBottom = meta.body.y + pose.hatLag + pose.hatDrop - (pose.tool.hatLift || 0);
        if (hatBottom > meta.body.y - 10) out.push('第 19 帧帽子没被颠起来');
      }
      return out;
    }
  }
};
