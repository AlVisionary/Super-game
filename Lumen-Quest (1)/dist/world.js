/* Canvas scenery and procedural animation; no external renderer required. */
(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const mix=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')})`;
  class World{
    constructor(canvas){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.atlas=new Image();this.atlas.src='assets/heroes.png';this.actions=new Image();this.actions.src='assets/hero-actions.png';
      this.w=1200;this.h=680;this.ground=541;this.player=this.newPlayer();this.hero=root.LumenData.heroes[0];this.level=root.LumenData.levels[0];this.session=null;this.enemies=[];this.length=1700;this.keys=new Set();this.camera=0;this.active=false;this.blocked=false;this.time=0;this.mode='auto';this.particles=[];this.shake=0;this.hit=0;this.platforms=[];this.compass=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.onQuestion=()=>{};this.onDamage=()=>{};this.last=0;
      this.resize=()=>{const r=canvas.getBoundingClientRect();this.w=Math.max(360,Math.round(r.width/r.height*680));canvas.width=this.w;canvas.height=680;this.ctx.imageSmoothingEnabled=false;};
      new ResizeObserver(this.resize).observe(canvas);this.resize();requestAnimationFrame(t=>this.frame(t));
    }
    newPlayer(){return {x:250,y:541,vy:0,face:1,walk:0,moving:false,running:false,grounded:true,attack:0,cooldown:0,invulnerable:0};}
    start(session){this.session=session;this.hero=session.hero;this.active=true;this.loadLevel(session.level);}
    loadLevel(level){
      this.level=level;this.player=this.newPlayer();this.camera=0;this.particles=[];this.keys.clear();this.length=Math.max(1600,level.enemies*350+600);
      this.platforms=Array.from({length:Math.max(1,level.enemies-1)},(_,i)=>({x:780+i*350,w:115,y:this.ground-75-(i%2)*15}));
      this.enemies=Array.from({length:level.enemies},(_,i)=>{const boss=i===level.enemies-1;const hp=Math.round(level.hp*(boss?1.25:1));return {id:level.id+'-'+i,x:590+i*350,y:this.ground,hp,maxHp:hp,alive:true,face:-1,walk:i,windup:0,cooldown:1.3,hit:0,boss};});
      this.blocked=!this.session.canFight;
    }
    get nearestEnemy(){return this.enemies.filter(e=>e.alive).sort((a,b)=>Math.abs(a.x-this.player.x)-Math.abs(b.x-this.player.x))[0]||null;}
    effect(correct){this.hit=correct?1:-1;this.shake=correct?0:8;this.burst(this.player.x,this.player.y-70,correct?'#e4f5ab':'#efad96',correct?22:12);}
    burst(x,y,color,count=16){for(let i=0;i<(this.reduced?4:count);i++)this.particles.push({x,y,vx:(Math.random()-.5)*190,vy:-Math.random()*180-20,life:.7+Math.random()*.5,color,size:2+Math.random()*4});}
    frame(now){
      const dt=Math.min(.035,(now-this.last)/1000||0);this.last=now;
      if(!this.blocked){this.time+=dt;if(this.active)this.update(dt);if(!this.blocked){this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;});this.particles=this.particles.filter(p=>p.life>0);this.shake=Math.max(0,this.shake-dt*30);this.hit*=.95;}}
      this.draw();requestAnimationFrame(t=>this.frame(t));
    }
    attack(){
      if(!this.session?.canFight||this.blocked||this.player.cooldown>0)return false;
      const p=this.player,target=this.nearestEnemy;p.attack=.32;p.cooldown=.48;
      if(target&&Math.abs(target.x-p.x)<132&&Math.abs(target.y-p.y)<90){p.face=target.x>=p.x?1:-1;target.hp=Math.max(0,target.hp-this.hero.damage);target.hit=.22;this.burst(target.x,target.y-53,this.hero.color,10);
        if(target.hp===0){target.alive=false;this.burst(target.x,target.y-55,this.level.color,24);const q=this.session.defeatEnemy(target.id);if(q){this.blocked=true;this.keys.clear();this.onQuestion(q);}}
      }
      return true;
    }
    update(dt){
      const p=this.player;if(!this.session?.canFight)return;
      p.attack=Math.max(0,p.attack-dt);p.cooldown=Math.max(0,p.cooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);
      const left=this.keys.has('ArrowLeft')||this.keys.has('a'),right=this.keys.has('ArrowRight')||this.keys.has('d'),direction=Number(right)-Number(left);
      p.running=this.keys.has('Shift');p.moving=direction!==0;
      if(direction){p.face=direction;p.x=clamp(p.x+direction*(p.running?340:185)*dt,65,this.length-65);p.walk+=dt*(p.running?16:10);}
      if((this.keys.has('Space')||this.keys.has('ArrowUp')||this.keys.has('w'))&&p.grounded){p.vy=-515;p.grounded=false;this.keys.delete('Space');this.keys.delete('ArrowUp');this.keys.delete('w');}
      const previousY=p.y;p.vy+=1300*dt;p.y+=p.vy*dt;let floor=this.ground;
      for(const platform of this.platforms){if(p.x>platform.x-10&&p.x<platform.x+platform.w+10&&previousY<=platform.y+1&&p.y>=platform.y&&p.vy>=0)floor=Math.min(floor,platform.y);}
      if(p.y>=floor&&p.vy>=0){p.y=floor;p.vy=0;p.grounded=true;}else p.grounded=false;
      if(this.keys.has('j')||this.keys.has('e'))this.attack();
      if(this.blocked)return;
      for(const enemy of this.enemies){if(!enemy.alive)continue;enemy.hit=Math.max(0,enemy.hit-dt);enemy.cooldown=Math.max(0,enemy.cooldown-dt);const dx=p.x-enemy.x,dy=Math.abs(p.y-enemy.y);enemy.face=dx>=0?1:-1;
        if(enemy.windup>0){enemy.windup=Math.max(0,enemy.windup-dt);if(enemy.windup===0){enemy.cooldown=this.level.cooldown;if(Math.abs(dx)<100&&dy<76&&p.invulnerable===0){if(this.session.takeDamage(this.level.damage*(enemy.boss?1.2:1))){p.invulnerable=.9;this.effect(false);this.onDamage();if(!this.session.active){this.blocked=true;break;}}}}}
        else if(Math.abs(dx)<360){if(Math.abs(dx)>66){enemy.x+=Math.sign(dx)*this.level.speed*dt;enemy.walk+=dt*7;}else if(dy<76&&enemy.cooldown===0)enemy.windup=this.level.windup;}
        else{enemy.x+=Math.sin(this.time*.8+enemy.maxHp)*dt*9;enemy.walk+=dt*2;}
      }
    }
    polygon(points,color){const c=this.ctx;c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
    tree(x,base,size,color,kind=0){const c=this.ctx;c.fillStyle=color;c.fillRect(Math.round(x-4*size),base-155*size,9*size,155*size);for(let n=0;n<4;n++){const y=base-(90+n*43)*size;const wide=(70-n*12)*size;this.polygon([[x,y-95*size],[x-wide*.7,y-15*size],[x-wide*.45,y-15*size],[x-wide,y+20*size],[x+wide,y+20*size],[x+wide*.5,y-15*size],[x+wide*.7,y-15*size]],color);}if(kind){c.fillStyle='#9eaf7b18';c.fillRect(x-20*size,base-160*size,8*size,70*size);}}
    draw(){const c=this.ctx,w=this.w,h=680,t=this.time;const night=this.mode==='night'?1:this.mode==='day'?0:(1-Math.cos(t/42))*.5;this.night=night;const camTarget=this.active?clamp(this.player.x-w*.36,0,Math.max(0,this.length-w)):Math.max(0,200-w*.1);if(!this.blocked)this.camera=lerp(this.camera,camTarget,.08);const cam=this.camera;c.save();c.clearRect(0,0,w,h);if(this.shake&&!this.reduced)c.translate(Math.sin(t*95)*this.shake,0);
      const sky=c.createLinearGradient(0,0,0,500);sky.addColorStop(0,mix([81,130,129],[17,32,59],night));sky.addColorStop(.6,mix([181,188,135],[49,74,94],night));sky.addColorStop(1,mix([225,202,146],[77,100,104],night));c.fillStyle=sky;c.fillRect(0,0,w,h);
      if(night>.2){c.globalAlpha=night;for(let i=0;i<60;i++){const x=((i*173.7)%w),y=30+(i*67)%270;c.fillStyle='#e4e8c8';c.fillRect(x,y,i%5===0?3:1.5,1.5);}c.globalAlpha=1;}
      const sunX=w*.69-cam*.05,sunY=141;const glow=c.createRadialGradient(sunX,sunY,10,sunX,sunY,190);glow.addColorStop(0,night>.6?'#b6dfdf28':'#f9df9f90');glow.addColorStop(1,'#f8e3a100');c.fillStyle=glow;c.fillRect(sunX-200,0,400,400);c.fillStyle=mix([249,228,161],[219,233,215],night);c.beginPath();c.arc(sunX,sunY,night>.5?27:39,0,Math.PI*2);c.fill();
      for(let i=0;i<5;i++){const x=((i*340+t*3-cam*.08)%(w+400))-150;const y=70+(i*71)%180;c.fillStyle=mix([219,222,177],[94,113,127],night);c.globalAlpha=.2;c.fillRect(x,y,140,13);c.fillRect(x+27,y-12,77,13);}c.globalAlpha=1;
      for(let layer=0;layer<3;layer++){const col=layer===0?mix([103,151,135],[37,68,86],night):layer===1?mix([77,127,113],[30,62,75],night):mix([60,109,93],[25,58,64],night);const points=[[0,490]];for(let x=-200;x<w+250;x+=110){const wave=Math.sin((x+cam*(.1+layer*.08))/170+layer*2)*37+Math.cos((x+cam*.2)/300)*25;points.push([x,290+layer*53+wave]);}points.push([w,520]);this.polygon(points,col);}
      // Distant academy and stepping rooftops.
      const castleX=w*.57-cam*.17;c.fillStyle=mix([91,128,111],[39,71,80],night);for(let i=0;i<5;i++){const cx=castleX+i*31,top=285-Math.sin(i*1.9)*42;c.fillRect(cx,top,27,120);this.polygon([[cx-5,top],[cx+13,top-24],[cx+32,top]],c.fillStyle);c.fillStyle=mix([184,194,137],[167,174,115],night);c.fillRect(cx+11,top+23,5,13);c.fillStyle=mix([91,128,111],[39,71,80],night);}
      for(let i=-4;i<Math.ceil(w/85)+8;i++){const x=i*85-((cam*.32)%85);this.tree(x,467,.58+(Math.sin(i*5)*.5+.5)*.28,mix([57,112,97],[22,57,64],night));}
      c.globalAlpha=(1-night)*.1;for(let i=0;i<4;i++)this.polygon([[w*.65+i*70,0],[w*.75+i*90,0],[w*.25+i*190,550],[w*.15+i*180,550]],'#fff1b9');c.globalAlpha=1;
      for(let i=-3;i<Math.ceil(w/155)+5;i++){const index=i+Math.floor(cam*.55/155);const x=i*155-(cam*.55%155);this.tree(x,511,.9+(Math.sin(index*4)*.5+.5)*.5,mix([33,83,68],[15,43,49],night),1);}
      // River glints behind the moss path.
      c.fillStyle=mix([113,156,138],[43,89,102],night);c.fillRect(0,503,w,45);for(let i=0;i<24;i++){c.fillStyle=mix([180,192,152],[85,129,135],night);c.globalAlpha=.35;c.fillRect((i*109+t*6)%w,511+i%4*6,17+i%3*14,2);}c.globalAlpha=1;
      if(this.level.theme!=='forest')this.drawAreaBackground(w,night,cam,t);
      const terrain={forest:[[51,64,47],[87,111,64],[145,160,88]],desert:[[77,57,45],[129,97,59],[205,166,107]],casino:[[38,29,48],[80,51,80],[169,111,145]],ice:[[35,58,70],[73,111,127],[164,211,214]],ember:[[50,31,34],[98,52,43],[200,114,66]]}[this.level.theme];
      // Main terrain: chunky ledge, earth strata, little illuminated moss pixels.
      c.fillStyle=mix(terrain[0],[24,38,38],night);c.fillRect(0,this.ground,w,h-this.ground);c.fillStyle=mix(terrain[1],[37,45,53],night);c.fillRect(0,this.ground-7,w,13);c.fillStyle=mix(terrain[2],[67,85,94],night);c.fillRect(0,this.ground-7,w,4);for(let i=0;i<w/18+2;i++){const x=i*18-(cam%18);c.fillStyle=i%3===0?'#1d3529':'#43533b';c.fillRect(x,552+(i%4)*3,11,5);c.fillStyle='#ffffff07';c.fillRect(x+3,588+i%3*15,9,4);}for(let i=0;i<45;i++){const x=(i*79-cam*.99)%(w+150);c.fillStyle=mix(terrain[2],[65,82,90],night);c.fillRect(x,this.ground-10-i%3*3,3,8);c.fillRect(x+5,this.ground-12,2,7);}
      for(const platform of this.platforms){const x=platform.x-cam;if(x<-200||x>w+100)continue;c.fillStyle=mix([67,86,65],[38,63,57],night);c.fillRect(x,platform.y,platform.w,23);c.fillRect(x+8,platform.y+23,platform.w-16,14);c.fillStyle=this.level.color;c.fillRect(x,platform.y-4,platform.w,5);for(let k=0;k<4;k++){c.fillStyle='#1e3f3455';c.fillRect(x+10+k*33,platform.y+8,25,2);}}
      this.drawGate(this.length-160-cam,this.ground);
      if(this.active)this.enemies.forEach(e=>{if(e.alive&&e.x-cam>-150&&e.x-cam<w+150)this.drawEnemy(e,e.x-cam);});
      // Small grasses, mushrooms, lanterns, and low stones along the trail.
      for(let i=0;i<24;i++){const x=i*143+67-cam;if(x<-80||x>w+80)continue;const y=this.ground;if(i%3===0){c.fillStyle='#c1b58b';c.fillRect(x,y-16,4,16);c.fillStyle='#b27055';c.fillRect(x-6,y-18,17,5);c.fillRect(x-3,y-22,11,5);}else{c.fillStyle=mix([80,109,77],[36,68,57],night);c.fillRect(x,y-12,23,12);c.fillRect(x+5,y-18,13,6);}if(i%6===1){c.fillStyle='#3b4534';c.fillRect(x+35,y-63,5,63);c.fillRect(x+30,y-65,16,4);c.fillStyle='#f3d799';c.fillRect(x+32,y-60,12,17);const g=c.createRadialGradient(x+38,y-53,0,x+38,y-53,55);g.addColorStop(0,'#ffe5a144');g.addColorStop(1,'#ffe5a100');c.fillStyle=g;c.fillRect(x-20,y-110,115,115);}}
      if(this.active){const p=this.player;this.drawHero(this.hero,p.x-cam,p.y,p.face,p.walk,p.moving,p.grounded);if(this.compass){c.fillStyle='#e5cf82';c.font='20px Georgia';c.fillText('✧',p.x-cam+42,p.y-115+Math.sin(t*3)*5);}}else{const positions=[.18,.3,.69,.82];[1,0,3,4].forEach((index,i)=>this.drawHero(root.LumenData.heroes[index],w*positions[i],this.ground, i<2?1:-1,t*1.4,false,true,.85));}
      this.particles.forEach(p=>{c.globalAlpha=Math.min(1,p.life);c.fillStyle=p.color;c.fillRect(p.x-cam,p.y,p.size,p.size);});c.globalAlpha=1;
      // Foreground framing gives depth without blocking the playable path.
      if(this.level.theme==='forest')this.tree(-40-cam*.05,655,1.9,mix([21,55,43],[10,28,33],night));if(this.level.theme==='forest')this.tree(w+45+cam*.015,650,1.8,mix([21,55,43],[10,28,33],night));for(let i=0;i<20;i++){const x=(i*83.9+Math.sin(t*.7+i)*20)%w,y=320+(i*47)%205+Math.cos(t+i)*14;c.globalAlpha=(.35+.35*Math.sin(t*2+i))*(.3+night*.7);c.fillStyle='#f1edb0';c.fillRect(x,y,3,3);}c.globalAlpha=1;c.restore();}
    drawAreaBackground(w,night,cam,t){
      const c=this.ctx,theme=this.level.theme;
      const colors={desert:['#67534a','#c09565','#e5c795'],casino:['#241d37','#4a3159','#9b655a'],ice:['#1a3447','#507a8c','#a9cfcc'],ember:['#281b29','#724044','#db9866']}[theme];
      const gradient=c.createLinearGradient(0,0,0,541);gradient.addColorStop(0,colors[0]);gradient.addColorStop(.65,colors[1]);gradient.addColorStop(1,colors[2]);c.fillStyle=gradient;c.fillRect(0,0,w,541);
      c.globalAlpha=.8;c.fillStyle=theme==='ember'?'#f8b16e':'#e1e8c6';c.beginPath();c.arc(w*.73-cam*.04,125,night>.5?22:33,0,7);c.fill();c.globalAlpha=1;
      if(theme==='desert'){
        for(let layer=0;layer<3;layer++){const points=[[0,541]];for(let x=-100;x<=w+100;x+=80)points.push([x,340+layer*55+Math.sin((x+cam*.14)/180+layer*2)*35]);points.push([w,541]);this.polygon(points,['#a17d59','#b59562','#957a50'][layer]);}
        for(let i=-2;i<w/230+4;i++){const x=i*230-(cam*.4%230);c.fillStyle='#6b5144';c.fillRect(x,373,150,145);this.polygon([[x-12,373],[x+75,320],[x+162,373]],'#bb7153');c.fillStyle='#e1b86c';for(let k=0;k<4;k++)c.fillRect(x+14+k*34,382,15,44);c.fillStyle='#483f36';c.fillRect(x+55,447,40,71);c.fillStyle='#dab783';c.fillRect(x-12,371,174,7);}
      }else if(theme==='casino'){
        c.fillStyle='#32273c';c.fillRect(0,270,w,273);
        for(let i=-2;i<w/220+3;i++){const x=i*220-(cam*.3%220);c.fillStyle='#79516d';c.fillRect(x,290,160,215);c.fillStyle='#302237';c.fillRect(x+9,304,142,196);c.strokeStyle='#c2956e';c.lineWidth=3;c.strokeRect(x+14,310,132,185);c.fillStyle='#d8b588';c.font='42px Georgia';c.textAlign='center';c.fillText(['♠','♦','♣','♥'][(i+20)%4],x+80,390);c.font='11px Segoe UI';c.fillText('VELVET',x+80,423);c.fillStyle='#e5bc7e';for(let k=0;k<6;k++)c.fillRect(x+20+k*23,280,4,4);}
        for(let x=0;x<w;x+=50){c.fillStyle=(Math.floor((x+cam)/50)%2)?'#6b4b59':'#443748';c.fillRect(x,511,50,30);}
      }else if(theme==='ice'){
        for(let i=-2;i<w/170+4;i++){const x=i*170-(cam*.3%170),top=260+(i%3)*35;this.polygon([[x-75,541],[x,top],[x+75,541]],'#5c93a4');this.polygon([[x,top],[x,541],[x+75,541]],'#345e79');c.strokeStyle='#b1dfdb';c.lineWidth=3;c.strokeRect(x-30,390,60,128);c.fillStyle='#afd9d52b';c.fillRect(x-27,393,54,122);}
        c.fillStyle='#d3eeec44';for(let i=0;i<35;i++)c.fillRect((i*81+Math.sin(t+i)*9)%w,90+(i*47+t*8)%420,3,3);
      }else{
        for(let i=-2;i<w/290+3;i++){const x=i*290-(cam*.2%290);this.polygon([[x-210,480],[x,230+(i%2)*60],[x+210,480]],'#422a34');this.polygon([[x-25,265+(i%2)*60],[x,230+(i%2)*60],[x+28,269+(i%2)*60]],'#f8b572');}
        c.fillStyle='#c46744';c.fillRect(0,490,w,53);for(let i=-2;i<w/180+4;i++){const x=i*180-(cam*.55%180);c.fillStyle='#322931';c.fillRect(x,332,36,210);this.polygon([[x-8,332],[x+18,306],[x+44,332]],'#6f4743');c.fillStyle='#eda577';c.fillRect(x+15,360,6,28);}
        c.globalAlpha=.5;c.fillStyle='#ffe0a3';for(let i=0;i<16;i++)c.fillRect((i*113+t*5)%w,510-(i*37+t*17)%350,3,5);c.globalAlpha=1;
      }
      c.fillStyle='rgba(8,16,39,'+(.08+night*.42)+')';c.fillRect(0,0,w,541);
    }
    drawGate(x,y){const c=this.ctx;c.fillStyle='#4a5650';c.fillRect(x-48,y-150,15,150);c.fillRect(x+33,y-150,15,150);c.fillRect(x-48,y-160,96,18);const g=c.createLinearGradient(x-30,y-140,x+30,y);g.addColorStop(0,this.level.color+'88');g.addColorStop(1,this.level.color+'11');c.fillStyle=g;c.fillRect(x-30,y-141,60,141);c.fillStyle=this.level.color;c.font='22px Georgia';c.textAlign='center';c.fillText('✦',x,y-80);}
    drawEnemy(e,x){
      const c=this.ctx,y=e.y,bob=this.reduced?0:Math.sin(e.walk)*3,s=e.boss?1.15:1;c.save();c.translate(x,y);c.fillStyle='#061c2044';c.beginPath();c.ellipse(0,0,31*s,9,0,0,7);c.fill();c.scale(e.face*s,s);c.translate(0,-bob);
      const body=e.hit>0?'#f4e7c1':this.level.theme==='forest'?'#657c4d':this.level.theme==='desert'?'#a77456':this.level.theme==='casino'?'#705678':this.level.theme==='ice'?'#6198ad':'#9b5144';
      this.polygon([[-28,-60],[-35,-28],[-24,-7],[0,-14],[24,-7],[33,-28],[25,-60]],body);
      c.fillStyle='#25323c';c.fillRect(-22,-65,44,34);c.fillStyle=body;c.fillRect(-27,-82,53,30);this.polygon([[-25,-75],[-39,-91],[-14,-83]],body);this.polygon([[16,-83],[35,-91],[27,-69]],body);
      c.fillStyle=e.windup>0?'#ffc887':'#f0e1ac';c.fillRect(-13,-67,8,5);c.fillRect(8,-67,8,5);c.fillStyle='#18262e';c.fillRect(-6,-53,17,4);
      c.fillStyle=this.level.color;c.textAlign='center';c.font='19px Georgia';c.fillText({forest:'●',desert:'◆',casino:'♠',ice:'✧',ember:'♜'}[this.level.theme],0,-24);
      c.fillStyle='#28333a';const stride=this.reduced?0:Math.sin(e.walk)*6;c.fillRect(-22+stride,-14,16,15);c.fillRect(6-stride,-14,16,15);c.fillStyle='#c4ae7a';c.fillRect(24,-48,7,31);c.fillRect(20,-48,16,6);c.fillStyle='#d6d6b5';this.polygon([[27,-48],[25,-80],[34,-55],[31,-48]],c.fillStyle);
      if(e.boss){c.fillStyle='#e2bd74';this.polygon([[-21,-84],[-23,-98],[-10,-90],[0,-103],[10,-90],[23,-98],[20,-84]],c.fillStyle);}
      c.restore();c.fillStyle='#112b2d';c.fillRect(x-33,y-121,66,5);c.fillStyle=e.windup>0?'#f6b78c':this.level.color;c.fillRect(x-33,y-121,66*e.hp/e.maxHp,5);c.textAlign='center';c.font='9px Segoe UI';c.fillStyle='#e7ead8';c.fillText(e.boss?'ELITE '+this.level.enemy.toUpperCase():this.level.enemy.toUpperCase(),x,y-131);
      if(e.windup>0){c.fillStyle='#f4bb8b';c.font='bold 23px Georgia';c.fillText('!',x,y-153);c.strokeStyle='#f4bb8b99';c.lineWidth=2;c.beginPath();c.ellipse(x,y,84,13,0,0,7);c.stroke();}
    }
    drawHero(hero,x,y,face,walk,moving,grounded,scale=1){
      const c=this.ctx,actions=this.actions.complete&&this.actions.naturalWidth>0;
      const p=this.active?this.player:null;let frame=0;
      if(p?.attack>0)frame=4;else if(!grounded)frame=5;else if(moving){frame=p?.running?[3,1,3,2][Math.floor(walk)%4]:[1,0,2,0][Math.floor(walk)%4];}
      this.animationFrame=frame;
      c.save();c.translate(x,y);c.fillStyle='#0b201955';c.beginPath();c.ellipse(0,0,35*scale,9*scale,0,0,7);c.fill();
      const aura=c.createRadialGradient(0,-50,0,0,-50,77*scale);aura.addColorStop(0,hero.color+'2c');aura.addColorStop(1,hero.color+'00');c.fillStyle=aura;c.fillRect(-80,-145,160,155);
      if(p?.invulnerable>0&&!this.reduced)c.globalAlpha=Math.sin(this.time*40)>0?.45:1;
      c.scale(face,1);const bob=this.reduced?0:moving&&grounded?Math.abs(Math.sin(walk))*2:Math.sin(this.time*2)*1.2;
      c.translate(0,-bob);
      if(actions){const cellW=this.actions.width/6,cellH=this.actions.height/8,size=139*scale;c.drawImage(this.actions,frame*cellW,hero.cell*cellH,cellW,cellH,-size/2,-size+5,size,size);}
      else if(this.atlas.complete&&this.atlas.naturalWidth){const sw=this.atlas.width/4,sh=this.atlas.height/2,size=141*scale;c.drawImage(this.atlas,hero.cell%4*sw,Math.floor(hero.cell/4)*sh,sw,sh,-size*.375,-size,size*.75,size);}
      c.globalAlpha=1;
      if(p?.attack>0){const progress=1-p.attack/.32;c.strokeStyle=hero.color;c.lineWidth=5;c.globalAlpha=1-progress;c.beginPath();c.arc(28,-61,75,-1.3+progress*.7,1.1+progress*.7);c.stroke();c.lineWidth=2;c.strokeStyle='#fff5d4';c.beginPath();c.arc(30,-61,65,-1.2+progress*.7,.9+progress*.7);c.stroke();}
      c.restore();
    }
  }
  root.LumenWorld=World;
})(window);
