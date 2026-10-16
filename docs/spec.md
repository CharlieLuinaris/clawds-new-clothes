# 统一规格 · Spec

所有动作、所有衣服、所有导出都守着这一页。改之前先想好：老的 48 支要不要跟着重出，`npm run export` 之后 `gif/`、`static/` 会不会有一个字节变了。
Every move, every outfit and every export follows this page.

## 画布 · Canvas

| | |
|---|---|
| 画布 · canvas | **300 × 300 px**，透明底，所有图层共用左上角原点 |
| 网格 · grid | **10 px 主格、5 px 细部格**，纵向绘制原点偏 3 px（行落在 …203、208、213… 上） |
| 基线 · baseline | 静止站姿脚底 **y = 273**（91%），水平中心 **x = 150**；跳和抬脚都以它为地面 |
| 身子 · body | 站姿 **120 × 55**（x 90–210，y 208–263）；睡姿 **110 × 42**；扁宽，不做 1–3 px 的呼吸 |
| 眼睛 · eyes | 睁眼固定 **10 × 20**，不跟身子压扁拉长；半眼 10 × 10、闭眼 10 × 5、小方点 10 × 10、星星眼 15 × 15 |
| 透明 · alpha | PNG 只有 **0 / 255**；GIF 是 **1 位透明**；不做边缘平滑、不做半透明插值 |

## 节奏 · Timing

- 每帧延时按 **70、60、70 ms** 轮着来，所有 GIF **无限循环**。不做逐帧延时：不少播放端会把它摊平，帧就是唯一的时钟。
- 一圈只能是 **45 帧（3 秒）/ 48 帧（3.2 秒，等人的循环）/ 90 帧（6 秒，长的）**；晕乎乎是唯一的 36 帧（2.4 秒，v8 起就这样）。
- 三把尺：**主位移 ≥ 10 px、次位移 5 px、1–3 px 的量一律不写**（70 pt 下 10 px 才 2.3 pt）；每支至少一处**一帧到位的大步**（起跳、落地、砸、甩），其余用停拍换时长；眨眼闭两帧，各支错开。
- 静止段别超过 9 帧：相邻两帧整张逐像素相同就算同一段。

## 首帧与减少动态 · First frame & reduced motion

- 每支 GIF 的**第 0 帧**单独存成 `static/clawd-<id>.png`，和 GIF 解出来的第 0 帧逐像素相同。暂停、省电、系统「减少动态效果」时只显示它。
- 所以首帧要「站得住」：不闭眼（例外要登记）、不离地、眼睛露着。
- 贴纸的静图可以另挑一帧（`stickerFrame`），它必须是这一支的关键帧之一；`static/` 不受影响。

```html
<picture>
  <source srcset="static/clawd-waving.png" media="(prefers-reduced-motion: reduce)">
  <img src="gif/clawd-waving.gif" width="150" height="150" alt="Clawd waving">
</picture>
```

## 图层 · Layers

从底到顶 · bottom to top：

`paper` → `body` → `costume` → `strap` → `strap-chain` → `eyes` → `hat` → `bag` → `hand-left` → `hand-right` → `letter` → `wax-seal` → `props` → `feet-1` → `feet-2` → `feet-3` → `feet-4` → `lettering` → `effects`

- 每一层都保留 300 × 300 画布，叠在同一原点就能拼回去；空层可以跳过。
- 背带 `strap` 按衣服的不透明区域裁过，每个像素都在衣服里；`strap-chain` 只有表链和怀表。
- 打字头顶的像素字、写信的短划、举牌的勾和叉都在 `lettering` 层。
- 新动作（`states/`）只能画 `paper`、`letter`、`props`、`lettering`、`effects` 五层；身子、衣服、眼睛、帽子、包、手、脚由姿势驱动，这样四套衣服才自动穿得上。

## 小尺寸 · Small sizes

家里用的是 30 / 48 / 70 / 90 pt 四档，70 pt 是规格那一档。表情主要靠**大剪影**读：帽子飞起来、手举高、整个人矮下去、身边冒一大颗东西。泪、星、汗至少 10 × 10；记号（勾、叉、问号）放大到 25 上下。深底 `#0d1430` 和纸色浅底 `#edddba`、白底聊天三种底都要看得见。

## 调色板 · Palette

老伦敦 19 色（衣服和新动作可以补色，但不许和这 19 个重名）：

`skin #ff8964` `skinSide #ed7758` `ink #262329` `leather #694631` `leatherLight #926044` `leatherDark #422e27` `gold #dbaa39` `goldLight #f7d471` `paper #edddba` `paperEdge #c9b28d` `white #fff7df` `red #bf5147` `redLight #e2745f` `blue #49879d` `green #709777` `grey #94958d` `earWhite #ffffff` `earShade #ced5d7` `hatRim #7a7386`

## 贴纸 · Stickers

`npm run stickers` 给每一支量一个只装得下他的正方形（这一圈所有帧加静图那一帧的不透明外框，四周留 6，取长边），再**最近邻整数倍**放大：

| 档 · size | 倍数 · scale | 进 git · committed |
|---|---|---|
| 300 | 48 支全是 ×1（人挪到正中） | ✅ `stickers/300/` |
| 408 | 方框 ≤ 204 的 ×2，其余 ×1 | 重出 · rebuild |
| 618 | 方框 ≤ 206 的 ×3，其余 ×2 | 重出 · rebuild |

不拉非整数倍：×1.5 的话同一格有的放成 7 有的放成 8，人一动边就在抖。每帧最外一圈必须透明；任何一档 GIF 超过 500 KB（iMessage 一张的上限）会提醒。索引在 `stickers/stickers.json`。

## 可复现 · Reproducible

`npm ci && npm run export && npm run stickers` 在同一套依赖（sharp 0.35.5、jszip 3.10.1）下逐字节重出 `gif/`、`static/`、`sheets/`、`variants/`、`stickers/300/`。全量导出的 zip 每个条目盖同一个固定日期，没改东西重打出来的包也逐字节相同。
