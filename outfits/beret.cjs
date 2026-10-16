// clawd-new-coat · outfits/beret.cjs · design by Charlie Luinaris, pixels & animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// 酒红贝雷帽 + 红大衣：她 10/13 画的 beret-a / beret-b，照他的身板一格一格重画。四套里她最喜欢这一套，细节都给足。
// 10/15 她点破：她每套的 a 是背面、b 是正面。上一稿把 a 当正面穿，又把 b 拆成另一件——其实是同一件衣服的前后两面。
// 所以这一件只有一个样子：正面照 b（粗帽口、右边金扣、两块米色翻领、斜带上的金框扣、腰带金扣），
// a 只在侧身时露出来——侧过去看得见后脑那一截细帽口和翘起来的帽口角、后背那条从肩头斜到包上的带子。
// 不是把她 2px 的格缩下来：主体 10px、细部 5px，按礼帽那个 140×40 的框和马甲那块的位置重新起稿，
// 颜色从她原稿里吸（每簇取像素最多的那个值），只有帽顶那一行提亮是我补的，理由写在 palette 里。
module.exports = {
  name: 'beret',
  label: '贝雷帽 · 红色邮差',
  palette: {
    wineRed: '#6c1a26',    // 她的帽子和大衣，两张原稿里像素最多的那一簇
    wineDark: '#480d17',   // 她 b 版帽顶的缝线、顶粒底下那块影子；侧身时也拿来压背
    wineSheen: '#8c2836',  // 原稿没有：深底 #0d1430 上酒红和夜色只差一点，礼帽靠 hatRim 提亮帽顶一行才看得出轮廓，贝雷帽照这个办法用同一色系提亮一行
    coatLining: '#ecdebf', // 她 b 版两块翻领、大衣两头立起来的那两截米色边
    beltBrown: '#37261e',  // 她 b 版下摆那条腰带（比斜带的 #3f2c22 深一点，斜带就借他自己的 leatherDark）
    brass: '#dab550',      // 她 b 版所有金件的主色：帽口金扣、门襟扣、左襟那粒、斜带上的框扣、腰带扣
    brassShade: '#c5a248', // 她金件下半截那一圈暗金
    brassLight: '#e7d298'  // 她金扣左上那一点亮
  },
  hat,
  costume: coat,
  // 包照背（不写 hideBag）；表链和怀表是马甲上的东西，大衣把马甲整个盖住了，表链浮在大衣上会很怪，摘掉
  hideWatch: true
};

// ── 帽子：框里 x 0–140、帽口最底一行 y 35–40 贴着他头顶 ──
// 圆顶照她 b 版的台阶一行 5 高往上收（她的帽口 236 宽、78 高，每级台阶按 140/236 缩下来是 64、84、100、107、113、121、129 宽）：
// 顶行 45–95 用 wineSheen 提亮——她的顶行缩下来该有 64，可伸懒腰的两只手举在 25–45、95–115，顶行再宽一格就按在帽顶上，只好守着礼帽顶那么宽；
// 第二行就放宽到 90（她的 84 再多一格），顶上收窄的那一截让第二行补回来，圆顶不至于读成尖的
const CROWN = [[0, 45, 95], [5, 25, 115], [10, 20, 120], [15, 15, 125], [20, 10, 130], [25, 5, 135], [30, 5, 135]];
// 两道缝（wineDark）从顶粒底下那块影子的两个下角起，先竖着落一行再往外斜一格，落到帽口上沿——
// 她 b 版的缝陡，28 高里只往外走 12，落点量下来是帽口上 54 和 91，这里 50–55、85–90；一格接一格连着，三倍下是一道线不是一串点
const SEAMS = [[10, 55, 85], [15, 55, 85], [20, 50, 90]];
function hat(ctx) {
  const row = (y, x0, x1, c = 'wineRed', tag = null) => ctx.rect(x0, y, x1 - x0, 5, c, tag);
  if (ctx.aside) return hatOnGround(ctx);

  // 顶粒：她画的是一粒 30 宽的方帽柄（缩下来 18），比圆顶顶行冒出一截，最顶上那一行收窄一点。
  // 冒出去的那一行只敢 10 宽：打伞的伞面最底一行在框里 x −40 到 65、y −8 到 −3，左边一过 65 就戳进伞里（check-art 的 umbrellaDryBody 会报）；
  // 底下嵌进顶行的那一截放到 20 宽，和她的帽柄一样粗——上窄下宽，读出来是一粒立在帽顶上的柄，不是一条亮线上多了个疙瘩
  row(-5, 65, 75, 'wineRed', 'beret-stalk');
  for (const [y, x0, x1] of CROWN) row(y, x0, x1, y === 0 ? 'wineSheen' : 'wineRed');
  row(0, 60, 80, 'wineRed');
  row(5, 60, 80, 'wineDark', 'beret-knob-shadow'); // 她在帽柄正下方压了一块一样宽的深色：柄底下的影子，缝就从它两个下角起
  for (const [y, l, r] of SEAMS) { row(y, l, l + 5, 'wineDark'); row(y, r - 5, r, 'wineDark'); }

  if (ctx.side) {
    // 侧身朝右：前半截（右边）还是 b 那条粗帽口，后脑那半截照 a——帽口细成一行，圆顶的红一直垂到帽口上，
    // 最后头一截帽口角翘起来一行、比圆顶宽出去 5（她 a 版帽口两头就是这么两块高起来的深色）。
    // 粗细不是一刀切的：从前往后一格一格往下落，是贝雷帽戴在头上前沿收紧、后脑松垂的那个样子
    row(25, 60, 115, 'ink', 'beret-band');
    row(30, 35, 135, 'ink');
    row(30, 0, 15, 'ink', 'beret-back-tab');
  } else {
    // 正面照 b：帽口粗，三行（y 25–40），她 b 版帽口占帽高三分之一。圆顶的红在两头往下鼓出一截、盖住帽口上沿——
    // 左边那截宽（她量下来 32 宽，这里 20），右边窄、正好让出金扣的位置
    row(25, 25, 115, 'ink', 'beret-band');
    row(30, 5, 135, 'ink');
  }
  row(35, 0, 140, 'ink');
  // 帽口金扣：她画在帽口右边、骑着帽口上沿，左上亮、右下暗，四格各一个色，三倍下是一枚有棱的方扣
  ctx.rect(115, 25, 5, 5, 'brassLight', 'beret-buckle'); ctx.rect(120, 25, 5, 5, 'brass');
  ctx.rect(115, 30, 5, 5, 'brass'); ctx.rect(120, 30, 5, 5, 'brassShade');
  // 帽口两头一点亮，和礼帽的檐尖同一个画法，深底上看得见帽子在哪收口——也是她 b 版帽口两头那两截浅一点的帽口角
  row(35, 0, 10, 'hatRim'); row(35, 130, 140, 'hatRim');
}

// 躺在地上是半大：5px 的缝和台阶缩成 2–3px 只剩一地碎渣，换成 10px 一格的简笔——
// 小圆顶、正中的顶粒、两头鼓出来的红、一整条粗帽口和那枚金扣，缩下来每一笔都还是 5px。睡着的人帽子摘了，正面朝外放着
function hatOnGround(ctx) {
  ctx.rect(65, -10, 10, 10, 'wineRed', 'beret-stalk');
  ctx.rect(30, 0, 80, 10, 'wineSheen');
  ctx.rect(10, 10, 120, 10, 'wineRed');
  ctx.rect(0, 20, 30, 10, 'wineRed'); ctx.rect(30, 20, 80, 10, 'ink', 'beret-band'); ctx.rect(120, 20, 20, 10, 'wineRed');
  ctx.rect(110, 20, 10, 10, 'brass', 'beret-buckle');
  ctx.rect(0, 30, 140, 10, 'ink');
  ctx.rect(0, 30, 10, 10, 'hatRim'); ctx.rect(130, 30, 10, 10, 'hatRim');
}

// ── 大衣：跟马甲一样从 bottom 往上量，宽度就是 body.w（醒着 120、睡着 110），一列不多一列不少 ──
// 顶边醒着取 max(body.y+30, bottom−30)——眼睛最低到 body.y+30；睡着时眼睛闭成一条在 body.y+11，大衣和马甲一样从 bottom−15 起。
// 他的大衣醒着只有 25 高（她的有 58），五行要装下她画的翻领、门襟扣、斜带和框扣、左襟那粒扣、腰带，所以一行一行排：
//   第 1 行 两块米色翻领 · 第 2 行 翻领尖、门襟那粒扣、框扣上半截 · 第 3–4 行 他的肩带斜穿过去，框扣下半截和左襟扣露在带子底下 · 第 5 行 腰带
// 斜带借他自己的肩带：她画的那条和他皮包肩带同一个棕（她的 #3f2c22，他的 leatherDark #422e27）、同一个方向（左肩斜到右腰），
// 他是信差包不离身；肩带是引擎每帧照包的位置画的，包甩、侧身绕到背后都跟着走，衣服里另画一条只会钉死在身上。
// 肩带那一层压在衣服上面，所以金框扣只能画在衣服里、让肩带从它中间穿过去——露出来的是带子上下两截金，读出来正是「带子从扣里穿过」
function coat(ctx, { body, bottom, vestHeight }) {
  const bx = body.x, w = body.w;
  const top = ctx.sleep ? bottom - vestHeight : Math.max(body.y + 30, bottom - 30);
  const vestTop = bottom - vestHeight; // 引擎的肩带从 vestTop+2 起斜到 vestTop+11 再接到包上，框扣按它的位置钉
  // 压扁的帧大衣只剩 13 高，按 bottom 往上量的细部会顶出领口——一律剪到 [floor, bottom) 里，衣服一粒像素都不爬到脸上
  const R = (x, y, ww, h, c, tag = null, floor = top) => {
    const y0 = Math.max(y, floor), y1 = Math.min(y + h, bottom);
    if (y1 > y0 && ww > 0) ctx.rect(x, y0, ww, y1 - y0, c, tag);
  };
  R(bx, top, w, bottom - top, 'wineRed', 'coat');
  if (ctx.side) return sideCoat(R, bx, w, top, bottom);

  // 两头立起来的米色边（她 a、b 两版都画了）：贴着大衣最外面那一列，从领口往下 10。
  // 她那两根是立在大衣轮廓外头、比领口高出一截的；上一稿照着往上冒了 15，可他的大衣和身子一样宽，外头没有空地，
  // 冒上去的那截全压在脸两侧的皮肤上，比「衣服顶边别高过 body.y+30」高了 15，70pt 下像脸两边多描了一道米色边。
  // 收回大衣里，只留领口往下那一截。右边那截待机时藏在包后面。睡着时贴着闭着的眼睛，不画
  if (!ctx.sleep) for (const x of [bx, bx + w - 5]) R(x, top, 5, 10, 'coatLining');

  // 翻领：她 b 版领口两块米色，上宽下尖。右边那块的尖落在正中；左边那块她让斜带斜着削掉了下半截、尖底下紧挨着金框扣——
  // 他的大衣翻领底下就是肩带，左边那块只留一行，尖的位置让给框扣，框扣正好吊在翻领底下，和她画的一样
  R(bx + 15, top, 30, 5, 'coatLining', 'lapel-left');
  R(bx + 70, top, 30, 5, 'coatLining', 'lapel-right'); R(bx + 80, top + 5, 10, 5, 'coatLining');
  // 门襟扣：她在两块翻领中间钉了上下两粒。他的大衣在这一列只有翻领那两行露在肩带上面，两粒挨着钉就是一根金棍，只钉得下一粒
  R(bx + 55, top + 5, 5, 5, 'brass', 'button');
  // 腰带：她 b 版下摆一条深棕，正中一枚金扣（左半亮、右边一截暗）
  R(bx, bottom - 5, w, 5, 'beltBrown', 'coat-belt');
  R(bx + 55, bottom - 5, 5, 5, 'brass', 'belt-buckle'); R(bx + 60, bottom - 5, 5, 5, 'brassShade');
  if (ctx.sleep) return; // 睡着没有肩带，框扣和左襟扣（都挂在带子底下）也不画；翻领和腰带留着，包压在中间

  // 斜带上的金框扣：她画在左边翻领底下、带子从框里穿过去。10 宽、15 高，钉在 vestTop 起、翻领右半截正下方——
  // 这一段肩带是 vestTop+4.5 往下 6，框的上沿、下沿各露出带子上下四行左右，一样粗，中间那一截被带子压着，
  // 读出来是一只框、带子从里头穿过（再往左一格，带子在那儿高一点，上沿只露三行、下沿露五行，三倍下像带子底下垫了块金砖）。上亮下暗，和她的金件一样
  R(bx + 30, vestTop, 10, 5, 'brass', 'strap-buckle');
  R(bx + 30, vestTop + 5, 10, 10, 'brassShade');
  // 左襟：她在带子底下、框扣左边隔一小段钉了一粒金扣
  R(bx + 10, bottom - 10, 5, 5, 'brass', 'left-button');
}

// 侧身朝右：前面（右边）还是 b——翻领转过来一截、门襟那道开口、门襟扣、腰带扣；
// 后背（左边）照 a：背后 20 列压暗（和身子的 skinSide 一个意思），她 a 版后背那条带子从右上斜到左下——
// 侧过来看就是从肩头（衣服顶上中间）斜着落到背后的皮包上，包挂在左腰。引擎侧身的肩带整条藏在包后面，这一截得衣服自己画，
// 颜色就用他肩带那个 leatherDark，和正面那条是同一根
function sideCoat(R, bx, w, top, bottom) {
  R(bx, top, 20, bottom - top, 'wineDark');
  R(bx + 55, top, 15, 5, 'leatherDark', 'back-sash');
  R(bx + 45, top + 5, 15, 5, 'leatherDark');
  R(bx + 35, top + 10, 15, 5, 'leatherDark');
  R(bx + 85, top, 25, 5, 'coatLining', 'lapel');
  R(bx + 95, top + 5, 10, 5, 'coatLining');
  R(bx + w - 10, top, 5, bottom - top - 5, 'wineDark');
  R(bx + w - 20, top + 10, 5, 5, 'brass', 'button');
  R(bx, bottom - 5, w, 5, 'beltBrown', 'coat-belt');
  R(bx + w - 15, bottom - 5, 10, 5, 'brass', 'belt-buckle'); R(bx + w - 5, bottom - 5, 5, 5, 'brassShade');
}
