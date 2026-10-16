# 出处 · Attribution

> **Unofficial fan work · 非官方同人作品.** Clawd is a character created by Anthropic for Claude Code. This project is not made by, affiliated with, sponsored by or endorsed by Anthropic, and it does not speak for Anthropic.
> Clawd 是 Anthropic 为 Claude Code 创作的角色。本项目不是 Anthropic 出品，与 Anthropic 没有隶属关系，没有得到其赞助或背书，也不代表 Anthropic。

这一页写清楚三件事：这只小家伙从哪儿来、仓库里每一样东西是谁做的、以及哪些东西**不在**这里。
This page answers three questions: where this little one comes from, who made what, and what is *not* in this repository.

## 1. Anthropic · Clawd

Clawd, the little orange pixel friend who keeps people company in Claude Code, was created by [Anthropic](https://www.anthropic.com). All rights in the Clawd character, and in the names and logos "Clawd", "Claude", "Claude Code" and "Anthropic", belong to Anthropic, PBC. Neither license in this repository covers them, and nothing here grants permission to use Anthropic's names or trademarks.

Clawd 是在 Claude Code 里陪人写代码的那只橙色像素小家伙，由 Anthropic 创作。这个角色，以及「Clawd」「Claude」「Claude Code」「Anthropic」这些名称和标识，一切权利归 Anthropic, PBC。本仓库的两份许可都不涉及它们，也不授予任何使用 Anthropic 名称或商标的许可。

我们画的是「穿上老伦敦信差制服的 Clawd」：圆顶硬礼帽、怀表链、侧挎皮包，后来又多了四套衣服。角色还是 Anthropic 的，衣服和动作是我们自己画的。
What we drew is Clawd dressed as an old London postie (bowler hat, pocket-watch chain, satchel), plus four more outfits. The character is still Anthropic's; the outfits and the motion are ours.

## 2. 鹿鹿 (@rullerzhou-afk) · Clawd on Desk

The first Clawd in our home came from [Clawd on Desk](https://github.com/rullerzhou-afk/clawd-on-desk) by 鹿鹿, and it is what made us want to draw one of our own. Thank you for showing us how much life a few pixels can hold.

家里的第一只 Clawd 来自鹿鹿老师的 Clawd on Desk，也是它让我们想自己画一只。谢谢老师让我们知道，几块像素能装下多少生气。

**This repository contains no code and no artwork from Clawd on Desk.** Clawd on Desk's code is AGPL-3.0 and its artwork is all rights reserved; we used neither. Every pixel here is drawn by this repository's own engine code (`motion.cjs` for timing and poses, `engine.cjs` for painting layer by layer). No image from Clawd on Desk is read, copied or bundled, and none of its Electron runtime is used.

**本仓库没有收录 Clawd on Desk 的任何代码或图片。** 它的代码是 AGPL-3.0，美术保留所有权利，这两样我们都没用。这里的每一个像素都是本仓库自己的引擎用代码画出来的（`motion.cjs` 管节奏与姿势，`engine.cjs` 按图层画像素），不读入、不复制、不打包它的任何图片，也没有用它的 Electron 运行时。

## 3. 做这只小家伙的人 · The makers

| 谁 · Who | 做了什么 · What |
|---|---|
| **Luin Luinaris** | 动画与引擎，从底稿到四十八支：22 支老动作一帧一帧重做、26 支新画；引擎从约 730 行长到约 2400 行，一支动作一个文件的 `states/`、换装图层 `outfits/`、单支动作的体检 `state-check.cjs`、解剖检查 `check-art.cjs`、`--stickers` 贴纸导出；四套衣服照着设计按 10px 一格一格画成点阵代码。<br>Animation and engine, from the first prototype to all 48 moves: the 22 original moves redrawn frame by frame and 26 new ones; the engine grown from ~730 to ~2,400 lines, one-file-per-move `states/`, outfit layers in `outfits/`, the per-move checker, the anatomy checks and the sticker exporter; the four outfits turned into pixel code one 10px cell at a time. |
| **Charlie Luinaris** | 老伦敦信差的设定（圆顶硬礼帽、怀表链、侧挎皮包）；亲手改过的像素：两只方块大手、四只方块脚、扁扁的身子；四套衣服（飞行帽、贝雷帽、睡帽、风雪帽）的设计。项目维护者与版权人。<br>The London postie concept; the pixel corrections she made by hand (two square hands, four square feet, a flat little body); the designs of the four outfits (aviator, beret, nightcap, winter fur). Maintainer and copyright holder. |

转发、二次创作时请带上这行署名 · When you share or remix, please keep this credit line:

> clawds-new-clothes · animation by Luin Luinaris · outfits by Charlie Luinaris · CC BY-NC-SA 4.0 · unofficial Clawd fan work

## 4. 本仓库不包含什么 · What this repository does not contain

- **Clawd on Desk 的任何代码或图片**（包括经典 Clawd 动画）都不在这里。
  **No code or artwork from Clawd on Desk**, including its classic Clawd animations.
- **Anthropic 的标识或官方素材**：没有星芒 logo、没有 Claude 字标、没有 press kit 里的任何东西。
  **No Anthropic logos or official assets**: no starburst logo, no Claude wordmark, nothing from a press kit.
- **四套衣服的原稿**：Charlie 的原稿留在家里，没有公开；`outfits/*.cjs` 是照着它们重新起稿的点阵代码。
  **The outfit originals**: Charlie's originals stay at home and are not published; `outfits/*.cjs` is pixel code redrawn from them.
- **画动作时看过的参考图**：第一批画表情时，Charlie 递来过几张别人画的猫咪表情包截图当参考。那些图不是我们的，没收进来；`states/*.cjs` 注释里提到的 `ref-N` 指的就是它们，只取过「这一格靠什么读出来」，猫的画法一笔没拿。
  **Reference images**: while drawing the first batch, Charlie shared a few screenshots of someone else's cat stickers. They are not ours and are not included; the `ref-N` mentions in `states/*.cjs` refer to them. Only the idea of what makes each panel readable was taken, never the drawing.
- **个人肖像与照片**：我们俩的 Q 版形象、照片、截图都不在这里。 · **No portraits or photos** of either of us.
- **能重出的大件**：`frames/`、`keyframes/`、`parts/`、`manifest.json`、图集、408 / 618 两档贴纸不进 git，`npm run export` / `npm run stickers` 逐字节重出。
  **Large reproducible outputs** (`frames/`, `keyframes/`, `parts/`, `manifest.json`, the atlas, the 408 / 618 sticker sizes) are not committed; `npm run export` and `npm run stickers` rebuild them byte for byte.

## 5. 第三方依赖 · Third-party dependencies

Installed by `npm ci`, not bundled · 由 `npm ci` 安装，不随仓库分发：

- [sharp](https://github.com/lovell/sharp) 0.35.5, Apache-2.0
- [JSZip](https://github.com/Stuk/jszip) 3.10.1, MIT OR GPL-3.0-or-later (used here under MIT · 这里按 MIT 使用)
