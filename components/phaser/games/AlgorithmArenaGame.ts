// Algorithm Arena — Cyberpunk Math Auto-Battler Game
// Register key: 'algorithm-arena' in PhaserGameEngineV2.tsx

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSynth(frequency: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', duration: number = 0.1, gainValue: number = 0.1) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(gainValue, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context sound failed:", e);
  }
}

function playSweep(startFreq: number, endFreq: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', gainVal: number = 0.1) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    
    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Sweep sound failed:", e);
  }
}

interface Unit {
  value: number; // 1-9
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  isPrime: boolean;
  isEven: boolean;
}

interface EnemyNode {
  name: string;
  stage: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  description: string;
  vulnerability: string;
}

const CAMPAIGN_STAGES: EnemyNode[] = [
  { name: 'Digit Drone', stage: 1, hp: 55, maxHp: 55, attack: 4, defense: 3, description: 'Basic matrix digit drone. Weak against high math.', vulnerability: 'None' },
  { name: 'Fraction Fiend', stage: 2, hp: 110, maxHp: 110, attack: 7, defense: 6, description: 'Hates Prime numbers. Absorb status passive.', vulnerability: 'Prime Numbers (Double Attack Speed)' },
  { name: 'Matrix Mech', stage: 3, hp: 180, maxHp: 180, attack: 11, defense: 10, description: 'Armored matrix construct. Heavy defense grid.', vulnerability: 'Even Sequences (Shreds 50% Armor)' },
  { name: 'Vector Viper', stage: 4, hp: 270, maxHp: 270, attack: 16, defense: 15, description: 'Extremely fast. Evades simple numbers.', vulnerability: 'Odd Sequences (+50% Crit Chance)' },
  { name: 'Infinity Core', stage: 5, hp: 420, maxHp: 420, attack: 22, defense: 22, description: 'The absolute matrix core. Boss of the grid.', vulnerability: 'Fibonacci Sequence (Ignore Defense)' }
];

export default class AlgorithmArenaGameFactory {
  static create(PhaserLib: any) {
    
    // Shared Roguelike Run Context
    const runState = {
      gold: 15,
      hp: 100,
      maxHp: 100,
      stage: 1,
      unlockedUpgrades: {
        maxHp: 0,
        atk: 0,
        def: 0
      },
      inventory: [
        { type: 'unit', value: 2 } as any,
        { type: 'unit', value: 3 },
        { type: 'operator', value: '+' }
      ],
      board: [
        { type: 'unit', value: 5 },
        { type: 'operator', value: '×' },
        { type: 'unit', value: 3 },
        { type: 'operator', value: '-' },
        { type: 'unit', value: 2 }
      ]
    };

    const isPrime = (n: number) => [2, 3, 5, 7].includes(n);

    const createCyberBackground = (scene: any) => {
      const W = scene.scale.width;
      const H = scene.scale.height;

      const bg = scene.add.graphics();
      bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3a, 0x1a1a3a, 1);
      bg.fillRect(0, 0, W, H);
      
      if (!scene.textures.exists('cyber-grid-tex')) {
        const canvasTexture = scene.textures.createCanvas('cyber-grid-tex', 64, 64);
        const ctx = canvasTexture.context;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 64);
        ctx.lineTo(64, 64);
        ctx.lineTo(64, 0);
        ctx.stroke();
        canvasTexture.refresh();
      }

      if (!scene.textures.exists('tiny-star-tex')) {
        const canvasTexture = scene.textures.createCanvas('tiny-star-tex', 4, 4);
        const ctx = canvasTexture.context;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(0, 0, 4, 4);
        canvasTexture.refresh();
      }

      const grid = scene.add.tileSprite(W/2, H/2, W, H, 'cyber-grid-tex');
      grid.setAlpha(0.6);
      
      scene.tweens.add({
        targets: grid,
        tilePositionX: 64,
        tilePositionY: 64,
        duration: 3000,
        loop: -1,
        ease: 'Linear'
      });

      scene.add.particles(0, 0, 'tiny-star-tex', {
        x: { min: 0, max: W },
        y: { min: H, max: H + 100 },
        speedY: { min: -10, max: -40 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        frequency: 300,
        lifespan: 8000
      });
    };

    // =========================================================================
    // 1. MENU SCENE
    // =========================================================================
    class MenuScene extends PhaserLib.Scene {
      constructor() { super({ key: 'Menu' }); }
      
      init() {
        // Reset run state on menu entry
        runState.gold = 15;
        runState.hp = 100;
        runState.maxHp = 100;
        runState.stage = 1;
        runState.unlockedUpgrades = { maxHp: 0, atk: 0, def: 0 };
        runState.inventory = [
          { type: 'unit', value: 2 },
          { type: 'unit', value: 3 },
          { type: 'operator', value: '+' }
        ];
        runState.board = [
          { type: 'unit', value: 5 },
          { type: 'operator', value: '×' },
          { type: 'unit', value: 3 },
          { type: 'operator', value: '-' },
          { type: 'unit', value: 2 }
        ];
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        createCyberBackground(this);

        // Pulsing Main Title
        const titleText = this.add.text(W / 2, 130, 'ALGORITHM ARENA', {
          fontFamily: 'Orbitron, monospace', fontSize: '38px', color: '#00ffff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ffff', 12, true, true);

        this.tweens.add({
          targets: titleText,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 1000,
          yoyo: true,
          loop: -1
        });

        this.add.text(W / 2, 180, 'MATHEMATICAL ROGUELIKE AUTO-BATTLER', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ff00ff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff00ff', 6, true, true);

        // Menu Buttons
        this.createMenuButton(W / 2, 260, 'START SOLO CAMPAIGN', '#00ff66', () => {
          playSweep(440, 880, 0.15, 'sine', 0.1);
          this.scene.start('CampaignMap');
        });

        this.createMenuButton(W / 2, 330, 'SEASONAL LEADERBOARD', '#ff0080', () => {
          playSweep(440, 880, 0.15, 'sine', 0.1);
          this.scene.start('Leaderboard');
        });

        this.createMenuButton(W / 2, 400, 'HOW TO PLAY', '#ffea00', () => {
          playSweep(440, 880, 0.15, 'sine', 0.1);
          this.showInstructionsOverlay();
        });

        // Version notice
        this.add.text(W / 2, H - 30, 'v1.0.4 Seasonal — Cyberpunk Math Core', {
          fontFamily: 'monospace', fontSize: '11px', color: '#404060'
        }).setOrigin(0.5);
      }

      createMenuButton(x: number, y: number, label: string, color: string, callback: () => void) {
        const btn = this.add.rectangle(x, y, 320, 44, 0x0c0c16, 0.9)
          .setStrokeStyle(1.5, PhaserLib.Display.Color.HexStringToColor(color).color)
          .setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: color, fontWeight: 'bold'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
          playSynth(440, 'triangle', 0.05, 0.05);
          btn.setFillStyle(0x18182b, 0.95);
          txt.setScale(1.05);
        });

        btn.on('pointerout', () => {
          btn.setFillStyle(0x0c0c16, 0.9);
          txt.setScale(1);
        });

        btn.on('pointerdown', callback);
      }

      showInstructionsOverlay() {
        const W = this.scale.width;
        const H = this.scale.height;
        const panel = this.add.rectangle(W / 2, H / 2, 540, 380, 0x05050f, 0.98)
          .setStrokeStyle(2, 0xffea00);

        const title = this.add.text(W / 2, H / 2 - 150, 'GRID ALGEBRA PROTOCOLS', {
          fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5);

        const desc = this.add.text(W / 2 - 240, H / 2 - 100, 
          '• DRAFT PHASE: Purchase Number Units (1-9) & Operators (+, -, ×, ÷, √).\n' +
          '• EQUATION SLOTS: Place tiles to form: [Unit] [Op] [Unit] [Op] [Unit].\n' +
          '• PRECEDENCE: Math formulas evaluate algebraic precedence rules.\n' +
          '  Example: 5 + 3 × 2 = 11 (Not 16! Multiplications process first).\n' +
          '• √ OPERATOR: Square root modifies adjacent numbers: A √ B = A × sqrt(B).\n' +
          '• SYNERGIES: Draft matches to activate multiplier grids:\n' +
          '  - ALL PRIMES (2, 3, 5, 7)  —  [2.0x Double Damage]\n' +
          '  - ALL EVENS (2, 4, 6, 8)   —  [Shield: +50% Defense Boost]\n' +
          '  - ALL ODDS (1, 3, 5, 7, 9) —  [Fury: +50% Attack Speed]\n' +
          '  - FIBONACCI SUM (e.g. 2,3,5)—  [Surge: Ignore Enemy Defense]\n' +
          '• AUTO-COMBAT: Click battle, formulas automatically clash boss core!', {
          fontFamily: 'monospace', fontSize: '12px', color: '#a0a0c0', lineSpacing: 8
        });

        const closeBtn = this.add.rectangle(W / 2, H / 2 + 140, 140, 36, 0x1c1c30)
          .setStrokeStyle(1.5, 0xffea00)
          .setInteractive({ useHandCursor: true });

        const closeTxt = this.add.text(W / 2, H / 2 + 140, 'DISMISS', {
          fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5);

        const cleanup = () => {
          playSweep(600, 300, 0.1, 'sine', 0.05);
          panel.destroy();
          title.destroy();
          desc.destroy();
          closeBtn.destroy();
          closeTxt.destroy();
        };

        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x2d2d48));
        closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x1c1c30));
        closeBtn.on('pointerdown', cleanup);
      }
    }

    // =========================================================================
    // 2. CAMPAIGN MAP SCENE
    // =========================================================================
    class CampaignMapScene extends PhaserLib.Scene {
      bgGraphics!: Phaser.GameObjects.Graphics;
      constructor() { super({ key: 'CampaignMap' }); }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.bgGraphics = this.add.graphics();
        createCyberBackground(this);

        this.add.text(W / 2, 45, 'ROGUELIKE CAMPAIGN MAP', {
          fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#00ff66', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ff6 green', 6, true, true);

        // Draw Player HP and Gold info
        this.add.text(40, 35, `CORE HP: ${runState.hp}/${runState.maxHp}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ff00ff', fontWeight: 'bold'
        });

        this.add.text(W - 40, 35, `GOLD: ${runState.gold}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(1, 0);

        // Render nodes
        const nodeXSpacing = (W - 160) / 4;
        CAMPAIGN_STAGES.forEach((stage, index) => {
          const nx = 80 + index * nodeXSpacing;
          const ny = H / 2 - 20;

          // Draw links to next node
          if (index < CAMPAIGN_STAGES.length - 1) {
            this.bgGraphics.lineStyle(2, 0x1e2f23, 0.6);
            this.bgGraphics.lineBetween(nx, ny, nx + nodeXSpacing, ny);
          }

          const isActive = runState.stage === stage.stage;
          const isCompleted = runState.stage > stage.stage;

          const color = isCompleted ? 0x00ff66 : (isActive ? 0x00ffff : 0x404060);
          const strokeColor = isCompleted ? 0x00ff66 : (isActive ? 0x00ffff : 0x222233);

          const circle = this.add.circle(nx, ny, 24, color, isActive ? 0.35 : 0.1)
            .setStrokeStyle(2, strokeColor);

          this.add.text(nx, ny, `${stage.stage}`, {
            fontFamily: 'Orbitron, monospace', fontSize: '14px', color: isCompleted ? '#00ff66' : (isActive ? '#00ffff' : '#505070'), fontWeight: 'bold'
          }).setOrigin(0.5);

          // Name and status below
          this.add.text(nx, ny + 40, stage.name, {
            fontFamily: 'Orbitron, monospace', fontSize: '10px', color: isActive ? '#00ffff' : '#8080a0', fontWeight: 'bold'
          }).setOrigin(0.5);

          if (isActive) {
            circle.setInteractive({ useHandCursor: true });
            
            // Pulse active node
            this.tweens.add({
              targets: circle,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 800,
              yoyo: true,
              loop: -1
            });

            // Boss Info Panel
            const card = this.add.rectangle(W / 2, H - 110, 480, 100, 0x080814, 0.95)
              .setStrokeStyle(1.5, 0x00ffff);
            
            this.add.text(W / 2 - 220, H - 145, `STAGE ${stage.stage} ACTIVE TARGET: ${stage.name}`, {
              fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#00ffff', fontWeight: 'bold'
            });

            this.add.text(W / 2 - 220, H - 125, `HP: ${stage.hp} | ATK: ${stage.attack} | DEF: ${stage.defense}\n${stage.description}\nVulnerability: ${stage.vulnerability}`, {
              fontFamily: 'monospace', fontSize: '10px', color: '#9090b0', lineSpacing: 4
            });

            const enterBtn = this.add.rectangle(W / 2 + 160, H - 110, 110, 36, 0x00ff66, 0.2)
              .setStrokeStyle(1.5, 0x00ff66)
              .setInteractive({ useHandCursor: true });

            const enterTxt = this.add.text(W / 2 + 160, H - 110, 'ENTER DRAFT', {
              fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#00ff66', fontWeight: 'bold'
            }).setOrigin(0.5);

            enterBtn.on('pointerover', () => enterBtn.setFillStyle(0x00ff66, 0.4));
            enterBtn.on('pointerout', () => enterBtn.setFillStyle(0x00ff66, 0.2));
            enterBtn.on('pointerdown', () => {
              playSweep(440, 880, 0.15, 'sine', 0.1);
              this.scene.start('Draft');
            });
          }
        });

        // Return to main menu button
        const backBtn = this.add.rectangle(80, H - 40, 110, 30, 0x141424)
          .setStrokeStyle(1, 0xff00ff)
          .setInteractive({ useHandCursor: true });
        
        const backTxt = this.add.text(80, H - 40, 'ABORT RUN', {
          fontFamily: 'Orbitron, monospace', fontSize: '10px', color: '#ff00ff'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
          playSweep(600, 300, 0.1, 'sine', 0.05);
          this.scene.start('Menu');
        });
      }

    }

    // =========================================================================
    // 3. DRAFT SCENE
    // =========================================================================
    class DraftScene extends PhaserLib.Scene {
      shopItems!: any[];
      inventoryGroup!: Phaser.GameObjects.Group;
      boardGroup!: Phaser.GameObjects.Group;
      evalText!: Phaser.GameObjects.Text;
      synergyText!: Phaser.GameObjects.Text;
      creditsText!: Phaser.GameObjects.Text;

      activeSelection: any = null; // tracking clicked tile to place on board

      constructor() { super({ key: 'Draft' }); }

      init() {
        this.shopItems = [];
        this.generateShop();
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;
        createCyberBackground(this);

        this.add.text(W / 2, 35, `DRAFT LAB — STAGE ${runState.stage}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#00ffff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ffff', 6, true, true);

        this.creditsText = this.add.text(W - 40, 35, `CREDITS: ${runState.gold}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(1, 0);

        this.inventoryGroup = this.add.group();
        this.boardGroup = this.add.group();

        // 1. Render Shop Area
        this.add.text(40, 80, 'CODE DRAFT MARKET', {
          fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#a0a0c0', fontWeight: 'bold'
        });
        
        this.renderShop();

        // Reroll Shop button
        const rerollBtn = this.add.rectangle(660, 135, 100, 36, 0x1a111a)
          .setStrokeStyle(1.5, 0xff00ff)
          .setInteractive({ useHandCursor: true });
        const rerollTxt = this.add.text(660, 135, 'ROLL [1g]', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ff00ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        rerollBtn.on('pointerdown', () => {
          if (runState.gold >= 1) {
            runState.gold -= 1;
            playSweep(500, 800, 0.12, 'sine', 0.08);
            this.generateShop();
            this.renderShop();
            this.updateCreditsText();
          } else {
            playSynth(150, 'sawtooth', 0.15, 0.1);
          }
        });

        // 2. Render Board slots placement (horizontal row)
        this.add.text(40, 210, 'ACTIVE CALCULATION GRID', {
          fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#a0a0c0', fontWeight: 'bold'
        });

        this.renderBoardSlots();

        // Evaluator text
        this.evalText = this.add.text(W / 2, 305, 'Equation: ...', {
          fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#00ff66', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ff66', 8, true, true);

        // Synergy display
        this.synergyText = this.add.text(W / 2, 332, 'Synergies: None', {
          fontFamily: 'monospace', fontSize: '11px', color: '#9090b0'
        }).setOrigin(0.5);

        // 3. Render Inventory area
        this.add.text(40, 350, 'TILE CACHE (Click a tile, then click a slot to place it)', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#8080a0', fontWeight: 'bold'
        });

        this.renderInventory();

        // 4. Upgrade permanent stats
        this.add.text(W - 220, 350, 'STAT COMPILER UPGRADES', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#8080a0', fontWeight: 'bold'
        });

        this.renderUpgrades();

        // 5. Start Battle button
        const startBtn = this.add.rectangle(W / 2, H - 45, 240, 44, 0x052d14)
          .setStrokeStyle(2, 0x00ff66)
          .setInteractive({ useHandCursor: true });

        const startTxt = this.add.text(W / 2, H - 45, 'INITIALIZE BATTLE', {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#00ff66', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ff66', 6, true, true);

        startBtn.on('pointerover', () => {
          startBtn.setFillStyle(0x0c4c23);
          startTxt.setScale(1.05);
        });

        startBtn.on('pointerout', () => {
          startBtn.setFillStyle(0x052d14);
          startTxt.setScale(1);
        });

        startBtn.on('pointerdown', () => {
          // Verify board has all slots filled
          const missing = runState.board.some(slot => slot.value === undefined);
          if (missing) {
            playSynth(150, 'sawtooth', 0.2, 0.12);
            this.evalText.setText('ERROR: FILL ALL BOARD SLOTS BEFORE COMMENCING!');
            this.evalText.setColor('#ff3355');
            this.time.delayedCall(1500, () => {
              this.updateEvaluation();
            });
            return;
          }
          playSweep(300, 900, 0.35, 'sawtooth', 0.15);
          this.scene.start('Battle');
        });

        this.updateEvaluation();
      }

      generateShop() {
        this.shopItems = [];
        // Generate 3 random units (value 1-9)
        for (let i = 0; i < 3; i++) {
          const val = PhaserLib.Math.Between(1, 9);
          this.shopItems.push({ type: 'unit', value: val, cost: 3 });
        }
        // Generate 2 random operators (+, -, ×, ÷, √)
        const ops = ['+', '-', '×', '÷', '√'];
        for (let i = 0; i < 2; i++) {
          const op = ops[PhaserLib.Math.Between(0, ops.length - 1)];
          this.shopItems.push({ type: 'operator', value: op, cost: 2 });
        }
      }

      renderShop() {
        const W = this.scale.width;
        // Clean old shop displays
        if ((this as any).shopViews) {
          (this as any).shopViews.forEach((v: any) => v.destroy());
        }
        (this as any).shopViews = [];

        this.shopItems.forEach((item, index) => {
          const sx = 90 + index * 115;
          const sy = 135;

          const color = item.type === 'unit' ? 0x00d4ff : 0xff00ff;
          const bg = this.add.rectangle(sx, sy, 90, 70, 0x090914, 0.95)
            .setStrokeStyle(1.5, color)
            .setInteractive({ useHandCursor: true });

          const mainTextStr = item.value.toString();
          const mainTxt = this.add.text(sx, sy - 12, mainTextStr, {
            fontFamily: 'Orbitron, monospace', fontSize: '22px', color: item.type === 'unit' ? '#00d4ff' : '#ff00ff', fontWeight: 'bold'
          }).setOrigin(0.5);

          const costTxt = this.add.text(sx, sy + 18, `Cost: ${item.cost}g`, {
            fontFamily: 'monospace', fontSize: '10px', color: '#ffea00'
          }).setOrigin(0.5);

          const typeTxtStr = item.type === 'unit' 
            ? (isPrime(item.value) ? 'PRIME' : (item.value % 2 === 0 ? 'EVEN' : 'ODD'))
            : 'OPERATOR';
          const typeTxt = this.add.text(sx, sy - 28, typeTxtStr, {
            fontFamily: 'monospace', fontSize: '8px', color: '#707090'
          }).setOrigin(0.5);

          bg.on('pointerover', () => bg.setStrokeStyle(2.5, 0xffea00));
          bg.on('pointerout', () => bg.setStrokeStyle(1.5, color));

          bg.on('pointerdown', () => {
            if (runState.gold >= item.cost) {
              runState.gold -= item.cost;
              playSweep(800, 1200, 0.15, 'sine', 0.08);
              runState.inventory.push({ type: item.type, value: item.value });
              
              // Remove item from shop
              this.shopItems.splice(index, 1);
              this.renderShop();
              this.renderInventory();
              this.updateCreditsText();
            } else {
              playSynth(150, 'sawtooth', 0.15, 0.1);
            }
          });

          (this as any).shopViews.push(bg, mainTxt, costTxt, typeTxt);
        });
      }

      renderBoardSlots() {
        const W = this.scale.width;
        // Clean
        this.boardGroup.clear(true, true);

        for (let i = 0; i < 5; i++) {
          const sx = 120 + i * 140;
          const sy = 250;

          const isUnitSlot = i % 2 === 0;
          const activeValue = runState.board[i]?.value;

          const color = isUnitSlot ? 0x00ff66 : 0xffea00;
          const slotBg = this.add.rectangle(sx, sy, 110, 56, activeValue !== undefined ? 0x0b1a13 : 0x08080f, 0.9)
            .setStrokeStyle(1.5, color)
            .setInteractive({ useHandCursor: true });

          this.boardGroup.add(slotBg);

          if (activeValue !== undefined) {
            const txt = this.add.text(sx, sy, activeValue.toString(), {
              fontFamily: 'Orbitron, monospace', fontSize: '22px', color: isUnitSlot ? '#00ff66' : '#ffea00', fontWeight: 'bold'
            }).setOrigin(0.5);
            this.boardGroup.add(txt);
          } else {
            const txt = this.add.text(sx, sy, isUnitSlot ? '[UNIT]' : '[OP]', {
              fontFamily: 'monospace', fontSize: '10px', color: '#404060'
            }).setOrigin(0.5);
            this.boardGroup.add(txt);
          }

          slotBg.on('pointerover', () => slotBg.setStrokeStyle(2.5, 0xffffff));
          slotBg.on('pointerout', () => slotBg.setStrokeStyle(1.5, color));

          slotBg.on('pointerdown', () => {
            // If we have an active selection clicked from inventory, try to place it
            if (this.activeSelection) {
              const sel = this.activeSelection;
              const matchesType = (isUnitSlot && sel.item.type === 'unit') || (!isUnitSlot && sel.item.type === 'operator');
              
              if (matchesType) {
                playSynth(880, 'sine', 0.08, 0.08);
                // Return existing board item if present
                if (runState.board[i] && runState.board[i].value !== undefined) {
                  runState.inventory.push({ type: runState.board[i].type, value: runState.board[i].value });
                }
                // Assign new board item
                runState.board[i] = { type: sel.item.type, value: sel.item.value };
                // Remove from inventory
                runState.inventory.splice(sel.index, 1);
                
                this.activeSelection = null;
                this.renderInventory();
                this.renderBoardSlots();
                this.updateEvaluation();
              } else {
                playSynth(150, 'sawtooth', 0.15, 0.1);
              }
            } else {
              // Clicked to remove from board back to inventory
              if (activeValue !== undefined) {
                playSynth(440, 'sine', 0.08, 0.08);
                runState.inventory.push({ type: runState.board[i].type, value: runState.board[i].value });
                runState.board[i] = { type: isUnitSlot ? 'unit' : 'operator', value: undefined as any };
                
                this.renderInventory();
                this.renderBoardSlots();
                this.updateEvaluation();
              }
            }
          });
        }
      }

      renderInventory() {
        // Clean
        this.inventoryGroup.clear(true, true);

        const rowLimit = 5;
        runState.inventory.forEach((item, index) => {
          const col = index % rowLimit;
          const row = Math.floor(index / rowLimit);

          const sx = 80 + col * 90;
          const sy = 390 + row * 52;

          const isSelected = this.activeSelection && this.activeSelection.index === index;

          const color = item.type === 'unit' ? 0x00d4ff : 0xff00ff;
          const strokeColor = isSelected ? 0xffea00 : color;

          const tile = this.add.rectangle(sx, sy, 76, 46, 0x0d0d18, 0.95)
            .setStrokeStyle(isSelected ? 2.5 : 1.5, strokeColor)
            .setInteractive({ useHandCursor: true });

          const txt = this.add.text(sx, sy, item.value.toString(), {
            fontFamily: 'Orbitron, monospace', fontSize: '18px', color: item.type === 'unit' ? '#00d4ff' : '#ff00ff', fontWeight: 'bold'
          }).setOrigin(0.5);

          this.inventoryGroup.add(tile);
          this.inventoryGroup.add(txt);

          tile.on('pointerover', () => tile.setStrokeStyle(2, 0xffffff));
          tile.on('pointerout', () => tile.setStrokeStyle(isSelected ? 2.5 : 1.5, strokeColor));

          tile.on('pointerdown', () => {
            if (isSelected) {
              this.activeSelection = null;
            } else {
              playSynth(600, 'triangle', 0.05, 0.05);
              this.activeSelection = { item, index };
            }
            this.renderInventory();
          });
        });
      }

      renderUpgrades() {
        const W = this.scale.width;
        if ((this as any).upgradeViews) {
          (this as any).upgradeViews.forEach((v: any) => v.destroy());
        }
        (this as any).upgradeViews = [];

        const upgrades = [
          { key: 'maxHp', name: 'COMPILER HP (+20)', cost: 4, action: () => {
            runState.maxHp += 20;
            runState.hp += 20;
            runState.unlockedUpgrades.maxHp++;
          }},
          { key: 'atk', name: 'CORE ATTACK (+2)', cost: 5, action: () => {
            runState.unlockedUpgrades.atk++;
          }},
          { key: 'def', name: 'CORE DEFENSE (+1)', cost: 5, action: () => {
            runState.unlockedUpgrades.def++;
          }}
        ];

        upgrades.forEach((up, index) => {
          const sx = W - 140;
          const sy = 390 + index * 38;

          const btn = this.add.rectangle(sx, sy, 180, 32, 0x09140d, 0.9)
            .setStrokeStyle(1, 0x00ff66)
            .setInteractive({ useHandCursor: true });

          const txt = this.add.text(sx, sy, `${up.name} [${up.cost}g]`, {
            fontFamily: 'monospace', fontSize: '9px', color: '#00ff66', fontWeight: 'bold'
          }).setOrigin(0.5);

          btn.on('pointerover', () => btn.setStrokeStyle(1.5, 0xffffff));
          btn.on('pointerout', () => btn.setStrokeStyle(1, 0x00ff66));

          btn.on('pointerdown', () => {
            if (runState.gold >= up.cost) {
              runState.gold -= up.cost;
              playSweep(600, 1000, 0.18, 'sine', 0.08);
              up.action();
              this.renderUpgrades();
              this.updateCreditsText();
            } else {
              playSynth(150, 'sawtooth', 0.15, 0.1);
            }
          });

          (this as any).upgradeViews.push(btn, txt);
        });
      }

      updateCreditsText() {
        this.creditsText.setText(`CREDITS: ${runState.gold}`);
      }

      updateEvaluation() {
        const u1 = runState.board[0]?.value as number;
        const op1 = runState.board[1]?.value as string;
        const u2 = runState.board[2]?.value as number;
        const op2 = runState.board[3]?.value as string;
        const u3 = runState.board[4]?.value as number;

        if (u1 === undefined || op1 === undefined || u2 === undefined || op2 === undefined || u3 === undefined) {
          this.evalText.setText('Equation: [Pending Placement]');
          this.evalText.setColor('#404060');
          this.synergyText.setText('Synergies: None');
          this.synergyText.setColor('#606080');
          return;
        }

        // Evaluate formula
        const getPrecedence = (op: string) => {
          if (op === '×' || op === '÷' || op === '√') return 2;
          if (op === '+' || op === '-') return 1;
          return 0;
        };

        const calc = (a: number, op: string, b: number): number => {
          if (op === '+') return a + b;
          if (op === '-') return a - b;
          if (op === '×') return a * b;
          if (op === '÷') return b !== 0 ? Math.round(a / b) : a;
          if (op === '√') return Math.round(a * Math.sqrt(b));
          return a;
        };

        let result = 0;
        const p1 = getPrecedence(op1);
        const p2 = getPrecedence(op2);

        if (p2 > p1) {
          const right = calc(u2, op2, u3);
          result = calc(u1, op1, right);
        } else {
          const left = calc(u1, op1, u2);
          result = calc(left, op2, u3);
        }

        // Ensure damage doesn't go below 1
        result = Math.max(1, result);

        // Check synergies
        const synergies = [];
        let dmgMultiplier = 1.0;

        // 1. Prime Synergy (All Primes)
        if (isPrime(u1) && isPrime(u2) && isPrime(u3)) {
          synergies.push('PRIME MASTERY (2.0x Damage)');
          dmgMultiplier *= 2.0;
        }

        // 2. Even Shield
        if (u1 % 2 === 0 && u2 % 2 === 0 && u3 % 2 === 0) {
          synergies.push('EVEN SHIELD (+50% DEF)');
        }

        // 3. Odd Fury
        if (u1 % 2 !== 0 && u2 % 2 !== 0 && u3 % 2 !== 0) {
          synergies.push('ODD FURY (+50% ATK)');
        }

        // 4. Fibonacci Sequence
        const sorted = [u1, u2, u3].sort((a,b)=>a-b);
        if (sorted[0] + sorted[1] === sorted[2] && sorted[0] > 0) {
          synergies.push('FIBONACCI SURGE (Ignore Defense)');
        }

        const synergyStr = synergies.length > 0 ? synergies.join('  |  ') : 'None';
        this.synergyText.setText(`Synergies: ${synergyStr}`);
        this.synergyText.setColor(synergies.length > 0 ? '#ffea00' : '#606080');

        const finalDmg = Math.round(result * dmgMultiplier);
        this.evalText.setText(`Formula: ${u1} ${op1} ${u2} ${op2} ${u3} = ${finalDmg} Core DMG`);
        this.evalText.setColor('#00ff66');
      }
    }

    // =========================================================================
    // 4. BATTLE SCENE
    // =========================================================================
    class BattleScene extends PhaserLib.Scene {
      bgGraphics!: Phaser.GameObjects.Graphics;
      
      playerUnits!: Phaser.GameObjects.Container[];
      bossSprite!: Phaser.GameObjects.Container;

      playerHpText!: Phaser.GameObjects.Text;
      bossHpText!: Phaser.GameObjects.Text;

      playerTotalHp!: number;
      bossMaxHp!: number;
      bossHp!: number;

      damagePerCycle!: number;
      battleTimer!: Phaser.Time.TimerEvent;

      synergiesActive!: string[];

      constructor() { super({ key: 'Battle' }); }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        createCyberBackground(this);

        // 1. Load active campaign boss details
        const bossInfo = CAMPAIGN_STAGES.find(s => s.stage === runState.stage)!;
        this.bossMaxHp = bossInfo.hp;
        this.bossHp = bossInfo.hp;

        // 2. Load player equation and evaluate stats
        const u1 = runState.board[0].value as number;
        const op1 = runState.board[1].value as string;
        const u2 = runState.board[2].value as number;
        const op2 = runState.board[3].value as string;
        const u3 = runState.board[4].value as number;

        // Evaluate core formula value
        const getPrecedence = (op: string) => {
          if (op === '×' || op === '÷' || op === '√') return 2;
          if (op === '+' || op === '-') return 1;
          return 0;
        };

        const calc = (a: number, op: string, b: number): number => {
          if (op === '+') return a + b;
          if (op === '-') return a - b;
          if (op === '×') return a * b;
          if (op === '÷') return b !== 0 ? Math.round(a / b) : a;
          if (op === '√') return Math.round(a * Math.sqrt(b));
          return a;
        };

        let formulaResult = 0;
        const p1 = getPrecedence(op1);
        const p2 = getPrecedence(op2);

        if (p2 > p1) {
          const right = calc(u2, op2, u3);
          formulaResult = calc(u1, op1, right);
        } else {
          const left = calc(u1, op1, u2);
          formulaResult = calc(left, op2, u3);
        }

        formulaResult = Math.max(1, formulaResult);

        // Check active synergies
        this.synergiesActive = [];
        let dmgMultiplier = 1.0;
        let defenseMultiplier = 1.0;
        let speedMultiplier = 1.0;
        let ignoreDefense = false;

        if (isPrime(u1) && isPrime(u2) && isPrime(u3)) {
          dmgMultiplier *= 2.0;
          this.synergiesActive.push('Prime');
        }
        if (u1 % 2 === 0 && u2 % 2 === 0 && u3 % 2 === 0) {
          defenseMultiplier *= 1.5;
          this.synergiesActive.push('Even');
        }
        if (u1 % 2 !== 0 && u2 % 2 !== 0 && u3 % 2 !== 0) {
          speedMultiplier *= 1.5;
          this.synergiesActive.push('Odd');
        }
        const sorted = [u1, u2, u3].sort((a,b)=>a-b);
        if (sorted[0] + sorted[1] === sorted[2] && sorted[0] > 0) {
          ignoreDefense = true;
          this.synergiesActive.push('Fibonacci');
        }

        // Apply compiler upgrades
        const upgradeAtk = runState.unlockedUpgrades.atk * 2;
        const upgradeDef = runState.unlockedUpgrades.def * 1;

        // Calculate core math statistics
        this.damagePerCycle = Math.round(formulaResult * dmgMultiplier) + upgradeAtk;
        const playerDefense = Math.round(5 * defenseMultiplier) + upgradeDef;
        this.playerTotalHp = runState.hp;

        // Visual header
        this.add.text(W / 2, 30, `ENGAGING BOSS GRID: ${bossInfo.name.toUpperCase()}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '15px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 6, true, true);

        // Render Active equation formula as a HUD overlay
        this.add.text(W / 2, 60, `CALCULATION: ${u1} ${op1} ${u2} ${op2} ${u3} = ${this.damagePerCycle} DMG`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#00ffff'
        }).setOrigin(0.5);

        // 3. Render Player Units on Grid (left side)
        this.playerUnits = [];
        const unitValues = [u1, u2, u3];
        const unitColors = [0x00d4ff, 0x00ff66, 0xffea00];

        unitValues.forEach((val, idx) => {
          const ux = 150;
          const uy = 180 + idx * 130;

          const container = this.add.container(ux, uy);
          
          const circ = this.add.circle(0, 0, 32, unitColors[idx], 0.25)
            .setStrokeStyle(2, unitColors[idx]);
          
          const txt = this.add.text(0, 0, val.toString(), {
            fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#ffffff', fontWeight: 'bold'
          }).setOrigin(0.5);

          // face/brackets
          const eyes = this.add.text(0, -14, '⬡ ⬡', {
            fontFamily: 'monospace', fontSize: '8px', color: '#ffffff'
          }).setOrigin(0.5);

          container.add([circ, txt, eyes]);
          this.playerUnits.push(container);

          // Idle hover tweens
          this.tweens.add({
            targets: container,
            y: uy + 8,
            duration: 800 + idx * 150,
            yoyo: true,
            loop: -1
          });
        });

        // 4. Render Boss Unit on Grid (right side)
        const bx = W - 180;
        const by = H / 2;
        this.bossSprite = this.add.container(bx, by);

        const bossOutline = this.add.rectangle(0, 0, 100, 100, 0x1a0514, 0.8)
          .setStrokeStyle(3, 0xff0055);
        const bossSym = this.add.text(0, 0, 'Σ', {
          fontFamily: 'Orbitron, monospace', fontSize: '48px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 12, true, true);

        // secondary boss decoration
        const spinner = this.add.rectangle(0, 0, 115, 115, 0x000000, 0)
          .setStrokeStyle(1.5, 0x00ffff, 0.5);
        this.tweens.add({
          targets: spinner,
          angle: 360,
          duration: 3000,
          loop: -1
        });

        this.bossSprite.add([bossOutline, bossSym, spinner]);

        this.tweens.add({
          targets: this.bossSprite,
          y: by + 12,
          duration: 1200,
          yoyo: true,
          loop: -1
        });

        // 5. HP HUD Bars
        this.playerHpText = this.add.text(80, H - 75, `CORE COMPILER HEALTH: ${this.playerTotalHp}/${runState.maxHp}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#00ffff', fontWeight: 'bold'
        });

        this.bossHpText = this.add.text(W - 80, H - 75, `BOSS CORE DESTRUCTION: ${this.bossHp}/${this.bossMaxHp}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(1, 0);

        // 6. Start Combat Loop Timer (cycles every 1.5 seconds)
        this.battleTimer = this.time.addEvent({
          delay: 1500,
          callback: this.executeCombatCycle,
          callbackScope: this,
          loop: true
        });

        // Immediate first strike sound
        playSweep(800, 200, 0.4, 'sawtooth', 0.1);
      }

      executeCombatCycle() {
        if (runState.hp <= 0 || this.bossHp <= 0) return;

        const W = this.scale.width;
        const H = this.scale.height;

        // Player attacks: project operator particles toward boss
        const bossInfo = CAMPAIGN_STAGES.find(s => s.stage === runState.stage)!;
        const ops = ['+', '-', '×', '÷', '√'];

        this.playerUnits.forEach((unit, idx) => {
          this.time.delayedCall(idx * 150, () => {
            if (this.bossHp <= 0) return;

            // Animate unit moving forward slightly
            this.tweens.add({
              targets: unit,
              x: unit.x + 35,
              duration: 100,
              yoyo: true
            });

            // Spawn floating projectile
            const projChar = ops[PhaserLib.Math.Between(0, ops.length - 1)];
            const proj = this.add.text(unit.x, unit.y, projChar, {
              fontFamily: 'Orbitron, sans-serif', fontSize: '20px', color: '#00ffff', fontWeight: 'bold'
            }).setOrigin(0.5);

            this.tweens.add({
              targets: proj,
              x: this.bossSprite.x,
              y: this.bossSprite.y,
              duration: 450,
              ease: 'Sine.easeIn',
              onComplete: () => {
                proj.destroy();

                // Hit particle explosion
                const exploder = this.add.particles(0, 0, 'op-particle', {
                  speed: { min: 60, max: 150 },
                  angle: { min: 0, max: 360 },
                  scale: { start: 1, end: 0 },
                  alpha: { start: 1, end: 0 },
                  color: [0x00ffff, 0x00ff66],
                  blendMode: 'ADD',
                  lifespan: 350
                });
                exploder.explode(8, this.bossSprite.x, this.bossSprite.y);
                this.time.delayedCall(500, () => exploder.destroy());

                // Calculate damage
                let finalDmg = Math.round(this.damagePerCycle / 3);
                
                // Synergy modifiers
                let isCrit = false;
                if (this.synergiesActive.includes('Odd') && Math.random() < 0.35) {
                  finalDmg = Math.round(finalDmg * 1.5);
                  isCrit = true;
                }

                // Boss defense mitigations
                let def = bossInfo.defense;
                if (this.synergiesActive.includes('Fibonacci')) {
                  def = 0;
                } else if (this.synergiesActive.includes('Even')) {
                  def = Math.round(def * 0.5);
                }

                // Net damage
                const netDmg = Math.max(1, finalDmg - Math.round(def / 3));
                this.bossHp = Math.max(0, this.bossHp - netDmg);
                
                playSynth(800, 'triangle', 0.08, 0.08); // math click hit
                this.cameras.main.shake(120, 0.005);

                // Floating damage text
                const textCol = isCrit ? '#ffea00' : '#00ffff';
                const textStr = isCrit ? `${netDmg} CRIT!` : `${netDmg}`;
                const dmgTxt = this.add.text(this.bossSprite.x - 40, this.bossSprite.y + PhaserLib.Math.Between(-30, 30), textStr, {
                  fontFamily: 'Orbitron, monospace', fontSize: isCrit ? '18px' : '14px', color: textCol, fontWeight: 'bold'
                }).setOrigin(0.5).setShadow(0, 0, textCol, 8, true, true);

                this.tweens.add({
                  targets: dmgTxt,
                  y: dmgTxt.y - 40,
                  alpha: 0,
                  duration: 600,
                  onComplete: () => dmgTxt.destroy()
                });

                this.updateHpDisplay();
                if (this.bossHp <= 0) {
                  this.victoryPhase();
                }
              }
            });
          });
        });

        // Boss attacks player core (1.2 seconds in)
        this.time.delayedCall(800, () => {
          if (runState.hp <= 0 || this.bossHp <= 0) return;

          // Boss shake animation
          this.tweens.add({
            targets: this.bossSprite,
            x: this.bossSprite.x - 40,
            duration: 120,
            yoyo: true
          });

          // Shoot Sigma wave towards player
          const wave = this.add.text(this.bossSprite.x, this.bossSprite.y, 'Σ', {
            fontFamily: 'Orbitron, monospace', fontSize: '32px', color: '#ff0055', fontWeight: 'bold'
          }).setOrigin(0.5);

          this.tweens.add({
            targets: wave,
            x: 150,
            y: H / 2,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 500,
            onComplete: () => {
              wave.destroy();

              // Red hit explosion
              const exploder = this.add.particles(0, 0, 'op-particle', {
                speed: { min: 80, max: 180 },
                angle: { min: 0, max: 360 },
                scale: { start: 1, end: 0 },
                alpha: { start: 1, end: 0 },
                color: [0xff0055, 0xff7700],
                blendMode: 'ADD',
                lifespan: 400
              });
              exploder.explode(12, 150, H / 2);
              this.time.delayedCall(500, () => exploder.destroy());

              // Calculate player damage taken
              const defenseVal = 5 + runState.unlockedUpgrades.def;
              const rawDmg = bossInfo.attack;
              const netDmg = Math.max(1, rawDmg - Math.round(defenseVal / 2));

              runState.hp = Math.max(0, runState.hp - netDmg);
              playSweep(400, 100, 0.25, 'triangle', 0.12); // damage shock sound

              const dmgTxt = this.add.text(150, H / 2 + PhaserLib.Math.Between(-60, 60), `-${netDmg} CORE`, {
                fontFamily: 'Orbitron, monospace', fontSize: '15px', color: '#ff0055', fontWeight: 'bold'
              }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 8, true, true);

              this.tweens.add({
                targets: dmgTxt,
                y: dmgTxt.y - 40,
                alpha: 0,
                duration: 600,
                onComplete: () => dmgTxt.destroy()
              });

              this.updateHpDisplay();
              if (runState.hp <= 0) {
                this.defeatPhase();
              }
            }
          });
        });
      }

      updateHpDisplay() {
        this.playerHpText.setText(`CORE COMPILER HEALTH: ${runState.hp}/${runState.maxHp}`);
        this.bossHpText.setText(`BOSS CORE DESTRUCTION: ${this.bossHp}/${this.bossMaxHp}`);
      }

      victoryPhase() {
        this.battleTimer.remove();
        playSweep(523.25, 1046.5, 0.5, 'sine', 0.2); // victory arpeggio

        const goldEarned = 10 + runState.stage * 3;
        runState.gold += goldEarned;

        const W = this.scale.width;
        const H = this.scale.height;

        const card = this.add.rectangle(W / 2, H / 2, 360, 160, 0x051a0d, 0.95)
          .setStrokeStyle(2, 0x00ff66);

        this.add.text(W / 2, H / 2 - 45, 'STAGE COMPILATION SUCCESS', {
          fontFamily: 'Orbitron, monospace', fontSize: '15px', color: '#00ff66', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00ff66', 6, true, true);

        this.add.text(W / 2, H / 2, `Reward: +${goldEarned} Gold Credits\nCore HP Restored (+15)`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#a0c0b0', align: 'center'
        }).setOrigin(0.5);

        // Restore some HP
        runState.hp = Math.min(runState.maxHp, runState.hp + 15);

        const advanceBtn = this.add.rectangle(W / 2, H / 2 + 45, 160, 32, 0x0c331a)
          .setStrokeStyle(1.5, 0x00ff66)
          .setInteractive({ useHandCursor: true });
        
        const advanceTxt = this.add.text(W / 2, H / 2 + 45, 'NEXT NODE', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#00ff66', fontWeight: 'bold'
        }).setOrigin(0.5);

        advanceBtn.on('pointerdown', () => {
          runState.stage++;
          if (runState.stage > CAMPAIGN_STAGES.length) {
            // Completed all stages - absolute victory!
            this.absoluteVictoryPhase();
          } else {
            this.scene.start('CampaignMap');
          }
        });
      }

      absoluteVictoryPhase() {
        this.scene.start('Leaderboard', { victory: true, score: 5000 + runState.gold * 10 });
      }

      defeatPhase() {
        this.battleTimer.remove();
        playSweep(300, 50, 0.6, 'sawtooth', 0.2); // defeat funeral sweep

        const W = this.scale.width;
        const H = this.scale.height;

        const card = this.add.rectangle(W / 2, H / 2, 360, 160, 0x1a050d, 0.95)
          .setStrokeStyle(2, 0xff0055);

        this.add.text(W / 2, H / 2 - 40, 'COMPILER CRASH / GAME OVER', {
          fontFamily: 'Orbitron, monospace', fontSize: '15px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 6, true, true);

        const finalScore = (runState.stage - 1) * 1000 + runState.gold * 5;

        this.add.text(W / 2, H / 2 + 5, `Dungeon Node Reached: ${runState.stage}\nFinal Compilation Score: ${finalScore}`, {
          fontFamily: 'monospace', fontSize: '11px', color: '#d0b0b5', align: 'center'
        }).setOrigin(0.5);

        const restartBtn = this.add.rectangle(W / 2, H / 2 + 50, 160, 30, 0x330c14)
          .setStrokeStyle(1.5, 0xff0055)
          .setInteractive({ useHandCursor: true });

        const restartTxt = this.add.text(W / 2, H / 2 + 50, 'SUBMIT TO MATRIX', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => {
          // Dispatch score event
          window.dispatchEvent(new CustomEvent('phaser-game-over', {
            detail: { gameKey: 'algorithm-arena', score: finalScore }
          }));
          this.scene.start('Menu');
        });
      }

      drawBackground() {
        const gfx = this.bgGraphics;
        gfx.clear();
        const W = this.scale.width;
        const H = this.scale.height;

        // Draw math particles on load for textures
        if (!this.textures.exists('op-particle')) {
          const canvas = this.textures.createCanvas('op-particle', 8, 8);
          const ctx = canvas.context;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 8, 8);
          canvas.refresh();
        }

        gfx.lineStyle(1, 0x1f0e13, 0.4);
        for (let x = 0; x < W; x += 40) {
          gfx.lineBetween(x, 0, x, H);
        }
        for (let y = 0; y < H; y += 40) {
          gfx.lineBetween(0, y, W, y);
        }
      }
    }

    // =========================================================================
    // 5. LEADERBOARD SCENE
    // =========================================================================
    class LeaderboardScene extends PhaserLib.Scene {
      bgGraphics!: Phaser.GameObjects.Graphics;
      constructor() { super({ key: 'Leaderboard' }); }

      create(data: any) {
        const W = this.scale.width;
        const H = this.scale.height;
        this.bgGraphics = this.add.graphics();

        createCyberBackground(this);

        let headingStr = 'SEASONAL LEADERBOARD';
        let color = '#ff0080';
        if (data && data.victory) {
          headingStr = '=== ABSOLUTE MATRIX VICTORY ===';
          color = '#00ff66';
          // Dispatch victory score
          window.dispatchEvent(new CustomEvent('phaser-game-over', {
            detail: { gameKey: 'algorithm-arena', score: data.score }
          }));
        }

        this.add.text(W / 2, 45, headingStr, {
          fontFamily: 'Orbitron, monospace', fontSize: '20px', color: color, fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, color, 8, true, true);

        if (data && data.score) {
          this.add.text(W / 2, 80, `YOUR SUBMITTED SCORE: ${data.score}`, {
            fontFamily: 'monospace', fontSize: '13px', color: '#ffea00', fontWeight: 'bold'
          }).setOrigin(0.5);
        }

        // Render mock seasonal leaderboard rankings
        const mockRankings = [
          { name: 'Euler_Grid', score: 9480, synergy: 'Prime Mastery' },
          { name: 'Matrix_Neo', score: 8120, synergy: 'Fibonacci Surge' },
          { name: 'No_Divide_Zero', score: 6890, synergy: 'Odd Fury' },
          { name: 'Null_Pointer', score: 5540, synergy: 'Even Shield' },
          { name: 'Algebra_King', score: 4120, synergy: 'Prime Mastery' },
          { name: 'Binary_Bot', score: 3250, synergy: 'Odd Fury' }
        ];

        this.add.text(80, 120, 'RANK    PLAYER                 SCORE      ACTIVE SYNERGY', {
          fontFamily: 'monospace', fontSize: '12px', color: '#8080a0', fontWeight: 'bold'
        });

        this.bgGraphics.lineStyle(1.5, 0xff0080, 0.4);
        this.bgGraphics.lineBetween(80, 140, W - 80, 140);

        mockRankings.forEach((rank, index) => {
          const ry = 165 + index * 42;
          this.add.text(80, ry, `#0${index + 1}`, {
            fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#00ffff', fontWeight: 'bold'
          });

          this.add.text(140, ry, rank.name, {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffffff'
          });

          this.add.text(370, ry, rank.score.toString(), {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffea00', fontWeight: 'bold'
          });

          this.add.text(490, ry, rank.synergy, {
            fontFamily: 'monospace', fontSize: '11px', color: '#a0a0c0'
          });

          this.bgGraphics.lineStyle(1, 0x1e1e30, 0.5);
          this.bgGraphics.lineBetween(80, ry + 26, W - 80, ry + 26);
        });

        // Close/Back button
        const backBtn = this.add.rectangle(W / 2, H - 50, 160, 36, 0x101020)
          .setStrokeStyle(1.5, 0xff0080)
          .setInteractive({ useHandCursor: true });
        const backTxt = this.add.text(W / 2, H - 50, 'RETURN TO MENU', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ff0080', fontWeight: 'bold'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
          playSweep(600, 300, 0.1, 'sine', 0.05);
          this.scene.start('Menu');
        });
      }
    }

    return {
      scenes: [
        MenuScene,
        CampaignMapScene,
        DraftScene,
        BattleScene,
        LeaderboardScene
      ]
    };
  }
}
