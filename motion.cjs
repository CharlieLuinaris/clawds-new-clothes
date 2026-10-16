// clawd-new-coat · motion.cjs · animation by Luin Luinaris · unofficial Clawd fan work, Clawd belongs to Anthropic
// SPDX-FileCopyrightText: 2026 Charlie Luinaris
// SPDX-FileContributor: Luin Luinaris
// SPDX-License-Identifier: MIT
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const sin=(t,cycles=1,phase=0)=>Math.sin(TAU*(t*cycles+phase));
// 曲线点可带第三项：'s' 平滑（默认）/'l' 线性/'i' 加速 t²/'o' 减速 1-(1-t)²，写在这一段的终点上。
// 横轴单位不限：按节拍 t 的曲线传 0..1，按帧号写的曲线直接传 F。
const ease={s:smooth,l:t=>t,i:t=>t*t,o:t=>1-(1-t)*(1-t)};
function curve(t,points){
  if(t<=points[0][0])return points[0][1];
  for(let i=1;i<points.length;i++)if(t<=points[i][0]){const [a,x]=points[i-1],[b,y,e='s']=points[i];return x+(y-x)*ease[e](clamp((t-a)/(b-a)));}
  return points.at(-1)[1];
}
// segments：一个动作里能单独拿出来放的段（帧号含两头），接入方按段接线；loop 的段首尾接得上（check-art 验肢体接缝为零）。
// 打电话：听（connecting/listening）放 0–17、说（speaking）放 21–35；读信：opened 那 1.66 秒（拆开信的那一下）从第 20 帧放到 44（看得到心和蹦）
// 挥手：她一打开页面，第一眼放一遍再回待机，放 once 段 0–40 就切 idle/0（40 和 idle/0 逐像素全等，next 写的就是接到哪）；0–44 整圈只给通知配图的 GIF 循环用
// handoff：这个动作是两个状态之间的过渡，接入方从 from 切进来放一遍、放完切到 to，不循环；伸懒腰 = 睡着 → 待机，首帧和 sleeping/0、末帧和 idle/0 像素全等。
// 伸懒腰的 seamStep 43：GIF 照规格无限循环，预览里末帧「站着」接回首帧「躺着」是一帧硬切，账面上右手从 x210 回到睡姿写死的 167；
// 工单估的是 10（以为睡姿的手按 pose 原值记账），可睡姿的手由 render 写死成 112/167 并记进 poses.json，睡着自己的 poses.json 不能动，就照实登 43
// stickerFrame（1015 画的人挑的）：老动作的静图规格定死是首帧，可伸懒腰的首帧和睡着逐像素一样（趴着冒 Z，发「早」看着像「我睡了」），
// 轻轻蹦、蓄力高跳、扶帽致意的首帧和待机只差两三百个像素，贴纸盘里是四张一样的站姿。这四支补一个表情包定帧，只给贴纸的静图用：
// 伸懒腰 14 两手举过头、眯着眼；扶帽致意 15 手把帽檐掀起来；蓄力高跳 23 跳到最高、两手张开；轻轻蹦 7 在半空、两手张开。都是自己的关键帧。
// static/、gif/、frames/ 照旧从第 0 帧出、一个字节不动（暂停、省电、减少动态效果还是首帧），manifest 只多这一个键
const STATES=[
 {id:'idle',label:'待机',frames:48,keyframes:[0,8,16,24,32,40]},
 {id:'typing',label:'打字',frames:45,keyframes:[0,7,15,22,30,38]},
 {id:'thinking',label:'看怀表',frames:45,keyframes:[0,5,10,16,23,30,37,43]},
 {id:'happy',label:'开心',frames:45,keyframes:[0,2,4,7,11,13]},
 {id:'notification',label:'摇铃通知',frames:90,keyframes:[0,12,22,32,45,59,73,86]},
 {id:'sleeping',label:'睡着',frames:45,keyframes:[0,11,22,33]},
 {id:'building',label:'搭建',frames:45,keyframes:[0,7,15,23,31,38]},
 {id:'juggling',label:'抛接',frames:45,keyframes:[0,5,11,16,22,28,33,39],seamStep:15},
 {id:'sweeping',label:'打扫',frames:45,keyframes:[0,7,15,23,31,38]},
 {id:'carrying',label:'搬运',frames:45,keyframes:[0,7,15,23,31,38]},
 {id:'error',label:'报错',frames:45,keyframes:[0,4,8,13,22,36]},
 {id:'walking',label:'走路',frames:45,keyframes:[0,6,11,17]},
 {id:'listening',label:'听音乐',frames:48,keyframes:[0,8,16,24,32,40]},
 {id:'strolling',label:'慢悠悠走',frames:45,keyframes:[0,11,22,34]},
 {id:'running',label:'小跑',frames:45,keyframes:[0,2,4,7,9,12]},
 {id:'sprinting',label:'冲刺',frames:45,keyframes:[0,2,4,6,8,10]},
 {id:'hopping',label:'轻轻蹦',frames:45,keyframes:[0,2,4,7,10,13],stickerFrame:7},
 {id:'jumping',label:'蓄力高跳',frames:45,keyframes:[0,6,12,17,23,29,35,41],stickerFrame:23},
 {id:'leaping',label:'向前跃',frames:45,keyframes:[0,3,6,9,12,15,18,21]},
 {id:'front-running',label:'正面小跑',frames:45,keyframes:[0,2,4,7,9,12]},
 {id:'greeting',label:'扶帽致意',frames:45,keyframes:[0,5,10,15,21,28,35,42],stickerFrame:15},
 {id:'delighted',label:'爱心小跳',frames:45,keyframes:[0,4,8,13,18,23,28,38]},
 {id:'hugged',label:'被抱起来',frames:45,keyframes:[0,2,4,8,11,14,22,37]},
 {id:'fishing',label:'陪钓',frames:48,keyframes:[0,12,20,24,28,34,40]},
 {id:'writing',label:'写信',frames:45,keyframes:[0,6,12,18,24,30,36,42]},
 {id:'yawning',label:'打哈欠',frames:45,keyframes:[0,6,7,10,13,19,27,35]},
 {id:'dice',label:'掷骰',frames:45,keyframes:[0,5,9,11,15,18,29,36]},
 {id:'reading',label:'读信',frames:45,keyframes:[0,6,19,20,32,35,37,42],segments:[{id:'opened',from:20,to:44,loop:false}]},
 {id:'stargazing',label:'看星星',frames:48,keyframes:[0,22,24,28,29,30,34,40]},
 {id:'phone',label:'打电话',frames:45,keyframes:[0,6,18,20,21,30,36],segments:[{id:'listening',from:0,to:17,loop:true},{id:'speaking',from:21,to:35,loop:true}]},
 {id:'painting',label:'画画',frames:45,keyframes:[0,4,7,10,17,19,27,36]},
 {id:'dizzy',label:'晕乎乎',frames:36,keyframes:[0,2,4,18,19,24,30,32]},
 {id:'blushing',label:'害羞脸红',frames:45,keyframes:[0,8,16,18,24,30]},
 {id:'teary',label:'委屈',frames:45,keyframes:[0,6,12,20,27,35,40]},
 {id:'pouting',label:'鼓脸',frames:45,keyframes:[0,10,11,18,24,28,31]},
 {id:'lantern',label:'提灯',frames:48,keyframes:[0,12,21,24,30,38,44]},
 {id:'pointing',label:'指路',frames:45,keyframes:[0,2,10,16,18,28,36,37]},
 {id:'waving',label:'挥手',frames:45,keyframes:[0,3,6,12,18,27,28,42],segments:[{id:'once',from:0,to:40,loop:false,next:'idle'}]},
 {id:'umbrella',label:'打伞',frames:45,keyframes:[0,6,8,20,22,30,36]},
 {id:'stretching',label:'伸懒腰',frames:45,keyframes:[0,4,6,7,14,17,25,36],seamStep:43,handoff:{from:'sleeping',to:'idle'},stickerFrame:14}
];
// 走跑按节拍：一圈切成 cycles 步，每步内同样的落脚停顿，步界处等于原 t，循环不漏缝；原始 t 另留给环境特效
function cycleTime(t,cycles,points){
 const n=t*cycles,k=Math.floor(n),q=n-k;
 return (k+curve(q,points))/cycles;
}
function rhythm(id,t){
 // 按帧号写的动作把停拍写进自己的曲线，这里只剩走和听歌：走路落脚那一下停两帧；
 // 跑步不停拍——45 帧除不尽 3 或 4 圈，停拍会把末帧推离起点，接缝比平常一步大一倍，线性才接得平
 const stepped={
  strolling:[2,[[0,0],[.09,0],[.50,.50],[.59,.50],[1,1]]],
  walking:[2,[[0,0],[.09,0],[.50,.50],[.59,.50],[1,1]]],
  listening:[2,[[0,0],[.12,.09],[.26,.25],[.34,.25],[.50,.50],[.62,.59],[.76,.75],[.84,.75],[1,1]]]
 };
 if(stepped[id])return cycleTime(t,...stepped[id]);
 return t;
}
// 每个动作自己写姿势；眨眼按帧号闭两帧：closedAt(12,36) 是第 12–13、36–37 帧闭眼，closedAt([8,12]) 是一整段。
// opts 只给变体用：{west:true} 是指路朝西的左手版（姿势层左右对调，包和表链不换边），正式 40 态都不传
function poseRaw(id,frame,opts={}){
 const s=STATES.find(s=>s.id===id),F=frame,N=s.frames,clockT=F/N,t=rhythm(id,clockT);
 const closedAt=(...spans)=>spans.some(a=>Array.isArray(a)?F>=a[0]&&F<=a[1]:F>=a&&F<a+2);
 const p={t:clockT,motionT:t,dx:0,jump:0,squash:0,lean:0,hatLag:0,hatDrop:0,eyes:'open',gazeX:0,gazeY:0,
  hands:[{x:80,y:218,a:0},{x:200,y:218,a:0}],feet:[0,0,0,0],footOffsets:[0,0,0,0],bag:{x:0,y:0,a:0},tool:{},side:false,sleep:false};
 // states/<id>.cjs 里的新动作：姿势交给它自己的 pose()，下面这条老动作的 if 链一行都不进——
 // 新动作的 id 不许和老的撞，进了也匹配不上，这里先一步交出去只是让读的人一眼看明白
 if(s.plugin)return pluginPose(s,F,p,closedAt,opts);
 if(id==='idle'){
  // 一口气：7–11 帧长高 5 带着手一起、停到 23、27 落回；27–41 帽子沉 4 又浮起；18–25 眼睛往右瞟；42–47 与开头一样
  p.squash=curve(F,[[0,0],[7,0],[11,-5,'o'],[23,-5],[27,0,'i'],[47,0]]);
  p.hands[0].y+=p.squash;p.hands[1].y+=p.squash;
  p.hatDrop=curve(F,[[27,0],[31,4,'i'],[37,4],[41,0,'o'],[47,0]]);
  p.gazeX=F>=18&&F<=25?5:0;
  if(closedAt(12,36))p.eyes='closed';
 }
 if(id==='typing'){
  // 九次敲键 PRESS（左右交替）：敲的那只手提前两帧抬到 223、按键帧落回 233；16–19 停着纸往上走一格（回车）；
  // 33–37 停着眨眼 34；36–37 双手一起抬、38 同落并压身 3；43–44 回首帧
  const PRESS=[3,5,7,9,11,21,24,27,30],hy=[233,233];
  PRESS.forEach((P,i)=>{if(F>=P-2&&F<=P-1)hy[i%2]=223;});
  if(F>=36&&F<=37){hy[0]=223;hy[1]=223;}
  p.hands=[{x:76,y:hy[0],a:0},{x:204,y:hy[1],a:0}];
  p.squash=F>=38&&F<=40?3:0;
  p.tool.paper=F>=16&&F<=19?-5:0;p.tool.press=PRESS;
  if(closedAt(34))p.eyes='closed';
 }
 if(id==='thinking'){
  // 相位平移：首帧就是举表到脸旁，0–9 盯着表看（眼睛右上），10–11 眨，12–15 点头（squash 3、帽子沉 4），
  // 15–24 加速放下，停到 34，35–36 手先沉 5 作预备，36–44 减速举回
  const lift=curve(F,[[0,1],[15,1],[24,0,'i'],[34,0],[36,0],[44,1,'o']]);
  const dip=F>=35&&F<=36?5:0;
  p.hands=[{x:76,y:218,a:0},{x:213-5*lift,y:236-42*lift+dip,a:-7*lift}];
  p.gazeX=F<=9?5:0;p.gazeY=F<=9?-5:0;
  if(F>=12&&F<=15){p.squash=3;p.hatDrop=4;}
  p.tool.watch=true;p.tool.watchLift=lift;
  if(closedAt(10))p.eyes='closed';
 }
 if(id==='happy'){
  // 两跳：蹲 2–5、起 6–13 减速到顶 −60、停一帧、14–20 加速落地（最后一步 18px）、落地那帧最扁；第二跳矮一截到 −40
  const J=curve(F,[[0,0],[5,0],[6,-5],[13,-60,'o'],[14,-60],[20,0,'i'],[25,0],[28,-4],[34,-40,'o'],[35,-40],[40,0,'i'],[44,0]]);
  p.jump=J;
  p.squash=curve(F,[[2,0],[5,10,'i'],[6,-5],[13,-3],[19,-3],[20,10],[21,-3],[22,0],[27,7,'i'],[28,-4],[34,-2],[39,-2],[40,7],[41,-2],[42,0]]);
  const apex=(F>=13&&F<=14)||(F>=34&&F<=35),pre=F>=3&&F<=5;
  const hy=207+J+(pre?5:0)+(apex?-10:0),sp=apex?5:0;
  p.hands=[{x:73-sp,y:hy,a:-7},{x:207+sp,y:hy,a:7}];
  p.tool.star=(F>=8&&F<=18)||(F>=31&&F<=39);
  if(closedAt(20,40))p.eyes='closed';
 }
 if(id==='notification'){
  // 大·小小·停·大：8–11 右手先往回收 5 作预备，12–22 大摇（铃 25°）、23–30 停，31–40 两次小摇（铃 ±10°、手 ±8——
  // 原来 ±.5 在 70pt 下每帧只变十几个像素，铃等于没动，「大·小小·停·大」成了「大·停·停·大」），
  // 41–58 停着看信封（44–51 眼睛往左瞟），59–72 再来一次大摇，73–86 停，87–89 回首帧；眨眼 26/78；信封一个像素不动
  const big=f0=>curve(F-f0,[[0,0],[2,-1,'o'],[5,1],[8,-.6],[10,0]]);
  let swing=0,amp=0;
  if(F>=12&&F<=22){swing=big(12);amp=25;}
  else if(F>=59&&F<=69){swing=big(59);amp=25;}
  else if(F>=30&&F<=40){swing=curve(F,[[30,0],[32,-.8],[34,.8],[36,-.8],[38,.8],[40,0]]);amp=12;}
  const pre=(F>=8&&F<=11)||(F>=55&&F<=58)?-5:0;
  p.hands=[{x:78,y:218,a:0},{x:207+10*swing+pre,y:195,a:amp*.6*swing}];
  p.squash=[14,19,61,66].includes(F)?5:0;
  p.tool.swing=swing;p.tool.bellAngle=amp*swing;p.tool.ring=amp===25?Math.abs(swing):0;
  p.tool.crack=F>=87?0:F>=68?3:F>=38?2:F>=20?1:0;
  p.gazeX=F>=44&&F<=51?-5:0;
  if(closedAt(26,78))p.eyes='closed';
 }
 if(id==='sleeping'){
  // 一口气 45 帧：12 帧吸到 −5、停到 22、34 帧吐回；包跟着抬 3；两只 Z 各活 15 帧（小→中→大），年龄错开 8 帧，45=3×15 自然接缝
  p.sleep=true;p.eyes='closed';
  p.squash=curve(F,[[0,0],[12,-5,'o'],[22,-5],[34,0,'i'],[44,0]]);
  p.bag.y=p.squash*.6;
  p.tool.zAges=[F%15,(F+8)%15];
 }
 if(id==='building'){
  // 敲锤子（id 不变）：每 20 帧一锤——0–2 举着（首帧）、3–5 再抬一点往后、6 挥到半途、7 一帧砸到板上（squash 5、帽子沉 4、眼闭 7–8）、
  // 8–9 停、10–16 减速抬回、17–19 停着眨眼；20–39 同样一锤，40–44 回首帧
  const f=F<40?F%20:0;
  const hy=f<=2?165:f<=5?curve(f,[[2,165],[5,160]]):f===6?195:f<=9?220:f<=16?curve(f,[[9,220],[16,165,'o']]):165;
  const a=f<=2?0:f<=5?curve(f,[[2,0],[5,-10]]):f===6?45:f<=9?90:f<=16?curve(f,[[9,90],[16,0,'o']]):0;
  p.hands=[{x:76,y:218,a:0},{x:205,y:hy,a:0}];
  p.tool.hammer=a;p.tool.spark=f>=7&&f<=9;
  if(f>=7&&f<=9)p.squash=5;
  if(f>=7&&f<=8)p.hatDrop=4;
  if((f>=7&&f<=8)||(f>=17&&f<=18))p.eyes='closed';
 }
 if(id==='juggling'){
  // 三段各 15 帧：左手 f=0 一帧甩上去 15px 抛球、右手 f=7–8 沉 5 接球、f=9 弹起抛回；身子慢慢左右挪 ±5（球和手都跟）；
  // 仰头看球只用眼睛抬 5——原来还给帽子 −5 的基值，结果 45 帧（连静图）帽檐都离头一道缝，删了
  const f=F%15;
  p.dx=curve(F,[[0,0],[14,-5],[29,5],[44,0]]);
  const ly=220+curve(f,[[0,-10],[1,-10],[4,0,'o'],[12,0],[14,5,'i']]);
  const ry=220+curve(f,[[0,0],[6,0],[7,5,'i'],[8,5],[9,-8],[11,0,'o']]);
  p.hands=[{x:69+p.dx,y:ly,a:0},{x:211+p.dx,y:ry,a:0}];
  p.gazeY=-5;
  p.tool.balls=Array.from({length:3},(_,i)=>{const q=(F/45+i/3)%1,out=q<.5,u=out?q*2:(q-.5)*2;return {x:p.dx+(out?72+156*u:228-156*u),y:210-(out?100:75)*Math.pow(Math.sin(Math.PI*u),.85),color:['red','gold','green'][i]};});
  if(closedAt(20))p.eyes='closed';
 }
 if(id==='sweeping'){
  // 每来回四拍（22 帧）：0–2 撤回（扫把 +12°、右手 −5），3–5 线性推出到 −12°（身子前倾 3、压 5），6–8 停着、灰尘往右飞，
  // 9–16 减速收回，17–21 停着眨眼；22–43 同形，44 停
  const f=F<22?F:F<44?F-22:21;
  const ang=curve(f,[[0,12],[2,12],[5,-12,'l'],[8,-12],[16,12,'o'],[21,12]]);
  p.hands=[{x:76,y:218,a:0},{x:210-ang*5/12,y:222,a:-ang*.5}];
  p.lean=curve(f,[[2,0],[5,3,'l'],[8,3],[16,0,'o']]);
  p.squash=curve(f,[[2,0],[5,5,'l'],[8,5],[16,0,'o']]);
  p.tool.broomAngle=ang;p.tool.dust=f>=6&&f<=8?(f-6)*5:-1;
  if(closedAt(17,39))p.eyes='closed';
 }
 if(id==='carrying'){
  // 沉-提-扛：0–5 扛着，6–9 箱子加速沉 5（手跟、身子压、帽子沉 3），10 一帧顶上去 −5，停到 16，17–30 线性沉回 +5，
  // 31 再顶一下，停到 35，36–39 减速回 0，40–44 回首帧；重心换脚：0–9 与 31–44 抬 1、3 号脚，10–30 抬 2、4 号；眨眼 13
  const c=curve(F,[[0,0],[5,0],[9,5,'i'],[10,-5],[16,-5],[30,5,'l'],[31,-5],[35,-5],[39,0,'o'],[44,0]]);
  p.hands=[{x:73,y:228+c,a:0},{x:207,y:228+c,a:0}];
  p.tool.caseY=c;
  p.squash=c>0?c:(F===10||F===31?-3:0);
  p.hatDrop=(F>=6&&F<=9)||(F>=24&&F<=30)?3:0;
  p.feet=(F<=9||F>=31)?[5,0,5,0]:[0,5,0,5];
  if(closedAt(13))p.eyes='closed';
 }
 if(id==='error'){
  // 0–2 站着，3 一帧缩（squash 5、帽子沉 4），4 一帧吓飞（jump −10、拉长、帽子离头、感叹号拉长到 30、手举起），5–8 冻在空中，
  // 9 落地最扁（眼闭 9–10），10–11 回弹，12–19 左右抖 ±5（手跟），20–23 停，24–33 眼睛左看右看，34 眨，37–44 叹气
  const air=F>=4&&F<=8;
  p.jump=air?-10:0;
  p.squash=F===3?5:air?-5:F===9?8:F===10?-3:curve(F,[[36,0],[40,3],[44,0]]);
  p.hatDrop=F===3?4:0;
  if(air)p.hatLag=-15;
  const sh=[5,5,-5,-5,5,5,-5,-5];p.dx=F>=12&&F<=19?sh[F-12]:0;
  const sigh=F>=37?curve(F,[[36,0],[40,3],[44,0]]):0;
  const hy=218+p.jump+(F===3?5:0)+(air?-15:0)+sigh,sp=air?5:0;
  p.hands=[{x:76-sp+p.dx,y:hy,a:air?-7:0},{x:204+sp+p.dx,y:hy,a:air?7:0}];
  p.tool.exclaim={dx:p.dx*1.5,dy:F===3?4:air?-14:F===9?4:0,a:p.dx*1.5,stretch:air?30:22};
  p.gazeX=F>=24&&F<=28?-5:F>=29&&F<=33?5:0;
  if(closedAt(9,34))p.eyes='closed';
 }
 if(id==='walking'){
  // 身子不横移、地在走：θ 从 π 起——首帧一对脚刚落地（前 +8、后 −8）、包甩到最后；着地脚从 +8 单调滑到 −8，
  // 抬脚 8，双脚交叉时最高（jump −6）、触地时压扁（squash 3）；眨眼 34
  p.side=true;const th=TAU*t*2+Math.PI,S=8,g=Math.sin(th),c=Math.cos(th);
  p.footOffsets=[-S*c,S*c,-S*c,S*c];
  p.feet=[Math.max(0,g),Math.max(0,-g),Math.max(0,g),Math.max(0,-g)].map(v=>v*8);
  p.jump=-3*(1-Math.cos(2*th));p.squash=1.5*(1+Math.cos(2*th));p.lean=2+g;
  p.hands=[{x:78+8*g,y:218+p.jump+5*g,a:8*g},{x:203-8*g,y:218+p.jump-5*g,a:-8*g}];
  p.bag={x:-4+4*c,y:0,a:-8.5+8.5*c};
  p.tool.ground={speed:4,period:20};
  if(closedAt(34))p.eyes='closed';
 }
 if(id==='listening'){
  // 眼睛常开往下 5（用来表示「在听她说」），只在两端停拍 14/38 闭两帧；29–31 副歌蹦 5；手上下 ±11、身子摇 3.5°
  p.lean=3.5*sin(t,2);
  if(F>=29&&F<=31)p.jump=-5;
  p.hands=[{x:75,y:218+p.jump+11*sin(t,2),a:-10*sin(t,2)},{x:205,y:218+p.jump-11*sin(t,2),a:10*sin(t,2)}];
  p.gazeY=5;p.tool.headphones=true;
  if(closedAt(14,38))p.eyes='closed';
 }

 // 走跑共用一张表：走（flight 0）是双脚交叉时最高、触地压扁；跑（flight>0）是腾空时最高且拉长、全脚离地。
 // 身子不横移，地在滚（侧身才有地）；手跟着 jump 走；走跑不眨眼，只有慢悠悠走 28 帧眨一下、帽子懒懒地沉 3
 if(['strolling','running','sprinting','front-running'].includes(id)){
  const style={
   strolling:{c:2,bob:2.5,sq:2,foot:8,spread:6,handX:6,handY:5,flight:0,leanBase:0,sway:1},
   running:{c:3,bob:5,sq:3,foot:9,spread:10,flight:5,handX:12,handY:10,leanBase:3,sway:1},
   sprinting:{c:4,bob:5,sq:4,foot:9,spread:10,flight:5,handX:14,handY:12,leanBase:5,sway:1},
   'front-running':{c:3,bob:5,sq:3,foot:9,spread:0,flight:5,handX:0,handY:14,leanBase:0,sway:4}
  }[id];
  const c=style.c,th=TAU*t*c,S=style.spread,g=Math.sin(th),co=Math.cos(th),fl=style.flight*Math.max(0,Math.cos(2*th));
  p.side=id!=='front-running';p.dx=0;
  p.footOffsets=p.side?[-S*co,S*co,-S*co,S*co]:[0,0,0,0];
  p.feet=[Math.max(0,g),Math.max(0,-g),Math.max(0,g),Math.max(0,-g)].map(v=>Math.min(10,v*style.foot+fl));
  if(style.flight){p.jump=-style.bob*(1+Math.cos(2*th));p.squash=-style.sq*Math.cos(2*th);}
  else{p.jump=-style.bob*(1-Math.cos(2*th));p.squash=style.sq*(1+Math.cos(2*th))/2;}
  p.lean=style.leanBase+style.sway*g;
  p.hands=[{x:78+style.handX*g,y:218+p.jump+style.handY*g,a:9*g},{x:203-style.handX*g,y:218+p.jump-style.handY*g,a:-9*g}];
  if(id==='strolling'){p.hatDrop=curve(t,[[0,0],[.5,3],[1,0]]);if(closedAt(28))p.eyes='closed';}
  if(p.side)p.tool.ground=id==='strolling'?{speed:2,period:10}:id==='sprinting'?{speed:8,period:20}:{speed:4,period:20};
  if(id==='sprinting')p.tool.speed=Math.abs(g)>.5;
 }
 if(id==='hopping'){
  // 三个 15 帧的小跳：蹲 9、减速起到 −29、停、加速落（最后一步 ≥10）、落地那两帧最扁眼闭；空中四脚收 5 并往中间拢
  const f=F%15,q=f/15;
  p.jump=curve(q,[[0,0],[.14,0],[.40,-29,'o'],[.56,-29],[.80,0,'i'],[1,0]]);
  p.squash=curve(q,[[0,0],[.14,9],[.31,0],[.73,0],[.80,9],[.90,0],[1,0]]);
  const arm=curve(q,[[0,0],[.14,5],[.40,-34,'o'],[.56,-34],[.80,0,'i'],[1,0]]),inAir=p.jump<-5;
  p.hands=[{x:76,y:218+arm,a:inAir?-10:0},{x:204,y:218+arm,a:inAir?10:0}];
  const air=curve(q,[[.2,0],[.35,1],[.65,1],[.78,0]]);
  p.feet=[5,5,5,5].map(v=>v*air);p.footOffsets=[5,2,-2,-5].map(v=>v*air);
  if(f>=12&&f<=13)p.eyes='closed';
 }
 if(id==='jumping'){
  // 0–2 站，3–5 手先沉 5，6–10 加速蹲到 12（帽子沉 4、眼闭 8–12），11–12 憋住，13 一帧蹬起（−8、拉长 6），
  // 14–20 减速冲到 −78（手到 −88），21–23 顶点停三帧，16–27 四脚收 6 往中间拢，24–30 加速落（最后一步 ≥20），
  // 30 落地那一帧就是最扁 12、脚外劈、眼闭 30–32（原来 30 是「站回地上但什么都没发生」、31 才压扁，撞击隔了一帧才来），33–35 回弹，36–44 站
  p.jump=curve(F,[[0,0],[12,0],[13,-8],[20,-78,'o'],[23,-78],[30,0,'i'],[44,0]]);
  p.squash=curve(F,[[0,0],[5,0],[10,12,'i'],[12,12],[13,-6],[14,0],[29,0],[30,12],[32,12],[33,-3],[35,0],[44,0]]);
  p.hatDrop=F>=6&&F<=12?4:0;
  const arm=curve(F,[[0,0],[2,0],[5,5],[10,12,'i'],[12,12],[13,-10],[20,-88,'o'],[23,-88],[30,12,'i'],[32,12],[35,0],[44,0]]);
  const spread=curve(F,[[12,0],[15,8,'o'],[27,8],[30,0,'i']]);
  p.hands=[{x:77-spread,y:218+arm,a:-spread},{x:203+spread,y:218+arm,a:spread}];
  if(F>=16&&F<=27){p.feet=[6,6,6,6];p.footOffsets=[4,2,-2,-4];}
  if(F>=30&&F<=33)p.footOffsets=[-5,-2,2,5];
  if((F>=8&&F<=12)||(F>=30&&F<=32))p.eyes='closed';
 }
 if(id==='leaping'){
  // 两次向前跃：蹲着往后缩 10、减速跃到 −48 带着身子往前 12、停、加速落地（最后一步 ≥10）、
  // 落地那两帧压扁 10 并把回滑（12→3→0）压在里面，之后画布 x 不再溜；空中脚 [5,8,5,8] 收；眨眼 3/26；地在滚
  const q=(F/22.5)%1;p.side=true;
  p.dx=curve(q,[[0,0],[.15,-10],[.31,0],[.48,10],[.69,12],[.80,12],[.86,3],[.90,0],[1,0]]);
  p.jump=curve(q,[[0,0],[.15,0],[.42,-48,'o'],[.56,-48],[.80,0,'i'],[1,0]]);
  p.squash=curve(q,[[0,0],[.15,7],[.30,0],[.73,0],[.81,10],[.86,10],[.93,0],[1,0]]);
  const rear=curve(q,[[0,0],[.15,5],[.42,-43,'o'],[.56,-43],[.80,0,'i'],[1,0]]);
  const front=curve(q,[[0,0],[.15,5],[.42,-64,'o'],[.56,-64],[.80,0,'i'],[1,0]]);
  const reach=curve(q,[[0,0],[.15,0],[.40,9],[.62,9],[.82,0],[1,0]]);
  p.hands=[{x:78+p.dx-reach,y:218+rear,a:-reach},{x:203+p.dx+reach,y:218+front,a:reach}];
  const tuck=curve(q,[[0,0],[.25,0],[.40,1],[.63,1],[.78,0],[1,0]]);
  p.feet=[5,8,5,8].map(v=>v*tuck);
  p.tool.ground={speed:4,period:20};
  if(closedAt(3,26))p.eyes='closed';
 }
 if(id==='greeting'){
  // 右手 3–10 减速伸到帽檐、10–16 把帽子抬 12 并往手那边翘 8°、手跟着檐走 −20、13–29 点头（压 3、眼睛往下 4、左手沉 5）、
  // 24–30 放下帽子、30–39 加速收手；眼闭 18–21；删 lean
  const reach=curve(F,[[0,0],[3,0],[10,1,'o'],[30,1],[39,0,'i'],[44,0]]);
  const lift=curve(F,[[10,0],[16,1,'o'],[24,1],[30,0,'i']]);
  const nod=curve(F,[[13,0],[19,1],[24,1],[29,0]]);
  p.hands=[{x:76,y:218+5*nod,a:-4*nod},{x:202-14*reach,y:218-31*reach-20*lift+3*nod,a:-4*reach}];
  p.squash=3*nod;p.gazeY=4*nod;
  p.tool.hatLift=12*lift;p.tool.hatTilt=-8*lift;
  if(closedAt(18,20))p.eyes='closed';
 }
 if(id==='delighted'){
  // 两个 16 帧的小跳（第二跳矮一截）再静 13 帧：和轻轻蹦一样蹲 9、一帧大步、空中收脚、落地闭眼；手张开 8；心随帧号长大；眨眼 40
  const active=F<32,f=F%16,q=active?f/16:1,energy=F<16?1:.78;
  p.jump=active?energy*curve(q,[[0,0],[.14,0],[.40,-36,'o'],[.56,-36],[.80,0,'i'],[1,0]]):0;
  p.squash=active?curve(q,[[0,0],[.14,9],[.31,0],[.73,0],[.80,9],[.90,0],[1,0]]):0;
  const arm=active?energy*curve(q,[[0,0],[.14,5],[.40,-41,'o'],[.56,-41],[.80,0,'i'],[1,0]]):0;
  const spread=active?curve(q,[[.14,0],[.40,8],[.66,8],[.90,0]]):0;
  p.hands=[{x:76-spread,y:218+arm,a:-spread},{x:204+spread,y:218+arm,a:spread}];
  const air=active?curve(q,[[.2,0],[.35,1],[.65,1],[.78,0]]):0;
  p.feet=[5,5,5,5].map(v=>v*air);p.footOffsets=[5,2,-2,-5].map(v=>v*air);
  p.tool.heart=curve(F,[[0,.12],[5,.12],[12,.6],[18,.5],[26,1],[33,.9],[38,.55],[43,.12],[44,.12]]);
  if((active&&f>=13&&f<=14)||closedAt(40))p.eyes='closed';
 }
 if(id==='hugged'){
  // 被抱起来：全程离地 15，抱着的人一秒一晃（15 帧一圈、45 帧三圈）——身子左右各摆 5、上下颠 5、脚交替踢 5；
  // 双手被托在腋下举着（a ∓15，跟着身子走）、帽子被挤歪了——整顶往右挪一格 10（hatShift，不转不抬，帽檐整条留在头上）、眼睛往上看她；眨眼 22。
  // 原来是歪帽子 6°，引擎为了不压眼把帽子抬了 8，全程离头一道楔子；试过改成身子 lean 5，可眼睛抬 5 之后眼顶正好贴着身体顶，
  // 身子一转外侧那只眼就有两三行露在身体外头，所以歪帽子用「挪」不用「转」。没有道具没有特效
  const f=F%15;
  p.dx=5*Math.round(Math.sin(TAU*f/15))||0;
  p.jump=(f+4)%15<8?-15:-20;
  p.feet=f<8?[5,0,5,0]:[0,5,0,5];p.footOffsets=[8,4,-4,-8];
  p.hands=[{x:80+p.dx,y:185+(p.jump+15),a:-15},{x:200+p.dx,y:185+(p.jump+15),a:15}];
  p.tool.hatShift=10;p.gazeY=-5;
  if(closedAt(22))p.eyes='closed';
 }
 if(id==='fishing'){
  // 陪钓（侧身朝右）：右手持竿 45°，浮子每 3 帧沉浮 5；20–23 咬钩——浮子沉到 10 被鱼一帧一帧拽着抖、身子前倾 3 压 5、眼睛盯着浮子；
  // 24–25 两帧提竿 45→35→25（手往上收 8）、浮子带着鱼升到水面上 20；26–33 停着看鱼每帧摆尾，眨眼 30；34–35 竿放回 35、36 回 45 鱼回水里；
  // 36–47 持竿浮子接着沉浮接首帧。长杆只用三个角度加停拍，连续转会闪
  p.side=true;
  const ang=F<=23?45:F===24?35:F<=33?25:F<=35?35:45;
  const bob=F<=19?(Math.floor(F/3)%2?5:0):F>=36?(Math.floor((F-36)/3)%2?5:0):0;
  const dip=F>=20&&F<=23?10+(F%2?5:0):F>=24&&F<=33?-20:F>=34&&F<=35?-10:bob;
  const lifting=F>=24&&F<=35;
  p.hands=[{x:80,y:218,a:0},lifting?{x:195,y:210,a:0}:{x:200,y:218,a:0}];
  if(F>=20&&F<=23){p.lean=3;p.squash=5;}
  p.gazeX=F>=20&&F<=33?5:0;
  p.tool.rod={angle:ang,dip,fish:F>=24&&F<=33,wag:F%2};
  if(closedAt(30))p.eyes='closed';
 }
 if(id==='writing'){
  // 写信：右手执笔（笔杆斜 20°，整根留在两眼之间 x126–174，手不转只转笔、最右到 pose 145 不碰右眼列），左手按着纸的左边；0–3 笔停在纸头（首帧）；
  // 4/6/8 手每两帧往右走 5、走一步落一点；9–11 去纸右头的墨水瓶（手从眼睛下面绕过去、笔立直）、12–13 蘸两帧、14–16 回来；
  // 18/20/22 再走三步写满第一行六点；23–25 看纸；26–28 落到第二行；29 眨；31–39 第二行五点；40–41 提笔抬眼；
  // 42–43 写好的信往右推进包里、手回纸头；44 新纸=首帧
  const rx=curve(F,[[0,115],[3,115],[4,120],[5,120],[6,125],[7,125],[8,130],[9,138],[10,147],[11,155],[13,155],[14,147],[15,138],[16,130],[17,130],[18,135],[19,135],[20,140],[21,140],[22,145],[25,145],[26,135],[27,125],[28,115],[30,115],[31,120],[32,120],[33,125],[34,125],[35,130],[36,130],[37,135],[38,135],[39,140],[40,135],[41,135],[42,125],[43,115],[44,115]]);
  const ry=curve(F,[[0,223],[8,223],[9,226],[10,228],[14,228],[15,226],[16,223],[25,223],[26,225],[27,227],[28,229],[39,229],[40,223],[44,223]]);
  const pen=curve(F,[[0,20],[9,20],[10,10],[11,0],[13,0],[14,10],[15,20],[39,20],[40,30],[41,30],[42,20],[44,20]]);
  p.hands=[{x:96,y:234,a:0},{x:rx,y:ry,a:0}];
  const dipping=F>=9&&F<=13,done=F>=40&&F<=43;
  p.gazeY=F>=9&&F<=14||done?0:5;p.gazeX=dipping?5:0;
  p.tool.writing={row1:F>=44?0:[4,6,8,18,20,22].filter(f=>F>=f).length,row2:F>=44?0:[31,33,35,37,39].filter(f=>F>=f).length,paperDx:F===42?20:F===43?40:0,pen};
  if(closedAt(29))p.eyes='closed';
 }
 if(id==='yawning'){
  // 打哈欠（不摘帽，用「伸」）：39–44 与 0–5 是顶点（12 帧）——身子拉长 10（这本身就是「伸」，帽子跟着 body.y 走贴在头上；
  // 原来再给帽子 hatLift 8，顶点 17 帧帽檐和头之间都是一道 8px 的黑缝，首帧静图也是）、眼闭、
  // 右手捂在「嘴」上（pose y 232，画在 237–257：下半截压着马甲，皮肤对皮革的对比 70px 下看得见，也真在嘴的位置；眼区 218–223 不碰；
  // 手叠在身子上和皮肤一个色，用 skinSide 当阴影）、左手往外伸（pose x 65–70，画在 55–80，离身子不过 15px，原来飘到 25px 外像一块掉下来的肉）；
  // 39–40 帽子一下顶上去 8 作 accent、41 起落回；0 起（首帧）左手再探 5、右手再拍上去 5；3 一帧哆嗦（缩回 5）；
  // 6 一帧塌下来（squash 0）、7 泄成 5，6–9 双手绕回身侧；10 睁眼、11–15 左看右看；
  // 16–31 困：17 帽子沉 4，18–20 点头压到 10（眼闭 19–20），21 回 5，24 眨，26–28 再点一次头（眼闭 27–28），29 回 5，30 帽子浮回；
  // 32–38 预备：右手绕回嘴边（往下兜 10 从眼睛下面过）、左手伸出去、身子每两帧拉长 5，37 起闭眼。手的角度量到 5° 一档
  const apex=F>=39||F<=5,second=F<=5,q5=a=>Math.round(a/5)*5;
  if(apex){
   p.squash=F===3?-5:-10;
   if(F>=39&&F<=40)p.tool.hatLift=8;
   p.hands=[{x:second?65:70,y:second?195:200,a:-25},{x:140,y:second?232:237,a:0}];
   p.eyes='closed';
  } else if(F<=9){
   const u=(F-5)/4,o=1-(1-u)*(1-u);
   p.squash=F===6?0:5;
   p.hands=[{x:65+15*o,y:195+23*o,a:q5(-25*(1-o))},{x:140+60*o,y:232-14*o+10*Math.sin(Math.PI*u),a:0}];
   p.eyes='closed';
  } else if(F<=31){
   const nod=(F>=18&&F<=20)||(F>=26&&F<=28);
   p.squash=nod?10:5;
   p.hatDrop=F>=17&&F<=29?4:0;
   p.gazeX=F>=11&&F<=12?-5:F>=13&&F<=15?5:0;
   if(closedAt([19,20],24,[27,28]))p.eyes='closed';
  } else {
   const u=(F-31)/7,s=smooth(u);
   p.squash=F<=33?5:F<=35?0:-5;
   p.hands=[{x:80-10*s,y:218-18*s,a:q5(-25*s)},{x:200-60*s,y:218+19*s+10*Math.sin(Math.PI*u),a:0}];
   if(F>=37)p.eyes='closed';
  }
  if(p.hands[1].x+20<210)p.hands[1].color='skinSide';
 }
 if(id==='dice'){
  // 掷骰：0–6 双手捧在胸前摇（手一帧上一帧下 5，骰子跟着）、7–8 往下压 10 预备、9 一帧甩出（右手甩到右上、左手留在胸前）；
  // 9–13 两颗骰子贴着肚子低弧飞到右边地上（弧顶压在眼睛下面）、14–17 每帧滚 5 并翻 45°、18 停住点数朝上冒一颗星（18–20）；
  // 14–17 双手收回身侧；19–24 眼睛往右盯着看、25 眨；27 蹲、28–30 蹦 10 手举起、31 落；33–35 身子前倾右手去捡、36 骰子进手；39–43 双手回胸前、44=首帧
  // 骰子的 x 都落在 5 格上（手里 155/170、飞 155+75u、落点 250/265），手的角度量到 5° 一档
  const shake=F<=6?(F%2?5:0):F<=8?10:0,q5=a=>Math.round(a/5)*5;
  let L={x:140,y:232+shake,a:0},R={x:160,y:232+shake,a:0};
  if(F>=9&&F<=13){R={x:215,y:205,a:20};L={x:170,y:232,a:0};}
  else if(F>=14&&F<=17){const s=smooth((F-13)/4);R={x:215-15*s,y:205+13*s,a:q5(20*(1-s))};L={x:170-22.5*(F-13),y:232,a:0};}
  else if(F>=18&&F<=32){
   const air=F>=28&&F<=30;p.jump=air?-10:0;p.squash=(F===27||F===31)?5:0;
   const hy=218+p.jump+(air?-10:0)+p.squash;
   L={x:80,y:F===18?225:hy,a:air?-10:0};R={x:200,y:hy,a:air?10:0};
  }
  else if(F>=33&&F<=38){const s=smooth(Math.min(1,(F-32)/3));R={x:200+18*s,y:218+17*s,a:q5(10*s)};L={x:80,y:218,a:0};p.lean=3;}
  else if(F>=39&&F<=43){const u=(F-38)/5;R={x:218-58*u,y:235-3*u,a:0};L={...[{x:80,y:225},{x:80,y:232},{x:100,y:232},{x:120,y:232},{x:140,y:232}][F-39],a:0};}
  p.hands=[L,R];
  let dice=null;
  if(F<=8||F===44)dice={a:[155,241+shake],b:[170,241+shake],rot:0,faces:true};
  else if(F<=13){const u=(F-8)/5,y=251+10*u-22*Math.sin(Math.PI*u);dice={a:[155+75*u,y],b:[170+75*u,y],rot:F%2?45:0,faces:false};}
  else if(F<=17)dice={a:[230+5*(F-13),261],b:[245+5*(F-13),261],rot:F%2?45:0,faces:false};
  else if(F<=35)dice={a:[250,261],b:[265,261],rot:0,faces:true};
  p.tool.dice=dice;p.tool.star=F>=18&&F<=20;
  p.gazeX=F>=19&&F<=24?5:0;
  if(closedAt(25))p.eyes='closed';
 }
 if(id==='reading'){
  // 读信（正面，低头 gazeY +5）：双手夹着信的两边（pose y 233，画在 238–258），信在两眼之间（x130–170），眼睛的列一格不碰——
  // 工单写的 pose y 248 画出来是 253–273，手的下沿压到地上和脚连成一片，70px 下看着像四只大脚不像托着信，抬 15 让手底下留一行马甲；
  // 双手 skinSide——皮肤叠在皮肤身子上整只看不见，信像自己飘在肚子前面，换成侧面那一档才看得出是两只手夹着信；
  // 0–17 读第一页（两行字，隔 10 画，70pt 下各落一行、中间留一行白），每趟 6 帧——眼睛 −5/0/+5 各停 2 帧，换趟那一帧跳回 −5；18 右手往外 5 作预备；
  // 19 一帧翻页（右手甩到右上、信纸侧立成一根条）；20–31 读第二页（一行字加一颗 unit 5 的落款小心）；32 眼睛从行尾 +5 回到正中那颗心上；
  // 33–34 闭眼（33 压 5），闭眼时抬回 gazeY 0——手在 238 起，低着头再压 5 的闭眼会落到 238–243 被手盖住；35 一帧蹦 10，手和信一起抬、双手往里收把信捧到胸口，右上冒一颗心每两帧上一格；
  // 36 落地压 5（帽子跟着收尾差分落回头上，不手写负的滞后）；39–41 回到读的姿势；42 侧立条翻回第一页；43–44 眼睛回到行首 −5，与首帧逐像素全等
  const line=f=>[-5,-5,0,0,5,5][f%6];
  const hug=F>=35&&F<=38,flip=F===19||F===42;
  p.jump=F===35?-10:0;p.squash=F===33||F===36?5:0;
  p.gazeY=5;
  if(F<=17)p.gazeX=line(F);
  else if(F<=19)p.gazeX=5;
  else if(F<=31)p.gazeX=line(F-20);
  else if(F===32)p.gazeX=0;
  else if(F<=34||hug)p.gazeY=0;
  const hy=233+p.jump;
  p.hands=hug?[{x:125,y:hy,a:0},{x:155,y:hy,a:0}]:[{x:120,y:hy,a:0},{x:F===18?165:160,y:hy,a:0}];
  if(flip)p.hands[1]={x:190,y:225,a:0};
  p.hands=p.hands.map(h=>({...h,color:'skinSide'}));
  if(F>=43)p.gazeX=-5;
  p.tool.letter={page:flip?0:F>=20&&F<=41?2:1,lift:p.jump};
  // 马甲上的怀表不画：其余帧它本来就压在信底下，只有翻页那两帧（19、42）信纸侧立成一根条，怀表从条右边露出一块金，70pt 下是一粒黄点贴在信边上
  p.tool.watch=true;
  if(F>=35&&F<=41)p.tool.heart={x:225,y:188-5*Math.floor((F-35)/2)};
  if(closedAt(33))p.eyes='closed';
 }
 if(id==='stargazing'){
  // 看星星（侧身朝右，仰头 gazeY −5）：右手举一支短望远镜，镜筒只用 45°/25°/135° 三个角、靠停拍过渡（连续转会闪）；
  // 0–19 举镜 45° 望着，天上一大两小三颗星各自一闪一闪（5–6 眨眼——14–15 跟听音乐撞了整两帧，18–19 又是扶帽致意的 18–21，5–6 全片没人用）；20–23 一颗流星从右上往左下划过；
  // 24 一帧把镜筒甩到 25° 追过去、手抬 10 往外 15（手 x 195 时 25° 的镜筒正压在右檐尖上，210 才和帽檐隔开 7px，45° 那几帧本来就隔 5），25–27 停住；
  // 28 放下来——镜筒斜着垂到右下（135°），身子先压 5 作预备；原来是 90° 横着架在侧眼正下方一行，70pt 下读成吹喇叭、一根长鼻子，闭眼许愿那几帧更像闭着眼吹号。
  // 135° 时手 pose (200,228)：画在 210–230×233–253 贴着身子右缘，镜筒远端落到 y271，不越基线、不压脚、不进眼睛那一列；手再低 10 镜筒底就出了脚底线。
  // 29 一帧蹦 10、30 落地压 5——这两帧眼睛平视（gazeY 0）：仰着头的话帽檐上限被压成 0，收尾差分算出来的帽子滞后被夹没了，帽子像钉在头上一起弹；平视让上限回到 4，帽子落后一拍。
  // 31–38 闭眼许愿、帽子沉 5；39 睁眼；40 一帧举回 45°（从 135° 转回来跨 90°，像真的举回去）、眼睛跟着回到右上；41–47 姿势与首帧全等，只有星星照着自己的相位接着闪（闪烁本身是连着的）。
  // 镜筒和手一帧都不进侧眼那一列（x180–200）
  p.side=true;p.gazeY=F===29||F===30?0:-5;
  const scope=F<=23?45:F<=27?25:F<=39?135:45;
  p.jump=F===29?-10:0;p.squash=F===28||F===30?5:0;
  const R=scope===45?{x:195,y:215}:scope===25?{x:210,y:205}:{x:200,y:228};
  p.hands=[{x:80,y:218+p.jump,a:0},{x:R.x,y:R.y+p.jump,a:0}];
  p.gazeX=F<=27||F>=40?5:0;
  if(F>=31&&F<=38){p.eyes='closed';p.hatDrop=5;}
  if(closedAt(5))p.eyes='closed';
  p.tool.scope=scope;
  // 星星 6 帧一圈、亮 4 灭 2，三颗的相位错 0/1/2 帧——每圈头两帧三颗全亮（首帧就是），错 2 帧的话三段灭期正好铺满一圈、总有一颗是灭的
  p.tool.stars=[0,1,2].map(k=>(F+k)%6<4);
  p.tool.meteor=F>=20&&F<=23?F-20:-1;
 }
 if(id==='phone'){
  // 打电话（正面）：右边立着一台老式烛台电话，左手全程举着听筒贴在头侧（手跟着身子的压扁一起上下，听筒不离耳朵）；
  // 0–17 听，6–7、12–13 点两次头（压 5、帽子沉 5、眼睛往下 5——睁眼时帽子要沉 5 得先低头，不然会被收尾夹回 4）；
  // 1–2 眨眼（9 跟 error 撞了，1–2 老动作里没人用）；18–19 吸一口气（拉长 5）；20 一帧凑过去——身子右移 10、前倾 3，右手一把握住电话杆，左手跟着挪 10；左手 skinSide、贴住身子左边（离身子 5px 是悬在半空，听筒也成了头外面孤零零一个「Г」）；
  // 21–35 说话，每 3 帧压一下 5，21/24/27/30/33 话筒右边冒两道金色的「))」各亮两帧，32–33 闭眼笑（原来 30–31，和陪钓的眨眼撞了整两帧）；
  // 36 一帧退回原位；37–44 与首帧全等
  const near=F>=20&&F<=35;
  p.dx=near?10:0;p.lean=near?3:0;
  if([6,7,12,13].includes(F)){p.squash=5;p.hatDrop=5;p.gazeY=5;}
  if(F===18||F===19)p.squash=-5;
  if(F>=21&&F<=35)p.squash=Math.floor((F-21)/3)%2?5:0;
  p.hands=[{x:80+p.dx,y:205+p.squash,a:0,color:'skinSide'},near?{x:220,y:228,a:0}:{x:200,y:218,a:0}];
  p.tool.talk=[21,24,27,30,33].some(f=>F>=f&&F<=f+1);
  if(closedAt(1,32))p.eyes='closed';
 }
 if(id==='painting'){
  // 画画（侧身朝右）：右边一架画架，画布上一颗红心；右手执笔（笔杆斜 30°，只往画布那边斜），左手托着调色板（跟着左手走）；
  // 0–3 心已画好、笔举在画布旁边（笔尖蘸着金色）；4 一帧往前伸 10 点上高光；5–6 收回；
  // 7 一帧退后一步（dx −10、往后仰 3，手跟着走）；8–15 仰头端详，9–12 画布右上冒一颗小星，11–12 闭眼；16 走回来；
  // 17、18、19 右手把画布往上推 25、45、60 挂上去——一帧比一帧慢（25/20/15），像滑上钩子停住；19 那一拍画布顶到 128 还在画里，挂好了手才松开；
  // 原来 18 推到 148 下一帧就没了、手同一帧掉回 213，「挂上去」没有落点，看着像画被收进了口袋；
  // 20 换一张新的白画布，笔尖换成红的，手落回第一行起笔的位置；
  // 20–37 六笔画一颗新心，每笔 3 帧：手在这一行的高度（pose y = 行 y+5）从 x200 一帧刷到 210、这一行就出现、停一帧，全程前倾 3；
  // 23–24 眨眼（原来 29–30，和写信、爱心小跳撞了整两帧）；
  // 38–44 心画完没有高光、笔尖换回金色，与首帧全等
  p.side=true;p.gazeX=5;
  const rest={x:200,y:208};let R={...rest};
  if(F===4){p.dx=10;R={x:215,y:198};}
  else if(F>=7&&F<=15){p.dx=-10;p.lean=-3;R={x:190,y:208};p.gazeY=-5;}
  else if(F>=17&&F<=19){R={x:200,y:208+[-25,-45,-60][F-17]};p.gazeY=-5;}
  else if(F>=20&&F<=37){const k=Math.floor((F-20)/3),f=(F-20)%3;p.lean=3;R={x:f?210:200,y:203+5*k};}
  p.hands=[{x:80+p.dx,y:218,a:0},R];
  p.tool.paint={
   rows:F>=20&&F<=37?Math.floor((F-20)/3)+((F-20)%3?1:0):6,
   shine:F>=4&&F<=19,lift:F>=17&&F<=19?[-25,-45,-60][F-17]:0,
   star:F>=9&&F<=12,tip:F>=20&&F<=37?'red':'goldLight'
  };
  if(closedAt(11,23))p.eyes='closed';
 }
 if(id==='dizzy'){
  // 晕乎乎（正面）：帽子钉在原地不动，身子在帽子底下晃——dx 按 +10,+10,0,0,−10,−10,0,0 八帧一圈，hatShift 取 −dx 把帽子挪回来
  // （帽子比身子宽 20，挪 10 不露头，被抱起来验过）；手跟着身子走，脚只跟一半（±5），像站不稳；
  // 0–17 大摆；18 一帧腿软（压 10、手往下坠 10）；19 弹回来（拉长 5、手往上 5）；20–29 同样的节拍、幅度减半到 5（脚钉住不动）；
  // 30–33 回神，两眼睁开先往左看再往右看；34–35 回到 dx +10 接第 0 帧。
  // 0–29 两只眼一睁一闭、每 4 帧换一边（首帧左睁右闭）；三颗金星绕着帽顶转，12 帧一圈、彼此差 4 帧，36 帧正好三圈
  const sway=[10,10,0,0,-10,-10,0,0];
  if(F<=17)p.dx=sway[F%8];
  else if(F===18)p.squash=10;
  else if(F===19)p.squash=-5;
  else if(F<=29)p.dx=sway[(F-20)%8]/2;
  else if(F>=34)p.dx=10;
  p.tool.hatShift=-p.dx;
  const foot=(Math.abs(p.dx)===10?-Math.sign(p.dx)*5:-p.dx)||0;
  p.footOffsets=[foot,foot,foot,foot];
  const hy=218+(F===18?10:F===19?-5:0);
  p.hands=[{x:80+p.dx,y:hy,a:0},{x:200+p.dx,y:hy,a:0}];
  if(F<=29)p.eyes=Math.floor(F/4)%2?['closed','open']:['open','closed'];
  else if(F<=33){p.eyes='open';p.gazeX=F<=31?-5:5;}
  else p.eyes=['open','closed'];
  p.tool.orbit=[0,4,8].map(k=>(F+k)%12);
 }
 if(id==='blushing'){
  // 害羞脸红（正面）：两颊各一块红（tool.blush），双手 skinSide 托在红脸下面（画出来落在 body.y+30，左右对称）；
  // 0–7 托腮、压 5、闭眼；8–15 右手放下来甩到身侧、睁眼往右偷看她；
  // 16 一帧被她看见——右手拍回去、压 10、帽子沉 5、眼睛挤紧（闭眼时往上抬 5，红脸跟着让开包），右上冒一颗小心；17 回到压 5；
  // 18–23 扭到左边 dx −10；24 一帧跳到 +10（跨 20，全片最大的一步），停到 29；30 回到中间压 10、挤眼；31–44 回到首帧的托腮。
  // 3–4、37–38 帽子往下沉 5，像缩了缩脖子——不然 31–44 接 0–7 连着 22 帧一动不动，循环放着像一张贴图（左右扭不行：包会自动甩进右脸）
  // 心 16–29 每两帧往上 5，30 消失。24 那一帧包的自动甩动会把包角甩进右脸，这一帧把包摆正；
  // 包不能甩，跨 20 那一步就让帽子落后身子一格（hatShift −5，25 归位，照晕乎乎的办法——帽宽 140 挪 5 仍盖住身子 120，檐下不开缝），不然整个人像被平移了一格；
  // 18–23 眼睛往左看、24–29 往右看（gazeX ∓5），跟着扭的方向别开脸，不再是原地挪两步盯着她
  const peek=F>=8&&F<=15,squeeze=F===16||F===30;
  p.squash=squeeze?10:5;
  p.dx=F>=18&&F<=23?-10:F>=24&&F<=29?10:0;
  if(!(peek||(F>=18&&F<=29)))p.eyes='closed';
  if(squeeze)p.gazeY=-5;
  if(peek)p.gazeX=5;
  if(F>=18&&F<=23)p.gazeX=-5;
  if(F>=24&&F<=29)p.gazeX=5;
  if(F===16||[3,4,37,38].includes(F))p.hatDrop=5;
  const hy=233+Math.min(p.squash,5);
  p.hands=[{x:105+p.dx,y:hy,a:-15,color:'skinSide'},peek?{x:195+p.dx,y:hy+5,a:0,color:'skinSide'}:{x:175+p.dx,y:hy,a:15,color:'skinSide'}];
  if(F===24){p.bag.a=-40;p.tool.hatShift=-5;}
  p.tool.blush=true;
  if(F>=16&&F<=29)p.tool.miniHeart={x:230,y:183-5*Math.floor((F-16)/2)};
 }
 if(id==='teary'){
  // 委屈（正面）：全程压 5、低头 gazeY +5、帽子沉 5（帽檐底到眼顶留 5），睁着的眼右上各叠一块白高光（tool.gloss）；
  // 双手 skinSide 在胸前戳手指：画出来落在 body.y+25（工单写 +35，手底会压进脚里连成一片，抬 10 让手和脚之间留一行马甲），
  // 每 3 帧合拢一次、再各往外分开 5（合拢在 1、4、7…，首帧和末帧都是分开的，接缝为零）；
  // 15–16 闭眼（原来 16–17，和害羞被看见挤眼那两帧整两帧撞）；20 一帧抽泣（身子多压 5、手一帧往上 15——身子压下去会把手带下 5，
  // 原来写往上 10 被吃掉一半，画出来手只比邻帧高 5，四个情绪里只有它没有一处 ≥10 的大步；现在手画在 228–248，比邻帧高 10，
  // x125–145 / 155–175 和睁眼 115–125 / 175–185 相邻不重叠），35 再抽一次，21、36 身子和手自然回落就是跟随；40–43 抬眼看她（gazeY −5，帽子直接回到 0）；44 重新低头接首帧。
  // 泪 blue 10×10 在 effects 层（5 宽到 70pt 只剩 1px 一道线，看不见）：左边一滴 x105（往外让 5 不压眼），44、0–3 挂在眼边 y233，4–11 每两帧往下 5 到 253 停住，12–13 落地变一个 10×5 的点；
  // 右边一滴 26–29 挂着、30–37 往下落、38–39 落成点，点落在 x205（第四只脚 195–205 的右边，和左边落在第一只脚左边的 x95 对称；
  // 原来落在 x190，和第四只脚叠了 5 列，泪点在 effects 层最上面，盖掉脚 25 个皮肤像素，70pt 下右脚底一块蓝）。泪不落到脚上，首帧就挂着一滴
  const sob=F===20||F===35;
  p.squash=sob?10:5;p.gazeY=5;p.hatDrop=5;
  if(F>=40&&F<=43){p.gazeY=-5;p.hatDrop=0;}
  const spread=F%3===1?0:5,hy=208+p.squash+20-(sob?15:0);
  p.hands=[{x:140-spread,y:hy,a:0,color:'skinSide'},{x:140+spread,y:hy,a:0,color:'skinSide'}];
  p.tool.gloss=true;
  const tear=(x,hang,start,dotX)=>{
   if(hang.includes(F))return {x,y:233};
   if(F>=start&&F<start+8)return {x,y:238+5*Math.floor((F-start)/2)};
   if(F>=start+8&&F<start+10)return {x:dotX,y:268,dot:true};
   return null;
  };
  p.tool.tears=[tear(105,[44,0,1,2,3],4,95),tear(185,[26,27,28,29],30,205)];
  if(closedAt(15))p.eyes='closed';
 }
 if(id==='pouting'){
  // 鼓脸：0–17 正面鼓着腮（tool.puff，身子左右各鼓出 10×15，那一行宽 140，正好齐帽檐），半眼往左斜瞟，双手 skinSide 抱在胸前；
  // 5–6、36–37 眼珠偷瞄她一眼再别回去（gazeX −5→+5，跨 10）——不然 43–44 接 0–9 连着 12 帧一个像素不动、31–40 又是 10 帧，循环放着像一张贴图；
  // 「哼」拆成一吸一呼：10 吸一口（拉长 5，腮还鼓着），11 一帧呼出去（压 5，身子一帧变 10，腮泄了），两团灰气从两腮外侧冒出来，
  // 12、13 各往外走 10、往上 5（腮重新鼓起来），14 散掉；
  // 18–23 侧身扭开（朝右、gazeX +5，就是不看她）：只露一只半眼、不鼓腮、手垂下（原稿是背影，引擎画不出背面，包和表链会留在正面）；
  // 24–27 一帧转回正面，两眼睁圆、腮也泄了——被她撞见了；28 再扭回侧身，从脸前哼一团气（29、30 往外走）；
  // 31 回到首帧的鼓腮抱手，41–42 眨眼
  const side=(F>=18&&F<=23)||(F>=28&&F<=30),caught=F>=24&&F<=27;
  if(side){p.side=true;p.eyes='half';p.gazeX=5;}
  else if(caught)p.eyes='open';
  else {p.eyes='half';p.gazeX=[5,6,36,37].includes(F)?5:-5;p.tool.puff=F!==11;}
  if(F===10)p.squash=-5;
  if(F===11)p.squash=5;
  // 抱手：工单 pose y 238 画出来是 243–263，手底正贴着脚顶连成一条，抬 5 留一行马甲；吸气那一帧手跟着身子抬，呼气那一帧不跟着压（压下去又贴脚了）
  p.hands=side?[{x:80,y:228,a:0},{x:200,y:228,a:0}]:[{x:135,y:233+Math.min(0,p.squash),a:0,color:'skinSide'},{x:165,y:233+Math.min(0,p.squash),a:0,color:'skinSide'}];
  // 正面哼的气起点 x65 / 225：腮宽到 80–90、210–220，气从腮外 5 起，effects 层的气不压在腮上
  const k=F>=11&&F<=13?F-11:F>=28&&F<=30?F-28:-1;
  if(k>=0)p.tool.huffs=F<=13?[{x:65-10*k,y:225-5*k,dir:-1},{x:225+10*k,y:225-5*k,dir:1}]:[{x:215+10*k,y:225-5*k,dir:1}];
  if(closedAt(41))p.eyes='closed';
 }
 if(id==='lantern'){
  // 提灯（正面，48 帧，和待机一样是等人的循环）：夜里她还没走到，他提一盏灯立在水上等。
  // 一口气照待机的曲线、相位挪到 8（8–12 长高 5、停到 24、28 落回），双手跟着身子一起起落；
  // 右手 pose (215,195) 举在身子右外侧（画在 225–245×200–220，离身子右缘 15），灯从手底下吊下来——灯体 25×30 加提环共 35 高；
  // 灯随呼吸晃一格：0–11/12–23/24–35/36–47 往右 0/5/0/5，一帧到位；只往右晃，往左 5 会压到包角（包画到 x224）；
  // 火苗两帧一跳（F%4≥2 高火苗）；光团跟着那口气走（复审后）：12–27 身子抬着时大光团，其余小光团——原来光团和火苗绑在同一个两帧节拍上，
  // 70pt 下光团的边每两帧胀一圈缩一圈，是 7.5Hz 的闪边，不像烛火；现在火苗照旧忽闪，光一口气亮一回。首帧是小火苗小光团、灯不晃、平视、睁眼；
  // 21–22、44–45 眨眼（48 帧才有的位置，没人用）；30–37 抬眼往右上看远处（她来的方向）；
  // 38–41 低头看水面、帽子沉 5（睁眼平视帽檐只让得出 4，要沉 5 得先低头）；42–47 回首帧姿势，47→0 只差灯晃回来那 5，火苗照自己两帧一跳的相位接着走
  p.squash=curve(F,[[0,0],[8,0],[12,-5,'o'],[24,-5],[28,0,'i'],[47,0]]);
  p.hands=[{x:80,y:218+p.squash,a:0},{x:215,y:195+p.squash,a:0}];
  p.tool.lantern={dx:Math.floor(F/12)%2?5:0,tall:F%4>=2,glow:F>=12&&F<=27};
  if(F>=30&&F<=37){p.gazeX=5;p.gazeY=-5;}
  if(F>=38&&F<=41){p.gazeY=5;p.hatDrop=5;}
  if(closedAt(21,44))p.eyes='closed';
 }
 if(id==='pointing'){
  // 指路（正面，朝东）：首帧就是指着的姿势（像看怀表首帧就是举表），西边由接入方 scaleX(-1) 镜像，静图镜像也干净。
  // 右手 pose (220,213) 伸出去，画在 230–250×218–238——离身子 20，全片唯一，靶子是远处；手前头伸出一截食指（tool.point，props 层 skin 10×5）；
  // 帽子往指的那边挪 5（hatShift）、眼睛往右 5；2–3 眨眼；10–12 点头「那边」（压 5、低头 5、帽子沉 5），伸出去的手不跟身子压——
  // 点头这三帧眼睛回到正中往下看路（gazeX 0）：工单原样是右 5 下 5 再压 5，右眼落到 180–190×223–243，右下角那 1×5 正好塞进包角（包从 x189、y238 起），
  // 每帧被包盖掉 5 个像素；
  // 16–17 收一下（手回到 205、帽子回正），18 一帧再指出去——跨 15 的大步，帽子过冲到 10，19 回到 5；19–27 停住；
  // 28–31 回头看她一眼（gazeX 0，「是那边」），32 起又看回去；36 手抖一下回到 210、37 回 220（10 一步）；38–44 与首帧全等。
  // 复审后：身子右缘到手之间补一截小臂（engine 里画，props 层 skin，宽 = 手离身子的距离、高 10）——手离身 20 又没有胳膊，
  // 70pt 下是一块悬在身子右边的粉方块，读成「右边有个什么」多过「在指」；补上之后是一根从身上伸出去的粉色横杠。
  // 西边（opts.west）：两手左右对调、帽子和眼睛往左，四肢坐标和东边逐帧镜像（左手画面 x = 280 − 东边右手画面 x），
  // 包、表链、帽带那块深色照旧在右边——接入方的 scaleX(-1) 会把包也翻到左边，和别的状态摆在同一屏时包会左右跳，这个版本不会
  const W=opts.west?-1:1;
  let rx=220,shift=5;
  if(F===16||F===17){rx=205;shift=0;}
  else if(F===18)shift=10;
  else if(F===36)rx=210;
  p.hands=opts.west?[{x:280-rx,y:213,a:0},{x:200,y:218,a:0}]:[{x:80,y:218,a:0},{x:rx,y:213,a:0}];
  p.tool.point={finger:true,...(opts.west?{west:true}:{})};p.tool.hatShift=W*shift||0;
  // 42–43 再回头看她一眼（复审后）：37–44 接 0–1 原来 70pt 下连着 10 帧一个像素不动，比 v8 修过的那条线（9 以内）多一帧；
  // 看一眼再看回去，最长静止段落回 19–27 那 9 帧。44 照旧和首帧全等，接缝 0
  p.gazeX=(F>=28&&F<=31)||F===42||F===43?0:W*5;
  if(F>=10&&F<=12){p.squash=5;p.gazeY=5;p.hatDrop=5;p.gazeX=0;}
  if(closedAt(2))p.eyes='closed';
 }
 if(id==='waving'){
  // 挥手（正面）：她走到附近了，右手举过帽顶左右挥。和扶帽致意分开——那只手在帽檐（画面 y174–194、帽子被抬 12），这只在帽顶之上：
  // A 位 pose (190,140,a:15) 画在 200–220×145–165，B 位 (160,140,a:−15) 画在 170–190×145–165，帽顶在 168；A↔B 一帧 30。
  // 0–2 A，3 B，6 A，9 B，12 A，15 B，18 A：三个来回，每次挪的那一帧身子拉长 5（手跟着一起抬 5，手底到不了帽顶那一行）；
  // B 那几帧身子往左摆 5（dx −5），包随 dx 自动甩 10°，不手写；3–8、12–17 笑着闭眼，9–11 睁一下；
  // 19–26 举在 A 位停住，22–23 点个头（压 5、低头 5、帽子沉 5）；27 一帧放到半路 (200,185)，28–40 手垂在身侧，35–36 眨眼；
  // 41 一帧举到半路，42 回到 A 位，43–44 与首帧全等。没有道具没有特效，tool.wave 只给 check-art 认「手在帽子上头」的帧
  const A={x:190,y:140,a:15},B={x:160,y:140,a:-15},MOVES=[3,6,9,12,15,18];
  const atB=F<=18&&MOVES.filter(m=>F>=m).length%2===1;
  if(MOVES.includes(F))p.squash=-5;
  if(atB)p.dx=-5;
  if(F===22||F===23){p.squash=5;p.gazeY=5;p.hatDrop=5;}
  const wave=F<=26||F>=42;
  const R=wave?(atB?B:A):F===27||F===41?{x:200,y:185,a:0}:{x:200,y:218,a:0};
  p.hands=[{x:80,y:218,a:0},{...R,y:R.y+(wave?p.squash:0)}];
  p.tool.wave=wave;
  if(closedAt([3,8],[12,17],35))p.eyes='closed';
 }
 if(id==='umbrella'){
  // 打伞（正面）：伦敦下雨了，他左手举一把红伞站在雨里。左手 pose (90,175) 画在 80–100×180–200，攥着伞杆压在帽子左端那几行上——
  // 不压 201–208 的檐，左檐那枚 hatRim 尖留着（盖掉它，70pt 下右边那枚就像粘了个脏像素）；右手垂在身侧；两只手都不跟身子压
  // 伞（tool.umbrella）杆列 x90、伞顶 y135，六行阶梯伞面 40–145×135–165，最宽那行离帽顶 168 空 3 行，一粒不叠在帽子上；
  // 雨（tool.rain = F%3）五列斜着落，一根都不进 x90–210（那里有眼睛和脚），伞左尖外再挂一滴往下掉（tool.drip = F%9）；45 帧正好 15 圈雨、5 滴，接得上。
  // 6–7 眨眼（老动作里没人用）；8–13 抬眼看伞（gazeY −5）；
  // 20 一阵风把伞面一帧掀起来——右 10、上 5，杆和柄不动，他还没反应过来；21 才缩脖子（压 5、帽子沉 5）、闭眼 21–23，先有风、后有人；
  // 22 伞面落回一半（右 5），人还缩着；23 伞面归位、身子起来、眼睛还闭着；24 睁眼
  // 30–35 往左看伞外的雨（gazeX −5）；36–44 与首帧全等
  p.hands=[{x:90,y:175,a:0},{x:200,y:218,a:0}];
  p.tool.umbrella=F===20||F===21?{dx:10,dy:-5}:F===22?{dx:5,dy:0}:{dx:0,dy:0};
  p.tool.rain=F%3;p.tool.drip=F%9;
  if(F===21||F===22){p.squash=5;p.hatDrop=5;}
  if(F>=8&&F<=13)p.gazeY=-5;
  if(F>=30&&F<=35)p.gazeX=-5;
  if(closedAt(6,[21,23]))p.eyes='closed';
 }
 if(id==='stretching'){
  // 伸懒腰（睡着 → 待机的过渡，接入方放一遍 3 秒就切 idle，不循环；handoff 写在 STATES 里）：
  // 0–3 和睡着 0–3 逐像素全等——躺着、闭眼、同一条吸气曲线（0,−1,−2,−2）、包跟着抬、两只 Z 照睡着的年龄冒；从睡着任意帧切过来缝最多 5；
  // 4–5 还躺着，Z 没了、眼睛半睁（睡姿的半眼画在 232–242，马甲 248 起，不撞）；
  // 6 一帧坐起来：不睡了、身子压 10（90–210×218–263，正好睡姿的高度、两边各宽 5），帽子还躺在地上（tool.hatAside），
  // 右手按着地上的帽子（画在 220–240×248–268）；包这一帧从胸前跳到右腰——躺着是抱着、坐起来是挎着；
  // 7 一帧把帽子扣回头上（178–218），右手扶在檐右端（画 205–225×195–215）；8 两手回到身侧；9 身子起来一半；10–11 已是待机的身子，眼还半睁；12 睁眼；
  // 12–14 两手一帧一帧举过头顶：先到帽檐（90–110 / 190–210×195–215）、再到帽子两边（压在帽子上，手层在帽层上头），
  // 14 身子拉长 10、两手各歪 10° 举到 135–155，手底在帽顶 158 之上；闭眼 14–22；
  // 15–16 帽子被顶起来 10（tool.hatLift），手再往上够 5；17–18 帽子一帧砸回头上、沉 5，手回到 130；19–22 举着停住；
  // 23 一帧放到帽檐、身子落回一半、眼半睁；24 两手垂下；
  // 25–30 打个小哈欠：右手 skinSide 捂在嘴上（画 150–170×237–257，打哈欠捂嘴的位置），左手往外一伸、歪 15°；26–29 身子拉长 5，手不跟；闭眼 25–30；
  // 31 右手从眼睛底下绕回来（画 185–205×245–265；直接回身侧会扫过右眼那一列），左手先回身侧；眼半睁 31–35；32 两手都在身侧；
  // 33–34 帽子沉 5（半眼让得出）；36 睁眼；37–39 往右看看天亮了没；40–44 与待机首帧逐像素全等
  const D=[{x:80,y:218,a:0},{x:200,y:218,a:0}];
  if(F<=5){
   p.sleep=true;
   if(F<=3){p.eyes='closed';p.squash=curve(F,[[0,0],[12,-5,'o']]);p.bag.y=p.squash*.6;p.tool.zAges=[F%15,(F+8)%15];}
   else p.eyes='half';
  } else {
   p.hands=D.map(h=>({...h}));
   if(F<=8){
    p.squash=10;p.eyes='half';
    p.hands=[{x:80,y:228,a:0},F===6?{x:210,y:243,a:0}:F===7?{x:195,y:190,a:0}:{x:200,y:228,a:0}];
    if(F===6)p.tool.hatAside=true;
   }
   else if(F===9){p.squash=5;p.eyes='half';}
   else if(F<=11)p.eyes='half';
   else if(F===12)p.hands=[{x:100,y:190,a:0},{x:180,y:190,a:0}];
   else if(F===13){p.squash=-5;p.hands=[{x:110,y:160,a:0},{x:170,y:160,a:0}];}
   else if(F<=22){
    const y=F===15||F===16?125:130;
    p.squash=-10;p.eyes='closed';
    p.hands=[{x:115,y,a:-10},{x:165,y,a:10}];
    if(F===15||F===16)p.tool.hatLift=10;
    if(F===17||F===18)p.hatDrop=5;
   }
   else if(F===23){p.squash=-5;p.eyes='half';p.hands=[{x:100,y:190,a:0},{x:180,y:190,a:0}];}
   else if(F===24)p.eyes='half';
   else if(F<=30){
    p.squash=F>=26&&F<=29?-5:0;p.eyes='closed';
    p.hands=[{x:70,y:200,a:-15},{x:140,y:232,a:0,color:'skinSide'}];
   }
   else if(F<=35){
    p.eyes='half';
    if(F===31)p.hands=[{...D[0]},{x:175,y:240,a:0}];
    if(F===33||F===34)p.hatDrop=5;
   }
   else if(F<=39)p.gazeX=F>=37?5:0;
  }
 }
 return p;
}
// 收尾：拿上一帧（环绕，首末帧天然接上）做差分——身体往上冲帽子落后（正）、往下落帽子浮起（负），包随横移甩、随起落颠；
// 手贴到身体两侧（左 x−10、右 x+10、y+5，睡姿的手由 render 写死所以跳过）；帽子不许压到眼睛：
// 帽檐底 = body.y+hatLag+hatDrop−hatLift，睁眼顶 body.y+5+gazeY、闭眼顶 body.y+20+gazeY，身体一倾帽子跟着转，外侧眼那头再让出 dip。
// 帽子也不许离头：帽檐底正好画在 body.y 上，hatLag 一负就是一道透明缝——只有姿势自己写了负基值（报错吓飞 −15）才许到 −10，
// 空中下落最多浮 5（一格，70pt 下一线），脚一沾地（jump 0）帽子必须在头上。v7 第一版夹到 −10 让落地帧帽子悬在头顶 7–10px，这里治回来。
// 最后所有坐标取整：恰落 .5 的矩形会多画一行，这里一次治完。
function pose(id,frame,opts={}){
 const s=STATES.find(s=>s.id===id),N=s.frames;
 const p=poseRaw(id,frame,opts),q=poseRaw(id,(frame-1+N)%N,opts);
 const hatBase=p.hatLag;
 if(!p.sleep){
  p.hatLag+=0.5*(q.jump-p.jump);
  p.bag.a+=2*(p.dx-q.dx);p.bag.y+=0.3*(q.jump-p.jump);
  p.hands=p.hands.map((h,n)=>({...h,x:h.x+(n?10:-10),y:h.y+5}));
 }
 const dip=Math.ceil(35*Math.sin(Math.abs(p.lean)*.7*Math.PI/180));
 // 帽檐最多压到最高那只眼的顶上 4：睁眼顶在 0、半眼让出 10、闭眼让出 15（眼睛逐只写成数组时取最高的那只）
 // 新动作多了三种眼睛：hidden（不画）让出 15、和闭眼一样随帽子沉；dot（小方点 10×10，画在格子中间）、star（星星眼 15×15）顶都在 +5，让出 5。
 // 老的三种照旧 0/10/15——老动作里没有一帧写过 hidden，这张表对它们和原来那条三元式逐帧同值
 const eyeTop=Math.min(...[].concat(p.eyes).map(k=>EYE_CLEAR[k]??0));
 const limit=Math.max(0,Math.min(12,eyeTop+4+Math.round(p.gazeY)-dip));
 const hatFloor=hatBase<0?-10:(Math.round(p.jump)<0?-5:0);
 p.hatLag=clamp(Math.round(p.hatLag),hatFloor,limit);
 p.hatDrop=clamp(Math.round(p.hatDrop),0,limit-Math.max(0,p.hatLag));
 for(const k of ['dx','jump','squash','gazeX','gazeY'])p[k]=Math.round(p[k]);
 p.hands=p.hands.map(h=>({...h,x:Math.round(h.x),y:Math.round(h.y)}));
 p.feet=p.feet.map(v=>clamp(Math.round(v),0,10));p.footOffsets=p.footOffsets.map(v=>Math.round(v));
 p.bag.x=clamp(Math.round(p.bag.x),-8,8);p.bag.y=clamp(Math.round(p.bag.y),-4,4);
 return p;
}

// ── 一支动作一个文件（states/<id>.cjs） ──
// 她要「好多好多」新动作，往后一批一批画、好几个人同时画。都往上面那条 if 链里加的话，两个人各加一支就撞在同一段、同一个 STATES 数组上，
// 引擎里按 id 画道具的那一串 if、check-art 里按 id 的不变量也一样。所以新动作一支住一个文件：姿势、自己的道具和特效、补色、检查白名单
// 都在那一个文件里，画的人只碰自己那一份。这里启动时按文件名顺序把它们读进来，接在四十个老动作后面；
// 老动作一行不搬——states/ 里没有正式文件（_ 开头的草稿和模板不算）时，导出来的东西和以前逐字节相同。
const fs=require('node:fs'),path=require('node:path');
const STATES_DIR=path.join(__dirname,'states');
const BUILTIN_COUNT=STATES.length,BUILTIN_IDS=new Set(STATES.map(s=>s.id));
// 不在 STATES 里却占着名字的：export.cjs 的 VARIANTS（指路朝西的左手版）。新动作叫这个名字，variants/ 那份会被认成它
const RESERVED_IDS=new Set(['pointing-west']);
const STATE_ID=/^[a-z]+(?:-[a-z]+)*$/,STATE_FILE=/^[a-z]+(?:-[a-z]+)*\.cjs$/;
// 规格铁律：45/48/90 帧、每帧 70/60/70ms 轮着来。老动作里晕乎乎是 36 帧，那是老账；新画的一律守这三档
const SPEC_FRAMES=[45,48,90],SPEC_MS=[70,60,70];
// 分组照 export.cjs 的 groupOf 口径：老的三组 core / locomotion / emotion 不动，新动作可以另开 prop（道具）、sticker（表情包）；
// 要再开一组就在这里加一行，manifest 和预览页自己跟上
const GROUPS={core:'日常动作',locomotion:'走跑跳',emotion:'情绪',prop:'道具',sticker:'表情包'};
// 眼睛的写法：老的 open / half / closed，加上 hidden（这一帧不画，得在 check.eyesHidden 登记）、dot（小方点）、star（星星眼）。
// EYE_CLEAR 是从睁眼那一格顶往下空出来的行数，pose() 收尾拿它算帽檐最多能沉多少
const EYE_KINDS=['open','half','closed','hidden','dot','star'];
const EYE_CLEAR={open:0,half:10,closed:15,hidden:15,dot:5,star:5};
const POSE_KEYS=['dx','jump','squash','lean','hatLag','hatDrop','eyes','gazeX','gazeY','hands','feet','footOffsets','bag','tool','side','sleep'];
// 帽子的四个量在老动作里住在 tool 里（tool.hatLift 之类），新动作顶层写也认，进来就挪进 tool
const HAT_KEYS=['hatLift','hatTilt','hatShift','hatAside'];
// 检查白名单：每一条都是帧号表（单帧或 [起,止] 含两头），只在登记了的帧放行；verify 是这一支自己的不变量
const FRAME_LIST_KEYS=['eyesHidden','eyesCovered','hatOffHead','hatAside','airborne'];
const CHECK_KEYS=[...FRAME_LIST_KEYS,'firstFrameEyesClosed','verify'];
const snap5=v=>Math.round(v/5)*5;

function frameSet(list,frames,fail,key){
 if(!Array.isArray(list))fail(`check.${key} 要是帧号表，比如 [3, [10, 14]]`);
 const set=new Set();
 for(const item of list){
  const [a,b]=Array.isArray(item)?item:[item,item];
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b>=frames||a>b)fail(`check.${key} 里的 ${JSON.stringify(item)} 不在 0–${frames-1} 里`);
  for(let f=a;f<=b;f++)set.add(f);
 }
 return set;
}
function registerState(mod,{file=null,draft=false}={}){
 const fail=msg=>{throw Error(`${file||'states 模块'}：${msg}`);};
 if(!mod||typeof mod!=='object')fail('要 module.exports 一个对象（照 states/_template.cjs 抄）');
 const {id,label,frames,pose:poseFn,paint,palette,group='core',ms,keyframes,segments,handoff,seamStep,stickerFrame,check={}}=mod;
 if(typeof id!=='string'||!STATE_ID.test(id))fail(`id 要是小写英文、用 - 连起来（比如 sign-yes），拿到的是 ${JSON.stringify(id)}`);
 // 正式文件的名字就是 id：两个人各画一支，撞名在拿文件的那一刻就撞出来，不会等到导出时一支把另一支的 gif 盖掉
 if(file&&!draft&&path.basename(file)!==`${id}.cjs`)fail(`文件名要和 id 一样：id 是 ${id}，文件就叫 states/${id}.cjs`);
 if(BUILTIN_IDS.has(id))fail(`${id} 是老动作的 id，换个名字`);
 if(RESERVED_IDS.has(id))fail(`${id} 是 variants/ 里那份变体的名字，换个名字`);
 const twin=STATES.find(s=>s.id===id);
 if(twin)fail(`id ${id} 已经有一支了（${twin.plugin?.file||'老动作'}）`);
 if(typeof label!=='string'||!label.trim())fail('label 要写中文名（预览页和 manifest 上显示的就是它）');
 if(!SPEC_FRAMES.includes(frames))fail(`frames 只能是 ${SPEC_FRAMES.join(' / ')}（规格铁律），拿到 ${frames}`);
 if(ms!==undefined&&JSON.stringify(ms)!==JSON.stringify(SPEC_MS))fail(`ms 只能是 [${SPEC_MS}]（每帧 70/60/70 轮着来；不少播放端会把逐帧延时摊平，帧就是唯一的时钟），拿到 ${JSON.stringify(ms)}`);
 if(!Object.hasOwn(GROUPS,group))fail(`group 只能是 ${Object.keys(GROUPS).join(' / ')}，拿到 ${JSON.stringify(group)}`);
 if(typeof poseFn!=='function')fail('pose(i, ctx) 是必填的：每帧 return 这一帧的姿势字段');
 if(paint!==undefined&&typeof paint!=='function')fail('paint 要是函数 paint(ctx, p, i)，或者干脆不写');
 // 补色的名字和色值在 engine.cjs 里查（它才知道老伦敦那 19 色）；这里只认形状
 if(palette!==undefined&&(!palette||typeof palette!=='object'||Array.isArray(palette)))fail('palette 要是 { 名字: "#rrggbb" } 这样的对象');
 const kf=keyframes??Array.from({length:8},(_,k)=>Math.round(k*frames/8));
 if(!Array.isArray(kf)||kf.length<2||kf.length>8||kf[0]!==0||new Set(kf).size!==kf.length||kf.some(f=>!Number.isInteger(f)||f<0||f>=frames))fail(`keyframes 要 2–8 个不重复的帧号、第一个是 0、都在 0–${frames-1} 里，拿到 ${JSON.stringify(kf)}`);
 if(segments!==undefined){
  if(!Array.isArray(segments))fail('segments 要是数组：[{ id, from, to, loop, next? }]');
  for(const seg of segments)if(!seg||typeof seg.id!=='string'||!Number.isInteger(seg.from)||!Number.isInteger(seg.to)||seg.from<0||seg.to>=frames||seg.from>=seg.to||(seg.next!==undefined&&typeof seg.next!=='string'))fail(`segments 里的 ${JSON.stringify(seg)} 不对：from < to，都在 0–${frames-1} 里，next 是另一个状态的 id`);
 }
 if(handoff!==undefined&&(!handoff||typeof handoff.from!=='string'||typeof handoff.to!=='string'))fail('handoff 要写成 { from: "<从哪个状态切进来>", to: "<放完切到哪个>" }');
 if(seamStep!==undefined&&!(Number.isFinite(seamStep)&&seamStep>=0))fail('seamStep 要是一个不小于 0 的数');
 // 表情包定帧（第一批 10/15 加的）：当静图表情包、推送配图时取哪一帧。不写就是首帧——暂停、省电、减少动态效果本来就用首帧；
 // 写了就进 manifest，以后 --stickers 裁贴纸、接入方的贴纸盘都从这里取，不用再翻每支模块的注释。
 // 得是 keyframes 里的一帧：keyframes/<id>/NN.png 和分层拆件里现成就有这张，取图不用另渲染
 if(stickerFrame!==undefined&&!(Number.isInteger(stickerFrame)&&kf.includes(stickerFrame)))fail(`stickerFrame 要是 keyframes 里的一帧（${JSON.stringify(kf)}），拿到 ${JSON.stringify(stickerFrame)}`);
 if(!check||typeof check!=='object')fail('check 要是对象');
 const unknown=Object.keys(check).filter(k=>!CHECK_KEYS.includes(k));
 if(unknown.length)fail(`check 不认识 ${unknown.join(' / ')}——认的是 ${CHECK_KEYS.join(' / ')}`);
 const allow=Object.fromEntries(FRAME_LIST_KEYS.map(k=>[k,check[k]===undefined?new Set():frameSet(check[k],frames,fail,k)]));
 if(check.firstFrameEyesClosed!==undefined&&typeof check.firstFrameEyesClosed!=='boolean')fail('check.firstFrameEyesClosed 要是 true / false');
 if(check.verify!==undefined&&typeof check.verify!=='function')fail('check.verify 要是函数 verify(i, info)');
 const entry={id,label,frames,keyframes:[...kf],...(segments?{segments:segments.map(seg=>({...seg}))}:{}),...(seamStep!==undefined?{seamStep}:{}),...(handoff?{handoff:{...handoff}}:{}),...(stickerFrame!==undefined?{stickerFrame}:{}),group};
 // plugin 不可枚举：谁把 STATES 整个序列化（JSON.stringify、structuredClone）都只看见老动作那种干干净净的一行
 Object.defineProperty(entry,'plugin',{value:Object.freeze({mod,file,draft,allow,firstFrameEyesClosed:!!check.firstFrameEyesClosed,verify:check.verify||null})});
 STATES.push(entry);
 return entry;
}
// 新动作这一帧的姿势：先给一份和老动作同样的默认姿势，pose(i, ctx) return 哪几个字段就盖哪几个（tool、bag 按键合进去），
// 再交给下面的 pose() 收尾——帽子落后、包甩、手贴到身侧、帽檐不压眼、取整，和老动作走同一条路。
// pose() 每帧会算两遍（这一帧和上一帧，做帽子落后的差分），所以 pose(i, ctx) 只能看 i，不能记状态
function pluginPose(s,F,p,closedAt,opts){
 const {mod,file}=s.plugin,where=`${file||s.id} 第 ${F} 帧`;
 const ctx={frame:F,frames:s.frames,t:p.t,base:structuredClone(p),opts:{...opts},closedAt,blink:closedAt,curve,smooth,sin,clamp,ease,cycleTime,snap5,TAU};
 const out=mod.pose(F,ctx);
 if(!out||typeof out!=='object'||Array.isArray(out))throw Error(`${where}：pose() 要 return 这一帧的字段（一个对象，没变的字段不用写）`);
 for(const [k,v] of Object.entries(out)){
  if(v===undefined)continue;
  if(HAT_KEYS.includes(k)){p.tool[k]=v;continue;}
  if(!POSE_KEYS.includes(k))throw Error(`${where}：pose 不认识 ${k}——认的是 ${[...POSE_KEYS,...HAT_KEYS].join(' / ')}；自己的数据放进 tool 里`);
  if(k==='tool'||k==='bag'){if(!v||typeof v!=='object')throw Error(`${where}：${k} 要是对象`);Object.assign(p[k],v);}
  else p[k]=v;
 }
 const bad=msg=>{throw Error(`${where}：${msg}`);};
 for(const k of ['dx','jump','squash','lean','hatLag','hatDrop','gazeX','gazeY'])if(!Number.isFinite(p[k]))bad(`${k} 要是数，拿到 ${p[k]}`);
 for(const k of ['hatLift','hatTilt','hatShift'])if(p.tool[k]!==undefined&&!Number.isFinite(p.tool[k]))bad(`${k} 要是数，拿到 ${p.tool[k]}`);
 p.side=!!p.side;p.sleep=!!p.sleep;
 if((p.sleep?42:55)-p.squash<5)bad(`squash ${p.squash} 把身子压没了（站着最多压到 50，睡着 37）`);
 if(!Array.isArray(p.hands)||p.hands.length!==2||p.hands.some(h=>!h||!Number.isFinite(h.x)||!Number.isFinite(h.y)||(h.a!==undefined&&!Number.isFinite(h.a))))bad('hands 要是两只手 [{ x, y, a? , color? }, { … }]，左手在前');
 p.hands=p.hands.map(h=>({...h,a:h.a??0}));
 for(const k of ['feet','footOffsets'])if(!Array.isArray(p[k])||p[k].length!==4||p[k].some(v=>!Number.isFinite(v)))bad(`${k} 要是四个数（四只脚从左到右）`);
 for(const k of ['x','y','a'])if(!Number.isFinite(p.bag[k]))bad(`bag.${k} 要是数`);
 const need=p.side?1:2,kinds=[].concat(p.eyes);
 if(Array.isArray(p.eyes)&&p.eyes.length!==need)bad(`eyes 写成数组时要正好 ${need} 个（${p.side?'侧身一只眼':'正面左、右两只'}）`);
 if(kinds.some(k=>!EYE_KINDS.includes(k)))bad(`eyes 只认 ${EYE_KINDS.join(' / ')}，拿到 ${JSON.stringify(p.eyes)}`);
 return p;
}
function loadStates(){
 let names;
 try{names=fs.readdirSync(STATES_DIR);}catch(error){if(error.code==='ENOENT')return;throw error;}
 for(const name of names.sort()){
  if(STATE_FILE.test(name)){registerState(require(path.join(STATES_DIR,name)),{file:`states/${name}`});continue;}
  // 名字不合规矩的脚本不悄悄跳过：Sign_Yes.cjs 这种画的人以为接上了、其实没进来，宁可在终端说一声（打在 stderr，不弄脏 check-art 的 JSON）
  if(/\.(c|m)?js$/.test(name)&&!name.startsWith('_'))console.warn(`states/${name} 没读进来：文件名要是 <id>.cjs（小写英文、用 - 连）；还不想进 STATES 的草稿用 _ 开头`);
 }
}
// 预览一支草稿（_ 开头的文件，比如 _template.cjs）或者正式的那支：按文件名找，找到就登记进这一个进程的 STATES，别的进程看不见它
function loadStateFile(name){
 if(!/^_?[a-z]+(?:-[a-z]+)*$/.test(name))throw Error(`states/${name}.cjs：名字只能是小写英文和 -（草稿可以 _ 开头）`);
 const full=path.join(STATES_DIR,`${name}.cjs`);
 if(!fs.existsSync(full))return null;
 const mod=require(full),known=STATES.find(s=>s.plugin?.mod===mod);
 return known||registerState(mod,{file:`states/${name}.cjs`,draft:name.startsWith('_')});
}

// exports 先挂好再读 states/：新动作的文件要是自己 require('../motion.cjs') 拿 curve 之类，拿到的是完整的一份，不是读到一半的空壳
module.exports={STATES,pose,poseRaw,curve,smooth,sin,TAU,clamp,ease,cycleTime,snap5,GROUPS,EYE_KINDS,EYE_CLEAR,SPEC_FRAMES,SPEC_MS,BUILTIN_COUNT,STATES_DIR,registerState,loadStateFile};
loadStates();
