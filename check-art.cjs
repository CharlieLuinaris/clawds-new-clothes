// clawd-new-coat · check-art.cjs · art checks by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
const fs=require('node:fs');
const crypto=require('node:crypto');
const {STATES,render:renderPlain,ORDER}=require('./engine.cjs');
// 新动作（states/<id>.cjs）的白名单和体检：和 export.cjs --state <id> --preview 同一份口径；老动作 allowAt 一律给空，下面每一条对它们和原来一模一样
const {allowAt,checkFrame}=require('./state-check.cjs');
// 换装也能整套过一遍：node check-art.cjs --outfit beret——四十个动作每一帧都穿上这件再查。画衣服的人只看 --preview 那几帧，
// 打伞的伞面、伸懒腰的手、晕乎乎的星、收到信的信封压没压到帽子，那几帧根本碰不到；这里每一次 render（含朝西版、伸懒腰首末帧对照的睡着/待机）都穿上同一件。
// 穿衣服跑的时候只打印结果、按结果给退出码，不写 anatomy-check.json——那份是老伦敦 40 态的验收记录，不穿衣服跑出来的才算数
const outfitAt=process.argv.indexOf('--outfit'),OUTFIT=outfitAt>=0?process.argv[outfitAt+1]:null;
if(outfitAt>=0&&(!OUTFIT||OUTFIT.startsWith('--')))throw Error('node check-art.cjs --outfit <name>');
const outfitModule=OUTFIT?require(`./outfits/${OUTFIT}.cjs`):null,noBag=!!outfitModule?.hideBag;
const render=OUTFIT?(id,i,o={})=>renderPlain(id,i,{...o,outfit:OUTFIT}):renderPlain;
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const result={states:STATES.length,frames:0,strapPixelsOutsideClothing:0,coveredEyePixels:0,partialAlphaPixels:0,hatGapPixels:0,frontRunningTwoEyes:true,fishingOneEye:true,errorExclamationVariants:0,notificationLetterVariants:0,writingLetterVariants:0,diceInFirstFrame:true,typingOneLetterPerPress:true,readingLetterEveryFrame:true,readingPageVariants:0,stargazingClearOfEyeColumn:true,phonePropsAndEyes:true,paintingHeartGrows:true,eyeSpriteWhitelist:true,hatAsideWhitelist:true,dizzyThreeStarsTwoEyes:true,blushingCheeksShown:true,tearyTearsShown:true,poutingEyeAndPuff:true,lanternLit:true,pointingFinger:true,pointingWest:true,wavingAboveHat:true,umbrellaDryBody:true,stretchingHandoff:true,segments:[],failures:[],warnings:[],perState:[]};
let paintingRows=0;const letterHashes=new Set(),exclamationHashes=new Set(),writingHashes=new Set(),readingHashes=new Set();
const pluginReports=[];
for(const state of STATES){
 const pluginReport=state.plugin?{id:state.id,file:state.plugin.file,frames:state.frames,group:state.group,problems:[],gridWarnings:0}:null;
 const footprints=[],steps=[],coordsByFrame=[],pixelHashes=[];let previous=null,maxAdjacentMotion=0,first=null,last=null;
 for(let i=0;i<state.frames;i++){
  const r=render(state.id,i),{pixels,layers,meta}=r,allow=allowAt(state,i);
  const limbParts=meta.parts.filter(p=>p.tag.startsWith('hand-')||p.tag.startsWith('foot-'));
  if(limbParts.length!==6)result.failures.push(`${state.id}/${i}: limb count`);
  // 抬脚由 pose() 收尾 clamp 到 0–10 的整数，这里只断言这个契约（原来写 lift>10 是一条永远不会响的空检查）；
  // 脚有没有真被藏住，由 engine render() 末尾「每只脚至少 70 个皮肤像素可见」的像素级检查兜底
  if(meta.pose.feet.some(lift=>!Number.isInteger(lift)||lift<0||lift>10))result.failures.push(`${state.id}/${i}: foot lift outside the 0–10 integer contract`);
  for(let n=0;n<pixels.length;n+=4){
   if(pixels[n+3]!==0&&pixels[n+3]!==255)result.partialAlphaPixels++;
   if(layers.strap[n+3]&&!layers.costume[n+3])result.strapPixelsOutsideClothing++;
   if(layers.eyes[n+3]&&!allow.eyesCovered&&(pixels[n]!==layers.eyes[n]||pixels[n+1]!==layers.eyes[n+1]||pixels[n+2]!==layers.eyes[n+2]))result.coveredEyePixels++;
  }
  // 帽子不许离头：脚在地上（jump 0）、身子不倾、帽子没被姿势主动抬起的帧，身体顶上那一行（body.y−1）在身体中段必须是不透明的帽檐——
  // 像素级地数，不看 hatLag 的值：hatLag 一负这一行就是透明的缝（v7 第一版 happy/jumping/hopping/leaping/delighted 的落地帧、
  // juggling 全程、yawning 顶点都在这里露底）。报错吓飞那几帧 jump<0、扶帽致意 hatLift>0，不在此列
  // v9 起帽子还能躺在地上没扣回去（tool.hatAside，伸懒腰坐起来那一帧），这一帧头顶本来就空着，和睡姿一样不查
  if(!meta.pose.sleep&&!meta.pose.tool.hatAside&&meta.pose.jump===0&&meta.pose.lean===0&&!meta.pose.tool.hatLift&&!meta.pose.tool.hatTilt&&!allow.hatOffHead){
   const b=meta.body,y=Math.round(b.y)-1,x0=Math.round(b.x)+30,x1=Math.round(b.x)+Math.round(b.w)-30;
   for(let x=x0;x<x1;x++)if(pixels[(y*300+x)*4+3]===0)result.hatGapPixels++;
  }
  // 帽子躺在地上（tool.hatAside）的白名单：只许伸懒腰第 6 帧——上面帽檐贴头那条对 hatAside 的帧跳过，不钉死的话以后谁都能靠它躲掉那条检查
  if(meta.pose.tool.hatAside&&!(state.id==='stretching'&&i===6)&&!allow.hatAside)result.hatAsideWhitelist=false;
  // 眼睛的白名单：睁眼 10×20、半眼 10×10、闭眼 10×5，别的尺寸一律不许（v8 起眼睛能逐只写、多了半眼）
  // 新动作另多两样：小方点 dot 10×10（尺寸和半眼同一档）、星星眼 star 15×15——只许 states/ 里的新动作用
  if(meta.parts.some(q=>q.tag.startsWith('eye-')&&!(q.w===10&&[20,10,5].includes(q.h))&&!(state.plugin&&q.w===15&&q.h===15)))result.eyeSpriteWhitelist=false;
  // 新动作的体检（眼睛露着、脚底 273、首帧能当静图、帽子离头的白名单、它自己的 verify），每条问题带着帧号记进 failures
  if(pluginReport){const rep=checkFrame(state,i,r,{order:ORDER});pluginReport.problems.push(...rep.problems);pluginReport.gridWarnings+=rep.grid.length;}
  // v8 晕乎乎：每帧恰好三颗绕圈的星、每颗 125 个像素全露（十字 15×15）；两只眼每帧都在（一睁一闭也算两只）；帽檐贴头由上面的像素检查管
  if(state.id==='dizzy'){
   const stars=meta.parts.filter(q=>q.tag.startsWith('orbit-star-'));
   if(stars.length!==3||meta.eyeSprite.visible!==2)result.dizzyThreeStarsTwoEyes=false;
   // 任意两颗星的包围盒至少隔 5（贴住不算盖住，像素全露也会上下拼成一根「‡」，70pt 下三颗看成两颗）
   for(const a of stars)for(const b of stars)if(a!==b&&Math.max(a.x-b.x-15,b.x-a.x-15,a.y-b.y-15,b.y-a.y-15)<5)result.dizzyThreeStarsTwoEyes=false;
   for(const q of stars){let shown=0;const x0=q.x-5,y0=q.y;for(let y=y0;y<y0+15;y++)for(let x=x0;x<x0+15;x++){const n=(y*300+x)*4;if(pixels[n]===0xf7&&pixels[n+1]===0xd4&&pixels[n+2]===0x71&&pixels[n+3]===255)shown++;}if(shown!==125)result.dizzyThreeStarsTwoEyes=false;}
  }
  // v8 害羞脸红：两块红脸每帧 150 像素全露（merged 里是 red）；两只手每帧都是 skinSide
  if(state.id==='blushing'){
   const cheeks=meta.parts.filter(q=>q.tag.startsWith('cheek-'));
   if(cheeks.length!==2||meta.pose.hands.some(h=>h.color!=='skinSide'))result.blushingCheeksShown=false;
   for(const q of cheeks){let shown=0;for(let y=q.y;y<q.y+q.h;y++)for(let x=q.x;x<q.x+q.w;x++){const n=(y*300+x)*4;if(pixels[n]===0xbf&&pixels[n+1]===0x51&&pixels[n+2]===0x47)shown++;}if(shown!==150)result.blushingCheeksShown=false;}
  }
  // v8 委屈：每颗泪露出的 blue 至少 25 像素；首帧就挂着一滴
  if(state.id==='teary'){
   const tears=meta.parts.filter(q=>q.tag.startsWith('tear-'));
   if(i===0&&!tears.length)result.tearyTearsShown=false;
   for(const q of tears){let shown=0;for(let y=q.y;y<q.y+q.h;y++)for(let x=q.x;x<q.x+q.w;x++){const n=(y*300+x)*4;if(pixels[n]===0x49&&pixels[n+1]===0x87&&pixels[n+2]===0x9d)shown++;}if(shown<25)result.tearyTearsShown=false;}
  }
  // v8 鼓脸：每帧至少一只眼；鼓腮的帧身子那一行（body.y+25）恰好宽 140（腮 10×15，齐帽檐）
  if(state.id==='pouting'){
   if(meta.eyeSprite.visible<1)result.poutingEyeAndPuff=false;
   if(meta.pose.tool.puff){const y=meta.body.y+25;let w=0;for(let x=0;x<300;x++)if(layers.body[(y*300+x)*4+3])w++;if(w!==140)result.poutingEyeAndPuff=false;}
  }
  // v9 提灯：玻璃 15×20 每帧 300 个像素全露（玻璃 goldLight、中间的火苗 red/redLight，别的层一粒不许盖上来）；火苗每帧有、红色族至少 25；
  // 灯体每一块都在 x≥225（只往右晃，往左会压包角）、不越脚底线 273，光团不出画布；两只眼每帧都在
  if(state.id==='lantern'){
   const glass=meta.parts.find(q=>q.tag==='lantern-glass'),body=meta.parts.filter(q=>q.tag.startsWith('lantern-')&&q.tag!=='lantern-glow');
   const isColor=(n,c)=>pixels[n]===c[0]&&pixels[n+1]===c[1]&&pixels[n+2]===c[2]&&pixels[n+3]===255;
   const GL=[0xf7,0xd4,0x71],RED=[0xbf,0x51,0x47],RL=[0xe2,0x74,0x5f];
   let lit=0,flame=0;
   if(glass)for(let y=glass.y;y<glass.y+glass.h;y++)for(let x=glass.x;x<glass.x+glass.w;x++){const n=(y*300+x)*4;if(isColor(n,GL))lit++;else if(isColor(n,RED)||isColor(n,RL)){lit++;flame++;}}
   const glow=meta.parts.find(q=>q.tag==='lantern-glow');
   if(!glass||lit!==300||flame<25||body.some(q=>q.x<225||q.y+q.h>273)||!glow||glow.y+glow.h>273||meta.eyeSprite.visible!==2)result.lanternLit=false;
  }
  // v9 指路：食指每帧在、50 个皮肤像素全露；右手画面 x≥215（手永远伸在身子外头，收的那一下也是）；首帧帽子往指的那边挪 5、眼睛往右 5；两只眼每帧都在。
  // 复审后加小臂：每帧都在、皮肤像素全露，从身子右缘一直接到手左缘（不多不少），高 10，在帽檐底之下、包顶之上
  if(state.id==='pointing'){
   const skinShown=(px,q)=>{let shown=0;if(q)for(let y=q.y;y<q.y+q.h;y++)for(let x=q.x;x<q.x+q.w;x++){const n=(y*300+x)*4;if(px[n]===0xff&&px[n+1]===0x89&&px[n+2]===0x64&&px[n+3]===255)shown++;}return shown;};
   const armOK=(m,px,hand,west)=>{
    const arm=m.parts.find(q=>q.tag==='forearm'),bag=m.parts.find(q=>q.tag==='bag'),b=m.body,brimBottom=Math.round(b.y)-40+m.pose.hatLag+m.pose.hatDrop+40;
    // 小臂在包顶之上——摘了包的衣服（睡衣、冬衣写了 hideBag）没有包，这一截就只查帽檐底
    if(!arm||!hand||(!bag&&!noBag)||arm.h!==10||skinShown(px,arm)!==arm.w*arm.h||arm.y<brimBottom||(bag&&arm.y+arm.h>bag.y))return false;
    return west?arm.x===hand.x+20&&arm.x+arm.w===b.x:arm.x===b.x+b.w&&arm.x+arm.w===hand.x;
   };
   const finger=meta.parts.find(q=>q.tag==='finger'),hand=meta.parts.find(q=>q.tag==='hand-right');
   if(!finger||skinShown(pixels,finger)!==50||!hand||hand.x<215||!armOK(meta,pixels,hand,false)||meta.eyeSprite.visible!==2||(i===0&&(meta.pose.tool.hatShift!==5||meta.pose.gazeX!==5)))result.pointingFinger=false;
   // 朝西的左手版（variants/pointing-west，不算进 40 态）：同一帧号拿 {west:true} 再画一遍——四肢逐帧是东边的镜像（左手画面 x = 280 − 东边右手画面 x、y 相同），
   // 帽子挪的量和眼睛看的方向取反，包一个像素不挪（还在右腰）；食指 50、小臂全露、左手画面 x ≤ 65；两只眼在、一粒不被盖，落地帧帽檐贴头
   const w=render(state.id,i,{west:true}),wm=w.meta,wf=wm.parts.find(q=>q.tag==='finger'),wh=wm.parts.find(q=>q.tag==='hand-left');
   const bagE=meta.parts.find(q=>q.tag==='bag'),bagW=wm.parts.find(q=>q.tag==='bag');
   let covered=0,gap=0;
   for(let n=0;n<w.pixels.length;n+=4)if(w.layers.eyes[n+3]&&(w.pixels[n]!==w.layers.eyes[n]||w.pixels[n+1]!==w.layers.eyes[n+1]||w.pixels[n+2]!==w.layers.eyes[n+2]))covered++;
   {const b=wm.body,y=Math.round(b.y)-1;for(let x=Math.round(b.x)+30;x<Math.round(b.x)+Math.round(b.w)-30;x++)if(w.pixels[(y*300+x)*4+3]===0)gap++;}
   if(!wf||!wh||skinShown(w.pixels,wf)!==50||wf.x!==wh.x-10||wh.x>65||wh.x!==280-hand.x||wh.y!==hand.y||!armOK(wm,w.pixels,wh,true)||(noBag?bagW||bagE:!bagW||bagW.x!==bagE.x||bagW.y!==bagE.y)
    ||(wm.pose.tool.hatShift||0)!==-(meta.pose.tool.hatShift||0)||wm.pose.gazeX!==-meta.pose.gazeX||wm.eyeSprite.visible!==2||covered||gap||(i===0&&(wm.pose.tool.hatShift!==-5||wm.pose.gazeX!==-5)))result.pointingWest=false;
  }
  // v9 挥手：举着挥的帧（tool.wave）右手转过之后的最低点也在帽顶那一行之上（≤ body.y−40）——手永远在帽子上头，和扶帽致意那只手在帽檐上分得开；两只眼每帧都在
  if(state.id==='waving'){
   const hand=meta.parts.find(q=>q.tag==='hand-right');
   if(meta.eyeSprite.visible!==2||!hand||(meta.pose.tool.wave&&Math.max(...hand.polygon.map(pt=>pt[1]))>meta.body.y-40))result.wavingAboveHat=false;
  }
  // v9 打伞：伞面最宽那行（canopy）每帧在、至少一半露出；effects 层（雨和伞沿那一滴）一粒都不进身子那一块 x90–210×y208–273；
  // 左手攥着伞杆压在帽子左端、不压檐（画面 y+20 ≤ 200）；20–21 风掀，伞面比平常高 5、右 10，22 落回一半（右 5），其余帧伞面不动；两只眼每帧都在。
  // 复审后伞面换 red、宽 105、顶抬到 135：最宽那行平常在 (40,160)、20–21 在 (50,155)、22 在 (45,160)；
  // 伞面一粒不碰帽子——左手（画面 y180 起）以上的伞面、伞骨、杆和帽层一个像素都不许重叠；柄的弯钩在手底下压着帽檐，缩脖子那两帧帽子沉 10、
  // 弯钩压到帽带下沿，是设计，不在此列；雨和那一滴一粒都不落在伞上（effects 和 props 不重叠）
  if(state.id==='umbrella'){
   const canopy=meta.parts.find(q=>q.tag==='canopy'),left=meta.parts.find(q=>q.tag==='hand-left');let shown=0;
   if(canopy)for(let y=canopy.y;y<canopy.y+canopy.h;y++)for(let x=canopy.x;x<canopy.x+canopy.w;x++){const n=(y*300+x)*4;if(layers.props[n+3]&&pixels[n]===layers.props[n]&&pixels[n+1]===layers.props[n+1]&&pixels[n+2]===layers.props[n+2])shown++;}
   let wet=0;for(let y=208;y<273;y++)for(let x=90;x<210;x++)if(layers.effects[(y*300+x)*4+3])wet++;
   let touch=0;
   for(let y=0;y<300;y++)for(let x=0;x<300;x++){const n=(y*300+x)*4+3;if(layers.props[n]&&((y<180&&layers.hat[n])||layers.effects[n]))touch++;}
   const [ex,ey]=i===20||i===21?[50,155]:i===22?[45,160]:[40,160];
   if(!canopy||shown*2<canopy.w*canopy.h||wet||touch||!left||left.y+left.h>200||canopy.x!==ex||canopy.y!==ey||canopy.w!==105||meta.eyeSprite.visible!==2)result.umbrellaDryBody=false;
  }
  // v9 伸懒腰（睡着 → 待机的过渡，STATES 里登 handoff）：第 0 帧和 sleeping/0、第 44 帧和 idle/0 像素全等——这是给接入方的契约，
  // 从睡着切进来、放完切回待机都不跳；第 6 帧帽子还躺在地上（hatAside，帽檐贴头那条不查），7 起帽子都在头上（15–16 顶起来由 hatLift 跳过）；
  // 14–22 两手举过帽顶：手画出来的底边不低于帽顶那一行的下沿（帽顶 y+5），且一粒都不叠在帽顶那一行上——15–16 帽子顶起 10、手只再够 5，
  // 手底 151 和帽顶行 148–153 齐平，手在帽顶两边不压它（工单写的「手底 ≤ 帽顶」照字面这两帧过不了，量下来是并排不是压住）；
  // 两只手一帧都不进眼睛（手层和眼睛层一个像素都不重）；两只眼每帧都在
  if(state.id==='stretching'){
   const p=meta.pose,hands=meta.parts.filter(q=>q.tag.startsWith('hand-'));
   if(i===0&&!pixels.equals(render('sleeping',0).pixels))result.stretchingHandoff=false;
   if(i===state.frames-1&&!pixels.equals(render('idle',0).pixels))result.stretchingHandoff=false;
   if(!state.handoff||state.handoff.from!=='sleeping'||state.handoff.to!=='idle')result.stretchingHandoff=false;
   if((i===6)!==!!p.tool.hatAside||meta.eyeSprite.visible!==2)result.stretchingHandoff=false;
   if(i>=14&&i<=22){
    const top=Math.round(meta.body.y)-40+p.hatLag+p.hatDrop-Math.round(p.tool.hatLift||0);
    if(hands.some(q=>Math.max(...q.polygon.map(pt=>pt[1]))>top+5))result.stretchingHandoff=false;
    for(let y=top;y<top+5;y++)for(let x=0;x<300;x++){const n=(y*300+x)*4;if(layers.hat[n+3]&&(layers['hand-left'][n+3]||layers['hand-right'][n+3]))result.stretchingHandoff=false;}
   }
   for(let n=3;n<pixels.length;n+=4)if(layers.eyes[n]&&(layers['hand-left'][n]||layers['hand-right'][n]))result.stretchingHandoff=false;
  }
  if(state.id==='front-running'&&(meta.pose.side||meta.eyeSprite.visible!==2))result.frontRunningTwoEyes=false;
  if(state.id==='notification')letterHashes.add(digest(layers.letter));
  if(state.id==='error')exclamationHashes.add(digest(layers.effects));
  // v7 新动作的预期：陪钓是侧身单眼；写信的字一行行长出来（lettering 层至少 12 种）；掷骰首帧骰子必须在手里（props 层非空）
  if(state.id==='fishing'&&(!meta.pose.side||meta.eyeSprite.visible!==1))result.fishingOneEye=false;
  if(state.id==='writing')writingHashes.add(digest(layers.lettering));
  if(state.id==='dice'&&i===0&&!layers.props.some(v=>v))result.diceInFirstFrame=false;
  // v8 读信：每一帧手里都有信（letter 层非空）；第一页、第二页、翻页侧立条至少三种字面
  if(state.id==='reading'){if(!layers.letter.some(v=>v))result.readingLetterEveryFrame=false;readingHashes.add(digest(layers.lettering));}
  // v8 打电话：底座、杆、话筒杯、听筒四件每帧都在且至少露出一半；凑过去前倾 3 的那些帧两只眼整只在身体里（眼睛像素下面必须有身体）
  if(state.id==='phone'){
   for(const tag of ['phone-base','phone-stem','phone-mouthpiece','phone-receiver']){
    const q=meta.parts.find(part=>part.tag===tag);let shown=0;
    if(q)for(let y=q.y;y<q.y+q.h;y++)for(let x=q.x;x<q.x+q.w;x++){const n=(y*300+x)*4;if(layers.props[n+3]&&pixels[n]===layers.props[n]&&pixels[n+1]===layers.props[n+1]&&pixels[n+2]===layers.props[n+2])shown++;}
    if(!q||shown*2<q.w*q.h)result.phonePropsAndEyes=false;
   }
   for(let n=0;n<pixels.length;n+=4)if(layers.eyes[n+3]&&!layers.body[n+3])result.phonePropsAndEyes=false;
   if(meta.eyeSprite.visible!==2)result.phonePropsAndEyes=false;
  }
  // v8 画画：侧身单眼；笔一帧都不越过 x205 往左；20–37 心一行一行从 0 涨到 6（按 lettering 层里红色的像素行数算，5 行一格），只涨不退
  if(state.id==='painting'){
   const brush=meta.parts.find(part=>part.tag==='brush');
   if(!meta.pose.side||meta.eyeSprite.visible!==1||!brush||Math.min(...brush.polygon.map(pt=>pt[0]))<205)result.paintingHeartGrows=false;
   if(i>=20&&i<=37){
    let lines=0;for(let y=0;y<300;y++){for(let x=240;x<290;x++){const n=(y*300+x)*4;if(layers.lettering[n+3]&&layers.lettering[n]===0xbf){lines++;break;}}}
    const rows=lines/5;
    if(!Number.isInteger(rows)||rows<paintingRows||(i===20&&rows!==0)||(i===37&&rows!==6))result.paintingHeartGrows=false;
    paintingRows=rows;
   }
  }
  // v8 看星星：侧身单眼；望远镜（props）和右手一帧都不进侧眼那一列 x180–200（gazeX 0 时眼在 180–190、+5 时在 185–195）；首帧三颗星全亮
  if(state.id==='stargazing'){
   if(!meta.pose.side||meta.eyeSprite.visible!==1||(i===0&&!meta.pose.tool.stars.every(Boolean)))result.stargazingClearOfEyeColumn=false;
   for(let y=0;y<300;y++)for(let x=180;x<200;x++){const n=(y*300+x)*4;if(layers.props[n+3]||layers['hand-right'][n+3])result.stargazingClearOfEyeColumn=false;}
  }
  // 打字：首帧全部字母落在地上；每个落键帧恰好一个字离地、离地 9（原来这条预期躺在 v6 留下的 revision-check.json 里没人重算，现在每次跟着跑）
  if(state.id==='typing'&&meta.lettering){
   const off=meta.lettering.letters.filter(l=>l.jump>0);
   if(i===0&&off.length)result.typingOneLetterPerPress=false;
   if(meta.pose.tool.press.includes(i)&&(off.length!==1||off[0].jump!==9))result.typingOneLetterPerPress=false;
  }
  const coordinates=[meta.pose.dx,meta.pose.jump,meta.pose.squash,...meta.pose.hands.flatMap(h=>[h.x,h.y]),...meta.pose.feet];
  if(previous){const step=Math.max(...coordinates.map((v,n)=>Math.abs(v-previous[n])));steps.push(step);maxAdjacentMotion=Math.max(maxAdjacentMotion,step);}
  if(i===0)first=coordinates;
  coordsByFrame.push(coordinates);if(state.segments)pixelHashes.push(digest(pixels));
  previous=coordinates;last=coordinates;
  result.frames++;
 }
 // 分段（打电话听/说、读信 opened）：帧号在范围里；能循环的段，末帧接回段首肢体接缝必须为零（像素全不全等记下来给人看）
 for(const seg of state.segments||[]){
  const ok=Number.isInteger(seg.from)&&Number.isInteger(seg.to)&&seg.from>=0&&seg.to<state.frames&&seg.from<seg.to;
  const limbSeam=ok?Math.max(...coordsByFrame[seg.to].map((v,n)=>Math.abs(v-coordsByFrame[seg.from][n]))):null;
  const pixelIdentical=ok?pixelHashes[seg.to]===pixelHashes[seg.from]:null;
  // 段写了 next（挥手 once 放完接 idle）：段末帧必须和 next 的第 0 帧逐像素全等，切过去不跳
  const nextIdentical=seg.next?(ok&&STATES.some(s=>s.id===seg.next)&&pixelHashes[seg.to]===digest(render(seg.next,0).pixels)):undefined;
  result.segments.push({state:state.id,id:seg.id,from:seg.from,to:seg.to,loop:!!seg.loop,limbSeam,pixelIdentical,...(seg.next?{next:seg.next,nextIdentical}:{})});
  if(!ok||(seg.loop&&limbSeam!==0))result.failures.push(`${state.id}/${seg.id}: segment ${ok?'loop seam '+limbSeam:'out of range'}`);
  if(seg.next&&!nextIdentical)result.failures.push(`${state.id}/${seg.id}: segment end is not identical to ${seg.next}/0`);
 }
 const seam=Math.max(...last.map((v,n)=>Math.abs(v-first[n])));
 if(seam>maxAdjacentMotion+1)result.failures.push(`${state.id}: motion loop seam`);
 // 接缝和平常一步比：超过两倍只提醒不判死。设计内的一帧甩手在 STATES 里登记 seamStep（抛接左手每段 f=0 甩上 15），
 // 接缝不超过登记值就不提醒，warnings 才真的空；设计外的接缝照旧提醒
 const sorted=[...steps].sort((a,b)=>a-b),median=sorted.length?sorted[Math.floor(sorted.length/2)]:0;
 const seamRatio=median>0?+(seam/median).toFixed(2):0;
 const designedSeam=Number.isFinite(state.seamStep)&&seam<=state.seamStep;
 if(seamRatio>2&&!designedSeam)result.warnings.push(`${state.id}: loop seam ${seam.toFixed(1)} is ${seamRatio}x the median step ${median.toFixed(1)}`);
 result.perState.push({id:state.id,frames:state.frames,maxAdjacentMotion:+maxAdjacentMotion.toFixed(3),loopSeamMotion:+seam.toFixed(3),medianStep:+median.toFixed(3),seamRatio,...(designedSeam?{designedSeamStep:state.seamStep}:{})});
 if(pluginReport)pluginReports.push(pluginReport);
}
// 有新动作才多一个 plugins 键：states/ 里没有正式文件时 anatomy-check.json 和以前逐字节相同
if(pluginReports.length){
 result.plugins=pluginReports;
 for(const rep of pluginReports)for(const problem of rep.problems)result.failures.push(`${rep.id}: ${problem}`);
}
result.errorExclamationVariants=exclamationHashes.size;
result.notificationLetterVariants=letterHashes.size;
result.writingLetterVariants=writingHashes.size;
result.readingPageVariants=readingHashes.size;
if(result.strapPixelsOutsideClothing||result.coveredEyePixels||result.partialAlphaPixels||result.hatGapPixels||!result.frontRunningTwoEyes||!result.fishingOneEye||result.errorExclamationVariants<3||letterHashes.size!==1||result.writingLetterVariants<12||!result.diceInFirstFrame||!result.typingOneLetterPerPress||!result.readingLetterEveryFrame||!result.stargazingClearOfEyeColumn||!result.phonePropsAndEyes||!result.paintingHeartGrows||result.readingPageVariants<3||!result.eyeSpriteWhitelist||!result.hatAsideWhitelist||!result.dizzyThreeStarsTwoEyes||!result.blushingCheeksShown||!result.tearyTearsShown||!result.poutingEyeAndPuff||!result.lanternLit||!result.pointingFinger||!result.pointingWest||!result.wavingAboveHat||!result.umbrellaDryBody||!result.stretchingHandoff)result.failures.push('Visual invariant check failed');
if(!OUTFIT)fs.writeFileSync(`${__dirname}/anatomy-check.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...(OUTFIT?{outfit:OUTFIT}:{}),...result,perState:undefined}));
if(result.failures.length)process.exitCode=1;
