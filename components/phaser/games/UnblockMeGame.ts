/**
 * Unblock Me Clone — Phaser.js Factory
 * Register key: 'unblock-me'
 *
 * Goal  : Slide the RED block right to the exit arrow.
 * Rules : Horizontal blocks slide left/right; vertical blocks slide up/down.
 * Input : Click/tap a block to select it, then drag it.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID = 6;
const EXIT_ROW = 2;

// ─── Level definitions ────────────────────────────────────────────────────────
// Each block: { r, c, len, dir:'H'|'V', isTarget? }
// Target block is always H at r=2 and exits through the right wall.
const LEVELS = [
  {
    label: 'Level 1',
    difficulty: 'Easy',
    par: 3,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 3, len: 3, dir: 'V' },
      { r: 3, c: 3, len: 2, dir: 'H' }
    ]
  },
  {
    label: 'Level 2',
    difficulty: 'Easy',
    par: 5,
    blocks: [
      { r: 2, c: 0, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 2, len: 3, dir: 'V' },
      { r: 3, c: 2, len: 2, dir: 'H' },
      { r: 2, c: 4, len: 3, dir: 'V' }
    ]
  },
  {
    label: 'Level 3',
    difficulty: 'Easy',
    par: 6,
    blocks: [
      { r: 2, c: 0, len: 2, dir: 'H', isTarget: true },
      { r: 1, c: 2, len: 2, dir: 'V' },
      { r: 2, c: 4, len: 2, dir: 'V' },
      { r: 2, c: 5, len: 2, dir: 'V' }
    ]
  },
  {
    label: 'Level 4',
    difficulty: 'Medium',
    par: 8,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 2, dir: 'V' },
      { r: 1, c: 3, len: 3, dir: 'V' },
      { r: 4, c: 1, len: 3, dir: 'H' },
      { r: 2, c: 4, len: 2, dir: 'V' }
    ]
  },
  {
    label: 'Level 5',
    difficulty: 'Medium',
    par: 10,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 3, len: 3, dir: 'V' },
      { r: 0, c: 4, len: 2, dir: 'V' },
      { r: 3, c: 1, len: 2, dir: 'H' },
      { r: 4, c: 3, len: 3, dir: 'H' },
      { r: 1, c: 0, len: 3, dir: 'V' }
    ]
  },
  {
    label: 'Level 6',
    difficulty: 'Medium',
    par: 12,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 3, dir: 'V' },
      { r: 0, c: 3, len: 2, dir: 'V' },
      { r: 0, c: 4, len: 2, dir: 'H' },
      { r: 1, c: 5, len: 3, dir: 'V' },
      { r: 3, c: 1, len: 2, dir: 'H' },
      { r: 4, c: 3, len: 2, dir: 'V' }
    ]
  },
  {
    label: 'Level 7',
    difficulty: 'Hard',
    par: 16,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 3, dir: 'V' },
      { r: 0, c: 3, len: 2, dir: 'V' },
      { r: 0, c: 4, len: 2, dir: 'H' },
      { r: 1, c: 5, len: 3, dir: 'V' },
      { r: 3, c: 1, len: 2, dir: 'H' },
      { r: 4, c: 3, len: 2, dir: 'V' },
      { r: 5, c: 0, len: 3, dir: 'H' }
    ]
  },
  {
    label: 'Level 8',
    difficulty: 'Hard',
    par: 21,
    blocks: [
      { r: 2, c: 2, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 2, dir: 'V' },
      { r: 0, c: 1, len: 3, dir: 'H' },
      { r: 0, c: 4, len: 3, dir: 'V' },
      { r: 1, c: 1, len: 2, dir: 'V' },
      { r: 3, c: 0, len: 2, dir: 'H' },
      { r: 3, c: 2, len: 3, dir: 'V' },
      { r: 4, c: 3, len: 2, dir: 'H' },
      { r: 5, c: 3, len: 3, dir: 'H' }
    ]
  },
  {
    label: 'Level 9',
    difficulty: 'Hard',
    par: 25,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 3, dir: 'V' },
      { r: 0, c: 1, len: 2, dir: 'H' },
      { r: 0, c: 3, len: 3, dir: 'V' },
      { r: 0, c: 4, len: 2, dir: 'H' },
      { r: 1, c: 5, len: 3, dir: 'V' },
      { r: 3, c: 0, len: 3, dir: 'H' },
      { r: 4, c: 0, len: 2, dir: 'V' },
      { r: 4, c: 1, len: 2, dir: 'H' },
      { r: 4, c: 4, len: 2, dir: 'V' },
      { r: 5, c: 1, len: 3, dir: 'H' }
    ]
  },
  {
    label: 'Level 10',
    difficulty: 'Expert',
    par: 30,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 3, dir: 'V' },
      { r: 0, c: 1, len: 2, dir: 'H' },
      { r: 0, c: 3, len: 3, dir: 'V' },
      { r: 0, c: 4, len: 2, dir: 'H' },
      { r: 1, c: 5, len: 3, dir: 'V' },
      { r: 3, c: 1, len: 2, dir: 'H' },
      { r: 3, c: 4, len: 2, dir: 'V' },
      { r: 4, c: 1, len: 3, dir: 'H' },
      { r: 4, c: 0, len: 2, dir: 'V' },
      { r: 5, c: 1, len: 3, dir: 'H' }
    ]
  },
  {
    label: 'Level 11',
    difficulty: 'Expert',
    par: 36,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 3, dir: 'V' },
      { r: 0, c: 1, len: 3, dir: 'H' },
      { r: 0, c: 4, len: 2, dir: 'V' },
      { r: 0, c: 5, len: 2, dir: 'V' },
      { r: 1, c: 1, len: 2, dir: 'V' },
      { r: 3, c: 0, len: 2, dir: 'H' },
      { r: 3, c: 2, len: 3, dir: 'V' },
      { r: 3, c: 3, len: 3, dir: 'V' },
      { r: 4, c: 4, len: 2, dir: 'H' },
      { r: 5, c: 0, len: 2, dir: 'H' }
    ]
  },
  {
    label: 'Level 12',
    difficulty: 'Expert',
    par: 42,
    blocks: [
      { r: 2, c: 1, len: 2, dir: 'H', isTarget: true },
      { r: 0, c: 0, len: 3, dir: 'V' },
      { r: 0, c: 1, len: 2, dir: 'H' },
      { r: 0, c: 3, len: 3, dir: 'V' },
      { r: 0, c: 4, len: 2, dir: 'H' },
      { r: 1, c: 5, len: 3, dir: 'V' },
      { r: 3, c: 0, len: 2, dir: 'H' },
      { r: 3, c: 2, len: 2, dir: 'V' },
      { r: 3, c: 3, len: 2, dir: 'V' },
      { r: 4, c: 4, len: 2, dir: 'H' },
      { r: 5, c: 0, len: 3, dir: 'H' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
export default class UnblockMeFactory {
  static create(PhaserLib: any) {

    // ────────────────────────────────────────────────────────────────────────
    //  SCENE 1: Level Select Menu Scene
    // ────────────────────────────────────────────────────────────────────────
    class UnblockMeMenu extends PhaserLib.Scene {
      audioCtx: AudioContext | null = null;

      constructor() { super({ key: 'UnblockMeMenu' }); }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Dark cyber space background
        this.add.rectangle(W / 2, H / 2, W, H, 0x05040d);

        // Dot grid background texture
        const makeTexture = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const t = this.textures.createCanvas(key, w, h);
          draw(t.context);
          t.refresh();
        };

        makeTexture('menu-dots-bg', 20, 20, (ctx) => {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.04)';
          ctx.beginPath();
          ctx.arc(10, 10, 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
        this.add.tileSprite(W / 2, H / 2, W, H, 'menu-dots-bg');

        // Header Title
        const title = this.add.text(W / 2, 48, '🔓 UNBLOCK NEO', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '30px', color: '#ff00aa', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: title,
          alpha: 0.8,
          scaleX: 1.03,
          scaleY: 1.03,
          yoyo: true,
          duration: 1000,
          loop: -1,
          ease: 'Sine.easeInOut'
        });

        this.add.text(W / 2, 90, 'SLIDE THE MAGENTA BLOCK TO THE PULSING EXIT', {
          fontFamily: 'monospace', fontSize: '10px', color: '#687e9c', letterSpacing: 1
        }).setOrigin(0.5);

        // Grid parameters (3 rows of 4 items)
        const tW = 120;
        const tH = 80;
        const gapX = 24;
        const gapY = 24;
        const startX = W / 2 - (4 * tW + 3 * gapX) / 2 + tW / 2;
        const startY = 165;

        LEVELS.forEach((level, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const lx = startX + col * (tW + gapX);
          const ly = startY + row * (tH + gapY + 16);

          // Star count from local storage
          const stars = parseInt(localStorage.getItem(`unblock-me-level-stars-${i}`) || '0');

          // Draw Card
          const cardGfx = this.add.graphics();
          const drawCard = (isHover: boolean) => {
            cardGfx.clear();
            if (isHover) {
              cardGfx.fillStyle(0x0a1a2b, 0.95);
              cardGfx.lineStyle(2, 0x00d4ff, 1);
            } else {
              cardGfx.fillStyle(0x070615, 0.85);
              cardGfx.lineStyle(1.5, 0x1f1d3e, 0.6);
            }
            cardGfx.fillRoundedRect(lx - tW / 2, ly - tH / 2, tW, tH, 10);
            cardGfx.strokeRoundedRect(lx - tW / 2, ly - tH / 2, tW, tH, 10);
          };
          drawCard(false);

          // Level Number text
          const numText = this.add.text(lx, ly - 8, `${i + 1}`, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
          }).setOrigin(0.5);

          // Difficulty Label
          let diffColor = '#2ecc71';
          if (level.difficulty === 'Medium') diffColor = '#e67e22';
          else if (level.difficulty === 'Hard') diffColor = '#e74c3c';
          else if (level.difficulty === 'Expert') diffColor = '#ff00aa';

          this.add.text(lx, ly - tH / 2 + 12, level.difficulty.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '8px', color: diffColor, fontStyle: 'bold'
          }).setOrigin(0.5);

          // Star Text character block
          const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
          const starText = this.add.text(lx, ly + 20, starStr, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: stars > 0 ? '#ffd700' : '#3e3b5e'
          }).setOrigin(0.5);

          // Click Zone
          const zone = this.add.zone(lx, ly, tW, tH).setInteractive({ cursor: 'pointer' });
          zone.on('pointerover', () => {
            drawCard(true);
            numText.setColor('#00d4ff');
            this.playTone(340, 'sine', 0.05, 0.05);
          });
          zone.on('pointerout', () => {
            drawCard(false);
            numText.setColor('#ffffff');
          });
          zone.on('pointerdown', () => {
            this.playTone(450, 'sine', 0.08, 0.06);
            this.scene.start('UnblockMe', { level: i });
          });
        });
      }

      playTone(freq: number, type: string = 'sine', duration: number = 0.1, vol: number = 0.08) {
        try {
          if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = type as any;
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
          gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {}
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    //  SCENE 2: Main Gameplay Scene
    // ────────────────────────────────────────────────────────────────────────
    class UnblockMeScene extends PhaserLib.Scene {
      // ── State ──────────────────────────────────────────────────────────────
      blocks!:     any[];
      level!:      number;
      moves!:      number;
      won!:        boolean;
      CELL!:       number;
      gridX!:      number;
      gridY!:      number;

      // ── Graphics ───────────────────────────────────────────────────────────
      boardGfx!:   any;
      blockCtrs!:  any[];   // one Phaser Container per block
      movesText!:  any;
      parText!:    any;
      exitArrow!:  any;

      // ── Drag state ─────────────────────────────────────────────────────────
      dragging!:      boolean;
      dragIdx!:       number;
      dragStartPx!:   number; // pointer x or y at drag start
      dragStartCell!: number; // block.c or block.r at drag start
      maxDragPos!:    number;
      maxDragNeg!:    number;
      dragOffsetPx!:  number;

      // Audio
      audioCtx: AudioContext | null = null;

      constructor() { super({ key: 'UnblockMe' }); }

      init(data: any) {
        this.level = (data?.level ?? 0) % LEVELS.length;
        this.moves = 0;
        this.won   = false;
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.dragging  = false;
        this.dragIdx   = -1;
        this.blockCtrs = [];

        // Deep-clone level blocks
        this.blocks = LEVELS[this.level].blocks.map((b: any) => ({ ...b }));

        // Cell size configuration
        const TOP = 80, BOT = 60;
        const avail = Math.min(W - 16, H - TOP - BOT);
        this.CELL = Math.floor(avail / GRID);
        const gridPx = this.CELL * GRID;
        this.gridX = Math.floor((W - gridPx) / 2);
        this.gridY = TOP;

        // Web Audio Context
        try { this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}

        // ── Background (Space Neo) ───────────────────────────────────────────
        this.add.rectangle(W / 2, H / 2, W, H, 0x05040d);

        // Dot grid background texture
        const makeTexture = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const t = this.textures.createCanvas(key, w, h);
          draw(t.context);
          t.refresh();
        };

        makeTexture('game-dots-bg', 20, 20, (ctx) => {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.04)';
          ctx.beginPath();
          ctx.arc(10, 10, 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
        this.add.tileSprite(W / 2, H / 2, W, H, 'game-dots-bg');

        // ── Board ───────────────────────────────────────────────────────────
        this.boardGfx = this.add.graphics();
        this.redrawBoard();

        // Pulsing exit arrow at Row 2 right wall
        this.exitArrow = this.add.graphics();
        this.exitArrow.fillStyle(0xff00aa, 1);
        const ax = this.gridX + gridPx + 8;
        const ay = this.gridY + EXIT_ROW * this.CELL + this.CELL / 2;
        this.exitArrow.fillTriangle(ax, ay - 10, ax, ay + 10, ax + 12, ay);
        this.tweens.add({
          targets: this.exitArrow,
          alpha: 0.3,
          duration: 850,
          yoyo: true,
          loop: -1,
          ease: 'Sine.easeInOut'
        });

        // ── Block containers ────────────────────────────────────────────────
        this.blocks.forEach((block: any, i: number) => {
          const ctr = this.add.container(
            this.gridX + block.c * this.CELL,
            this.gridY + block.r * this.CELL,
          );
          const gfx = this.add.graphics();
          this.drawBlockGfx(gfx, block, 0);
          ctr.add(gfx);
          this.blockCtrs.push(ctr);
        });

        // ── HUD (High Contrast Orbitron styling) ─────────────────────────────
        const levelData = LEVELS[this.level];
        this.add.text(16, 15, `${levelData.label.toUpperCase()}`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ff00aa',
        });
        this.add.text(16, 32, `${levelData.difficulty.toUpperCase()}  •  PAR: ${levelData.par}`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#687e9c',
        });

        this.movesText = this.add.text(W - 16, 20, 'MOVES: 0', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#00d4ff',
        }).setOrigin(1, 0.5);

        // ── Controls Toolbar (Centered Glowing Buttons) ──────────────────────
        const btnW = 110;
        const btnH = 34;
        const bY = H - 30;

        const drawBtn = (gfx: any, x: number, y: number, color: number, isHover: boolean, isActive: boolean) => {
          gfx.clear();
          if (isActive) {
            gfx.fillStyle(color, 0.35);
            gfx.lineStyle(2.5, color, 1);
          } else if (isHover) {
            gfx.fillStyle(color, 0.2);
            gfx.lineStyle(2.5, color, 1);
          } else {
            gfx.fillStyle(0x070612, 0.9);
            gfx.lineStyle(1.8, color, 0.45);
          }
          gfx.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
          gfx.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
        };

        // 1. MENU Button
        const menuX = W / 2 - 70;
        const btnMenu = this.add.graphics();
        drawBtn(btnMenu, menuX, bY, 0x00d4ff, false, false);
        const txtMenu = this.add.text(menuX, bY, '⌂ MENU', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '10.5px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        txtMenu.on('pointerover', () => {
          drawBtn(btnMenu, menuX, bY, 0x00d4ff, true, false);
        });
        txtMenu.on('pointerout', () => {
          drawBtn(btnMenu, menuX, bY, 0x00d4ff, false, false);
        });
        txtMenu.on('pointerdown', () => {
          drawBtn(btnMenu, menuX, bY, 0x00d4ff, true, true);
          this.playTone(400, 'sine', 0.08, 0.05);
          this.scene.start('UnblockMeMenu');
        });
        txtMenu.on('pointerup', () => {
          drawBtn(btnMenu, menuX, bY, 0x00d4ff, true, false);
        });

        // 2. RESTART Button
        const restartX = W / 2 + 70;
        const btnRestart = this.add.graphics();
        drawBtn(btnRestart, restartX, bY, 0xff00aa, false, false);
        const txtRestart = this.add.text(restartX, bY, '🔄 RESTART', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '10.5px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        txtRestart.on('pointerover', () => {
          drawBtn(btnRestart, restartX, bY, 0xff00aa, true, false);
        });
        txtRestart.on('pointerout', () => {
          drawBtn(btnRestart, restartX, bY, 0xff00aa, false, false);
        });
        txtRestart.on('pointerdown', () => {
          drawBtn(btnRestart, restartX, bY, 0xff00aa, true, true);
          this.playTone(400, 'sine', 0.08, 0.05);
          this.scene.restart({ level: this.level });
        });
        txtRestart.on('pointerup', () => {
          drawBtn(btnRestart, restartX, bY, 0xff00aa, true, false);
        });

        // ── Input ────────────────────────────────────────────────────────────
        this.input.on('pointerdown', this.onDown, this);
        this.input.on('pointermove', this.onMove, this);
        this.input.on('pointerup',   this.onUp,   this);
      }

      redrawBoard() {
        const g  = this.boardGfx;
        const ox = this.gridX, oy = this.gridY;
        const C  = this.CELL;
        const px = C * GRID;
        g.clear();

        // Translucent glass base shadow
        g.fillStyle(0x000000, 0.35);
        g.fillRoundedRect(ox - 6, oy - 6, px + 12, px + 12, 10);

        // Glass board container
        g.fillStyle(0x0a0918, 0.85);
        g.fillRoundedRect(ox - 4, oy - 4, px + 8, px + 8, 10);
        g.lineStyle(2, 0x1f1d3e, 0.7);
        g.strokeRoundedRect(ox - 4, oy - 4, px + 8, px + 8, 10);

        // Inner board grid cell lines
        g.lineStyle(1, 0x1a1930, 0.45);
        for (let i = 1; i < GRID; i++) {
          g.lineBetween(ox + i * C, oy, ox + i * C, oy + px);
          g.lineBetween(ox, oy + i * C, ox + px, oy + i * C);
        }

        // Remove right border line locally for the exit
        const ey = oy + EXIT_ROW * C;
        g.lineStyle(2, 0xff00aa, 0.4);
        g.lineBetween(ox + px, oy, ox + px, ey);
        g.lineBetween(ox + px, ey + C, ox + px, oy + px);
      }

      drawBlockGfx(gfx: any, block: any, selectedAlpha: number) {
        gfx.clear();

        const C   = this.CELL;
        const M   = 3; // margin
        const bw  = block.dir === 'H' ? block.len * C : C;
        const bh  = block.dir === 'V' ? block.len * C : C;

        const mainColor = block.isTarget ? 0xff00aa : 0x00d4ff; // pink neon / cyan neon
        const bodyColor = block.isTarget ? 0x220516 : 0x051b24; // dark magenta / dark teal glass

        // Shadow glow
        if (selectedAlpha > 0) {
          gfx.fillStyle(mainColor, 0.12);
          gfx.fillRoundedRect(M - 4, M - 4, bw - M * 2 + 8, bh - M * 2 + 8, 8);
        } else {
          gfx.fillStyle(0x000000, 0.35);
          gfx.fillRoundedRect(M + 3, M + 3, bw - M * 2, bh - M * 2, 8);
        }

        // Translucent Glass Body
        gfx.fillStyle(bodyColor, 0.9);
        gfx.fillRoundedRect(M, M, bw - M * 2, bh - M * 2, 8);

        // Core/Circuit design inside the block
        gfx.lineStyle(1.5, mainColor, 0.25);
        if (block.dir === 'H') {
          gfx.lineBetween(M + 12, bh / 2, bw - M - 12, bh / 2);
          gfx.lineBetween(bw / 2, M + 6, bw / 2, bh - M - 6);
        } else {
          gfx.lineBetween(bw / 2, M + 12, bw / 2, bh - M - 12);
          gfx.lineBetween(M + 6, bh / 2, bw - M - 6, bh / 2);
        }

        // Glowing border stroke
        gfx.lineStyle(selectedAlpha > 0 ? 2.5 : 1.8, mainColor, selectedAlpha > 0 ? 1 : 0.7);
        gfx.strokeRoundedRect(M, M, bw - M * 2, bh - M * 2, 8);

        // Selection ring
        if (selectedAlpha > 0) {
          gfx.lineStyle(1.5, mainColor, 0.4);
          gfx.strokeRoundedRect(M - 3, M - 3, bw - M * 2 + 6, bh - M * 2 + 6, 10);
        }
      }

      redrawBlockGraphic(i: number, selected = false) {
        const ctr = this.blockCtrs[i];
        const gfx = ctr.list[0] as any;
        this.drawBlockGfx(gfx, this.blocks[i], selected ? 1 : 0);
      }

      buildGrid(excludeIdx = -1): number[][] {
        const g = Array.from({ length: GRID }, () => Array(GRID).fill(-1));
        this.blocks.forEach((b: any, i: number) => {
          if (i === excludeIdx) return;
          for (let k = 0; k < b.len; k++) {
            const r = b.dir === 'H' ? b.r : b.r + k;
            const c = b.dir === 'H' ? b.c + k : b.c;
            if (r >= 0 && r < GRID && c >= 0 && c < GRID) g[r][c] = i;
          }
        });
        return g;
      }

      getBlockAt(row: number, col: number): number {
        if (row < 0 || row >= GRID || col < 0 || col >= GRID) return -1;
        return this.buildGrid()[row][col];
      }

      computeMaxSlide(idx: number): { pos: number; neg: number } {
        const b    = this.blocks[idx];
        const grid = this.buildGrid(idx);
        let pos = 0, neg = 0;

        if (b.dir === 'H') {
          for (let c = b.c - 1; c >= 0; c--) {
            if (grid[b.r][c] !== -1) break; neg++;
          }
          const maxC = b.isTarget ? GRID : GRID - b.len;
          for (let c = b.c + b.len; c <= maxC; c++) {
            if (c < GRID && grid[b.r][c] !== -1) break;
            pos++;
          }
        } else {
          for (let r = b.r - 1; r >= 0; r--) {
            if (grid[r][b.c] !== -1) break; neg++;
          }
          for (let r = b.r + b.len; r < GRID; r++) {
            if (grid[r][b.c] !== -1) break; pos++;
          }
        }

        return { pos, neg };
      }

      onDown(ptr: any) {
        if (this.won) return;
        const col = Math.floor((ptr.x - this.gridX) / this.CELL);
        const row = Math.floor((ptr.y - this.gridY) / this.CELL);
        const hit = this.getBlockAt(row, col);

        if (hit !== -1) {
          this.dragging      = true;
          this.dragIdx       = hit;
          const b            = this.blocks[hit];
          this.dragStartPx   = b.dir === 'H' ? ptr.x : ptr.y;
          this.dragStartCell = b.dir === 'H' ? b.c : b.r;
          this.dragOffsetPx  = 0;
          const { pos, neg } = this.computeMaxSlide(hit);
          this.maxDragPos    = pos;
          this.maxDragNeg    = neg;
          this.redrawBlockGraphic(hit, true);
          this.playTone(280, 'sine', 0.05, 0.04);
        }
      }

      onMove(ptr: any) {
        if (!this.dragging || this.dragIdx === -1) return;

        const b       = this.blocks[this.dragIdx];
        const axis    = b.dir === 'H' ? ptr.x : ptr.y;
        let   rawPx   = axis - this.dragStartPx;
        const maxPosPx = this.maxDragPos * this.CELL;
        const maxNegPx = this.maxDragNeg * this.CELL;
        rawPx = Math.max(-maxNegPx, Math.min(maxPosPx, rawPx));

        this.dragOffsetPx = rawPx;

        const ctr = this.blockCtrs[this.dragIdx];
        if (b.dir === 'H') {
          ctr.x = this.gridX + b.c * this.CELL + rawPx;
        } else {
          ctr.y = this.gridY + b.r * this.CELL + rawPx;
        }
      }

      onUp(_ptr: any) {
        if (!this.dragging || this.dragIdx === -1) return;

        const b    = this.blocks[this.dragIdx];
        const C    = this.CELL;
        let   delta = Math.round(this.dragOffsetPx / C);
        delta = Math.max(-this.maxDragNeg, Math.min(this.maxDragPos, delta));

        if (b.dir === 'H') {
          b.c += delta;
        } else {
          b.r += delta;
        }

        if (delta !== 0) {
          this.moves++;
          this.movesText.setText(`MOVES: ${this.moves}`);
          this.playTone(330, 'sine', 0.08, 0.05);
        } else {
          this.playTone(200, 'triangle', 0.05, 0.05);
        }

        const ctr = this.blockCtrs[this.dragIdx];
        ctr.x = this.gridX + b.c * C;
        ctr.y = this.gridY + b.r * C;

        this.redrawBlockGraphic(this.dragIdx, false);

        const prevIdx      = this.dragIdx;
        this.dragging      = false;
        this.dragIdx       = -1;
        this.dragOffsetPx  = 0;

        if (b.isTarget && b.c + b.len > GRID - 1) {
          this.won = true;
          this.animateExit(prevIdx);
        }
      }

      animateExit(idx: number) {
        const ctr = this.blockCtrs[idx];
        this.playTone(523, 'sine', 0.15, 0.08);
        this.time.delayedCall(100, () => this.playTone(659, 'sine', 0.15, 0.08));

        this.tweens.add({
          targets: ctr,
          x: this.scale.width + 120,
          duration: 380,
          ease: 'Power2.easeIn',
          onComplete: () => {
            this.cameras.main.flash(450, 255, 200, 60, false);
            this.time.delayedCall(200, () => this.showWin());
          },
        });
      }

      showWin() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, W, H, 0x030208, 0.75);

        // Glassmorphic Modal Box
        const box = this.add.graphics();
        box.fillStyle(0x0b091c, 0.98);
        box.lineStyle(2.5, 0xff00aa, 1);
        box.fillRoundedRect(W / 2 - 160, H / 2 - 140, 320, 250, 16);
        box.strokeRoundedRect(W / 2 - 160, H / 2 - 140, 320, 250, 16);

        // Win Audio Fanfare
        this.playTone(523, 'sine', 0.15, 0.08);
        this.time.delayedCall(120, () => this.playTone(659, 'sine', 0.15, 0.08));
        this.time.delayedCall(240, () => this.playTone(784, 'sine', 0.2, 0.08));
        this.time.delayedCall(360, () => this.playTone(1046, 'sine', 0.35, 0.1));

        // Rating Calculations
        const levelData = LEVELS[this.level];
        const par = levelData.par;
        let stars = 1;
        if (this.moves <= par) {
          stars = 3;
        } else if (this.moves <= par + 3) {
          stars = 2;
        }

        // Save progress to local storage
        const currentBest = parseInt(localStorage.getItem(`unblock-me-level-stars-${this.level}`) || '0');
        if (stars > currentBest) {
          localStorage.setItem(`unblock-me-level-stars-${this.level}`, stars.toString());
        }

        // Title
        this.add.text(W / 2, H / 2 - 105, 'UNBLOCKED!', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ff00aa',
        }).setOrigin(0.5);

        // Stars display (golden neon representation)
        const starTextStr = '★ '.repeat(stars) + '☆ '.repeat(3 - stars);
        const starObj = this.add.text(W / 2, H / 2 - 58, starTextStr.trim(), {
          fontFamily: 'Orbitron, sans-serif', fontSize: '32px', color: '#ffd700', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: starObj,
          scaleX: 1.15,
          scaleY: 1.15,
          yoyo: true,
          duration: 350,
          ease: 'Back.easeOut'
        });

        // Stats Display
        this.add.text(W / 2, H / 2 - 14, `MOVES: ${this.moves}  •  PAR: ${par}`, {
          fontFamily: 'monospace', fontSize: '11px', color: '#687e9c',
        }).setOrigin(0.5);

        // Modal Controls
        const hasNext = this.level + 1 < LEVELS.length;
        const btnW = 100;
        const btnH = 34;

        const drawModalBtn = (gfx: any, x: number, y: number, color: number, isHover: boolean) => {
          gfx.clear();
          if (isHover) {
            gfx.fillStyle(color, 0.25);
            gfx.lineStyle(2, color, 1);
          } else {
            gfx.fillStyle(0x0e0c20, 0.9);
            gfx.lineStyle(1.5, color, 0.5);
          }
          gfx.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
          gfx.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
        };

        // 1. Menu Button
        const mx = W / 2 - 90;
        const my = H / 2 + 50;
        const menuGfx = this.add.graphics();
        drawModalBtn(menuGfx, mx, my, 0x00d4ff, false);
        const menuTxt = this.add.text(mx, my, 'MENU', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        menuTxt.on('pointerover', () => drawModalBtn(menuGfx, mx, my, 0x00d4ff, true));
        menuTxt.on('pointerout',  () => drawModalBtn(menuGfx, mx, my, 0x00d4ff, false));
        menuTxt.on('pointerdown', () => this.scene.start('UnblockMeMenu'));

        // 2. Play Again / Restart Button
        const rx = W / 2 + 90;
        const ry = H / 2 + 50;
        const restGfx = this.add.graphics();
        drawModalBtn(restGfx, rx, ry, 0xff00aa, false);
        const restTxt = this.add.text(rx, ry, 'REPLAY', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        restTxt.on('pointerover', () => drawModalBtn(restGfx, rx, ry, 0xff00aa, true));
        restTxt.on('pointerout',  () => drawModalBtn(restGfx, rx, ry, 0xff00aa, false));
        restTxt.on('pointerdown', () => this.scene.restart({ level: this.level }));

        // 3. Next Level Button (Bottom-centered if available)
        if (hasNext) {
          const nx = W / 2;
          const ny = H / 2 + 95;
          const nextGfx = this.add.graphics();
          drawModalBtn(nextGfx, nx, ny, 0x2ecc71, false);
          const nextTxt = this.add.text(nx, ny, 'NEXT LEVEL', {
            fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold'
          }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

          nextTxt.on('pointerover', () => drawModalBtn(nextGfx, nx, ny, 0x2ecc71, true));
          nextTxt.on('pointerout',  () => drawModalBtn(nextGfx, nx, ny, 0x2ecc71, false));
          nextTxt.on('pointerdown', () => this.scene.restart({ level: this.level + 1 }));
        }

        // Dispatch game over event for leaderboard (if fully resolved)
        const score = Math.max(10, (this.level + 1) * 1000 - this.moves * 10);
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'unblock-me', score }
        }));
      }

      playTone(freq: number, type: string = 'sine', duration: number = 0.1, vol: number = 0.08) {
        try {
          if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = type as any;
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
          gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {}
      }
    }

    return { scenes: [UnblockMeMenu, UnblockMeScene] };
  }
}
