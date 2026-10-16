// clawds-new-clothes · outfits/aviator.cjs · design by Charlie Luinaris, pixels & animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// 飞行帽：她 10/13 画的两张（原稿 aviator-a、aviator-b 两张，留在家里，没跟着搬出来）。
// 10/15 她点破：每套的 a 是背面、b 是正面——v1 把 a 当成正面穿上了身，b 又另挂一件。现在只有一件：
// 正面一律照 b 画；a 只管侧身帧（ctx.side）露出来的后背那半截：帽子后脑落到帽檐的皮带、檐下那道帽后沿，大衣后背的台阶缝、竖缝和素腰带。
//
// 不缩她的图（2px 格、比他高一截的身板，整张缩下来帽子压眼睛、衣服比他窄），只照她的形、她的色、她的几样东西，
// 按他的 10px 主格、5px 细部重新落一遍：帽子坐在礼帽那个 140×40 的框里，大衣坐在马甲那块地方，眼睛那一行一粒不压。
//
// 引擎替我们做的：帽子画在礼帽同一个锚点、同一个 transform 上，落后一拍、沉一下、歪、被抱起来横挪、睡着躺到地上半大，全是白来的；
// 大衣套身子的 transform，lean 时跟着歪。这个文件只管「画什么」。

// 一个字母一种颜色，'.' 是空。点阵一行 5px（地上那顶半大的一行 10px），同色连着的格子并成一块画（rect 少、转角光栅化也不会在格子缝里漏像素）
const INK = { N: 'flightNavy', D: 'flightNavyDark', K: 'flightInk', G: 'goggleLens', B: 'goggleStrap' };
function paint(ctx, rows, x0, y0, unit = 5) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length;) {
      const ch = row[i]; if (ch === '.') { i++; continue; }
      let k = i; while (k < row.length && row[k] === ch) k++;
      ctx.rect(x0 + i * unit, y0 + j * unit, (k - i) * unit, unit, INK[ch]); i = k;
    }
  });
}

// ── 帽子（框里的坐标，28 列 × 5px = 140 宽；第 0 行是 y 0，第 8 行 y 40–45 只在两头）──
// 她 b 版从上往下是：护目镜冒出圆顶 → 圆顶和两根斜皮带 → 一道黑缝 → 额前一圈深蓝帽箍、两边黑线隔开护耳 → 最底一道黑檐，两头是灰扣的护耳尖。
// 按她的比例落进 40 高：镜框顶在 y 0，一粒不往上冒——v1 冒到 y −5，打伞时伞面压住左边镜片顶上两三行（umbrellaDryBody 一直没过）；
// 镜片照样比两边的圆顶肩高一行，读出来还是「架在顶上」。顶行只有 x 45–95，和礼帽顶一样宽，伸懒腰的手不按在帽子上。
// 皮带从镜框外沿往下、陡，到黑缝收住（她的皮带是 #895839，比腰带的 leather 亮一档，深蓝上才看得出两道斜线）。
// 护耳：她画在檐的两头、往外支出圆顶的那两块灰。这里让灰扣比檐多垂一行（y 40–45），只在 x 0–10 / 130–140——
// 他的身子在框里是 x 10–130，垂下来的护耳挨着脸边、不盖一粒皮肤，也碰不到眼睛（眼睛最远到 x 25–115）
const CAP_FRONT = [
  '.........KGGK..KGGK.........', // y 0   两副镜框，中间空一格是她的鼻梁那半粒空
  '.......DNKGGKNNKGGKND.......', // y 5   镜片下半截嵌进圆顶，两边是圆顶的肩
  '.....DNNNBNNNNNNNNBNNND.....', // y 10  皮带从镜框外沿落下来
  '...DNNNNNBNNNNNNNNBNNNNND...', // y 15
  '..DNNNNNBNNNNNNNNNNBNNNNND..', // y 20  往外挪一格，到黑缝收住
  '..DNNNKKKKKKKKKKKKKKKKNNND..', // y 25  她压在帽箍上头那道黑缝，两头留着护耳那一截深蓝
  'KKDNNKNNNNNNNNNNNNNNNNKNNDKK', // y 30  额前帽箍；两边一道黑线隔出护耳；最外头是护耳尖的黑边
  'GGKKKKKKKKKKKKKKKKKKKKKKKKGG', // y 35  最底一道黑檐，两头灰扣
  'GG........................GG'  // y 40  灰扣垂下来一行
];
// 侧身（朝右）：前半截照 b——离他近的那副镜片架在圆顶前头，黑缝和额前帽箍只围到耳朵那里；
// 后半截照 a——她画的后脑没有那道黑缝和帽箍，皮带一路落到檐上，檐底下垂着一道帽后沿（她 a 版檐下那块深蓝）。
// 帽后沿垂在框里 x 10–30、y 40–45：侧身那只眼只在 x 100–115，这一截碰不到；正好盖住他身子后面那 20 列阴影的顶上一行，就是后脖子。
// 背光：后面两列压暗，和身子的 skinSide 一个意思
const CAP_SIDE = [
  '..............KGGK..........', // y 0
  '.......DDNNNNNKGGKNND.......', // y 5
  '.....DDNNNNNNBNNNNNNNND.....', // y 10  皮带从镜框往后脑斜下去
  '...DDNNNNNNNBNNNNNNNNNNND...', // y 15
  '..DDNNNNNNNBNNNNNNNNNNNNND..', // y 20
  '..DDNNNNNNBNKKKKKKKKKKKKKD..', // y 25  黑缝只在前半截
  'KKDDNNNNNBNNKNNNNNNNNNNNNDKK', // y 30  皮带落到檐；前半截是帽箍
  'GGKKKKKKKKKKKKKKKKKKKKKKKKGG', // y 35  檐
  'GGNNNN......................'  // y 40  后脑这头：护耳灰扣和帽后沿
];
// 躺在地上（睡着、伸懒腰第 6 帧）是半大：5px 的细部缩成 2–3px 会碎成一地小渣，换成 10px 一格的简笔——
// 两粒镜片、两根皮带、一道黑缝、檐和两头的灰，缩下来每一笔都还是 5px
const CAP_ASIDE = [
  '.....G..G.....', // y −10
  '....NGNNGN....', // y 0
  '..NNBNNNNBNN..', // y 10
  '.NNNKKKKKKNNN.', // y 20
  'GKKKKKKKKKKKKG'  // y 30
];

module.exports = {
  name: 'aviator',
  label: '飞行帽 · 毛领红领带',
  palette: {
    flightNavy: '#232c4d',      // 她帽子和大衣的深蓝，像素最多的那个
    flightNavyDark: '#1b1f33',  // 她圆顶和大衣边上那一圈暗一档的蓝，这里当背光
    flightInk: '#121218',       // 她的描边黑，比老伦敦的 ink 深——ink 压在这块深蓝上几乎看不见；镜框、黑缝、檐、大衣上的缝都是它
    goggleLens: '#b7b8c9',      // 护目镜片、护耳尖那两块灰
    goggleStrap: '#895839',     // 帽子上那两根皮带：比腰带（leather）亮一档，她 a、b 两版都是这个色
    furGrey: '#3a3443',         // 毛领：她的毛是 ink（#262329）、这个灰紫和 leatherDark 三色掺着画的
    tieRed: '#74192a',          // 领带的酒红
    buttonWhite: '#ffffff'      // 门襟两排扣子
  },

  hat(ctx) {
    if (ctx.aside) { paint(ctx, CAP_ASIDE, 0, -10, 10); return; }
    paint(ctx, ctx.side ? CAP_SIDE : CAP_FRONT, 0, 0);
  },

  // 大衣：宽度一律跟 body.x / body.w 走；顶边 T 照模板取 max(body.y+30, bottom−30)（眼睛最低到 body.y+30，布不爬到眼睛那一行）；
  // 睡着取 bottom−20（闭眼在 body.y+11–16，礼帽那件马甲睡着是 15 高，大衣多盖一行）。
  // 领口的东西（毛领、领带）从 T 往下排，腰带、金扣、下摆从 bottom 往上排：被压扁的帧大衣只剩十几行，两头一挤，腰带盖在毛领尖上，
  // 一粒都不爬到脸上——所有细部一律剪进 [T, B)
  costume(ctx, { body, bottom }) {
    const bx = body.x, w = body.w, B = bottom, mid = bx + w / 2;
    const T = ctx.sleep ? B - 20 : Math.max(body.y + 30, B - 30);
    const R = (x, y, ww, h, c, tag = null) => {
      const y0 = Math.max(y, T), y1 = Math.min(y + h, B);
      if (y1 > y0 && ww > 0) ctx.rect(x, y0, ww, y1 - y0, c, tag);
    };
    R(bx, T, w, B - T, 'flightNavy', 'coat');

    if (ctx.side) {
      // 侧身朝右：x < mid 是后背，照她的 a；x ≥ mid 是前襟，照她的 b。后背左边 20 列压暗（身子的 skinSide 同一个意思）。
      // 皮包挂在后背 bx+6–41 那一段、从 bottom−25 往下，后背露出来的就是包和身子中线之间那一截，a 的台阶缝和竖缝都落在这一截里
      R(bx, T, 20, B - T, 'flightNavyDark');
      // a：她背上那道台阶缝从两肋往背中一级一级落下来。侧身时肋在 mid、背中在最左：从 mid 落一级、再落一级横进包后头
      R(mid - 10, T + 5, 10, 5, 'flightInk', 'back-yoke');
      R(bx + 20, T + 10, mid - 10 - bx - 20, 5, 'flightInk');
      // a：台阶缝底下那条竖缝一路落到下摆、把腰带劈成两截（她背中那道缝；正中那一截藏在包后头，露在包外的是这一条）
      R(mid - 15, T + 15, 5, B - T - 15, 'flightInk', 'back-seam');
      // b：离他近的那片毛领从肩头斜到胸前，比台阶缝起头的地方往前空两格——挨着的话，背上的缝和胸前的毛连成一道黑斜杠，分不出哪半是背、哪半是胸；
      // 领带挂在最前头，一粒白扣落在毛领尖底下（再往下一行，大衣只剩 22 高的帧会被金扣盖掉），大金扣转到前头
      [[10, 30], [25, 45]].forEach(([a, b], k) => {
        R(mid + a, T + 5 * k, b - a, 5, 'flightInk', k ? null : 'fur-collar'); R(mid + b - 5, T + 5 * k, 5, 5, 'furGrey');
      });
      R(bx + w - 10, T + 5, 10, B - 10 - T - 5, 'tieRed', 'tie');
      R(bx + w - 25, T + 10, 5, 5, 'buttonWhite', 'button');
      R(bx, B - 5, w, 5, 'leather', 'belt');
      R(mid - 15, B - 5, 5, 5, 'flightInk');
      R(bx + w - 20, B - 10, 15, 10, 'gold', 'buckle'); R(bx + w - 15, B - 5, 5, 5, 'goldLight');
      return;
    }

    // 正面，照她的 b。
    // 毛领：一对翅膀从领口两边斜着收到胸口正中，张成一个 V——上头宽、下头窄，V 尖收在领带两边（她的毛领尖也正好收在领带底、金扣上面）。
    // 她的毛是 ink、灰紫、leatherDark 三色掺着画的、外头再描一圈黑；这里铺 flightInk、每级最外头一格 furGrey 当毛尖。
    // 不照她的灰紫整块铺：他的包带（leatherDark）正好斜穿过胸口，灰紫和包带一个亮度，V 和包带搅成一片，一点都看不出来
    [[20, 35], [10, 25], [5, 15]].forEach(([a, b], k) => {
      const y = T + 5 * k;
      R(mid - b, y, b - a, 5, 'flightInk', k ? null : 'fur-collar'); R(mid + a, y, b - a, 5, 'flightInk');
      R(mid - b, y, 5, 5, 'furGrey'); R(mid + b - 5, y, 5, 5, 'furGrey');
    });
    // 她那截白衬衫领没画：收到他身上只剩夹着领带的两粒白，贴在脸底下正中，70px 下是一对小尖牙（他没有嘴，脸底下两粒亮的就是牙）。
    // 领带只有 5 宽，从领口第一行一路垂到包带底下——她的领带也是从领口顶上起、细细一条。
    // 上一稿是 10 宽、从 V 第二级起：包带一盖，露出来的只剩脸底下正中 10×7 一块酒红，两边贴着黑毛领，
    // 黑的 V 托着一块红，70pt 下就是一张张开的嘴、里头一条舌头（伸懒腰闭眼那帧最像）。收成一根细线、拉长到领口，读出来才是领带。
    // 5 宽在 120 宽的身子上没法正中（正中在 x 150，格子是 145 和 150 两列），落在左边那一列，偏的半格 70pt 下不到一个点。
    // 露得出来才画：引擎的包带在领带这一列大约从 vestTop+7（醒着 vestTop = bottom−20）压过去，被压扁的帧领口离包带不到 5，
    // 露出来的只剩一两行红，夹在黑毛领中间正是一道抿着的嘴缝，那几帧干脆不画；睡着没有包带、可包整个压在胸口上，
    // 领带从 bottom−20 起会在包顶上冒一行红线，也不画
    // [1015 摘包之后] 没有包带压着了：领带从领口第一行一路垂到金扣上头，睡着也挂着（她的 b 版大衣上领带一直在）
    R(mid - 5, T, 5, B - 10 - T, 'tieRed', 'tie');
    // 门襟两排白扣：毛领外头左右各一列、一列两粒，中间空一行（挨着钉就是一根白棍）。按 bottom 往上量（bottom−20、bottom−10），不按领口：
    // 她画的是外上内下斜着排、离领口一大截，第一稿照这个斜着钉、贴着领口，伸懒腰、收到信那几帧大衣拉长、包带往下让，
    // 四粒白和黑毛领、红领带在脸底下排成一行——70px 下是咧开一嘴牙。竖成两列、往下沉，读出来才是双排扣。
    // 大衣不到 25 高（被压扁）就只钉底下那一粒，上面那粒会顶进毛领里。包带从左肩斜到右腰，待机时右下那粒压在包带底下——她的大衣上没有包，他是信差，包不离身
    for (const y of B - 20 >= T + 5 ? [B - 20, B - 10] : [B - 10]) {
      R(mid - 35, y, 5, 5, 'buttonWhite', y === B - 10 ? 'button' : null); R(mid + 30, y, 5, 5, 'buttonWhite');
    }
    // 腰带落在最底一行：包带从左腰斜到右边 bottom−9，腰带要是再往上一行，包带正好压着它走、金扣只剩一角。
    // 正中那块大金扣比腰带高一截（她画得上下都探出来），20×10 往上骑一行，正中一块亮金是扣舌
    R(bx, B - 5, w, 5, 'leather', 'belt');
    R(mid - 10, B - 10, 20, 10, 'gold', 'buckle'); R(mid - 5, B - 5, 10, 5, 'goldLight');
  },

  // [1015 她定的] 这套摘包：引擎的包带从左肩斜到右腰，压住领带下半截、右下那粒白扣和大金扣的上半——她的 b 版大衣上本来就没有包，
  // 她说要领带和金扣全露出来。大衣套在马甲外头，挂在马甲上的表链和怀表也摘了
  hideBag: true,
  hideWatch: true
};

for (const rows of [CAP_FRONT, CAP_SIDE]) for (const r of rows) if (r.length !== 28) throw Error(`aviator: row width ${r.length}: ${r}`);
for (const r of CAP_ASIDE) if (r.length !== 14) throw Error(`aviator: aside row width ${r.length}: ${r}`);
