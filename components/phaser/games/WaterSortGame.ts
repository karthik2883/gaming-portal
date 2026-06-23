/**
 * Water Sort Puzzle — Phaser.js Factory  (crisp rewrite)
 * Register key: 'water-sort'
 *
 * Rules:
 *  - Tap a tube to select it, tap another to pour the top colour.
 *  - Pour only if destination is empty OR top colours match.
 *  - Each tube holds 4 segments. Win when every tube is mono-colour or empty.
 */

// ─── Vivid colour palette (main + highlight + shadow) ────────────────────────
const COLORS = [
  { main: 0xff3b5c, hi: 0xff8fa3, sh: 0xcc1f3e }, // Crimson
  { main: 0x3b82f6, hi: 0x93c5fd, sh: 0x1d4ed8 }, // Royal Blue
  { main: 0x22c55e, hi: 0x86efac, sh: 0x15803d }, // Emerald
  { main: 0xfbbf24, hi: 0xfde68a, sh: 0xd97706 }, // Amber
  { main: 0xa855f7, hi: 0xd8b4fe, sh: 0x7e22ce }, // Violet
  { main: 0xf97316, hi: 0xfed7aa, sh: 0xc2410c }, // Orange
  { main: 0x06b6d4, hi: 0xa5f3fc, sh: 0x0e7490 }, // Cyan
  { main: 0xf43f5e, hi: 0xfda4af, sh: 0xbe123c }, // Rose
];

// ─── Levels ───────────────────────────────────────────────────────────────────
const LEVELS = [
  { label: 'Level 1 · Beginner', tubes: [
    [0,1,2,3],[3,0,1,2],[2,3,0,1],[1,2,3,0],[],[],
  ]},
  { label: 'Level 2 · Easy', tubes: [
    [0,1,2,3],[4,0,3,2],[1,4,0,3],[2,1,4,0],[3,2,1,4],[],[],
  ]},
  { label: 'Level 3 · Medium', tubes: [
    [0,1,2,5],[3,4,5,0],[1,2,3,4],[5,0,1,2],[4,5,0,3],[2,3,4,1],[],[],
  ]},
  { label: 'Level 4 · Hard', tubes: [
    [0,1,2,6],[3,4,5,0],[6,2,3,4],[5,6,0,1],[2,3,4,5],[1,0,6,2],[4,5,1,3],[],[],
  ]},
  { label: 'Level 5 · Expert', tubes: [
    [0,1,7,2],[3,4,5,6],[7,0,3,4],[5,6,7,0],[1,2,3,5],[6,7,1,2],[4,5,6,0],[2,3,4,1],[],[],
  ]},
];

const MAX_SEGS = 4;

export default class WaterSortFactory {
  static create(PhaserLib: any) {
    return class WaterSortScene extends PhaserLib.Scene {
      tubes!:          number[][];
      selectedIdx!:    number;
      tubeCtrs!:       any[];
      level!:          number;
      moves!:          number;
      movesText!:      any;
      levelText!:      any;
      undoStack!:      number[][][];
      isAnimating!:    boolean;

      // Dynamic layout
      TW!: number; TH!: number; SH!: number;

      // Shared text style helpers
      T_TITLE!: any;
      T_BADGE!: any;
      T_LABEL!: any;
      T_SMALL!: any;

      constructor() { super({ key: 'WaterSort' }); }

      init(data: any) {
        this.level = (data?.level ?? 0) % LEVELS.length;
        this.moves = 0;
      }

      // Crisp text style presets
      titleStyle()  { return {
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
        fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
        stroke: '#38bdf8', strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 2, color: '#0369a1', blur: 8, stroke: true, fill: true },
      }; }
      badgeStyle(color: string)  { return {
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
        fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
        stroke: color, strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 1, color: '#00000080', blur: 4, stroke: false, fill: true },
      }; }
      btnStyle(color: string) { return {
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
        fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
        stroke: color, strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 6, stroke: false, fill: true },
      }; }
      winTitleStyle() { return {
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
        fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
        stroke: '#fbbf24', strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 3, color: '#92400e', blur: 10, stroke: true, fill: true },
      }; }
      winSubStyle() { return {
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
        fontSize: '13px', fontStyle: 'bold', color: '#e0f2fe',
        shadow: { offsetX: 0, offsetY: 1, color: '#0c4a6e', blur: 4, stroke: false, fill: true },
      }; }
      winCountStyle() { return {
        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
        fontSize: '22px', fontStyle: 'bold', color: '#4ade80',
        stroke: '#14532d', strokeThickness: 2,
        shadow: { offsetX: 0, offsetY: 2, color: '#052e16', blur: 8, stroke: true, fill: true },
      }; }

      // ──────────────────────────────────────────────────────────────────────
      preload() {
        this.load.image('ws-bg', '/game-assets/watersort-bg.png');
        // Button images removed — we draw crisp pill buttons with graphics instead
      }

      // ──────────────────────────────────────────────────────────────────────
      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.selectedIdx  = -1;
        this.tubeCtrs     = [];
        this.undoStack    = [];
        this.isAnimating  = false;
        this.tubes        = LEVELS[this.level].tubes.map(t => [...t]);

        // ── Compute tube dimensions from canvas size ──────────────────────
        const n         = this.tubes.length;
        const cols      = n <= 5 ? n : Math.ceil(n / 2);
        const HUD_H     = 64;
        const BTN_H     = 52;
        const pad       = 14;
        const availW    = W - pad * 2;
        const availH    = H - HUD_H - BTN_H;
        this.TW         = Math.min(56, Math.floor(availW / cols) - 10);
        this.TH         = Math.min(200, Math.floor(availH / (n > 5 ? 2 : 1)) - 24);
        this.SH         = Math.floor(this.TH / MAX_SEGS) - 1;

        // ── Background: fill every pixel ──────────────────────────────────
        const bgFill = this.add.graphics();
        bgFill.fillGradientStyle(0x061220, 0x061220, 0x0b3a5c, 0x0b4a6e, 1);
        bgFill.fillRect(0, 0, W, H);

        if (this.textures.exists('ws-bg')) {
          const bgImg = this.add.image(W / 2, H / 2, 'ws-bg');
          bgImg.setScale(Math.max(W / bgImg.width, H / bgImg.height));
        }

        // Lighter vignette — let the background breathe
        const vig = this.add.graphics();
        vig.fillStyle(0x000000, 0.18);
        vig.fillRect(0, 0, W, H);

        // ── HUD bar — bright glassmorphism ────────────────────────────────
        const hud = this.add.graphics();
        hud.fillStyle(0x000000, 0.45);
        hud.fillRoundedRect(6, 6, W - 12, 54, 14);
        // No border — clean dark glass panel only

        // Title — larger, brighter
        this.add.text(W / 2, 33, '💧  WATER SORT', {
          fontFamily: '"Inter","Segoe UI",Arial,sans-serif',
          fontSize: '18px', fontStyle: 'bold', color: '#ffffff',
          stroke: '#06b6d4', strokeThickness: 3,
          shadow: { offsetX: 0, offsetY: 3, color: '#0369a1', blur: 10, stroke: true, fill: true },
        }).setOrigin(0.5);

        // ── Level badge — electric blue ───────────────────────────────────
        const mkBadge = (x: number, w: number, col: number, glowCol: number) => {
          const g = this.add.graphics();
          g.fillStyle(glowCol, 0.4);
          g.fillRoundedRect(x - 4, 15, w + 8, 32, 12);
          g.fillStyle(col, 1);
          g.fillRoundedRect(x, 19, w, 24, 8);
          g.fillStyle(0xffffff, 0.2);
          g.fillRoundedRect(x + 2, 19, w - 4, 11, { tl: 6, tr: 6, bl: 0, br: 0 });
        };
        mkBadge(12, 92, 0x0284c7, 0x38bdf8);
        this.levelText = this.add.text(58, 31,
          LEVELS[this.level].label.split('·')[0].trim(), {
          fontFamily: '"Inter","Segoe UI",Arial,sans-serif',
          fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
          stroke: '#7dd3fc', strokeThickness: 1.5,
          shadow: { offsetX: 0, offsetY: 1, color: '#000', blur: 4, fill: true, stroke: false },
        }).setOrigin(0.5);

        // ── Moves badge — vivid emerald ───────────────────────────────────
        mkBadge(W - 104, 92, 0x047857, 0x10b981);
        this.movesText = this.add.text(W - 58, 31, 'Moves: 0', {
          fontFamily: '"Inter","Segoe UI",Arial,sans-serif',
          fontSize: '12px', fontStyle: 'bold', color: '#ffffff',
          stroke: '#6ee7b7', strokeThickness: 1.5,
          shadow: { offsetX: 0, offsetY: 1, color: '#000', blur: 4, fill: true, stroke: false },
        }).setOrigin(0.5);

        // ── Vivid pill buttons — FIXED alignment ─────────────────────────
        const BTN_W  = Math.min(130, W * 0.28);
        const BTN_H2 = 46;
        const BTN_R  = BTN_H2 / 2;
        const btnY   = H - BTN_H2 / 2 - 14;
        // FIX: gap = full button width + spacing (was BTN_W*0.58 which caused overlap)
        const SPACING = 14;
        const leftX   = W / 2 - BTN_W / 2 - SPACING / 2;
        const rightX  = W / 2 + BTN_W / 2 + SPACING / 2;

        const mkBtn = (
          icon: string, label: string, x: number,
          glowCol: number, bodyCol: number, edgeCol: number,
          glowAlpha: number,
          cb: () => void
        ) => {
          const bx = x - BTN_W / 2, by = btnY - BTN_H2 / 2;

          // 1. Outer glow ring — NO shadow layer (removed per user request)
          const glow = this.add.graphics();
          glow.fillStyle(glowCol, glowAlpha);
          glow.fillRoundedRect(bx - 10, by - 7, BTN_W + 20, BTN_H2 + 14, BTN_R + 8);

          // 2. Emboss bottom edge (subtle depth, no harsh shadow)
          const edge = this.add.graphics();
          edge.fillStyle(edgeCol, 1);
          edge.fillRoundedRect(bx, by + 3, BTN_W, BTN_H2, BTN_R);

          // 3. Main body
          const body = this.add.graphics();
          body.fillStyle(bodyCol, 1);
          body.fillRoundedRect(bx, by, BTN_W, BTN_H2, BTN_R);

          // 4. Top shine strip
          const shine = this.add.graphics();
          shine.fillStyle(0xffffff, 0.30);
          shine.fillRoundedRect(bx + 4, by + 3, BTN_W - 8, BTN_H2 * 0.46,
            { tl: BTN_R, tr: BTN_R, bl: 0, br: 0 });

          // 5. Vivid border
          const border = this.add.graphics();
          border.lineStyle(2, glowCol, 0.85);
          border.strokeRoundedRect(bx, by, BTN_W, BTN_H2, BTN_R);

          // 6. Label — no shadow (cleaner look)
          const txt = this.add.text(x, btnY, `${icon}  ${label}`, {
            fontFamily: '"Inter","Segoe UI",Arial,sans-serif',
            fontSize: '15px', fontStyle: 'bold', color: '#ffffff',
            stroke: '#000000', strokeThickness: 1,
          }).setOrigin(0.5);

          // 7. Invisible hit zone
          const hit = this.add.rectangle(x, btnY, BTN_W, BTN_H2, 0, 0)
            .setInteractive({ useHandCursor: true });

          // Hover: looping glow PULSE (alpha breathes in-out) + border brightens
          // No position or scale change — nothing moves offscreen
          let pulseTween: any = null;
          hit.on('pointerover', () => {
            border.clear();
            border.lineStyle(2.5, glowCol, 1);
            border.strokeRoundedRect(bx, by, BTN_W, BTN_H2, BTN_R);
            shine.setAlpha(0.55);
            pulseTween = this.tweens.add({
              targets: glow,
              alpha: { from: glowAlpha, to: glowAlpha * 2.8 },
              duration: 550,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          });
          hit.on('pointerout', () => {
            if (pulseTween) { pulseTween.stop(); pulseTween = null; }
            glow.setAlpha(glowAlpha);
            shine.setAlpha(1);
            border.clear();
            border.lineStyle(2, glowCol, 0.85);
            border.strokeRoundedRect(bx, by, BTN_W, BTN_H2, BTN_R);
          });

          // Press: flash the body brightness then fire callback — NO y movement
          hit.on('pointerdown', () => {
            body.setAlpha(0.55);
            shine.setAlpha(0.05);
            this.time.delayedCall(130, () => {
              body.setAlpha(1);
              shine.setAlpha(1);
              cb();
            });
          });
        };

        // Restart = electric cyan, Undo = vibrant amber
        mkBtn('🔄', 'Restart', leftX,  0x06b6d4, 0x0891b2, 0x0e4d5e, 0.40,
          () => { if (!this.isAnimating) this.scene.restart({ level: this.level }); });
        mkBtn('↩', 'Undo',    rightX, 0xf59e0b, 0xd97706, 0x92400e, 0.38,
          () => this.undo());

        // ── Draw tubes ────────────────────────────────────────────────────
        this.drawAllTubes();
      }

      // ──────────────────────────────────────────────────────────────────────
      // Layout
      // ──────────────────────────────────────────────────────────────────────
      getTubePositions() {
        const W = this.scale.width;
        const H = this.scale.height;
        const n = this.tubes.length;
        const HUD_H = 64, BTN_H = 52, PAD = 14;

        let cols: number, rows: number;
        if (n <= 5)      { cols = n;              rows = 1; }
        else if (n <= 8) { cols = Math.ceil(n/2); rows = 2; }
        else             { cols = 5;              rows = Math.ceil(n/5); }

        const availW = W - PAD * 2;
        const availH = H - HUD_H - BTN_H;
        const colW   = availW / cols;
        const rowH   = availH / rows;

        return Array.from({ length: n }, (_, i) => ({
          x: PAD + colW * (i % cols) + colW / 2,
          y: HUD_H + rowH * Math.floor(i / cols) + rowH / 2,
        }));
      }

      // ──────────────────────────────────────────────────────────────────────
      // Tube rendering
      // ──────────────────────────────────────────────────────────────────────
      drawAllTubes() {
        this.tubeCtrs.forEach(c => c.destroy());
        this.tubeCtrs = [];

        const positions = this.getTubePositions();
        const TW = this.TW, TH = this.TH, SH = this.SH;

        this.tubes.forEach((tube, i) => {
          const { x, y } = positions[i];
          const isSel     = i === this.selectedIdx;
          const isSolved  = tube.length === MAX_SEGS && tube.every(c => c === tube[0]);

          const ctr = this.add.container(x, isSel ? y - 22 : y);
          this.tubeCtrs.push(ctr);

          // ── Outer glow when selected ──────────────────────────────────
          if (isSel) {
            const glow = this.add.graphics();
            glow.lineStyle(6, 0x38bdf8, 0.35);
            glow.strokeRoundedRect(-TW/2 - 5, -TH/2 - 5, TW + 10, TH + 10,
              { tl: 10, tr: 10, bl: 18, br: 18 });
            ctr.add(glow);
          }

          // ── Drop shadow ───────────────────────────────────────────────
          const shadow = this.add.graphics();
          shadow.fillStyle(0x000000, 0.45);
          shadow.fillRoundedRect(-TW/2 + 4, -TH/2 + 6, TW, TH,
            { tl: 8, tr: 8, bl: 16, br: 16 });
          ctr.add(shadow);

          // ── Tube body (frosted glass) ─────────────────────────────────
          const body = this.add.graphics();
          // Dark glass wall
          body.fillStyle(0x0f172a, 0.85);
          body.fillRoundedRect(-TW/2, -TH/2, TW, TH,
            { tl: 8, tr: 8, bl: 16, br: 16 });
          // Inner well (slightly lighter)
          body.fillStyle(0x1e293b, 0.6);
          body.fillRoundedRect(-TW/2 + 3, -TH/2 + 3, TW - 6, TH - 6,
            { tl: 6, tr: 6, bl: 14, br: 14 });
          ctr.add(body);

          // ── Water segments ────────────────────────────────────────────
          tube.forEach((ci, si) => {
            const col   = COLORS[ci % COLORS.length];
            const segY  = TH/2 - SH * (si + 1) - 1;
            const isBot = si === 0;
            const isTop = si === tube.length - 1;
            const br    = isBot
              ? { tl: 0, tr: 0, bl: 12, br: 12 }
              : { tl: 0, tr: 0, bl: 0, br: 0 };

            // Main water fill
            const seg = this.add.graphics();
            seg.fillStyle(col.main, 1);
            isBot
              ? seg.fillRoundedRect(-TW/2 + 4, segY, TW - 8, SH, br)
              : seg.fillRect(-TW/2 + 4, segY, TW - 8, SH);
            ctr.add(seg);

            // Wavy top edge highlight (top segment)
            if (isTop) {
              const wave = this.add.graphics();
              wave.fillStyle(col.hi, 0.55);
              wave.fillRoundedRect(-TW/2 + 4, segY, TW - 8, 6, { tl: 2, tr: 2, bl: 0, br: 0 });
              ctr.add(wave);
            }

            // Bottom shadow
            if (isBot) {
              const bot = this.add.graphics();
              bot.fillStyle(col.sh, 0.5);
              bot.fillRoundedRect(-TW/2 + 4, segY + SH - 7, TW - 8, 7,
                { tl: 0, tr: 0, bl: 12, br: 12 });
              ctr.add(bot);
            }

            // Left specular highlight (gives 3-D glass depth)
            const spec = this.add.graphics();
            spec.fillStyle(0xffffff, 0.18);
            spec.fillRoundedRect(-TW/2 + 5, segY + 2, TW / 4, SH - 4, 2);
            ctr.add(spec);
          });

          // ── Glass overlay (left edge shine + right edge shadow) ───────
          const glassLeft = this.add.graphics();
          glassLeft.fillStyle(0xffffff, 0.1);
          glassLeft.fillRoundedRect(-TW/2, -TH/2, 6, TH,
            { tl: 8, tr: 0, bl: 16, br: 0 });
          ctr.add(glassLeft);

          const glassRight = this.add.graphics();
          glassRight.fillStyle(0x000000, 0.15);
          glassRight.fillRoundedRect(TW/2 - 6, -TH/2, 6, TH,
            { tl: 0, tr: 8, bl: 0, br: 16 });
          ctr.add(glassRight);

          // ── Tube border — subtle neutral only, no selection highlight ──
          const border = this.add.graphics();
          const bColor = isSolved ? 0x4ade80 : 0x334155;
          border.lineStyle(1.5, bColor, 0.7);
          border.strokeRoundedRect(-TW/2, -TH/2, TW, TH,
            { tl: 8, tr: 8, bl: 16, br: 16 });
          ctr.add(border);


          // ── Solved tick ───────────────────────────────────────────────
          if (isSolved) {
            const tick = this.add.text(0, TH/2 + 8, '✓', {
              fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
              fontSize: '18px', fontStyle: 'bold', color: '#4ade80',
              stroke: '#14532d', strokeThickness: 2,
              shadow: { offsetX: 0, offsetY: 2, color: '#052e16', blur: 6, stroke: true, fill: true },
            }).setOrigin(0.5, 0);
            ctr.add(tick);
          }

          // ── Hit zone ──────────────────────────────────────────────────
          const hit = this.add.rectangle(0, 0, TW + 20, TH + 30, 0, 0)
            .setInteractive({ useHandCursor: true });
          ctr.add(hit);

          hit.on('pointerover', () => {
            if (!this.isAnimating && i !== this.selectedIdx && !isSolved) {
              border.clear();
              border.lineStyle(2, 0x7dd3fc, 1);
              border.strokeRoundedRect(-TW/2, -TH/2, TW, TH,
                { tl: 8, tr: 8, bl: 16, br: 16 });
            }
          });
          hit.on('pointerout', () => {
            if (i !== this.selectedIdx) {
              border.clear();
              border.lineStyle(1.5, bColor, 0.7);
              border.strokeRoundedRect(-TW/2, -TH/2, TW, TH,
                { tl: 8, tr: 8, bl: 16, br: 16 });
            }
          });
          hit.on('pointerdown', () => this.onTap(i));
        });
      }

      // ──────────────────────────────────────────────────────────────────────
      // Game logic
      // ──────────────────────────────────────────────────────────────────────
      onTap(idx: number) {
        if (this.isAnimating) return;

        if (this.selectedIdx === -1) {
          if (this.tubes[idx].length === 0) return;
          this.selectedIdx = idx;
          this.drawAllTubes();
          return;
        }
        if (this.selectedIdx === idx) {
          this.selectedIdx = -1;
          this.drawAllTubes();
          return;
        }
        this.tryPour(this.selectedIdx, idx);
      }

      canPour(from: number, to: number): boolean {
        const src = this.tubes[from], dst = this.tubes[to];
        if (!src.length) return false;
        if (dst.length >= MAX_SEGS) return false;
        return dst.length === 0 || src[src.length - 1] === dst[dst.length - 1];
      }

      tryPour(from: number, to: number) {
        if (!this.canPour(from, to)) {
          // Invalid: shake
          this.isAnimating = true;
          const c = this.tubeCtrs[from];
          this.tweens.add({
            targets: c, x: c.x + 10,
            duration: 45, yoyo: true, repeat: 3,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              this.isAnimating = false;
              this.selectedIdx = -1;
              this.drawAllTubes();
            },
          });
          return;
        }

        this.undoStack.push(this.tubes.map(t => [...t]));

        const topColor = this.tubes[from][this.tubes[from].length - 1];
        let count = 0;
        for (let i = this.tubes[from].length - 1; i >= 0; i--) {
          if (this.tubes[from][i] === topColor && this.tubes[to].length + count < MAX_SEGS) count++;
          else break;
        }

        this.isAnimating = true;
        const srcCtr = this.tubeCtrs[from];

        this.tweens.add({
          targets: srcCtr,
          y: srcCtr.y - 28,
          duration: 120, ease: 'Back.easeOut',
          onComplete: () => {
            this.time.delayedCall(70, () => {
              for (let i = 0; i < count; i++) this.tubes[to].push(this.tubes[from].pop()!);
              this.moves++;
              this.movesText.setText(`Moves: ${this.moves}`);
              this.selectedIdx  = -1;
              this.isAnimating  = false;
              this.drawAllTubes();
              if (this.checkWin()) this.time.delayedCall(300, () => this.showWin());
            });
          },
        });
      }

      undo() {
        if (this.isAnimating || !this.undoStack.length) return;
        this.tubes = this.undoStack.pop()!;
        this.selectedIdx = -1;
        this.moves = Math.max(0, this.moves - 1);
        this.movesText.setText(`Moves: ${this.moves}`);
        this.drawAllTubes();
      }

      checkWin(): boolean {
        return this.tubes.every(t =>
          t.length === 0 || (t.length === MAX_SEGS && t.every(c => c === t[0]))
        );
      }

      // ──────────────────────────────────────────────────────────────────────
      // Win overlay
      // ──────────────────────────────────────────────────────────────────────
      showWin() {
        const W = this.scale.width, H = this.scale.height;
        this.cameras.main.flash(600, 59, 190, 255, false);

        // Particle burst using small circles
        for (let p = 0; p < 28; p++) {
          const px = PhaserLib.Math.Between(W * 0.2, W * 0.8);
          const py = PhaserLib.Math.Between(H * 0.2, H * 0.6);
          const col = COLORS[p % COLORS.length].main;
          const dot = this.add.graphics();
          dot.fillStyle(col, 1);
          dot.fillCircle(px, py, PhaserLib.Math.Between(3, 8));
          this.tweens.add({
            targets: dot,
            y: py - PhaserLib.Math.Between(40, 120),
            alpha: 0, scale: 0.2,
            duration: PhaserLib.Math.Between(600, 1200),
            ease: 'Power2',
            delay: PhaserLib.Math.Between(0, 400),
          });
        }

        // Dim overlay
        this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6);

        // Card
        const CW = Math.min(300, W - 40), CH = 200;
        const cx = W/2 - CW/2, cy = H/2 - CH/2;
        const card = this.add.graphics();
        card.fillStyle(0x0f172a, 1);
        card.fillRoundedRect(cx, cy, CW, CH, 20);
        card.lineStyle(2, 0x38bdf8, 1);
        card.strokeRoundedRect(cx, cy, CW, CH, 20);
        // Accent bar
        card.fillStyle(0x0ea5e9, 1);
        card.fillRoundedRect(cx, cy, CW, 6, { tl: 20, tr: 20, bl: 0, br: 0 });

        this.add.text(W/2, cy + 38, '🎉  Solved!', this.winTitleStyle()).setOrigin(0.5);

        this.add.text(W/2, cy + 76, LEVELS[this.level].label, this.winSubStyle()).setOrigin(0.5);

        this.add.text(W/2, cy + 100, `${this.moves} move${this.moves !== 1 ? 's' : ''}`, this.winCountStyle()).setOrigin(0.5);

        const hasNext = this.level + 1 < LEVELS.length;

        if (hasNext) {
          const nbBg = this.add.graphics();
          nbBg.fillStyle(0x0ea5e9, 1);
          nbBg.fillRoundedRect(W/2 - 70, cy + 122, 140, 36, 10);
          const nb = this.add.text(W/2, cy + 140, '▶  Next Level', {
            fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
            fontSize: '15px', fontStyle: 'bold', color: '#ffffff',
            stroke: '#0369a1', strokeThickness: 2,
            shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 6, stroke: false, fill: true },
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });
          nb.on('pointerdown', () => this.scene.restart({ level: this.level + 1 }));
          nb.on('pointerover', () => { nbBg.setAlpha(0.8); });
          nb.on('pointerout',  () => { nbBg.setAlpha(1); });
        } else {
          this.add.text(W/2, cy + 140, '🏆  All Levels Complete!', {
            fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
            fontSize: '15px', fontStyle: 'bold', color: '#fbbf24',
            stroke: '#78350f', strokeThickness: 2,
            shadow: { offsetX: 0, offsetY: 2, color: '#451a03', blur: 8, stroke: true, fill: true },
          }).setOrigin(0.5);
        }

        const rb = this.add.text(W/2, cy + CH - 12, '🔄  Play Again', {
          fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
          fontSize: '12px', fontStyle: 'bold', color: '#94a3b8',
          shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 3, stroke: false, fill: true },
        }).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
        rb.on('pointerdown', () => this.scene.restart({ level: 0 }));
        rb.on('pointerover', () => rb.setStyle({ color: '#e2e8f0' }));
        rb.on('pointerout',  () => rb.setStyle({ color: '#94a3b8' }));

        // Dispatch game over event for the leaderboard system
        const score = Math.max(10, (this.level + 1) * 1000 - this.moves * 10);
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'water-sort', score }
        }));
      }
    };
  }
}
