// Candy Match Neo — Multi-Level Match-3 Game
// Register key: 'candy-match' in PhaserGameEngine.tsx

// ─── Audio Context ─────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const A = window.AudioContext || (window as any).webkitAudioContext;
    if (A) audioCtx = new A();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playSynth(freq: number, type: OscillatorType = 'sine', dur = 0.12, gain = 0.1) {
  const ctx = getAudioContext(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) { /* silent */ }
}
function playSweep(f1: number, f2: number, dur: number, type: OscillatorType = 'sine', gain = 0.1) {
  const ctx = getAudioContext(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) { /* silent */ }
}
function playNoise(dur = 0.25, gain = 0.12) {
  const ctx = getAudioContext(); if (!ctx) return;
  try {
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filt); filt.connect(g); g.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + dur);
  } catch (e) { /* silent */ }
}
function playChord(freqs: number[], dur = 0.3) {
  freqs.forEach((f, i) => setTimeout(() => playSynth(f, 'sine', dur, 0.07), i * 60));
}

// ─── Level Config ──────────────────────────────────────────────────────────
interface LevelConfig {
  level: number;
  targetScore: number;
  moves: number;
  candyTypes: number;        // 3–6 types active
  iceBlocks: Array<{r:number,c:number}>;
  accentColor: number;       // board border colour
  accentStr: string;
  name: string;
}

const LEVELS: LevelConfig[] = [
  { level:1,  targetScore:800,   moves:30, candyTypes:4, iceBlocks:[],                                                              accentColor:0x00ffff, accentStr:'#00ffff', name:'Sweet Start'      },
  { level:2,  targetScore:1400,  moves:28, candyTypes:4, iceBlocks:[{r:3,c:3},{r:4,c:4}],                                          accentColor:0x00ffff, accentStr:'#00ffff', name:'Frozen Few'       },
  { level:3,  targetScore:2200,  moves:26, candyTypes:5, iceBlocks:[{r:2,c:2},{r:2,c:5},{r:5,c:2},{r:5,c:5}],                    accentColor:0xff00ff, accentStr:'#ff00ff', name:'Cornered'         },
  { level:4,  targetScore:3200,  moves:25, candyTypes:5, iceBlocks:[{r:0,c:0},{r:0,c:7},{r:7,c:0},{r:7,c:7}],                    accentColor:0xff00ff, accentStr:'#ff00ff', name:'Corner Clash'     },
  { level:5,  targetScore:4500,  moves:24, candyTypes:5, iceBlocks:[{r:3,c:1},{r:3,c:6},{r:4,c:1},{r:4,c:6}],                    accentColor:0xbd00ff, accentStr:'#bd00ff', name:'Side Freeze'      },
  { level:6,  targetScore:6000,  moves:23, candyTypes:5, iceBlocks:[{r:1,c:3},{r:1,c:4},{r:6,c:3},{r:6,c:4}],                    accentColor:0xbd00ff, accentStr:'#bd00ff', name:'Top & Bottom'     },
  { level:7,  targetScore:8000,  moves:22, candyTypes:6, iceBlocks:[{r:2,c:0},{r:2,c:7},{r:5,c:0},{r:5,c:7},{r:0,c:2},{r:7,c:2}],accentColor:0x39ff14, accentStr:'#39ff14', name:'Wall of Ice'      },
  { level:8,  targetScore:10000, moves:22, candyTypes:6, iceBlocks:[{r:3,c:2},{r:3,c:3},{r:3,c:4},{r:3,c:5}],                    accentColor:0x39ff14, accentStr:'#39ff14', name:'Ice Barrier'      },
  { level:9,  targetScore:12500, moves:21, candyTypes:6, iceBlocks:[{r:1,c:1},{r:1,c:6},{r:6,c:1},{r:6,c:6},{r:3,c:3},{r:4,c:4}],accentColor:0xffea00, accentStr:'#ffea00', name:'Diamond Freeze'   },
  { level:10, targetScore:15000, moves:20, candyTypes:6, iceBlocks:[{r:0,c:3},{r:0,c:4},{r:7,c:3},{r:7,c:4},{r:3,c:0},{r:4,c:0},{r:3,c:7},{r:4,c:7}], accentColor:0xffea00, accentStr:'#ffea00', name:'Cross Guard' },
  { level:11, targetScore:18000, moves:20, candyTypes:6, iceBlocks:[{r:2,c:1},{r:2,c:2},{r:2,c:5},{r:2,c:6},{r:5,c:1},{r:5,c:2},{r:5,c:5},{r:5,c:6}], accentColor:0xff9900, accentStr:'#ff9900', name:'Quad Patch' },
  { level:12, targetScore:22000, moves:19, candyTypes:6, iceBlocks:[{r:1,c:2},{r:1,c:5},{r:6,c:2},{r:6,c:5},{r:3,c:1},{r:4,c:1},{r:3,c:6},{r:4,c:6}], accentColor:0xff9900, accentStr:'#ff9900', name:'Fortress'   },
  { level:13, targetScore:26500, moves:19, candyTypes:6, iceBlocks:[{r:0,c:1},{r:0,c:6},{r:7,c:1},{r:7,c:6},{r:1,c:0},{r:6,c:0},{r:1,c:7},{r:6,c:7}], accentColor:0xff0055, accentStr:'#ff0055', name:'Outer Ring'  },
  { level:14, targetScore:32000, moves:18, candyTypes:6, iceBlocks:[{r:2,c:3},{r:2,c:4},{r:5,c:3},{r:5,c:4},{r:3,c:2},{r:4,c:2},{r:3,c:5},{r:4,c:5}], accentColor:0xff0055, accentStr:'#ff0055', name:'Inner Box'   },
  { level:15, targetScore:38000, moves:18, candyTypes:6, iceBlocks:[{r:0,c:0},{r:0,c:7},{r:7,c:0},{r:7,c:7},{r:3,c:3},{r:3,c:4},{r:4,c:3},{r:4,c:4}], accentColor:0x00ffaa, accentStr:'#00ffaa', name:'Corner + Core'},
  { level:16, targetScore:45000, moves:17, candyTypes:6, iceBlocks:[{r:1,c:1},{r:1,c:3},{r:1,c:5},{r:3,c:1},{r:3,c:3},{r:3,c:5},{r:5,c:1},{r:5,c:3},{r:5,c:5}], accentColor:0x00ffaa, accentStr:'#00ffaa', name:'Grid Lock'  },
  { level:17, targetScore:54000, moves:17, candyTypes:6, iceBlocks:[{r:0,c:2},{r:0,c:5},{r:2,c:0},{r:2,c:7},{r:5,c:0},{r:5,c:7},{r:7,c:2},{r:7,c:5}], accentColor:0xffaaff, accentStr:'#ffaaff', name:'X Frame'    },
  { level:18, targetScore:64000, moves:16, candyTypes:6, iceBlocks:[{r:1,c:1},{r:1,c:2},{r:1,c:5},{r:1,c:6},{r:6,c:1},{r:6,c:2},{r:6,c:5},{r:6,c:6},{r:3,c:3},{r:4,c:4}], accentColor:0xffaaff, accentStr:'#ffaaff', name:'Twin Towers'},
  { level:19, targetScore:75000, moves:16, candyTypes:6, iceBlocks:[{r:0,c:0},{r:0,c:3},{r:0,c:4},{r:0,c:7},{r:7,c:0},{r:7,c:3},{r:7,c:4},{r:7,c:7},{r:3,c:0},{r:4,c:0},{r:3,c:7},{r:4,c:7}], accentColor:0xffd700, accentStr:'#ffd700', name:'Titan'       },
  { level:20, targetScore:90000, moves:15, candyTypes:6, iceBlocks:[{r:1,c:1},{r:1,c:2},{r:1,c:5},{r:1,c:6},{r:2,c:1},{r:2,c:6},{r:5,c:1},{r:5,c:6},{r:6,c:1},{r:6,c:2},{r:6,c:5},{r:6,c:6}], accentColor:0xffd700, accentStr:'#ffd700', name:'Grand Finale' },
];

const SAVE_KEY = 'candy_match_progress';
function getProgress(): { unlockedLevel: number; stars: number[] } {
  if (typeof window === 'undefined') return { unlockedLevel: 1, stars: Array(20).fill(0) };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { unlockedLevel: 1, stars: Array(20).fill(0) };
}
function saveProgress(levelIndex: number, stars: number) {
  if (typeof window === 'undefined') return;
  const prog = getProgress();
  prog.stars[levelIndex] = Math.max(prog.stars[levelIndex] || 0, stars);
  if (levelIndex + 1 < 20) {
    prog.unlockedLevel = Math.max(prog.unlockedLevel, levelIndex + 2);
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(prog));
}

// ─── Candy Types ───────────────────────────────────────────────────────────
const TILE_SIZE = 56;       // each candy cell
const GRID_ROWS = 8;
const GRID_COLS = 8;
// BOARD_X / BOARD_Y are now computed per-scene from this.scale.width/height
// to keep the layout fully responsive and centered on any screen size.
// HUD is a compact strip at the top; board is centered below it.
const HUD_H    = 80;        // top HUD strip height
function getBoardX(W: number) { return Math.round((W - GRID_COLS * TILE_SIZE) / 2); }
function getBoardY()           { return HUD_H + 10; }

const ALL_CANDY_TYPES = [
  { type: 0, colorStr: '#ff0055' },
  { type: 1, colorStr: '#00ffff' },
  { type: 2, colorStr: '#39ff14' },
  { type: 3, colorStr: '#ffea00' },
  { type: 4, colorStr: '#bd00ff' },
  { type: 5, colorStr: '#ff9900' },
];

interface Candy {
  sprite: any;
  type: number;
  special: 'striped-h' | 'striped-v' | 'wrapped' | 'color-bomb' | null;
  iceHp: number; // 0=no ice, 1=cracked ice, 2=full ice
  iceSprite?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL SELECT SCENE
// ═══════════════════════════════════════════════════════════════════════════
class CandyLevelSelectFactory {
  static create(PhaserLib: any) {
    return class CandyLevelSelectScene extends PhaserLib.Scene {
      constructor() { super({ key: 'CandyLevelSelect' }); }

      create() {
        const W = this.scale.width, H = this.scale.height;
        const prog = getProgress();

        // Animated gradient BG
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x05030f, 0x05030f, 0x0d0520, 0x0d0520, 1);
        bg.fillRect(0, 0, W, H);

        // Title
        this.add.text(W / 2, 38, 'CANDY MATCH NEO', {
          fontFamily: 'Orbitron, monospace', fontSize: '26px',
          color: '#ff00ff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff00ff', 10, true, true);
        this.add.text(W / 2, 70, '— SELECT LEVEL —', {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#9090b0'
        }).setOrigin(0.5);

        // Responsive grid: 4 cols on wide, 4 on narrow
        const cols = W >= 600 ? 4 : 4;
        const gapX = Math.max(8, (W - 40 - cols * 110) / (cols - 1));
        const btnW = Math.min(130, Math.floor((W - 40 - gapX * (cols - 1)) / cols));
        const btnH = Math.round(btnW * 0.85);
        const padX = gapX, padY = 12;
        const startX = Math.round((W - (cols * btnW + (cols - 1) * padX)) / 2) + Math.round(btnW / 2);
        const startY = 110;

        for (let i = 0; i < 20; i++) {
          const col = i % cols, row = Math.floor(i / cols);
          const x = startX + col * (btnW + padX);
          const y = startY + row * (btnH + padY);
          const lvl = LEVELS[i];
          const unlocked = (i + 1) <= prog.unlockedLevel;
          const starCount = prog.stars[i] || 0;

          // Button panel
          const panelColor = unlocked ? 0x0d0d28 : 0x08080f;
          const borderColor = unlocked ? lvl.accentColor : 0x333355;
          const panel = this.add.graphics();
          panel.lineStyle(unlocked ? 2 : 1, borderColor, unlocked ? 0.9 : 0.4);
          panel.fillStyle(panelColor, unlocked ? 0.95 : 0.5);
          panel.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 8);
          panel.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 8);

          if (unlocked) {
            const fs = Math.max(14, Math.round(btnW * 0.22));
            // Level number
            this.add.text(x, y - btnH/2 + 16, `${i + 1}`, {
              fontFamily: 'Orbitron, monospace', fontSize: `${fs}px`,
              color: lvl.accentStr, fontWeight: 'bold'
            }).setOrigin(0.5).setShadow(0, 0, lvl.accentStr, 4, true, true);

            // Level name
            this.add.text(x, y - btnH/2 + 36, lvl.name, {
              fontFamily: 'monospace', fontSize: '9px', color: '#ccccee',
              wordWrap: { width: btnW - 10 }
            }).setOrigin(0.5);

            // Stars
            const starStr = ['☆☆☆', '★☆☆', '★★☆', '★★★'][starCount];
            const starColor = starCount === 0 ? '#404060' : starCount === 3 ? '#ffd700' : '#ffaa00';
            this.add.text(x, y + btnH/2 - 14, starStr, {
              fontFamily: 'monospace', fontSize: '11px', color: starColor
            }).setOrigin(0.5);

            // Clickable zone
            const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });
            zone.on('pointerover', () => {
              panel.clear();
              panel.lineStyle(2.5, lvl.accentColor, 1);
              panel.fillStyle(0x14143a, 0.98);
              panel.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 8);
              panel.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 8);
            });
            zone.on('pointerout', () => {
              panel.clear();
              panel.lineStyle(2, borderColor, 0.9);
              panel.fillStyle(panelColor, 0.95);
              panel.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 8);
              panel.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 8);
            });
            zone.on('pointerdown', () => {
              getAudioContext();
              playSweep(400, 800, 0.15, 'sine', 0.07);
              this.scene.start('CandyMatch', { levelIndex: i });
            });
          } else {
            // Locked level
            this.add.text(x, y - 8, '🔒', { fontSize: '20px' }).setOrigin(0.5).setAlpha(0.5);
            this.add.text(x, y + 16, `${i + 1}`, {
              fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#444466'
            }).setOrigin(0.5);
          }
        }

        // Hint at bottom
        this.add.text(W / 2, H - 14, '★★★ = 200% of target  ·  Unlock all 20 levels!', {
          fontFamily: 'monospace', fontSize: '9px', color: '#505070'
        }).setOrigin(0.5);
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAME SCENE
// ═══════════════════════════════════════════════════════════════════════════
class CandyMatchSceneFactory {
  static create(PhaserLib: any) {
    return class CandyMatchScene extends PhaserLib.Scene {
      score!: number;
      movesLeft!: number;
      isOver!: boolean;
      isLocked!: boolean;
      cascadeMultiplier!: number;

      board!: Array<Array<Candy | null>>;
      selectedTile!: { row: number, col: number } | null;

      levelConfig!: LevelConfig;
      levelIndex!: number;
      activeCandyTypes!: number;

      // HUD refs
      scoreText!: any;
      targetText!: any;
      movesText!: any;
      progressBar!: any;
      progressFill!: any;

      gridGraphics!: any;
      particleEmitter!: any;

      constructor() { super({ key: 'CandyMatch' }); }

      init(data: any) {
        this.levelIndex = data?.levelIndex ?? 0;
        this.levelConfig = LEVELS[this.levelIndex];
        this.activeCandyTypes = this.levelConfig.candyTypes;

        this.score = 0;
        this.movesLeft = this.levelConfig.moves;
        this.isOver = false;
        this.isLocked = false;
        this.cascadeMultiplier = 1;
        this.selectedTile = null;

        this.board = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
      }

      create() {
        const W = this.scale.width, H = this.scale.height;
        const cfg = this.levelConfig;

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x05030f, 0x05030f, 0x0c0420, 0x0c0420, 1);
        bg.fillRect(0, 0, W, H);

        this.gridGraphics = this.add.graphics();

        // ── Generate Textures ──
        this.generateAllTextures();

        // ── Draw Board ──
        this.drawBoard();

        // ── HUD ──
        this.buildHUD();

        // ── Initialize Board ──
        this.initBoard();

        // ── Input ──
        // 'gameobjectdown' correctly passes (pointer, gameObject) unlike 'pointerdown'
        this.input.on('gameobjectdown', this.onPointerDown, this);

        // ── Level Start Banner ──
        this.showLevelBanner();
      }

      // ────────────────────────────────────────────────────
      // Texture generation
      // ────────────────────────────────────────────────────
      generateAllTextures() {
        const gen = (key: string, w: number, h: number, fn: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const ct = this.textures.createCanvas(key, w, h);
          fn(ct.context); ct.refresh();
        };

        const applyStyle = (ctx: CanvasRenderingContext2D, style: string) => {
          if (style === 'sh') {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(5,25); ctx.lineTo(45,25); ctx.stroke();
          } else if (style === 'sv') {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(25,5); ctx.lineTo(25,45); ctx.stroke();
          } else if (style === 'w') {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
            ctx.setLineDash([4,2]);
            ctx.beginPath(); ctx.arc(25,25,22,0,Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
          }
        };

        ALL_CANDY_TYPES.forEach(({ type, colorStr: c }) => {
          const styles = ['', 'sh', 'sv', 'w'];
          styles.forEach(s => {
            const key = `candy-${type}${s ? '-'+s : ''}`;
            gen(key, 50, 50, (ctx) => {
              ctx.clearRect(0,0,50,50);
              ctx.shadowColor = c; ctx.shadowBlur = 10; ctx.fillStyle = c;
              if (type === 0) { // heart
                ctx.beginPath();
                ctx.moveTo(25,17); ctx.bezierCurveTo(25,14,20,9,14,9);
                ctx.bezierCurveTo(7,9,7,18.5,7,18.5); ctx.bezierCurveTo(7,26,17,34,25,41);
                ctx.bezierCurveTo(33,34,43,26,43,18.5); ctx.bezierCurveTo(43,18.5,43,9,36,9);
                ctx.bezierCurveTo(30,9,25,14,25,17); ctx.fill();
              } else if (type === 1) { // diamond
                ctx.beginPath();
                ctx.moveTo(25,6); ctx.lineTo(44,25); ctx.lineTo(25,44); ctx.lineTo(6,25);
                ctx.closePath(); ctx.fill();
              } else if (type === 2) { // star
                const sp=5,or=19,ir=8; let rot=(Math.PI/2)*3;
                ctx.beginPath(); ctx.moveTo(25,25-or);
                for(let i=0;i<sp;i++){
                  ctx.lineTo(25+Math.cos(rot)*or,25+Math.sin(rot)*or); rot+=Math.PI/sp;
                  ctx.lineTo(25+Math.cos(rot)*ir,25+Math.sin(rot)*ir); rot+=Math.PI/sp;
                } ctx.closePath(); ctx.fill();
              } else if (type === 3) { // lemon ellipse
                ctx.beginPath(); ctx.ellipse(25,25,18,12,0,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1;
                ctx.beginPath(); ctx.ellipse(25,25,12,7,0,0,Math.PI*2); ctx.stroke();
              } else if (type === 4) { // hexagon
                const sd=16, hx=sd*Math.sqrt(3)/2;
                ctx.beginPath();
                ctx.moveTo(25,25-sd); ctx.lineTo(25+hx,25-sd/2); ctx.lineTo(25+hx,25+sd/2);
                ctx.lineTo(25,25+sd); ctx.lineTo(25-hx,25+sd/2); ctx.lineTo(25-hx,25-sd/2);
                ctx.closePath(); ctx.fill();
              } else { // circle with spiral
                ctx.beginPath(); ctx.arc(25,25,17,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2;
                ctx.beginPath(); ctx.arc(25,25,9,0,Math.PI*1.4); ctx.stroke();
              }
              applyStyle(ctx, s);
            });
          });
        });

        // Color bomb
        gen('candy-color-bomb', 50, 50, ctx => {
          const g = ctx.createRadialGradient(25,25,2,25,25,19);
          g.addColorStop(0,'#fff'); g.addColorStop(0.3,'#ff00ff');
          g.addColorStop(0.6,'#00ffff'); g.addColorStop(1,'#ffea00');
          ctx.shadowBlur=12; ctx.shadowColor='#ffffff';
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(25,25,19,0,Math.PI*2); ctx.fill();
          ctx.fillStyle='#fff';
          [[23,3],[23,43],[3,23],[43,23],[10,10],[40,10],[10,40],[40,40]].forEach(([x,y])=>{
            ctx.fillRect(x,y,4,4);
          });
        });

        // Ice overlay (full ice)
        gen('ice-block', 50, 50, ctx => {
          ctx.fillStyle='rgba(160,220,255,0.55)'; ctx.fillRect(0,0,50,50);
          ctx.strokeStyle='rgba(200,240,255,0.9)'; ctx.lineWidth=2;
          ctx.strokeRect(2,2,46,46);
          ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(8,8); ctx.lineTo(42,42); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(42,8); ctx.lineTo(8,42); ctx.stroke();
        });

        // Ice overlay (cracked)
        gen('ice-crack', 50, 50, ctx => {
          ctx.fillStyle='rgba(120,180,220,0.35)'; ctx.fillRect(0,0,50,50);
          ctx.strokeStyle='rgba(200,230,255,0.7)'; ctx.lineWidth=1.5;
          ctx.strokeRect(2,2,46,46);
          ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1;
          // crack lines
          ctx.beginPath(); ctx.moveTo(25,5); ctx.lineTo(20,20); ctx.lineTo(35,35); ctx.lineTo(25,45); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(10,25); ctx.lineTo(28,22); ctx.lineTo(40,30); ctx.stroke();
        });

        // Sparkle particle
        gen('sparkle', 6, 6, ctx => { ctx.fillStyle='#fff'; ctx.fillRect(0,0,6,6); });
      }

      // ────────────────────────────────────────────────────
      // Board background drawing
      // ────────────────────────────────────────────────────
      drawBoard() {
        const gfx = this.gridGraphics;
        gfx.clear();
        const cfg = this.levelConfig;
        const W = this.scale.width;
        const BX = getBoardX(W);
        const BY = getBoardY();
        const BW = GRID_COLS * TILE_SIZE;
        const BH = GRID_ROWS * TILE_SIZE;

        // Background fill
        gfx.fillStyle(0x08081a, 0.9);
        gfx.fillRoundedRect(BX-6, BY-6, BW+12, BH+12, 10);

        // Glow border
        gfx.lineStyle(2.5, cfg.accentColor, 0.85);
        gfx.strokeRoundedRect(BX-6, BY-6, BW+12, BH+12, 10);

        // Outer glow
        gfx.lineStyle(8, cfg.accentColor, 0.08);
        gfx.strokeRoundedRect(BX-12, BY-12, BW+24, BH+24, 14);

        // Cell lines
        gfx.lineStyle(0.5, 0x1c1c40, 0.7);
        for (let r = 1; r < GRID_ROWS; r++) {
          const y = BY + r * TILE_SIZE;
          gfx.lineBetween(BX, y, BX + BW, y);
        }
        for (let c = 1; c < GRID_COLS; c++) {
          const x = BX + c * TILE_SIZE;
          gfx.lineBetween(x, BY, x, BY + BH);
        }
      }

      // ────────────────────────────────────────────────────
      // HUD — compact top bar spanning full canvas width
      // ────────────────────────────────────────────────────
      buildHUD() {
        const cfg = this.levelConfig;
        const W = this.scale.width;
        const H = this.scale.height;

        // ── Top HUD strip background ──
        const hudBg = this.add.graphics();
        hudBg.fillStyle(0x07071a, 0.97);
        hudBg.fillRect(0, 0, W, HUD_H);
        hudBg.lineStyle(1, cfg.accentColor, 0.3);
        hudBg.lineBetween(0, HUD_H, W, HUD_H);

        // ── Back button (top-left) ──
        const backBtn = this.add.text(10, 8, '‹ LEVELS', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#9090b0'
        }).setInteractive({ useHandCursor: true });
        backBtn.on('pointerover', () => backBtn.setStyle({ color: '#ffffff' }));
        backBtn.on('pointerout',  () => backBtn.setStyle({ color: '#9090b0' }));
        backBtn.on('pointerdown', () => {
          playSweep(600, 300, 0.15, 'sine', 0.05);
          this.scene.start('CandyLevelSelect');
        });

        // ── Level badge (top-left under back btn) ──
        this.add.text(10, 26, `LVL ${cfg.level}  ${cfg.name}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '13px',
          color: cfg.accentStr, fontWeight: 'bold'
        }).setShadow(0, 0, cfg.accentStr, 5, true, true);

        // ── SCORE section (center-left of HUD) ──
        const scoreSectX = Math.round(W * 0.38);
        this.add.text(scoreSectX, 8, 'SCORE', {
          fontFamily: 'Orbitron, monospace', fontSize: '9px', color: '#aaaacc'
        }).setOrigin(0.5);
        this.scoreText = this.add.text(scoreSectX, 26, '0', {
          fontFamily: 'Orbitron, monospace', fontSize: '20px',
          color: '#00ffff', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.scoreText.setShadow(0, 0, '#00ffff', 6, true, true);

        // ── Stars preview (center) ──
        const starSectX = Math.round(W * 0.55);
        this.targetText = this.add.text(starSectX, 20, '☆ ☆ ☆', {
          fontFamily: 'monospace', fontSize: '14px', color: '#404060'
        }).setOrigin(0.5);

        // ── Progress bar under score ──
        const barW = Math.round(W * 0.28), barH = 6;
        const barX = Math.round(scoreSectX - barW / 2);
        const barY = 50;
        this.add.graphics().fillStyle(0x0a0a30, 1).fillRoundedRect(barX, barY, barW, barH, 3);
        this.progressFill = this.add.graphics();
        // Store bar metrics on instance for updateProgressBar
        (this as any)._barX = barX; (this as any)._barY = barY; (this as any)._barW = barW; (this as any)._barH = barH;
        this.updateProgressBar();

        // ── MOVES section (right of HUD) ──
        const movesSectX = Math.round(W - 45);
        this.add.text(movesSectX, 8, 'MOVES', {
          fontFamily: 'Orbitron, monospace', fontSize: '9px', color: '#aaaacc'
        }).setOrigin(0.5);
        this.movesText = this.add.text(movesSectX, 30, `${cfg.moves}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '28px',
          color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.movesText.setShadow(0, 0, '#ffea00', 6, true, true);

        // ── Dividers in HUD ──
        const divG = this.add.graphics();
        divG.lineStyle(1, 0x2a2a50, 0.6);
        [Math.round(W * 0.26), Math.round(W * 0.65)].forEach(dx => {
          divG.lineBetween(dx, 6, dx, HUD_H - 6);
        });

        // ── Particle emitter ──
        this.particleEmitter = this.add.particles(0, 0, 'sparkle', {
          speed: { min: 60, max: 180 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.2, end: 0 },
          lifespan: 450,
          blendMode: 'ADD',
          emitting: false
        });

        // ── Bottom hint ──
        this.add.text(W / 2, H - 10, 'Tap two adjacent candies to swap', {
          fontFamily: 'monospace', fontSize: '9px', color: '#55556a'
        }).setOrigin(0.5);
      }

      updateProgressBar() {
        const cfg = this.levelConfig;
        const barX = (this as any)._barX ?? 0;
        const barY = (this as any)._barY ?? 50;
        const barW = (this as any)._barW ?? 100;
        const barH = (this as any)._barH ?? 6;
        const frac = Math.min(1, this.score / cfg.targetScore);
        if (this.progressFill?.active) {
          this.progressFill.clear();
          if (frac > 0) {
            this.progressFill.fillStyle(cfg.accentColor, 0.95);
            this.progressFill.fillRoundedRect(barX, barY, barW * frac, barH, 3);
          }
        }

        // Stars preview
        const stars = this.getStarCount();
        const starStr = ['☆ ☆ ☆','★ ☆ ☆','★ ★ ☆','★ ★ ★'][stars];
        const starColor = stars === 0 ? '#404060' : stars === 3 ? '#ffd700' : '#ffaa00';
        if (this.targetText?.active) this.targetText.setText(starStr).setStyle({ color: starColor });
      }

      getStarCount(): number {
        const t = this.levelConfig.targetScore;
        if (this.score >= t * 2)   return 3;
        if (this.score >= t * 1.5) return 2;
        if (this.score >= t)       return 1;
        return 0;
      }

      showLevelBanner() {
        const W = this.scale.width, H = this.scale.height;
        const cfg = this.levelConfig;
        const overlay = this.add.graphics().fillStyle(0x000000, 0.55).fillRect(0,0,W,H);

        const panel = this.add.graphics();
        panel.lineStyle(2, cfg.accentColor, 0.9);
        panel.fillStyle(0x08080f, 0.97);
        panel.strokeRoundedRect(W/2-170, H/2-65, 340, 130, 12);
        panel.fillRoundedRect(W/2-170, H/2-65, 340, 130, 12);

        const t1 = this.add.text(W/2, H/2 - 28, `LEVEL ${cfg.level}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '30px',
          color: cfg.accentStr, fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0,0,cfg.accentStr,8,true,true);

        const t2 = this.add.text(W/2, H/2 + 8, cfg.name, {
          fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#aaaacc'
        }).setOrigin(0.5);

        const t3 = this.add.text(W/2, H/2 + 35, `Target: ${cfg.targetScore.toLocaleString()} pts  ·  ${cfg.moves} moves`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#606080'
        }).setOrigin(0.5);

        playSweep(400, 800, 0.3, 'sine', 0.08);
        playSweep(600, 1000, 0.3, 'sine', 0.06);

        this.time.delayedCall(1800, () => {
          [overlay, panel, t1, t2, t3].forEach(o => this.tweens.add({
            targets: o, alpha: 0, duration: 300, onComplete: () => o.destroy()
          }));
        });
      }

      // ────────────────────────────────────────────────────
      // Board Initialization
      // ────────────────────────────────────────────────────
      initBoard() {
        const iceSet = new Set<string>();
        this.levelConfig.iceBlocks.forEach(({r,c}) => iceSet.add(`${r},${c}`));

        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            let type: number;
            do {
              type = Math.floor(Math.random() * this.activeCandyTypes);
            } while (this.causesInitMatch(r, c, type));

            const hasIce = iceSet.has(`${r},${c}`);
            this.createCandyAt(r, c, type, null, null, hasIce ? 2 : 0);
          }
        }
      }

      causesInitMatch(row: number, col: number, type: number): boolean {
        if (col >= 2) {
          const c1 = this.board[row][col-1], c2 = this.board[row][col-2];
          if (c1 && c2 && c1.type === type && c2.type === type) return true;
        }
        if (row >= 2) {
          const r1 = this.board[row-1][col], r2 = this.board[row-2][col];
          if (r1 && r2 && r1.type === type && r2.type === type) return true;
        }
        return false;
      }

      createCandyAt(row: number, col: number, type: number, special: Candy['special'] = null, startY: number | null = null, iceHp = 0): Candy {
        const BX = getBoardX(this.scale.width);
        const BY = getBoardY();
        const x = BX + col * TILE_SIZE + TILE_SIZE / 2;
        const initialY = startY !== null ? startY : BY + row * TILE_SIZE + TILE_SIZE / 2;
        const targetY = BY + row * TILE_SIZE + TILE_SIZE / 2;

        let texKey = `candy-${type}`;
        if (special === 'striped-h') texKey += '-sh';
        else if (special === 'striped-v') texKey += '-sv';
        else if (special === 'wrapped')   texKey += '-w';
        else if (special === 'color-bomb') texKey = 'candy-color-bomb';

        const sprite = this.add.sprite(x, initialY, texKey);
        sprite.setInteractive().setScale(0.95);
        sprite.gridRow = row; sprite.gridCol = col;

        let iceSprite: any = undefined;
        if (iceHp > 0) {
          iceSprite = this.add.sprite(x, initialY, iceHp >= 2 ? 'ice-block' : 'ice-crack');
          iceSprite.setScale(1.1).setDepth(5);
          if (startY !== null) {
            this.tweens.add({ targets: iceSprite, y: targetY, duration: 350, ease: 'Bounce.easeOut' });
          }
        }

        const candy: Candy = { sprite, type: special === 'color-bomb' ? 6 : type, special, iceHp, iceSprite };
        this.board[row][col] = candy;

        if (startY !== null) {
          this.tweens.add({ targets: sprite, y: targetY, duration: 350, ease: 'Bounce.easeOut' });
        }

        return candy;
      }

      // ────────────────────────────────────────────────────
      // Input
      // ────────────────────────────────────────────────────
      onPointerDown(pointer: any, gameObject: any) {
        if (this.isOver || this.isLocked || !gameObject) return;
        getAudioContext();

        const sprite = gameObject;
        const r = sprite.gridRow, c = sprite.gridCol;
        if (r === undefined || c === undefined) return;

        if (this.selectedTile === null) {
          this.selectedTile = { row: r, col: c };
          this.highlightSelected(true);
          playSynth(500, 'sine', 0.05, 0.04);
        } else {
          const { row: pr, col: pc } = this.selectedTile;
          this.highlightSelected(false);
          const dist = Math.abs(r - pr) + Math.abs(c - pc);
          if (dist === 1) {
            this.swapTiles(pr, pc, r, c);
          } else {
            this.selectedTile = { row: r, col: c };
            this.highlightSelected(true);
            playSynth(500, 'sine', 0.05, 0.04);
          }
        }
      }

      highlightSelected(active: boolean) {
        if (!this.selectedTile) return;
        const candy = this.board[this.selectedTile.row][this.selectedTile.col];
        if (candy?.sprite) {
          candy.sprite.setScale(active ? 1.15 : 0.95);
          active ? candy.sprite.setTint(0xdddddd) : candy.sprite.clearTint();
        }
      }

      // ────────────────────────────────────────────────────
      // Swap & Match
      // ────────────────────────────────────────────────────
      swapTiles(r1: number, c1: number, r2: number, c2: number, checkMatch = true) {
        this.isLocked = true;
        this.selectedTile = null;
        const t1 = this.board[r1][c1], t2 = this.board[r2][c2];
        if (!t1 || !t2) { this.isLocked = false; return; }

        this.board[r1][c1] = t2; this.board[r2][c2] = t1;
        t1.sprite.gridRow = r2; t1.sprite.gridCol = c2;
        t2.sprite.gridRow = r1; t2.sprite.gridCol = c1;

        const BX = getBoardX(this.scale.width), BY = getBoardY();
        const x1 = BX + c1*TILE_SIZE + TILE_SIZE/2, y1 = BY + r1*TILE_SIZE + TILE_SIZE/2;
        const x2 = BX + c2*TILE_SIZE + TILE_SIZE/2, y2 = BY + r2*TILE_SIZE + TILE_SIZE/2;

        playSweep(300, 500, 0.15, 'sine', 0.04);

        this.tweens.add({ targets: t1.sprite, x: x2, y: y2, duration: 200, ease: 'Cubic.easeOut' });
        if (t1.iceSprite) this.tweens.add({ targets: t1.iceSprite, x: x2, y: y2, duration: 200, ease: 'Cubic.easeOut' });

        this.tweens.add({
          targets: t2.sprite, x: x1, y: y1, duration: 200, ease: 'Cubic.easeOut',
          onComplete: () => {
            if (t2.iceSprite) { t2.iceSprite.setPosition(x1, y1); }
            if (checkMatch) this.handlePostSwap(r1, c1, r2, c2);
            else this.isLocked = false;
          }
        });
      }

      handlePostSwap(r1: number, c1: number, r2: number, c2: number) {
        const t1 = this.board[r1][c1], t2 = this.board[r2][c2];
        if (t1 && t2 && (t1.special === 'color-bomb' || t2.special === 'color-bomb')) {
          this.movesLeft--;
          this.updateHUD();
          this.cascadeMultiplier = 1;
          this.activateColorBomb(r1, c1, r2, c2);
          return;
        }

        const matches = this.scanAllMatches();
        if (matches.length > 0) {
          this.movesLeft--;
          this.updateHUD();
          this.detectSpecialSpawn(matches, r1, c1, r2, c2);
          this.cascadeMultiplier = 1;
          this.clearAndCascade(matches);
        } else {
          // Swap back
          this.swapTiles(r1, c1, r2, c2, false);
          playSweep(400, 200, 0.18, 'sine', 0.05);
        }
      }

      // ────────────────────────────────────────────────────
      // Color bomb
      // ────────────────────────────────────────────────────
      activateColorBomb(r1: number, c1: number, r2: number, c2: number) {
        const t1 = this.board[r1][c1]!, t2 = this.board[r2][c2]!;
        const toClear: {row:number,col:number}[] = [];

        if (t1.special === 'color-bomb' && t2.special === 'color-bomb') {
          playSweep(300, 1200, 0.6, 'sawtooth', 0.15);
          for (let r=0;r<GRID_ROWS;r++) for(let c=0;c<GRID_COLS;c++) if(this.board[r][c]) toClear.push({row:r,col:c});
        } else {
          const bombCell = t1.special==='color-bomb' ? {r:r1,c:c1} : {r:r2,c:c2};
          const otherCell = t1.special==='color-bomb' ? {r:r2,c:c2} : {r:r1,c:c1};
          const targetType = this.board[otherCell.r][otherCell.c]!.type;
          playSweep(600, 200, 0.4, 'triangle', 0.1);
          toClear.push({row:bombCell.r,col:bombCell.c});
          for(let r=0;r<GRID_ROWS;r++) for(let c=0;c<GRID_COLS;c++) {
            const candy=this.board[r][c];
            if(candy && candy.type===targetType) {
              toClear.push({row:r,col:c});
              // lightning beam
              const _BX2 = getBoardX(this.scale.width), _BY2 = getBoardY();
              const bx = _BX2 + bombCell.c*TILE_SIZE+TILE_SIZE/2;
              const by = _BY2 + bombCell.r*TILE_SIZE+TILE_SIZE/2;
              const cx2 = _BX2 + c*TILE_SIZE+TILE_SIZE/2;
              const cy2 = _BY2 + r*TILE_SIZE+TILE_SIZE/2;
              const beam = this.add.graphics();
              beam.lineStyle(3, 0xffea00, 0.95);
              beam.beginPath(); beam.moveTo(bx,by);
              beam.lineTo((bx+cx2)/2+(Math.random()*20-10),(by+cy2)/2+(Math.random()*20-10));
              beam.lineTo(cx2,cy2); beam.strokePath();
              this.time.delayedCall(220,()=>beam.destroy());
            }
          }
        }
        this.clearAndCascade(toClear);
      }

      // ────────────────────────────────────────────────────
      // Match Scanning
      // ────────────────────────────────────────────────────
      scanAllMatches(): {row:number,col:number}[] {
        const set = new Set<string>();
        // Horizontal
        for(let r=0;r<GRID_ROWS;r++){
          let len=1;
          for(let c=0;c<GRID_COLS;c++){
            const end = c===GRID_COLS-1;
            if(!end){
              const cur=this.board[r][c], nxt=this.board[r][c+1];
              if(cur && nxt && cur.type===nxt.type && cur.type<6) { len++; continue; }
            }
            if(len>=3) for(let i=c-len+1;i<=c;i++) set.add(`${r},${i}`);
            len=1;
          }
        }
        // Vertical
        for(let c=0;c<GRID_COLS;c++){
          let len=1;
          for(let r=0;r<GRID_ROWS;r++){
            const end = r===GRID_ROWS-1;
            if(!end){
              const cur=this.board[r][c], nxt=this.board[r+1][c];
              if(cur && nxt && cur.type===nxt.type && cur.type<6) { len++; continue; }
            }
            if(len>=3) for(let i=r-len+1;i<=r;i++) set.add(`${i},${c}`);
            len=1;
          }
        }
        const coords = Array.from(set).map(s=>{ const [r,c]=s.split(',').map(Number); return{row:r,col:c}; });
        return this.expandSpecials(coords);
      }

      expandSpecials(matches: {row:number,col:number}[]): {row:number,col:number}[] {
        const set = new Set<string>(matches.map(m=>`${m.row},${m.col}`));
        let changed = true;
        while(changed){
          changed = false;
          Array.from(set).forEach(s=>{
            const [r,c]=s.split(',').map(Number);
            const candy=this.board[r][c];
            if(!candy?.special) return;
            if(candy.special==='striped-h'){
              for(let cc=0;cc<GRID_COLS;cc++){const k=`${r},${cc}`; if(!set.has(k)){set.add(k);changed=true;}}
            } else if(candy.special==='striped-v'){
              for(let rr=0;rr<GRID_ROWS;rr++){const k=`${rr},${c}`; if(!set.has(k)){set.add(k);changed=true;}}
            } else if(candy.special==='wrapped'){
              for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
                const nr=r+dr,nc=c+dc;
                if(nr>=0&&nr<GRID_ROWS&&nc>=0&&nc<GRID_COLS){
                  const k=`${nr},${nc}`; if(!set.has(k)){set.add(k);changed=true;}
                }
              }
            }
          });
        }
        return Array.from(set).map(s=>{ const [r,c]=s.split(',').map(Number); return{row:r,col:c}; });
      }

      detectSpecialSpawn(matches: {row:number,col:number}[], r1:number,c1:number,r2:number,c2:number) {
        [{r:r1,c:c1},{r:r2,c:c2}].forEach(sw=>{
          const candy = this.board[sw.r][sw.c];
          if(!candy) return;
          const t = candy.type;
          let hl=1, hr=1, vu=1, vd=1;
          let tc=sw.c-1; while(tc>=0&&this.board[sw.r][tc]?.type===t){hl++;tc--;}
          tc=sw.c+1;     while(tc<GRID_COLS&&this.board[sw.r][tc]?.type===t){hr++;tc++;}
          let tr=sw.r-1; while(tr>=0&&this.board[tr][sw.c]?.type===t){vu++;tr--;}
          tr=sw.r+1;     while(tr<GRID_ROWS&&this.board[tr][sw.c]?.type===t){vd++;tr++;}
          const h=hl+hr-1, v=vu+vd-1;
          if(h>=5||v>=5){ candy.special='color-bomb'; playSweep(800,1400,0.35,'sine',0.08); }
          else if(h>=3&&v>=3){ candy.special='wrapped'; playSweep(400,700,0.2,'triangle',0.07); }
          else if(h===4){ candy.special='striped-v'; playSweep(500,900,0.18,'sine',0.07); }
          else if(v===4){ candy.special='striped-h'; playSweep(500,900,0.18,'sine',0.07); }
        });
      }

      // ────────────────────────────────────────────────────
      // Clear & Cascade
      // ────────────────────────────────────────────────────
      clearAndCascade(matches: {row:number,col:number}[]) {
        this.isLocked = true;
        const processed = new Set<Candy>();

        matches.forEach(cell=>{
          const candy = this.board[cell.row][cell.col];
          if(!candy || processed.has(candy)) return;
          processed.add(candy);

          const _BX3 = getBoardX(this.scale.width), _BY3 = getBoardY();
          const cx = _BX3 + cell.col*TILE_SIZE + TILE_SIZE/2;
          const cy = _BY3 + cell.row*TILE_SIZE + TILE_SIZE/2;

          // Check adjacent ice
          [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr,dc])=>{
            const nr=cell.row+dr, nc=cell.col+dc;
            if(nr>=0&&nr<GRID_ROWS&&nc>=0&&nc<GRID_COLS){
              const adj=this.board[nr][nc];
              if(adj&&adj.iceHp>0) this.hitIce(adj, nr, nc);
            }
          });

          // Special SFX
          if(candy.special==='wrapped') playNoise(0.3,0.12);
          else if(candy.special?.startsWith('striped')) playSweep(700,100,0.2,'square',0.07);

          // Upgrade → keep sprite, update texture
          if(candy.special!==null){
            let tex=`candy-${candy.type}`;
            if(candy.special==='striped-h') tex+='-sh';
            else if(candy.special==='striped-v') tex+='-sv';
            else if(candy.special==='wrapped') tex+='-w';
            else if(candy.special==='color-bomb') tex='candy-color-bomb';
            candy.sprite.setTexture(tex);
            this.tweens.add({
              targets: candy.sprite, scale: 1.3, duration: 100, yoyo: true,
              onComplete: ()=>{ if(candy.sprite?.active) candy.sprite.setScale(0.95); }
            });
          } else {
            this.particleEmitter.explode(7, cx, cy);
            this.tweens.add({
              targets: candy.sprite, scale: 0, alpha: 0, duration: 220,
              onComplete: ()=>{
                candy.sprite.destroy();
                if (candy.iceSprite) candy.iceSprite.destroy();
              }
            });
            if (candy.iceSprite) {
              this.tweens.add({
                targets: candy.iceSprite, scale: 0, alpha: 0, duration: 220
              });
            }
            this.board[cell.row][cell.col] = null;
          }
        });

        // Score with multiplier
        const pts = matches.length * 10 * this.cascadeMultiplier;
        this.score += pts;
        if(matches.length >= 5 && this.cascadeMultiplier > 1) {
          const _BX4 = getBoardX(this.scale.width), _BY4 = getBoardY();
          this.showFloatingText(`×${this.cascadeMultiplier} COMBO!`, _BX4 + GRID_COLS*TILE_SIZE/2, _BY4 + GRID_ROWS*TILE_SIZE/2, '#ffd700');
        }
        this.updateHUD();

        playSynth(600 + this.cascadeMultiplier*50, 'triangle', 0.1, 0.06);
        this.cascadeMultiplier++;

        this.time.delayedCall(280, ()=>this.applyGravity());
      }

      hitIce(candy: Candy, row: number, col: number) {
        candy.iceHp--;
        if(candy.iceHp <= 0){
          candy.iceSprite?.destroy();
          candy.iceSprite = undefined;
          playSynth(800,'triangle',0.1,0.06);
        } else {
          candy.iceSprite?.setTexture('ice-crack');
          playSynth(600,'triangle',0.08,0.05);
        }
      }

      applyGravity() {
        const _BX5 = getBoardX(this.scale.width), _BY5 = getBoardY();
        for(let c=0;c<GRID_COLS;c++){
          let empty=0;
          for(let r=GRID_ROWS-1;r>=0;r--){
            if(!this.board[r][c]) { empty++; continue; }
            if(empty>0){
              const tgt=r+empty, candy=this.board[r][c]!;
              this.board[tgt][c]=candy; this.board[r][c]=null;
              candy.sprite.gridRow=tgt;
              const ty=_BY5+tgt*TILE_SIZE+TILE_SIZE/2;
              this.tweens.add({targets:candy.sprite,y:ty,duration:230,ease:'Bounce.easeOut'});
              if(candy.iceSprite) this.tweens.add({targets:candy.iceSprite,y:ty,duration:230,ease:'Bounce.easeOut'});
            }
          }
          // Fill from top
          for(let i=0;i<empty;i++){
            const tgtRow=empty-1-i, type=Math.floor(Math.random()*this.activeCandyTypes);
            const startY=_BY5-(i+1)*TILE_SIZE-10;
            this.createCandyAt(tgtRow,c,type,null,startY,0);
          }
        }

        this.time.delayedCall(420, ()=>{
          const next=this.scanAllMatches();
          if(next.length>0){ this.clearAndCascade(next); return; }
          this.cascadeMultiplier=1;
          this.isLocked=false;
          this.checkWinLose();
        });
      }

      checkWinLose() {
        const cfg=this.levelConfig;
        const stars=this.getStarCount();
        if(stars>0){
          // Won!
          this.showLevelComplete(stars);
        } else if(this.movesLeft<=0){
          this.showGameOver();
        }
      }

      updateHUD() {
        if (this.isOver && !this.scoreText?.active) return;
        const moves=this.movesLeft;
        if (this.scoreText?.active) this.scoreText.setText(this.score.toLocaleString());
        if (this.movesText?.active) {
          this.movesText.setText(`${moves}`);
          const dangerColor = moves<=5 ? '#ff0055' : '#ffea00';
          this.movesText.setStyle({ color: dangerColor });
        }
        this.updateProgressBar();
      }

      showFloatingText(text: string, x: number, y: number, color: string) {
        const t = this.add.text(x, y, text, {
          fontFamily: 'Orbitron, monospace', fontSize: '22px', color, fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, y: y-60, alpha: 0, scale: 1.3, duration: 800, onComplete: ()=>t.destroy() });
      }

      // ────────────────────────────────────────────────────
      // Level Complete
      // ────────────────────────────────────────────────────
      showLevelComplete(stars: number) {
        this.isOver = true;
        const cfg=this.levelConfig;
        const W=this.scale.width, H=this.scale.height;

        saveProgress(this.levelIndex, stars);

        // Victory sound
        playChord([523,659,784,1047],0.4);
        setTimeout(()=>playChord([659,784,1047,1319],0.5),300);

        // Camera flash
        this.cameras.main.flash(500, 255, 220, 100);

        // Celebration particles burst
        for(let i=0;i<8;i++){
          this.time.delayedCall(i*80, ()=>{
            const _BXp = getBoardX(this.scale.width), _BYp = getBoardY();
            const bx=_BXp+Math.random()*GRID_COLS*TILE_SIZE, by=_BYp+Math.random()*GRID_ROWS*TILE_SIZE;
            this.particleEmitter.explode(15, bx, by);
          });
        }

        this.time.delayedCall(600, ()=>{
          const overlay=this.add.graphics().fillStyle(0x000000,0.6).fillRect(0,0,W,H);
          const panel=this.add.graphics();
          panel.lineStyle(3,cfg.accentColor,0.95);
          panel.fillStyle(0x080820,0.98);
          panel.strokeRoundedRect(W/2-180,H/2-135,360,270,14);
          panel.fillRoundedRect(W/2-180,H/2-135,360,270,14);

          this.add.text(W/2,H/2-105,'LEVEL COMPLETE!',{
            fontFamily:'Orbitron,monospace',fontSize:'22px',
            color:cfg.accentStr,fontWeight:'bold'
          }).setOrigin(0.5).setShadow(0,0,cfg.accentStr,8,true,true);

          // Animated stars
          const starEmojis=['☆','★'];
          const starXs=[W/2-70,W/2,W/2+70];
          starXs.forEach((sx,i)=>{
            const delay=200+i*300;
            const star=this.add.text(sx,H/2-60,starEmojis[0],{
              fontFamily:'monospace',fontSize:'38px',
              color: i<stars ? '#ffd700':'#333355'
            }).setOrigin(0.5).setScale(0);

            this.time.delayedCall(delay,()=>{
              star.setText(i<stars?'★':'☆').setStyle({color:i<stars?'#ffd700':'#333355'});
              this.tweens.add({targets:star,scale:1.4,duration:220,yoyo:true,onComplete:()=>star.setScale(1)});
              if(i<stars) playSynth(523+i*200,'sine',0.2,0.08);
            });

            this.time.delayedCall(delay-200,()=>{
              this.tweens.add({targets:star,scale:1,duration:200});
            });
          });

          this.add.text(W/2,H/2+8,`Score: ${this.score.toLocaleString()}`,{
            fontFamily:'monospace',fontSize:'18px',color:'#e0e0ff'
          }).setOrigin(0.5);
          this.add.text(W/2,H/2+35,`Target: ${cfg.targetScore.toLocaleString()}`,{
            fontFamily:'monospace',fontSize:'13px',color:'#606080'
          }).setOrigin(0.5);

          // Dispatch score to leaderboard
          window.dispatchEvent(new CustomEvent('phaser-game-over',{
            detail:{ gameKey:'candy-match', score:this.score }
          }));

          // Buttons
          const hasNext=this.levelIndex<19;
          const prog2=getProgress();

          if(hasNext){
            const nextBtn=this.add.text(W/2,H/2+80,'▶ NEXT LEVEL',{
              fontFamily:'Orbitron,monospace',fontSize:'16px',color:cfg.accentStr,fontWeight:'bold'
            }).setOrigin(0.5).setInteractive().setPadding(12,8);
            nextBtn.on('pointerover',()=>nextBtn.setStyle({color:'#ffffff'}));
            nextBtn.on('pointerout',()=>nextBtn.setStyle({color:cfg.accentStr}));
            nextBtn.on('pointerdown',()=>{
              playSweep(400,800,0.2,'sine',0.07);
              this.scene.start('CandyMatch',{levelIndex:this.levelIndex+1});
            });
          }

          const retryBtn=this.add.text(hasNext?W/2-80:W/2-40,H/2+113,'↺ RETRY',{
            fontFamily:'monospace',fontSize:'13px',color:'#9090b0'
          }).setOrigin(0.5).setInteractive();
          retryBtn.on('pointerdown',()=>{ playSweep(600,300,0.15,'sine',0.05); this.scene.start('CandyMatch',{levelIndex:this.levelIndex}); });

          const lvlBtn=this.add.text(hasNext?W/2+60:W/2+50,H/2+113,'☰ LEVELS',{
            fontFamily:'monospace',fontSize:'13px',color:'#9090b0'
          }).setOrigin(0.5).setInteractive();
          lvlBtn.on('pointerdown',()=>{ playSweep(600,300,0.15,'sine',0.05); this.scene.start('CandyLevelSelect'); });
        });
      }

      // ────────────────────────────────────────────────────
      // Game Over
      // ────────────────────────────────────────────────────
      showGameOver() {
        this.isOver = true;
        const cfg=this.levelConfig;
        const W=this.scale.width, H=this.scale.height;

        playSweep(220,60,0.8,'sawtooth',0.15);
        setTimeout(()=>playSweep(180,50,0.6,'sawtooth',0.12),300);

        this.time.delayedCall(400,()=>{
          const overlay=this.add.graphics().fillStyle(0x000000,0.65).fillRect(0,0,W,H);
          const panel=this.add.graphics();
          panel.lineStyle(2.5,0xff0055,0.9).fillStyle(0x0e0010,0.98);
          panel.strokeRoundedRect(W/2-165,H/2-120,330,240,12);
          panel.fillRoundedRect(W/2-165,H/2-120,330,240,12);

          this.add.text(W/2,H/2-95,'LEVEL FAILED',{
            fontFamily:'Orbitron,monospace',fontSize:'22px',color:'#ff0055',fontWeight:'bold'
          }).setOrigin(0.5).setShadow(0,0,'#ff0055',8,true,true);

          this.add.text(W/2,H/2-58,'😢',{fontSize:'36px'}).setOrigin(0.5);

          this.add.text(W/2,H/2-10,`Your Score: ${this.score.toLocaleString()}`,{
            fontFamily:'monospace',fontSize:'17px',color:'#e0e0ff'
          }).setOrigin(0.5);

          const need=cfg.targetScore-this.score;
          this.add.text(W/2,H/2+18,`${need.toLocaleString()} more points needed`,{
            fontFamily:'monospace',fontSize:'12px',color:'#804050'
          }).setOrigin(0.5);

          this.add.text(W/2,H/2+45,`Target: ${cfg.targetScore.toLocaleString()}`,{
            fontFamily:'monospace',fontSize:'12px',color:'#606080'
          }).setOrigin(0.5);

          const retryBtn=this.add.text(W/2,H/2+85,'↺ TRY AGAIN',{
            fontFamily:'Orbitron,monospace',fontSize:'17px',color:'#ff4488',fontWeight:'bold'
          }).setOrigin(0.5).setInteractive();
          retryBtn.on('pointerover',()=>retryBtn.setStyle({color:'#ffffff'}));
          retryBtn.on('pointerout',()=>retryBtn.setStyle({color:'#ff4488'}));
          retryBtn.on('pointerdown',()=>{
            playSweep(400,700,0.15,'sine',0.07);
            this.scene.start('CandyMatch',{levelIndex:this.levelIndex});
          });

          const lvlBtn=this.add.text(W/2,H/2+113,'☰ LEVEL SELECT',{
            fontFamily:'monospace',fontSize:'12px',color:'#9090b0'
          }).setOrigin(0.5).setInteractive();
          lvlBtn.on('pointerdown',()=>{ this.scene.start('CandyLevelSelect'); });
        });
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT — wraps BOTH scenes, starts with LevelSelect
// ═══════════════════════════════════════════════════════════════════════════
export default class CandyMatchGameFactory {
  static create(PhaserLib: any) {
    const LevelSelectScene = CandyLevelSelectFactory.create(PhaserLib);
    const GameScene        = CandyMatchSceneFactory.create(PhaserLib);

    // Return a "Boot" scene that immediately launches both scenes and starts the select
    return class CandyBootScene extends PhaserLib.Scene {
      constructor() { super({ key: 'CandyBoot' }); }
      create() {
        this.scene.add('CandyLevelSelect', LevelSelectScene, false);
        this.scene.add('CandyMatch',       GameScene,        false);
        this.scene.start('CandyLevelSelect');
      }
    };
  }
}
