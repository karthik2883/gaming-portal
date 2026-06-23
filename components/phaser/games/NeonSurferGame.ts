// Neon Surfer — Subway Surfer-style Endless Runner in PhaserJS
// Register key: 'neon-surfer' in PhaserGameEngine.tsx

/* ─── Audio Synthesizer ──────────────────────────────────────────────────── */
let audioCtx: AudioContext | null = null;

function getACtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (C) audioCtx = new C();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSynth(freq: number, type: OscillatorType = 'sine', dur = 0.12, vol = 0.08) {
  const ctx = getACtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch {}
}

function playCoinSound()   { playSynth(1047, 'sine', 0.08, 0.07); }
function playJumpSound()   { playSynth(440, 'triangle', 0.15, 0.09); }
function playSlideSound()  { playSynth(180, 'sawtooth', 0.18, 0.05); }
function playHitSound()    { playSynth(80, 'sawtooth', 0.4, 0.15); }
function playPowerUpSound() { playSynth(880, 'sine', 0.25, 0.1); }
function playGameOverSound() {
  const ctx = getACtx(); if (!ctx) return;
  try {
    [200, 160, 120, 80].forEach((f, i) => {
      const osc = ctx!.createOscillator(); const g = ctx!.createGain();
      osc.type = 'sawtooth'; osc.frequency.value = f;
      g.gain.setValueAtTime(0.15, ctx!.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx!.currentTime + i * 0.12 + 0.2);
      osc.connect(g); g.connect(ctx!.destination);
      osc.start(ctx!.currentTime + i * 0.12); osc.stop(ctx!.currentTime + i * 0.12 + 0.3);
    });
  } catch {}
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const LANES = 3;
const LANE_WIDTH = 150;
const LANE_CENTERS = [-LANE_WIDTH, 0, LANE_WIDTH]; // offset from center X
const HORIZON_Y = 160;
const GROUND_Y = 520;
const TRACK_WIDTH_AT_BOTTOM = 540;
const TRACK_WIDTH_AT_HORIZON = 75;

// Power-up types
type PowerUpType = 'magnet' | 'shield' | 'jetpack' | 'multiplier' | 'hoverboard';

// Obstacle types
type ObstacleType = 'train' | 'barrier-low' | 'barrier-high' | 'double-barrier' | 'gap';

/* ─── Utility ───────────────────────────────────────────────────────────── */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ─── Factory ─────────────────────────────────────────────────────────────── */
export default class NeonSurferFactory {
  static create(PhaserLib: any) {

    return class NeonSurferScene extends PhaserLib.Scene {

      /* State */
      gameState!: 'MENU' | 'RUNNING' | 'GAMEOVER';
      score!: number;
      highScore!: number;
      coins!: number;
      totalCoins!: number;
      distance!: number;
      multiplier!: number;

      /* Speed */
      baseSpeed!: number;
      speed!: number;
      maxSpeed!: number;
      speedIncreaseRate!: number;

      /* Player */
      playerLane!: number; // 0, 1, 2
      playerTargetLane!: number;
      playerX!: number;
      playerY!: number;
      playerLerpX!: number;
      isJumping!: boolean;
      jumpVelocity!: number;
      jumpY!: number;
      isSliding!: boolean;
      slideTimer!: number;
      isRolling!: boolean;
      rollTimer!: number;
      playerAlive!: boolean;

      /* Power-ups active */
      powerUps!: {
        magnet: number;    // remaining ms
        shield: number;
        jetpack: number;
        multiplier: number;
        hoverboard: number;
      };
      activePowerUpKeys!: PowerUpType[];

      /* Objects on track */
      obstacles!: TrackObject[];
      coinRows!: TrackObject[];
      powerUpItems!: TrackObject[];

      /* Spawn timers */
      obstacleSpawnDist!: number;
      coinSpawnDist!: number;
      powerUpSpawnDist!: number;
      distSinceLastObstacle!: number;
      distSinceLastCoin!: number;
      distSinceLastPowerUp!: number;

      /* Graphics layers */
      bgGfx!: any;
      trackGfx!: any;
      objGfx!: any;
      playerGfx!: any;
      fxGfx!: any;
      hudGfx!: any;
      playerSprite!: any;

      /* HUD texts */
      scoreText!: any;
      distText!: any;
      coinText!: any;
      multText!: any;
      powerUpTexts!: any[];
      messageText!: any;

      /* Menu/GameOver overlay */
      overlayGroup!: any;

      /* Input */
      cursors!: any;
      keys!: any;
      swipeStart!: { x: number; y: number } | null;
      prevLeft!: boolean;
      prevRight!: boolean;
      prevUp!: boolean;
      prevDown!: boolean;

      /* Particles / FX */
      particles!: FxParticle[];
      trailParticles!: FxParticle[];

      /* Camera shake */
      shakeAmount!: number;
      shakeDur!: number;

      /* Star field for bg */
      stars!: Star[];

      constructor() { super({ key: 'NeonSurfer' }); }

      /* ── INIT ── */
      init() {
        this.gameState = 'MENU';
        this.score = 0;
        this.distance = 0;
        this.coins = 0;
        this.multiplier = 1;
        this.baseSpeed = 5.2;
        this.speed = this.baseSpeed;
        this.maxSpeed = 24;
        this.speedIncreaseRate = 0.0015;

        this.playerLane = 1;
        this.playerTargetLane = 1;
        this.playerX = 0;
        this.playerY = 0;
        this.jumpVelocity = 0;
        this.jumpY = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.isRolling = false;
        this.rollTimer = 0;
        this.playerAlive = true;

        this.powerUps = {
          magnet: 0, shield: 0, jetpack: 0,
          multiplier: 0, hoverboard: 0
        };
        this.activePowerUpKeys = [];

        this.clearTrackObjects();

        this.obstacleSpawnDist = 800;
        this.coinSpawnDist = 400;
        this.powerUpSpawnDist = 1200;
        this.distSinceLastObstacle = 0;
        this.distSinceLastCoin = 0;
        this.distSinceLastPowerUp = 0;

        this.particles = [];
        this.trailParticles = [];
        this.shakeAmount = 0;
        this.shakeDur = 0;

        this.swipeStart = null;
        this.prevLeft = false; this.prevRight = false;
        this.prevUp = false; this.prevDown = false;

        // Load best scores
        try {
          this.highScore = parseInt(localStorage.getItem('nsr-highscore') || '0', 10) || 0;
          this.totalCoins = parseInt(localStorage.getItem('nsr-coins') || '0', 10) || 0;
        } catch {
          this.highScore = 0; this.totalCoins = 0;
        }
      }

      clearTrackObjects() {
        if (this.obstacles) {
          this.obstacles.forEach(o => { if (o.sprite) o.sprite.destroy(); });
        }
        if (this.coinRows) {
          this.coinRows.forEach(c => { if (c.sprite) c.sprite.destroy(); });
        }
        if (this.powerUpItems) {
          this.powerUpItems.forEach(p => { if (p.sprite) p.sprite.destroy(); });
        }
        this.obstacles = [];
        this.coinRows = [];
        this.powerUpItems = [];
      }

      createObjectSprite(obj: TrackObject) {
        let key = '';
        if (obj.type === 'coin') key = 'ns-coin';
        else if (obj.type === 'barrier-low') key = 'ns-obstacle-low';
        else if (obj.type === 'barrier-high') key = 'ns-obstacle-high';
        else if (obj.type === 'train') key = 'ns-train';

        if (key) {
          const sprite = this.add.image(0, 0, key).setDepth(2).setVisible(false);
          if (obj.type === 'coin') {
            sprite.setOrigin(0.5, 0.5);
          } else if (obj.type === 'train') {
            sprite.setOrigin(0.5, 0.95);
          } else {
            sprite.setOrigin(0.5, 1.0);
          }
          obj.sprite = sprite;
        }
      }

      preload() {
        this.load.image('ns-player', '/game-assets/player_hoverboard.png');
        this.load.image('ns-coin', '/game-assets/coin.png');
        this.load.image('ns-obstacle-low', '/game-assets/obstacle_low.png');
        this.load.image('ns-obstacle-high', '/game-assets/obstacle_high.png');
        this.load.image('ns-train', '/game-assets/train.png');
      }

      /* ── CREATE ── */
      create() {
        const { width: W, height: H } = this.scale;

        // Stars background
        this.stars = Array.from({ length: 80 }, () => ({
          x: Math.random() * W, y: Math.random() * H * 0.55,
          r: Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.4 + 0.1,
        }));

        // Graphics layers (order matters for depth)
        this.bgGfx    = this.add.graphics().setDepth(0);
        this.trackGfx = this.add.graphics().setDepth(1);
        this.objGfx   = this.add.graphics().setDepth(2);
        this.playerGfx= this.add.graphics().setDepth(3);
        this.fxGfx    = this.add.graphics().setDepth(4);
        this.hudGfx   = this.add.graphics().setDepth(5);

        // Player Sprite
        this.playerSprite = this.add.image(0, 0, 'ns-player').setDepth(3.5).setOrigin(0.5, 0.95);
        this.playerSprite.setVisible(false);

        // HUD texts
        this.scoreText = this.add.text(W / 2, 20, '0', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '28px', color: '#ffffff',
          stroke: '#00d4ff', strokeThickness: 2,
        }).setOrigin(0.5, 0).setDepth(10);

        this.distText = this.add.text(W / 2, 52, '0m', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '14px', color: '#aaffff',
        }).setOrigin(0.5, 0).setDepth(10);

        this.coinText = this.add.text(16, 20, '🪙 0', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '16px', color: '#ffd700',
          stroke: '#000', strokeThickness: 2,
        }).setDepth(10);

        this.multText = this.add.text(W - 16, 20, 'x1', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '18px', color: '#ff00ff',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(1, 0).setDepth(10);

        this.powerUpTexts = [];
        for (let i = 0; i < 6; i++) {
          this.powerUpTexts.push(
            this.add.text(16, 50 + i * 22, '', {
              fontFamily: "'Orbitron', sans-serif", fontSize: '13px', color: '#00ff88',
              stroke: '#000', strokeThickness: 1,
            }).setDepth(10)
          );
        }

        this.messageText = this.add.text(W / 2, H * 0.38, '', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '20px', color: '#ffff00',
          stroke: '#000', strokeThickness: 2,
          align: 'center',
        }).setOrigin(0.5).setDepth(10);

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE');

        // Touch swipe
        this.input.on('pointerdown', (p: any) => { this.swipeStart = { x: p.x, y: p.y }; });
        this.input.on('pointerup', (p: any) => {
          if (!this.swipeStart) return;
          const dx = p.x - this.swipeStart.x;
          const dy = p.y - this.swipeStart.y;
          const adx = Math.abs(dx), ady = Math.abs(dy);
          if (adx < 15 && ady < 15) {
            // Tap - jump or start game
            if (this.gameState === 'MENU' || this.gameState === 'GAMEOVER') { this.startGame(); }
            else { this.doJump(); }
          } else if (adx > ady) {
            dx > 0 ? this.moveRight() : this.moveLeft();
          } else {
            dy > 0 ? this.doSlide() : this.doJump();
          }
          this.swipeStart = null;
        });

        // Overlay group
        this.overlayGroup = this.add.group();

        // Show menu
        this.showMenu();
      }

      /* ── MENU ── */
      showMenu() {
        this.gameState = 'MENU';
        this.clearOverlay();
        const { width: W, height: H } = this.scale;

        const bg = this.add.graphics().setDepth(8);
        bg.fillGradientStyle(0x070714, 0x070714, 0x14041a, 0x14041a, 0.92);
        bg.fillRect(0, 0, W, H);
        bg.lineStyle(1.5, 0x00d4ff, 0.4);
        bg.strokeRect(20, 20, W - 40, H - 40);
        bg.lineStyle(1, 0xff00ff, 0.25);
        bg.strokeRect(25, 25, W - 50, H - 50);
        this.overlayGroup.add(bg);

        const title = this.add.text(W / 2, H * 0.18, '🏄 NEON SURFER', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '34px', color: '#00d4ff',
          stroke: '#ff00ff', strokeThickness: 3,
          align: 'center',
        }).setOrigin(0.5).setDepth(9);
        this.overlayGroup.add(title);

        // Animated neon line
        const line = this.add.graphics().setDepth(9);
        line.lineStyle(2, 0xff00ff, 1);
        line.strokeRect(W / 2 - 180, H * 0.28, 360, 2);
        this.overlayGroup.add(line);

        const instructions = [
          '← → / A D : Change Lane',
          '↑ / W / SPACE / Tap: Jump',
          '↓ / S / Swipe Down: Slide',
          'Swipe Up / Down / Left / Right',
        ];
        instructions.forEach((t, i) => {
          const txt = this.add.text(W / 2, H * 0.33 + i * 26, t, {
            fontFamily: "'Orbitron', sans-serif", fontSize: '13px', color: '#aaffff',
          }).setOrigin(0.5).setDepth(9);
          this.overlayGroup.add(txt);
        });

        const pwTitle = this.add.text(W / 2, H * 0.52, 'POWER-UPS', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '15px', color: '#ffd700',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(9);
        this.overlayGroup.add(pwTitle);

        const pwInfo = [
          '🧲 MAGNET — Attracts all coins',
          '🛡️ SHIELD — One hit protection',
          '🚀 JETPACK — Fly over everything',
          '✨ MULTIPLIER — 2x score',
          '🛹 HOVERBOARD — Lane bounce immunity',
        ];
        pwInfo.forEach((t, i) => {
          const txt = this.add.text(W / 2, H * 0.57 + i * 22, t, {
            fontFamily: "'Orbitron', sans-serif", fontSize: '11px', color: '#ccccff',
          }).setOrigin(0.5).setDepth(9);
          this.overlayGroup.add(txt);
        });

        const hsText = this.add.text(W / 2, H * 0.85, `Best: ${this.highScore}  Coins: ${this.totalCoins}`, {
          fontFamily: "'Orbitron', sans-serif", fontSize: '15px', color: '#ffaa00',
        }).setOrigin(0.5).setDepth(9);
        this.overlayGroup.add(hsText);

        const btn = this.add.text(W / 2, H * 0.92, '▶  TAP TO RUN', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '20px', color: '#000',
          backgroundColor: '#00d4ff',
          padding: { x: 24, y: 10 },
        }).setOrigin(0.5).setDepth(9).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.startGame());
        this.tweens.add({ targets: btn, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
        this.overlayGroup.add(btn);
      }

      /* ── START GAME ── */
      startGame() {
        this.clearOverlay();
        this.init();
        this.gameState = 'RUNNING';
        this.playerLane = 1;
        this.playerTargetLane = 1;
        this.playerX = this.laneX(1, GROUND_Y);
        this.playerY = GROUND_Y;
        this.jumpY = 0;
        if (this.playerSprite) this.playerSprite.setVisible(true);
        playSynth(523, 'sine', 0.2, 0.12);
      }

      /* ── GAME OVER ── */
      doGameOver() {
        if (this.gameState !== 'RUNNING') return;
        this.gameState = 'GAMEOVER';
        this.playerAlive = false;
        if (this.playerSprite) this.playerSprite.setVisible(false);
        playGameOverSound();
        this.triggerShake(12, 40);

        // Save scores
        if (this.score > this.highScore) {
          this.highScore = this.score;
          try { localStorage.setItem('nsr-highscore', String(this.highScore)); } catch {}
        }
        this.totalCoins += this.coins;
        try { localStorage.setItem('nsr-coins', String(this.totalCoins)); } catch {}

        // Show game over overlay after brief delay
        this.time.delayedCall(800, () => this.showGameOver());
      }

      showGameOver() {
        this.clearOverlay();
        const { width: W, height: H } = this.scale;

        const bg = this.add.graphics().setDepth(8);
        bg.fillGradientStyle(0x0a030c, 0x0a030c, 0x180018, 0x180018, 0.95);
        bg.fillRect(0, 0, W, H);
        bg.lineStyle(1.5, 0xff00ff, 0.4);
        bg.strokeRect(20, 20, W - 40, H - 40);
        bg.lineStyle(1, 0x00d4ff, 0.25);
        bg.strokeRect(25, 25, W - 50, H - 50);
        this.overlayGroup.add(bg);

        const title = this.add.text(W / 2, H * 0.18, 'GAME OVER', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '36px', color: '#ff0044',
          stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(9);
        this.overlayGroup.add(title);

        const isNew = this.score >= this.highScore;
        const stats = [
          `Score:    ${this.score}`,
          `Distance: ${Math.floor(this.distance)}m`,
          `Coins:    ${this.coins}`,
          isNew ? '🏆 NEW HIGH SCORE!' : `Best: ${this.highScore}`,
        ];
        stats.forEach((t, i) => {
          const col = (i === 3 && isNew) ? '#ffd700' : '#ffffff';
          const txt = this.add.text(W / 2, H * 0.35 + i * 36, t, {
            fontFamily: "'Orbitron', sans-serif", fontSize: '18px', color: col,
            stroke: '#000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(9);
          this.overlayGroup.add(txt);
        });

        const btn = this.add.text(W / 2, H * 0.72, '▶  PLAY AGAIN', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '22px', color: '#000',
          backgroundColor: '#ff00ff',
          padding: { x: 24, y: 12 },
        }).setOrigin(0.5).setDepth(9).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.startGame());
        this.tweens.add({ targets: btn, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
        this.overlayGroup.add(btn);

        const menuBtn = this.add.text(W / 2, H * 0.84, 'MAIN MENU', {
          fontFamily: "'Orbitron', sans-serif", fontSize: '15px', color: '#aaffff',
          stroke: '#000', strokeThickness: 1,
        }).setOrigin(0.5).setDepth(9).setInteractive({ useHandCursor: true });
        menuBtn.on('pointerdown', () => this.showMenu());
        this.overlayGroup.add(menuBtn);
      }

      clearOverlay() {
        const children = [...this.overlayGroup.getChildren()];
        children.forEach((obj: any) => {
          if (obj) {
            this.tweens.killTweensOf(obj);
            obj.destroy();
          }
        });
        this.overlayGroup.clear(true, true);
      }

      /* ── PLAYER MOVEMENT ── */
      moveLeft() {
        if (this.gameState !== 'RUNNING' || !this.playerAlive) return;
        if (this.playerTargetLane > 0) {
          this.playerTargetLane--;
          playSynth(350, 'triangle', 0.08, 0.06);
        }
      }
      moveRight() {
        if (this.gameState !== 'RUNNING' || !this.playerAlive) return;
        if (this.playerTargetLane < 2) {
          this.playerTargetLane++;
          playSynth(350, 'triangle', 0.08, 0.06);
        }
      }
      doJump() {
        if (this.gameState !== 'RUNNING' || !this.playerAlive) return;
        if (this.powerUps.jetpack > 0) return; // jetpack handles vertical
        if (!this.isJumping) {
          this.isJumping = true;
          this.isSliding = false;
          this.jumpVelocity = -14;
          playJumpSound();
        }
      }
      doSlide() {
        if (this.gameState !== 'RUNNING' || !this.playerAlive) return;
        if (this.isJumping) {
          // Fast fall
          this.jumpVelocity = Math.max(this.jumpVelocity, 8);
          return;
        }
        if (!this.isSliding) {
          this.isSliding = true;
          this.slideTimer = 900;
          playSlideSound();
        }
      }

      /* ── LANE COORDINATE HELPERS ── */
      /** Given a lane (0-2) and a depth (GROUND_Y = far, horizon=HORIZON_Y), compute screen X */
      laneX(lane: number, screenY: number): number {
        const { width: W } = this.scale;
        const halfTrack = this.trackHalfW(screenY - HORIZON_Y);
        // lane = 0 (left), 1 (middle), 2 (right) -> factor: -2/3, 0, 2/3
        const factor = (lane - 1) * (2 / 3);
        return W / 2 + halfTrack * factor;
      }

      /** Given a depth fraction (0=horizon, 1=ground), compute the screen scale */
      perspectiveScale(t: number): number {
        return lerp(0.15, 1.0, t);
      }

      /* ── SPAWN HELPERS ── */
      spawnObstacle() {
        const types: ObstacleType[] = ['train', 'barrier-low', 'barrier-high', 'double-barrier'];
        // Weighted
        const weights = [3, 4, 3, 2];
        let r = Math.random() * weights.reduce((a, b) => a + b, 0);
        let type: ObstacleType = 'train';
        for (let i = 0; i < types.length; i++) {
          r -= weights[i];
          if (r <= 0) { type = types[i]; break; }
        }

        // For double-barrier, need 2 adjacent lanes blocked
        if (type === 'double-barrier') {
          const startLane = Math.floor(Math.random() * 2); // 0 or 1
          const o1 = { type: 'barrier-low', lane: startLane, t: 0, active: true, collected: false };
          const o2 = { type: 'barrier-low', lane: startLane + 1, t: 0, active: true, collected: false };
          this.createObjectSprite(o1);
          this.createObjectSprite(o2);
          this.obstacles.push(o1, o2);
        } else {
          const lane = Math.floor(Math.random() * 3);
          const o = { type, lane, t: 0, active: true, collected: false };
          this.createObjectSprite(o);
          this.obstacles.push(o);
        }
      }

      spawnCoinRow() {
        const lane = Math.floor(Math.random() * 3);
        const count = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < count; i++) {
          const o = {
            type: 'coin', lane, t: 0 - i * 0.04,
            active: true, collected: false,
          };
          this.createObjectSprite(o);
          this.coinRows.push(o);
        }
      }

      spawnPowerUp() {
        const types: PowerUpType[] = ['magnet', 'shield', 'jetpack', 'multiplier', 'hoverboard'];
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * 3);
        this.powerUpItems.push({ type, lane, t: 0, active: true, collected: false });
      }

      /* ── ACTIVATE POWER-UP ── */
      activatePowerUp(type: PowerUpType) {
        playPowerUpSound();
        const durations: Record<PowerUpType, number> = {
          magnet: 8000, shield: 6000, jetpack: 7000,
          multiplier: 10000, hoverboard: 5000,
        };
        this.powerUps[type] = durations[type];
        if (!this.activePowerUpKeys.includes(type)) this.activePowerUpKeys.push(type);

        const msgs: Record<PowerUpType, string> = {
          magnet: '🧲 MAGNET!', shield: '🛡️ SHIELD!', jetpack: '🚀 JETPACK!',
          multiplier: '✨ 2x SCORE!', hoverboard: '🛹 HOVERBOARD!',
        };
        this.showMessage(msgs[type]);
      }

      showMessage(msg: string) {
        this.messageText.setText(msg).setAlpha(1);
        this.tweens.killTweensOf(this.messageText);
        this.tweens.add({
          targets: this.messageText, alpha: 0, duration: 1800, delay: 400,
        });
      }

      triggerShake(amount: number, dur: number) {
        this.shakeAmount = amount; this.shakeDur = dur;
      }

      /* ── UPDATE ── */
      update(time: number, delta: number) {
        if (this.gameState !== 'RUNNING') return;

        const dt = delta / 16.67; // normalize to 60fps
        const { width: W, height: H } = this.scale;

        /* ── Input ── */
        const left  = this.cursors.left.isDown  || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const up    = this.cursors.up.isDown    || this.keys.W.isDown || this.keys.SPACE.isDown;
        const down  = this.cursors.down.isDown  || this.keys.S.isDown;

        if (left  && !this.prevLeft)  this.moveLeft();
        if (right && !this.prevRight) this.moveRight();
        if (up    && !this.prevUp)    this.doJump();
        if (down  && !this.prevDown)  this.doSlide();

        this.prevLeft = left; this.prevRight = right;
        this.prevUp = up; this.prevDown = down;

        /* ── Speed ── */
        this.speed = Math.min(this.maxSpeed, this.baseSpeed + this.distance * this.speedIncreaseRate);
        const effectiveSpeed = this.speed;

        /* ── Distance / Score ── */
        this.distance += effectiveSpeed * dt * 0.5;
        this.multiplier = this.powerUps.multiplier > 0 ? 2 : 1;
        this.score += Math.ceil(effectiveSpeed * dt * this.multiplier * 0.3);

        /* ── Obstacle spawn ── */
        this.distSinceLastObstacle += effectiveSpeed * dt;
        if (this.distSinceLastObstacle >= this.obstacleSpawnDist) {
          this.spawnObstacle();
          this.distSinceLastObstacle = 0;
          // Decrease gap as speed rises
          this.obstacleSpawnDist = Math.max(400, 800 - this.distance * 0.15);
        }

        /* ── Coin spawn ── */
        this.distSinceLastCoin += effectiveSpeed * dt;
        if (this.distSinceLastCoin >= this.coinSpawnDist) {
          this.spawnCoinRow();
          this.distSinceLastCoin = 0;
          this.coinSpawnDist = Math.max(200, 400 - this.distance * 0.05);
        }

        /* ── Power-up spawn ── */
        this.distSinceLastPowerUp += effectiveSpeed * dt;
        if (this.distSinceLastPowerUp >= this.powerUpSpawnDist) {
          this.spawnPowerUp();
          this.distSinceLastPowerUp = 0;
        }

        /* ── Advance objects ── */
        const tStep = effectiveSpeed * dt * 0.0028;

        this.obstacles.forEach(o => {
          if (o.active) { o.t += tStep; }
        });
        this.coinRows.forEach(c => {
          if (c.active && !c.collected) { c.t += tStep; }
        });
        this.powerUpItems.forEach(p => {
          if (p.active && !p.collected) { p.t += tStep; }
        });

        // Remove passed objects
        this.obstacles = this.obstacles.filter(o => {
          if (o.t < 1.08) return true;
          if (o.sprite) o.sprite.destroy();
          return false;
        });
        this.coinRows = this.coinRows.filter(c => {
          if (c.t < 1.08) return true;
          if (c.sprite) c.sprite.destroy();
          return false;
        });
        this.powerUpItems = this.powerUpItems.filter(p => {
          if (p.t < 1.08) return true;
          if (p.sprite) p.sprite.destroy();
          return false;
        });

        /* ── Player lane lerp ── */
        const targetX = this.laneX(this.playerTargetLane, GROUND_Y);
        this.playerX = lerp(this.playerX, targetX, 0.22 * dt);

        /* ── Jump / Slide physics ── */
        const isJetpacking = this.powerUps.jetpack > 0;

        if (isJetpacking) {
          // Hover mid-air
          this.jumpY = lerp(this.jumpY, -160, 0.08 * dt);
          this.isJumping = true;
          // Spawn jet particles
          if (Math.random() < 0.4) {
            this.particles.push({
              x: this.playerX, y: GROUND_Y + this.jumpY + 24,
              vx: (Math.random() - 0.5) * 2, vy: Math.random() * 3 + 1,
              r: Math.random() * 5 + 2,
              color: 0xff6600, alpha: 1, life: 0.4,
            });
          }
        } else if (this.isJumping) {
          this.jumpVelocity += 0.75 * dt;
          this.jumpY += this.jumpVelocity * dt;
          if (this.jumpY >= 0) {
            this.jumpY = 0; this.jumpVelocity = 0; this.isJumping = false;
          }
        }

        if (this.isSliding) {
          this.slideTimer -= delta;
          if (this.slideTimer <= 0) { this.isSliding = false; }
        }

        /* ── Power-up timers ── */
        const pwKeys = Object.keys(this.powerUps) as PowerUpType[];
        pwKeys.forEach(k => {
          if (this.powerUps[k] > 0) {
            this.powerUps[k] -= delta;
            if (this.powerUps[k] <= 0) {
              this.powerUps[k] = 0;
              this.activePowerUpKeys = this.activePowerUpKeys.filter(p => p !== k);
            }
          }
        });

        /* ── Collision & collection ── */
        if (this.playerAlive) {
          const playerGroundX = this.playerX;
          const playerCurrentLane = this.playerTargetLane;
          const isGrounded = !this.isJumping;
          const isLow = this.jumpY > -50; // within low-jump threshold

          // Coins
          this.coinRows.forEach(c => {
            if (c.collected) return;
            if (c.t < 0.82 || c.t > 1.02) return;
            const cx = this.laneX(c.lane, this.objScreenY(c.t));
            const cy = this.objScreenY(c.t) + this.jumpY * 0.1;
            const dx = Math.abs(playerGroundX - cx);
            // Magnet pulls coins
            const collectDist = this.powerUps.magnet > 0 ? 180 : 42;
            if (c.lane === playerCurrentLane || dx < collectDist) {
              c.collected = true;
              if (c.sprite) {
                c.sprite.destroy();
                c.sprite = undefined;
              }
              this.coins++;
              this.score += 50 * this.multiplier;
              playCoinSound();
              this.particles.push({
                x: cx, y: cy, vx: 0, vy: -3, r: 8,
                color: 0xffd700, alpha: 1, life: 0.4,
              });
            }
          });

          // Power-ups
          this.powerUpItems.forEach(p => {
            if (p.collected) return;
            if (p.t < 0.82 || p.t > 1.02) return;
            if (p.lane !== playerCurrentLane) return;
            p.collected = true;
            this.activatePowerUp(p.type as PowerUpType);
          });

          // Obstacles
          this.obstacles.forEach(o => {
            if (!o.active) return;
            if (o.t < 0.85 || o.t > 1.0) return;

            const inLane = o.lane === playerCurrentLane ||
              (o.extraLane !== undefined && o.extraLane === playerCurrentLane);
            if (!inLane) return;

            // Determine if player avoids
            let avoids = false;
            if (o.type === 'train') {
              avoids = isJetpacking || this.jumpY < -60;
            } else if (o.type === 'barrier-low') {
              // Can jump over or slide under
              avoids = isJetpacking || this.jumpY < -40 || this.isSliding;
            } else if (o.type === 'barrier-high') {
              // Must slide under (jump won't clear it high enough if close)
              avoids = isJetpacking || this.isSliding;
            } else if (o.type === 'double-barrier') {
              avoids = isJetpacking || this.jumpY < -40 || this.isSliding;
            }

            if (!avoids) {
              if (this.powerUps.shield > 0 || this.powerUps.hoverboard > 0) {
                // Power-up absorbs hit
                if (this.powerUps.shield > 0) {
                  this.powerUps.shield = 0;
                  this.activePowerUpKeys = this.activePowerUpKeys.filter(p => p !== 'shield');
                } else {
                  this.powerUps.hoverboard = 0;
                  this.activePowerUpKeys = this.activePowerUpKeys.filter(p => p !== 'hoverboard');
                }
                this.showMessage('💥 SHIELD ABSORBED HIT!');
                this.triggerShake(8, 20);
                playHitSound();
                o.active = false;
                if (o.sprite) {
                  o.sprite.destroy();
                  o.sprite = undefined;
                }
              } else {
                o.active = false;
                if (o.sprite) {
                  o.sprite.destroy();
                  o.sprite = undefined;
                }
                this.doGameOver();
              }
            }
          });
        }

        /* ── Camera shake ── */
        let shakeX = 0, shakeY = 0;
        if (this.shakeDur > 0) {
          shakeX = (Math.random() - 0.5) * this.shakeAmount;
          shakeY = (Math.random() - 0.5) * this.shakeAmount;
          this.shakeDur -= delta;
          if (this.shakeDur <= 0) { this.shakeAmount = 0; this.shakeDur = 0; }
        }

        /* ── Draw everything ── */
        this.drawScene(W, H, shakeX, shakeY, delta);

        /* ── Update HUD texts ── */
        this.scoreText.setText(String(this.score));
        this.distText.setText(`${Math.floor(this.distance)}m`);
        this.coinText.setText(`🪙 ${this.coins}`);
        this.multText.setText(this.multiplier > 1 ? `x${this.multiplier}` : '');

        // Power-up bar
        const pwLabels: Record<PowerUpType, string> = {
          magnet: '🧲', shield: '🛡️', jetpack: '🚀',
          multiplier: '✨', hoverboard: '🛹',
        };
        const pwDurs: Record<PowerUpType, number> = {
          magnet: 8000, shield: 6000, jetpack: 7000,
          multiplier: 10000, hoverboard: 5000,
        };
        let pi = 0;
        pwKeys.forEach(k => {
          if (this.powerUps[k] > 0 && pi < this.powerUpTexts.length) {
            const pct = Math.ceil((this.powerUps[k] / pwDurs[k]) * 100);
            this.powerUpTexts[pi].setText(`${pwLabels[k]} ${pct}%`);
            pi++;
          }
        });
        for (let i = pi; i < this.powerUpTexts.length; i++) {
          this.powerUpTexts[i].setText('');
        }

        /* ── Update particles ── */
        this.particles = this.particles.filter(p => {
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.life -= dt * 0.04; return p.life > 0;
        });
        this.trailParticles = this.trailParticles.filter(p => {
          p.x += p.vx; p.y += p.vy;
          p.life -= 0.045; return p.life > 0;
        });

        /* ── Speed trail when fast or jetpacking ── */
        if (effectiveSpeed > 10 || isJetpacking) {
          this.trailParticles.push({
            x: this.playerX + (Math.random() - 0.5) * 20,
            y: GROUND_Y + this.jumpY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1,
            vy: Math.random() * 2 - 1,
            r: Math.random() * 4 + 2,
            color: isJetpacking ? 0xff6600 : 0x00d4ff,
            alpha: 0.7, life: 0.7,
          });
        }
      }

      /* ── SCENE DRAWING ── */
      drawScene(W: number, H: number, shakeX: number, shakeY: number, delta: number) {
        /* Background */
        this.bgGfx.clear();
        // Sky gradient simulation
        this.bgGfx.fillGradientStyle(0x000028, 0x000028, 0x1a0040, 0x1a0040, 1);
        this.bgGfx.fillRect(0, 0, W, H);

        // Horizon glow
        this.bgGfx.fillStyle(0x220040, 0.6);
        this.bgGfx.fillRect(0, HORIZON_Y - 30, W, 60);
        this.bgGfx.fillStyle(0x003366, 0.3);
        this.bgGfx.fillRect(0, HORIZON_Y - 10, W, 20);

        // Moving stars
        this.stars.forEach(s => {
          s.x -= s.speed * (this.speed / this.baseSpeed) * 0.2;
          if (s.x < 0) s.x = W;
          const alpha = s.alpha * (0.7 + Math.sin(Date.now() * 0.002 + s.x) * 0.3);
          this.bgGfx.fillStyle(0xffffff, alpha);
          this.bgGfx.fillCircle(s.x, s.y, s.r);
        });

        // City skyline
        this.drawCityline(W, H);

        /* Track */
        this.trackGfx.clear();
        const sx = shakeX, sy = shakeY;
        this.drawTrack(W, H, sx, sy);

        /* Objects */
        this.objGfx.clear();

        // Sort by t (closer = higher t = draw last for proper overlap)
        const allObjects: TrackObject[] = [
          ...this.coinRows.filter(c => !c.collected && c.t >= 0 && c.t <= 1.05),
          ...this.powerUpItems.filter(p => !p.collected && p.t >= 0 && p.t <= 1.05),
          ...this.obstacles.filter(o => o.active && o.t >= 0 && o.t <= 1.05),
        ].sort((a, b) => a.t - b.t);

        allObjects.forEach(obj => {
          const screenY = this.objScreenY(obj.t) + sy;
          const scale = this.perspectiveScale(obj.t);
          const x = this.laneX(obj.lane, screenY) + sx;

          // Horizon lane warnings for approaching obstacles
          const isObstacle = ['train', 'barrier-low', 'barrier-high'].includes(obj.type);
          if (isObstacle && obj.t < 0.28) {
            const warnX = this.laneX(obj.lane, HORIZON_Y + 15) + sx;
            const pulse = Math.sin(Date.now() * 0.015) > 0 ? 1 : 0.2;
            const color = obj.type === 'train' ? 0xff0033 : 0xffaa00; // red for trains, orange for barriers
            this.objGfx.lineStyle(1.5, color, 0.85 * pulse);
            this.objGfx.strokeTriangle(warnX, HORIZON_Y - 14, warnX - 8, HORIZON_Y - 2, warnX + 8, HORIZON_Y - 2);
            this.objGfx.fillStyle(color, 0.35 * pulse);
            this.objGfx.fillTriangle(warnX, HORIZON_Y - 14, warnX - 8, HORIZON_Y - 2, warnX + 8, HORIZON_Y - 2);
          }

          if (obj.sprite) {
            if (obj.t >= 0 && obj.t <= 1.05) {
              let baseScale = 1.0;
              if (obj.type === 'coin') baseScale = 0.032;
              else if (obj.type === 'barrier-low') baseScale = 0.092;
              else if (obj.type === 'barrier-high') baseScale = 0.125;
              else if (obj.type === 'train') baseScale = 0.145;

              obj.sprite.setPosition(x, screenY).setScale(scale * baseScale).setVisible(true);
              obj.sprite.setDepth(2 + obj.t * 0.5);
            } else {
              obj.sprite.setVisible(false);
            }
          } else {
            // Fallback to vector drawings if sprite assets failed to load
            if (obj.type === 'coin') {
              this.drawCoin(x, screenY, scale);
            } else if (obj.type === 'train') {
              this.drawTrain(x, screenY, scale, sx);
            } else if (obj.type === 'barrier-low') {
              this.drawBarrier(x, screenY, scale, false);
            } else if (obj.type === 'barrier-high') {
              this.drawBarrier(x, screenY, scale, true);
            }
          }

          // Power-ups are always vector drawn
          if (['magnet', 'shield', 'jetpack', 'multiplier', 'hoverboard'].includes(obj.type)) {
            this.drawPowerUp(x, screenY, scale, obj.type as PowerUpType);
          }
        });

        /* Player */
        this.playerGfx.clear();
        this.drawPlayer(W, H, shakeX, shakeY);

        /* FX particles */
        this.fxGfx.clear();
        [...this.trailParticles, ...this.particles].forEach(p => {
          this.fxGfx.fillStyle(p.color, p.alpha * p.life);
          this.fxGfx.fillCircle(p.x, p.y, p.r * p.life);
        });

        /* HUD overlay bars */
        this.hudGfx.clear();
        this.drawHUD(W, H);
      }

      objScreenY(t: number): number {
        return HORIZON_Y + (GROUND_Y - HORIZON_Y) * t;
      }

      drawTrack(W: number, H: number, sx: number, sy: number) {
        const g = this.trackGfx;

        // Ground plane
        g.fillStyle(0x0a0a1a, 1);
        g.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

        // Road surface
        const trackLeft  = (x: number, y: number) => W / 2 - this.trackHalfW(y - HORIZON_Y) + sx;
        const trackRight = (x: number, y: number) => W / 2 + this.trackHalfW(y - HORIZON_Y) + sx;

        g.fillStyle(0x111133, 1);
        g.beginPath();
        g.moveTo(trackLeft(0, HORIZON_Y + sy), HORIZON_Y + sy);
        g.lineTo(trackRight(0, HORIZON_Y + sy), HORIZON_Y + sy);
        g.lineTo(trackRight(0, H), H);
        g.lineTo(trackLeft(0, H), H);
        g.closePath();
        g.fillPath();

        // Horizontal grid lines (synthwave perspective lines scrolling down)
        const horizLines = 10;
        const hScroll = (this.distance * 0.06) % 1; // 0 to 1
        for (let i = 0; i < horizLines; i++) {
          const rawT = (i + hScroll) / horizLines;
          const t = Math.pow(rawT, 2); // Exponential spacing for 3D perspective
          const y = HORIZON_Y + (H - HORIZON_Y) * t + sy;
          if (y < HORIZON_Y || y > H) continue;

          const xl = W / 2 - this.trackHalfW(y - HORIZON_Y) + sx;
          const xr = W / 2 + this.trackHalfW(y - HORIZON_Y) + sx;

          g.lineStyle(1.5, 0x334488, 0.15 + t * 0.35);
          g.beginPath(); g.moveTo(xl, y); g.lineTo(xr, y); g.strokePath();
        }

        // Side tunnel rings (cyber arches scrolling past)
        const archCount = 6;
        const aScroll = (this.distance * 0.04) % 1;
        for (let i = 0; i < archCount; i++) {
          const rawT = (i + aScroll) / archCount;
          const t = Math.pow(rawT, 2);
          const y = HORIZON_Y + (H - HORIZON_Y) * t + sy;
          if (y < HORIZON_Y || y > H) continue;

          const scale = this.perspectiveScale(t);
          const w = 550 * scale;
          const h = 400 * scale;
          const ax = W / 2 + sx;
          const ay = y;

          g.lineStyle(1.5, 0xff00ff, 0.08 + t * 0.25);
          g.beginPath();
          g.moveTo(ax - w / 2, ay);
          g.lineTo(ax - w / 2, ay - h * 0.7);
          g.arc(ax, ay - h * 0.7, w / 2, Math.PI, 0, false);
          g.lineTo(ax + w / 2, ay);
          g.strokePath();
        }

        // Lane dividers (scrolling dashed lines)
        const dashSegments = 16;
        const lScroll = (this.distance * 0.06) % 1; // 0 to 1
        for (let d = 1; d < LANES; d++) {
          for (let i = -1; i < dashSegments + 1; i++) {
            const rawT0 = (i + lScroll) / dashSegments;
            const rawT1 = (i + 0.5 + lScroll) / dashSegments;
            
            // Perspective mapping for smooth speed matching
            const t0 = Math.pow(rawT0, 1.8);
            const t1 = Math.pow(rawT1, 1.8);
            
            if (t0 < 0 || t0 > 1) continue;
            const ct0 = Math.max(0, Math.min(1, t0));
            const ct1 = Math.max(0, Math.min(1, t1));

            const y0 = HORIZON_Y + (H - HORIZON_Y) * ct0 + sy;
            const y1 = HORIZON_Y + (H - HORIZON_Y) * ct1 + sy;
            const x0 = W / 2 - this.trackHalfW(y0 - HORIZON_Y) + this.trackHalfW(y0 - HORIZON_Y) * 2 * (d / LANES) + sx;
            const x1 = W / 2 - this.trackHalfW(y1 - HORIZON_Y) + this.trackHalfW(y1 - HORIZON_Y) * 2 * (d / LANES) + sx;
            g.lineStyle(2, 0x334488, 0.4 + ct0 * 0.5);
            g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokePath();
          }
        }

        // Road edges (neon glow lines)
        const edgeColors = [0x00d4ff, 0xff00ff];
        edgeColors.forEach((col, ei) => {
          g.lineStyle(2.5, col, 0.9);
          g.beginPath();
          const side = ei === 0 ? -1 : 1;
          let first = true;
          for (let i = 0; i <= 30; i++) {
            const y = HORIZON_Y + (H - HORIZON_Y) * (i / 30) + sy;
            const x = W / 2 + side * this.trackHalfW(y - HORIZON_Y) + sx;
            if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
          }
          g.strokePath();
        });

        // Horizon line
        g.lineStyle(1.5, 0x9900ff, 0.5);
        g.strokeRect(0, HORIZON_Y + sy, W, 0);

        // Speed lines when fast
        if (this.speed > 12) {
          const alpha = Math.min((this.speed - 12) / 10, 0.5);
          g.lineStyle(1, 0x00d4ff, alpha * 0.4);
          for (let i = 0; i < 10; i++) {
            const ly = HORIZON_Y + Math.random() * (H - HORIZON_Y);
            const lx1 = Math.random() * W;
            const lx2 = lx1 + (lx1 - W / 2) * 0.05;
            g.beginPath(); g.moveTo(lx1, ly); g.lineTo(lx2, ly); g.strokePath();
          }
        }
      }

      trackHalfW(dy: number): number {
        const t = dy / (GROUND_Y - HORIZON_Y);
        return lerp(TRACK_WIDTH_AT_HORIZON / 2, TRACK_WIDTH_AT_BOTTOM / 2, t);
      }

      drawCityline(W: number, H: number) {
        const g = this.bgGfx;
        const t = Date.now() * 0.0002;
        const buildings = [
          { x: 0.05, w: 0.06, h: 0.32, col: 0x1a0030 },
          { x: 0.12, w: 0.04, h: 0.20, col: 0x150020 },
          { x: 0.16, w: 0.07, h: 0.40, col: 0x1a0030 },
          { x: 0.24, w: 0.05, h: 0.25, col: 0x120025 },
          { x: 0.74, w: 0.05, h: 0.25, col: 0x120025 },
          { x: 0.80, w: 0.07, h: 0.40, col: 0x1a0030 },
          { x: 0.88, w: 0.04, h: 0.20, col: 0x150020 },
          { x: 0.93, w: 0.06, h: 0.32, col: 0x1a0030 },
        ];
        buildings.forEach(b => {
          const bx = b.x * W, bw = b.w * W;
          const bh = b.h * HORIZON_Y;
          const by = HORIZON_Y - bh;
          g.fillStyle(b.col, 1);
          g.fillRect(bx, by, bw, bh);
          // Windows
          g.fillStyle(0x4400aa, 0.6);
          for (let wy = by + 6; wy < HORIZON_Y - 8; wy += 14) {
            for (let wx = bx + 5; wx < bx + bw - 8; wx += 10) {
              if (Math.sin(wx * 0.3 + wy * 0.2 + t) > 0.2) {
                g.fillRect(wx, wy, 5, 8);
              }
            }
          }
        });
      }

      drawCoin(x: number, y: number, scale: number) {
        const r = 9 * scale;
        if (r < 2) return;
        this.objGfx.fillStyle(0xffd700, 1);
        this.objGfx.fillCircle(x, y, r);
        this.objGfx.lineStyle(1.5, 0xffaa00, 1);
        this.objGfx.strokeCircle(x, y, r);
        this.objGfx.fillStyle(0xffee88, 0.6);
        this.objGfx.fillCircle(x - r * 0.25, y - r * 0.25, r * 0.35);
      }

      drawPowerUp(x: number, y: number, scale: number, type: PowerUpType) {
        const r = 14 * scale;
        if (r < 3) return;
        const colors: Record<PowerUpType, number> = {
          magnet: 0xff4466, shield: 0x00aaff, jetpack: 0xff6600,
          multiplier: 0xaa00ff, hoverboard: 0x00ffaa,
        };
        const col = colors[type];
        const pulse = 0.8 + Math.sin(Date.now() * 0.004 + x) * 0.2;

        // Glow
        this.objGfx.fillStyle(col, 0.2 * pulse);
        this.objGfx.fillCircle(x, y, r * 1.8);
        // Main body
        this.objGfx.fillStyle(col, pulse);
        this.objGfx.fillCircle(x, y, r);
        this.objGfx.lineStyle(2, 0xffffff, 0.8);
        this.objGfx.strokeCircle(x, y, r);

        // Vector icon details
        this.objGfx.lineStyle(1.5 * scale, 0xffffff, 0.95);
        const size = 5.5 * scale;
        if (type === 'magnet') {
          // U-shape magnet
          this.objGfx.beginPath();
          this.objGfx.moveTo(x - size * 0.5, y - size);
          this.objGfx.lineTo(x - size * 0.5, y + size * 0.2);
          this.objGfx.arc(x, y + size * 0.2, size * 0.5, Math.PI, 0, true);
          this.objGfx.lineTo(x + size * 0.5, y - size);
          this.objGfx.strokePath();
        } else if (type === 'shield') {
          // Hexagonal shield outline
          this.objGfx.beginPath();
          this.objGfx.moveTo(x, y - size);
          this.objGfx.lineTo(x + size * 0.7, y - size * 0.4);
          this.objGfx.lineTo(x + size * 0.7, y + size * 0.4);
          this.objGfx.lineTo(x, y + size);
          this.objGfx.lineTo(x - size * 0.7, y + size * 0.4);
          this.objGfx.lineTo(x - size * 0.7, y - size * 0.4);
          this.objGfx.closePath();
          this.objGfx.strokePath();
        } else if (type === 'jetpack') {
          // Simple rocket shape
          this.objGfx.beginPath();
          this.objGfx.moveTo(x, y - size);
          this.objGfx.lineTo(x + size * 0.55, y + size * 0.55);
          this.objGfx.lineTo(x - size * 0.55, y + size * 0.55);
          this.objGfx.closePath();
          this.objGfx.strokePath();
        } else if (type === 'multiplier') {
          // X-mark cross
          this.objGfx.beginPath();
          this.objGfx.moveTo(x - size * 0.6, y - size * 0.6);
          this.objGfx.lineTo(x + size * 0.6, y + size * 0.6);
          this.objGfx.moveTo(x + size * 0.6, y - size * 0.6);
          this.objGfx.lineTo(x - size * 0.6, y + size * 0.6);
          this.objGfx.strokePath();
        } else if (type === 'hoverboard') {
          // Surfboard/hoverboard line
          this.objGfx.beginPath();
          this.objGfx.strokeEllipse(x, y, size * 1.1, size * 0.35);
        }
      }

      drawTrain(x: number, y: number, scale: number, sx: number) {
        const w = 82 * scale, h = 112 * scale;
        const rx = x - w / 2, ry = y - h;
        
        // 1. Shaded fuselage base (dark charcoal metallic)
        this.objGfx.fillStyle(0x0e111d, 0.95);
        this.objGfx.fillRect(rx, ry, w, h);
        
        // 2. Neon highlights and accent panelling (aerodynamic sloping cockpit lines)
        this.objGfx.lineStyle(1.5 * scale, 0x00d4ff, 0.85);
        this.objGfx.strokeRect(rx, ry, w, h);
        
        // Horizontal aerodynamic speed panels
        this.objGfx.fillStyle(0x192138, 0.9);
        this.objGfx.fillRect(rx + w * 0.1, ry + h * 0.1, w * 0.8, h * 0.8);
        this.objGfx.strokeRect(rx + w * 0.1, ry + h * 0.1, w * 0.8, h * 0.8);
        
        // 3. Cockpit windshield (glowing neon cyan angle shield)
        this.objGfx.fillStyle(0x00d4ff, 0.45);
        this.objGfx.beginPath();
        this.objGfx.moveTo(rx + w * 0.15, ry + h * 0.15);
        this.objGfx.lineTo(rx + w * 0.85, ry + h * 0.15);
        this.objGfx.lineTo(rx + w * 0.7, ry + h * 0.35);
        this.objGfx.lineTo(rx + w * 0.3, ry + h * 0.35);
        this.objGfx.closePath();
        this.objGfx.fillPath();
        this.objGfx.lineStyle(1.8 * scale, 0x00d4ff, 1);
        this.objGfx.strokePath();

        // 4. Passenger windows (grid style glowing lights)
        this.objGfx.fillStyle(0x00d4ff, 0.25);
        [0.46, 0.62, 0.78].forEach(wy => {
          this.objGfx.fillRect(rx + w * 0.2, ry + h * wy, w * 0.22, h * 0.08);
          this.objGfx.fillRect(rx + w * 0.58, ry + h * wy, w * 0.22, h * 0.08);
          this.objGfx.lineStyle(1 * scale, 0x00d4ff, 0.6);
          this.objGfx.strokeRect(rx + w * 0.2, ry + h * wy, w * 0.22, h * 0.08);
          this.objGfx.strokeRect(rx + w * 0.58, ry + h * wy, w * 0.22, h * 0.08);
        });

        // 5. Dual glowing headlights with light cones (casts a glow forward in perspective)
        const lightY = ry + h * 0.94;
        const beamH = 95 * scale;
        const beamW = 140 * scale;

        // Headlight beams
        this.objGfx.fillStyle(0xffff00, 0.08 * scale); // fade with perspective size
        this.objGfx.beginPath();
        this.objGfx.moveTo(x - w * 0.3, lightY);
        this.objGfx.lineTo(x - beamW * 0.4, lightY + beamH);
        this.objGfx.lineTo(x + beamW * 0.4, lightY + beamH);
        this.objGfx.lineTo(x + w * 0.3, lightY);
        this.objGfx.closePath();
        this.objGfx.fillPath();

        // Glowing headlight bulbs
        this.objGfx.fillStyle(0xffffff, 1);
        this.objGfx.fillCircle(x - w * 0.26, lightY, 4.5 * scale);
        this.objGfx.fillCircle(x + w * 0.26, lightY, 4.5 * scale);
        this.objGfx.lineStyle(1.5 * scale, 0xffff00, 1);
        this.objGfx.strokeCircle(x - w * 0.26, lightY, 5 * scale);
        this.objGfx.strokeCircle(x + w * 0.26, lightY, 5 * scale);
      }

      drawBarrier(x: number, y: number, scale: number, isHigh: boolean) {
        const w = 75 * scale, h = (isHigh ? 58 : 34) * scale;
        const rx = x - w / 2, ry = y - h;
        const laserCol = isHigh ? 0xff0055 : 0xff4400;

        // 1. Two side support pillars (metallic rods with colored neon rings)
        const poleW = 8 * scale;
        this.objGfx.fillStyle(0x1a1c24, 0.95);
        // Left pillar
        this.objGfx.fillRect(rx, ry, poleW, h);
        this.objGfx.lineStyle(1 * scale, laserCol, 0.8);
        this.objGfx.strokeRect(rx, ry, poleW, h);
        // Right pillar
        this.objGfx.fillRect(rx + w - poleW, ry, poleW, h);
        this.objGfx.strokeRect(rx + w - poleW, ry, poleW, h);

        // 2. Holographic laser wall mesh (glowing pink grid lines between pillars)
        this.objGfx.fillStyle(laserCol, 0.16);
        this.objGfx.fillRect(rx + poleW, ry + h * 0.15, w - poleW * 2, h * 0.7);

        this.objGfx.lineStyle(1 * scale, laserCol, 0.45);
        // Horizontal laser beams
        const beams = isHigh ? 4 : 2;
        for (let b = 0; b < beams; b++) {
          const by = ry + h * 0.15 + (h * 0.7) * (b / (beams - 1 || 1));
          this.objGfx.beginPath();
          this.objGfx.moveTo(rx + poleW, by);
          this.objGfx.lineTo(rx + w - poleW, by);
          this.objGfx.strokePath();
        }
        // Diagonal warning meshes
        this.objGfx.beginPath();
        this.objGfx.moveTo(rx + poleW, ry + h * 0.15);
        this.objGfx.lineTo(rx + w - poleW, ry + h * 0.85);
        this.objGfx.moveTo(rx + w - poleW, ry + h * 0.15);
        this.objGfx.lineTo(rx + poleW, ry + h * 0.85);
        this.objGfx.strokePath();

        // 3. Neon warning bar at the top
        this.objGfx.fillStyle(laserCol, 0.85);
        this.objGfx.fillRect(rx, ry, w, 4 * scale);
        this.objGfx.lineStyle(1 * scale, 0xffffff, 0.9);
        this.objGfx.strokeRect(rx, ry, w, 4 * scale);
      }

      drawPlayer(W: number, H: number, sx: number, sy: number) {
        const g = this.playerGfx;
        const isJetpacking = this.powerUps.jetpack > 0;
        const hasShield = this.powerUps.shield > 0;
        const hasHoverboard = this.powerUps.hoverboard > 0;

        const px = this.playerX + sx;
        const py = GROUND_Y + this.jumpY + sy;
        const bodyH = this.isSliding ? 22 : 42;

        // Shadow
        const shadowScale = 1 - Math.max(0, -this.jumpY) / 280;
        g.fillStyle(0x000000, 0.35 * shadowScale);
        g.fillEllipse(px, GROUND_Y + sy + 4, 38 * shadowScale, 9 * shadowScale);

        // Shield aura
        if (hasShield) {
          const pulse = 0.5 + Math.sin(Date.now() * 0.006) * 0.3;
          g.fillStyle(0x00aaff, 0.15 * pulse);
          g.fillCircle(px, py - bodyH / 2, 38);
          g.lineStyle(2, 0x00aaff, pulse);
          g.strokeCircle(px, py - bodyH / 2, 36);
        }

        // Draw Player Sprite
        if (this.playerSprite) {
          const baseScale = 0.115 * (W / 480);
          const verticalFactor = 1 - Math.max(0, -this.jumpY) / 750;
          const currentScale = baseScale * verticalFactor;

          this.playerSprite.setPosition(px, py).setVisible(this.playerAlive);

          if (this.isSliding) {
            this.playerSprite.setScale(currentScale * 1.15, currentScale * 0.55);
          } else {
            this.playerSprite.setScale(currentScale);
          }
        }

        // Surfboard sparkles
        const boardColor = hasHoverboard ? 0x00ffaa : (isJetpacking ? 0xff6600 : 0xff00ff);
        const boardAlpha = hasHoverboard ? 0.95 : 0.65;
        const boardWidth = hasHoverboard ? 48 : 38;

        if (this.gameState === 'RUNNING' && Math.random() < 0.28) {
          this.trailParticles.push({
            x: px - (Math.random() * 10 + 10),
            y: py + 2,
            vx: -2 - Math.random() * 2,
            vy: (Math.random() - 0.5) * 1,
            r: Math.random() * 3 + 1,
            color: boardColor,
            alpha: 0.6,
            life: 0.5,
          });
        }

        // Jetpack flames
        if (isJetpacking) {
          const flameColors = [0xff6600, 0xff9900, 0xffcc00];
          flameColors.forEach((col, i) => {
            g.fillStyle(col, 0.7 - i * 0.2);
            const fh = (20 + i * 8) * (0.8 + Math.random() * 0.4);
            g.fillTriangle(
              px - 8 + i * 6, py + 2,
              px - 14 + i * 6, py + fh,
              px - 2 + i * 6, py + fh * 0.7
            );
          });
        }

        // Underglow effect
        const glowCol = isJetpacking ? 0xff6600 : 0x00d4ff;
        g.fillStyle(glowCol, 0.15 + Math.sin(Date.now() * 0.005) * 0.08);
        g.fillEllipse(px, py + 2, boardWidth + 10, 14);
      }

      drawHUD(W: number, H: number) {
        // Top bar
        this.hudGfx.fillStyle(0x000022, 0.7);
        this.hudGfx.fillRect(0, 0, W, 80);
        // Bottom fade
        this.hudGfx.fillStyle(0x000000, 0.25);
        this.hudGfx.fillRect(0, H - 40, W, 40);

        // Power-up bar
        if (this.activePowerUpKeys.length > 0) {
          const barW = 160;
          const barH = 6;
          const barX = 16, barY = 50;
          const colors: Record<PowerUpType, number> = {
            magnet: 0xff4466, shield: 0x00aaff, jetpack: 0xff6600,
            multiplier: 0xaa00ff, hoverboard: 0x00ffaa,
          };
          const durations: Record<PowerUpType, number> = {
            magnet: 8000, shield: 6000, jetpack: 7000,
            multiplier: 10000, hoverboard: 5000,
          };
          this.activePowerUpKeys.forEach((k, i) => {
            const pct = this.powerUps[k] / durations[k];
            const by = barY + i * 22;
            this.hudGfx.fillStyle(0x222244, 0.8);
            this.hudGfx.fillRect(barX + 22, by + 2, barW, barH);
            this.hudGfx.fillStyle(colors[k], 0.9);
            this.hudGfx.fillRect(barX + 22, by + 2, barW * pct, barH);
            this.hudGfx.lineStyle(1, colors[k], 0.6);
            this.hudGfx.strokeRect(barX + 22, by + 2, barW, barH);
          });
        }

        // Speed indicator (right side)
        const speedPct = (this.speed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
        const sBarH = 80;
        const sBarX = W - 22, sBarY = H - sBarH - 20;
        this.hudGfx.fillStyle(0x222244, 0.8);
        this.hudGfx.fillRect(sBarX, sBarY, 8, sBarH);
        const col = speedPct < 0.5 ? 0x00d4ff : (speedPct < 0.8 ? 0xffaa00 : 0xff0044);
        this.hudGfx.fillStyle(col, 0.9);
        this.hudGfx.fillRect(sBarX, sBarY + sBarH * (1 - speedPct), 8, sBarH * speedPct);
        this.hudGfx.lineStyle(1, col, 0.6);
        this.hudGfx.strokeRect(sBarX, sBarY, 8, sBarH);
      }

    }; // end class
  }
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface TrackObject {
  type: string;
  lane: number;
  extraLane?: number;
  t: number;  // 0 = horizon, 1 = player ground level
  active: boolean;
  collected: boolean;
  sprite?: any;
}

interface FxParticle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: number;
  alpha: number;
  life: number;  // 0-1
}

interface Star {
  x: number; y: number;
  r: number; alpha: number; speed: number;
}
