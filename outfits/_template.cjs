// clawds-new-clothes · outfits/_template.cjs · template by Luin Luinaris, free to copy for your own outfits · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
// 换装模板：一顶最简单的方帽 + 一件纯色外套。照着它抄一份改名字（outfits/beret.cjs），
// 然后 node export.cjs --outfit beret --preview 看五张预览。规矩和锚点数字都在同目录的 README.md。
module.exports = {
  name: '_template',
  label: '模板：方帽 + 纯色外套',

  // ① 补色：只给这套衣服用，不进老伦敦那 19 色的 palette。名字照老规矩小驼峰英文，和老色重名会直接报错；
  //    色值从她原稿里吸（#rrggbb）
  palette: {
    templateCloth: '#3f6f5a',
    templateClothDark: '#2b4d3f'
  },

  // ② 帽子：在礼帽那个 140×40 的框里画，左上角是 (0,0)，檐底那一行是 y 35–40，底边不许过 40——
  //    他的眼睛最高会顶到框里的 y 40（x 25–115 那一段），帽子往下多画一行就压眼睛。往上画随便，y 可以是负的。
  //    rect/pattern 收的都是框里的坐标，引擎替你乘 scale、套礼帽同一个 transform、画进 hat 层，
  //    所以落后一拍、沉一下、跟着歪、被抱起来横挪、睡着时躺在地上半大，全是自动的，这里一行不用管
  hat(ctx) {
    ctx.rect(20, 5, 100, 30, 'templateCloth', 'hat');   // 帽身：比礼帽窄一点的一个方块
    ctx.rect(20, 25, 100, 5, 'ink');                     // 帽带
    ctx.rect(10, 35, 120, 5, 'templateClothDark');       // 檐：横着压住他整个头顶（身子在框里是 x 10–130）
    ctx.rect(20, 5, 100, 5, 'hatRim');                   // 帽顶一行提亮，深底上看得见轮廓（和礼帽同一个办法）
  },

  // ③ 衣服：坐标是画布上的绝对坐标，引擎替你套身子的 transform（lean 时跟着歪），画进 costume 层。
  //    宽度跟 body.w 走，别比他窄；顶边别高过 body.y+30（眼睛最低到 body.y+30，衣服爬上来眼睛就像长在布上）。
  //    马甲要留就调 ctx.waistcoat()，这里整件盖掉了所以不调
  costume(ctx, { body, bottom }) {
    const top = Math.max(body.y + 30, bottom - 30);
    ctx.rect(body.x, top, body.w, bottom - top, 'templateCloth', 'coat');
    ctx.rect(body.x, top, body.w, 5, 'templateClothDark');                     // 领口一道深色
    if (ctx.side) ctx.rect(body.x, top, 20, bottom - top, 'templateClothDark'); // 侧身时背后那 20 列压暗，和身子的 skinSide 一个意思
  },

  // ④ 皮包和肩带照背（hideBag 不写就是 false）；外套盖住了马甲，挂在马甲上的表链和怀表就摘了
  hideWatch: true
};
