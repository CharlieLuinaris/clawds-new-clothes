// clawd-new-coat · states/sweating.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 尴尬流汗（sweating）：被她抓到熬夜、部署崩了来认错的那张脸。
//
// 她递的两格参考：ref-5 第二格「紧张冒汗缩小」——整个人缩下去、头上挂汗、眼睛斜着躲；ref-7 第四格「紧张搓手冒汗」——
// 眼珠挤到一边、太阳穴边挂汗。两格靠的都是三样：一颗大汗珠、眼睛不看你、人缩着。猫的画法不拿，拿的是这三样怎么摆。
// 他没有嘴，「尴尬」就全落在：帽檐左外挂一颗大蓝汗珠、再慢慢往下滑（剪影左边多出一粒会动的蓝）、整个人连帽子扭向右边、眼睛往右躲、
// 右手按在右腮上挠、身子压 5；中间偷看你一眼被逮住——眼睛缩成小方点、帽子砸下来、新冒一颗汗，干笑两下，再把脸别开。
//
// 汗珠放左边：右边是睡帽的绒球（框里 x 130–150、y 20–40）和贝雷帽的金扣（框里 115–125 × 25–35），挠腮的右手也在右边。
// 左手就不能垂在身侧了——默认的左手画在 70–90 × 223–243，正好是汗珠滑下去的那条路；挪到肚子上攥着（害羞那只叠在身上的手，skinSide），
// 身子左边整条空出来只给汗珠走，70pt 下那一粒蓝不和手糊成一块。
//
// 一圈 45 帧（3 秒），首帧是静图——汗珠挂在帽檐左外、脸别到一边、手按在腮上；表情包定在第 27 帧干笑那一下：
//   0–17   别开脸：身子往右挪 5（脚钉着不动）、帽子往右挪 10、眼睛往右（gazeX 5），整个人是扭开的，右手在腮上一左一右地挠（每两帧挪 5）；
//          汗珠 0–5 挂在帽檐左外（贴着檐尖），6 起每两帧往下滑 5，滑到 17；8–9 眨一下（45 帧里还空着的起始帧）
//   18     偷偷转回来看你一眼：人和帽子归位、眼睛回到正中，手停了；汗珠这一帧掉到地上
//   19–20  还看着你，汗没了
//   21     被逮住：一帧缩到压 10、帽子沉 5（帽顶一步落 10）、眼睛缩成小方点，帽檐左外冒出一粒汗（10×10）
//   22–26  愣着：小方点盯着你，那一粒长成带尖的一颗挂在帽檐左外
//   27–30  干笑两下：闭眼往上抬 5、两头各往下补一格成一个往上挑的「∩」，身子一拉一压两回（−5 / 5，每帧一步 10，全片「一帧到位的大步」）；
//          汗珠挂在帽檐上，跟着帽子一颠一颠
//   31–44  又把脸别开（31 一帧扭过去：身子挪 5、帽子挪 10），汗珠还挂在檐上，接首帧。44 和 0 四肢逐个相同，接缝为零
//
// [1015 复审] 第一版 30 / 48pt 下就是待机加一粒蓝点，审的人量过：30pt 下首帧和委屈的首帧只差 52 个像素。改了三样：
//   ① 汗珠挂到帽檐上：原来首帧汗珠滑到一半，悬在身子左边 10 外、眼睛那么高，离帽子、离脸都不挨着，像飘在旁边的一粒水；
//      现在它就挂在帽檐左头外面（帽子在哪它在哪），滑也是贴着脸的左边往下滑。地上那一滩（13–14）拿掉了——摊在脚边的一道蓝读成洒了水。
//   ② 按腮的手换一个暗得多的肉色 cheekHand（#c95d45）：原来用 skinSide，和皮肤只差一档，叠在脸上整只糊进去，70pt 下只剩右边破开的那个尖。
//      手叠在身子上照规矩要暗一档，这一只要从脸上「浮」出来，就再暗两档；只进这一支的色表。
//   ③ 扭开的幅度加大：原来只有眼睛偏 5、帽子挪 5，70pt 下 1 个点；现在身子也挪 5、帽子挪 10，剪影整个歪向一边，
//      偷看那一下人和帽子一起转回来，30pt 下也看得出「转过去、转回来」。
//
// 眼睛只用 open / dot / closed 三种，不用半眼：半眼和小方点都是 10×10 的方块、只差 5 的高低，70pt 下「躲」和「被逮住」会是同一张脸；
// 睁眼的竖条往右偏 → 缩成小方块 → 压成两道往上挑的弯，三种在 70pt 下各是各的剪影。
// 睁眼的帧帽子不沉（睁眼平视帽檐只让得出 4，写 5 会被夹成 4、落不到 5 格上）；压 5 的身子帽顶本来就比待机低 5，缩着的样子已经在了。
// 也不往下看（gazeY 5）：压 5 时眼睛会落到 223–243，右眼下沿压进包顶（238 起）、左眼压到肚子上的手。
//
// 汗珠 blue 20×25、尖朝右上（卷向头那边），effects 层；整支一粒都不压在身子、衣服、帽子、手、包上（verify 查），
// 挂着的时候左边贴着檐尖、滑的时候贴着身子左缘，穿风雪帽时护耳盖到 80–100，汗珠也跟着帽子往外让（它钉在帽子框上）。
const LAUGH_FROM = 27, LAUGH_TO = 30;
const SLIDE_FROM = 6, SLIDE_TO = 17, FALL = 18; // 汗珠从第 6 帧开始往下滑、17 滑到最低、18 掉到地上

function beat(i) {
  if (i === 21) return 'caught';
  if (i >= 22 && i <= 26) return 'frozen';
  if (i >= LAUGH_FROM && i <= LAUGH_TO) return 'laugh';
  if (i >= 18 && i <= 20) return 'peek';
  return 'away'; // 31–44、0–17
}

// 汗珠的样子：缩到 70 先后比过五种——15×20 的菱形读成一个蓝色「+」，平底的读成小房子，
// 这颗 20×25 尖卷向右上、底是圆的，70pt 下是 5×6 个点，一眼是漫画里那颗汗。刚冒出来那一帧只是一粒 10×10
const DROP = ['0010', '0110', '1111', '1111', '0110'];
const DROP_PIXELS = DROP.join('').split('').filter(c => c === '1').length * 25;
const BEAD = ['11', '11'];
// 这一帧汗珠在哪：x 钉在帽子框左边外 20（右边正贴着檐尖），帽子挪到哪它跟到哪；挂着的时候顶边 = 帽框顶 + 25，
// 汗珠的上半截在檐尖旁边、下半截垂到脸的左边。返回 null 就是这一帧没有汗
function dropAt(i, hat) {
  const x = hat.x - 20, hang = hat.y + 25;
  if (i === 21) return { rows: BEAD, x: x + 5, y: hang + 10 }; // 落在汗珠最宽那两行的正中，下一帧长出尖和底
  if (i >= SLIDE_FROM && i <= SLIDE_TO) return { rows: DROP, x, y: hang + 5 * Math.floor((i - SLIDE_FROM) / 2) };
  if (i === FALL) return { rows: DROP, x: x + 10, y: 273 - 25 }; // 一帧掉到底边贴着 273：滑是一格一格挪，掉是一下子；这一帧人转回正中，汗留在原来那一列
  if (i >= 19 && i <= 20) return null;
  return { rows: DROP, x, y: hang }; // 22–44、0–5 挂在檐上
}

module.exports = {
  id: 'sweating',
  label: '尴尬流汗',
  frames: 45,
  ms: [70, 60, 70],
  group: 'emotion',
  keyframes: [0, 12, 18, 21, 23, 27, 28, 31],
  // 表情包定帧是第 27 帧：干笑「∩」、身子拉长一下、汗珠挂在帽檐左外、暗色的手按在腮上——「^^;」那一张。
  // [1015 复审] 原来定在首帧（汗滑到一半、眼睛往右躲），30pt 下和待机只差一粒蓝点；首帧照旧是静图（别开脸、汗挂在檐上），
  // 表情包换成这一支在小尺寸下最认得出的那一下
  stickerFrame: 27,

  // 按腮那只手的颜色，见开头 ②
  palette: { cheekHand: '#c95d45' },

  pose(i, { closedAt }) {
    const b = beat(i), away = b === 'away';
    // 缩着是常态（压 5）；被逮住那一帧压到 10；干笑一拉一压
    const squash = b === 'caught' ? 10 : b === 'laugh' ? (i % 2 ? -5 : 5) : 5;
    // 扭开：身子往右挪 5，脚钉在原地（footOffsets 抵回去），帽子再多挪 5——身子、帽子、脚三层错开，剪影整个往右歪
    const dx = away ? 5 : 0;
    // 右手按在右腮上：画出来以 (210 + dx, 228) 为心、转 45° 的一块，一半叠在脸上，用暗得多的 cheekHand 从脸上浮出来。
    // 不转的话它和身子右缘对齐成一条竖边，70pt 下读成脸侧的阴影；转成菱形才把方方的脸边破开，认得出是一只手按在腮上。
    // 被逮住压下去那一帧手跟着下去（手不跟 squash，得自己加）；干笑拉长那两帧手不跟着往上——跟上去菱形上角会戳进帽檐右头的绒球。
    // 挠是左右挪 5 不是上下：往上挪 5 也是戳绒球；往里挪多了会盖住往右偏的那只眼
    const scratch = away && i % 4 >= 2 ? -5 : 0;
    const right = { x: 190 + dx + scratch, y: 213 + Math.max(0, squash - 5), a: 45, color: 'cheekHand' };
    // 左手攥在肚子上（画在 100–120 × 238–258、转 15°，底下留一行马甲不贴着脚），不跟着身子颠，也不跟着扭（攥着的是自己）。
    // 转的方向是右边那角往下：反过来转，右上角会戳进眼睛往正中看时的左眼下沿
    const left = { x: 110, y: 233, a: 15, color: 'skinSide' };
    let eyes = 'open';
    if (b === 'caught' || b === 'frozen') eyes = 'dot';
    else if (b === 'laugh') eyes = 'closed';
    else if (closedAt(8)) eyes = 'closed';
    return {
      dx,
      squash,
      // 小方点和闭眼让得出 5：被逮住、愣着、干笑那几帧帽子沉 5，比别开脸时低一格
      hatDrop: b === 'caught' || b === 'frozen' || b === 'laugh' ? 5 : 0,
      hatShift: away ? 5 : 0,
      gazeX: away ? 5 : 0,
      // 干笑的眼往上抬 5：「∩」那两条腿才落在 body.y+20–25，不往下压到包顶和肚子上的手
      gazeY: b === 'laugh' ? -5 : 0,
      eyes,
      hands: [left, right],
      footOffsets: [-dx, -dx, -dx, -dx],
      // 扭过去（31）、转回来（18）那一帧身子一步挪 5，收尾会把包甩 10°，包角甩到右眼底下；抵回去摆正
      bag: { a: -2 * (dx - (beat((i + 44) % 45) === 'away' ? 5 : 0)) }
    };
  },

  paint(ctx, p, i) {
    const drop = dropAt(i, ctx.hat);
    if (drop) ctx.effects.pattern(drop.rows, drop.x, drop.y, 'blue', 5, 'drop');
    // 干笑的眼：引擎画的闭眼是格子底部一横 10×5，两头各往下、往外补一格 5×5，成一个往上挑的「∩」
    if (i >= LAUGH_FROM && i <= LAUGH_TO) {
      ctx.eyes.forEach((e, n) => ctx.effects.pattern(['1001'], e.x - 5, e.y + 20, 'ink', 5, n ? 'smile-right' : 'smile-left'));
    }
  },

  check: {
    verify(i, { pixels, layers, meta, part, shown }) {
      const out = [], W = 300;
      const each = (q, fn) => { for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) fn((y * W + x) * 4); };
      // 汗珠一粒都不许压在身子、衣服、帽子、手、包上：它得是身子左边单独的一粒蓝，压上去 70pt 下就糊进剪影里了
      for (const tag of ['drop']) {
        const q = part(tag); if (!q) continue;
        let hit = 0;
        each(q, k => { if (layers.effects[k + 3] && ['body', 'costume', 'hat', 'hand-left', 'hand-right', 'bag'].some(l => layers[l][k + 3])) hit++; });
        if (hit) out.push(`汗珠压到人身上 ${hit} 个像素`);
      }
      // 干笑那几帧：「∩」两条腿都得落在光着的脸上——底下是身子，上面没有手、包、衣服，不然是悬在空里或压在别的东西上的两粒黑
      if (i >= LAUGH_FROM && i <= LAUGH_TO) for (const tag of ['smile-left', 'smile-right']) {
        const q = part(tag); if (!q) { out.push(`干笑的 ${tag} 没画`); continue; }
        let off = 0;
        each(q, k => { if (layers.effects[k + 3] && (!layers.body[k + 3] || ['costume', 'hand-left', 'hand-right', 'bag'].some(l => layers[l][k + 3]))) off++; });
        if (off) out.push(`干笑的 ${tag} 有 ${off} 个像素不在光着的脸上`);
      }
      // 挠腮的右手不许盖住睡帽的绒球、贝雷帽的金扣（帽子层上那几种颜色）：目录把汗珠挪到左边就是为了让着这两样，手也只按在腮上。
      // 按穿的哪件挑颜色：风雪帽的绒毛亮面和睡帽绒球是同一个 #fff6d8，可手按在风雪帽垂到腮边的护耳上本来就对——手就是按在那儿
      const keep = { nightcap: [[0xff, 0xf6, 0xd8]], beret: [[0xe7, 0xd2, 0x98], [0xda, 0xb5, 0x50], [0xc5, 0xa2, 0x48]] }[meta.outfit] || [];
      let hidden = 0;
      if (keep.length) for (let k = 0; k < pixels.length; k += 4) {
        if (!layers['hand-right'][k + 3] || !layers.hat[k + 3]) continue;
        if (keep.some(c => layers.hat[k] === c[0] && layers.hat[k + 1] === c[1] && layers.hat[k + 2] === c[2])) hidden++;
      }
      if (hidden) out.push(`右手盖住了${meta.outfit === 'nightcap' ? '睡帽的绒球' : '贝雷帽的金扣'} ${hidden} 个像素`);
      // 首帧是表情包那一帧：汗珠得在，而且整颗露着
      if (i === 0 && shown('drop') !== DROP_PIXELS) out.push(`首帧汗珠只露了 ${shown('drop')}/${DROP_PIXELS}`);
      return out;
    }
  }
};
