// clawd-new-coat · states/surprised.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 震惊愣住：她点他一下，他「啊？」。
// 原来点他一下（poke / tap）只会放开心，被戳到的那一下没有脸；这一支就是那张脸，当表情包也是「啊？」。
//
// 和报错分得开：报错是整个人吓得蹦起来、头顶一根红「!」；这一支脚钉在地上一动不动，只有帽子自己弹起来悬着，
// 眼睛缩成小方点、外头撑开一圈眼白，两手拍到脸边，头顶迸一圈金线。
//
// 她递的参考图 ref-2 第二格（星星眼那只猫）只取了两样：眼睛一下子变大、整个人钉在那里。猫是黑瞳仁套一圈浅黄的大圆眼，
// 他的眼睛只有 10×20 一格画不大，就让瞳仁缩成小方点（dot），外面用 props 层补一圈 white 5px 的眼白——整只眼睛撑到 20×20，
// 比平常睁眼还大一圈，「瞪圆了、瞳仁缩小了」，70pt 下是两粒亮方块里各一个黑点。white 是带黄的米白，正好是参考图里那圈浅黄。
//
// 首帧就是愣住的样子（帽子悬着、手在脸边、金线全开）：暂停、省电、减少动态效果只显示第 0 帧，推送和表情包定帧也取这一张；
// 点他一下就从第 0 帧放，被戳到的反应是即时的，不用先站两帧。放一遍就回待机用 segments 里的 once（0–40，第 40 帧和 idle/0 逐像素全等）；
// 41–44 是 GIF 循环里的「再吓一次」，只给表情包和整圈循环用。
//
// 节拍（45 帧，复用：扶帽致意的抬帽、鼓脸的半眼、害羞的手位、摇铃的金线）：
//   43–44、0–14 愣住：帽子悬在头顶 15（扶帽致意抬 12，这里取 5 格上的 15，檐底和头顶之间空三格，70pt 下是一道看得见的缝），
//                    金线每 5 帧往外胀一格再缩回来（5–9 外、其余内）——两帧一闪 70pt 下是闪边，五帧一换才像嗡嗡的；
//   15 一帧砸回来：帽子从悬着一下扣到底还多沉 5、身子被砸扁 5、眼睛挤紧，手跟着身子往下 5，金线和眼白一起没了；
//   16 帽子弹一下（抬 5）；16–23 半眼发懵——鼓脸那种半眼，这里是被砸了一下的「……」；18–19、22–23 眨两下（18 是 45 帧里空着的起点，
//      22 和老动作撞了起点，但这两下跟着砸帽子走、闭的是半眼不是睁眼，和别的动作的眨眼不会两帧整张一样）；
//   24 一帧回神：睁眼，两手从脸边放回身侧；25–28 抬眼看帽子还在不在；29–40 站好，和待机首帧一样，31–32 回过神来眨一下
//      （第一版 29–40 连着 12 帧整张一样，循环放着有 0.8 秒是一张静图——老动作修过的线是 9；31 是老动作没用过的眨眼起点）；
//   41 一帧缩（压 5、帽子沉 5、闭眼）当预备；42 一帧炸开：身子拉长 5、帽子一下飞到 20、两手往上外甩、眼睛缩点、金线贴着帽子冒出来；
//   43 帽子落到 15、手拍到脸边、金线往外走一格；44 和首帧同一个姿势，接回 0 接缝为零。
// 三把尺：主位移是帽子（0→20 一帧、20→15、15→砸到底），次位移 5（压扁、拉长、帽子弹）；1–3 的量一个没写；不用 lean。
const HOLD_LIFT = 15, POP_LIFT = 20;
const held = i => i <= 14 || i >= 43;

// 两手拍在脸边：害羞的手位是托在下巴底下（skinSide 叠在脸上），这里抬到眼睛那一行、往外让出一半——
// 画出来 80–100 / 200–220 × 213–233，一半压在脸边（skinSide，不然皮肤叠皮肤看不见）、一半伸出身子外，70pt 下剪影两边各鼓一块；
// 离眼白那圈（110–130 / 170–190）还有 10，不压眼。转 20° 让手尖朝里斜，像捧着脸，不像身子两边多长了两块方的
const FACE = [{ x: 90, y: 208, a: 20, color: 'skinSide' }, { x: 190, y: 208, a: -20, color: 'skinSide' }];
const faceHands = (dy = 0) => FACE.map(h => ({ ...h, y: h.y + dy }));

module.exports = {
  id: 'surprised',
  label: '震惊愣住',
  frames: 45,
  ms: [70, 60, 70],
  group: 'emotion',
  keyframes: [0, 15, 16, 18, 24, 25, 41, 42],
  // 表情包定帧是首帧，愣住的那一下：帽子悬着、眼白撑开、金线全开
  stickerFrame: 0,
  // once：点他一下放一遍就回待机（第 40 帧和 idle/0 逐像素全等）。
  // sticker：[1015 复审] 整圈做成 GIF 有将近一半时间（24、29–40）和待机一样，当表情包循环太闷；0–14 是愣住那一下，
  // 帽子悬着、金线一胀一收，第 14 帧和第 0 帧逐像素全等，自己就是一张短循环的表情包
  segments: [{ id: 'once', from: 0, to: 40, loop: false, next: 'idle' }, { id: 'sticker', from: 0, to: 14, loop: true }],

  pose(i, { closedAt }) {
    if (held(i)) return { hatLift: HOLD_LIFT, eyes: 'dot', hands: faceHands() };
    // 砸回来：帽子沉 5 要眼睛让得出——闭眼让 15，够
    if (i === 15) return { hatDrop: 5, squash: 5, eyes: 'closed', hands: faceHands(5) };
    if (i === 16) return { hatLift: 5, eyes: 'half', hands: faceHands() };
    if (i <= 23) return { eyes: closedAt(18, 22) ? 'closed' : 'half', hands: faceHands() };
    // 回神以后抬眼看帽子：睁眼往上看 5，帽子收尾那边会自己让，不用写
    if (i <= 28) return { gazeY: i >= 25 ? -5 : 0 };
    if (i <= 40) return { eyes: closedAt(31) ? 'closed' : 'open' };
    if (i === 41) return { squash: 5, hatDrop: 5, eyes: 'closed' };
    // 42：手往上外一甩（画在 75–95 / 205–225 × 203–223，大半在身子外，用 skin），下一帧才拍回脸上
    return { squash: -5, hatLift: POP_LIFT, eyes: 'dot', hands: [{ x: 85, y: 198, a: -15 }, { x: 195, y: 198, a: 15 }] };
  },

  paint(ctx, p, i) {
    if (!(held(i) || i === 42)) return;
    // 眼白：围着小方点一圈 5px，整只眼 20×20。按这一帧真画出来的点放（ctx.eyes[n].drawn），gaze 动了也跟得上
    ctx.eyes.forEach((e, n) => {
      if (!e.drawn) return;
      ctx.props.pattern(['1111', '1001', '1001', '1111'], e.drawn.x - 5, e.drawn.y - 5, 'white', 5, `ring-${n + 1}`);
    });
    // 金线：摇铃那两道 5px 的金线，这里绕着悬起来的帽子迸一圈——帽顶两侧两根竖的、帽肩往外上两道斜的、帽身两头两根横的，
    // 左右对着 150 对称。全部按 ctx.hat 放，帽子在哪线就跟到哪；帽顶往上空三行（15）才画，不进帽子框，换了贝雷帽的绒球也不撞。
    // 用 gold 不用 goldLight：goldLight 落在纸色浅底（paper）上几乎看不见，gold 深底浅底都认得出
    const k = i === 42 ? 0 : i === 43 ? 1 : i >= 5 && i <= 9 ? 3 : 2;
    const len = k === 0 ? 10 : 15, steps = k === 0 ? 2 : 3, out = 5 * k;
    // [1015 复审] 每一根右下垫一格 leather 的影子（错开 5，学疑惑那个问号）：金线是 5px 的细部，落在纸色浅底上对比只有 1.6，
    // 48pt 已经淡得快没了；垫一道棕边，纸上深底上都压得出一根「线」。同在 effects 层，影子全画完再画金线——
    // 左边那道斜线是一格一格往左上走的，下一格的影子正好落在上一格的金上，一根一根画的话那道斜线就只剩一粒金、底下全是棕。影子也带 tag，verify 一样量它压没压帽子
    const { x: hx, y: hy } = ctx.hat, rays = [];
    const gold = (x, y, w, h, tag) => rays.push([x, y, w, h, tag]);
    gold(hx + 45, hy - 15 - len - out, 5, len, 'ray-up-left');
    gold(hx + 90, hy - 15 - len - out, 5, len, 'ray-up-right');
    for (let s = 0; s < steps; s++) {
      gold(hx + 25 - 5 * s - out, hy - 10 - 5 * s - out, 5, 5, `ray-slant-left-${s}`);
      gold(hx + 110 + 5 * s + out, hy - 10 - 5 * s - out, 5, 5, `ray-slant-right-${s}`);
    }
    gold(hx - 15 - len - out, hy + 15, len, 5, 'ray-side-left');
    gold(hx + 155 + out, hy + 15, len, 5, 'ray-side-right');
    for (const [x, y, w, h, tag] of rays) ctx.effects.rect(x + 5, y + 5, w, h, 'leather', `${tag}-shadow`);
    for (const [x, y, w, h, tag] of rays) ctx.effects.rect(x, y, w, h, 'gold', tag);
  },

  check: {
    // 这一支自己的不变量，穿着衣服预览也查：
    //   一、愣住的帧帽子得真悬着：帽子框顶到头顶之间、脸中间那 60 列，得有连着 10 行一个像素都没有——这道缝就是这一支在 30 / 48pt 下唯一认得出的剪影；
    //   二、眼白那圈露全（20×20 少掉中间 10×10，300 个像素）、底下也不许垫着手或帽子：眼白只能画在 props 层，比手和帽子都高，
    //       手一挪进来就是眼白盖在手背上；露不全（被金线、脚盖了）就不是「瞪圆了」；
    //   三、金线不许压到帽子：线在 effects 最上层，压上去就把帽子啃出缺口，换了衣服的帽子更宽更高，这条最容易破
    verify(i, { pixels, layers, meta, part, parts, shown }) {
      const out = [];
      if (held(i)) {
        // 缝在哪儿要看穿的是哪顶：礼帽、贝雷、飞行帽、睡帽整顶抬起来，缝就在头顶上；风雪帽只有圆顶被掀起来，
        // 毛圈和护耳留在头上（outfits/winter-fur.cjs），缝在圆顶和毛圈之间。所以不钉死在头顶那 10 行，
        // 而是从帽子框顶往下一直数到头顶，脸中间那 60 列里得有连着 10 行一个像素都没有——哪顶帽子都得真被掀开一道缝
        const { x, y } = meta.body, p = meta.pose;
        const lift = Math.round(Math.max(p.tool.hatLift || 0, Math.abs(p.tool.hatTilt || 0) * 1.3));
        const hatTop = Math.round(y) - 40 + p.hatLag + p.hatDrop - lift;
        let run = 0, best = 0;
        for (let row = Math.max(0, hatTop); row < Math.round(y); row++) {
          let empty = true;
          for (let col = Math.round(x) + 30; col < Math.round(x) + 90 && empty; col++) if (pixels[(row * 300 + col) * 4 + 3]) empty = false;
          run = empty ? run + 1 : 0; best = Math.max(best, run);
        }
        if (best < 10) out.push(`帽子没悬起来：帽子框顶到头顶之间最长只空出 ${best} 行，要连着 10 行`);
        for (const tag of ['ring-1', 'ring-2']) {
          const q = part(tag); if (!q) continue;
          if (shown(tag) < 300) out.push(`${tag} 眼白只露出 ${shown(tag)}/300`);
          let under = 0;
          for (let yy = q.y; yy < q.y + q.h; yy++) for (let xx = q.x; xx < q.x + q.w; xx++) {
            const k = (yy * 300 + xx) * 4;
            if (layers.props[k + 3] && (layers.hat[k + 3] || layers['hand-left'][k + 3] || layers['hand-right'][k + 3])) under++;
          }
          if (under) out.push(`${tag} 眼白压在手或帽子上 ${under} 个像素`);
        }
      }
      for (const q of parts().filter(q => q.tag.includes('/ray-'))) {
        let hit = 0;
        for (let yy = q.y; yy < q.y + q.h; yy++) for (let xx = q.x; xx < q.x + q.w; xx++) if (layers.hat[(yy * 300 + xx) * 4 + 3]) hit++;
        if (hit) out.push(`${q.tag.split('/').pop()} 压到帽子 ${hit} 个像素`);
      }
      return out;
    }
  }
};
