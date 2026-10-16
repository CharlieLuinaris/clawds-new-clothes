// clawds-new-clothes · states/_template.cjs · template by Luin Luinaris, free to copy for your own moves · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 新动作模板：一支最简单的「蹦两下」。下划线开头，所以 motion.cjs 不会把它读进正式的 STATES——它只是给你抄的。
//
// 抄的办法：复制一份改名成 states/<你的 id>.cjs（文件名必须和下面的 id 一模一样，小写英文、用 - 连），改 id 和 label，
// 然后  node export.cjs --state <你的 id> --preview  看预览（存在 states/preview/），不抄也能直接看这个模板：
//        node export.cjs --state _template --preview
// 规矩、每个字段的取值范围、锚点数字、常见穿帮，都在同目录的 README.md。
module.exports = {
  id: 'hop-twice',          // 草稿（_ 开头的文件）的 id 可以和文件名不一样；正式文件 states/hop-twice.cjs 里必须就叫 hop-twice
  label: '蹦两下',           // 中文名：预览页的卡片、manifest 的 label 都用它
  frames: 45,               // 只能是 45 / 48 / 90
  ms: [70, 60, 70],         // 每帧延时轮着来，规格定死的，写出来只是让读的人看见；写别的会直接报错
  group: 'core',            // core 日常 / locomotion 走跑跳 / emotion 情绪 / prop 道具 / sticker 表情包
  keyframes: [0, 7, 8, 13, 19, 26, 30, 34],   // 关键姿势（2–8 个，第一个是 0）；不写就按帧数平均挑 8 个

  // palette：这一支自己的补色，规矩和换装一样——小驼峰英文、#rrggbb、不许和老伦敦那 19 色重名，只给这一支用。
  // 蹦两下用现成的颜色就够，所以空着；要加就写成这样：
  // palette: { signGreen: '#4f9d5d' },

  // pose(i, ctx)：第 i 帧的姿势。return 哪几个字段就改哪几个，没写的照默认（站着、两手垂在身侧、睁眼平视）。
  // 引擎拿到之后还会替你收尾：帽子跟着起落落后一拍、包随横移甩、两只手往身侧挪（左 −10、右 +10、往下 5）、帽檐不压眼、所有坐标取整。
  // 它每帧会被叫两次（这一帧和上一帧，算帽子落后用），所以只能看 i，不要在外面记状态
  pose(i, { curve, snap5, closedAt }) {
    // 起跳：0–4 站着（首帧就是静图，要睁眼、脚在地上）；5–7 往下蹲 10；8 一帧蹬起来（拉长 5，离地 10）；
    // 9–13 减速冲到 −40，14 顶点停一帧，15–19 加速落地；19–20 落地压扁 10、闭眼；21–22 回弹；
    // 23–25 再蹲 5，26 蹬起，第二跳矮一截到 −25，34 落地；36–44 站好，和首帧逐像素全等，循环接缝为零。
    // 曲线点的第三项是缓动：'o' 减速、'i' 加速、'l' 线性，不写是平滑；snap5 把结果对到 5 格上（1–3 的量 70pt 下看不见，还会被预览提醒）
    const jump = snap5(curve(i, [[0, 0], [7, 0], [8, -10], [13, -40, 'o'], [14, -40], [19, 0, 'i'], [25, 0], [26, -10], [29, -25, 'o'], [30, -25], [34, 0, 'i'], [44, 0]]));
    const squash = snap5(curve(i, [[0, 0], [4, 0], [7, 10, 'i'], [8, -5], [9, 0], [18, 0], [19, 10], [20, 10], [22, 0, 'o'], [23, 5], [25, 5], [26, -5], [27, 0], [33, 0], [34, 10], [35, 10], [37, 0, 'o'], [44, 0]]));
    const inAir = jump <= -20, rising = (i >= 9 && i <= 18) || (i >= 27 && i <= 33);
    // 手跟着身子走：空中举高 10、往外张 5、各歪 10°；蹲得最低那几帧再往下沉 5
    const hy = 218 + jump + (rising ? -10 : 0) + (squash >= 10 ? 5 : 0), spread = rising ? 5 : 0, a = rising ? 10 : 0;
    return {
      jump, squash,
      hands: [{ x: 80 - spread, y: hy, a: -a }, { x: 200 + spread, y: hy, a }],
      // 空中四只脚收 5、往中间拢（落地那一帧就放下来，不然 jump 0 却脚不沾地，预览会报「悬在半空」）
      feet: inAir ? [5, 5, 5, 5] : [0, 0, 0, 0],
      footOffsets: inAir ? [5, 0, 0, -5] : [0, 0, 0, 0],
      // 顶点抬眼往上看；落地那两帧闭眼——closedAt(19, 34) 是第 19–20、34–35 帧
      gazeY: i >= 12 && i <= 15 ? -5 : 0,
      eyes: closedAt(19, 34) ? 'closed' : 'open'
    };
  },

  // paint(ctx, p, i)：这一支自己的道具、特效、牌子（可选）。只能画 paper / letter / props / lettering / effects 五层，
  // 身子、眼睛、帽子、手脚由上面的姿势驱动——这样四套换装才自动穿得上。ctx 里给的位置都是这一帧真画出来的：
  // ctx.feet[n] 是第 n 只脚的 { x, y, w: 10, h: 10 }，ctx.hands、ctx.eyes、ctx.hat、ctx.bag、ctx.body 同理（README 有全表）。
  // 这里画落地扬起的两团灰：19、34 贴着最外面两只脚，20、35 往外、往上各散开 5；画在 effects 层，所以一粒都不能盖到脚上。
  // 用 grey 不用 paperEdge：paperEdge 落在纸色浅底（paper）上几乎没对比，grey 深底浅底都看得见
  paint(ctx, p, i) {
    const k = [19, 34].includes(i) ? 0 : [20, 35].includes(i) ? 1 : -1;
    if (k < 0) return;
    const left = ctx.feet[0], right = ctx.feet[3], y = ctx.baseline - 10 - 5 * k;
    ctx.effects.pattern(['01', '11'], left.x - 15 - 5 * k, y, 'grey', 5, 'dust-left');
    ctx.effects.pattern(['10', '11'], right.x + right.w + 5 + 5 * k, y, 'grey', 5, 'dust-right');
  },

  // check：检查白名单和这一支自己的不变量。白名单都是帧号表（单帧或 [起, 止] 含两头），只放行登记了的帧：
  //   eyesHidden   这些帧眼睛可以不画（eyes: 'hidden'，比如拿信挡住脸）
  //   eyesCovered  这些帧眼睛可以被手、道具、特效盖住
  //   hatOffHead   这些帧帽子可以离头（吓飞、被风吹起来）
  //   hatAside     这些帧帽子可以躺在地上（tool.hatAside）
  //   airborne     这些帧可以四只脚都不着地却不给 jump（首帧也算：整支离地的那种，比如被抱起来，登记 0）
  //   firstFrameEyesClosed: true   首帧可以闭着眼（静图会像睡着了，慎用）
  // 蹦两下一条都用不着；verify 示范「我自己的不变量」：落地那几帧两团灰都得露出来（shown 数这一块露出几个像素，一团三格 75）
  check: {
    verify(i, { shown }) {
      if (![19, 20, 34, 35].includes(i)) return null;
      return ['dust-left', 'dust-right'].filter(tag => shown(tag) < 75).map(tag => `落地扬起的 ${tag} 被盖住了`);
    }
  }
};
