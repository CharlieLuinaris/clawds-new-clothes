// clawds-new-clothes · outfits/nightcap.cjs · design by Charlie Luinaris, pixels & animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// 睡帽 + 睡衣（她 10/13 画的 nightcap-a / nightcap-b，10/15 照他的身板重画）。
// 她原稿画在一个比他高一截的身板上，2px 一格；这里不是把那张图缩下来，是照着她的样子在他自己的格子上一格一格重搭：
// 主轮廓 10px、细部 5px，帽子坐在礼帽那个 140×40 的框里、睡衣坐在马甲的位子上。
//
// 10/15 她点破的：她那两张不是两件衣服，是同一件的两面——b 是正面，a 是背面。
// 第一稿把 a 当正面穿、b 当另一件，所以正面戴着一顶尾巴朝左的帽子、胸前是她画在后脖子上的那道浅蓝领边。
// 这一稿只剩一件：
// - 正面全照 b：浅蓝长睡帽从右边垂下来、尾巴尖上一颗奶白绒球；纯蓝绒睡衣、奶白大翻领两个领尖、左胸浅蓝口袋、门襟奶白扣、浅蓝下摆。
// - a 只管侧身帧（ctx.side，他朝右走）露出来的后背那半截：帽尾从后脑勺垂向背后（左）、
//   后领口那道浅蓝边、袖缝、下摆——就是她在背面画的那几笔；朝前的半截还是 b 的奶白领子。
//
// 睡帽和礼帽最不一样的一点：睡着的时候它不摘。引擎在睡姿（和伸懒腰第 6 帧）把帽子请到 (216,253) 半大躺在地上，
// 这顶帽子收到 ctx.aside 时不躺下去，而是把框里的坐标反算回画布，照样画回他头上——睡帽本来就是戴着睡觉的。
//
// 第一稿复审留下来、这一稿照旧守着的：
// - 睡衣身上一道条纹都没有。她两张原稿衣身都是纯色，浅蓝只在领边、袖缝、下摆、口袋边。
// - 帽顶压在框里 y 0（和礼帽顶一样高），顶行只占 x 55–95：打伞的伞面、伸懒腰的手、晕乎乎后面那颗星、报错的「!」都贴着礼帽顶排。

// 颜色全从她原稿里吸：每簇取像素最多的那个（a、b 两张是同一块布，吸出来一样）
const palette = {
  flannel: '#5672a8',      // 帽子和睡衣的那块蓝绒布（原稿最大的一簇）
  flannelLight: '#b7d7f6', // 帽口那道浅蓝边、睡衣的领边、袖缝、下摆、口袋边
  flannelSide: '#49659e',  // 原稿边上压暗的那一档蓝，侧身时给背后那 20 列
  flannelDark: '#1a223c',  // 原稿的深海军蓝描边，这里只拿来压帽尖折下来的那道折痕
  pompom: '#fff6d8'        // 尾巴尖上的奶白绒球，正面的大翻领、扣子也是它
};

// ── 帽子（醒着戴在头上）────────────────────────────────
// 框里的坐标，正面那一顶（照 b）。一个字母一格 5px，第 0 列是框里 x 0，第 0 行是 y 0。
// F 绒布、L 浅蓝帽口、D 折痕、P 绒球。
// 她的 b：左肩一级一级缓缓地斜到帽口，帽顶偏右，帽尖在右上角折下来——折痕从帽顶右头斜着落到帽口右头，
// 折过来的那截尾巴顺着右边垂下去，绒球挂在帽口右头旁边，和帽口一样高。这里照着这个走向搭：
// 帽顶那一行只占 x 55–95（伸懒腰 14–22 两只手举在 25–45、95–115，顶行宽出去就按在帽顶上了）；
// 尾巴从 y 5 起往右放，绒球在 x 120–140、y 20–40，坐在帽口右头，底边贴着 y 40、一格不往下。
// 绒球是 10px 主格那一档的东西（20×20 圆角），70pt 下也认得出是一颗球。
//
// [1015 她定的] 绒球照她画的吊在帽口外头（x 130–150）。之前往里收了两格躲道具，她说哪个好看用哪个——吊在外头的更像她画的，
// 想事情那只钟、收到信那只铃挡住它几帧就挡几帧，钟和铃本来就在前面。下面这段是当初往里收的账，留着当记录：
// 她画的绒球还要再往外两格，整颗吊在帽口外头。照原样先画了一稿（x 130–150）再全片 40 态逐帧量：
// 想事情举起来那只钟正好在那儿，45 帧里 26 帧把绒球整颗吃掉；收到信那只铃又盖掉 23 帧；
// 开心那几颗金星落在奶白的球上 32 帧，金配奶白几乎看不出星。往里收两格以后，钟一帧都碰不到它，铃只剩 6 帧，金星只剩 8 帧；
// 新多出来的是扶帽致意那 26 帧——右手正抓着帽檐右头，抓的就是挂着绒球的那一头，这个盖住是对的。
// 尾巴往右垂、球挂在帽口右头这个样子没变，只是不再悬在外面
const CAP = [
  '...........FFFFFFFF.............', // y 0   帽顶 x 55–95
  '.........FFFFFFFFFFFFFFF........', // y 5   帽尖往右折过来，尾巴的顶边从这一行起
  '.......FFFFFFFFFFFFFDFFFFFF.....', // y 10  折痕从帽顶右头开始往右下斜
  '.....FFFFFFFFFFFFFFFFDFFFFFF....', // y 15
  '....FFFFFFFFFFFFFFFFFFDFFFFPP...', // y 20  尾巴收窄、接上绒球的顶
  '...FFFFFFFFFFFFFFFFFFFFDFFPPPP..', // y 25
  '..LLLLLLLLLLLLLLLLLLLLLLLLPPPP..', // y 30  帽口那道浅蓝边，原稿里最显眼的一笔，一直接到绒球
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFPP...'  // y 35  帽口最底一行比浅蓝边往左多出一格（她画的帽口下沿就是这么张开的）；用绒布蓝不用深蓝：深底 #0d1430 上深蓝等于没画，看着像帽子离了头
];
const INK = { F: 'flannel', L: 'flannelLight', D: 'flannelDark', P: 'pompom' };
const CAP_TAG = (ch, j) => (ch === 'F' && j === 0 ? 'nightcap' : ch === 'L' ? 'nightcap-band' : ch === 'P' && j === 5 ? 'nightcap-pompom' : null);
for (const r of CAP) if (r.length !== 32) throw Error(`nightcap: row width ${r.length}: ${r}`);
// back 为真时整顶左右翻：尾巴从后脑勺垂向左边。她的 a（背面）就是这么垂的——
// 正面看尾巴落在他左手那边（画面右），转到背后它还在他左手那边（画面左）；侧身朝右走时背后在左，尾巴落在背后才像在走
function drawAwakeCap(box, back) {
  CAP.forEach((row, j) => {
    for (let i = 0; i < row.length;) {
      const ch = row[i]; if (ch === '.') { i++; continue; }
      let k = i; while (k < row.length && row[k] === ch) k++;
      const x = i * 5, w = (k - i) * 5;
      box(back ? 140 - x - w : x, j * 5, w, 5, INK[ch], CAP_TAG(ch, j));
      i = k;
    }
  });
}

// 睡着时的帽子：躺下去帽身塌了一截、往左滑了 10（右上角让给冒出来的 Z），尾巴顺着他左边一直垂到地上，绒球落在地上。
// 这里收的是画布坐标的框原点 (ox, oy) = (body.x−10, body.y−40)；睡姿身子 110 宽，在框里是 x 10–120。
// 吸气时身子抬 5，帽子跟着抬，绒球不跟：它躺在地上（画布 y 253–273），尾巴长短自己补
const SLEEP_CROWN = [
  [5, 20, 65],
  [10, 5, 85],
  [15, -5, 95],
  [20, -10, 100]
];
const SLEEP_CREASE = [
  [10, 30, 40],
  [15, 20, 30],
  [20, 10, 20]
];
const POMPOM = ['0110', '1111', '1111', '0110'];
function drawSleepCap(box, oy) {
  // 尾巴先画，帽口后画压住它的根：从帽口左头出来先宽 15、往外飘一格再收成 10，一路软软地垂到地上——
  // 一根直上直下 10 宽的条配一个球，看着像根手杖
  const ground = 253 - oy;               // 绒球顶边落在画布 253（底边贴着脚底线 273），吸气时身子抬、它不抬
  box(-10, 25, 15, 10, 'flannel', 'nightcap-tail');
  box(-15, 35, 15, 15, 'flannel');
  box(-15, 50, 10, ground - 50, 'flannel');
  box(-20, ground, 20, 20, 'pompom', null, POMPOM);
  for (const [y, x0, x1] of SLEEP_CROWN) box(x0, y, x1 - x0, 5, 'flannel', y === 5 ? 'nightcap' : null);
  for (const [y, x0, x1] of SLEEP_CREASE) box(x0, y, x1 - x0, 5, 'flannelDark');
  box(0, 25, 110, 10, 'flannelLight', 'nightcap-band');
  box(0, 35, 110, 5, 'flannel');
}

function hat(ctx) {
  if (!ctx.aside) {
    // 正常戴在头上：框、转角、落后、沉、横挪全是引擎给的，这里只管在框里画。侧身就把背面（尾巴朝左）那一顶给他
    drawAwakeCap((x, y, w, h, color, tag) => ctx.rect(x, y, w, h, color, tag), ctx.side);
    return;
  }
  // 躺地上的那一次：引擎给的是 (216,253) 半大、angle 0。把要画在头上的画布坐标反算回这个框——
  // 画布 = ctx.x + lx·scale，所以 lx = (画布 − ctx.x)/scale，宽高同理除以 scale；angle 是 0，转换是恒等的，
  // 一格不歪、不缩，等于直接画在画布上。
  // 睡着时按身子量（body.x−10, body.y−40）；伸懒腰第 6 帧人坐起来了，用引擎递过来的「头上那一顶」的框（ctx.onHead），
  // 原来这里抄了一份引擎的式子，引擎一改这边就悄悄对不上（这一帧不歪，转角省掉）
  const { body } = ctx;
  const ox = ctx.sleep ? body.x - 10 : ctx.onHead.x, oy = ctx.sleep ? body.y - 40 : ctx.onHead.y;
  const s = ctx.scale;
  const box = (x, y, w, h, color, tag, rows) => {
    const lx = (ox + x - ctx.x) / s, ly = (oy + y - ctx.y) / s;
    if (rows) ctx.pattern(rows, lx, ly, color, 5 / s);
    else ctx.rect(lx, ly, w / s, h / s, color, tag);
  };
  // 睡着时尾巴往左垂：Z 从他右上角冒出来，帽子塌向另一边才不挡着 Z。
  // 伸懒腰第 6 帧刚坐起来，帽子还是睡着时那样尾巴朝左（就是背面那一顶的样子）；
  // 第 7 帧右手扶一下帽檐，尾巴才甩回正面的右边——像是坐起来顺手把睡歪的帽子扶正
  if (ctx.sleep) drawSleepCap(box, oy);
  else drawAwakeCap(box, true);
}

// ── 睡衣 ──────────────────────────────────────────────
// 画布绝对坐标、跟身子一起歪。醒着顶边 max(body.y+30, bottom−30)（眼睛最低到 body.y+30），睡着 bottom−20（闭眼在 body.y+11–16）。
// 醒着站直是 25 高、5 行；被压扁时只剩十几行，画在 [top, bottom) 之外的一律剪掉。衣身是纯色绒布，一道条纹都没有。
function costume(ctx, { body, bottom }) {
  const X = body.x, W = body.w;
  const top = ctx.sleep ? bottom - 20 : Math.max(body.y + 30, bottom - 30);
  const R = (x, y, w, h, color, tag) => {
    const y0 = Math.max(y, top), y1 = Math.min(y + h, bottom);
    if (y1 > y0 && w > 0) ctx.rect(x, y0, w, y1 - y0, color, tag);
  };
  R(X, top, W, bottom - top, 'flannel', 'pajamas');

  if (!ctx.side) {
    // 正面，照 b。袖缝：她画在衣身两边、袖子接上来的地方，一边一道浅蓝，落到下摆上面空一行就收——
    // 一路接到下摆的话，和下摆、领子连成一圈浅蓝的框，像一只相框
    R(X + 5, top, 5, bottom - top - 10, 'flannelLight', 'sleeve-seam'); R(X + W - 10, top, 5, bottom - top - 10, 'flannelLight');
    // 奶白大翻领：领口横一道，夹在两道袖缝中间（她的领子也没盖到袖子上），两头再往下翻出一截领尖。
    // 她原稿右边那片领子耷拉得很长、还带一道驼色边，缩到他身上只剩一块色斑、像衣服上洒了东西，就收成和左边一样长的领尖
    // [1015 第一批复审] 压扁到睡衣不足 20 高（压 10 以上：大笑笑瘫那 15 帧、蓄力高跳落地那一下）时领子不画：
    // 只剩 15 高的睡衣上，奶白的领子横一道、底下两个领尖、再往下是下摆那道浅蓝，三样挤在一起正好在眼睛底下，
    // 读出来是一张咧开的大嘴、两排白牙——大笑的「∩」眼一配上，整张脸就是在咧嘴笑，他没有嘴。
    // 压扁那几帧本来就短，衣服只剩一截深蓝的绒布加下摆，认得出是睡衣就够了；站直、走路、睡着（20 高）都照旧画领子
    if (bottom - top >= 20) {
      R(X + 15, top, W - 30, 5, 'pompom', 'collar');
      R(X + 15, top + 5, 15, 5, 'pompom'); R(X + W - 30, top + 5, 15, 5, 'pompom');
    }
    // 左胸口袋：浅蓝的口沿和两条边围成一个「冂」，口沿贴着左边领尖底下（她画的那块浅蓝也是顶着领子的），
    // 底边就落在下摆那道浅蓝上
    R(X + 20, top + 10, 20, 5, 'flannelLight', 'pocket');
    R(X + 20, top + 15, 5, bottom - top - 15, 'flannelLight'); R(X + 35, top + 15, 5, bottom - top - 15, 'flannelLight');
    // 下摆：她 b 版衣身底下也是一道浅蓝（第一稿以为扣子要钉到底、把它拿掉了，其实她的扣子就钉在下摆上面）
    R(X, bottom - 5, W, 5, 'flannelLight', 'hem');
    // 门襟的奶白扣子：她画了三粒，最底下那粒就钉在下摆那道浅蓝上。扣子 5 高、中间要空一格才是一粒一粒的（挨着钉就是一根奶白的棍），
    // 所以从下摆那一行往上每隔一行钉一粒。领口底下那一行不钉：领子横一道、两头领尖、正中再吊一粒，
    // 三个奶白的小凸起排在他脸底下，就是一排牙（第一次试画就是这样）。站直 25 高钉得下两粒，压扁了、睡着了只剩下摆上那一粒
    for (let y = bottom - 5; y >= top + 10; y -= 10) R(X + W / 2 - 5, y, 10, 5, 'pompom', y === bottom - 5 ? 'button' : null);
    return;
  }
  // 侧身（朝右走），背后在左。背后那 20 列压暗，和身子的 skinSide 一个意思
  R(X, top, 20, bottom - top, 'flannelSide');
  // 后半截照 a。袖缝：她背面两边各一道，从领口那一行一直落到下摆上面空一行，贴着衣身的外沿；
  // 侧着看，朝着我们的这一道就落在背后那 20 列压暗的边上，像背片和侧片接缝的那条线
  R(X + 20, top, 5, bottom - top - 10, 'flannelLight', 'sleeve-seam');
  // 后领口那道浅蓝边：她背面画的是领口底下一道横的、两头往上翘一格的浅托盘，侧着只看得见从后脖子绕过来的这半截，
  // 贴着领口那一行（放到第二行的话衣服只有 20 高的帧里它和下摆隔一行平行，读成两道横条纹）。
  // 它和袖缝之间空一格：试过从 X+10 起、袖缝从它底下吊下来，两笔接成一个浅蓝的「T」，像衣服上别了个钩子
  R(X + 30, top, 25, 5, 'flannelLight', 'collar-back');
  // 下摆：前后连成一整圈
  R(X, bottom - 5, W, 5, 'flannelLight', 'hem');
  // 前半截还是 b：奶白翻领从领口前头绕过来，领尖朝前下方翻出一截，门襟在最前头那一列露一粒扣子
  R(X + 55, top, W - 65, 5, 'pompom', 'collar');
  R(X + W - 30, top + 5, 20, 5, 'pompom');
  if (top + 20 <= bottom - 5) R(X + W - 15, top + 15, 5, 5, 'pompom', 'button');
}

module.exports = {
  name: 'nightcap',
  label: '睡帽 · 蓝绒睡衣', // 给人看的短名，和另外三套一个格式；正面照 b、侧身照 a 的来龙去脉写在文件头
  palette,
  hat,
  costume,
  // 睡衣上不背信差包、不挂怀表：穿睡衣是要睡觉了
  hideBag: true,
  hideWatch: true,
  // [1016 她拍的] 开心那两跳的星给绒球让位。绒球照 1015 定的吊在帽口外头不动，挪的是星：
  // 大星（goldLight 十字，8–18、31–39 帧亮）原样画在 (214,125)，11–17 帧小半颗到整颗叠在奶白的球上（13–15 帧整颗），浅金叠米白认不出星形；
  // 右边那颗小金星在 6、28–30 帧（刚起跳、帽子还低的那几帧）压住球的上半截。礼帽那套同一帧，大星最多擦过檐尖十来个像素，小星整颗在背景上。
  // 大星右挪 20：挪 5 / 10 / 15 还压着球（逐帧量，压 456 / 222 / 28 个像素），往上挪 10 也压；20 是第一个一粒不压的，
  //   离球最近 4px，帽身、手、眼睛一样不碰。
  // 小星右挪 15：挪 10 离球只剩 1px，等于贴着；15 留 6px。不跟大星一起挪 20：两颗都到 x 254 的话这一支所有帧的外框宽过 204，
  //   贴纸 408 / 618 两档就从 ×2 / ×3 掉到 ×1 / ×2；现在外框右边到 249，正好 204，档位不掉
  propShift: { happy: { star: [20, 0], smallStarRight: [15, 0] } }
};
