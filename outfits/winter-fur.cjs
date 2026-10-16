// clawds-new-clothes · outfits/winter-fur.cjs · design by Charlie Luinaris, pixels & animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// 毛领风雪帽 · 冬衣（她 10/13 画的 winter-fur-a / winter-fur-b，10/15 照他的身板一格一格重画）
//
// 10/15 她点破的：她每套画的 a 是背面、b 是正面。第一稿把 a、b 当成了两件衣服，winter-fur 那件正面穿的其实是她画的背面。
// 这回只有一件：
// - 正面照 b：深蓝圆顶的兜帽、额头一圈往上长齿的米色毛、兜帽两边的深蓝一直包下来、底下垂两片毛护耳，脸开在这一圈毛中间；
//   下巴底下一圈毛领，领口一截浅蓝系带、带尾垂在金扣右边、末端剪成穗子；深蓝冬衣、棕腰带、一枚方方的大金扣。
// - a 只用在侧身（走、跑、跃、陪钓、看星星、画画……）露出来的后脑那半截：兜帽后面整块深蓝，额头那圈毛和毛领是上下两圈，
//   中间不是毛。第一稿侧身照正面的护耳往后推，把耳朵那一侧整片铺成了毛；她的背面上，毛只在上下两道。
//   上面那圈毛的下沿照 a 一块一块垂下来、缝里透出底下的深蓝——正面没有这个，正面那道下沿底下是脸。
//
// 摆法：
// - 兜帽（hat 层，礼帽那个 140×40 的框）：圆顶、毛圈、两边的深蓝、护耳（侧身是后脑那一片）是一整块，跟着帽子一起落后、沉、歪、横挪；
//   被抬起来（扶帽致意、震惊、大笑颠飞）只有圆顶走，毛圈和护耳留在头上——见 hat() 上面那段。
//   毛圈底边正好落在框底 y 40；y 40 往下正面只有护耳（框里 x 0–20 和 120–140），侧身只有后脑那片（x 0–95），眼睛都够不着。
// - 毛领、冬衣、系带（costume 层），宽度跟身子走；毛领往两边各鼓出 10，和兜帽一样宽 140。
// - 圆顶高度（框里 y −20 起，比礼帽高 20）照她的比例没动：打伞的伞面、伸懒腰举过头的手、晕乎乎绕到后面的那颗星都是按礼帽顶排的，
//   会叠到圆顶上——要不要压矮，还等她定。
//
// 颜色全从她原稿吸：布面深蓝、深蓝暗面、米色绒毛和亮面暗面、系带的浅蓝和它的暗面；腰带的棕和金扣的两种金
// 她原稿里用的就是老伦敦调色板里的 leather / gold / goldLight，一个像素都对得上，直接用老色。
// 第一稿圆顶最上一行描了一道 hatRim 灰，那是礼帽的老办法，她这顶上没有——深蓝 #2c3865 在 #0d1430 的夜色上自己认得出，拿掉了。

// 一格一个字母的点阵，按颜色拆成几张 0/1 的 pattern 交给 ctx.pattern——帽子框里和衣服画布上都是 5px 一格（地上那顶 10px）
const COLORS = { n: 'winterNavy', d: 'winterNavyDark', o: 'fur', l: 'furLight', s: 'furShade' };
function paint(ctx, rows, x, y, unit = 5) {
  for (const ch of new Set(rows.join('').replace(/\./g, ''))) {
    ctx.pattern(rows.map(row => [...row].map(c => (c === ch ? '1' : '0')).join('')), x, y, COLORS[ch], unit);
  }
}

// ── 兜帽：框里 28 格宽（140），从 y −20 起 12 行，最底一行是 y 35–40 ──
// 圆顶 6 行深蓝，一级一级放宽；毛圈 6 行，和圆顶一样高——她 b 上那圈毛就跟圆顶差不多厚，第一稿圆顶 7 行压着 5 行毛，帽子显得沉。
// 毛圈第一行是她画的那排「毛往上长」的齿（5 格毛、3 格蓝、8 格毛、3 格蓝、5 格毛，照她的疏密）。
// 两边各两格（框里 x 0–10、130–140）是兜帽本身的深蓝，从圆顶一直包到毛圈底下：她 b 上毛圈是嵌在兜帽开口里的，
// 两边那道深蓝把毛圈和底下的护耳隔开，不然毛圈、护耳、毛领连成一整块奶白方框，脸像嵌在一块面包里（第一稿就是这样）。
// [1015 她定的：压矮] 圆顶原来从 y −20 起、比礼帽高 20，照她原稿的比例；可伞面、伸懒腰举过头的手、晕乎乎的星、报错的「!」
// 都是按礼帽顶排的，样样撞进圆顶。她拍板压到礼帽一样高：顶行收成 45–95（和礼帽顶、伸懒腰两只手中间那道缝一样宽），
// 第二行张到 20–120 接上毛圈。圆顶矮了一半，兜帽的圆由毛圈那六行撑着，70pt 下还是一颗圆脑袋
// 圆顶三行、毛圈从 y 15 起（少一行）：伞杆从画面 (90,165) 竖到 180，毛圈顶行要是从 178 起、杆根就压在毛上（umbrellaDryBody 过不了）；
// 圆顶第三行从 x 15 起，杆根那一格（框里 x 10–15）正好空着
const DOME = [
  '.........nnnnnnnnnn.........', // y 0   顶行，和礼帽顶一样宽
  '.....nnnnnnnnnnnnnnnnnn.....', // y 5
  '...nnnnnnnnnnnnnnnnnnnnnn...'  // y 10  张开，接上 y 15 起的毛圈；x 10–15 留空给伞杆
];
// 正面的毛圈：底边整行实心（帽子离头的检查看的就是这一行），她 b 下沿那几处凹口用暗一档的米色点出来，不靠挖空
const RUFF_FRONT = [
  'nnooooonnnoooooooonnnooooonn', // y 15  毛往上长的齿
  'nnollooooooolloooooooooloonn', // y 20
  'nnoooooooooooooooooooooooonn', // y 25
  'nnoooosoooooooooooooosoooonn', // y 30
  'nnooossooooooossoooooossoonn'  // y 35  底边：正落在头顶
];
// 侧身的毛圈：前半截（脸那一侧，框里 x 90–140）是毛一直到最前头——侧着看，脸前面那道是毛圈的边，深蓝的兜帽在它后头，
// 所以正面两边那两格深蓝侧身只留在后脑那一头；后半截（x 10–90）照她 a 的背面，最底一行毛一块一块垂下来，
// 块和块之间露出底下兜帽的深蓝——上面这圈毛是「搭」在深蓝兜帽上的，不是一整块毛帽。底边照样整行实心，只是有几格是蓝
const RUFF_SIDE = [
  'nnooooonnnoooooooonnnooooonn', // y 15  齿和正面一样
  'nnollooooooolloooooooooloooo', // y 20
  'nnoooooooooooooooooooooooooo', // y 25
  'nnoooosoooooooooooooosoooooo', // y 30
  'nnoooonnoooonnoooooooossoooo'  // y 35  后半截 4 毛 2 蓝 4 毛 2 蓝 4 毛；前半截和正面一样只点两格暗米色
];
// 正面的毛护耳：框里 x 0–20（左）、120–140（右），y 40 往下一直够到毛领，正好从兜帽两边那道深蓝底下翻出来。
// 她 b 上护耳顶还压着一角深蓝，试过：他两只手就举在护耳外半边（画面 x 70–90），护耳露得出来的只有手上面那两三行，
// 再让一行给深蓝，护耳就只剩手和脸之间一条细缝，认不出是护耳了。里头那一列挨着脸，点暗一档的米色，脸窗才有个深度
const FLAP_L = ['loos', 'ooos', 'osos', 'ooos', 'soos', 'oooo'];
// 侧身后脑那一片（框里 x 0–95，画面 body.x−10 到 body.x+85）：她 a 的背面——整块深蓝，最后头一列暗一档是兜帽绕到后面的弧；
// 最前面三格是脸窗后沿的那道毛（正面圈住脸的那圈毛，侧着看只剩这一道边），挨着脸那一格暗一点。前面不封，那只眼睛（框里 100–115）露在外头
const BACK_ROWS = ['dnnnnnnnnnnnnnnnoos', 'dnnnnnnnnnnnnnnnlos', 'dnnnnnnnnnnnnnnnoos', 'dnnnnnnnnnnnnnnnoss'];
// 后脑那片最底一行压进毛领第一行里（见 hat() 里的 reach），这一行画成毛：没歪的时候和毛领叠成一道，歪了也只是毛领往上多鼓一点，不会在毛领上压出一道蓝
const BACK_LAST = 'ooooooooooooooooooo';
// 躺在地上半大的时候（scale 0.5）5px 一格会缩成 2–3px，齿和绒毛点子都糊成噪点：地上那顶 10px 一格——
// 圆顶、毛圈、两边的深蓝、两片垂下来的护耳，中间空着的是脸窗，读得出是一顶摘下来的毛兜帽
const HOOD_ASIDE = [
  '..nnnnnnnnnn..', // y −10  [1015 压矮] 圆顶矮了一半，地上那顶也少一行
  '.nnnnnnnnnnnn.', // y 0
  'noooooooooooon', // y 10
  'oos........soo', // y 20
  'oo..........oo'  // y 30
];
for (const [rows, w] of [[DOME, 28], [RUFF_FRONT, 28], [RUFF_SIDE, 28], [FLAP_L, 4], [[...BACK_ROWS, BACK_LAST], 19], [HOOD_ASIDE, 14]]) {
  for (const r of rows) if (r.length !== w) throw Error(`winter-fur: row width ${r.length}: ${r}`);
}

// 毛领顶边：眼睛最低到 body.y+30，压扁的时候毛领让着眼睛变薄，最薄留一行（冬衣顶在 bottom−15）。帽子和衣服都按这一条量：护耳、后脑那片都够到这里
const collarTopOf = (body, bottom) => Math.min(Math.max(body.y + 30, bottom - 25), bottom - 20);

// [1015 第一批复审] 帽子一抬，只有圆顶那三行跟着走，毛圈和护耳留在头上。
// 原来一整顶兜帽连毛圈、护耳一起跟着帽子框抬（扶帽致意 12、震惊愣住 15、大笑颠飞 15、捧心送上去那几下）：
// 毛圈的底边本来压在头顶上，一抬就离开了，脸窗最上面露出一条背景色的横带——深底上是一道黑、纸上是一道亮，
// 正压在眼睛上头，像戴了一副眼罩，震惊愣住的首帧（静图、表情包）和大笑的表情包那一帧都是这样。
// 兜帽是套在头上的：手能把圆顶掀起来，套着脸的那一圈毛和垂在两边的护耳掀不走。所以这里拿这一帧姿势里的抬（和引擎同一条式子：
// hatLift 和 |hatTilt| × 1.3 取大的，取整）把毛圈和护耳的 y 加回去，它们还在头上原来那个位置；圆顶照旧抬，和毛圈之间空出来的那道缝，
// 就是礼帽抬起来时檐下那道缝——「帽子被掀起来了」，在头顶上，不在脸上。歪（hatTilt）的转角照旧整顶一起转。
// 跳起来时收尾自动算的落后（hatLag，空中最多 5）不在这里：那是整顶帽子跟不上身子，不是被掀开，礼帽也是一整顶落后
const liftOf = (p) => Math.round(Math.max(p.tool.hatLift || 0, Math.abs(p.tool.hatTilt || 0) * 1.3));

function hat(ctx) {
  if (ctx.aside) { paint(ctx, HOOD_ASIDE, 0, -10, 10); return; }
  const { body, p } = ctx, lift = liftOf(p);
  paint(ctx, DOME, 0, 0);
  paint(ctx, ctx.side ? RUFF_SIDE : RUFF_FRONT, 0, 15 + lift);
  // 护耳 / 后脑那片往下够到毛领再多压一格：帽子歪了，框两头上下各差 10 左右，多压的那一格兜住。
  // 框里的 y = 画布 y − ctx.y（头上那一顶 scale 是 1）；毛圈底边被加回到 40 + lift，护耳就从那里接着往下长
  const flapTop = 40 + lift;
  const reach = collarTopOf(body, body.y + body.h) - ctx.y + 5;
  const n = Math.max(1, Math.ceil((reach - flapTop) / 5));
  if (ctx.side) {
    paint(ctx, Array.from({ length: n }, (_, i) => (i === n - 1 ? BACK_LAST : BACK_ROWS[i % BACK_ROWS.length])), 0, flapTop);
    return;
  }
  const rows = Array.from({ length: n }, (_, i) => FLAP_L[i % FLAP_L.length]);
  // 鼓脸那几帧腮帮子从身子两边鼓出去 10：护耳外头那 10 列让开，鼓起来的腮还看得见。
  // 害羞那几帧两块红脸贴在 body.x+5–20、body.x+100–115（画在 eyes 层，护耳在它上面）：护耳里头让到红脸外边为止——
  // 帽子被横挪的帧（害羞第 24 帧挪 −5）红脸和护耳的相对位置也跟着变，所以按这一帧的画布位置现算，不是固定少一列
  const outer = p.tool.puff ? 2 : 0;
  const lCells = p.tool.blush ? Math.max(0, Math.min(4, Math.floor((body.x + 5 - ctx.x) / 5))) : 4;
  const rStart = p.tool.blush ? Math.min(4, Math.max(0, Math.ceil((body.x + 115 - ctx.x - 120) / 5))) : 0;
  const left = rows.map(r => r.slice(outer, lCells));
  const right = rows.map(r => [...r].reverse().join('').slice(rStart, 4 - outer));
  if (lCells > outer) paint(ctx, left, outer * 5, flapTop);
  if (4 - outer > rStart) paint(ctx, right, 120 + rStart * 5, flapTop);
}

// ── 衣服 ──
// 竖着从下往上量（和马甲一样认 bottom），他压扁拉长的时候衣服跟着脚走：
//   bottom−5 到 bottom：衣摆（深蓝）
//   bottom−10 到 bottom−5：腰带（leather），金扣骑在上面
//   bottom−15 到 bottom−10：衣身（深蓝）
//   毛领：从 collarTopOf 到 bottom−15
function costume(ctx, { body, bottom }) {
  const x = body.x, w = body.w, side = ctx.side;
  // 帽子摘下来躺在地上的那几帧（睡着、刚坐起来），毛领只剩一行贴着脖子、收回身子那么宽，按 bottom 量（睡姿的 body.y 不在 5 格上）——
  // 毛领两边鼓出去的那 10 是接着护耳的，护耳跟着帽子躺到地上去了，毛领再鼓着就是脖子上空挂两团毛
  const bare = ctx.sleep || !!ctx.p.tool.hatAside;
  const coatTop = bottom - 15;
  const collarTop = bare ? bottom - 20 : collarTopOf(body, bottom);
  const cw = bare ? w : w + 20, cx = bare ? x : x - 10, cells = Math.round(cw / 5);

  // 冬衣：跟身子一样宽，两边各一列暗面；侧身时背后 20 列整个压暗
  ctx.rect(x, coatTop, w, bottom - coatTop, 'winterNavy', 'coat');
  ctx.rect(x, coatTop, 5, bottom - coatTop, 'winterNavyDark');
  ctx.rect(x + w - 5, coatTop, 5, bottom - coatTop, 'winterNavyDark');
  if (side) ctx.rect(x, coatTop, 20, bottom - coatTop, 'winterNavyDark');
  // 腰带整条横过去
  ctx.rect(x, bottom - 10, w, 5, 'leather', 'belt');

  // 毛领：两头一列暗面、上边几格亮面；底边一排往下垂的毛尖，垂在冬衣最上那一行
  ctx.rect(cx, collarTop, cw, coatTop - collarTop, 'fur', 'collar');
  ctx.rect(cx, collarTop, 5, coatTop - collarTop, 'furShade');
  ctx.rect(cx + cw - 5, collarTop, 5, coatTop - collarTop, 'furShade');
  if (coatTop - collarTop >= 10) ctx.pattern(['00110000011000000110000011000'.slice(0, cells)], cx, collarTop, 'furLight');
  ctx.pattern(['0010010100100010010001001010'.slice(0, cells)], cx, coatTop, 'fur');

  // 金扣：她 b 上是一枚方方的大扣，扣框金、中间一块亮金——15×15，上下各比腰带多出一格骑在腰带上。
  // 正面摆在正中偏左一点（她的扣子也略偏左，右边要让给系带的带尾）；侧身转到前面
  const buckleX = side ? x + w - 45 : x + 50;
  ctx.rect(buckleX, bottom - 15, 15, 15, 'gold', 'buckle');
  ctx.rect(buckleX + 5, bottom - 10, 5, 5, 'goldLight');

  // 系带：毛领在下巴底下分开，横着一截浅蓝绕过脖子，带尾从金扣右边垂下来、盖过腰带，末端剪成穗子——
  // 她画了三根，他这儿带尾 15 宽、一格 5，只摆得下两根带一道缝。左边一列是系带的暗面。
  // 侧身时这截系在脖子前头：横的那截缩到毛领最前面，带尾贴着冬衣前襟垂下来
  const band = side ? [x + w - 20, 25] : [x + 40, 40];
  const tail = side ? x + w - 20 : x + 70;
  ctx.rect(band[0], collarTop, band[1], coatTop - collarTop, 'winterNavyLight', 'scarf');
  ctx.rect(band[0], collarTop, 5, coatTop - collarTop, 'winterNavyMid');
  ctx.rect(tail, collarTop, 15, bottom - 5 - collarTop, 'winterNavyLight', 'scarf-tail');
  ctx.rect(tail, collarTop, 5, bottom - 5 - collarTop, 'winterNavyMid');
  ctx.pattern(['101'], tail, bottom - 5, 'winterNavyLight');
}

module.exports = {
  name: 'winter-fur',
  label: '毛领风雪帽 · 冬衣',
  palette: {
    winterNavy: '#2c3865',      // 兜帽和冬衣的布面
    winterNavyDark: '#232c4d',  // 布面暗处、兜帽后脑的弧、侧身背后
    winterNavyLight: '#5672a8', // 领口那条系带（她 b 上的浅蓝）
    winterNavyMid: '#475b8b',   // 系带的暗面（她 b 上系带折进去那几格）
    fur: '#f7ebca',             // 绒毛
    furLight: '#fff6d8',        // 绒毛亮面
    furShade: '#e9d8b0'         // 绒毛暗面、挨着脸窗的那一圈
  },
  hat,
  costume,
  // 皮包和肩带这一套摘了：她原稿这件冬衣上没有包；他身子短，冬衣只露 15 高，肩带从左腰斜到右边包上，
  // 正好把腰带和金扣整条压住——金扣是这件衣服的眼睛，留它。表链和怀表挂在马甲上，外头裹了冬衣也摘了
  hideBag: true,
  hideWatch: true
};
