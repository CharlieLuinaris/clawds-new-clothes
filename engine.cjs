// clawd-new-coat · engine.cjs · renderer by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
const {STATES,pose,TAU}=require('./motion.cjs');
const W=300,H=300;
// 走跑的地面：脚底 273 之下一条滚动虚线，角色不动、地在走。接入方要在地图上自己画轨迹时，把它关掉重导。
const GROUND=true;
const palette={skin:'#ff8964',skinSide:'#ed7758',ink:'#262329',leather:'#694631',leatherLight:'#926044',leatherDark:'#422e27',gold:'#dbaa39',goldLight:'#f7d471',paper:'#edddba',paperEdge:'#c9b28d',white:'#fff7df',red:'#bf5147',redLight:'#e2745f',blue:'#49879d',green:'#709777',grey:'#94958d',earWhite:'#ffffff',earShade:'#ced5d7',hatRim:'#7a7386'};
const rgba=Object.fromEntries(Object.entries(palette).map(([k,h])=>[k,[...h.matchAll(/[\da-f]{2}/gi)].map(x=>parseInt(x[0],16)).concat(255)]));
// 眼睛三种画法：睁眼 10×20、半眼 10×10（只画下半截）、闭眼 10×5（贴在睁眼底部）；EYE_TOP 是从睁眼顶往下让出的行数
const EYE_H={open:20,half:10,closed:5},EYE_TOP={open:0,half:10,closed:15};
// 新动作（states/）多两种眼睛，老动作一帧都没用过，老的三行照旧：
// dot 小方点 10×10 画在睁眼那一格正中（+5 起）——吓到、愣住时眼睛缩小；比半眼高 5，70pt 下读成「圆了、小了」不是「眯了」；
// star 星星眼 15×15 的十字，goldLight 加 ink 5×5 的瞳仁，顶也在 +5：一只 10 宽的格子放不下 3×3 的十字，左眼往外让 5、右眼（侧身那只也是）往右多 5，
// 两只对着脸中线 150 左右对称。全金的十字落在皮肤色上只剩一团暖色，中间那一粒黑才让人认得出「这还是眼睛、在看哪儿」
EYE_H.dot=10;EYE_TOP.dot=5;EYE_H.star=15;EYE_TOP.star=5;
const EYE_W={open:10,half:10,closed:10,dot:10,star:15};
const eyeKind=(p,n)=>Array.isArray(p.eyes)?p.eyes[n]:p.eyes;
const ORDER=['paper','body','costume','strap','strap-chain','eyes','hat','bag','hand-left','hand-right','letter','wax-seal','props','feet-1','feet-2','feet-3','feet-4','lettering','effects'];
// 新动作的 paint() 只许画这五层：身子、衣服、眼睛、帽子、包、手、脚都由姿势驱动，换装才穿得上；自己画的东西只能是道具、特效、牌子、背后的光。
// paper 在最底（画在人后面，比如光团、背后的星）、letter 是信封那一层、props 在手之上脚之下、lettering 在脚之上（牌子上的字）、effects 在最上面
const PLUGIN_LAYERS=['paper','letter','props','lettering','effects'];
// 给新动作的点阵：老动作里现成的几样，加上她点名「一定想要」的举牌用的勾和叉。全按 unit 5 画（5px 细部格），
// 开心那颗大星老动作是 unit 4，新画的照 5 来；sparkle 是晕乎乎那种 15×15 的十字星，比老的 smallStar（13×13、错在 4 上）守格子
const SHAPES=Object.freeze({
 star:['00100','00100','11111','01110','11011'],
 sparkle:['010','111','010'],
 heart:['0110110','1111111','1111111','0111110','0011100','0001000'],
 miniHeart:['101','111','010'],
 z:['111','001','010','100','111'],
 check:['00011','00111','11110','11100','01000'],
 cross:['11011','01110','00100','01110','11011']
});
const PIXEL_LETTERS={
 U:['10001','10001','10001','10001','10001','10001','01110'],
 l:['00100','00100','00100','00100','00100','00100','00110'],
 t:['00100','00100','11111','00100','00100','00101','00010'],
 r:['00000','00000','10110','11001','10000','10000','10000'],
 a:['00000','00000','01110','00001','01111','10001','01111'],
 c:['00000','00000','01110','10001','10000','10001','01110'],
 o:['00000','00000','01110','10001','10001','10001','01110'],
 d:['00001','00001','01111','10001','10001','10001','01111'],
 e:['00000','00000','01110','10001','11111','10000','01110'],
 // 搬出来住那天添的六个：打字头顶那串字原来是另一个词，公开版换成中性的 typing...，还是九个字、5×7 的格子、同一套落键弹跳。
 // 带下伸的 y、p、g 照老的 5×7 点阵字那样把肚子往上提一格，不另开第八行——九个字的底边还是齐的
 y:['00000','00000','10001','10001','01111','00001','01110'],
 p:['00000','00000','11110','10001','11110','10000','10000'],
 i:['00100','00000','01100','00100','00100','00100','01110'],
 n:['00000','00000','10110','11001','10001','10001','10001'],
 g:['00000','00000','01111','10001','01111','00001','01110'],
 '.':['00000','00000','00000','00000','00000','01100','01100']
};
// 换装（她 10/13 夜里画的四套，10/15 定了照他的身板重画）：一套衣服是 outfits/<name>.cjs 里的一个模块，
// renderVariant(id, i, { outfit: 'beret' }) 才会穿上；不传 outfit 时下面这些一行都不跑，四十个老状态逐字节不变。
// 衣服自己带的颜色只进这一帧的色表，不进 palette——manifest 里的 palette 是老伦敦那 19 色，换装不能悄悄改它；
// 名字和老色撞了直接报错：撞了就等于给整个人换了皮肤色，这种事得画的人自己起个新名字说清楚
const OUTFIT_NAME=/^[a-z_][a-z0-9_-]*$/,COLOR_NAME=/^[a-z][A-Za-z0-9]*$/,HEX=/^#[0-9a-f]{6}$/i;
const outfitColors=new WeakMap();
function loadOutfit(o){
 let mod=o;
 if(typeof o==='string'){if(!OUTFIT_NAME.test(o))throw Error(`Outfit name must match ${OUTFIT_NAME}: ${o}`);mod=require(`./outfits/${o}.cjs`);}
 if(!mod||typeof mod!=='object')throw Error(`Outfit is not a module object: ${o}`);
 const label=mod.name||(typeof o==='string'?o:'(module)');
 if(!outfitColors.has(mod)){
  for(const k of ['hat','costume'])if(mod[k]!=null&&typeof mod[k]!=='function')throw Error(`outfit ${label}: ${k} must be a function`);
  const extra={};
  for(const [k,h] of Object.entries(mod.palette||{})){
   if(!COLOR_NAME.test(k))throw Error(`outfit ${label}: color name ${k} should be lowerCamelCase like the old palette`);
   if(k in palette)throw Error(`outfit ${label}: color ${k} collides with the base palette`);
   if(!HEX.test(h))throw Error(`outfit ${label}: color ${k} must be #rrggbb, got ${h}`);
   extra[k]=[...h.matchAll(/[\da-f]{2}/gi)].map(x=>parseInt(x[0],16)).concat(255);
  }
  outfitColors.set(mod,{...rgba,...extra});
 }
 return {mod,name:label,colors:outfitColors.get(mod)};
}
function makePainter(colors=rgba){
 const layers=Object.fromEntries(ORDER.map(n=>[n,Buffer.alloc(W*H*4)])),primitives=[];
 function rect(layer,x,y,w,h,color='ink',transform=null,tag=null){
  const b=layers[layer],col=colors[color];
  if(!b||!col)throw Error(`Unknown layer or color: ${layer} ${color}`);
  let pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  if(transform){const {cx=0,cy=0,a=0,tx=0,ty=0}=transform,c=Math.cos(a*Math.PI/180),s=Math.sin(a*Math.PI/180);pts=pts.map(([px,py])=>[(px-cx)*c-(py-cy)*s+cx+tx,(px-cx)*s+(py-cy)*c+cy+ty]);}
  if(tag)primitives.push({tag,layer,x,y,w,h,transform,polygon:pts.map(p=>p.map(v=>Math.round(v*100)/100))});
  const x0=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[0])))),x1=Math.min(W,Math.ceil(Math.max(...pts.map(p=>p[0]))));
  const y0=Math.max(0,Math.floor(Math.min(...pts.map(p=>p[1])))),y1=Math.min(H,Math.ceil(Math.max(...pts.map(p=>p[1]))));
  for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++){
   let inside=true;for(let i=0;i<4;i++){const A=pts[i],B=pts[(i+1)%4];if((B[0]-A[0])*(yy+.5-A[1])-(B[1]-A[1])*(xx+.5-A[0])<0){inside=false;break;}}
   if(inside){const n=(yy*W+xx)*4;b[n]=col[0];b[n+1]=col[1];b[n+2]=col[2];b[n+3]=255;}
  }
 }
 function pattern(layer,rows,x,y,color,unit=5,transform=null){rows.forEach((r,j)=>[...r].forEach((v,i)=>{if(v==='1')rect(layer,x+i*unit,y+j*unit,unit,unit,color,transform)}));}
 // 只记一个部件框、不画像素：星星眼是两条拼起来的十字、新动作的点阵是一格一格画的，检查要的却是它整个的外框
 function mark(tag,layer,x,y,w,h,transform=null){
  let pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
  if(transform){const {cx=0,cy=0,a=0,tx=0,ty=0}=transform,c=Math.cos(a*Math.PI/180),s=Math.sin(a*Math.PI/180);pts=pts.map(([px,py])=>[(px-cx)*c-(py-cy)*s+cx+tx,(px-cx)*s+(py-cy)*c+cy+ty]);}
  primitives.push({tag,layer,x,y,w,h,transform,polygon:pts.map(p=>p.map(v=>Math.round(v*100)/100))});
 }
 function merge(){const out=Buffer.alloc(W*H*4);for(const name of ORDER){const b=layers[name];for(let i=0;i<b.length;i+=4)if(b[i+3]){out[i]=b[i];out[i+1]=b[i+1];out[i+2]=b[i+2];out[i+3]=255;}}return out;}
 function clipLayer(name,maskName){const layer=layers[name],mask=layers[maskName];for(let i=0;i<layer.length;i+=4)if(layer[i+3]&&!mask[i+3])layer.fill(0,i,i+4);}
 return {layers,primitives,rect,pattern,mark,merge,clipLayer};
}
// 新动作自己的补色（states/<id>.cjs 的 palette）：规矩和换装一样——小驼峰英文、#rrggbb、不许和老伦敦那 19 色重名；
// 只进这一支这一帧的色表，不进 manifest 的 palette。穿着衣服画新动作时，衣服的补色和动作的补色撞了名也直接报错，不悄悄谁盖谁
const stateColorCache=new Map();
function pluginColors(state){
 const {mod,file}=state.plugin;
 if(!stateColorCache.has(mod)){
  const extra={};
  for(const [k,h] of Object.entries(mod.palette||{})){
   if(!COLOR_NAME.test(k))throw Error(`${file||state.id}：palette 的名字 ${k} 要像老调色板那样小驼峰（比如 signGreen）`);
   if(k in palette)throw Error(`${file||state.id}：palette 的 ${k} 和老伦敦 19 色重名了，起个新名字`);
   if(typeof h!=='string'||!HEX.test(h))throw Error(`${file||state.id}：palette 的 ${k} 要写成 #rrggbb，拿到 ${h}`);
   extra[k]=[...h.matchAll(/[\da-f]{2}/gi)].map(x=>parseInt(x[0],16)).concat(255);
  }
  stateColorCache.set(mod,extra);
 }
 return stateColorCache.get(mod);
}
function colorsFor(state,outfit){
 const base=outfit?outfit.colors:rgba;
 if(!state.plugin)return base;
 const extra=pluginColors(state);
 if(!Object.keys(extra).length)return base;
 const clash=Object.keys(extra).filter(k=>k in base);
 if(clash.length)throw Error(`${state.plugin.file||state.id}：palette 的 ${clash.join(' / ')} 和衣服 ${outfit?.name} 的补色重名了`);
 return {...base,...extra};
}
// 正式登记的新动作，启动时就把补色查一遍：名字起错了在 require 的那一刻就说，不等画到第几帧
for(const s of STATES)if(s.plugin)pluginColors(s);
function render(id,index,override={}){
 const state=STATES.find(s=>s.id===id);if(!state||index<0||index>=state.frames)throw Error('Unknown state/frame');
 // override.west 要在收尾差分之前就给姿势（指路朝西的左手版），别的 override 照旧盖在收尾之后
 // outfit 不进姿势：它是穿在身上的东西，不是一个动作参数，poses.json 里的 pose 不该多出一个键
 const {outfit:outfitOption,...poseOverride}=override,outfit=outfitOption?loadOutfit(outfitOption):null;
 const p=pose(id,index,override.west?{west:true}:{});Object.assign(p,poseOverride);let lettering=null;
 const colors=colorsFor(state,outfit),paint=makePainter(colors),{rect:r,pattern:pat}=paint;let pluginRects=null;
 // 给衣服看的姿势是一份拷贝：画衣服的人手滑改了 p.hands，也不会把后面画的手挪走
 const poseView=outfit?structuredClone(p):null;
 const bottom=263+p.jump,body={x:90+p.dx,y:bottom-55+p.squash,w:120,h:55-p.squash};
 if(p.sleep)Object.assign(body,{x:95,y:221+p.squash,w:110,h:42-p.squash});
 const bt={cx:150+p.dx,cy:bottom,a:p.lean};
 const br=(layer,x,y,w,h,c,tag)=>r(layer,x,y,w,h,c,bt,tag);
 const star=(x,y,u=4)=>pat('effects',['00100','00100','11111','01110','11011'],x,y,'goldLight',u);
 const smallStar=(x,y)=>{r('effects',x+4,y,5,13,'gold');r('effects',x,y+4,13,5,'gold');};
 function envelope(x,y,w=44,h=30){
  r('letter',x,y,w,h,'paperEdge',null,'envelope');r('letter',x+2,y+2,w-4,h-4,'white');
  for(let j=0;j<5;j++){r('letter',x+3+j*4,y+4+j*2,4,2,'paperEdge');r('letter',x+w-7-j*4,y+4+j*2,4,2,'paperEdge');}
 }
 function hat(x,y,scale=1,angle=0){
  const tr={cx:x+70*scale,cy:y+40*scale,a:angle};
  r('hat',x+45*scale,y,50*scale,5*scale,'ink',tr);
  r('hat',x+35*scale,y+5*scale,70*scale,5*scale,'ink',tr);
  r('hat',x+25*scale,y+10*scale,90*scale,5*scale,'ink',tr);
  r('hat',x+20*scale,y+15*scale,100*scale,10*scale,'ink',tr);
  r('hat',x+15*scale,y+25*scale,110*scale,8*scale,'leatherLight',tr);
  r('hat',x+105*scale,y+25*scale,20*scale,8*scale,'leatherDark',tr);
  r('hat',x,y+33*scale,140*scale,7*scale,'ink',tr);
  // 深底上帽子要看得见轮廓：帽顶整行与两头檐尖用 hatRim 提亮（檐尖成对才是「檐边高光」，只亮左边缩到 70 像粘了个脏像素）
  r('hat',x+45*scale,y,50*scale,5*scale,'hatRim',tr);
  r('hat',x,y+33*scale,10*scale,7*scale,'hatRim',tr);
  r('hat',x+130*scale,y+33*scale,10*scale,7*scale,'hatRim',tr);
 }
 // 戴哪顶帽子：衣服带了帽子就让它画，没带就是礼帽。两处调用（头上那次、躺在地上那次）都从这里过，
 // 所以换了帽子照样落后一拍（hatLag）、沉一下（hatDrop）、跟着歪（hatTilt / lean）、被抱起来横挪（hatShift）、睡着时躺在 (216,253) 半大——
 // 这些都已经算进了 x、y、scale、angle，衣服的帽子只要在礼帽那个 140×40 的框里画就全继承下来。
 // ctx.rect / ctx.pattern 收的是框里的坐标（左上角 0,0，檐底那一行是 y 40，往上画 y 可以是负的），引擎替它乘 scale、套同一个 transform、画进 hat 层
 function putOnHat(x,y,scale=1,angle=0){
  if(!outfit?.mod.hat){hat(x,y,scale,angle);return;}
  const transform={cx:x+70*scale,cy:y+40*scale,a:angle};
  const box=(lx,ly,w,h,color,tag)=>r('hat',x+lx*scale,y+ly*scale,w*scale,h*scale,color,transform,tag?`outfit-${tag}`:null);
  outfit.mod.hat({
   rect:(lx,ly,w,h,color='ink',tag=null)=>box(lx,ly,w,h,color,tag),
   pattern:(rows,lx,ly,color='ink',unit=5)=>rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')box(lx+i*unit,ly+j*unit,unit,unit,color);})),
   transform,x,y,scale,angle,
   aside:!!(p.sleep||p.tool.hatAside),sleep:!!p.sleep,side:!!p.side,onHead:{...onHead},
   body:{...body},p:poseView
  },x,y,scale,angle);
 }
 // 待机的地面干干净净；侧身走跑才有地：窗口 x 70–230、y 274–277，paperEdge 虚线每帧向后滚 speed px，
 // 45·speed 是 period 的整倍所以循环不漏缝。虚线长取 period 的一半（period 10 画 5、period 20 画 10）。
 if(GROUND&&p.side&&p.tool.ground){
  const {speed,period}=p.tool.ground,dash=Math.min(10,period/2),off=(index*speed)%period;
  for(let x=70-off;x<230;x+=period){const x0=Math.max(70,x),x1=Math.min(230,x+dash);if(x1>x0)r('paper',x0,274,x1-x0,3,'paperEdge');}
 }
 // 躺着的身子底下垫一条纸：认睡姿不认 id（伸懒腰开头那几帧也躺着）
 if(p.sleep){
  r('paper',91,277,119,3,'paper');
 }
 br('body',body.x,body.y,body.w,body.h,'skin','body');
 // 鼓腮（鼓脸）：身子左右各鼓出一块 skin 10×15，贴在 body.x−10 与 body.x+120，y 从 body.y+15 到 +30——那一行宽 140，正好等于帽宽、檐尖齐平；
 // 原来是 5×10，最近邻缩到 70 每边只多 1 列，鼓脸的招牌在 70pt 真实大小下等于没有，现在每边 2 列 3 行
 if(p.tool.puff){br('body',body.x-10,body.y+15,10,15,'skin','puff-1');br('body',body.x+body.w,body.y+15,10,15,'skin','puff-2');}
 if(p.side)br('body',body.x,body.y,20,body.h,'skinSide');
 const vestHeight=p.sleep?15:20;
 const waistcoat=()=>{
  br('costume',body.x,bottom-vestHeight,body.w,vestHeight,'leatherLight','waistcoat');
  br('costume',body.x,bottom-vestHeight,10,5,'leatherDark');br('costume',body.x+body.w-10,bottom-vestHeight,10,5,'leatherDark');
 };
 // The eye sprites are not scaled by the body squash/stretch.
 const eyeAnchors=p.sleep?[body.x+25,body.x+75]:p.side?[body.x+90]:[body.x+25,body.x+85];
 // 衣服带了 costume 就让它决定马甲留不留（ctx.waistcoat() 原样画一件）、要不要画兜帽和围脖——
 // 都画在 costume 层，eyes 层在它上面，贴着脸画也盖不住眼睛；坐标是画布上的绝对坐标，套身子同一个 transform（lean 时跟着歪）。
 // ctx.eyes 是这一帧睁眼那一格 10×20 的位置（闭眼、半眼也按睁眼算），给兜帽留脸窗用
 if(outfit?.mod.costume){
  const info={body:{...body},bottom,vestHeight,p:poseView};
  outfit.mod.costume({
   rect:(x,y,w,h,color='ink',tag=null)=>br('costume',x,y,w,h,color,tag?`outfit-${tag}`:null),
   pattern:(rows,x,y,color='ink',unit=5)=>pat('costume',rows,x,y,color,unit,bt),
   waistcoat,transform:bt,...info,side:!!p.side,sleep:!!p.sleep,
   eyes:eyeAnchors.map(ax=>({x:Math.round(ax+p.gazeX),y:Math.round(body.y+(p.sleep?11:5)+p.gazeY),w:10,h:20}))
  },info);
 }
 else waistcoat();
 // 眼睛可以逐只写：p.eyes 是字符串时几只一样，是数组时按 [左,右] 各算各的（晕乎乎一睁一闭）；
 // 'half' 是只画下半截的 10×10（鼓脸斜瞟），闭眼仍是贴在睁眼底部的 10×5
 for(let n=0;n<eyeAnchors.length;n++){
  const kind=eyeKind(p,n);if(kind==='hidden')continue;
  const ey=body.y+(p.sleep?11:5)+p.gazeY,ex=eyeAnchors[n]+p.gazeX;
  if(kind==='star'){
   // 星星眼：十字 15×15（横条 15×5、竖条 5×15）goldLight，正中 5×5 ink；外框记成 eye-n，和别的眼睛一样被数、被查遮挡
   const sx=Math.round(ex)+(n===0&&!p.side?-5:0),sy=Math.round(ey+(p.sleep?0:EYE_TOP.star));
   r('eyes',sx,sy+5,15,5,'goldLight');r('eyes',sx+5,sy,5,15,'goldLight');r('eyes',sx+5,sy+5,5,5,'ink');
   paint.mark(`eye-${n+1}`,'eyes',sx,sy,15,15);
  }
  else r('eyes',Math.round(ex),Math.round(ey+(p.sleep?0:EYE_TOP[kind])),10,EYE_H[kind],'ink',null,`eye-${n+1}`);
  // 泪光（委屈）：睁着的眼右上叠一块 white 5×5，同在 eyes 层（tag gloss-n）
  if(p.tool.gloss&&kind==='open')r('eyes',Math.round(ex)+5,Math.round(ey),5,5,'white',null,`gloss-${n+1}`);
 }
 // 戴在头上那一顶的框：每一帧都先算出来，帽子躺在地上的帧也算——睡帽这种睡着也不摘的衣服要知道「头上那一顶」在哪，
 // 原来它只能把这条式子抄一份进自己的文件，引擎这里一改那边就悄悄对不上；现在跟着 ctx.onHead 递过去。算式和原来逐字一样，礼帽照旧用它
 // hatTilt 转帽子时为了不压眼会连带把帽子抬起（|tilt|×1.3），檐下必然开缝；只想要「帽子歪了」用 hatShift 整顶横挪（被抱起来用 10），檐留在头上
 const hatTilt=p.tool.hatTilt||0,hatLift=Math.max(p.tool.hatLift||0,Math.abs(hatTilt)*1.3);
 const onHead={x:body.x-10+(p.tool.hatShift||0),y:body.y-40+p.hatLag+p.hatDrop-Math.round(hatLift),angle:p.lean*.7+hatTilt};
 // 帽子躺在地上：睡着时、以及刚坐起来还没扣回去的那一帧（tool.hatAside，伸懒腰第 6 帧）都在 (216,253) 半大
 if(p.sleep||p.tool.hatAside){putOnHat(216,253,0.5,0);}
 else putOnHat(onHead.x,onHead.y,1,onHead.angle);
 // The complete leather strap belongs inside the waistcoat silhouette.
 // It has its own layer, clipped to the transformed clothing in every frame.
 let bagx=(p.side?body.x+6:body.x+99)+p.bag.x,bagy=bottom-25+p.bag.y;
 if(p.sleep){bagx=132;bagy=244+p.bag.y;}
 const bagWidth=p.sleep?35:35,bagHeight=p.sleep?26:30;
 const bagtr={cx:bagx+bagWidth/2,cy:bagy,a:p.bag.a};
 const vestTop=bottom-vestHeight;
 function strapSegment(ax,ay,bx,by){const count=Math.max(Math.abs(bx-ax),Math.abs(by-ay),1);for(let k=0;k<=count;k+=2){const t=k/count;br('strap',ax+(bx-ax)*t,ay+(by-ay)*t,6,6,'leatherDark');}}
 // 换了衣服皮包和肩带照背：他是信差，包不离身。只有衣服自己写了 hideBag（比如睡衣）才连包带肩带一起摘；
 // 表链和怀表是马甲上的东西，外头套了大衣、衣服写 hideWatch 才摘——包和背带的位置一个像素不挪，blush 照旧按 bagy 算
 const showBag=!outfit?.mod.hideBag,showWatch=!outfit?.mod.hideWatch;
 if(!p.sleep){
  if(showBag){
   if(p.side){strapSegment(body.x+8,vestTop+2,body.x+12,bottom-9);}
   else {
    strapSegment(body.x+3,vestTop+2,body.x+46,vestTop+6);
    strapSegment(body.x+46,vestTop+6,body.x+96,vestTop+11);
    strapSegment(body.x+96,vestTop+11,bagx+17,Math.max(vestTop+3,bagy+10));
   }
  }
  if(showWatch){
   for(const [x,y] of [[15,46],[21,51],[28,54],[36,55],[44,53],[50,49]])br('strap-chain',body.x+x,bottom-60+y,6,4,'gold');
   if(!p.tool.watch){br('strap-chain',body.x+62,bottom-20,5,6,'gold');br('strap-chain',body.x+58,bottom-15,15,13,'gold');br('strap-chain',body.x+62,bottom-12,7,7,'goldLight');}
  }
 }
 paint.clipLayer('strap','costume');
 if(showBag){
  r('bag',bagx,bagy,bagWidth,bagHeight,'leatherDark',bagtr,'bag');r('bag',bagx+4,bagy+4,bagWidth-8,bagHeight-5,'leather',bagtr);
  r('bag',bagx,bagy,bagWidth,9,'paperEdge',bagtr);r('bag',bagx+13,bagy+12,10,10,'gold',bagtr);r('bag',bagx+16,bagy+15,4,4,'leatherDark',bagtr);
 }
 // 红脸（害羞脸红）：两块 red 15×10 贴在两眼外侧，画在 eyes 层——被手或包盖住 coveredEyePixels 会报出来；
 // 身子压 10 时红脸会掉进包里，所以顶多压到包顶上 10
 if(p.tool.blush){const y=Math.min(body.y+15,bagy-10);r('eyes',body.x+5,y,15,10,'red',null,'cheek-1');r('eyes',body.x+100,y,15,10,'red',null,'cheek-2');}
 for(let n=0;n<2;n++){
  const hand=p.hands[n],name=n?'hand-right':'hand-left';
  if(p.sleep){hand.x=n?167:112;hand.y=244+Math.round(p.squash*.6);}
  // 手叠在身子上时和皮肤一个色会看不见，姿势可以给 color:'skinSide' 当阴影（打哈欠捂嘴那只）
  r(name,hand.x,hand.y,20,20,hand.color||'skin',{cx:hand.x+10,cy:hand.y+10,a:hand.a},name);
 }
 // Feet are their own four identical sprites and render in front of bags/props.
 const footXs=p.sleep?[112,134,164,186]:[105+p.dx,135+p.dx,165+p.dx,195+p.dx];
 for(let n=0;n<4;n++)r(`feet-${n+1}`,footXs[n]+(p.footOffsets?.[n]||0),263+p.jump-p.feet[n],10,10,'skin',null,`foot-${n+1}`);
 // 冲刺的速度线：身后两道灰线，只在脚离地最开的那几帧亮；画在最底的 paper 层，左手甩到身后时盖住线，不像手上贴了块灰胶带
 if(p.tool.speed){br('paper',body.x-20,body.y+15,15,5,'grey');br('paper',body.x-20,body.y+30,15,5,'grey');}
 if(id==='typing'){
  // 纸在两眼之间（x 126–174），回车那几帧往上走 5；每个字在自己那次敲键后只弹两帧 9/6——
  // 快打那串落键隔 2 帧，弹四帧的话每个落键帧都有两个字离地（上一个还在 6），150 下是一串波浪不是一下一个字
  const paperY=236+p.tool.paper;
  r('props',126,paperY,48,18,'paper');
  r('props',86,249,128,12,'grey');r('props',91,246,118,7,'grey');
  for(let j=0;j<9;j++)r('props',96+j*12,254,6,4,'ink');
  const word='typing...',colors=['redLight','gold','green','blue','gold','redLight','green','blue','gold'];
  lettering={text:word,unit:3,letters:[]};
  [...word].forEach((char,i)=>{
   const k=index-p.tool.press[i];
   const jump=k>=0&&k<=1?[9,6][k]:0;
   const x=70+i*18,y=120-jump;
   pat('lettering',PIXEL_LETTERS[char],x,y,colors[i],3);
   lettering.letters.push({char,x,y,width:15,height:21,jump});
  });
 }
 if(id==='thinking'){
  const h=p.hands[1],x=h.x-6,y=h.y-18,tr={cx:h.x+10,cy:h.y+10,a:h.a};
  r('props',x+11,y-5,10,5,'gold',tr);r('props',x+5,y,24,34,'gold',tr);r('props',x,y+5,34,24,'gold',tr);
  r('props',x+6,y+6,22,22,'white',tr);r('props',x+15,y+9,4,12,'ink',tr);r('props',x+15,y+17,10,4,'ink',tr);
 }
 if(id==='happy'){
  // 小星星在空中那几帧往上蹦一格，大星按帧号亮
  const up=p.jump<-20?-10:0;smallStar(66,170+up);smallStar(221,180+up);
  if(p.tool.star)star(214,125,3);
 }
 if(id==='notification'){
  const h=p.hands[1],x=h.x+1,y=h.y-22,tr={cx:h.x+10,cy:h.y+10,a:p.tool.bellAngle};
  r('props',x+10,y,7,15,'leather',tr);r('props',x+4,y+13,19,13,'gold',tr);r('props',x,y+22,27,8,'gold',tr);
  r('props',x+7,y+15,7,12,'goldLight',tr);r('props',x+10-3*p.tool.swing,y+30,7,5,'gold',tr);
  if(p.tool.ring>.55){r('effects',h.x-8,y+12,5,20,'goldLight');r('effects',h.x+33,y+12,5,20,'goldLight');}
  envelope(42,189,44,30);
  // 蜡封的裂纹是 3×3 的块（给 150 看的）：第 20/38/68 帧各添一道，首帧干净
  pat('wax-seal',['0110','1111','1111','0110'],58,203,'red',3);
  r('wax-seal',61,205,3,2,'redLight');
  const cracks=[[64,206],[61,209],[67,209]];
  for(let k=0;k<p.tool.crack;k++)r('wax-seal',cracks[k][0],cracks[k][1],3,3,'leatherDark');
 }
 // Z 认 tool.zAges 不认 id：睡着之外，伸懒腰开头和睡着逐像素全等的那几帧也冒 Z
 if(p.tool.zAges){
  // Z 三段寿命：0–4 帧 unit 3 在 (195,196)，5–9 帧 unit 4 在 (203,184)，10–14 帧 unit 5 在 (211,170)
  const Z=['111','001','010','100','111'],stages=[[3,195,196],[4,203,184],[5,211,170]];
  for(const age of p.tool.zAges){const [u,x,y]=stages[Math.floor(age/5)];pat('effects',Z,x,y,'grey',u);}
 }
 if(id==='building'){
  // 右侧一块木板（顶边 paperEdge、两根钉子），锤子绕右手心转：a=90 时锤头落在 x263–273，正压板上沿
  const h=p.hands[1],tr={cx:h.x+10,cy:h.y+10,a:p.tool.hammer};
  r('props',240,243,50,20,'leatherLight');r('props',240,243,50,5,'paperEdge');r('props',250,237,3,8,'grey');r('props',268,237,3,8,'grey');
  r('props',h.x+8,h.y-30,5,30,'leatherLight',tr);r('props',h.x+1,h.y-38,19,10,'grey',tr);
  if(p.tool.spark)smallStar(265,212);
 }
 if(id==='juggling')for(const [n,ball]of p.tool.balls.entries()){
  const bx=Math.round(ball.x),by=Math.round(ball.y);
  r('props',bx,by,15,15,ball.color);r('props',bx+3,by+3,5,5,'white');
 }
 if(id==='sweeping'){
  const h=p.hands[1],x=h.x+8,y=h.y-40,tr={cx:h.x+10,cy:h.y+10,a:p.tool.broomAngle};
  r('props',x,y,5,85,'leatherLight',tr);r('props',x-12,y+70,29,18,'gold',tr);
  for(let j=0;j<4;j++)r('props',x-10+j*7,y+83,3,9,'leather',tr);
  // 推完那三帧：三粒 5×5 的灰尘从扫把前头往右飞 10
  if(p.tool.dust>=0)for(const [dx,dy] of [[238,281],[248,286],[258,280]])r('effects',dx+p.tool.dust,dy,5,5,'paperEdge');
 }
 if(id==='carrying'){
  // 箱子几何不动，配色改浅：外框 leatherLight、箱体 paper，深底上才看得出是个箱子
  const y=Math.max(body.y+28,238+p.tool.caseY);r('props',81,y,138,30,'leatherLight');r('props',86,y+5,128,24,'paper');
  r('props',128,y-5,43,9,'leatherDark');r('props',135,y-3,29,4,'leatherLight');
  r('props',108,y+1,6,28,'leatherLight');r('props',188,y+1,6,28,'leatherLight');r('props',147,y+13,8,10,'gold');
 }
 if(id==='error'){
  const exclaim=p.tool.exclaim||{},x=146+(exclaim.dx||0),y=108+(exclaim.dy||0);
  const tr={cx:x+5,cy:y+19,a:exclaim.a||0},stem=exclaim.stretch||22;
  r('effects',x,y,10,stem,'red',tr,'exclamation-stem');
  r('effects',x,y+stem+8,10,8,'red',tr,'exclamation-dot');
 }
 // 心：爱心小跳给数（.12→1，随数长大上飘带小星，原样不动）；读信给一个落点 {x,y}，只画同一颗心和高光
 if(typeof p.tool.heart==='number'&&p.tool.heart>.02){
  // 心放大到 unit 4，按 5px 一格往上飘
  const h=p.tool.heart,x=233,y=body.y-33-Math.round(h*19/5)*5;
  pat('effects',['0110110','1111111','1111111','0111110','0011100','0001000'],x,y,'red',4);
  r('effects',x+4,y+4,4,4,'redLight');
  if(h>.55)smallStar(66,body.y-22-Math.round(h*8/5)*5);
 } else if(p.tool.heart&&typeof p.tool.heart==='object'){
  const {x,y}=p.tool.heart;
  pat('effects',['0110110','1111111','1111111','0111110','0011100','0001000'],x,y,'red',4);
  r('effects',x+4,y+4,4,4,'redLight');
 }
 if(id==='listening'){
  // 有线耳机加粗：耳塞 15×14、耳线 5px（earShade 5 里套 earWhite 3），耳线不再晃
  const y=body.y+10;
  function wire(points){for(let k=1;k<points.length;k++){const [ax,ay]=points[k-1],[bx,by]=points[k],steps=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let j=0;j<=steps;j++){const f=j/steps,px=Math.round(ax+(bx-ax)*f),py=Math.round(ay+(by-ay)*f);br('props',px,py,5,5,'earShade');br('props',px+1,py+1,3,3,'earWhite');}}}
  wire([[86,y+24],[86,y+32],[115,y+39],[150,y+39],[188,y+35]]);
  wire([[210,y+24],[207,y+32],[183,y+38],[150,y+39]]);
  for(const x of [79,206]){
   br('props',x,y+3,15,14,'earShade');br('props',x+3,y,10,15,'earWhite');
   br('props',x+5,y+12,5,18,'earShade');br('props',x+5,y+12,3,17,'earWhite');
   br('props',x+5,y+3,4,6,'grey');
  }
  br('props',188,y+30,5,11,'earWhite');
  // 音符：从 n=0 起画、每 4 帧升一格、n≥.5 换大号、.75 后消失；第二个小音符在 x245 错半拍
  const n=(p.t*2)%1,n2=(n+.5)%1;
  if(n<.75)pat('effects',['0011','0010','0010','1110','1110'],231,176-5*Math.floor(n*6),'goldLight',n<.5?4:5);
  if(n2<.75)pat('effects',['0011','0010','0010','1110','1110'],248,190-5*Math.floor(n2*6),'goldLight',3);
 }
 if(id==='fishing'){
  // 竿从右手心往右上伸 90（绕手心转 angle），竿尖垂一条白点线到浮子；浮子 10×10 红带白顶；提起来那几帧浮子下面挂一条小蓝鱼（尾巴每两帧摆一下）
  const h=p.hands[1],{angle,dip,fish,wag}=p.tool.rod,cx=h.x+10,cy=h.y+10,rad=angle*Math.PI/180,tr={cx,cy,a:angle};
  r('props',h.x+5,h.y-80,10,90,'leatherLight',tr);r('props',h.x+5,h.y-80,10,10,'leatherDark',tr);r('props',h.x+5,h.y+2,10,8,'leatherDark',tr);
  const tipX=Math.round(cx+90*Math.sin(rad)),tipY=Math.round(cy-90*Math.cos(rad)),floatY=255+dip;
  for(let y=tipY+6;y<floatY;y+=5)r('props',tipX-1,y,3,3,'white');
  r('props',tipX-5,floatY,10,10,'redLight');r('props',tipX-5,floatY,10,3,'white');
  if(fish){
   const fx=tipX-11,fy=floatY+12;
   r('props',fx,fy,14,7,'blue');r('props',fx+14,fy-(wag?2:0),5,7,'blue');r('props',fx+2,fy+2,3,3,'white');r('props',fx+1,fy-3,5,4,'blue');
  }
 }
 if(id==='writing'){
  // 桌子压在马甲下沿，纸在两眼之间（x126–174），墨水瓶坐在纸右头（164 贴着纸的右缘，纸本身被眼睛的列定在 126 不在 5 格上）；
  // 蘸水笔绕右手心转 pen：白杆 5×32、金笔尖 5×5；
  // 字是 lettering 层的 5×3 短划，第一行 y241、第二行 y247，每落一笔接上前一笔——第一行六笔连成 30px 一条线，70px 下是 7pt 看得见在长
  // （原来是 3×3 的墨点，缩到 70 只剩 0.7pt 被最近邻采样直接丢掉）；信往包里推的那两帧划跟着纸走
  const {row1,row2,paperDx,pen}=p.tool.writing,h=p.hands[1],tr={cx:h.x+10,cy:h.y+10,a:pen};
  r('props',86,251,128,12,'leatherDark');
  r('props',126+paperDx,235,48,16,'paper');
  r('props',164,241,10,2,'grey');r('props',164,243,10,8,'blue');
  r('props',h.x+2,h.y-22,5,32,'white',tr);r('props',h.x+2,h.y+10,5,5,'gold',tr);
  lettering={text:null,unit:5,letters:[]};
  for(let k=0;k<row1;k++){const x=128+5*k+paperDx;r('lettering',x,241,5,3,'ink');lettering.letters.push({char:'-',x,y:241,width:5,height:3,jump:0});}
  for(let k=0;k<row2;k++){const x=128+5*k+paperDx;r('lettering',x,247,5,3,'ink');lettering.letters.push({char:'-',x,y:247,width:5,height:3,jump:0});}
 }
 if(id==='dice'){
  // 两颗 12×12 的白骰子，停住时点数朝上（六和五，2×2 墨点），飞和滚的时候只画一个中心点、隔帧翻 45°；停住那三帧右边冒一颗小星
  const d=p.tool.dice;
  if(d){
   const pips=[[[2,2],[8,2],[2,5],[8,5],[2,8],[8,8]],[[2,2],[8,2],[5,5],[2,8],[8,8]]];
   [d.a,d.b].forEach(([x,y],i)=>{x=Math.round(x);y=Math.round(y);const tr={cx:x+6,cy:y+6,a:d.rot};r('props',x,y,12,12,'white',tr);
    if(d.faces)for(const [px,py] of pips[i])r('props',x+px,y+py,2,2,'ink',tr);else r('props',x+5,y+5,2,2,'ink',tr);});
  }
  if(p.tool.star)smallStar(285,245);
 }
 // 绕圈的金星（晕乎乎）：tool.orbit 是每颗星在 12 格圆周上的位置，圆心 (150,160)、横半径 45、纵半径 15，每 30° 一格、坐标取整到 5（纵半径 10 时偶数帧总有两颗上下贴成一根「‡」，15 让任意两颗至少隔 15）；
 // 星是 goldLight 15×15 的十字（tag orbit-star-n）。上半圈画在最底的 paper 层（转到帽子后面），下半圈和正左正右画在 effects 层（转到前面）
 if(p.tool.orbit)p.tool.orbit.forEach((k,n)=>{
  const a=k*Math.PI/6,x=Math.round((150+45*Math.cos(a))/5)*5-5,y=Math.round((160+15*Math.sin(a))/5)*5-5,layer=k>6?'paper':'effects';
  r(layer,x+5,y,5,15,'goldLight',null,`orbit-star-${n+1}`);r(layer,x,y+5,15,5,'goldLight');
 });
 // 泪（委屈）：blue 10×10 挂在眼边、往下落，落地那两帧变成一个 10×5 的点（70pt 下是 2×2 的一块）；画在 effects 层（tag tear-n）
 if(p.tool.tears)p.tool.tears.forEach((t,n)=>t&&r('effects',t.x,t.y,10,t.dot?5:10,'blue',null,`tear-${n+1}`));
 // 哼出的气（鼓脸）：一团三块 grey 5×5，开口朝着脸；dir −1 往左飘、+1 往右飘
 if(p.tool.huffs)p.tool.huffs.forEach((h,n)=>pat('effects',h.dir<0?['01','11']:['10','11'],h.x,h.y,'grey',5));
 // 小心（害羞脸红冒的那颗）：['101','111','010'] unit 5 的红心，跟爱心小跳那颗大心分开
 if(p.tool.miniHeart){const {x,y}=p.tool.miniHeart;pat('effects',['101','111','010'],x,y,'red',5);}
 if(id==='reading'){
  // 信纸 paperEdge 40×30 里套 white 30×20，夹在两眼之间（x130–170）；字是 lettering 层的 5×3 短划（x140–160）：
  // 第一页两行（y240、y250，隔 10——隔 5 的话 70pt 下两行粘成一道 2px 的黑缝，横在两眼底下像张着嘴），第二页一行加一颗落款小心（unit 5 红 15×10，unit 2 的到 70pt 认不出是心）；翻页那一帧信纸侧立成 10×30 的一根条。整张信跟着蹦起来的那一帧抬
  const {page,lift}=p.tool.letter,y0=233+lift;
  if(!page){r('letter',145,y0,10,30,'paperEdge',null,'reading-letter');r('letter',145,y0,5,30,'white');}
  else {
   r('letter',130,y0,40,30,'paperEdge',null,'reading-letter');r('letter',135,y0+5,30,20,'white');
   const rows=page===1?[[240,4],[250,3]]:[[240,4]];
   lettering={text:null,unit:5,letters:[]};
   for(const [y,n] of rows)for(let k=0;k<n;k++){r('lettering',140+5*k,y+lift,5,3,'ink');lettering.letters.push({char:'-',x:140+5*k,y:y+lift,width:5,height:3,jump:0});}
   if(page===2)pat('lettering',['101','010'],145,248+lift,'red',5);
  }
 }
 if(id==='stargazing'){
  // 望远镜绕右手心转：gold 10×45 的镜筒从手心往外伸 35、往回留 10；远端物镜 goldLight、近端目镜 leatherDark、中段一道 leatherLight 镜箍
  const h=p.hands[1],cx=h.x+10,cy=h.y+10,tr={cx,cy,a:p.tool.scope};
  r('props',cx-5,cy-35,10,45,'gold',tr,'telescope');
  r('props',cx-5,cy-35,10,5,'goldLight',tr);r('props',cx-5,cy-15,10,5,'leatherLight',tr);r('props',cx-5,cy+5,10,5,'leatherDark',tr);
  // 一大两小三颗星，按 tool.stars 各自亮灭；流星每帧走 (−15,+10)：头 goldLight 10×5、身后拖两块 gold 5×5，和星星一族色——
  // 原来是 white 5×5 头拖 paperEdge 尾，70pt 下只剩 1–2px 的白点，纸色浅底上 white 对 paper 几乎没对比，24 那一帧甩镜去追，看的人不知道在追什么
  const [a,b,c]=p.tool.stars;
  if(a)star(250,135,4);if(b)smallStar(225,120);if(c)smallStar(275,170);
  if(p.tool.meteor>=0){const k=p.tool.meteor,x=280-15*k,y=100+10*k;r('effects',x,y,10,5,'goldLight',null,'meteor');r('effects',x+10,y-5,5,5,'gold');r('effects',x+15,y-10,5,5,'gold');}
 }
 if(id==='phone'){
  // 烛台电话立在右边地上：底座 leatherDark 30×10、金杆 5×40、话筒杯 leatherDark 15×10（上面 5 行 goldLight）、空挂钩 gold 10×5；
  // 听筒在左手里：leather 10×25 竖着，顶上 gold 15×5 的听口朝头那边伸，贴在帽檐下面——
  // 原来是 leatherDark，深底（#0d1430）上 70pt 只剩一道暗影，贴着耳朵的东西几乎看不见；leather 在深底上认得出一根听筒，浅底也不变坏
  r('props',225,263,30,10,'leatherDark',null,'phone-base');r('props',235,223,5,40,'gold',null,'phone-stem');
  r('props',230,213,15,10,'leatherDark',null,'phone-mouthpiece');r('props',230,213,15,5,'goldLight');r('props',240,233,10,5,'gold',null,'phone-hook');
  const h=p.hands[0];
  r('props',h.x+5,h.y+3,10,25,'leather',null,'phone-receiver');r('props',h.x+5,h.y-2,15,5,'gold');
  if(p.tool.talk){r('effects',250,213,5,5,'goldLight');r('effects',255,208,5,10,'goldLight');}
 }
 if(id==='painting'){
  // 画架：两条 leatherLight 腿、一道 leatherDark 横档；画布 paperEdge 45×45 里套 white 35×35，挂上去那两帧整张往上走；
  // 心在 lettering 层（unit 5，一行一行长出来），高光 goldLight 5×5；笔 leatherLight 5×30 绕右手心转 30°、笔尖 5×5；调色板托在左手上，三点颜料
  const {rows,shine,lift,star:twinkle,tip}=p.tool.paint;
  r('props',245,238,5,35,'leatherLight',null,'easel');r('props',275,238,5,35,'leatherLight');r('props',240,233,45,5,'leatherDark');
  r('props',240,188+lift,45,45,'paperEdge',null,'canvas');r('props',245,193+lift,35,35,'white');
  const HEART=['0110110','1111111','1111111','0111110','0011100','0001000'];
  pat('lettering',HEART.slice(0,rows),245,198+lift,'red',5);
  if(shine)r('lettering',255,203+lift,5,5,'goldLight');
  const h=p.hands[1],cx=h.x+10,cy=h.y+10,tr={cx,cy,a:30};
  r('props',cx-2.5,cy-25,5,30,'leatherLight',tr,'brush');r('props',cx-2.5,cy-25,5,5,tip,tr);
  const L=p.hands[0];r('props',L.x-15,L.y+10,25,15,'paperEdge',null,'palette');
  r('props',L.x-10,L.y+15,5,5,'red');r('props',L.x,L.y+15,5,5,'blue');r('props',L.x-5,L.y+20,5,5,'goldLight');
  if(twinkle)smallStar(285,180);
 }
 // 提灯：灯从右手底下吊下来，x0 = 右手画面 x + 晃的 dx、y0 = 手底。提环 ink 5×5、顶盖 ink 25×5、两侧框 ink 5×20、
 // 玻璃 goldLight 15×20（tag lantern-glass）、底座 ink 25×5——灯体 25×30 连环 35；火苗在玻璃正中：高的 redLight 5×10、矮的 red 5×5。
 // 暖光放最底的 paper 层不放 effects：effects 在所有层之上，一团实心的光会把灯和手整个盖掉；paper 层画在身子、包、手、灯后面，
 // 只露出灯周围一圈边，正好是「一团光」（左边 215–224 那截藏在包后面）。大光团 45×55、小的 35×45，大小跟那口气走、不跟火苗。
 // 光团用 gold 不用 goldLight、四角各削掉一块（大的削 10、小的削 5）：和玻璃同一个 goldLight 的话，70pt 下玻璃和光糊成一块黄卡片、
 // 灯成了卡片上印的一个黑框；暗一档的光才衬得出最亮的是玻璃，削了角才是一团光不是一张牌
 if(p.tool.lantern){
  // 大小光团跟 tool.lantern.glow 走（那口气抬着的 12–27 大），不再跟火苗的两帧节拍绑在一起
  const h=p.hands[1],{dx,tall,glow:big}=p.tool.lantern,x0=h.x+dx,y0=h.y+20;
  const glow=(x,y,w,h,c)=>{r('paper',x+c,y,w-2*c,h,'gold',null,'lantern-glow');r('paper',x,y+c,w,h-2*c,'gold');};
  if(big)glow(x0-10,y0-5,45,55,10);else glow(x0-5,y0,35,45,5);
  r('props',x0+10,y0,5,5,'ink',null,'lantern-ring');r('props',x0,y0+5,25,5,'ink',null,'lantern-cap');
  r('props',x0,y0+10,5,20,'ink',null,'lantern-frame-1');r('props',x0+20,y0+10,5,20,'ink',null,'lantern-frame-2');
  r('props',x0+5,y0+10,15,20,'goldLight',null,'lantern-glass');
  r('props',x0,y0+30,25,5,'ink',null,'lantern-base');
  if(tall)r('props',x0+10,y0+15,5,10,'redLight',null,'lantern-flame');else r('props',x0+10,y0+20,5,5,'red',null,'lantern-flame');
 }
 // 指路的食指：右手画面右缘再伸出 skin 10×5（y 在手的上半截），props 层压在手层上、同一个色，看着是手伸出去一截；tag finger。
 // 小臂（复审后加，tag forearm）：身子右缘到手左缘一截 skin、高 10，画在手的 y+5 到 y+15（223–233），在帽檐 208 之下、包顶 238 之上；
 // 全片「手不画胳膊」，只有这只离身 20 的手给一截——不然 70pt 下是悬在身子外头的一块方块。16–17 收到离身 5、36 离身 10，照样接得上。
 // 朝西（tool.point.west）用左手：小臂从手右缘接到身子左缘，食指画在手左边 h.x−10
 if(p.tool.point){
  const west=!!p.tool.point.west,h=p.hands[west?0:1];
  const [ax,aw]=west?[h.x+20,body.x-h.x-20]:[body.x+body.w,h.x-body.x-body.w];
  if(aw>0)r('props',ax,h.y+5,aw,10,'skin',null,'forearm');
  r('props',west?h.x-10:h.x+20,h.y+5,10,5,'skin',null,'finger');
 }
 // 伞（打伞）：杆列 cx=90、伞顶 top=135，props 层。伞面 red 六行阶梯、各高 5：5/25/45/65/85/105 宽，最宽那行 tag canopy，首帧 40–145×160–165，
 // 离帽顶 168 空 3 行、一粒不叠在帽子上。v9 第一版是 ink 65 宽、顶在 150：ink 对深底 #0d1430 几乎没有对比，65 宽缩在帽子左上角，
 // 70pt 下只剩一粒灰「T」，雨看得见、伞看不见；换 red（调色板里现成的道具色，深底浅底都跳）、加宽到 105、整把抬高 15，真实大小下才一眼是一把伞。
 // 伞骨用 hatRim（和帽子轮廓同色）：顶珠兼中骨 5×30，斜骨从第三行起每行左右各一枚 5×5，照帽子檐尖的画法。
 // 风掀的时候只有伞面（连骨）加 dx/dy，杆 ink 5×15 和柄都钉在手里不动；掀到右 10、上 5 那两帧中骨底和杆顶横错 10，
 // 中间补一块 ink 5×5 的台阶，伞杆像被风吹弯了一节，300 下伞面不飘离杆（右 5 那一帧中骨和杆斜着对角相接，用不着补）。
 // 柄是 leather 的弯钩、钩口朝右，落在帽檐上是棕压黑看得见
 if(p.tool.umbrella){
  const cx=90,top=135,{dx,dy}=p.tool.umbrella,x=cx+dx,y=top+dy;
  [5,25,45,65,85,105].forEach((w,k)=>r('props',x+2.5-w/2,y+5*k,w,5,'red',null,k===5?'canopy':null));
  r('props',x,y,5,30,'hatRim',null,'umbrella-rib');
  for(let k=2;k<6;k++)for(const s of [-1,1])r('props',x+s*10*k,y+5*k,5,5,'hatRim');
  r('props',cx,165,5,15,'ink',null,'umbrella-pole');
  if(dx>=10)r('props',cx+5,y+30,5,5,'ink',null,'umbrella-bend');
  r('props',cx,200,5,10,'leather',null,'umbrella-handle');r('props',cx,210,10,5,'leather');r('props',cx+5,205,5,5,'leather');
 }
 // 雨（打伞）：effects 层五列 x0 ∈ {15,40,235,255,275}，每列一串 blue 5×10，列间错开 15、串里隔 30；k=tool.rain（0/1/2）每帧往左下走 (−5,+10)，
 // 三帧一圈正好走完一个间隔；出画布顶或越过脚底线 273 的不画。一根都不进 x90–210（眼睛和脚在那里）；k=2 时 235 那列落到 225，正好在包右边。
 // 伞左尖再挂一滴 blue 5×10，从 (35,160) 每帧往下 10，9 帧掉到 240。伞面加宽到 40 起之后，滴挪到伞尖外头 x35（还在 55 的话就是从伞底下漏水），
 // 起点 160 贴着伞尖左边挂着；160 是算过的：滴和 x40 那列雨每帧都往下 10，相位差固定，起点取 160 时三种相位里滴和左边两列雨上下都隔 5，
 // 取 175 的话第 1、4、7 帧滴正好叠进 x35 那串雨里看不见，取 170 会和它连成一根 15 长的条
 if(Number.isInteger(p.tool.rain)){
  const k=p.tool.rain;
  [15,40,235,255,275].forEach((x0,c)=>{
   for(let j=0;j<10;j++){const x=x0-5*k,y=-20+15*(c%2)+30*j+10*k;if(y<0||y+10>273)continue;r('effects',x,y,5,10,'blue',null,'rain');}
  });
  if(Number.isInteger(p.tool.drip))r('effects',35,160+10*p.tool.drip,5,10,'blue',null,'drip');
 }
 // 新动作自己的道具、特效、牌子（states/<id>.cjs 的 paint）：老动作按 id 画的那一大串都在上面，这里只认 state.plugin，老的一支都进不来。
 // 画在 PLUGIN_LAYERS 那五层；tag 自动加上「@<id>/」前缀写进 meta.parts——check-art 按 hand- / foot- / eye- 这些前缀数肢体，
 // 不加前缀的话一支叫 hand-sign 的牌子就会被数成第三只手。ctx 里的位置都是这一帧真画出来的（手是收尾偏移之后的左上角、睡姿的手是写死的那两处），
 // 道具贴着手、眼睛、帽子、包放就不会差一格；ctx.p 和第二个参数 p 是同一份拷贝，改了它什么都不会变
 if(state.plugin?.mod.paint){
  const sid=state.id,file=state.plugin.file||sid,own=[];
  const tagOf=t=>t==null||t===''?null:`@${sid}/${t}`;
  const optsOf=o=>typeof o==='string'?{tag:o}:(o||{});
  const onLayer=layer=>{
   if(!PLUGIN_LAYERS.includes(layer))throw Error(`paint 只能画 ${PLUGIN_LAYERS.join(' / ')} 这几层，拿到 ${layer}（身子、眼睛、帽子、手脚由姿势驱动，换装才穿得上）`);
   const known=color=>{if(!(color in colors))throw Error(`颜色 ${color} 不在这一帧的色表里：老伦敦 19 色${state.plugin.mod.palette?' + 这一支的 palette':''}${outfit?` + 衣服 ${outfit.name} 的补色`:''}；新颜色写进模块的 palette`);};
   const rect=(x,y,w,h,color='ink',o)=>{
    known(color);o=optsOf(o);const tr=o.lean?bt:(o.transform||null),tag=tagOf(o.tag);
    own.push({layer,x,y,w,h,color,transform:tr,tag});r(layer,x,y,w,h,color,tr,tag);
   };
   const pattern=(rows,x,y,color='ink',unit=5,o)=>{
    known(color);o=optsOf(o);const tr=o.lean?bt:(o.transform||null);
    rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1'){own.push({layer,x:x+i*unit,y:y+j*unit,w:unit,h:unit,color,transform:tr,tag:null});r(layer,x+i*unit,y+j*unit,unit,unit,color,tr);}}));
    if(o.tag)paint.mark(tagOf(o.tag),layer,x,y,Math.max(...rows.map(row=>row.length))*unit,rows.length*unit,tr);
   };
   return {rect,pattern};
  };
  const hatAside=!!(p.sleep||p.tool.hatAside),pv=structuredClone(p);
  const ctx={
   frame:index,frames:state.frames,t:p.t,p:pv,outfit:outfit?outfit.name:null,side:p.side,sleep:p.sleep,
   ...Object.fromEntries(PLUGIN_LAYERS.map(l=>[l,onLayer(l)])),
   rect:(layer,...a)=>onLayer(layer).rect(...a),pattern:(layer,...a)=>onLayer(layer).pattern(...a),
   shapes:SHAPES,palette:Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,'#'+v.slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('')])),
   body:{...body},bottom,baseline:273,bodyTransform:{...bt},
   eyes:eyeAnchors.map((ax,n)=>{const kind=eyeKind(p,n),d=paint.primitives.find(q=>q.tag===`eye-${n+1}`);return {x:Math.round(ax+p.gazeX),y:Math.round(body.y+(p.sleep?11:5)+p.gazeY),w:10,h:20,kind,drawn:d?{x:d.x,y:d.y,w:d.w,h:d.h}:null};}),
   hands:p.hands.map(h=>({x:h.x,y:h.y,w:20,h:20,a:h.a||0,cx:h.x+10,cy:h.y+10,color:h.color||'skin'})),
   feet:footXs.map((fx,n)=>({x:fx+(p.footOffsets?.[n]||0),y:263+p.jump-p.feet[n],w:10,h:10})),
   hat:hatAside?{x:216,y:253,w:70,h:20,scale:.5,angle:0,aside:true}:{x:onHead.x,y:onHead.y,w:140,h:40,scale:1,angle:onHead.angle,aside:false},
   bag:showBag?{x:bagx,y:bagy,w:bagWidth,h:bagHeight,a:p.bag.a}:null
  };
  try{state.plugin.mod.paint(ctx,pv,index);}
  catch(error){if(error instanceof Error)error.message=`${file} 第 ${index} 帧 paint：${error.message}`;throw error;}
  pluginRects=own;
 }
 let pixels=paint.merge();
 const feet=paint.primitives.filter(q=>q.tag.startsWith('foot-')),hands=paint.primitives.filter(q=>q.tag.startsWith('hand-'));
 if(feet.length!==4||hands.length!==2)throw Error(`${id}: limb count`);
 const eyes=paint.primitives.filter(q=>q.tag.startsWith('eye-'));
 if(eyes.some(e=>{const k=eyeKind(p,+e.tag.slice(4)-1);return e.w!==EYE_W[k]||e.h!==EYE_H[k];}))throw Error(`${id}: eye size drift`);
 const drawnKinds=eyes.map(e=>eyeKind(p,+e.tag.slice(4)-1));
 for(const f of feet){let seen=0;for(let y=Math.ceil(f.y);y<Math.floor(f.y+f.h);y++)for(let x=Math.ceil(f.x);x<Math.floor(f.x+f.w);x++){const i=(y*W+x)*4;if(pixels[i]===rgba.skin[0]&&pixels[i+1]===rgba.skin[1]&&pixels[i+2]===rgba.skin[2]&&pixels[i+3]===255)seen++;}if(seen<70)throw Error(`${id} frame ${index}: foot hidden (${seen})`);}
 // 镜像（只给 renderVariant 手工导出用，比如指路要一张不换边的左手版）：override 带 mirror:true 时，合成图和每一层都按行左右翻，
 // 部件坐标、身体框、字的位置跟着翻，meta 记 mirrored。上面的检查（脚露没露、眼睛尺寸）在翻之前做，翻不改像素数；正式导出的包里不出镜像帧
 let layers=paint.layers,mirrored=false;
 if(p.mirror){
  const flip=b=>{const o=Buffer.alloc(b.length);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const a=(y*W+x)*4;b.copy(o,(y*W+W-1-x)*4,a,a+4);}return o;};
  pixels=flip(pixels);layers=Object.fromEntries(Object.entries(layers).map(([k,b])=>[k,flip(b)]));
  for(const q of paint.primitives){q.x=W-q.x-q.w;q.polygon=q.polygon.map(([px,py])=>[W-px,py]);}
  body.x=W-body.x-body.w;
  if(lettering)lettering.letters=lettering.letters.map(l=>({...l,x:W-l.x-l.width}));
  mirrored=true;
 }
 return {pixels,layers,meta:{state:id,frame:index,t:p.t,body,pose:p,parts:paint.primitives,lettering,...(mirrored?{mirrored}:{}),...(outfit?{outfit:outfit.name}:{}),eyeSprite:{open:[10,20],closed:[10,5],...(drawnKinds.includes('half')?{half:[10,10]}:{}),...(drawnKinds.includes('dot')?{dot:[10,10]}:{}),...(drawnKinds.includes('star')?{star:[15,15]}:{}),visible:eyes.length},baseline:273,canvas:[300,300],alpha:'binary',strapClippedToCostume:true,anatomy:{hands:2,feet:4,mouth:0}},...(pluginRects?{paintRects:pluginRects}:{})};
}
module.exports={STATES,palette,render,renderVariant:(id,index,options)=>render(id,index,options),ORDER,PLUGIN_LAYERS,SHAPES,EYE_W,EYE_H,EYE_TOP};
