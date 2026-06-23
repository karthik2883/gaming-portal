/**
 * Unblock Me Clone — Phaser.js Factory
 * Register key: 'unblock-me'
 *
 * Goal  : Slide the RED block right to the exit arrow.
 * Rules : Horizontal blocks slide left/right; vertical blocks slide up/down.
 * Input : Click/tap a block to select it, then drag it — or tap an empty cell
 *         in the valid direction to snap-slide it as far as it can go.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID  = 6;
const EXIT_ROW = 2;

// ─── Level definitions ────────────────────────────────────────────────────────
// Each block: { r, c, len, dir:'H'|'V', isTarget? }
// Target block is always H at r=2 and exits through the right wall.
// Solutions are noted in comments (each step = one "move").
const LEVELS = [
  // ── Level 1 – 2 moves ──────────────────────────────────────────────────────
  // Slide V1 up 2, red right → exit
  { label:'Level 1', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:2, c:3, len:2, dir:'V' },  // up 2 → r:0-1
  ]},

  // ── Level 2 – 3 moves ──────────────────────────────────────────────────────
  // V1 up 1, V2 down 2, red right
  { label:'Level 2', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:1, c:2, len:2, dir:'V' },  // up 1 → r:0-1
    { r:2, c:4, len:2, dir:'V' },  // down 2 → r:4-5
  ]},

  // ── Level 3 – 4 moves ──────────────────────────────────────────────────────
  // V1 up 1, V2 down 2, V3 down 2, red right
  { label:'Level 3', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:1, c:2, len:2, dir:'V' },  // up 1 → r:0-1
    { r:2, c:4, len:2, dir:'V' },  // down 2 → r:4-5
    { r:2, c:5, len:2, dir:'V' },  // up 2 → r:0-1
  ]},

  // ── Level 4 – 4 moves ──────────────────────────────────────────────────────
  // H1 left 2 (frees path below V1), V1 down 3, V2 down 2, red right
  { label:'Level 4', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:0, c:2, len:3, dir:'V' },  // blocked below by H1; slides down 3 after H1 moves
    { r:3, c:2, len:2, dir:'H' },  // H1: left 2 → c:0-1 (frees r:3,c:2)
    { r:2, c:4, len:2, dir:'V' },  // down 2 → r:4-5
  ]},

  // ── Level 5 – 5 moves ──────────────────────────────────────────────────────
  // H1 left 2, V1 down 3, V2 down 2, V3 down 2, red right
  { label:'Level 5', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:0, c:2, len:3, dir:'V' },  // blocked below; down 3 after H1 moves
    { r:3, c:2, len:2, dir:'H' },  // H1: left 2
    { r:2, c:4, len:2, dir:'V' },  // down 2
    { r:2, c:5, len:2, dir:'V' },  // down 2 → r:4-5
  ]},

  // ── Level 6 – 5 moves ──────────────────────────────────────────────────────
  // H1 right 1 (frees r:3,c:3), V1 down 3, V2 up 1, V3 down 2, red right
  { label:'Level 6', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:0, c:3, len:3, dir:'V' },  // V1 blocked below by H1; down 3 after H1 right
    { r:3, c:3, len:2, dir:'H' },  // H1 at c:3-4; right 1 → c:4-5, frees r:3,c:3
    { r:1, c:2, len:2, dir:'V' },  // V2 up 1 → r:0-1
    { r:2, c:5, len:2, dir:'V' },  // V3 down 2 → r:4-5
  ]},

  // ── Level 7 – 6 moves ──────────────────────────────────────────────────────
  // V2 up 2, H1 right 1 (frees r:3,c:3), V1 down 3, V3 down 2, V4 down 2, red right
  { label:'Level 7', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:0, c:3, len:3, dir:'V' },  // V1 blocked; down 3 after H1 right
    { r:3, c:3, len:2, dir:'H' },  // H1 blocked by V2; H1 right 1 after V2 up
    { r:2, c:4, len:2, dir:'V' },  // V2 blocks H1 right; up 2 → r:0-1
    { r:1, c:2, len:2, dir:'V' },  // V3 up 1 → r:0-1
    { r:2, c:5, len:2, dir:'V' },  // V4 down 2 → r:4-5
  ]},

  // ── Level 8 – 7 moves (Expert) ─────────────────────────────────────────────
  // V2 up 2, H1 right 1, V1 down 3, V3 up 1, H2 right 2, V4 down 2, red right
  { label:'Level 8', blocks:[
    { r:2, c:0, len:2, dir:'H', isTarget:true },
    { r:0, c:3, len:3, dir:'V' },  // V1: down 3 after H1 moves
    { r:3, c:3, len:2, dir:'H' },  // H1: blocked by V2; right 1 after V2
    { r:2, c:4, len:2, dir:'V' },  // V2: up 2 → r:0-1 to free H1
    { r:1, c:2, len:2, dir:'V' },  // V3: up 1 → r:0-1
    { r:4, c:2, len:3, dir:'H' },  // H2: right 2 → c:3-5
    { r:2, c:5, len:2, dir:'V' },  // V4: down 2 → r:4-5 (H2 at r:4 at c:3+ after move)
  ]},
];

// ─── Block colours ────────────────────────────────────────────────────────────
const WOOD_LIGHT  = 0xd4a574;
const WOOD_MID    = 0xb8864e;
const WOOD_DARK   = 0x8b6239;
const TARGET_MID  = 0xe74c3c;
const TARGET_LHT  = 0xf1948a;
const TARGET_DRK  = 0xc0392b;

// ─────────────────────────────────────────────────────────────────────────────
export default class UnblockMeFactory {
  static create(PhaserLib: any) {

    return class UnblockMeScene extends PhaserLib.Scene {
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

      // ── Drag state ─────────────────────────────────────────────────────────
      dragging!:      boolean;
      dragIdx!:       number;
      dragStartPx!:   number; // pointer x or y at drag start
      dragStartCell!: number; // block.c or block.r at drag start
      maxDragPos!:    number;
      maxDragNeg!:    number;
      dragOffsetPx!:  number;

      constructor() { super({ key: 'UnblockMe' }); }

      init(data: any) {
        this.level = (data?.level ?? 0) % LEVELS.length;
        this.moves = 0;
        this.won   = false;
      }

      // ──────────────────────────────────────────────────────────────────────
      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.dragging  = false;
        this.dragIdx   = -1;
        this.blockCtrs = [];

        // Deep-clone level blocks
        this.blocks = LEVELS[this.level].blocks.map((b: any) => ({ ...b }));

        // Cell size: fill canvas leaving room for HUD + buttons
        const TOP = 80, BOT = 52;
        const avail = Math.min(W - 16, H - TOP - BOT);
        this.CELL = Math.floor(avail / GRID);
        const gridPx = this.CELL * GRID;
        this.gridX = Math.floor((W - gridPx) / 2);
        this.gridY = TOP;

        // ── Background ──────────────────────────────────────────────────────
        const bg = this.add.graphics();
        bg.fillStyle(0xfdf3e3, 1);
        bg.fillRect(0, 0, W, H);

        // ── Board ───────────────────────────────────────────────────────────
        this.boardGfx = this.add.graphics();
        this.redrawBoard();

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

        // ── HUD ─────────────────────────────────────────────────────────────
        this.add.text(W / 2, 14, '🔓 Unblock Me', {
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: '16px', fontStyle: 'bold', color: '#4a3520',
        }).setOrigin(0.5, 0);

        this.add.text(14, 16, LEVELS[this.level].label, {
          fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', color: '#7a5c3a',
        });

        this.movesText = this.add.text(W - 14, 16, 'Moves: 0', {
          fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px', color: '#7a5c3a',
        }).setOrigin(1, 0);

        // ── Bottom buttons ───────────────────────────────────────────────────
        const mkBtn = (label: string, x: number, color: string, cb: () => void) => {
          const btn = this.add.text(x, H - 12, label, {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '12px', color: '#fff',
            backgroundColor: color, padding: { x: 12, y: 6 },
          }).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
          btn.on('pointerdown', cb);
          btn.on('pointerover', () => btn.setAlpha(0.8));
          btn.on('pointerout',  () => btn.setAlpha(1));
          return btn;
        };

        mkBtn('🔄 Restart', W / 2 - 46, '#7a5c3a', () => {
          if (!this.dragging) this.scene.restart({ level: this.level });
        });
        mkBtn('⏭ Skip',    W / 2 + 46, '#aaa', () => {
          this.scene.restart({ level: (this.level + 1) % LEVELS.length });
        });

        // ── Input ────────────────────────────────────────────────────────────
        this.input.on('pointerdown', this.onDown, this);
        this.input.on('pointermove', this.onMove, this);
        this.input.on('pointerup',   this.onUp,   this);
      }

      // ──────────────────────────────────────────────────────────────────────
      // Board drawing
      // ──────────────────────────────────────────────────────────────────────
      redrawBoard() {
        const g  = this.boardGfx;
        const ox = this.gridX, oy = this.gridY;
        const C  = this.CELL;
        const px = C * GRID;
        g.clear();

        // Outer wood frame
        g.fillStyle(0xc19a6b, 1);
        g.fillRoundedRect(ox - 10, oy - 10, px + 20, px + 20, 10);

        // Board face
        g.fillStyle(0xf5deb3, 1);
        g.fillRect(ox, oy, px, px);

        // Cell lines
        g.lineStyle(1, 0xd4a76a, 0.35);
        for (let i = 0; i <= GRID; i++) {
          g.lineBetween(ox + i * C, oy, ox + i * C, oy + px);
          g.lineBetween(ox, oy + i * C, ox + px, oy + i * C);
        }

        // Board border
        g.lineStyle(2, 0xb8864e, 1);
        g.strokeRect(ox, oy, px, px);

        // Exit gap + arrow (right side, EXIT_ROW)
        const ey = oy + EXIT_ROW * C;
        g.fillStyle(0xfdf3e3, 1);
        g.fillRect(ox + px, ey + 2, 14, C - 4); // cover border

        g.fillStyle(0xe74c3c, 0.85);
        // Arrow triangle
        const ax = ox + px + 14;
        const ay = ey + C / 2;
        g.fillTriangle(ax - 2, ay - 9, ax - 2, ay + 9, ax + 10, ay);
      }

      // ──────────────────────────────────────────────────────────────────────
      // Block drawing (into a Graphics at 0,0 relative to container)
      // ──────────────────────────────────────────────────────────────────────
      drawBlockGfx(gfx: any, block: any, selectedAlpha: number) {
        gfx.clear();

        const C   = this.CELL;
        const M   = 4; // margin
        const bw  = block.dir === 'H' ? block.len * C : C;
        const bh  = block.dir === 'V' ? block.len * C : C;
        const mid = block.isTarget ? TARGET_MID : WOOD_MID;
        const lht = block.isTarget ? TARGET_LHT : WOOD_LIGHT;
        const drk = block.isTarget ? TARGET_DRK : WOOD_DARK;

        // Shadow
        gfx.fillStyle(0x000000, 0.18);
        gfx.fillRoundedRect(M + 2, M + 2, bw - M * 2, bh - M * 2, 7);

        // Body
        gfx.fillStyle(mid, 1);
        gfx.fillRoundedRect(M, M, bw - M * 2, bh - M * 2, 7);

        // Top-left highlight
        gfx.fillStyle(lht, 0.65);
        gfx.fillRoundedRect(M + 4, M + 4, (bw - M * 2) * 0.55, Math.min(14, (bh - M * 2) / 3), 4);

        // Bottom-right shadow strip
        gfx.fillStyle(drk, 0.45);
        gfx.fillRoundedRect(M + 4, bh - M - 10, bw - M * 2 - 8, 7, 3);

        // Wood grain (non-target only)
        if (!block.isTarget) {
          gfx.lineStyle(1, WOOD_DARK, 0.12);
          if (block.dir === 'H') {
            for (let x = M + 14; x < bw - M - 4; x += 18) {
              gfx.lineBetween(x, M + 6, x + 6, bh - M - 6);
            }
          } else {
            for (let y = M + 14; y < bh - M - 4; y += 18) {
              gfx.lineBetween(M + 6, y, bw - M - 6, y + 6);
            }
          }
        }

        // Border
        gfx.lineStyle(selectedAlpha > 0 ? 2.5 : 1.5, selectedAlpha > 0 ? 0xf1c40f : drk, 1);
        gfx.strokeRoundedRect(M, M, bw - M * 2, bh - M * 2, 7);

        // Selection ring
        if (selectedAlpha > 0) {
          gfx.lineStyle(1.5, 0xf1c40f, 0.5);
          gfx.strokeRoundedRect(M - 3, M - 3, bw - M * 2 + 6, bh - M * 2 + 6, 10);
        }
      }

      redrawBlockGraphic(i: number, selected = false) {
        const ctr = this.blockCtrs[i];
        const gfx = ctr.list[0] as any;
        this.drawBlockGfx(gfx, this.blocks[i], selected ? 1 : 0);
      }

      // ──────────────────────────────────────────────────────────────────────
      // Grid helpers
      // ──────────────────────────────────────────────────────────────────────
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
          // right — target may exit one step beyond col 5
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

      // ──────────────────────────────────────────────────────────────────────
      // Input
      // ──────────────────────────────────────────────────────────────────────
      onDown(ptr: any) {
        if (this.won) return;
        const col = Math.floor((ptr.x - this.gridX) / this.CELL);
        const row = Math.floor((ptr.y - this.gridY) / this.CELL);
        const hit = this.getBlockAt(row, col);

        if (hit !== -1) {
          // Start drag
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

        // Move container visually
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
          this.movesText.setText(`Moves: ${this.moves}`);
        }

        // Snap container to grid
        const ctr = this.blockCtrs[this.dragIdx];
        ctr.x = this.gridX + b.c * C;
        ctr.y = this.gridY + b.r * C;

        this.redrawBlockGraphic(this.dragIdx, false);

        const prevIdx      = this.dragIdx;
        this.dragging      = false;
        this.dragIdx       = -1;
        this.dragOffsetPx  = 0;

        // Win detection: target's right edge is at or beyond col GRID
        if (b.isTarget && b.c + b.len > GRID - 1) {
          this.won = true;
          this.animateExit(prevIdx);
        }
      }

      // ──────────────────────────────────────────────────────────────────────
      // Win sequence
      // ──────────────────────────────────────────────────────────────────────
      animateExit(idx: number) {
        const ctr = this.blockCtrs[idx];
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

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55);

        const box = this.add.graphics();
        box.fillStyle(0xfff8f0, 1);
        box.fillRoundedRect(W / 2 - 145, H / 2 - 92, 290, 184, 18);
        box.lineStyle(2.5, 0xd4a76a, 1);
        box.strokeRoundedRect(W / 2 - 145, H / 2 - 92, 290, 184, 18);

        this.add.text(W / 2, H / 2 - 62, '🎉 Unblocked!', {
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: '22px', fontStyle: 'bold', color: '#4a3520',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 28, `${LEVELS[this.level].label}  ·  ${this.moves} move${this.moves !== 1 ? 's' : ''}`, {
          fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', color: '#7a5c3a',
        }).setOrigin(0.5);

        const hasNext = this.level + 1 < LEVELS.length;

        if (hasNext) {
          const nb = this.add.text(W / 2, H / 2 + 14, '▶  Next Level', {
            fontFamily: 'Inter, Arial, sans-serif', fontSize: '14px', fontStyle: 'bold',
            color: '#fff', backgroundColor: '#b8864e', padding: { x: 20, y: 10 },
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });
          nb.on('pointerover', () => nb.setAlpha(0.85));
          nb.on('pointerout',  () => nb.setAlpha(1));
          nb.on('pointerdown', () => this.scene.restart({ level: this.level + 1 }));
        } else {
          this.add.text(W / 2, H / 2 + 14, '🏆 All Levels Complete!', {
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '14px', fontStyle: 'bold', color: '#e74c3c',
          }).setOrigin(0.5);
        }

        const rb = this.add.text(W / 2, H / 2 + (hasNext ? 62 : 52), '🔄 Play Again', {
          fontFamily: 'Inter, Arial, sans-serif', fontSize: '12px',
          color: '#7a5c3a', backgroundColor: '#f5deb3', padding: { x: 14, y: 7 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        rb.on('pointerdown', () => this.scene.restart({ level: 0 }));

        // Dispatch game over event for the leaderboard system
        const score = Math.max(10, (this.level + 1) * 1000 - this.moves * 10);
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'unblock-me', score }
        }));
      }
    };
  }
}
