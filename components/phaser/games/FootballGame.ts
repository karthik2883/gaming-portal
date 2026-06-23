// FIFA Football Neo — Country Select + Top-Down 5v5 Match vs CPU
// Game key: 'football'  |  Register in PhaserGameEngine.tsx

// ─── Audio helpers ─────────────────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;
function ga() {
  if (typeof window === 'undefined') return null;
  if (!_audioCtx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AC) _audioCtx = new AC();
  }
  if (_audioCtx?.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
function beep(f: number, t: OscillatorType = 'sine', d = 0.1, v = 0.08) {
  const ctx = ga(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = t; o.frequency.setValueAtTime(f, ctx.currentTime);
    g.gain.setValueAtTime(v, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d);
  } catch {}
}
function sw(f1: number, f2: number, d: number, t: OscillatorType = 'sine', v = 0.08) {
  const ctx = ga(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = t; o.frequency.setValueAtTime(f1, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + d);
    g.gain.setValueAtTime(v, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + d);
  } catch {}
}
const playGoal = () => {
  [523,659,784,1047,1319].forEach((f,i) => setTimeout(() => beep(f,'sine',0.5,0.11), i*85));
  setTimeout(() => sw(250,700,1.2,'sine',0.05), 600);
};
const playKick = () => { beep(55,'square',0.09,0.12); beep(180,'square',0.06,0.05); };
const playWhistle = () => { sw(1100,1450,0.18,'sine',0.16); setTimeout(()=>sw(1100,1450,0.18,'sine',0.16),280); };
const playFullTimeWhistle = () => {
  sw(1100,1450,0.18,'sine',0.16);
  setTimeout(()=>sw(1100,1450,0.18,'sine',0.16),300);
  setTimeout(()=>sw(1100,1450,0.5,'sine',0.18),650);
};
const playCelebration = () => { [392,523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,'triangle',0.45,0.09),i*90)); };
const playSave = () => { sw(300,150,0.3,'square',0.08); };

// ─── Team Data ─────────────────────────────────────────────────────────────
interface FTeam {
  id: string; name: string;
  kit: string; shorts: string; gkKit: string;
  rating: number; // 1-5
}
const TEAMS: FTeam[] = [
  { id:'brazil',      name:'Brazil',      kit:'#009c3b', shorts:'#002776', gkKit:'#ffdd00', rating:5 },
  { id:'france',      name:'France',      kit:'#002395', shorts:'#ffffff', gkKit:'#e8001e', rating:5 },
  { id:'germany',     name:'Germany',     kit:'#dddddd', shorts:'#111111', gkKit:'#22aa44', rating:4 },
  { id:'spain',       name:'Spain',       kit:'#c60b1e', shorts:'#002395', gkKit:'#ff9900', rating:5 },
  { id:'england',     name:'England',     kit:'#f9f9f9', shorts:'#003090', gkKit:'#22aa55', rating:4 },
  { id:'italy',       name:'Italy',       kit:'#0055a4', shorts:'#0055a4', gkKit:'#ddcc00', rating:4 },
  { id:'argentina',   name:'Argentina',   kit:'#74acdf', shorts:'#002776', gkKit:'#aaaaaa', rating:5 },
  { id:'portugal',    name:'Portugal',    kit:'#cc0000', shorts:'#006600', gkKit:'#ffcc00', rating:5 },
  { id:'netherlands', name:'Netherlands', kit:'#ff6200', shorts:'#ff6200', gkKit:'#1a1a99', rating:4 },
  { id:'belgium',     name:'Belgium',     kit:'#ef3340', shorts:'#111111', gkKit:'#ffcc00', rating:4 },
  { id:'croatia',     name:'Croatia',     kit:'#cc2222', shorts:'#1111cc', gkKit:'#aaaaaa', rating:4 },
  { id:'japan',       name:'Japan',       kit:'#003087', shorts:'#003087', gkKit:'#cc0000', rating:3 },
  { id:'usa',         name:'USA',         kit:'#002868', shorts:'#bf0a30', gkKit:'#cccccc', rating:3 },
  { id:'mexico',      name:'Mexico',      kit:'#006847', shorts:'#006847', gkKit:'#ce1126', rating:3 },
  { id:'senegal',     name:'Senegal',     kit:'#00853f', shorts:'#ffffff', gkKit:'#fdef42', rating:3 },
  { id:'india',       name:'India',       kit:'#ff9933', shorts:'#138808', gkKit:'#ffffff', rating:2 },
];

// ─── Flag drawing ──────────────────────────────────────────────────────────
function drawFlag(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  const r = 4;
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  ctx.clip();

  const fn = (c: string, rx: number, ry: number, rw: number, rh: number) => { ctx.fillStyle=c; ctx.fillRect(rx,ry,rw,rh); };
  const cir = (c: string, cx: number, cy: number, cr: number) => { ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2); ctx.fill(); };

  switch(id) {
    case 'brazil':
      fn('#009c3b',x,y,w,h);
      ctx.fillStyle='#ffdf00'; ctx.beginPath(); ctx.moveTo(x+w/2,y+3); ctx.lineTo(x+w-3,y+h/2); ctx.lineTo(x+w/2,y+h-3); ctx.lineTo(x+3,y+h/2); ctx.closePath(); ctx.fill();
      cir('#002776',x+w/2,y+h/2,h*0.21);
      break;
    case 'france':
      fn('#002395',x,y,w/3,h); fn('#ffffff',x+w/3,y,w/3,h); fn('#ED2939',x+w*2/3,y,w/3,h); break;
    case 'germany':
      fn('#000000',x,y,w,h/3); fn('#DD0000',x,y+h/3,w,h/3); fn('#FFCE00',x,y+h*2/3,w,h/3); break;
    case 'spain':
      fn('#c60b1e',x,y,w,h); fn('#ffc400',x,y+h*0.25,w,h*0.5); break;
    case 'england':
      fn('#ffffff',x,y,w,h);
      fn('#cf081f',x+w/2-h*0.12,y,h*0.24,h);
      fn('#cf081f',x,y+h/2-h*0.12,w,h*0.24); break;
    case 'italy':
      fn('#009246',x,y,w/3,h); fn('#ffffff',x+w/3,y,w/3,h); fn('#ce2b37',x+w*2/3,y,w/3,h); break;
    case 'argentina':
      fn('#74acdf',x,y,w,h); fn('#ffffff',x,y+h/3,w,h/3);
      cir('#F6B40E',x+w/2,y+h/2,h*0.12); break;
    case 'portugal':
      fn('#006600',x,y,w*0.38,h); fn('#ff0000',x+w*0.38,y,w*0.62,h); break;
    case 'netherlands':
      fn('#AE1C28',x,y,w,h/3); fn('#ffffff',x,y+h/3,w,h/3); fn('#21468B',x,y+h*2/3,w,h/3); break;
    case 'belgium':
      fn('#000000',x,y,w/3,h); fn('#FFD90C',x+w/3,y,w/3,h); fn('#EF3340',x+w*2/3,y,w/3,h); break;
    case 'croatia':
      fn('#ff2222',x,y,w,h/3); fn('#ffffff',x,y+h/3,w,h/3); fn('#1111cc',x,y+h*2/3,w,h/3); break;
    case 'japan':
      fn('#ffffff',x,y,w,h); cir('#bc002d',x+w/2,y+h/2,h*0.3); break;
    case 'usa':
      for(let i=0;i<7;i++) fn(i%2===0?'#bf0a30':'#ffffff',x,y+i*(h/7),w,h/7);
      fn('#002868',x,y,w*0.4,h*4/7); break;
    case 'mexico':
      fn('#006847',x,y,w/3,h); fn('#ffffff',x+w/3,y,w/3,h); fn('#ce1126',x+w*2/3,y,w/3,h); break;
    case 'senegal':
      fn('#00853f',x,y,w/3,h); fn('#fdef42',x+w/3,y,w/3,h); fn('#e31b23',x+w*2/3,y,w/3,h); break;
    case 'india':
      fn('#ff9933',x,y,w,h/3); fn('#ffffff',x,y+h/3,w,h/3); fn('#138808',x,y+h*2/3,w,h/3);
      cir('#000080',x+w/2,y+h/2,h*0.12); break;
    default:
      fn('#888888',x,y,w,h);
  }
  // Border
  ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,h);
  ctx.restore();
}

// ─── Pitch Layout Constants (800×600 canvas) ────────────────────────────────
const PL=50, PT=75, PR=750, PB=525;
const CX=400, CY=300;
const GOAL_H2=60;  // goal half-height → goal spans CY±60 = 240-360
const GY1=CY-GOAL_H2, GY2=CY+GOAL_H2;
const GD=24;       // goal depth behind goal line
const P_R=13;      // player radius
const B_R=8;       // ball radius

// Formation positions [x,y]: GK, Def1, Def2, Mid, Fwd
const H_FORM: [number,number][] = [[82,CY],[185,CY-90],[185,CY+90],[295,CY],[375,CY]];
const C_FORM: [number,number][] = [[718,CY],[615,CY-90],[615,CY+90],[505,CY],[425,CY]];
const AI_SPD = [0,110,140,165,188,215]; // by rating 1-5

// ─── Types ─────────────────────────────────────────────────────────────────
interface FPlayer {
  x: number; y: number; vx: number; vy: number;
  formX: number; formY: number;
  role: 'gk'|'def'|'mid'|'fwd';
  team: 'human'|'cpu';
  num: number;
  color: number;       // hex int for Phaser
  colorStr: string;    // hex str for canvas
  kickCd: number;
  numText?: any;       // Phaser Text object
}
interface FBall { x: number; y: number; vx: number; vy: number; }
interface Particle { x:number; y:number; vx:number; vy:number; color:string; life:number; maxLife:number; size:number; rot:number; rotSpd:number; }

// ─── Utility ───────────────────────────────────────────────────────────────
function hexToInt(hex: string): number {
  return parseInt(hex.replace('#',''), 16);
}
function clamp(v:number,lo:number,hi:number):number { return Math.max(lo,Math.min(hi,v)); }
function dist(ax:number,ay:number,bx:number,by:number):number { return Math.hypot(ax-bx,ay-by); }

// ══════════════════════════════════════════════════════════════════════════════
// COUNTRY SELECT SCENE
// ══════════════════════════════════════════════════════════════════════════════
class FootballSelectFactory {
  static create(PhaserLib: any) {
    return class FootballSelectScene extends PhaserLib.Scene {
      constructor() { super({ key: 'FootballSelect' }); }

      create() {
        const W = this.scale.width, H = this.scale.height;
        ga();

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x020a04,0x020a04,0x041208,0x041208,1);
        bg.fillRect(0,0,W,H);

        // Decorative pitch lines in bg
        const deco = this.add.graphics();
        deco.lineStyle(1,0x0a3014,0.6);
        deco.lineBetween(W/2,0,W/2,H);
        deco.strokeCircle(W/2,H/2,120);
        deco.strokeRect(0,H/2-80,80,160);
        deco.strokeRect(W-80,H/2-80,80,160);

        // Title
        this.add.text(W/2,28,'⚽  FIFA FOOTBALL NEO',{
          fontFamily:'Orbitron,monospace',fontSize:'28px',
          color:'#39ff14',fontWeight:'bold'
        }).setOrigin(0.5).setShadow(0,0,'#39ff14',14,true,true);

        this.add.text(W/2,64,'SELECT YOUR NATIONAL TEAM',{
          fontFamily:'Orbitron,monospace',fontSize:'12px',color:'#6baa6b',letterSpacing:3
        }).setOrigin(0.5);

        // Grid: 4 cols × 4 rows
        const cols=4, cardW=170, cardH=116, padX=14, padY=10;
        const totalW=cols*(cardW+padX)-padX;
        const startX=(W-totalW)/2+cardW/2;
        const startY=90;

        TEAMS.forEach((team,i) => {
          const col=i%cols, row=Math.floor(i/cols);
          const cx=startX+col*(cardW+padX);
          const cy=startY+row*(cardH+padY);

          const card=this.add.graphics();
          const draw=(hover:boolean)=>{
            card.clear();
            card.lineStyle(hover?2.5:1.5, hover?0x39ff14:0x1a4a22, hover?1:0.65);
            card.fillStyle(hover?0x0b1e0e:0x060e07, hover?0.98:0.88);
            card.strokeRoundedRect(cx-cardW/2,cy-cardH/2,cardW,cardH,8);
            card.fillRoundedRect(cx-cardW/2,cy-cardH/2,cardW,cardH,8);
          };
          draw(false);

          // Flag texture (canvas-drawn)
          const flagKey=`flag_${team.id}`;
          const flagW=cardW-20, flagH=50;
          if(!this.textures.exists(flagKey)){
            const ct=this.textures.createCanvas(flagKey,flagW,flagH);
            drawFlag(ct.context,team.id,0,0,flagW,flagH);
            ct.refresh();
          }
          this.add.image(cx,cy-18,flagKey);

          // Country name
          this.add.text(cx,cy+15,team.name,{
            fontFamily:'Orbitron,monospace',fontSize:'10.5px',
            color:'#c0ffc0',fontWeight:'bold'
          }).setOrigin(0.5);

          // Stars
          const stars='★'.repeat(team.rating)+'☆'.repeat(5-team.rating);
          this.add.text(cx,cy+31,stars,{
            fontFamily:'monospace',fontSize:'12px',color:'#ffcc00'
          }).setOrigin(0.5);

          // Hover + click
          const zone=this.add.zone(cx,cy,cardW,cardH).setInteractive({ useHandCursor:true });
          zone.on('pointerover',  ()=>draw(true));
          zone.on('pointerout',   ()=>draw(false));
          zone.on('pointerdown',  ()=>{
            ga();
            beep(523,'sine',0.12,0.07); setTimeout(()=>beep(784,'sine',0.18,0.07),130);
            // CPU picks random different team
            const others=TEAMS.filter(t=>t.id!==team.id);
            const cpuTeam=others[Math.floor(Math.random()*others.length)];
            this.scene.start('FootballMatch',{ human:team, cpu:cpuTeam });
          });
        });

        // Bottom guide
        this.add.text(W/2,H-16,
          '⬅ Arrow / WASD to move   •   SPACE to shoot   •   Nearest player auto-selects',{
          fontFamily:'monospace',fontSize:'10px',color:'#2a5a2a'
        }).setOrigin(0.5);
      }
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MATCH SCENE
// ══════════════════════════════════════════════════════════════════════════════
class FootballMatchFactory {
  static create(PhaserLib: any) {
    return class FootballMatchScene extends PhaserLib.Scene {

      humanTeam!: FTeam;
      cpuTeam!: FTeam;
      players!: FPlayer[];
      ball!: FBall;
      humanScore!: number;
      cpuScore!: number;
      matchTime!: number;  // seconds remaining
      phase!: 'kickoff_wait'|'kickoff_go'|'play'|'goal_pause'|'halftime'|'fulltime';
      phaseTimer!: number; // ms
      kicker!: 'human'|'cpu';
      selectedIdx!: number;
      particles!: Particle[];
      lastShotTime!: number;

      // Phaser objects
      pitchGfx!: any;
      dynGfx!: any;
      overlayGfx!: any;
      hudBg!: any;
      hudText!: any;
      centerPanel!: any;
      centerTitle!: any;
      centerSub!: any;
      numTexts!: any[];

      cursors!: any;
      wKey!: any; aKey!: any; sKey!: any; dKey!: any; spaceKey!: any;

      init(data: any) {
        this.humanTeam = data.human;
        this.cpuTeam   = data.cpu;
        this.humanScore = 0; this.cpuScore = 0;
        this.matchTime = 150; // 2.5 min = "90 min" football
        this.phase = 'kickoff_wait';
        this.phaseTimer = 2200;
        this.kicker = 'human';
        this.particles = [];
        this.lastShotTime = 0;
      }

      create() {
        const W=this.scale.width, H=this.scale.height;
        ga();

        // Dark bg
        const bgG=this.add.graphics();
        bgG.fillGradientStyle(0x020a04,0x020a04,0x041008,0x041008,1);
        bgG.fillRect(0,0,W,H);

        // Static pitch
        this.pitchGfx=this.add.graphics();
        this.drawPitch();

        // Dynamic layer
        this.dynGfx=this.add.graphics();

        // Overlay (goal flash)
        this.overlayGfx=this.add.graphics().setAlpha(0);

        // HUD bar
        this.hudBg=this.add.graphics();
        this.hudBg.fillStyle(0x000000,0.65);
        this.hudBg.fillRoundedRect(0,0,W,48,0);

        this.hudText=this.add.text(W/2,24,'',{
          fontFamily:'Orbitron,monospace',fontSize:'17px',
          color:'#ffffff',fontWeight:'bold',align:'center'
        }).setOrigin(0.5).setDepth(10);

        // Center panel for kickoff/goal/halftime/fulltime
        this.centerPanel=this.add.graphics().setDepth(20);
        this.centerTitle=this.add.text(W/2,CY-18,'',{
          fontFamily:'Orbitron,monospace',fontSize:'26px',
          color:'#ffea00',fontWeight:'bold',align:'center'
        }).setOrigin(0.5).setDepth(21);
        this.centerSub=this.add.text(W/2,CY+20,'',{
          fontFamily:'monospace',fontSize:'13px',color:'#aaaaaa',align:'center'
        }).setOrigin(0.5).setDepth(21);

        // Setup players
        this.setupPlayers();
        this.resetForKickoff(this.kicker);

        // Input
        this.cursors=this.input.keyboard.createCursorKeys();
        this.wKey=this.input.keyboard.addKey('W');
        this.aKey=this.input.keyboard.addKey('A');
        this.sKey=this.input.keyboard.addKey('S');
        this.dKey=this.input.keyboard.addKey('D');
        this.spaceKey=this.input.keyboard.addKey('SPACE');

        this.showCenterMsg('KICK OFF!', `${this.humanTeam.name} vs ${this.cpuTeam.name}`, '#39ff14');
        playWhistle();
      }

      // ── Setup ───────────────────────────────────────────────────────────
      setupPlayers() {
        this.players=[];
        const roles:FPlayer['role'][]=['gk','def','def','mid','fwd'];

        // Human players
        H_FORM.forEach(([x,y],i)=>{
          const isGK=i===0;
          this.players.push({
            x,y,vx:0,vy:0,formX:x,formY:y,
            role:roles[i],team:'human',num:i+1,
            color: hexToInt(isGK?this.humanTeam.gkKit:this.humanTeam.kit),
            colorStr: isGK?this.humanTeam.gkKit:this.humanTeam.kit,
            kickCd:0
          });
        });
        // CPU players
        C_FORM.forEach(([x,y],i)=>{
          const isGK=i===0;
          this.players.push({
            x,y,vx:0,vy:0,formX:x,formY:y,
            role:roles[i],team:'cpu',num:i+1,
            color: hexToInt(isGK?this.cpuTeam.gkKit:this.cpuTeam.kit),
            colorStr: isGK?this.cpuTeam.gkKit:this.cpuTeam.kit,
            kickCd:0
          });
        });

        // Create number text objects
        this.numTexts=this.players.map((p,i)=>{
          const t=this.add.text(p.x,p.y,`${p.num}`,{
            fontFamily:'Orbitron,monospace',fontSize:'9px',
            color:'#ffffff',fontWeight:'bold',stroke:'#000000',strokeThickness:2
          }).setOrigin(0.5).setDepth(8);
          return t;
        });
      }

      resetForKickoff(kickTeam:'human'|'cpu') {
        // Reset all to formation
        const hOff=kickTeam==='human'?[10,0]:[0,0];
        const cOff=kickTeam==='cpu'?[-10,0]:[0,0];
        this.players.forEach((p,i)=>{
          p.x=p.formX; p.y=p.formY; p.vx=0; p.vy=0; p.kickCd=0;
        });
        // Kicking team's FWD near center
        const hFwd=this.players.find(p=>p.team==='human'&&p.role==='fwd')!;
        const cFwd=this.players.find(p=>p.team==='cpu'&&p.role==='fwd')!;
        if(kickTeam==='human') { hFwd.x=CX-20; hFwd.y=CY; }
        else { cFwd.x=CX+20; cFwd.y=CY; }
        this.ball={ x:CX, y:CY, vx:0, vy:0 };
        this.updateSelected();
      }

      // ── Pitch Drawing ──────────────────────────────────────────────────
      drawPitch() {
        const g=this.pitchGfx; g.clear();
        const PW=PR-PL, PH2=PB-PT;

        // Green field with zebra stripes
        g.fillStyle(0x1a6b35,1); g.fillRoundedRect(PL,PT,PW,PH2,5);
        const sh=46;
        for(let y=PT;y<PB;y+=sh*2){ g.fillStyle(0x1e7840,0.45); g.fillRect(PL,y,PW,sh); }

        // White markings
        g.lineStyle(2,0xffffff,0.88);

        // Boundary
        g.strokeRect(PL,PT,PW,PH2);

        // Halfway line
        g.lineBetween(CX,PT,CX,PB);

        // Center circle + spot
        g.strokeCircle(CX,CY,55);
        g.fillStyle(0xffffff,0.88); g.fillCircle(CX,CY,4);

        // Penalty areas
        const paW=100,paH=198; g.lineStyle(2,0xffffff,0.7);
        g.strokeRect(PL,CY-paH/2,paW,paH);
        g.strokeRect(PR-paW,CY-paH/2,paW,paH);

        // 6-yard boxes
        const gaW=48,gaH=120;
        g.strokeRect(PL,CY-gaH/2,gaW,gaH);
        g.strokeRect(PR-gaW,CY-gaH/2,gaW,gaH);

        // Penalty spots
        g.fillStyle(0xffffff,0.7);
        g.fillCircle(PL+65,CY,3); g.fillCircle(PR-65,CY,3);

        // Corner arcs
        [[PL,PT],[PR,PT],[PL,PB],[PR,PB]].forEach(([cx,cy2])=>{
          g.fillStyle(0xffffff,0.4); g.fillCircle(cx,cy2,3);
        });

        // ── Left Goal (Human) ──
        // Net fill
        g.fillStyle(0xffffff,0.06); g.fillRect(PL-GD,GY1,GD,GOAL_H2*2);
        // Posts
        g.lineStyle(3.5,0xffffff,1);
        g.lineBetween(PL,GY1,PL-GD,GY1);
        g.lineBetween(PL,GY2,PL-GD,GY2);
        g.lineBetween(PL-GD,GY1,PL-GD,GY2);
        // Net grid
        g.lineStyle(1,0xcccccc,0.22);
        for(let nx=PL-GD+7;nx<PL;nx+=7) g.lineBetween(nx,GY1,nx,GY2);
        for(let ny=GY1+9;ny<GY2;ny+=9) g.lineBetween(PL-GD,ny,PL,ny);

        // ── Right Goal (CPU) ──
        g.fillStyle(0xffffff,0.06); g.fillRect(PR,GY1,GD,GOAL_H2*2);
        g.lineStyle(3.5,0xffffff,1);
        g.lineBetween(PR,GY1,PR+GD,GY1);
        g.lineBetween(PR,GY2,PR+GD,GY2);
        g.lineBetween(PR+GD,GY1,PR+GD,GY2);
        g.lineStyle(1,0xcccccc,0.22);
        for(let nx=PR+7;nx<PR+GD;nx+=7) g.lineBetween(nx,GY1,nx,GY2);
        for(let ny=GY1+9;ny<GY2;ny+=9) g.lineBetween(PR,ny,PR+GD,ny);

        // Team name labels on sides
        this.add.text(PL+5,PT+5,this.humanTeam.name,{
          fontFamily:'Orbitron,monospace',fontSize:'10px',color:'rgba(255,255,255,0.6)',fontWeight:'bold'
        });
        this.add.text(PR-5,PT+5,this.cpuTeam.name,{
          fontFamily:'Orbitron,monospace',fontSize:'10px',color:'rgba(255,255,255,0.6)',fontWeight:'bold'
        }).setOrigin(1,0);
      }

      // ── Main Update ─────────────────────────────────────────────────────
      update(time: number, delta: number) {
        const dt=delta/1000;
        this.lastShotTime+=delta;

        // Phase handling
        if(this.phase==='fulltime') {
          if(PhaserLib.Input.Keyboard.JustDown(this.spaceKey)||PhaserLib.Input.Keyboard.JustDown(this.cursors.space)){
            this.scene.start('FootballSelect');
          }
          this.tickParticles(dt);
          this.renderDynamic();
          return;
        }

        if(this.phase==='kickoff_wait') {
          this.phaseTimer-=delta;
          if(this.phaseTimer<=0){ this.phase='kickoff_go'; this.phaseTimer=1000; this.centerTitle.setText('GO!'); this.centerSub.setText(''); }
          this.tickParticles(dt); this.renderDynamic(); return;
        }
        if(this.phase==='kickoff_go') {
          this.phaseTimer-=delta;
          if(this.phaseTimer<=0){ this.phase='play'; this.hideCenterMsg(); }
          this.tickParticles(dt); this.renderDynamic(); return;
        }
        if(this.phase==='goal_pause') {
          this.phaseTimer-=delta;
          if(this.phaseTimer<=0){
            this.phase='kickoff_wait'; this.phaseTimer=1800;
            this.resetForKickoff(this.kicker);
            this.showCenterMsg('KICK OFF!','','#ffea00');
            playWhistle();
          }
          this.tickParticles(dt); this.renderDynamic(); return;
        }
        if(this.phase==='halftime') {
          this.phaseTimer-=delta;
          if(this.phaseTimer<=0){
            this.phase='kickoff_wait'; this.phaseTimer=2000;
            this.kicker=this.cpuScore>this.humanScore?'human':'cpu';
            this.resetForKickoff(this.kicker);
            this.showCenterMsg('2ND HALF!','','#00ffff');
            playWhistle();
          }
          this.tickParticles(dt); this.renderDynamic(); return;
        }

        // ── Active Play ──
        this.matchTime-=dt;

        // Half time at 75s
        if(this.matchTime<=75&&this.matchTime+dt>75) {
          this.phase='halftime'; this.phaseTimer=4000;
          playWhistle();
          this.showCenterMsg('HALF TIME!',`${this.humanTeam.name} ${this.humanScore} - ${this.cpuScore} ${this.cpuTeam.name}`,'#00ffff');
          return;
        }

        if(this.matchTime<=0) {
          this.matchTime=0; this.phase='fulltime';
          playFullTimeWhistle();
          this.onFullTime();
          this.renderDynamic(); return;
        }

        // Tick cooldowns
        this.players.forEach(p=>{ if(p.kickCd>0) p.kickCd=Math.max(0,p.kickCd-delta); });

        // Game logic
        this.handleHumanInput(dt);
        this.updateCpuAI(dt);
        this.updateBallPhysics(dt);
        this.checkGoal();
        this.updateSelected();
        this.tickParticles(dt);
        this.renderDynamic();
        this.updateHUD();
      }

      // ── Player selection ────────────────────────────────────────────────
      updateSelected() {
        let best=-1, bestD=Infinity;
        this.players.forEach((p,i)=>{
          if(p.team!=='human'||p.role==='gk') return;
          const d=dist(p.x,p.y,this.ball.x,this.ball.y);
          if(d<bestD){ bestD=d; best=i; }
        });
        this.selectedIdx=best>=0?best:1;
      }

      // ── Human Input ─────────────────────────────────────────────────────
      handleHumanInput(dt: number) {
        const sp=this.players[this.selectedIdx];
        if(!sp) return;

        // Movement direction
        let mvx=0,mvy=0;
        const left  = this.cursors.left.isDown  || this.aKey.isDown;
        const right = this.cursors.right.isDown || this.dKey.isDown;
        const up    = this.cursors.up.isDown    || this.wKey.isDown;
        const down  = this.cursors.down.isDown  || this.sKey.isDown;

        if(left)  mvx=-1; else if(right) mvx=1;
        if(up)    mvy=-1; else if(down)  mvy=1;
        if(mvx!==0&&mvy!==0){ mvx*=0.707; mvy*=0.707; }

        const spd=245;
        sp.vx=mvx*spd; sp.vy=mvy*spd;
        sp.x=clamp(sp.x+sp.vx*dt, PL+P_R+1, PR-P_R-1);
        sp.y=clamp(sp.y+sp.vy*dt, PT+P_R+1, PB-P_R-1);

        // Dribble: if touching ball while moving, push it
        const bd=dist(sp.x,sp.y,this.ball.x,this.ball.y);
        if(bd < P_R+B_R+3 && sp.kickCd<=0 && (Math.abs(sp.vx)>10||Math.abs(sp.vy)>10)) {
          const ang=Math.atan2(mvy,mvx);
          const pushD=P_R+B_R+3;
          this.ball.x=sp.x+Math.cos(ang)*pushD;
          this.ball.y=sp.y+Math.sin(ang)*pushD;
          this.ball.vx=sp.vx*0.85;
          this.ball.vy=sp.vy*0.85;
        }

        // Space = shoot
        if(PhaserLib.Input.Keyboard.JustDown(this.spaceKey)) {
          if(bd < P_R+B_R+55 && sp.kickCd<=0) {
            this.humanShoot(sp, mvx, mvy);
          }
        }

        // Auto: Human GK
        const hGK=this.players.find(p=>p.team==='human'&&p.role==='gk')!;
        if(hGK) this.autoGK(hGK,'human',dt);

        // Auto: Human DEFs (those not currently selected)
        this.players.filter(p=>p.team==='human'&&p.role==='def').forEach(def=>{
          if(def===sp) return;
          this.autoDefend(def,'human',dt);
        });

        // Auto: Human non-selected MID
        this.players.filter(p=>p.team==='human'&&p.role==='mid').forEach(mid=>{
          if(mid===sp) return;
          // Move to support position
          const tx=clamp(this.ball.x-80, PL+P_R, CX+20);
          const ty=clamp(this.ball.y, PT+P_R, PB-P_R);
          this.moveToward(mid,tx,ty,140,dt);
        });
      }

      humanShoot(sp:FPlayer, mvx:number, mvy:number) {
        playKick(); sp.kickCd=350; this.lastShotTime=0;
        // Aim toward CPU goal, biased by movement direction
        const goalX=PR+GD*0.4;
        const goalY=CY+(Math.random()-0.5)*GOAL_H2*1.4;
        const toGoalAng=Math.atan2(goalY-this.ball.y,goalX-this.ball.x);
        const movAng=Math.abs(mvx)+Math.abs(mvy)>0.1 ? Math.atan2(mvy,mvx) : toGoalAng;
        // Blend: 60% toward goal, 40% movement direction (when both differ)
        const ang=movAng;
        const power=500+Math.random()*80;
        this.ball.vx=Math.cos(ang)*power;
        this.ball.vy=Math.sin(ang)*power;
      }

      // ── CPU AI ──────────────────────────────────────────────────────────
      updateCpuAI(dt: number) {
        const ball=this.ball;
        const aiSpd=AI_SPD[this.cpuTeam.rating]||160;
        const humanNearBall=this.players.some(p=>p.team==='human'&&dist(p.x,p.y,ball.x,ball.y)<P_R+B_R+20);
        const cpuNearBall  =this.players.some(p=>p.team==='cpu' &&p.role!=='gk'&&dist(p.x,p.y,ball.x,ball.y)<P_R+B_R+20);

        this.players.filter(p=>p.team==='cpu').forEach(p=>{
          if(p.role==='gk') { this.autoGK(p,'cpu',dt); return; }

          let tx=p.formX, ty=p.formY;

          if(p.role==='fwd') {
            if(!humanNearBall) {
              // Chase ball
              tx=ball.x+10; ty=ball.y;
            } else {
              // Hold position slightly forward
              tx=clamp(ball.x+60,PR*0.55,PR-P_R-30); ty=clamp(ball.y,PT+P_R,PB-P_R);
            }
          } else if(p.role==='mid') {
            const advance=humanNearBall?0.2:0.65;
            tx=p.formX+(ball.x-p.formX)*advance;
            ty=p.formY+(ball.y-p.formY)*0.55;
          } else if(p.role==='def') {
            this.autoDefend(p,'cpu',dt); return;
          }

          tx=clamp(tx,PL+P_R+1,PR-P_R-1);
          ty=clamp(ty,PT+P_R+1,PB-P_R-1);
          this.moveToward(p,tx,ty,aiSpd,dt);

          // Kick ball if close
          const bd=dist(p.x,p.y,ball.x,ball.y);
          if(bd<P_R+B_R+6&&p.kickCd<=0) this.cpuKick(p);
        });
      }

      autoGK(gk:FPlayer, team:'human'|'cpu', dt:number) {
        const goalX=team==='human' ? PL+P_R+4 : PR-P_R-4;
        const ty=clamp(this.ball.y,GY1+P_R+8,GY2-P_R-8);
        const spd=185;
        gk.x=clamp(gk.x+(goalX-gk.x)*8*dt, goalX-5, goalX+5);
        gk.y+=clamp((ty-gk.y)*10*dt,-spd*dt,spd*dt);
        gk.y=clamp(gk.y,PT+P_R,PB-P_R);

        // Clear from box
        const bd=dist(gk.x,gk.y,this.ball.x,this.ball.y);
        const inBox=team==='human'
          ?(this.ball.x<PL+110&&this.ball.y>GY1-35&&this.ball.y<GY2+35)
          :(this.ball.x>PR-110&&this.ball.y>GY1-35&&this.ball.y<GY2+35);

        if(inBox&&bd<P_R+B_R+12&&gk.kickCd<=0) {
          playSave();
          gk.kickCd=900;
          const dir=team==='human'?1:-1;
          this.ball.vx=(320+Math.random()*130)*dir;
          this.ball.vy=(Math.random()-0.5)*180;
        }
      }

      autoDefend(def:FPlayer, team:'human'|'cpu', dt:number) {
        const ball=this.ball;
        const goalX=team==='human'?PL:PR;
        const ownHalf=team==='human'?ball.x<CX+60:ball.x>CX-60;

        let tx=def.formX, ty=def.formY;
        if(ownHalf) {
          // Intercept between ball and goal
          tx=clamp((ball.x+goalX)/2, PL+P_R, PR-P_R);
          ty=clamp(ball.y,PT+P_R,PB-P_R);
        } else {
          tx=def.formX; ty=clamp(ball.y,def.formY-80,def.formY+80);
        }

        const aiSpd=team==='cpu'?AI_SPD[this.cpuTeam.rating]*0.9:150;
        this.moveToward(def,tx,ty,aiSpd,dt);

        // Clear ball if close
        const bd=dist(def.x,def.y,ball.x,ball.y);
        if(bd<P_R+B_R+8&&def.kickCd<=0) {
          if(team==='cpu') this.cpuKick(def);
          else {
            playKick(); def.kickCd=400;
            const dir=1; // human DEFs kick right
            this.ball.vx=(220+Math.random()*100)*dir;
            this.ball.vy=(Math.random()-0.5)*150;
          }
        }
      }

      cpuKick(p:FPlayer) {
        playKick(); p.kickCd=400+Math.random()*200;
        const acc=this.cpuTeam.rating/5;
        const bdist=dist(p.x,p.y,PL,CY);

        if(bdist<240||(p.role==='fwd'&&bdist<340)) {
          // Shoot at human goal (left)
          const jitter=(1-acc)*GOAL_H2*1.8;
          const gy=CY+(Math.random()-0.5)*jitter;
          const ang=Math.atan2(gy-this.ball.y,(PL-GD*0.4)-this.ball.x);
          const pwr=470+acc*80+Math.random()*60;
          this.ball.vx=Math.cos(ang)*pwr;
          this.ball.vy=Math.sin(ang)*pwr;
        } else {
          // Pass toward goal
          const ang=Math.atan2(p.vy+(Math.random()-0.5)*60, p.vx+(Math.random()-0.5)*60-20);
          const pwr=280+Math.random()*120;
          this.ball.vx=Math.cos(ang)*pwr;
          this.ball.vy=Math.sin(ang)*pwr;
        }
      }

      moveToward(p:FPlayer, tx:number, ty:number, spd:number, dt:number) {
        const dx=tx-p.x, dy=ty-p.y;
        const dd=Math.hypot(dx,dy);
        if(dd>3) {
          p.vx=dx/dd*spd; p.vy=dy/dd*spd;
          p.x=clamp(p.x+p.vx*dt,PL+P_R+1,PR-P_R-1);
          p.y=clamp(p.y+p.vy*dt,PT+P_R+1,PB-P_R-1);
        } else { p.vx=0; p.vy=0; }
      }

      // ── Ball Physics ────────────────────────────────────────────────────
      updateBallPhysics(dt: number) {
        const b=this.ball;
        b.x+=b.vx*dt; b.y+=b.vy*dt;

        // Friction
        const fric=Math.pow(0.928,dt*60);
        b.vx*=fric; b.vy*=fric;
        if(Math.abs(b.vx)<1.5) b.vx=0;
        if(Math.abs(b.vy)<1.5) b.vy=0;

        // Top/bottom wall bounce
        if(b.y<PT+B_R){ b.y=PT+B_R; b.vy=Math.abs(b.vy)*0.65; }
        if(b.y>PB-B_R){ b.y=PB-B_R; b.vy=-Math.abs(b.vy)*0.65; }

        // Side wall bounce (unless in goal mouth)
        const inLGoal=(b.y>GY1&&b.y<GY2);
        const inRGoal=(b.y>GY1&&b.y<GY2);

        if(b.x<PL+B_R&&!inLGoal){ b.x=PL+B_R; b.vx=Math.abs(b.vx)*0.65; }
        if(b.x>PR-B_R&&!inRGoal){ b.x=PR-B_R; b.vx=-Math.abs(b.vx)*0.65; }

        // Goal net back walls
        if(b.x<PL-GD+B_R){ b.x=PL-GD+B_R; b.vx=Math.abs(b.vx)*0.35; }
        if(b.x>PR+GD-B_R){ b.x=PR+GD-B_R; b.vx=-Math.abs(b.vx)*0.35; }
        // Goal top/bottom posts inside net
        if(b.x<PL&&b.y<GY1+B_R&&b.y>GY1-B_R-10){ b.y=GY1-B_R; b.vy=-Math.abs(b.vy)*0.5; }
        if(b.x<PL&&b.y>GY2-B_R&&b.y<GY2+B_R+10){ b.y=GY2+B_R; b.vy=Math.abs(b.vy)*0.5; }
        if(b.x>PR&&b.y<GY1+B_R&&b.y>GY1-B_R-10){ b.y=GY1-B_R; b.vy=-Math.abs(b.vy)*0.5; }
        if(b.x>PR&&b.y>GY2-B_R&&b.y<GY2+B_R+10){ b.y=GY2+B_R; b.vy=Math.abs(b.vy)*0.5; }
      }

      // ── Goal Detection ───────────────────────────────────────────────────
      checkGoal() {
        const b=this.ball;
        // CPU goal (human scores) — ball crosses right goal line
        if(b.x>PR+GD*0.6&&b.y>GY1&&b.y<GY2&&this.phase==='play') {
          this.humanScore++;
          this.onGoal('human');
        }
        // Human goal (cpu scores) — ball crosses left goal line
        if(b.x<PL-GD*0.6&&b.y>GY1&&b.y<GY2&&this.phase==='play') {
          this.cpuScore++;
          this.onGoal('cpu');
        }
      }

      onGoal(scorer:'human'|'cpu') {
        this.phase='goal_pause'; this.phaseTimer=3500;
        this.kicker=scorer==='human'?'cpu':'human';

        playGoal();
        playCelebration();

        // Camera flash
        this.cameras.main.flash(400,scorer==='human'?0:255,scorer==='human'?200:0,scorer==='human'?0:0);

        // Message
        const title=scorer==='human'?`GOAL! ⚽ ${this.humanTeam.name}!`:`GOAL! ⚽ ${this.cpuTeam.name}!`;
        const sub=`${this.humanTeam.name}  ${this.humanScore} — ${this.cpuScore}  ${this.cpuTeam.name}`;
        this.showCenterMsg(title, sub, scorer==='human'?'#39ff14':'#ff3355');

        // Confetti / particles burst
        this.spawnGoalParticles(scorer);

        // Freeze ball in goal
        this.ball.vx=0; this.ball.vy=0;
      }

      spawnGoalParticles(scorer:'human'|'cpu') {
        const bx=this.ball.x, by=this.ball.y;
        const colors=scorer==='human'
          ?['#39ff14','#ffea00','#00ffff','#ffffff']
          :['#ff3355','#ff6600','#ffea00','#ff00ff'];
        for(let i=0;i<100;i++){
          const ang=Math.random()*Math.PI*2;
          const spd=80+Math.random()*350;
          this.particles.push({
            x:bx, y:by,
            vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd-120,
            color:colors[i%colors.length],
            life:1.8+Math.random()*0.8, maxLife:2.2,
            size:3+Math.random()*5,
            rot:Math.random()*Math.PI*2,
            rotSpd:(Math.random()-0.5)*10
          });
        }
      }

      onFullTime() {
        let result='DRAW! 🤝', col='#ffea00';
        if(this.humanScore>this.cpuScore){ result='YOU WIN! 🏆'; col='#39ff14'; playCelebration(); }
        else if(this.cpuScore>this.humanScore){ result='YOU LOSE 😢'; col='#ff3355'; }

        const title=`FULL TIME! ${result}`;
        const sub=`${this.humanTeam.name}  ${this.humanScore} — ${this.cpuScore}  ${this.cpuTeam.name}\n\nPress SPACE to play again`;
        this.showCenterMsg(title, sub, col);

        // Leaderboard
        const pts=this.humanScore*100+(this.humanScore>this.cpuScore?50:0);
        window.dispatchEvent(new CustomEvent('phaser-game-over',{
          detail:{ gameKey:'football', score:pts }
        }));
      }

      // ── Rendering ───────────────────────────────────────────────────────
      renderDynamic() {
        const g=this.dynGfx; g.clear();

        // Particles
        this.particles.forEach(p=>{
          const alpha=Math.min(1,(p.life/p.maxLife)*1.5);
          try {
            const col=parseInt(p.color.replace('#',''),16);
            g.fillStyle(col,alpha);
          } catch { g.fillStyle(0xffffff,alpha); }
          // Draw as small rotated rect
          const hw=p.size/2, hh=p.size*0.6/2;
          g.fillRect(p.x-hw,p.y-hh,p.size,p.size*0.6);
        });

        // Player shadows
        this.players.forEach(p=>{
          g.fillStyle(0x000000,0.18);
          g.fillEllipse(p.x+2,p.y+P_R*0.7+4,P_R*1.7,P_R*0.55);
        });

        // Ball shadow
        g.fillStyle(0x000000,0.3);
        g.fillEllipse(this.ball.x+3,this.ball.y+6,B_R*2.2,B_R*0.9);

        // Players
        this.players.forEach((p,i)=>{
          const isSelected=(i===this.selectedIdx&&p.team==='human');

          // Selection glow ring
          if(isSelected) {
            g.lineStyle(2.5,0xffffff,0.9);
            g.strokeCircle(p.x,p.y,P_R+5);
            // Pulsing outer ring
            const pulse=0.5+0.5*Math.sin(Date.now()*0.006);
            g.lineStyle(1.5,0x39ff14,pulse*0.7);
            g.strokeCircle(p.x,p.y,P_R+10);
          }

          // Jersey
          g.fillStyle(p.color,1);
          g.fillCircle(p.x,p.y,P_R);

          // Jersey stripe (shorts color)
          const shortCol=hexToInt(p.team==='human'?this.humanTeam.shorts:this.cpuTeam.shorts);
          g.fillStyle(shortCol,0.65);
          g.fillRect(p.x-P_R*0.5,p.y-3,P_R,6);

          // GK indicator: bright halo
          if(p.role==='gk') {
            g.lineStyle(2,0xffffff,0.6);
            g.strokeCircle(p.x,p.y,P_R+2);
          }
        });

        // Ball
        g.fillStyle(0xffffff,1);
        g.fillCircle(this.ball.x,this.ball.y,B_R);
        // Soccer ball pattern (black pentagons = simplified black spots)
        g.fillStyle(0x111111,0.75);
        g.fillCircle(this.ball.x-2.5,this.ball.y-2.5,2.8);
        g.fillCircle(this.ball.x+3,this.ball.y,2.2);
        g.fillCircle(this.ball.x-1,this.ball.y+3,2);
        g.fillStyle(0xffffff,0.4);
        g.fillCircle(this.ball.x-2,this.ball.y-3,1.5); // highlight

        // Update player number text positions
        this.players.forEach((p,i)=>{
          if(this.numTexts[i]) {
            this.numTexts[i].setPosition(p.x,p.y);
          }
        });
      }

      // ── HUD ─────────────────────────────────────────────────────────────
      updateHUD() {
        const elapsed=150-this.matchTime;
        const gameMins=Math.floor(elapsed/150*90);
        const timeStr=`${gameMins.toString().padStart(2,"0")}'`;

        const h=this.humanTeam, c=this.cpuTeam;
        this.hudText.setText(
          `${h.name}  ${this.humanScore}  ─  ${this.cpuScore}  ${c.name}     ${timeStr}`
        );
      }

      // ── Center Panel ─────────────────────────────────────────────────────
      showCenterMsg(title:string, sub:string, color:string) {
        const W=this.scale.width;
        this.centerPanel.clear();
        this.centerPanel.fillStyle(0x000000,0.78);
        this.centerPanel.fillRoundedRect(W/2-230,CY-65,460,130,12);
        this.centerPanel.lineStyle(2,parseInt(color.replace('#',''),16),0.9);
        this.centerPanel.strokeRoundedRect(W/2-230,CY-65,460,130,12);
        this.centerTitle.setText(title).setStyle({color}).setAlpha(1);
        this.centerSub.setText(sub).setAlpha(1);
      }
      hideCenterMsg() {
        this.centerPanel.clear();
        this.centerTitle.setText('').setAlpha(0);
        this.centerSub.setText('').setAlpha(0);
      }

      // ── Particles ────────────────────────────────────────────────────────
      tickParticles(dt:number) {
        this.particles=this.particles.filter(p=>{
          p.x+=p.vx*dt; p.y+=p.vy*dt;
          p.vy+=220*dt; // gravity
          p.vx*=0.97;
          p.rot+=p.rotSpd*dt;
          p.life-=dt;
          return p.life>0;
        });
      }
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// BOOT & EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default class FootballGameFactory {
  static create(PhaserLib: any) {
    const SelectScene=FootballSelectFactory.create(PhaserLib);
    const MatchScene =FootballMatchFactory.create(PhaserLib);

    return class FootballBootScene extends PhaserLib.Scene {
      constructor() { super({ key: 'FootballBoot' }); }
      create() {
        this.scene.add('FootballSelect', SelectScene, false);
        this.scene.add('FootballMatch',  MatchScene,  false);
        this.scene.start('FootballSelect');
      }
    };
  }
}
