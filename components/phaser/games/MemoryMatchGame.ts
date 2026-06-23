// MemoryMatchGame.ts — Factory pattern for dynamic Phaser.js loading

export default class MemoryMatchGameFactory {
  static create(PhaserLib: any) {

    // ── Symbols: emoji label + neon colour ─────────────────────────────────
    const SYMBOLS = [
      { label: '★',  color: 0x00d4ff, glow: '#00d4ff' }, // cyan  star
      { label: '◆',  color: 0xff00aa, glow: '#ff00aa' }, // pink  diamond
      { label: '⚡', color: 0xffd700, glow: '#ffd700' }, // gold  lightning
      { label: '☽',  color: 0xcc88ff, glow: '#cc88ff' }, // violet moon
      { label: '♥',  color: 0xff4444, glow: '#ff4444' }, // red   heart
      { label: '◎',  color: 0x39ff14, glow: '#39ff14' }, // green spiral
      { label: '▲',  color: 0xff8800, glow: '#ff8800' }, // orange tri
      { label: '✦',  color: 0x00ffff, glow: '#00ffff' }, // aqua  spark
    ];

    // Difficulty presets
    const DIFFICULTIES: Record<string, { cols: number; rows: number; label: string }> = {
      easy:   { cols: 4, rows: 3, label: 'EASY'   }, // 6 pairs
      medium: { cols: 4, rows: 4, label: 'MEDIUM'  }, // 8 pairs
      hard:   { cols: 5, rows: 4, label: 'HARD'    }, // 10 pairs
    };

    // ── Audio helper ────────────────────────────────────────────────────────
    function playTone(
      ctx: AudioContext,
      freq: number,
      type: OscillatorType,
      gain: number,
      startTime: number,
      duration: number
    ) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(gain, startTime);
      vol.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    // ──────────────────────────────────────────────────────────────────────
    //  MenuScene  — difficulty selector
    // ──────────────────────────────────────────────────────────────────────
    class MenuScene extends PhaserLib.Scene {
      constructor() { super({ key: 'MemoryMenu' }); }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Background gradient rect
        this.add.rectangle(W / 2, H / 2, W, H, 0x080820);

        // Grid dot matrix background (optimized with TileSprite)
        const generateTexture = (key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const canvasTexture = this.textures.createCanvas(key, width, height);
          drawFn(canvasTexture.context);
          canvasTexture.refresh();
        };

        generateTexture('bg-dot-menu', 24, 24, (ctx) => {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
          ctx.beginPath();
          ctx.arc(12, 12, 1, 0, Math.PI * 2);
          ctx.fill();
        });

        this.add.tileSprite(W / 2, H / 2, W, H, 'bg-dot-menu');

        // Title
        this.add.text(W / 2, 70, 'MEMORY', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '36px',
          color: '#00d4ff', fontStyle: 'bold',
          stroke: '#003355', strokeThickness: 6,
        }).setOrigin(0.5);
        this.add.text(W / 2, 108, 'MATCH NEO', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '24px',
          color: '#ff00aa', fontStyle: 'bold',
          stroke: '#330022', strokeThickness: 4,
        }).setOrigin(0.5);

        this.add.text(W / 2, 155, 'SELECT DIFFICULTY', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px',
          color: '#6688aa', letterSpacing: 3,
        }).setOrigin(0.5);

        // Difficulty buttons
        const diffs = ['easy', 'medium', 'hard'];
        const btnColors: Record<string, number> = { easy: 0x39ff14, medium: 0x00d4ff, hard: 0xff00aa };
        const btnY = [210, 290, 370];

        diffs.forEach((d, i) => {
          const cfg = DIFFICULTIES[d];
          const col = btnColors[d];
          const bg = this.add.graphics();
          bg.fillStyle(col, 0.1);
          bg.lineStyle(2, col, 0.8);
          bg.fillRoundedRect(W / 2 - 120, btnY[i] - 30, 240, 58, 10);
          bg.strokeRoundedRect(W / 2 - 120, btnY[i] - 30, 240, 58, 10);

          const zone = this.add.zone(W / 2, btnY[i], 240, 58).setInteractive({ cursor: 'pointer' });
          this.add.text(W / 2, btnY[i] - 8, cfg.label, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '18px',
            color: `#${col.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
          }).setOrigin(0.5);
          this.add.text(W / 2, btnY[i] + 14, `${cfg.cols}×${cfg.rows} grid  •  ${(cfg.cols * cfg.rows) / 2} pairs`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#778899',
          }).setOrigin(0.5);

          zone.on('pointerover', () => { bg.setAlpha(1.4); })
            .on('pointerout',  () => { bg.setAlpha(1); })
            .on('pointerdown', () => {
              this.scene.start('MemoryMatch', { difficulty: d });
            });
        });

        // Instructions
        this.add.text(W / 2, H - 40, 'Flip cards and find matching pairs before time runs out!', {
          fontFamily: 'monospace', fontSize: '11px', color: '#445566',
        }).setOrigin(0.5);
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    //  GameScene  — main memory match game
    // ──────────────────────────────────────────────────────────────────────
    class GameScene extends PhaserLib.Scene {
      // Card data
      cards: any[] = [];
      flipped: any[] = [];
      matched: Set<number> = new Set();
      canFlip = false;
      totalPairs = 0;
      matchedPairs = 0;

      // HUD
      movesText: any;
      timerText: any;
      comboText: any;
      levelText: any;

      // State
      moves = 0;
      combo = 0;
      score = 0;
      timeLeft = 0;
      baseTime = 0;
      timerEvent: any;
      difficulty = 'medium';
      audioCtx: AudioContext | null = null;

      // Particles container
      particleGraphics: any;

      constructor() { super({ key: 'MemoryMatch' }); }

      init(data: any) {
        this.difficulty = data.difficulty || 'medium';
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cfg = DIFFICULTIES[this.difficulty];
        this.totalPairs = (cfg.cols * cfg.rows) / 2;
        this.matchedPairs = 0;
        this.moves = 0;
        this.combo = 0;
        this.score = 0;
        this.cards = [];
        this.flipped = [];
        this.matched = new Set();

        // Set time based on difficulty
        const timeMap: Record<string, number> = { easy: 90, medium: 120, hard: 150 };
        this.baseTime = timeMap[this.difficulty];
        this.timeLeft = this.baseTime;

        // Audio
        try { this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}

        // Background
        this.add.rectangle(W / 2, H / 2, W, H, 0x070718);

        // Optimized texture generation helpers
        const generateTexture = (key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const canvasTexture = this.textures.createCanvas(key, width, height);
          drawFn(canvasTexture.context);
          canvasTexture.refresh();
        };

        const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
        };

        // Dot grid BG (optimized with TileSprite)
        generateTexture('bg-dot-game', 20, 20, (ctx) => {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.05)';
          ctx.beginPath();
          ctx.arc(10, 10, 1, 0, Math.PI * 2);
          ctx.fill();
        });

        this.add.tileSprite(W / 2, H / 2, W, H, 'bg-dot-game');

        // Pre-generate Card Textures
        const HUD = 58;
        const PAD = 16;
        const GAP = 10;
        const areaW = W - PAD * 2;
        const areaH = H - HUD - PAD * 2;
        const cardW = Math.floor((areaW - GAP * (cfg.cols - 1)) / cfg.cols);
        const cardH = Math.floor((areaH - GAP * (cfg.rows - 1)) / cfg.rows);

        // Card Back Texture
        generateTexture('card-back', cardW + 10, cardH + 10, (ctx) => {
          const rx = 5;
          const ry = 5;
          const rw = cardW;
          const rh = cardH;

          // Shadow
          drawRoundRect(ctx, rx + 3, ry + 3, rw, rh, 8);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();

          // Body
          drawRoundRect(ctx, rx, ry, rw, rh, 8);
          ctx.fillStyle = '#111133';
          ctx.fill();

          // Border
          ctx.strokeStyle = '#223355';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Inner grid pattern
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.08)';
          ctx.lineWidth = 1;
          for (let x = rx + 8; x < rx + rw - 8; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, ry + 8);
            ctx.lineTo(x, ry + rh - 8);
            ctx.stroke();
          }
          for (let y = ry + 8; y < ry + rh - 8; y += 12) {
            ctx.beginPath();
            ctx.moveTo(rx + 8, y);
            ctx.lineTo(rx + rw - 8, y);
            ctx.stroke();
          }

          // Center orb
          const cx = rx + rw / 2;
          const cy = ry + rh / 2;
          const orbR = Math.min(rw, rh) * 0.18;
          ctx.beginPath();
          ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 212, 255, 0.12)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
          ctx.stroke();
        });

        // Card Front Base Texture (will be tinted to color)
        generateTexture('card-front', cardW + 10, cardH + 10, (ctx) => {
          const rx = 5;
          const ry = 5;
          const rw = cardW;
          const rh = cardH;

          // Shadow
          drawRoundRect(ctx, rx + 3, ry + 3, rw, rh, 8);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();

          // Body
          drawRoundRect(ctx, rx, ry, rw, rh, 8);
          ctx.fillStyle = '#0d0d2e';
          ctx.fill();

          // Outer glow (thick, faint white)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 8;
          drawRoundRect(ctx, rx, ry, rw, rh, 8);
          ctx.stroke();

          // White border (will be tinted)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          drawRoundRect(ctx, rx, ry, rw, rh, 8);
          ctx.stroke();

          // Corner accents (will be tinted)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          const s = 8;
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(rx + 2, ry + 2);
          ctx.lineTo(rx + s + 2, ry + 2);
          ctx.moveTo(rx + 2, ry + 2);
          ctx.lineTo(rx + 2, ry + s + 2);
          ctx.stroke();
          // Top-Right
          ctx.beginPath();
          ctx.moveTo(rx + rw - 2, ry + 2);
          ctx.lineTo(rx + rw - s - 2, ry + 2);
          ctx.moveTo(rx + rw - 2, ry + 2);
          ctx.lineTo(rx + rw - 2, ry + s + 2);
          ctx.stroke();
          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(rx + 2, ry + rh - 2);
          ctx.lineTo(rx + s + 2, ry + rh - 2);
          ctx.moveTo(rx + 2, ry + rh - 2);
          ctx.lineTo(rx + 2, ry + rh - s - 2);
          ctx.stroke();
          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(rx + rw - 2, ry + rh - 2);
          ctx.lineTo(rx + rw - s - 2, ry + rh - 2);
          ctx.moveTo(rx + rw - 2, ry + rh - 2);
          ctx.lineTo(rx + rw - 2, ry + rh - s - 2);
          ctx.stroke();
        });

        // HUD bar
        const hudH = 52;
        this.add.rectangle(W / 2, hudH / 2, W, hudH, 0x0a0a25, 0.95);
        this.add.graphics().lineStyle(1, 0x00d4ff, 0.3)
          .lineBetween(0, hudH, W, hudH);

        // HUD texts
        this.add.text(16, 10, 'MEMORY MATCH NEO', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px',
          color: '#00d4ff', fontStyle: 'bold', alpha: 0.7,
        });
        this.movesText = this.add.text(W / 2, 26, 'MOVES: 0', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: '#f0f0ff',
        }).setOrigin(0.5);
        this.timerText = this.add.text(W - 16, 10, `⏱ ${this.timeLeft}s`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: '#ffd700',
        }).setOrigin(1, 0);
        this.comboText = this.add.text(W / 2, 42, '', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#ff00aa',
        }).setOrigin(0.5).setAlpha(0);

        this.levelText = this.add.text(16, 32, `${cfg.label}  •  ${this.totalPairs} PAIRS`, {
          fontFamily: 'monospace', fontSize: '10px', color: '#445566',
        });

        // Particle graphics (drawn each frame)
        this.particleGraphics = this.add.graphics();

        // Build and shuffle cards
        this.buildGrid(W, H, cfg.cols, cfg.rows);

        // Countdown timer
        this.timerEvent = this.time.addEvent({
          delay: 1000,
          callback: this.onTick,
          callbackScope: this,
          loop: true,
        });

        // Start: briefly show all cards then flip them down
        this.time.delayedCall(800, () => {
          this.cards.forEach(c => this.flipCardDown(c));
          this.time.delayedCall(600, () => { this.canFlip = true; });
        });
      }

      // ── Build grid ──────────────────────────────────────────────────────
      buildGrid(W: number, H: number, cols: number, rows: number) {
        const HUD = 58;
        const PAD = 16;
        const GAP = 10;
        const areaW = W - PAD * 2;
        const areaH = H - HUD - PAD * 2;
        const cardW = Math.floor((areaW - GAP * (cols - 1)) / cols);
        const cardH = Math.floor((areaH - GAP * (rows - 1)) / rows);

        // Build pairs
        const symCount = Math.min(this.totalPairs, SYMBOLS.length);
        let symbolIds: number[] = [];
        for (let i = 0; i < this.totalPairs; i++) symbolIds.push(i % symCount);
        symbolIds = [...symbolIds, ...symbolIds]; // pairs
        // Shuffle
        for (let i = symbolIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [symbolIds[i], symbolIds[j]] = [symbolIds[j], symbolIds[i]];
        }

        let idx = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cx = PAD + col * (cardW + GAP) + cardW / 2;
            const cy = HUD + PAD + row * (cardH + GAP) + cardH / 2;
            const symId = symbolIds[idx++];
            const card = this.createCard(cx, cy, cardW, cardH, symId, idx - 1);
            this.cards.push(card);
          }
        }
      }

      createCard(cx: number, cy: number, w: number, h: number, symId: number, cardIdx: number) {
        const sym = SYMBOLS[symId % SYMBOLS.length];

        // Container
        const container = this.add.container(cx, cy);
        container.setSize(w, h);
        container.setInteractive({ cursor: 'pointer' });

        // Back sprite
        const backSprite = this.add.sprite(0, 0, 'card-back');

        // Front sprite
        const frontSprite = this.add.sprite(0, 0, 'card-front');
        frontSprite.setVisible(false);
        frontSprite.setTint(sym.color);

        // Symbol text
        const symText = this.add.text(0, 0, sym.label, {
          fontFamily: 'Arial, sans-serif', fontSize: `${Math.min(w, h) * 0.45}px`,
          color: sym.glow, fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5).setVisible(false);

        container.add([backSprite, frontSprite, symText]);

        // State
        const card = {
          container, backSprite, frontSprite, symText,
          symId, cardIdx,
          isFaceUp: true, isMatched: false,
          w, h, cx, cy, sym,
          particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: number }[],
        };

        container.on('pointerdown', () => this.onCardClick(card));
        container.on('pointerover', () => { if (!card.isFaceUp && !card.isMatched) container.setScale(1.05); });
        container.on('pointerout',  () => { container.setScale(1); });

        return card;
      }

      // ── Flip animations ────────────────────────────────────────────────
      flipCardUp(card: any) {
        card.isFaceUp = true;
        this.tweens.add({
          targets: card.container,
          scaleX: 0,
          duration: 100,
          onComplete: () => {
            card.backSprite.setVisible(false);
            card.frontSprite.setVisible(true);
            card.symText.setVisible(true);
            this.tweens.add({ targets: card.container, scaleX: 1, duration: 100 });
          },
        });
        this.playFlipSound();
      }

      flipCardDown(card: any) {
        if (card.isMatched) return;
        card.isFaceUp = false;
        this.tweens.add({
          targets: card.container,
          scaleX: 0,
          duration: 100,
          onComplete: () => {
            card.backSprite.setVisible(true);
            card.frontSprite.setVisible(false);
            card.symText.setVisible(false);
            this.tweens.add({ targets: card.container, scaleX: 1, duration: 100 });
          },
        });
      }

      // ── Card click ─────────────────────────────────────────────────────
      onCardClick(card: any) {
        if (!this.canFlip) return;
        if (card.isFaceUp || card.isMatched) return;
        if (this.flipped.length >= 2) return;

        this.flipCardUp(card);
        this.flipped.push(card);

        if (this.flipped.length === 2) {
          this.canFlip = false;
          this.moves++;
          this.movesText.setText(`MOVES: ${this.moves}`);
          this.time.delayedCall(400, this.checkMatch, [], this);
        }
      }

      checkMatch() {
        const [a, b] = this.flipped;

        if (a.symId === b.symId) {
          // ✅ MATCH
          this.combo++;
          this.matchedPairs++;
          a.isMatched = true;
          b.isMatched = true;

          // Combo bonus
          const comboBonus = this.combo > 1 ? this.combo * 50 : 0;
          const basePoints = 100 + Math.max(0, this.timeLeft * 2);
          this.score += basePoints + comboBonus;

          // Flash matched cards green
          [a, b].forEach(card => {
            this.tweens.add({
              targets: card.container, scaleX: 1.12, scaleY: 1.12,
              duration: 120, yoyo: true,
            });
            // Tint to gold for matched
            card.frontSprite.setTint(0xffd700);
            card.container.setAlpha(0.7);
          });

          // Burst particles
          this.spawnParticles(a.cx, a.cy, a.sym.color, 12);
          this.spawnParticles(b.cx, b.cy, b.sym.color, 12);

          // Show combo text
          if (this.combo > 1) {
            this.comboText.setText(`🔥 COMBO x${this.combo}!  +${comboBonus}`);
            this.comboText.setAlpha(1);
            this.tweens.add({ targets: this.comboText, alpha: 0, delay: 1200, duration: 400 });
            // Time bonus on combo
            this.timeLeft = Math.min(this.baseTime, this.timeLeft + 5);
            this.showFloatingText(`+5s`, b.cx, b.cy - 30, '#00ff88');
          }

          this.playMatchSound(this.combo);

          this.flipped = [];
          this.canFlip = true;

          if (this.matchedPairs === this.totalPairs) {
            this.time.delayedCall(400, this.onWin, [], this);
          }
        } else {
          // ❌ MISMATCH
          this.combo = 0;
          this.comboText.setAlpha(0);

          // Shake mismatch
          [a, b].forEach(card => {
            this.tweens.add({
              targets: card.container,
              x: card.container.x + 6,
              duration: 50,
              yoyo: true,
              repeat: 3,
              onComplete: () => {
                card.container.x = card.cx;
                this.flipCardDown(card);
              },
            });
          });

          this.playMismatchSound();
          this.time.delayedCall(700, () => {
            this.flipped = [];
            this.canFlip = true;
          });
        }
      }

      // ── Timer ──────────────────────────────────────────────────────────
      onTick() {
        this.timeLeft--;
        const col = this.timeLeft <= 10 ? '#ff4444' : this.timeLeft <= 30 ? '#ffaa00' : '#ffd700';
        this.timerText.setText(`⏱ ${this.timeLeft}s`).setColor(col);
        if (this.timeLeft <= 0) this.onTimeUp();
      }

      // ── Win / Lose ─────────────────────────────────────────────────────
      onWin() {
        this.timerEvent?.remove();
        this.canFlip = false;
        this.playWinSound();

        // Burst all cards with particles
        this.cards.forEach((c, i) => {
          this.time.delayedCall(i * 40, () => {
            this.spawnParticles(c.cx, c.cy, c.sym.color, 8);
          });
        });

        // Time bonus
        const timeBonus = this.timeLeft * 10;
        this.score += timeBonus;

        this.showEndScreen(true);
      }

      onTimeUp() {
        this.timerEvent?.remove();
        this.canFlip = false;
        this.playLoseSound();
        // Flip all remaining cards down
        this.cards.forEach(c => { if (!c.isMatched) this.flipCardDown(c); });
        this.showEndScreen(false);
      }

      showEndScreen(won: boolean) {
        const W = this.scale.width;
        const H = this.scale.height;
        const accentColor = won ? '#00d4ff' : '#ff4444';
        const borderColor = won ? 0x00d4ff : 0xff4444;

        const panel = this.add.graphics();
        panel.fillStyle(0x060618, 0.96);
        panel.fillRoundedRect(W / 2 - 160, H / 2 - 110, 320, 220, 14);
        panel.lineStyle(2, borderColor, 1);
        panel.strokeRoundedRect(W / 2 - 160, H / 2 - 110, 320, 220, 14);
        // Outer glow
        panel.lineStyle(8, borderColor, 0.15);
        panel.strokeRoundedRect(W / 2 - 160, H / 2 - 110, 320, 220, 14);

        this.add.text(W / 2, H / 2 - 75, won ? '✦ VICTORY ✦' : '✗ TIME UP ✗', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '22px',
          color: accentColor, fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 35, `SCORE: ${this.score.toLocaleString()}`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 5, `MOVES: ${this.moves}   PAIRS: ${this.matchedPairs}/${this.totalPairs}`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#778899',
        }).setOrigin(0.5);

        // Difficulty badge
        const cfg = DIFFICULTIES[this.difficulty];
        this.add.text(W / 2, H / 2 + 22, cfg.label, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '12px',
          color: won ? '#39ff14' : '#556677', fontStyle: 'bold',
        }).setOrigin(0.5);

        // Play Again button
        const btn1 = this.add.graphics();
        btn1.fillStyle(0x00d4ff, 0.15);
        btn1.lineStyle(1.5, 0x00d4ff, 0.8);
        btn1.fillRoundedRect(W / 2 - 105, H / 2 + 48, 100, 40, 8);
        btn1.strokeRoundedRect(W / 2 - 105, H / 2 + 48, 100, 40, 8);
        const txt1 = this.add.text(W / 2 - 55, H / 2 + 68, '↺ RETRY', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '12px', color: '#00d4ff',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
        txt1.on('pointerdown', () => this.scene.restart({ difficulty: this.difficulty }));
        txt1.on('pointerover', () => btn1.setAlpha(1.6));
        txt1.on('pointerout',  () => btn1.setAlpha(1));

        // Menu button
        const btn2 = this.add.graphics();
        btn2.fillStyle(0xff00aa, 0.12);
        btn2.lineStyle(1.5, 0xff00aa, 0.8);
        btn2.fillRoundedRect(W / 2 + 5, H / 2 + 48, 100, 40, 8);
        btn2.strokeRoundedRect(W / 2 + 5, H / 2 + 48, 100, 40, 8);
        const txt2 = this.add.text(W / 2 + 55, H / 2 + 68, '⌂ MENU', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '12px', color: '#ff00aa',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
        txt2.on('pointerdown', () => this.scene.start('MemoryMenu'));
        txt2.on('pointerover', () => btn2.setAlpha(1.6));
        txt2.on('pointerout',  () => btn2.setAlpha(1));

        // Dispatch score to leaderboard
        if (this.score > 0) {
          window.dispatchEvent(new CustomEvent('phaser-game-over', {
            detail: { gameKey: 'memory-match', score: this.score },
          }));
        }
      }

      // ── Particles ──────────────────────────────────────────────────────
      spawnParticles(x: number, y: number, color: number, count: number) {
        const card = this.cards.find(c => c.cx === x && c.cy === y);
        if (!card) return;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
          const speed = 60 + Math.random() * 80;
          card.particles.push({
            x: card.container.x, y: card.container.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color,
          });
        }
      }

      // ── Floating text ──────────────────────────────────────────────────
      showFloatingText(msg: string, x: number, y: number, color: string) {
        const t = this.add.text(x, y, msg, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '14px',
          color, fontStyle: 'bold',
        }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      }

      // ── Sound ──────────────────────────────────────────────────────────
      playFlipSound() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        playTone(this.audioCtx, 440, 'triangle', 0.12, t, 0.08);
      }
      playMatchSound(combo: number) {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const baseFreq = 523 + combo * 40;
        playTone(this.audioCtx, baseFreq,        'sine', 0.18, t,       0.12);
        playTone(this.audioCtx, baseFreq * 1.25, 'sine', 0.14, t + 0.1, 0.12);
        playTone(this.audioCtx, baseFreq * 1.5,  'sine', 0.10, t + 0.2, 0.18);
      }
      playMismatchSound() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        playTone(this.audioCtx, 220, 'sawtooth', 0.08, t,       0.08);
        playTone(this.audioCtx, 180, 'sawtooth', 0.06, t + 0.1, 0.12);
      }
      playWinSound() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
          playTone(this.audioCtx!, f, 'sine', 0.15, t + i * 0.12, 0.2);
        });
      }
      playLoseSound() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        [440, 370, 311, 262].forEach((f, i) => {
          playTone(this.audioCtx!, f, 'sawtooth', 0.10, t + i * 0.12, 0.18);
        });
      }

      // ── Update loop ────────────────────────────────────────────────────
      update(_time: number, delta: number) {
        this.particleGraphics.clear();
        const dt = delta / 1000;
        this.cards.forEach(card => {
          card.particles = card.particles.filter((p: any) => p.life > 0);
          card.particles.forEach((p: any) => {
            p.x  += p.vx * dt;
            p.y  += p.vy * dt;
            p.vy += 120 * dt; // gravity
            p.life -= dt * 1.8;
            if (p.life > 0) {
              this.particleGraphics.fillStyle(p.color, Math.max(0, p.life));
              this.particleGraphics.fillCircle(p.x, p.y, 3 * p.life);
            }
          });
        });
      }
    }

    // ──────────────────────────────────────────────────────────────────────
    //  Factory: return both scenes so PhaserGameEngine loads them
    // ──────────────────────────────────────────────────────────────────────
    return { scenes: [MenuScene, GameScene] };
  }
}
