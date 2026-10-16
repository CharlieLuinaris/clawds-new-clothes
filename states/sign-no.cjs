// clawds-new-clothes · states/sign-no.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 举❌牌：她点名「一定想要」的那一对里的「不行」。参考是 ref-7 第一格——右手举一面红底白叉的圆牌，眼睛半眯、面无表情地往旁边一撇。
// 这一格靠什么读出来：脸边一大块红圆牌 + 牌上一个白叉 + 死鱼眼。小家伙没有嘴，所以押在三样上：
// 牌子要大（30 / 48pt 下只剩一颗红圆点也得认得出是「举着一块牌」）、叉要在红底上露得出红、眼睛是半眼往旁边挪 5。
//
// 和举✅牌（sign-yes）是一对，骨架照它抄，一个数不改：同一只手（右手举着 x 220 / y 180，放到半路 213、垂下 238、蓄力 243 时 x 215）、
// 同一个柄（手顶往上 leatherLight 5×15）、同一块牌（11 格的圆、ink 描一圈边，参考图里牌子就描着黑边——白底聊天里贴出去才有边）、
// 同一个举法（0–21 举着，22 放到半路，23–34 垂在身侧、牌子往外斜一格挪到 paper 层藏到头后面，33–34 往下一沉，35 一帧举回去）。
// 两支只换牌面（红底白叉 / 绿底白勾）、眼神（死鱼眼往旁边撇 / 眨眼笑）和举到位之后那一下（左右摇「不行」/ 蹦起来）。
//
// 牌子放哪：帽子框（待机 80–220 × 168–208）归帽子。举着的时候手画在 230–250 × 185–205、牌面在 215–270 × 115–170，
// [1015 复审] 原来手在 225–245 × 190–210，盖掉睡帽绒球（吊在帽框 x 130–150，待机画面 210–230 × 188–208）右边 5 列，
// 和 sign-yes 一起往右让 5、往上提 5，左边正好贴着绒球；摇到左边那三帧牌面挪到 205 起，verify 每帧数一遍压没压帽子
// （check-art --outfit 穿四套衣服也跑这一条），举着的手也不许压帽子。
// 垂下来的时候牌面落在帽檐右头那一块，照 sign-yes 画在最底的 paper 层：帽子、身子都在它前面，换了哪套帽子都是帽子盖住牌；
// 而且往外斜一格（牌面 220–275）：原来直着垂，睡帽的绒球正落在白叉上，米色压白色糊成一块。
const HX = 220, UP = 180;                              // 举着的右手：画出来 230–250 × 185–205
const HX_LOW = 215, MID = 213, REST = 238, DIP = 243;  // 放到半路 / 垂到底 / 蓄力的右手（画出来 225–245）
const DISC = [
  '...KKKKK...',
  '..KRRRRRK..',
  '.KRRRRRRRK.',
  'KRRRRRRRRRK',
  'KRRRRRRRRRK',
  'KRRRRRRRRRK',
  'KRRRRRRRRRK',
  'KRRRRRRRRRK',
  '.KRRRRRRRK.',
  '..KRRRRRK..',
  '...KKKKK...'
];
const only = (rows, ch) => rows.map(r => [...r].map(c => (c === ch ? '1' : '0')).join(''));
const RIM = only(DISC, 'K'), FACE = only(DISC, 'R');

module.exports = {
  id: 'sign-no',
  label: '举❌牌',
  frames: 45,
  ms: [70, 60, 70],
  group: 'sticker',
  // 首帧（表情包定帧：牌到位、半眼往旁边撇）、看她一眼、放到半路、垂着、蓄力、举回去、往左摇、往右摇
  keyframes: [0, 12, 22, 23, 33, 35, 37, 40],
  // 表情包定帧是首帧：右上红牌白叉、半眼往右一撇、帽檐沉 10 压在眼皮上
  stickerFrame: 0,

  // 节奏（45 帧 3 秒）：
  //   0–3   举着，半眼往右撇（gazeX 5），帽子沉 10 压在眼皮上——这一帧就是表情包，也是暂停、省电时的静图；
  //   4–5   慢慢眨一下（半眼 → 闭 → 半眼）；4 是老动作没用过的眨眼起点；
  //   12–15 眼珠回到正中，看她一眼，帽檐跟着眼皮抬 5；16 又撇开、帽檐又压下来——「往旁边一撇」；
  //   22    放到半路，23–30 牌子垂着、藏到头后面，眼睛还撇着；
  //   31–32 慢慢眨一下（和 sign-yes 同一拍眨，两支摆在一起是一对）；
  //   33–34 蓄力：手往下一沉、身子压 5，眼睛转回来看她（帽檐抬 5）——「又问？」；
  //   35    一帧举回去（手从 243 到 180，63，全片最大的一步），身子拉长 5，眼睛同时一撇撇开；36 到位，和首帧一样；
  //   37–39 牌往左摇（牌面左挪 10、柄斜成一道台阶、手腕转 −10°），40–42 往右摇——「不行」；每边停三帧，摇得慢，像懒得多动；
  //   43–44 回到首帧，和第 0 帧逐像素全等，接缝为零。
  // 最长的静止段是 23–30 那 8 帧（老动作修过的线是 9）。身子不跳不歪、左手垂着：面无表情的不动，才衬得出牌子在动。
  pose(i, { closedAt }) {
    const up = i <= 21 || i >= 35;
    const shake = i >= 37 && i <= 39 ? -1 : i >= 40 && i <= 42 ? 1 : 0;
    const squash = i === 33 || i === 34 ? 5 : i === 35 ? -5 : 0;
    const hy = up ? UP + squash : i === 22 ? MID : i === 33 || i === 34 ? DIP : REST;
    const atHer = (i >= 12 && i <= 15) || i === 33 || i === 34;
    return {
      squash,
      // 死鱼眼：半眼往旁边一撇，帽檐沉 10 压在眼皮上。
      // [1015 复审] 原来整支沉 5，半眼（下半截 10×10）上头还空着 10 行皮肤，70pt 下就是两颗中性的小黑点，和小方点分不出来，
      // 「懒得理你」全靠牌子在说。沉 10 檐底就落在半眼顶上 5，像一片耷拉下来的眼皮（半眼帽檐最多让 12，收尾夹得住）；
      // 看她那几帧眼皮抬一点（沉 5），眼睛撇开就又压下来——帽子跟着眼神一抬一压，比一直不动更像在翻白眼
      hatDrop: atHer ? 5 : 10,
      eyes: closedAt(4, 31) ? 'closed' : 'half',
      gazeX: atHer ? 0 : 5,
      // 左手垂在身侧、跟着身子压和拉；右手举牌，摇的时候手腕转 10°，手心不挪
      hands: [{ x: 80, y: 218 + squash }, { x: up ? HX : HX_LOW, y: hy, a: 10 * shake }],
      // tilt：牌往哪边斜一格。摇牌是 ±1；垂下来往外斜 1，让开睡帽的绒球
      tool: { sign: up ? 'up' : 'down', tilt: up ? shake : 1 }
    };
  },

  // 画牌：位置全从这一帧真画出来的右手算（举着时手左上角 (230, 185)，柄在 240–245 × 170–185、牌面 215–270 × 115–170、叉 230–255 × 130–155）。
  // 举着：柄和牌面在 props（手之上、脚之下），叉在 lettering（记号那一层）；垂着：三样都画在 paper，藏到头和帽子后面。
  // 叉用引擎现成的 ctx.shapes.cross（5×5 格、25px）：试过 7×7 台阶叉，四个笔尖顶到 ink 边上，70 下整块读成一块切成四瓣的白；
  // 7×5 的扁叉读成横着的沙漏。5×5 的四周空得出一圈红，白的分量（15 格）和那边的勾（18 格）差不多，摆在一起一样重。
  // 叉的白用 earWhite（和那边的勾同一个白）。斜的时候牌面整块横挪 10（叉跟着，不转——像素的叉一转就碎了），
  // 柄从手顶往上一格挪 5，斜成一道台阶接到牌底正中；不斜的时候三格叠成一根直柄，和 sign-yes 那根 5×15 一个像素不差
  paint(ctx, p) {
    const hand = ctx.hands[1], up = p.tool.sign === 'up', tilt = p.tool.tilt || 0;
    const back = up ? ctx.props : ctx.paper, mark = up ? ctx.lettering : ctx.paper;
    const col = hand.x + 10;
    for (let k = 0; k < 3; k++) back.rect(col + 5 * tilt * k, hand.y - 5 * (k + 1), 5, 5, 'leatherLight', k ? null : 'handle');
    const x0 = hand.x - 15 + 10 * tilt, y0 = hand.y - 70;
    back.pattern(RIM, x0, y0, 'ink', 5, 'sign');
    back.pattern(FACE, x0, y0, 'red', 5);
    mark.pattern(ctx.shapes.cross, x0 + 15, y0 + 15, 'earWhite', 5, 'cross');
  },

  check: {
    // 这一支自己的不变量：
    //   举着的帧，叉整个露着（15 格 = 375 个白像素），牌面连边也整块露着（97 格减掉叉压住的 15 格 = 2050）；
    //   牌、柄、叉一个像素都不压在帽子上，举着的右手也不压——穿哪套衣服都一样（check-art --outfit 也跑这一条）。
    //   垂着的帧牌子在 paper 层，本来就让帽子、身子盖着，不数。
    verify(i, { shown, layers, pose }) {
      const out = [];
      if (pose.tool.sign === 'up') {
        if (shown('cross') !== 375) out.push(`白叉只露出 ${shown('cross')}/375 个像素`);
        if (shown('sign') !== 2050) out.push(`红牌面只露出 ${shown('sign')}/2050 个像素`);
      }
      let onHat = 0, handOnHat = 0;
      for (let k = 3; k < layers.hat.length; k += 4) {
        if (layers.hat[k] && (layers.props[k] || layers.lettering[k])) onHat++;
        if (pose.tool.sign === 'up' && layers.hat[k] && layers['hand-right'][k]) handOnHat++;
      }
      if (onHat) out.push(`牌子压在帽子上 ${onHat} 个像素`);
      // 举着的右手也不压帽子：睡帽的绒球就吊在檐右头外面（和 sign-yes 同一条）
      if (handOnHat) out.push(`举牌的右手压在帽子上 ${handOnHat} 个像素`);
      return out;
    }
  }
};
