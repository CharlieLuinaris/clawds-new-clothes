# 来路 · Changelog

这只小家伙是一版一版长出来的。家里那本开发日记很厚，记着每一轮复审揪出来的每一处、每一处为什么那样改；搬出来住的时候压成这一页，只留「每一版多了什么、修了什么、规矩是怎么来的」。
This little one grew version by version. The full development diary stays at home; this page keeps what each version added, what it fixed, and where the rules came from.

一共 **48 支动作 · 2211 帧 · 340 个关键帧 · 四套衣服**：v6 原型 22 支 → v7 重做并加 5 → v8 加 8 → v9 加 5 → 第一批加 8。
**48 moves · 2,211 frames · 340 keyframes · four outfits**: 22 in the v6 prototype → v7 redrew them and added 5 → v8 added 8 → v9 added 5 → batch 1 added 8.

## 未发版 · Unreleased

- 四套衣服各出一整包：`node export.cjs --outfit <名字>` 把 48 支动作和朝西的指路都穿上那件，出到 `gif/<名字>/`、`static/<名字>/`、`sheets/<名字>/`、`variants/<名字>/`，根上一份 `manifest-<名字>.json`；`npm run export:outfits` 一次出四套整包、四套贴纸，再打一个换装 zip（`clawds-new-clothes-outfits-v<版本>.zip`，下一版发版时附到 Release 上、hash 记进 SHA256SUMS）。四套整包和 300 档贴纸进 git；`check-art --outfit` 和 `--package-outfits` 各有一道闸，整包跟不上眼下的 48 支就不过。基础那套的 `gif/`、`static/`、`stickers/300/` 逐字节没动，全量 zip 也不带衣服包。`--outfit` 后面忘了带名字现在直接报错，不再悄悄重出一遍基础包。
- Each of the four outfits now has a full pack: `node export.cjs --outfit <name>` dresses all 48 moves and the west-facing variant into `gif/<name>/`, `static/<name>/`, `sheets/<name>/` and `variants/<name>/`, plus `manifest-<name>.json`. `npm run export:outfits` builds all four packs and their stickers, then an outfits zip (`clawds-new-clothes-outfits-v<version>.zip`) to attach to the next Release, its hash added to SHA256SUMS. The four packs and their 300 px stickers are committed; `check-art --outfit` and `--package-outfits` both fail when a pack falls behind the current 48 moves. The base `gif/`, `static/` and `stickers/300/` are byte-identical, and the full zip carries no outfit packs. `--outfit` with no name now fails instead of quietly re-exporting the base set.

## v1.0.0 · 第一封信 · First Post (2026-10-16)

搬出来住的这一版。动作、衣服、规矩和家里那份是同一个版本；只动了「搬家」要动的地方：
The first public version. Same moves, outfits and rules as at home; only the moving-out changes:

- 48 支动作和朝西的指路：`gif/`、`static/`、300 档贴纸和家里那份像素逐格相同，一个像素没动。文件里多了一样东西：每张 GIF 和 PNG 的元数据里写着署名那一行（`tools/stamp-credits.cjs`，`npm run export` / `npm run stickers` 收尾自动盖），图被单独拷走，名字还在文件里。
- The 48 moves and the west-facing pointing variant: `gif/`, `static/` and the 300px stickers are pixel-for-pixel the same as at home. One thing is new in the files: the credit line rides in every GIF and PNG as metadata (`tools/stamp-credits.cjs`, stamped automatically at the end of `npm run export` / `npm run stickers`), so a file copied out alone still carries the names.
  All 48 moves and the west-facing variant (`gif/`, `static/`, 300 px stickers) are byte-identical to the home version.
- 依赖改由 `package.json` 钉版本（sharp 0.35.5、jszip 3.10.1），`npm ci` 装出来的才和仓库里的图逐字节相同；全量导出的 zip 名跟着 `package.json` 的名字和版本走。
- `tools/outfit-sheet.cjs` 的原稿那一格改成可选（`--originals <目录>`）；`tools/batch-sheet.cjs` 拿掉了「参考格」那一列（参考图是别人画的，没搬出来）；新加 `tools/states-table.cjs`，从 manifest 出 `docs/states.md`。
- 贴纸只有 300 档进 git；408 / 618 两档和 `frames/`、`keyframes/`、`manifest.json` 这些大件一样，`npm run export` / `npm run stickers` 逐字节重出。
- 注释里接家里那几处页面的说法换成中性的「接入方」；家常的句子（她、捧心、被抓到熬夜……）都留着。

## 第一批 · Batch 1 (2026-10-15) — +8，共 48

她说要「好多好多」新动作，还点名举 ✅ ❌ 一定要。八支全住在 `states/<id>.cjs`，一支一个文件：`motion.cjs` 的 if 链、`engine.cjs` 按 id 的道具段、`check-art.cjs` 的老不变量一行没碰，老 40 支逐字节不变。
Eight new moves, each in its own file under `states/`; the 40 older moves stayed byte-identical.

- `surprised` 震惊愣住 · `hug-please` 求抱抱 · `confused` 歪头疑惑 · `heart-gift` 捧心比心 · `sweating` 尴尬流汗 · `laughing` 大笑（以上 emotion）
- `sign-yes` 举✅牌 · `sign-no` 举❌牌（sticker 组第一次有人用）
- **新的口子**：`states/` 插件（`pose` / `paint` / `palette` / `check` / `segments` / `stickerFrame`，只许画 paper / letter / props / lettering / effects 五层）、`state-check.cjs`（预览和整套检查同一份口径）、`--state <id> --preview`、表情包定帧 `stickerFrame`。
- **换装**：`outfits/` 两个槽位（帽子、衣服），她 10/13 画的四套照他的身板一格一格重画：飞行帽、贝雷帽、睡帽、风雪帽。`renderVariant(id, i, { outfit })` 才会穿上；不穿时什么都不变。`check-art.cjs --outfit <名字>` 把每一帧都穿上查一遍。
- **贴纸**：`--stickers` 给每一支量一个只装得下他的正方形，最近邻整数倍放大成 300 / 408 / 618 三档，外加 `stickers/stickers.json`。静图在循环里的，GIF 从静图那一帧起头，缩略图点开不跳。
- 两轮复审修的（挑要紧的）：求抱抱的两只手从帽子两边挪到贴着身子（原来 30 pt 下像帽子长了犄角）；风雪帽被抬起来时只掀圆顶、毛圈和护耳留在头上（原来脸窗顶上露一条黑带）；捧心的心挪到马甲上（原来像一张嘴）；举✅补了一个亮绿 `signGreen`；举❌的帽檐压到眼皮上，死鱼眼读得出来；举牌那一对让开睡帽的绒球；尴尬流汗的汗挂到帽檐上、按腮的手暗两档；歪头疑惑整个拿掉 `lean`，「歪」交给脚、身子、帽子三层一级一级错开 5。
- 她拍板的：求抱抱的贴纸只放「抱抱、抱抱」那一下（`sticker` 0–6）；伸懒腰、扶帽致意、蓄力高跳、轻轻蹦四支老动作补了表情包定帧，`static/` 照旧是首帧。
- 例外记在这里：大笑的静图是「闭眼」——那是两道往上挑的笑眼，还有泪、括号、捂肚子，一眼不是睡着，静图照用。

## v9 — +5，共 40

`lantern` 提灯 · `pointing` 指路 · `waving` 挥手 · `umbrella` 打伞 · `stretching` 伸懒腰，全在 core。老 35 支逐字节不变。
Five new moves; the 35 older ones stayed byte-identical.

- 伸懒腰是第一个**过渡动作**：manifest 里写 `handoff: { from: 'sleeping', to: 'idle' }`，首帧和睡着第 0 帧、末帧和待机第 0 帧逐像素相同。
- 挥手加了 `once` 段（0–40，第 40 帧和待机第 0 帧相同，`next: 'idle'`）。
- 指路多一个**不算进 48 支的变体**：`variants/clawd-pointing-west.*`，左手指、包和表链还在右腰——整张镜像会把包翻到左边，和别的动作摆在一屏时包会左右跳，这一版不会。
- 复审修的：打伞的伞面从 ink 换成 red、加宽到 105、抬高 15（原来 70 pt 下只剩一粒灰「T」）；指路补了一截小臂（原来手悬在身子外头）；提灯的光团跟着那口气走，不再 7.5 Hz 地闪边；`hatAside` 改成白名单。

## v8 — +8，共 35

`reading` 读信 · `stargazing` 看星星 · `phone` 打电话 · `painting` 画画（core）· `dizzy` 晕乎乎 · `blushing` 害羞脸红 · `teary` 委屈 · `pouting` 鼓脸（新开的 emotion 组）。
Eight new moves and a new `emotion` group.

- 引擎补的：眼睛可以逐只写（`['open','closed']`），多了半眼；`tool.orbit` 绕帽子转的金星、`tool.blush` 红脸、`tool.gloss` 泪光、`tool.tears` 泪、`tool.puff` 鼓腮。
- `segments` 第一次出现：打电话分「听」0–17、「说」21–35，读信的 `opened` 20–44（拆开信、看到心、蹦起来）。`check-art` 加分段接缝检查。
- 两轮复审修的：读信首帧像张着嘴（两行字隔开、手换 skinSide）；晕乎乎的三颗星叠成「‡」（纵半径改 15）；委屈的泪加大到 10×10；鼓腮放大到 10×15；看星星放下镜筒不再像吹喇叭；眨眼帧号互相错开。
- 没做的：跳舞——音符照抄听音乐，±10 踏步又和晕乎乎同一个节拍，70 pt 下分不开。

## v7 — 22 支逐帧重做，+5，共 27

三把尺从这一版开始：**主位移 ≥ 10 px、次位移 5 px、1–3 px 的量一律删**；每支至少一处一帧到位的大步；眨眼按帧号闭两帧、各支错开。
The three rules start here: main moves ≥ 10 px, secondary 5 px, nothing in 1–3 px; at least one single-frame big step per move; two-frame blinks, staggered.

- 老 22 支 id 和帧数不变，一支一支重做：待机一口气、开心两跳落地最扁、摇铃「大·小小·停·大」、看怀表首帧就是举表、搭建换成敲锤子、报错一帧吓飞帽子、打字九次敲键每个落键帧恰好一个字离地……
- 新 5 支：`hugged` 被抱起来 · `fishing` 陪钓 · `writing` 写信 · `yawning` 打哈欠 · `dice` 掷骰。
- 引擎：曲线带缓动（`s` / `l` / `i` / `o`）；帽子落后和包甩动改成按上一帧做差分自动算，帽子不许压眼、脚一沾地必须在头上；坐标最后一律取整；走跑改成「地在走」，脚底一条滚动虚线；手多了 `color`，帽子多了 `hatShift`。
- 深底配色：新色 `hatRim` 提亮帽顶和两头檐尖，调色板定在 19 色。
- 复审修的：落地那一帧帽子悬在头顶 7–10 px（新增像素级的「落地帧帽檐贴头」检查）；打字的字从四帧弹跳改成两帧，一个落键只有一个字离地；写信的墨点改成接得上的短划。
- 收拾：zip 条目盖固定日期，没改东西重打出来的包逐字节相同。

## v6 · 原型 — 22 支

最早的那一份：约 730 行，四个文件（`engine.cjs`、`motion.cjs`、`export.cjs`、`check-art.cjs`），22 支动作，300 × 300 画布、10 / 5 px 网格、基线 y 273、70 / 60 / 70 ms 的节奏、图层顺序、打字头顶那串像素字母表（v1.0.0 换掉了那个词），这些规格从这一版一直沿用到现在。老伦敦信差的样子是她定的：圆顶硬礼帽、怀表链、侧挎皮包；两只方块大手、四只方块脚、扁扁的身子是她亲手改出来的。
The first prototype: ~730 lines in four files, 22 moves, and the spec (canvas, grid, baseline, timing, layer order) that every later version kept. The London postie look, and the square hands, four square feet and flat little body, were Charlie's corrections.
