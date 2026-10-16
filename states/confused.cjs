// clawds-new-clothes · states/confused.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 歪头疑惑：她说「我想不起来 / 看不懂」、他接不住话的时候放这一支。表情包就是那张「啊？」。
//
// 意思全押在四样大剪影上，70pt 下一样一样认：
//   ① 整个人歪过去——身子 dx ±5 往一边探、脚用 footOffsets 钉在原地不跟着走，帽子 hatShift ±5 再多探一格：脚、身子、帽子三层一层比一层错出去 5，
//      剪影是一级一级斜上去的台阶，看着是头探出去、不是人挪了一步。
//      [1015 复审] 第一版是 lean ±5（身子绕脚底转 5°）带 dx：45 帧里 38 帧在转，静图第 0 帧、表情包第 24 帧都在里头。
//      转过的身子和马甲边是一级一级 1px 的锯齿，低的那头帽檐和头之间开 1–2px 的楔形缝（34 列）、翘起的那个身子角离开最边上那只脚 4px；
//      30–90pt 看不见，可表情包要最近邻放大 ×2 / ×3 贴到白底聊天里，锯齿成了 2–3px、檐下那道缝是一条白线。
//      lean 拿掉以后每一块都还在 5 格上，帽子扣在头顶一个像素的缝都没有；「歪」交给错开的三层、一大一小的两只眼、举在帽檐上的那只手
//   ② 一只眼半眼、一只睁着——往哪边歪，那边的眼眯着（半眼），另一边睁着（像挑起一边眉毛）；换边歪的时候两只眼也换。
//   ③ 左手挠帽檐——扶帽致意那只手换成左手，贴在左边帽檐尖上，每两帧上下 5、转 15° 来回挠；挠一阵停一阵，
//      一直不停地挠 70pt 下像手在抖，停拍让「挠——想——再挠」分得出来。
//   ④ 右上一个金色问号——全片第一个问号，10px 一格：歇着是 4×6 格（40×60），冒出来那一下 5×7 格（50×70），
//      瘪下去、刚冒头的那两帧是 3×5 格。金色落在纸色浅底（paper）上对比不够，右下垫一层 leather 的影子错开 5，
//      纸底上是一道棕边、深底上像帽子那条皮带一样压出厚度。问号整个放在帽子框外头（x ≥ 230、连影子底 ≤ 185）：
//      睡帽的绒球吊在 x 220–240 × 188–208，贝雷帽顶粒在正中，四套帽子都碰不到它。
//
// 她递的 ref-1 第一格「loading…空白大脑飞速运转」只取「脑子空了」那口气：中间有一段人回正、两只眼缩成小方点、
// 挠到一半的手僵在帽檐上，问号瘪成一个点、再一颗一颗长成「…」——想不出来——然后「啊？」一下问号顶出来、头歪到另一边。
//
// 节拍（45 帧，70/60/70ms，一圈 3 秒）：
//   0–13   往右歪，左眼睁右眼半，问号歇着；0–7 挠，8–13 停住、8–9 睁着那只眨一下。首帧就是静图：歪着、问号在、一只眼睁着
//   14     问号缩成 3×5，手停
//   15–21  回正（帽子落后一帧，15 还挪着 5），两眼小方点；15 冒一个点、17 两个、19 三个：loading…
//   22     预备：压 5，三个点没了，问号先冒出一个小的
//   23     一帧到位的大步：往左歪、拉长 5，问号顶到最大 5×7；帽子落后一帧（还在 0）
//   24     帽子跟上，问号还是最大——表情包定这一帧
//   25–38  往左歪，左眼半右眼睁；25 刚顶出来先落回原高，26–35 接着挠（31–32 睁着那只眨一下），36–38 停
//   39     一帧甩回往右歪（第二个大步），帽子落后一帧；包被甩得太狠，压回一半
//   40–44  往右歪接着挠，挠的手按同一个两帧节拍走，44 和 0 同一个姿势：接缝为零
const Q_SMALL = ['111', '001', '010', '000', '010'];
const Q_REST = ['0110', '1001', '0001', '0010', '0000', '0010'];
const Q_BIG = ['01110', '10001', '00001', '00010', '00100', '00000', '00100'];
// 问号底边钉在 y 180、横向以 x 255 为中线：从小到大是从那一点往上「长」出来的，不是整个往上跳
const Q_BOTTOM = 180, Q_MID = 255;
const questionAt = i => (i === 14 || i === 22 ? Q_SMALL : i === 23 || i === 24 ? Q_BIG : i >= 15 && i <= 21 ? null : Q_REST);

module.exports = {
  id: 'confused',
  label: '歪头疑惑',
  frames: 45,
  ms: [70, 60, 70],
  group: 'emotion',
  // 往右歪歇着 / 问号瘪了 / 一个点 / 三个点 / 预备 / 问号最大（表情包）/ 往左歪歇着 / 甩回来
  keyframes: [0, 14, 15, 19, 22, 24, 30, 39],
  // 表情包定帧是第 24 帧：问号顶到最大 5×7、头歪到左边、帽子刚跟上——「啊？」
  stickerFrame: 24,

  pose(i, { curve }) {
    // tilt：1 往右歪、0 回正、-1 往左歪。曲线点都落在整帧上，中间没有零头，每一下都是一帧到位
    const tilt = curve(i, [[0, 1], [14, 1], [15, 0, 'l'], [22, 0], [23, -1, 'l'], [38, -1], [39, 1, 'l'], [44, 1]]);
    const dx = 5 * tilt;
    // 帽子落后一帧：身子换方向的那一帧（15、23、39）帽子还停在半路，下一帧才扣回头顶正中
    const hatShift = i === 15 ? 5 : i === 23 || i === 39 ? 0 : 5 * tilt;
    const squash = curve(i, [[0, 0], [21, 0], [22, 5, 'l'], [23, -5, 'l'], [24, -5], [25, 0, 'l'], [44, 0]]);
    // 挠：每两帧换一下（双数段在上、单数段在下往外 5、转 −15°），只在 40–7、26–35 这两阵里挠，别的帧停在上面
    const scratching = i >= 40 || i <= 7 || (i >= 26 && i <= 35), up = !scratching || Math.floor(i / 2) % 2 === 0;
    // 手贴着左帽檐尖（帽子不转，檐是平的，手的高度只跟 squash 和挠的那一下走）；手不跟 dx、squash，自己加
    const handY = 183 + squash + (up ? 0 : 5);
    const left = { x: 90 + dx - (up ? 0 : 5), y: handY, a: up ? 0 : -15 };
    // 右手垂在身侧，往右歪的时候跟着那一边的身子沉 5、往左歪翘 5——身子不转了，这一高一低帮着读出「歪」
    const right = { x: 200 + dx, y: 218 + 5 * tilt + squash };
    let eyes = tilt > 0 ? ['open', 'half'] : tilt < 0 ? ['half', 'open'] : 'dot';
    if (i === 8 || i === 9) eyes = ['closed', 'half'];
    if (i === 31 || i === 32) eyes = ['half', 'closed'];
    const plant = -dx;
    return {
      dx, squash, hatShift, eyes,
      // 眼珠往歪的那边挪 5：头探出去了，眼睛跟着往那边看
      gazeX: 5 * tilt,
      hands: [left, right],
      footOffsets: [plant, plant, plant, plant],
      // 39 一帧横跨 10，收尾会把包甩 20°，包底甩出身子右下角；先压回 10°，还看得出被甩了一下
      ...(i === 39 ? { bag: { a: -10 } } : {})
    };
  },

  paint(ctx, p, i) {
    const draw = (rows, x, y, tag) => {
      ctx.effects.pattern(rows, x + 5, y + 5, 'leather', 10);
      ctx.effects.pattern(rows, x, y, 'gold', 10, tag);
    };
    const rows = questionAt(i);
    if (rows) {
      const w = rows[0].length * 10, h = rows.length * 10;
      draw(rows, Q_MID - w / 2, Q_BOTTOM - h, 'question');
      return;
    }
    // loading…：三个 10×10 的点，隔 10，和问号那一点齐底。从 x 235 起：15 那一帧帽子还落后挪着 5，睡帽绒球顶在 (215–235, 188)，
    // 第一个点放在 230 的话影子离绒球只有 3px
    const n = i >= 19 ? 3 : i >= 17 ? 2 : 1;
    for (let k = 0; k < n; k++) draw(['1'], 235 + 20 * k, Q_BOTTOM - 10, `dot-${k + 1}`);
  },

  check: {
    // 这一支自己的两条：
    // 一、问号和点（连影子）离帽子至少 5px——四套衣服的帽子往外冒（睡帽绒球吊在右边帽口外头、风雪帽兜帽鼓出来），
    //     贴上去就分不清是问号还是帽子上长的东西。按像素量：effects 层上我画的每一格，四周 5 以内不许有 hat 层的像素；
    // 二、表情包定的第 24 帧，问号必须是最大那一档 5×7（50×70）——谁改了节拍把它挪走，这里会喊
    verify(i, { part, parts, layers }) {
      const out = [], W = 300, fx = layers.effects, hat = layers.hat;
      for (const q of parts()) {
        const xs = q.polygon.map(pt => pt[0]), ys = q.polygon.map(pt => pt[1]);
        let hit = 0;
        for (let y = Math.max(0, Math.min(...ys)); y < Math.min(W, Math.max(...ys) + 5); y++)
          for (let x = Math.max(0, Math.min(...xs)); x < Math.min(W, Math.max(...xs) + 5); x++) {
            if (!fx[(y * W + x) * 4 + 3]) continue;
            for (let v = Math.max(0, y - 5); v <= Math.min(W - 1, y + 5) && !hit; v++)
              for (let u = Math.max(0, x - 5); u <= Math.min(W - 1, x + 5); u++) if (hat[(v * W + u) * 4 + 3]) { hit = 1; break; }
          }
        if (hit) out.push(`${q.tag.split('/').pop()} 离帽子不到 5px`);
      }
      if (i === 24) {
        const q = part('question');
        if (!q || q.w !== 50 || q.h !== 70) out.push('第 24 帧是表情包定帧，问号要是最大的 5×7');
      }
      return out;
    }
  }
};
