(function(root){
  'use strict';
  const D=root.LumenData;
  function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function rollHero(chest,rng=Math.random){const roll=rng()*100;let sum=0,tier=0;for(let i=0;i<chest.odds.length;i++){sum+=chest.odds[i];if(roll<sum){tier=i;break;}}const pool=D.heroes.filter(h=>h.rarity===D.tiers[tier]);return pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];}
  function blankProfile(){return {version:1,coins:0,owned:['warden','ranger'],selected:'warden',best:0,history:[],items:[],name:''};}
  function sanitizeProfile(raw){const p=blankProfile();if(!raw||typeof raw!=='object')return p;const ids=D.heroes.map(h=>h.id);p.coins=Number.isSafeInteger(raw.coins)&&raw.coins>=0?Math.min(raw.coins,10000000):0;p.owned=[...new Set(['warden','ranger',...(Array.isArray(raw.owned)?raw.owned.filter(x=>ids.includes(x)):[])])];p.selected=p.owned.includes(raw.selected)?raw.selected:'warden';p.best=Number.isFinite(raw.best)?Math.max(0,Math.floor(raw.best)):0;p.items=Array.isArray(raw.items)?raw.items.filter(x=>x==='wisdom-compass'):[];p.name=typeof raw.name==='string'?raw.name.slice(0,20):'';p.history=Array.isArray(raw.history)?raw.history.filter(h=>h&&Number.isFinite(h.score)&&Number.isFinite(h.correct)&&Number.isFinite(h.answered)&&Number.isFinite(h.minutes)).slice(0,8):[];return p;}
  class Session{
    constructor(minutes,hero,rng=Math.random){
      this.minutes=minutes===10?10:5;this.remaining=this.minutes*60;this.duration=this.remaining;this.hero=hero;this.health=hero.hp;this.lives=5;this.score=0;this.correct=0;this.answered=0;this.streak=0;this.bestStreak=0;this.earned=0;this.spent=0;this.openings=0;this.duplicates=0;this.defeated=0;this.levelDefeated=0;this.levelIndex=0;this.levelsCleared=0;this.active=true;this.paused=false;this.phase='combat';this.readyRemaining=0;this.rng=rng;this.question=null;this.answers=[];this.resolved=false;this.reason='';this.defeatedIds=new Set();
      this.decks=D.levels.map((_,i)=>{const qs=D.questions.filter(q=>q.level===i);const values=shuffle(qs.filter(q=>q.subject==='Islamic values'),rng),others=shuffle(qs.filter(q=>q.subject!=='Islamic values'),rng);const first=others.pop(),second=values.pop();return [...shuffle([...others,...values],rng),second,first];});
    }
    get level(){return D.levels[this.levelIndex];}
    get hp(){return Math.ceil(this.health);}
    get canFight(){return this.active&&!this.paused&&this.phase==='combat';}
    tick(seconds){
      if(!this.active||this.paused||!Number.isFinite(seconds)||seconds<0)return;
      if(this.phase==='ready'){this.readyRemaining=Math.max(0,this.readyRemaining-seconds);if(this.readyRemaining<=.000001){this.readyRemaining=0;if(this.levelDefeated===this.level.enemies){this.levelsCleared=this.levelIndex+1;this.phase='levelComplete';}else this.phase='combat';}return;}
      if(this.phase!=='combat')return;this.remaining=Math.max(0,this.remaining-seconds);if(this.remaining===0)this.end('time');
    }
    defeatEnemy(id){
      if(!this.canFight||typeof id!=='string'||this.defeatedIds.has(id)||this.levelDefeated>=this.level.enemies)return null;
      this.defeatedIds.add(id);this.defeated++;this.levelDefeated++;this.phase='quiz';this.question=this.decks[this.levelIndex].pop();this.answers=shuffle(this.question.answers.map((text,index)=>({text,correct:index===this.question.correct})),this.rng);this.resolved=false;return this.question;
    }
    answer(index){
      if(!this.active||this.phase!=='quiz'||this.resolved||!Number.isInteger(index)||index<0||index>=this.answers.length)return null;
      this.resolved=true;this.answered++;let gold=0;const correct=this.answers[index].correct;
      if(correct){this.correct++;this.streak++;this.bestStreak=Math.max(this.bestStreak,this.streak);gold=40+Math.min(4,this.streak-1)*5;this.score+=100+Math.min(4,this.streak-1)*10;this.health=Math.min(this.hero.hp,this.health+15);this.earned+=gold;}else{this.lives--;this.streak=0;}
      this.phase='feedback';if(this.lives<=0)this.end('chances');return {correct,gold,correctIndex:this.answers.findIndex(a=>a.correct),explanation:this.question.explanation};
    }
    beginReady(){if(!this.active||this.phase!=='feedback')return false;this.phase='ready';this.readyRemaining=2;return true;}
    continueLevel(){if(!this.active||this.phase!=='levelComplete'||this.levelIndex>=D.levels.length-1)return false;this.levelIndex++;this.levelDefeated=0;this.health=this.hero.hp;this.phase='ready';this.readyRemaining=2;this.question=null;this.answers=[];return true;}
    takeDamage(amount){if(!this.canFight||!Number.isFinite(amount)||amount<=0)return false;this.health=Math.max(0,this.health-amount);if(this.health===0)this.end('health');return true;}
    equip(hero){const ratio=this.health/this.hero.hp;this.hero=hero;this.health=Math.min(hero.hp,hero.hp*ratio);}
    end(reason){this.active=false;this.phase='ended';this.reason=reason;}
  }
  function buyChest(profile,chest,rng=Math.random){if(!chest||profile.coins<chest.cost)return null;profile.coins-=chest.cost;const hero=rollHero(chest,rng);const duplicate=profile.owned.includes(hero.id);const refund=duplicate?Math.floor(chest.cost*.25):0;if(duplicate)profile.coins+=refund;else profile.owned.push(hero.id);return {hero,duplicate,refund,cost:chest.cost};}
  root.LumenEngine={Session,shuffle,rollHero,buyChest,blankProfile,sanitizeProfile};
  if(typeof module!=='undefined')module.exports=root.LumenEngine;
})(typeof window!=='undefined'?window:globalThis);
