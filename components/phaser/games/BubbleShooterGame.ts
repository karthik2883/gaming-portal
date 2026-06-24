// Bubble Shooter Neo — Phaser 3  (safe syntax: no class-field initializers)
'use strict';

// ─── audio ─────────────────────────────────────────────────────────────────
let _ac: AudioContext | null = null;
function ac() {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ac) { const A = (window as any).AudioContext || (window as any).webkitAudioContext; if (A) _ac = new A(); }
    if (_ac && _ac.state === 'suspended') _ac.resume();
  } catch {}
  return _ac;
}
function beep(hz: number, vol = 0.06, dur = 0.08, type: OscillatorType = 'sine') {
  const ctx = ac(); if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = hz;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  } catch {}
}

// ─── constants ─────────────────────────────────────────────────────────────
const BS_BD      = 32;          // bubble diameter
const BS_BR      = 16;          // bubble radius
const BS_COLS    = 10;
const BS_ROWS    = 22;
const BS_ROW_H   = 28;          // hex-row spacing
const BS_OX      = 80;          // board left edge
const BS_PW      = BS_COLS * BS_BD;   // 320
const BS_OY      = 52;          // board top (ceiling)
const BS_LW      = BS_OX + BS_BR;    // 96   left wall
const BS_RW      = BS_OX + BS_PW - BS_BR; // 384  right wall
const BS_DANG    = 458;         // danger line
const BS_LX      = BS_OX + BS_PW / 2; // 240  launcher x
const BS_LY      = 536;         // launcher y
const BS_STEP    = 4;           // px per physics micro-step
const BS_SUBSTEP = 3;           // micro-steps per frame
const BS_PAL = [
  { k: 'r', h: 0xff0055 }, // Hot pink neon
  { k: 'c', h: 0x00f3ff }, // Bright cyan neon
  { k: 'y', h: 0xffea00 }, // Neon yellow
  { k: 'g', h: 0x39ff14 }, // Neon lime green
  { k: 'p', h: 0xbd00ff }, // Purple/magenta neon
];

// ─── factory ───────────────────────────────────────────────────────────────
export default class BubbleShooterGameFactory {
  static create(PH: any) {
    return class BubbleScene extends PH.Scene {
      // declare everything (no initialisers — use constructor / init instead)
      grid: any[][];
      score: number;
      hi: number;
      level: number;
      shots: number;
      over: boolean;
      won: boolean;
      ballSpr: any;
      ballVX: number;
      ballVY: number;
      ballKey: string;
      ballHex: number;
      ballActive: boolean;
      curSpr: any;
      curKey: string;
      curHex: number;
      nxtSpr: any;
      nxtKey: string;
      nxtHex: number;
      laserGfx: any;
      socketsGfx: any;
      launcherGfx: any;
      scoreTxt: any;
      dangerGfx: any;
      trailEmitter: any;
      hiTxt: any;
      lvlTxt: any;
      shotsTxt: any;
      palSize: number;
      rowsShifted: number;
      launcherRecoil: number;
      gridTimer: number;

      constructor() {
        super({ key: 'BubbleScene' });
        // zero-value defaults so TypeScript is happy
        this.grid       = [];
        this.score      = 0;
        this.hi         = 0;
        this.level      = 1;
        this.shots      = 0;
        this.over       = false;
        this.won        = false;
        this.ballSpr    = null;
        this.ballVX     = 0;
        this.ballVY     = 0;
        this.ballKey    = '';
        this.ballHex    = 0;
        this.ballActive = false;
        this.curSpr     = null;
        this.curKey     = '';
        this.curHex     = 0;
        this.nxtSpr     = null;
        this.nxtKey     = '';
        this.nxtHex     = 0;
        this.laserGfx   = null;
        this.socketsGfx  = null;
        this.launcherGfx = null;
        this.scoreTxt   = null;
        this.hiTxt      = null;
        this.lvlTxt     = null;
        this.shotsTxt   = null;
        this.palSize    = 3;
        this.rowsShifted = 0;
        this.launcherRecoil = 0;
        this.gridTimer = 0;
        this.dangerGfx = null;
        this.trailEmitter = null;
      }

      // ── init (called before create on every start/restart) ────────────────
      init(d: any) {
        this.grid       = Array.from({ length: BS_ROWS }, () => Array(BS_COLS).fill(null));
        this.score      = (d && d.score) ? d.score : 0;
        this.level      = (d && d.level) ? d.level : 1;
        this.shots      = 0;
        this.over       = false;
        this.won        = false;
        this.ballActive = false;
        this.ballSpr    = null;
        this.curSpr     = null;
        this.nxtSpr     = null;
        this.palSize    = Math.min(2 + this.level, BS_PAL.length);
        this.hi = 0;
        this.rowsShifted = 0;
        this.launcherRecoil = 0;
        this.gridTimer = 0;
        this.dangerGfx = null;
        this.trailEmitter = null;
        try {
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('bsHi') : null;
          if (stored) this.hi = parseInt(stored, 10) || 0;
        } catch {}
      }

      // ── create ────────────────────────────────────────────────────────────
      create() {
        // background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x02020a, 0x02020a, 0x050512, 0x050512, 1);
        bg.fillRect(0, 0, 480, 600);

        // Ambient glowing background behind the board
        const ambientGlow = this.add.graphics();
        ambientGlow.fillStyle(0x00f3ff, 0.03); // super soft cyan glow
        ambientGlow.fillCircle(BS_LX, BS_OY + 100, 150);
        ambientGlow.fillStyle(0xbd00ff, 0.02); // super soft magenta/purple glow
        ambientGlow.fillCircle(BS_LX, BS_DANG, 180);

        // build bubble textures
        this.buildTextures();

        // board frame + static labels
        this.drawFrame();

        // danger line graphics
        this.dangerGfx = this.add.graphics().setDepth(4);
        this.drawDangerLine();

        // sockets graphics (drawn behind bubbles)
        this.socketsGfx = this.add.graphics().setDepth(1);
        this.drawSockets();

        // launcher graphics (drawn in front of background/sockets, behind bubble shooter)
        this.launcherGfx = this.add.graphics().setDepth(5);

        // HUD
        this.buildHUD();

        // laser graphics (on top)
        this.laserGfx = this.add.graphics().setDepth(10);

        // seed grid
        this.seedGrid();

        // launcher
        this.nextBubble();
        this.nextBubble(); // promotes nxt → cur, spawns fresh nxt

        // input
        const scene = this;
        this.input.on('pointerdown', function(ptr: any) {
          ac();
          if (scene.over) { scene.scene.restart({ level: 1, score: 0 }); return; }
          if (!scene.won) scene.doShoot(ptr);
        });
      }

      // ── texture builder ───────────────────────────────────────────────────
      buildTextures() {
        BS_PAL.forEach(col => {
          const key = 'b' + col.k;
          if (this.textures.exists(key)) this.textures.remove(key);
          const ct  = this.textures.createCanvas(key, BS_BD, BS_BD) as any;
          const ctx = ct.context as CanvasRenderingContext2D;
          const hexStr = '#' + col.h.toString(16).padStart(6, '0');

          ctx.clearRect(0, 0, BS_BD, BS_BD);

          // 1. Draw outer neon glow ring
          ctx.save();
          ctx.shadowBlur = 6;
          ctx.shadowColor = hexStr;
          ctx.strokeStyle = hexStr;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(BS_BR, BS_BR, BS_BR - 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // 2. Draw glassy body gradient
          const radGr = ctx.createRadialGradient(BS_BR - 3, BS_BR - 3, 1, BS_BR, BS_BR, BS_BR - 2);
          radGr.addColorStop(0, hexStr + '88'); // semi-transparent core color
          radGr.addColorStop(0.6, hexStr + '1a'); // transparent middle
          radGr.addColorStop(1, hexStr + '55'); // edge ring glow
          ctx.fillStyle = radGr;
          ctx.beginPath();
          ctx.arc(BS_BR, BS_BR, BS_BR - 2, 0, Math.PI * 2);
          ctx.fill();

          // 3. Glowing inner core highlight
          const coreGr = ctx.createRadialGradient(BS_BR, BS_BR, 0, BS_BR, BS_BR, 4.5);
          coreGr.addColorStop(0, '#ffffff');
          coreGr.addColorStop(0.3, hexStr + 'ee');
          coreGr.addColorStop(1, 'transparent');
          ctx.fillStyle = coreGr;
          ctx.beginPath();
          ctx.arc(BS_BR, BS_BR, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // 4. Glassy crescent reflection
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(BS_BR - 4, BS_BR - 4, 6, Math.PI * 1.0, Math.PI * 1.5);
          ctx.stroke();

          ct.refresh();
        });

        // white dot for particles
        if (this.textures.exists('bsdot')) this.textures.remove('bsdot');
        const dt  = this.textures.createCanvas('bsdot', 6, 6) as any;
        const dtx = dt.context as CanvasRenderingContext2D;
        dtx.fillStyle = '#ffffff';
        dtx.fillRect(0, 0, 6, 6);
        dt.refresh();
      }

      // ── board frame ───────────────────────────────────────────────────────
      drawFrame() {
        const g = this.add.graphics();

        // subtle grid lines
        g.lineStyle(1, 0x14142b, 0.45);
        const gridSpacing = 40;
        for (let x = BS_OX; x <= BS_OX + BS_PW; x += gridSpacing) {
          g.lineBetween(x, BS_OY, x, BS_DANG + 95);
        }
        for (let y = BS_OY; y <= BS_DANG + 95; y += gridSpacing) {
          g.lineBetween(BS_OX, y, BS_OX + BS_PW, y);
        }

        // board background
        g.fillStyle(0x060618, 0.95);
        g.fillRect(BS_OX, BS_OY, BS_PW, BS_DANG - BS_OY + 95);

        // board border neon glow
        g.lineStyle(6, 0x00f3ff, 0.15); // outer glow
        g.strokeRect(BS_OX, BS_OY, BS_PW, BS_DANG - BS_OY + 95);
        g.lineStyle(4, 0x00f3ff, 0.35); // mid glow
        g.strokeRect(BS_OX, BS_OY, BS_PW, BS_DANG - BS_OY + 95);
        g.lineStyle(2, 0x00f3ff, 0.9);  // core border line
        g.strokeRect(BS_OX, BS_OY, BS_PW, BS_DANG - BS_OY + 95);

        // corner accent brackets
        const margin = 6;
        const bracketSize = 14;
        g.lineStyle(2.5, 0x00f3ff, 0.95);
        
        // Top-left bracket
        g.beginPath();
        g.moveTo(BS_OX - margin, BS_OY - margin + bracketSize);
        g.lineTo(BS_OX - margin, BS_OY - margin);
        g.lineTo(BS_OX - margin + bracketSize, BS_OY - margin);
        g.stroke();
        
        // Top-right bracket
        g.beginPath();
        g.moveTo(BS_OX + BS_PW + margin, BS_OY - margin + bracketSize);
        g.lineTo(BS_OX + BS_PW + margin, BS_OY - margin);
        g.lineTo(BS_OX + BS_PW + margin - bracketSize, BS_OY - margin);
        g.stroke();
        
        // Bottom-left bracket
        const boardBottom = BS_DANG + 95;
        g.beginPath();
        g.moveTo(BS_OX - margin, boardBottom + margin - bracketSize);
        g.lineTo(BS_OX - margin, boardBottom + margin);
        g.lineTo(BS_OX - margin + bracketSize, boardBottom + margin);
        g.stroke();
        
        // Bottom-right bracket
        g.beginPath();
        g.moveTo(BS_OX + BS_PW + margin, boardBottom + margin - bracketSize);
        g.lineTo(BS_OX + BS_PW + margin, boardBottom + margin);
        g.lineTo(BS_OX + BS_PW + margin - bracketSize, boardBottom + margin);
        g.stroke();

        // title
        const title = this.add.text(BS_LX, 20, 'BUBBLE  NEON', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '20px',
          color: '#00f3ff',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        title.setStroke('#00f3ff', 2);
        title.setShadow(0, 0, '#00f3ff', 12, true, true);

        // danger label
        const danger = this.add.text(BS_LX, BS_DANG - 10, '⚡  DANGER  ⚡', {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#ff0055',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        danger.setStroke('#ff0055', 2);
        danger.setShadow(0, 0, '#ff0055', 8, true, true);
      }

      drawDangerLine() {
        if (!this.dangerGfx) return;
        this.dangerGfx.clear();
        this.dangerGfx.lineStyle(5, 0xff0055, 0.35); // outer glow
        this.dangerGfx.lineBetween(BS_OX, BS_DANG, BS_OX + BS_PW, BS_DANG);
        this.dangerGfx.lineStyle(1.5, 0xff0055, 1.0); // core line
        this.dangerGfx.lineBetween(BS_OX, BS_DANG, BS_OX + BS_PW, BS_DANG);
      }

      // ── draw grid socket positions ─────────────────────────────────────────
      drawSockets() {
        if (!this.socketsGfx) return;
        this.socketsGfx.clear();
        this.socketsGfx.lineStyle(1.5, 0x1f1f3e, 0.35);
        for (let r = 0; r < BS_ROWS; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            const p = this.cp(r, c);
            this.socketsGfx.strokeCircle(p.x, p.y, BS_BR - 1.5);
          }
        }
      }

      // ── HUD ───────────────────────────────────────────────────────────────
      buildHUD() {
        const rx = BS_OX + BS_PW + 8;  // 408
        const labelStyle  = { fontFamily: 'monospace', fontSize: '10px', color: '#63638b', fontStyle: 'bold' };
        const valueStyle  = { fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#00f3ff', fontStyle: 'bold' };
        const valueStyle2 = { fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#ffea00', fontStyle: 'bold' };
        const valueStyle3 = { fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#39ff14', fontStyle: 'bold' };
        const valueStyle4 = { fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#ff0055', fontStyle: 'bold' };

        this.add.text(rx, 60, 'SCORE', labelStyle);
        this.scoreTxt = this.add.text(rx, 74, '0', valueStyle);
        this.scoreTxt.setStroke('#00f3ff', 2);
        this.scoreTxt.setShadow(0, 0, '#00f3ff', 8, true, true);

        this.add.text(rx, 108, 'BEST', labelStyle);
        this.hiTxt = this.add.text(rx, 122, '0', valueStyle2);
        this.hiTxt.setStroke('#ffea00', 2);
        this.hiTxt.setShadow(0, 0, '#ffea00', 8, true, true);

        this.add.text(rx, 156, 'LEVEL', labelStyle);
        this.lvlTxt = this.add.text(rx, 170, '1', valueStyle3);
        this.lvlTxt.setStroke('#39ff14', 2);
        this.lvlTxt.setShadow(0, 0, '#39ff14', 8, true, true);

        this.add.text(rx, 206, 'TO ROW', labelStyle);
        this.shotsTxt = this.add.text(rx, 220, '6', valueStyle4);
        this.shotsTxt.setStroke('#ff0055', 2);
        this.shotsTxt.setShadow(0, 0, '#ff0055', 8, true, true);

        this.add.text(rx, 264, 'NEXT', labelStyle);

        // controls hint
        const lx = BS_OX - 8;
        this.add.text(lx, 60, 'AIM\nmouse', { fontFamily: 'monospace', fontSize: '9px', color: '#45456b', align: 'right', lineSpacing: 3 }).setOrigin(1, 0);
        this.add.text(lx, 88, 'SHOOT\nclick', { fontFamily: 'monospace', fontSize: '9px', color: '#45456b', align: 'right', lineSpacing: 3 }).setOrigin(1, 0);

        this.refreshHUD();
      }

      refreshHUD() {
        if (this.scoreTxt) this.scoreTxt.setText(String(this.score));
        if (this.hiTxt)    this.hiTxt.setText(String(Math.max(this.hi, this.score)));
        if (this.lvlTxt)   this.lvlTxt.setText(String(this.level));
        const left = 6 - (this.shots % 6 || 6);
        if (this.shotsTxt) this.shotsTxt.setText(String(left <= 0 ? 6 : left));
      }

      // ── seed grid ─────────────────────────────────────────────────────────
      seedGrid() {
        const pal  = BS_PAL.slice(0, this.palSize);
        const rows = Math.min(4 + this.level, 10);
        for (let r = 0; r < rows; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            const col = pal[Math.floor(Math.random() * pal.length)];
            const p   = this.cp(r, c);
            const spr = this.add.sprite(p.x, p.y, 'b' + col.k).setOrigin(0.5).setDepth(2);
            this.grid[r][c] = { spr, k: col.k, h: col.h };
          }
        }
      }

      // ── cell position ─────────────────────────────────────────────────────
      cp(r: number, c: number) {
        const shift = ((r + this.rowsShifted) % 2 === 1) ? BS_BR : 0;
        return { x: BS_OX + c * BS_BD + BS_BR + shift, y: BS_OY + r * BS_ROW_H + BS_BR };
      }

      // ── spawn next bubble ─────────────────────────────────────────────────
      nextBubble() {
        // promote nxt → cur
        if (this.nxtSpr) {
          if (this.curSpr) { try { this.curSpr.destroy(); } catch {} }
          this.curKey = this.nxtKey;
          this.curHex = this.nxtHex;
          this.curSpr = this.nxtSpr;
          this.tweens.add({
            targets: this.curSpr,
            x: BS_LX, y: BS_LY,
            duration: 180, ease: 'Power2',
          });
          this.nxtSpr = null;
        }

        // new preview bubble
        const pal = BS_PAL.slice(0, this.palSize);
        const col = pal[Math.floor(Math.random() * pal.length)];
        this.nxtSpr = this.add.sprite(BS_OX + BS_PW + 40, 287, 'b' + col.k).setOrigin(0.5).setScale(0.8).setDepth(2);
        this.nxtKey = col.k;
        this.nxtHex = col.h;
      }

      // ── shoot ─────────────────────────────────────────────────────────────
      doShoot(ptr: any) {
        if (this.ballActive || !this.curSpr) return;

        const dx = (ptr.x as number) - BS_LX;
        const dy = (ptr.y as number) - BS_LY;

        // must aim upward
        if (dy >= -10) return;

        const len = Math.sqrt(dx * dx + dy * dy);
        this.ballVX  = dx / len;
        this.ballVY  = dy / len;
        this.ballKey = this.curKey;
        this.ballHex = this.curHex;

        this.ballSpr = this.add.sprite(BS_LX, BS_LY, 'b' + this.ballKey)
          .setOrigin(0.5)
          .setDepth(10);

        try { this.curSpr.destroy(); } catch {}
        this.curSpr     = null;
        this.ballActive = true;

        // Create trail emitter
        this.trailEmitter = this.add.particles(0, 0, 'bsdot', {
          speed: 12,
          scale: { start: 0.85, end: 0 },
          lifespan: 220,
          blendMode: 'ADD',
          frequency: 20,
          tint: this.ballHex
        });
        this.trailEmitter.startFollow(this.ballSpr);

        // Trigger recoil impact
        this.launcherRecoil = 12;

        beep(360, 0.06, 0.09, 'sine');
      }

      // ── update loop ───────────────────────────────────────────────────────
      update() {
        this.drawLaser();
        this.updateLauncher();
        this.animateGrid();

        // Pulsate danger line glow
        if (this.dangerGfx) {
          const pulse = 0.5 + Math.sin(this.time.now / 150) * 0.35;
          this.dangerGfx.setAlpha(pulse);
        }

        if (!this.ballActive || !this.ballSpr) return;

        for (let s = 0; s < BS_SUBSTEP; s++) {
          if (!this.ballActive || !this.ballSpr) break;
          this.moveBall();
        }
      }

      // ── update launcher rotation & recoil visual ───────────────────────────
      updateLauncher() {
        if (!this.launcherGfx) return;
        this.launcherGfx.clear();
        if (this.over || this.won) return;

        const ptr = this.input.activePointer;
        const dx = ptr.x - BS_LX;
        const dy = ptr.y - BS_LY;
        let angle = -Math.PI / 2;
        if (dy < -2) {
          angle = Math.atan2(dy, dx);
        }

        // Dampen recoil
        if (this.launcherRecoil > 0) {
          this.launcherRecoil -= 0.8;
          if (this.launcherRecoil < 0) this.launcherRecoil = 0;
        }

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const pCos = Math.cos(angle + Math.PI / 2);
        const pSin = Math.sin(angle + Math.PI / 2);

        // Recoil offset location
        const rx = BS_LX - cos * this.launcherRecoil;
        const ry = BS_LY - sin * this.launcherRecoil;

        // Cannon barrel dimensions
        const barrelLength = 26;
        const barrelWidth = 14;

        const x1 = rx - pCos * (barrelWidth / 2);
        const y1 = ry - pSin * (barrelWidth / 2);
        const x2 = rx + pCos * (barrelWidth / 2);
        const y2 = ry + pSin * (barrelWidth / 2);
        const x3 = x2 + cos * barrelLength;
        const y3 = y2 + sin * barrelLength;
        const x4 = x1 + cos * barrelLength;
        const y4 = y1 + sin * barrelLength;

        // Cannon outer neon glow
        this.launcherGfx.lineStyle(4, 0x00f3ff, 0.25);
        this.launcherGfx.beginPath();
        this.launcherGfx.moveTo(x1, y1);
        this.launcherGfx.lineTo(x2, y2);
        this.launcherGfx.lineTo(x3, y3);
        this.launcherGfx.lineTo(x4, y4);
        this.launcherGfx.closePath();
        this.launcherGfx.stroke();

        // Cannon solid body
        this.launcherGfx.lineStyle(1.8, 0x00f3ff, 0.9);
        this.launcherGfx.fillStyle(0x0a0a24, 0.95);
        this.launcherGfx.beginPath();
        this.launcherGfx.moveTo(x1, y1);
        this.launcherGfx.lineTo(x2, y2);
        this.launcherGfx.lineTo(x3, y3);
        this.launcherGfx.lineTo(x4, y4);
        this.launcherGfx.closePath();
        this.launcherGfx.fill();
        this.launcherGfx.stroke();

        // Bright laser core highlight
        this.launcherGfx.lineStyle(2, 0xffffff, 0.9);
        this.launcherGfx.lineBetween(rx + cos * 5, ry + sin * 5, rx + cos * (barrelLength - 3), ry + sin * (barrelLength - 3));

        // Circular bracket base
        this.launcherGfx.lineStyle(3, 0xbd00ff, 0.4);
        this.launcherGfx.strokeCircle(rx, ry, BS_BR - 2);
        this.launcherGfx.fillStyle(0xbd00ff, 0.15);
        this.launcherGfx.fillCircle(rx, ry, BS_BR - 2);

        // Rotating cyber-ring ticks
        const baseAngle = this.time.now / 1000;
        this.launcherGfx.lineStyle(1.5, 0x00f3ff, 0.7);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const tickAngle = baseAngle + a;
          const xStart = rx + Math.cos(tickAngle) * (BS_BR + 2);
          const yStart = ry + Math.sin(tickAngle) * (BS_BR + 2);
          const xEnd = rx + Math.cos(tickAngle) * (BS_BR + 6);
          const yEnd = ry + Math.sin(tickAngle) * (BS_BR + 6);
          this.launcherGfx.lineBetween(xStart, yStart, xEnd, yEnd);
        }
      }

      // ── breathe/hover active grid bubbles ──────────────────────────────────
      animateGrid() {
        this.gridTimer = (this.gridTimer || 0) + 0.035;
        for (let r = 0; r < BS_ROWS; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            const cell = this.grid[r][c];
            if (cell && cell.spr) {
              const p = this.cp(r, c);
              const offset = Math.sin(this.gridTimer + r * 0.45 + c * 0.3) * 1.6;
              cell.spr.y = p.y + offset;
            }
          }
        }
      }

      moveBall() {
        let nx = this.ballSpr.x + this.ballVX * BS_STEP;
        let ny = this.ballSpr.y + this.ballVY * BS_STEP;

        // wall bounce
        if (nx < BS_LW) {
          nx = BS_LW + (BS_LW - nx);
          this.ballVX = Math.abs(this.ballVX);
          beep(500, 0.04, 0.04, 'sine');
          this.spawnBounceSparks(nx, ny, true);
        } else if (nx > BS_RW) {
          nx = BS_RW - (nx - BS_RW);
          this.ballVX = -Math.abs(this.ballVX);
          beep(500, 0.04, 0.04, 'sine');
          this.spawnBounceSparks(nx, ny, false);
        }

        this.ballSpr.x = nx;
        this.ballSpr.y = ny;

        // Stretch flight scale along travel angle
        const travelAngle = Math.atan2(this.ballVY, this.ballVX);
        this.ballSpr.rotation = travelAngle + Math.PI / 2;
        this.ballSpr.setScale(0.85, 1.25);

        // ceiling
        if (ny <= BS_OY + BS_BR) {
          this.land(nx, ny); return;
        }

        // fell off bottom
        if (ny > BS_LY + 60) {
          this.ballSpr.destroy();
          this.ballSpr    = null;
          this.ballActive = false;
          if (this.trailEmitter) {
            try { this.trailEmitter.destroy(); } catch {}
            this.trailEmitter = null;
          }
          this.nextBubble();
          return;
        }

        // hit a grid bubble
        for (let r = 0; r < BS_ROWS; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            const cell = this.grid[r][c];
            if (!cell) continue;
            const dx = nx - cell.spr.x;
            const dy = ny - cell.spr.y;
            if (dx * dx + dy * dy < (BS_BD - 2) * (BS_BD - 2)) {
              this.land(nx, ny); return;
            }
          }
        }
      }

      // ── emit spark particles when bouncing off walls ────────────────────────
      spawnBounceSparks(x: number, y: number, isLeftWall: boolean) {
        try {
          const angleMin = isLeftWall ? -35 : 145;
          const angleMax = isLeftWall ? 35 : 215;
          const sparks = this.add.particles(0, 0, 'bsdot', {
            speed: { min: 45, max: 95 },
            angle: { min: angleMin, max: angleMax },
            scale: { start: 0.9, end: 0 },
            lifespan: 220,
            blendMode: 'ADD',
          });
          sparks.explode(6, x, y);
          this.time.delayedCall(250, () => { try { sparks.destroy(); } catch {} });
        } catch {}
      }

      // ── land bubble in grid ───────────────────────────────────────────────
      land(bx: number, by: number) {
        if (!this.ballActive) return;
        this.ballActive = false;
        const k = this.ballKey, h = this.ballHex;
        if (this.ballSpr) { try { this.ballSpr.destroy(); } catch {} }
        this.ballSpr = null;

        if (this.trailEmitter) {
          const emitterRef = this.trailEmitter;
          emitterRef.stopFollow();
          this.time.delayedCall(300, () => { try { emitterRef.destroy(); } catch {} });
          this.trailEmitter = null;
        }

        // find closest empty connected slot
        let br = -1, bc = -1, bd = Infinity;
        for (let r = 0; r < BS_ROWS; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            if (this.grid[r][c]) continue;
            const p = this.cp(r, c);
            const d = Math.sqrt((bx - p.x) * (bx - p.x) + (by - p.y) * (by - p.y));
            const ok = r === 0 || this.nbrs(r, c).some((n: any) => this.grid[n.r] && this.grid[n.r][n.c]);
            if (ok && d < bd) { bd = d; br = r; bc = c; }
          }
        }

        if (br < 0) { this.nextBubble(); return; }

        const fp  = this.cp(br, bc);
        const spr = this.add.sprite(fp.x, fp.y, 'b' + k).setOrigin(0.5).setDepth(2);
        
        // Impact elastic squash animation
        const impactAngle = Math.atan2(fp.y - by, fp.x - bx);
        spr.rotation = impactAngle + Math.PI / 2;
        spr.setScale(1.3, 0.7);
        this.tweens.add({
          targets: spr,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          duration: 250,
          ease: 'Elastic.easeOut',
        });
        
        this.grid[br][bc] = { spr, k, h };

        beep(260, 0.05, 0.06, 'square');
        this.checkMatch(br, bc);
      }

      // ── match-3 ───────────────────────────────────────────────────────────
      checkMatch(r0: number, c0: number) {
        const k   = this.grid[r0][c0].k;
        const vis = new Set<string>();
        const q: any[] = [{ r: r0, c: c0 }];
        const grp: any[] = [];
        vis.add(r0 + ',' + c0);
        while (q.length) {
          const cur = q.shift();
          grp.push(cur);
          this.nbrs(cur.r, cur.c).forEach((n: any) => {
            const key = n.r + ',' + n.c;
            if (!vis.has(key) && this.grid[n.r] && this.grid[n.r][n.c] && this.grid[n.r][n.c].k === k) {
              vis.add(key); q.push(n);
            }
          });
        }

        if (grp.length >= 3) {
          grp.forEach((g, i) => {
            this.time.delayedCall(i * 30, () => this.popCell(g.r, g.c));
          });
          this.score += grp.length * 10 * this.level;
          beep(440, 0.07, 0.15, 'triangle');
          const scene = this;
          this.time.delayedCall(grp.length * 30 + 150, function() {
            scene.dropOrphans();
            scene.checkWin();
            scene.advanceShots();
            scene.refreshHUD();
            scene.nextBubble();
          });
        } else {
          this.advanceShots();
          if (this.inDanger()) { this.doGameOver(); return; }
          this.refreshHUD();
          this.nextBubble();
        }
      }

      popCell(r: number, c: number) {
        const b = this.grid[r][c]; if (!b) return;
        this.grid[r][c] = null;
        try {
          const em = this.add.particles(0, 0, 'bsdot', {
            speed: { min: 50, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            lifespan: 380,
            blendMode: 'ADD',
            tint: b.h
          });
          em.explode(8, b.spr.x, b.spr.y);
          const emRef = em;
          this.time.delayedCall(450, function() { try { emRef.destroy(); } catch {} });
        } catch {}
        this.tweens.add({
          targets: b.spr, scaleX: 0, scaleY: 0, alpha: 0, duration: 110,
          onComplete: function() { try { b.spr.destroy(); } catch {} },
        });
      }

      dropOrphans() {
        const reach = new Set<string>();
        const q: any[] = [];
        for (let c = 0; c < BS_COLS; c++) {
          if (this.grid[0][c]) { q.push({ r: 0, c }); reach.add('0,' + c); }
        }
        while (q.length) {
          const cur = q.shift();
          this.nbrs(cur.r, cur.c).forEach((n: any) => {
            const key = n.r + ',' + n.c;
            if (!reach.has(key) && this.grid[n.r] && this.grid[n.r][n.c]) {
              reach.add(key); q.push(n);
            }
          });
        }
        for (let r = 0; r < BS_ROWS; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            if (this.grid[r][c] && !reach.has(r + ',' + c)) {
              const s = this.grid[r][c].spr;
              this.grid[r][c] = null;
              this.tweens.add({
                targets: s, y: 700, alpha: 0, duration: 450, ease: 'Quad.easeIn',
                onComplete: function() { try { s.destroy(); } catch {} },
              });
              this.score += 20 * this.level;
            }
          }
        }
      }

      advanceShots() {
        this.shots++;
        if (this.shots % 6 === 0) this.pushRow();
      }

      pushRow() {
        if (this.grid[BS_ROWS - 1].some((b: any) => b)) { this.doGameOver(); return; }
        
        for (let r = BS_ROWS - 1; r > 0; r--) {
          this.grid[r] = this.grid[r - 1].slice();
        }
        
        this.rowsShifted++;
        
        this.grid[0] = Array(BS_COLS).fill(null);
        const pal = BS_PAL.slice(0, this.palSize);
        const maxC = (this.rowsShifted % 2 === 1) ? BS_COLS - 1 : BS_COLS;
        for (let c = 0; c < maxC; c++) {
          const col = pal[Math.floor(Math.random() * pal.length)];
          const p   = this.cp(0, c);
          const spr = this.add.sprite(p.x, p.y - BS_ROW_H, 'b' + col.k).setOrigin(0.5).setDepth(2);
          this.grid[0][c] = { spr, k: col.k, h: col.h };
          this.tweens.add({ targets: spr, y: p.y, duration: 200, ease: 'Power2' });
        }
        
        for (let r = 1; r < BS_ROWS; r++) {
          const rowMaxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = rowMaxC; c < BS_COLS; c++) {
            if (this.grid[r][c]) {
              try { this.grid[r][c].spr.destroy(); } catch {}
              this.grid[r][c] = null;
            }
          }
          for (let c = 0; c < rowMaxC; c++) {
            if (this.grid[r][c]) {
              const p = this.cp(r, c);
              this.tweens.add({ targets: this.grid[r][c].spr, x: p.x, y: p.y, duration: 200 });
            }
          }
        }
        
        this.drawSockets();
        
        beep(150, 0.07, 0.2, 'sawtooth');
        if (this.inDanger()) this.doGameOver();
      }

      inDanger() {
        for (let r = 0; r < BS_ROWS; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            if (this.grid[r][c] && this.grid[r][c].spr.y >= BS_DANG) return true;
          }
        }
        return false;
      }

      checkWin() {
        for (let r = 0; r < BS_ROWS; r++) {
          const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
          for (let c = 0; c < maxC; c++) {
            if (this.grid[r][c]) return;
          }
        }
        this.doWin();
      }

      doWin() {
        this.won = true; this.ballActive = false;
        beep(523, 0.08, 0.12, 'square');
        this.time.delayedCall(130, () => beep(659, 0.08, 0.12, 'square'));
        this.time.delayedCall(260, () => beep(784, 0.08, 0.12, 'square'));
        const scene = this;
        this.add.rectangle(240, 300, 480, 600, 0x02020a, 0.75);
        
        this.add.rectangle(240, 290, 260, 120, 0x0a0a24).setStrokeStyle(3, 0x39ff14);
        
        const winTitle = this.add.text(240, 255, '🏆 LEVEL CLEAR!', { fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#39ff14', fontStyle: 'bold' }).setOrigin(0.5);
        winTitle.setStroke('#39ff14', 2);
        winTitle.setShadow(0, 0, '#39ff14', 10, true, true);

        this.add.text(240, 288, 'Score: ' + this.score, { fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#e0e0ff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(240, 312, 'Next level in 2s…', { fontFamily: 'monospace', fontSize: '11px', color: '#888888' }).setOrigin(0.5);
        this.time.delayedCall(2200, function() { scene.scene.restart({ level: scene.level + 1, score: scene.score + 500 }); });
      }

      doGameOver() {
        if (this.over) return;
        this.over = true; this.ballActive = false;
        if (this.score > this.hi) {
          this.hi = this.score;
          try { if (typeof window !== 'undefined') window.localStorage.setItem('bsHi', String(this.hi)); } catch {}
        }
        beep(200, 0.09, 0.5, 'square');
        this.time.delayedCall(300, () => beep(160, 0.08, 0.6, 'square'));
        this.add.rectangle(240, 300, 480, 600, 0x02020a, 0.8);
        
        this.add.rectangle(240, 290, 260, 120, 0x14020a).setStrokeStyle(3, 0xff0055);
        
        const overTitle = this.add.text(240, 255, 'GAME  OVER', { fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#ff0055', fontStyle: 'bold' }).setOrigin(0.5);
        overTitle.setStroke('#ff0055', 2);
        overTitle.setShadow(0, 0, '#ff0055', 10, true, true);

        this.add.text(240, 288, 'Score: ' + this.score, { fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#e0e0ff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(240, 312, 'Click to restart', { fontFamily: 'monospace', fontSize: '11px', color: '#888888' }).setOrigin(0.5);
        try {
          window.dispatchEvent(new CustomEvent('phaser-game-over', { detail: { gameKey: 'bubble-shooter', score: this.score } }));
        } catch {}
      }

      // ── hex-grid neighbours ───────────────────────────────────────────────
      nbrs(r: number, c: number) {
        const odd = (r + this.rowsShifted) % 2 === 1;
        const list = [
          { r, c: c - 1 }, { r, c: c + 1 },
          { r: r - 1, c: odd ? c : c - 1 },
          { r: r - 1, c: odd ? c + 1 : c },
          { r: r + 1, c: odd ? c : c - 1 },
          { r: r + 1, c: odd ? c + 1 : c },
        ];
        const maxColsCurrent = (rowIdx: number) => ((rowIdx + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
        return list.filter(n => n.r >= 0 && n.r < BS_ROWS && n.c >= 0 && n.c < maxColsCurrent(n.r));
      }

      // ── aiming laser ──────────────────────────────────────────────────────
      drawLaser() {
        if (!this.laserGfx) return;
        this.laserGfx.clear();
        if (this.over || this.won || this.ballActive || !this.curSpr) return;

        const ptr = this.input.activePointer;
        const dx0 = (ptr.x as number) - BS_LX;
        const dy0 = (ptr.y as number) - BS_LY;
        if (dy0 >= -10) return;

        const len0 = Math.sqrt(dx0 * dx0 + dy0 * dy0);
        let vx = dx0 / len0, vy = dy0 / len0;
        let cx = BS_LX, cy = BS_LY;
        let bounces = 0;
        const dotHex = this.curHex;

        for (let i = 0; i < 400; i++) {
          cx += vx * 2; cy += vy * 2;

          if (cx < BS_LW) { cx = BS_LW + (BS_LW - cx); vx = Math.abs(vx); bounces++; }
          else if (cx > BS_RW) { cx = BS_RW - (cx - BS_RW); vx = -Math.abs(vx); bounces++; }
          if (bounces > 2) break;

          if (cy <= BS_OY + BS_BR) break;

          let hit = false;
          for (let r = 0; r < BS_ROWS && !hit; r++) {
            const maxC = ((r + this.rowsShifted) % 2 === 1) ? BS_COLS - 1 : BS_COLS;
            for (let c = 0; c < maxC && !hit; c++) {
              if (this.grid[r][c]) {
                const b = this.grid[r][c];
                const ddx = cx - b.spr.x, ddy = cy - b.spr.y;
                if (ddx * ddx + ddy * ddy < BS_BD * BS_BD) hit = true;
              }
            }
          }
          if (hit) break;

          if (i % 5 === 0) {
            this.laserGfx.fillStyle(dotHex, 0.45);
            this.laserGfx.fillCircle(cx, cy, 2.5);
          }
        }

        // landing circle with targeting crosshair
        const targetPulse = 1 + Math.sin(this.time.now / 100) * 0.08;
        const radius = BS_BR * targetPulse;
        this.laserGfx.lineStyle(1.2, dotHex, 0.65);
        this.laserGfx.strokeCircle(cx, cy, radius);
        this.laserGfx.lineStyle(0.8, dotHex, 0.3);
        this.laserGfx.strokeCircle(cx, cy, radius - 4);
        
        // Crosshair lines
        this.laserGfx.lineStyle(1, dotHex, 0.5);
        this.laserGfx.lineBetween(cx - radius - 2, cy, cx - radius + 3, cy);
        this.laserGfx.lineBetween(cx + radius - 3, cy, cx + radius + 2, cy);
        this.laserGfx.lineBetween(cx, cy - radius - 2, cx, cy - radius + 3);
        this.laserGfx.lineBetween(cx, cy + radius - 3, cx, cy + radius + 2);
      }
    };
  }
}
