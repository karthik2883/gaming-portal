// Neon Rider — Pseudo-3D Cyberpunk Highway Racer in PhaserJS
// Register key: 'neon-rider' in PhaserGameEngine.tsx

// Safe Web Audio API synthesizer for engine sounds and retro effects
let audioCtx: AudioContext | null = null;
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;

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

function playSynthSound(freq: number, type: OscillatorType = 'sine', duration = 0.1, gainVal = 0.1) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Synth sound failed:", e);
  }
}

function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Project3D {
  world: Point3D;
  camera: Point3D;
  screen: { x: number; y: number; w: number; scale: number };
}

interface Segment {
  index: number;
  p1: Project3D;
  p2: Project3D;
  curve: number;
  color: { road: number; grass: number; rumble: number; lines?: number };
  traffic: TrafficCar[];
  obstacle?: Obstacle;
}

interface TrafficCar {
  id: string;
  lane: number; // -1 to 1 offset
  z: number;    // world position along road
  speed: number;
  color: number;
  w: number;    // car width scaling factor
  steerDx: number;
}

interface Obstacle {
  lane: number;
  color: number;
  type: 'barrier' | 'debris';
}

export default class NeonRiderGameFactory {
  static create(PhaserLib: any) {
    return class NeonRiderScene extends PhaserLib.Scene {
      // Game State: 'GARAGE' | 'RACE' | 'GAMEOVER'
      gameState!: 'GARAGE' | 'RACE' | 'GAMEOVER';

      // Currency
      credits!: number;

      // Upgrades Levels (1 to 5)
      upgrades!: {
        speed: number;
        accel: number;
        handling: number;
        nitro: number;
      };

      // Customization
      selectedUnderglowColor!: string;
      underglowColors!: Record<string, number>;

      // Road Geometry
      segments!: Segment[];
      segmentLength!: number;
      drawDistance!: number;
      roadWidth!: number;
      lanesCount!: number;
      trackLength!: number;

      // Cameras
      cameraDepth!: number;
      cameraHeight!: number;
      cameraZ!: number;
      playerX!: number; // -1 (left road edge) to 1 (right road edge)
      playerZ!: number; // distance traveled along track
      playerSpeed!: number; // current velocity
      maxSpeedBase!: number;

      // Game mechanics
      nitroCharge!: number;
      maxNitroCharge!: number;
      isNitroActive!: boolean;
      score!: number;
      highScore!: number;
      closePassBonusTimer!: number;
      closePassAlertText!: string;
      closePassTextObj!: Phaser.GameObjects.Text;
      roadSpeedNotification!: string;
      
      // Traffic
      trafficList!: TrafficCar[];
      trafficSpawnTimer!: number;
      trafficIdCounter!: number;

      // Keys input
      cursors!: any;
      keys!: any;

      // Visual Layers
      bgGraphics!: Phaser.GameObjects.Graphics;
      roadGraphics!: Phaser.GameObjects.Graphics;
      hudGraphics!: Phaser.GameObjects.Graphics;
      starfields!: Array<{ x: number; y: number; alpha: number; speed: number }>;
      skyOffset!: number;

      // HUD Texts
      speedText!: Phaser.GameObjects.Text;
      rpmText!: Phaser.GameObjects.Text;
      scoreText!: Phaser.GameObjects.Text;
      creditsText!: Phaser.GameObjects.Text;
      hudMessageText!: Phaser.GameObjects.Text;

      // Garage UI objects
      garageElements!: Phaser.GameObjects.GameObject[];
      statsUIElements!: Phaser.GameObjects.GameObject[];

      constructor() {
        super({ key: 'NeonRider' });
      }

      init() {
        this.gameState = 'GARAGE';
        this.credits = 0;
        this.upgrades = { speed: 1, accel: 1, handling: 1, nitro: 1 };
        this.selectedUnderglowColor = 'cyan';
        
        this.underglowColors = {
          cyan: 0x00d4ff,
          pink: 0xff00ff,
          green: 0x39ff14,
          gold: 0xffea00
        };

        // Load stats from localStorage
        if (typeof window !== 'undefined') {
          const savedUpgrades = localStorage.getItem('neon_rider_upgrades');
          if (savedUpgrades) this.upgrades = JSON.parse(savedUpgrades);
          const savedCredits = localStorage.getItem('neon_rider_credits');
          if (savedCredits) this.credits = parseInt(savedCredits, 10) || 0;
          const savedColor = localStorage.getItem('neon_rider_color');
          if (savedColor) this.selectedUnderglowColor = savedColor;
          const savedHigh = localStorage.getItem('neon_rider_highscore');
          if (savedHigh) this.highScore = parseInt(savedHigh, 10) || 0;
          else this.highScore = 0;
        } else {
          this.highScore = 0;
        }

        // Road definitions
        this.segmentLength = 200;
        this.drawDistance = 180;
        this.roadWidth = 2000;
        this.lanesCount = 3;
        this.cameraDepth = 0.8;
        this.cameraHeight = 1000;
        
        this.cameraZ = 0;
        this.playerX = 0;
        this.playerZ = 0;
        this.playerSpeed = 0;
        this.maxSpeedBase = 150; // Base speed at level 1

        this.nitroCharge = 100;
        this.maxNitroCharge = 100;
        this.isNitroActive = false;
        this.score = 0;
        
        this.trafficList = [];
        this.trafficSpawnTimer = 0;
        this.trafficIdCounter = 0;
        this.skyOffset = 0;
        this.closePassBonusTimer = 0;
        this.closePassAlertText = '';

        this.garageElements = [];
        this.statsUIElements = [];

        // Build Starfields background
        this.starfields = Array.from({ length: 45 }, () => ({
          x: Math.random() * 600,
          y: Math.random() * 200,
          alpha: 0.3 + Math.random() * 0.7,
          speed: 0.05 + Math.random() * 0.15
        }));
      }

      create() {
        this.bgGraphics = this.add.graphics();
        this.roadGraphics = this.add.graphics();
        this.hudGraphics = this.add.graphics();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,ENTER,ESC');

        // Setup Close Pass notifications text
        this.closePassTextObj = this.add.text(this.scale.width / 2, 140, '', {
          fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        // Generate Road segments
        this.generateTrack();

        // Setup cleanup listeners
        this.events.on('shutdown', () => {
          this.stopEngineSound();
        });

        // Initialize Garage UI
        this.buildGarageUI();
      }

      generateTrack() {
        this.segments = [];
        let runningCurve = 0;
        let runningHeight = 0;

        const addSegment = (curve: number, height: number) => {
          const idx = this.segments.length;
          
          // Color alternating structures
          const alternate = Math.floor(idx / 3) % 2 === 0;
          const colorSet = {
            road: 0x0f111a,
            grass: alternate ? 0x040407 : 0x06060b,
            rumble: alternate ? this.underglowColors[this.selectedUnderglowColor] : 0x222233
          };

          const p1: Project3D = {
            world: { x: 0, y: runningHeight, z: idx * this.segmentLength },
            camera: { x: 0, y: 0, z: 0 },
            screen: { x: 0, y: 0, w: 0, scale: 0 }
          };

          const p2: Project3D = {
            world: { x: 0, y: runningHeight, z: (idx + 1) * this.segmentLength },
            camera: { x: 0, y: 0, z: 0 },
            screen: { x: 0, y: 0, w: 0, scale: 0 }
          };

          this.segments.push({
            index: idx,
            p1,
            p2,
            curve,
            color: colorSet,
            traffic: []
          });
        };

        const addRoadSection = (len: number, curve: number, heightChange: number) => {
          const stepHeight = heightChange / len;
          for (let i = 0; i < len; i++) {
            runningCurve = curve;
            runningHeight += stepHeight;
            addSegment(runningCurve, runningHeight);
          }
        };

        // Procedural track blocks (1,500 segments = ~300,000 world units)
        addRoadSection(100, 0, 0);       // Start Straight
        addRoadSection(120, 0.5, 300);   // Hill climbs + easy right curve
        addRoadSection(80, -0.5, -200);  // Drop + left curve
        addRoadSection(150, 0, 0);       // Straight Highway
        addRoadSection(100, 1.2, 500);   // Sharp hill right S-curve
        addRoadSection(100, -1.2, -500); // Sharp hill drop left
        addRoadSection(150, 0, 0);       // Straight speed run
        addRoadSection(120, -0.8, 200);  // Mountain path
        addRoadSection(120, 0.8, -200);  // descent
        addRoadSection(100, 0, 0);       // straight
        addRoadSection(200, 0.4, 400);   // long sweeping curve
        addRoadSection(160, 0, 0);       // End straight

        this.trackLength = this.segments.length * this.segmentLength;
      }

      buildGarageUI() {
        this.gameState = 'GARAGE';
        this.clearAllUIScreens();
        this.stopEngineSound();

        const W = this.scale.width;
        const H = this.scale.height;

        // Custom styling variables
        const activeColorStr = this.selectedUnderglowColor;
        const activeColorHex = this.underglowColors[activeColorStr];

        // Frame bounding box backing
        const backing = this.add.rectangle(W / 2, H / 2, 550, 430, 0x090a12, 0.9).setStrokeStyle(1.5, activeColorHex);
        this.garageElements.push(backing);

        // Header Title
        const header = this.add.text(W / 2, 65, 'NEON RIDER GARAGE', {
          fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#ffffff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ffffff', 8, true, true);
        
        const subHeader = this.add.text(W / 2, 95, `CREDITS: ${this.credits} C`, {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5);

        this.garageElements.push(header, subHeader);

        // 4 Upgrades options configurations
        const upgradeTypes = [
          { key: 'speed', name: 'TOP SPEED', desc: 'Increases maximum velocity caps', y: 150 },
          { key: 'accel', name: 'ACCELERATION', desc: 'Increases engine speed buildup rate', y: 205 },
          { key: 'handling', name: 'HANDLING', desc: 'Increases left/right steering speeds', y: 260 },
          { key: 'nitro', name: 'NITRO CAPACITY', desc: 'Increases nitro recharge and recovery rates', y: 315 }
        ];

        upgradeTypes.forEach(up => {
          const currentLevel = (this.upgrades as any)[up.key] || 1;
          const cost = currentLevel >= 5 ? 0 : currentLevel * 150;

          // Display labels
          const title = this.add.text(60, up.y - 12, up.name, {
            fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#00d4ff', fontWeight: 'bold'
          });
          const desc = this.add.text(60, up.y + 4, up.desc, {
            fontFamily: 'monospace', fontSize: '9px', color: '#6b7280'
          });

          // Draw level bar blocks (5 levels)
          const barGfx = this.add.graphics();
          let barX = 220;
          for (let l = 1; l <= 5; l++) {
            barGfx.fillStyle(l <= currentLevel ? activeColorHex : 0x1e293b, 1);
            barGfx.fillRect(barX, up.y - 8, 20, 10);
            barX += 25;
          }

          // Purchase button
          const btnX = 425;
          const btnW = 120;
          const isMax = currentLevel >= 5;

          const btnTextStr = isMax ? 'MAX LEVEL' : `UPGRADE: ${cost}C`;
          const btnColor = isMax ? 0x4b5563 : (this.credits >= cost ? 0x39ff14 : 0xef4444);

          const btnBack = this.add.rectangle(btnX + btnW / 2, up.y, btnW, 28, 0x0f172a).setStrokeStyle(1.2, btnColor);
          const btnTxt = this.add.text(btnX + btnW / 2, up.y, btnTextStr, {
            fontFamily: 'Orbitron, monospace', fontSize: '10px', color: '#ffffff', fontWeight: 'bold'
          }).setOrigin(0.5);

          if (!isMax && this.credits >= cost) {
            btnBack.setInteractive({ useHandCursor: true });
            btnBack.on('pointerover', () => {
              btnBack.setStrokeStyle(1.8, 0xffea00);
              playSynthSound(520, 'sine', 0.05, 0.06);
            });
            btnBack.on('pointerout', () => btnBack.setStrokeStyle(1.2, btnColor));
            btnBack.on('pointerdown', () => {
              this.credits -= cost;
              (this.upgrades as any)[up.key] = currentLevel + 1;
              
              // Save
              this.saveStats();
              playSynthSound(784, 'triangle', 0.15, 0.1);
              setTimeout(() => playSynthSound(1046, 'triangle', 0.2, 0.1), 80);

              // Rebuild UI
              this.buildGarageUI();
            });
          }

          this.garageElements.push(title, desc, barGfx, btnBack, btnTxt);
        });

        // 5. Underglow Color Pickers
        const colorTitle = this.add.text(60, 360, 'VEHICLE UNDERGLOW:', {
          fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#ffffff', fontWeight: 'bold'
        });
        this.garageElements.push(colorTitle);

        let colorX = 220;
        Object.keys(this.underglowColors).forEach(cName => {
          const hex = this.underglowColors[cName];
          const isSelected = this.selectedUnderglowColor === cName;
          
          const dot = this.add.circle(colorX, 368, 10, hex);
          dot.setInteractive({ useHandCursor: true });

          if (isSelected) {
            dot.setStrokeStyle(2.5, 0xffffff);
          }

          dot.on('pointerdown', () => {
            this.selectedUnderglowColor = cName;
            this.saveStats();
            playSynthSound(600, 'sine', 0.05, 0.08);
            
            // Regene track segment colors to match selected underglow
            this.generateTrack();
            this.buildGarageUI();
          });

          this.garageElements.push(dot);
          colorX += 35;
        });

        // START RACE BUTTON
        const startBtn = this.add.rectangle(W / 2, 435, 240, 38, 0x1e1b4b).setStrokeStyle(2, 0x39ff14);
        startBtn.setInteractive({ useHandCursor: true });
        
        const startTxt = this.add.text(W / 2, 435, 'DEPART TRANSMISSION', {
          fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#ffffff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ffffff', 5, true, true);

        startBtn.on('pointerover', () => {
          startBtn.setScale(1.03);
          startBtn.setStrokeStyle(2.5, 0x00d4ff);
          playSynthSound(440, 'sine', 0.05, 0.05);
        });

        startBtn.on('pointerout', () => {
          startBtn.setScale(1.0);
          startBtn.setStrokeStyle(2, 0x39ff14);
        });

        startBtn.on('pointerdown', () => {
          this.startRaceGameplay();
        });

        this.garageElements.push(startBtn, startTxt);
      }

      saveStats() {
        if (typeof window !== 'undefined') {
          localStorage.setItem('neon_rider_upgrades', JSON.stringify(this.upgrades));
          localStorage.setItem('neon_rider_credits', this.credits.toString());
          localStorage.setItem('neon_rider_color', this.selectedUnderglowColor);
        }
      }

      startRaceGameplay() {
        this.clearAllUIScreens();
        this.gameState = 'RACE';

        this.playerX = 0;
        this.playerZ = 0;
        this.playerSpeed = 0;
        this.score = 0;
        this.trafficList = [];
        this.trafficSpawnTimer = 0;
        this.trafficIdCounter = 0;
        this.nitroCharge = 100;
        this.isNitroActive = false;

        const W = this.scale.width;
        
        // Dynamic stats HUD Texts
        this.speedText = this.add.text(25, 20, 'SPEED: 0 KM/H', {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#ffffff', fontWeight: 'bold'
        });
        
        this.rpmText = this.add.text(25, 40, 'RPM: 1000', {
          fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8'
        });

        this.scoreText = this.add.text(W - 25, 20, 'SCORE: 0', {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#ffffff', fontWeight: 'bold', align: 'right'
        }).setOrigin(1, 0);

        this.creditsText = this.add.text(W - 25, 40, 'CREDITS: +0 C', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ffea00', align: 'right'
        }).setOrigin(1, 0);

        // Sound start
        this.startEngineSound();
        playSynthSound(330, 'square', 0.2, 0.12);
        setTimeout(() => playSynthSound(440, 'square', 0.2, 0.12), 150);
        setTimeout(() => playSynthSound(660, 'square', 0.35, 0.15), 300);
      }

      startEngineSound() {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          this.stopEngineSound();

          engineOsc = ctx.createOscillator();
          engineGain = ctx.createGain();

          engineOsc.type = 'triangle';
          engineOsc.frequency.setValueAtTime(50, ctx.currentTime);

          engineGain.gain.setValueAtTime(0.04, ctx.currentTime);

          engineOsc.connect(engineGain);
          engineGain.connect(ctx.destination);

          engineOsc.start();
        } catch (e) {}
      }

      stopEngineSound() {
        try {
          if (engineOsc) {
            engineOsc.stop();
            engineOsc.disconnect();
            engineOsc = null;
          }
          if (engineGain) {
            engineGain.disconnect();
            engineGain = null;
          }
        } catch (e) {}
      }

      updateEnginePitch() {
        const ctx = getAudioContext();
        if (!ctx || !engineOsc) return;

        // Map speed to dynamic RPM and pitch
        const speedPct = this.playerSpeed / this.getMaxVelocity();
        const rpm = 1000 + speedPct * 5500;
        
        // Simulate shifting gears (5 gears)
        const gearThresholds = [0.2, 0.4, 0.6, 0.8, 1.0];
        let gear = 1;
        let gearSpeedMin = 0;
        let gearSpeedMax = gearThresholds[0];
        
        for (let i = 0; i < gearThresholds.length; i++) {
          if (speedPct <= gearThresholds[i]) {
            gear = i + 1;
            gearSpeedMin = i === 0 ? 0 : gearThresholds[i - 1];
            gearSpeedMax = gearThresholds[i];
            break;
          }
        }

        const gearPct = (speedPct - gearSpeedMin) / (gearSpeedMax - gearSpeedMin);
        const engineRpm = 1200 + gearPct * 3000;
        
        // Base frequency pitch maps to current RPM
        const freq = 45 + (engineRpm * 0.025) + (gear * 8);
        
        try {
          engineOsc.frequency.setValueAtTime(freq, ctx.currentTime);
          
          if (this.rpmText) {
            this.rpmText.setText(`GEAR: ${gear} | RPM: ${Math.round(engineRpm)}`);
          }
        } catch (e) {}
      }

      getMaxVelocity() {
        // Upgrades level 1-5 -> Speed ranges from 160 to 320 KM/H
        const speedLvl = this.upgrades.speed || 1;
        return this.maxSpeedBase + (speedLvl - 1) * 35;
      }

      getAcceleration() {
        // Upgrade level 1-5 -> speed growth
        const accelLvl = this.upgrades.accel || 1;
        return 0.8 + (accelLvl - 1) * 0.45;
      }

      getHandling() {
        // Upgrade level 1-5 -> lateral sensitivity
        const handLvl = this.upgrades.handling || 1;
        return 0.022 + (handLvl - 1) * 0.0055;
      }

      getNitroRate() {
        // Upgrade level 1-5 -> recharge rates
        const nitLvl = this.upgrades.nitro || 1;
        return 0.06 + (nitLvl - 1) * 0.035;
      }

      update(time: number, delta: number) {
        // Parallax stars backdrop
        this.renderParallaxBackground();

        if (this.gameState === 'RACE') {
          // If player presses ESC during race, return to garage
          if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            playSynthSound(523, 'sine', 0.05, 0.08);
            this.buildGarageUI();
            return;
          }
          this.updateRaceGameplay(delta);
        } else if (this.gameState === 'GARAGE') {
          this.render3DHighway();
        } else if (this.gameState === 'GAMEOVER') {
          // Press ENTER, SPACE, or ESC to return to garage from gameover screen
          if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || 
              Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || 
              Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            playSynthSound(523, 'sine', 0.05, 0.08);
            this.buildGarageUI();
          }
        }
      }

      renderParallaxBackground() {
        const gfx = this.bgGraphics;
        gfx.clear();

        const W = this.scale.width;
        const H = this.scale.height;

        // Draw sky sunset gradient (dark purple to orange)
        const skyGfx = this.bgGraphics;
        for (let y = 0; y < 220; y += 4) {
          const ratio = y / 220;
          // Color interpolate purple (0x1e1b4b) to orange (0xd97706)
          const r = Math.round((1 - ratio) * 0x1e + ratio * 0xd9);
          const g = Math.round((1 - ratio) * 0x1b + ratio * 0x77);
          const b = Math.round((1 - ratio) * 0x4b + ratio * 0x06);
          const col = (r << 16) + (g << 8) + b;
          skyGfx.fillStyle(col, 1);
          skyGfx.fillRect(0, y, W, 4);
        }

        // Draw retro sliced sun
        const sunX = W / 2 + (this.skyOffset * 0.15);
        const sunY = 150;
        const sunR = 50;
        
        gfx.fillStyle(0xffea00, 1);
        gfx.fillCircle(sunX, sunY, sunR);
        
        // Slice stripes lines (black overlay lines)
        gfx.fillStyle(0x0f111a, 1);
        let stripeY = sunY - 20;
        let stripeH = 1.5;
        while (stripeY < sunY + sunR) {
          gfx.fillRect(sunX - sunR - 10, stripeY, sunR * 2 + 20, stripeH);
          stripeY += 8;
          stripeH += 1.0; // thicker slices at the bottom
        }

        // Draw starfields
        this.starfields.forEach(star => {
          star.x = (star.x - (this.skyOffset * star.speed)) % W;
          if (star.x < 0) star.x += W;
          gfx.fillStyle(0xffffff, star.alpha);
          gfx.fillCircle(star.x, star.y, 1.2);
        });

        // City skyline silhouettes outlines
        const cityOffset = this.skyOffset * 0.35;
        gfx.fillStyle(0x06060c, 1);
        const cityWidths = [45, 60, 35, 55, 75, 40, 65, 80, 50, 60];
        const cityHeights = [90, 120, 75, 110, 140, 85, 115, 130, 95, 105];
        
        let cx = -100 - (cityOffset % W);
        while (cx < W + 100) {
          cityWidths.forEach((cw, idx) => {
            const ch = cityHeights[idx];
            gfx.fillRect(cx, 220 - ch, cw, ch);
            
            // Neon cyan rooftops
            gfx.fillStyle(0x00d4ff, 0.4);
            gfx.fillRect(cx, 220 - ch, cw, 2);
            gfx.fillStyle(0x06060c, 1);

            cx += cw;
          });
        }
      }

      updateRaceGameplay(delta: number) {
        const W = this.scale.width;
        const H = this.scale.height;

        // 1. Controls processing
        const accKey = this.cursors.up.isDown || this.keys.W.isDown;
        const decKey = this.cursors.down.isDown || this.keys.S.isDown;
        const leftKey = this.cursors.left.isDown || this.keys.A.isDown;
        const rightKey = this.cursors.right.isDown || this.keys.D.isDown;
        const nitroKey = this.keys.SPACE.isDown;

        // Acceleration controls
        if (accKey) {
          let boost = 1;
          if (nitroKey && this.nitroCharge > 0) {
            this.isNitroActive = true;
            this.nitroCharge = Math.max(0, this.nitroCharge - delta * 0.08);
            boost = 2.0; // Double accel rate under nitro
          } else {
            this.isNitroActive = false;
          }

          const targetMax = this.isNitroActive ? this.getMaxVelocity() * 1.3 : this.getMaxVelocity();
          if (this.playerSpeed < targetMax) {
            this.playerSpeed += this.getAcceleration() * boost * (delta / 16.66);
          } else if (!this.isNitroActive) {
            // Decel down to max speed if nitro ended
            this.playerSpeed -= 2.5 * (delta / 16.66);
          }
        } else if (decKey) {
          this.playerSpeed = Math.max(0, this.playerSpeed - 4.5 * (delta / 16.66));
          this.isNitroActive = false;
        } else {
          // Rolling resistance deceleration
          this.playerSpeed = Math.max(0, this.playerSpeed - 1.2 * (delta / 16.66));
          this.isNitroActive = false;
        }

        // Steering controls (proportional to speed)
        const speedRatio = this.playerSpeed / this.getMaxVelocity();
        if (leftKey) {
          this.playerX -= this.getHandling() * speedRatio * (delta / 16.66);
        }
        if (rightKey) {
          this.playerX += this.getHandling() * speedRatio * (delta / 16.66);
        }

        // Keep player strictly bound on highway grass boundaries
        this.playerX = Phaser.Math.Clamp(this.playerX, -1.8, 1.8);

        // Friction when driving on roadside grass
        if (Math.abs(this.playerX) > 1.0) {
          this.playerSpeed = Math.max(0, this.playerSpeed - 3.0 * (delta / 16.66));
          
          // sparks visual indicator
          if (this.playerSpeed > 10 && Math.random() > 0.6) {
            playSynthSound(100 + Math.random() * 200, 'sine', 0.02, 0.05);
          }
        }

        // Nitro recharge when inactive
        if (!this.isNitroActive && this.nitroCharge < this.maxNitroCharge) {
          this.nitroCharge = Math.min(this.maxNitroCharge, this.nitroCharge + this.getNitroRate() * delta * 0.05);
        }

        // Travel along track
        // Speed conversion world units = speed * scaling
        const distDelta = (this.playerSpeed * 1.2) * (delta / 16.66);
        this.playerZ += distDelta;
        this.cameraZ = this.playerZ;

        // Wrap around track length loops
        if (this.playerZ >= this.trackLength) {
          this.playerZ -= this.trackLength;
        }

        // Update score based on distance
        if (this.playerSpeed > 10) {
          this.score += Math.floor(distDelta * 0.04);
        }

        // 2. Traffic Generation & Management
        this.updateTraffic(delta);

        // 3. Render 3D projection scene graph
        this.render3DHighway();

        // 4. Update dynamic audio oscillator pitch
        this.updateEnginePitch();

        // 5. HUD update overlay
        this.updateHUDOverlay();
      }

      updateTraffic(delta: number) {
        // Spawn traffic cars
        this.trafficSpawnTimer += delta;
        
        // Spawn every 1.5 - 2.5s depending on speed
        const spawnDelay = Math.max(1200, 3000 - this.playerSpeed * 5);
        if (this.trafficSpawnTimer >= spawnDelay && this.trafficList.length < 12) {
          this.trafficSpawnTimer = 0;
          this.spawnTrafficCar();
        }

        // Move traffic cars
        this.trafficList.forEach(car => {
          car.z += (car.speed * 1.2) * (delta / 16.66);
          
          // Random lane shift offsets to simulate lane changing behavior
          if (Math.random() > 0.99) {
            car.steerDx = (Math.random() > 0.5 ? 0.008 : -0.008);
          }
          if (car.steerDx !== 0) {
            car.lane += car.steerDx * (delta / 16.66);
            if (car.lane > 0.8 || car.lane < -0.8) {
              car.steerDx = -car.steerDx;
            }
          }

          // Check collision with player car
          this.checkPlayerCollision(car);
        });

        // Cleanup distant traffic cars behind or too far ahead
        this.trafficList = this.trafficList.filter(car => {
          const relativeZ = car.z - this.playerZ;
          // If too far behind or way ahead out of draw range, destroy
          return (relativeZ > -1500 && relativeZ < 15000);
        });
      }

      spawnTrafficCar() {
        this.trafficIdCounter++;
        
        // Spawn car 3500 - 5500 world units ahead of player camera
        const z = this.playerZ + 4500 + Math.random() * 2000;
        
        // Lanes placement: -0.6 (left), 0 (center), 0.6 (right)
        const laneChoices = [-0.6, 0, 0.6];
        const lane = laneChoices[Math.floor(Math.random() * laneChoices.length)];
        
        // Traffic speed ranges between 60 to 110 KM/H
        const speed = 50 + Math.random() * 50;

        // Custom random color tints
        const colors = [0xffea00, 0xef4444, 0xec4899, 0xa855f7, 0x3b82f6];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.trafficList.push({
          id: 'traffic_' + this.trafficIdCounter,
          lane,
          z,
          speed,
          color,
          w: 0.15,
          steerDx: 0
        });
      }

      render3DHighway() {
        const gfx = this.roadGraphics;
        gfx.clear();

        const W = this.scale.width;
        const H = this.scale.height;

        const startSegIdx = Math.floor(this.cameraZ / this.segmentLength);
        const playerSeg = this.segments[startSegIdx % this.segments.length];
        
        // Parallax steering offsets skyline
        const currentSegment = this.segments[startSegIdx % this.segments.length];
        this.skyOffset += currentSegment.curve * (this.playerSpeed / this.getMaxVelocity()) * 3.5;

        // 3D coordinate transformations
        let x = 0;
        let dx = 0;
        let maxy = H;

        // project visible segments (Painter's algorithm: back-to-front rendering)
        // Store projection screen values first
        for (let i = 0; i < this.drawDistance; i++) {
          const segIdx = (startSegIdx + i) % this.segments.length;
          const segment = this.segments[segIdx];
          
          // Handle wrap-around loop math offset
          const loopedOffset = (segIdx < startSegIdx) ? (this.segments.length * this.segmentLength) : 0;

          // Camera transform relative offsets
          // Offset camera steer values
          const camX = this.playerX * this.roadWidth;
          const camY = this.cameraHeight + playerSeg.p1.world.y;

          this.projectPoint(segment.p1, camX, camY, this.cameraZ - loopedOffset, W, H);
          this.projectPoint(segment.p2, camX, camY, this.cameraZ - loopedOffset, W, H);

          // Handle camera relative curves shifts
          dx += segment.curve;
          segment.p1.screen.x += Math.round(dx * 8);
          segment.p2.screen.x += Math.round((dx + segment.curve) * 8);
        }

        // Draw segments from far to near (Painter's algorithm)
        for (let i = this.drawDistance - 1; i >= 0; i--) {
          const segIdx = (startSegIdx + i) % this.segments.length;
          const segment = this.segments[segIdx];

          const p1 = segment.p1;
          const p2 = segment.p2;

          // Avoid drawing behind camera
          if (p1.camera.z <= this.cameraDepth) {
            continue;
          }

          // draw grass backgrounds trapezoids
          gfx.fillStyle(segment.color.grass, 1);
          gfx.beginPath();
          gfx.moveTo(0, p2.screen.y);
          gfx.lineTo(W, p2.screen.y);
          gfx.lineTo(W, p1.screen.y);
          gfx.lineTo(0, p1.screen.y);
          gfx.closePath();
          gfx.fillPath();

          // draw road highway bounds
          gfx.fillStyle(segment.color.road, 1);
          gfx.beginPath();
          gfx.moveTo(p1.screen.x - p1.screen.w, p1.screen.y);
          gfx.lineTo(p2.screen.x - p2.screen.w, p2.screen.y);
          gfx.lineTo(p2.screen.x + p2.screen.w, p2.screen.y);
          gfx.lineTo(p1.screen.x + p1.screen.w, p1.screen.y);
          gfx.closePath();
          gfx.fillPath();

          // draw rumble border grid stripes
          const r1 = p1.screen.w * 0.12;
          const r2 = p2.screen.w * 0.12;
          gfx.fillStyle(segment.color.rumble, 1);
          
          // Left rumble strip
          gfx.beginPath();
          gfx.moveTo(p1.screen.x - p1.screen.w - r1, p1.screen.y);
          gfx.lineTo(p2.screen.x - p2.screen.w - r2, p2.screen.y);
          gfx.lineTo(p2.screen.x - p2.screen.w, p2.screen.y);
          gfx.lineTo(p1.screen.x - p1.screen.w, p1.screen.y);
          gfx.closePath();
          gfx.fillPath();

          // Right rumble strip
          gfx.beginPath();
          gfx.moveTo(p1.screen.x + p1.screen.w, p1.screen.y);
          gfx.lineTo(p2.screen.x + p2.screen.w, p2.screen.y);
          gfx.lineTo(p2.screen.x + p2.screen.w + r2, p2.screen.y);
          gfx.lineTo(p1.screen.x + p1.screen.w + r1, p1.screen.y);
          gfx.closePath();
          gfx.fillPath();

          // draw center lane dividing lines (if alternate segment)
          if (Math.floor(segment.index / 3) % 2 === 0) {
            gfx.fillStyle(0xffffff, 0.75);
            const laneW1 = p1.screen.w * 2 / this.lanesCount;
            const laneW2 = p2.screen.w * 2 / this.lanesCount;

            for (let l = 1; l < this.lanesCount; l++) {
              const lx1 = p1.screen.x - p1.screen.w + laneW1 * l;
              const lx2 = p2.screen.x - p2.screen.w + laneW2 * l;
              const lineW1 = p1.screen.w * 0.025;
              const lineW2 = p2.screen.w * 0.025;

              gfx.beginPath();
              gfx.moveTo(lx1 - lineW1/2, p1.screen.y);
              gfx.lineTo(lx2 - lineW2/2, p2.screen.y);
              gfx.lineTo(lx2 + lineW2/2, p2.screen.y);
              gfx.lineTo(lx1 + lineW1/2, p1.screen.y);
              gfx.closePath();
              gfx.fillPath();
            }
          }

          // draw traffic vehicles on this segment segment
          this.renderTrafficOnSegment(segment, gfx, W, H);

          maxy = p1.screen.y;
        }

        // Draw Player Car at fixed bottom center
        this.renderPlayerCar(gfx, W, H);
      }

      projectPoint(p: Project3D, camX: number, camY: number, camZ: number, width: number, height: number) {
        p.camera.x = p.world.x - camX;
        p.camera.y = p.world.y - camY;
        p.camera.z = p.world.z - camZ;

        p.screen.scale = this.cameraDepth / (p.camera.z || 0.0001);
        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round(p.screen.scale * this.roadWidth * width / 2);
      }

      renderTrafficOnSegment(segment: Segment, gfx: Phaser.GameObjects.Graphics, W: number, H: number) {
        // Draw traffic cars matching this segment's Z depth range
        this.trafficList.forEach(car => {
          const segStart = segment.p1.world.z;
          const segEnd = segment.p2.world.z;
          if (car.z >= segStart && car.z < segEnd) {
            // Project traffic car position relative to road center
            const p1 = segment.p1;
            const carPct = car.lane; // -1 to 1 offset
            
            const carX = p1.screen.x + (p1.screen.w * carPct);
            const carY = p1.screen.y;
            const carW = p1.screen.w * car.w;
            const carH = carW * 0.55;

            // Draw Traffic Car Vector trapezoid
            gfx.fillStyle(car.color, 1);
            gfx.beginPath();
            gfx.moveTo(carX - carW/2, carY);
            gfx.lineTo(carX - carW*0.35/2, carY - carH);
            gfx.lineTo(carX + carW*0.35/2, carY - carH);
            gfx.lineTo(carX + carW/2, carY);
            gfx.closePath();
            gfx.fillPath();

            // Windshield glass window
            gfx.fillStyle(0x0f172a, 0.95);
            gfx.beginPath();
            gfx.moveTo(carX - carW*0.25/2, carY - carH*0.7);
            gfx.lineTo(carX - carW*0.2/2, carY - carH*0.95);
            gfx.lineTo(carX + carW*0.2/2, carY - carH*0.95);
            gfx.lineTo(carX + carW*0.25/2, carY - carH*0.7);
            gfx.closePath();
            gfx.fillPath();

            // Tail lights glowing red
            gfx.fillStyle(0xef4444, 1);
            gfx.fillRect(carX - carW/2 + 2, carY - 5, 4, 3);
            gfx.fillRect(carX + carW/2 - 6, carY - 5, 4, 3);

          }
        });
      }

      renderPlayerCar(gfx: Phaser.GameObjects.Graphics, W: number, H: number) {
        const carX = W / 2;
        const carY = H - 55;
        const carW = 75;
        const carH = 38;

        const underglowColor = this.underglowColors[this.selectedUnderglowColor];

                // Draw Player Neon Underglow beam
        const underglowW = carW * 1.5;
        const underglowH = 15;
        gfx.fillStyle(underglowColor, 0.45);
        gfx.fillEllipse(carX, carY + 8, underglowW, underglowH);

        // Steering tilt skew factor
        let tilt = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) tilt = -5;
        if (this.cursors.right.isDown || this.keys.D.isDown) tilt = 5;

        // Player vector car geometry
        // Main wedge body
        gfx.fillStyle(0x0b0f19, 1);
        gfx.lineStyle(1.8, underglowColor, 1); // Neon lining border
        
        gfx.beginPath();
        gfx.moveTo(carX - carW/2 + tilt, carY);
        gfx.lineTo(carX - carW*0.35 + tilt, carY - carH);
        gfx.lineTo(carX + carW*0.35 + tilt, carY - carH);
        gfx.lineTo(carX + carW/2 + tilt, carY);
        gfx.closePath();
        gfx.fillPath();
        gfx.strokePath();

        // Spoiler Wing
        gfx.fillStyle(0x020617, 1);
        gfx.lineStyle(1.2, underglowColor, 0.85);
        gfx.beginPath();
        gfx.moveTo(carX - carW*0.48 + tilt, carY - carH - 2);
        gfx.lineTo(carX - carW*0.48 + tilt, carY - carH - 8);
        gfx.lineTo(carX + carW*0.48 + tilt, carY - carH - 8);
        gfx.lineTo(carX + carW*0.48 + tilt, carY - carH - 2);
        gfx.closePath();
        gfx.fillPath();
        gfx.strokePath();

        // Windshield
        gfx.fillStyle(0x1e293b, 0.9);
        gfx.lineStyle(1, 0x00d4ff, 0.5);
        gfx.beginPath();
        gfx.moveTo(carX - carW*0.22 + tilt, carY - carH*0.7);
        gfx.lineTo(carX - carW*0.18 + tilt, carY - carH*0.95);
        gfx.lineTo(carX + carW*0.18 + tilt, carY - carH*0.95);
        gfx.lineTo(carX + carW*0.22 + tilt, carY - carH*0.7);
        gfx.closePath();
        gfx.fillPath();
        gfx.strokePath();

        // Exhaust pipes glowing flames (if Nitro active)
        if (this.isNitroActive && this.playerSpeed > 50) {
          gfx.fillStyle(0x00d4ff, 1);
          // Left flame
          gfx.beginPath();
          gfx.moveTo(carX - 15 + tilt, carY);
          gfx.lineTo(carX - 18 + tilt, carY + 15 + Math.random() * 10);
          gfx.lineTo(carX - 12 + tilt, carY);
          gfx.closePath();
          gfx.fillPath();

          // Right flame
          gfx.beginPath();
          gfx.moveTo(carX + 15 + tilt, carY);
          gfx.lineTo(carX + 12 + tilt, carY + 15 + Math.random() * 10);
          gfx.lineTo(carX + 18 + tilt, carY);
          gfx.closePath();
          gfx.fillPath();

          // Nitro motion speed screen shake jitter
          this.cameras.main.shake(80, 0.0035, false);
        } else {
          // Standard red lights
          gfx.fillStyle(0xef4444, 1);
          gfx.fillRect(carX - carW*0.45 + tilt, carY - 8, 8, 4);
          gfx.fillRect(carX + carW*0.45 - 8 + tilt, carY - 8, 8, 4);
        }
      }

      checkPlayerCollision(car: TrafficCar) {
        // Calculate player offset in road coordinates
        const playerZ = this.playerZ;
        const playerX = this.playerX; // -1 to 1

        const relativeZ = car.z - playerZ;
        
        // Check collision bounds (when car is close in depth Z and lateral offset X)
        // Player height is at bottom, roughly 0-150 depth units ahead of camera
        if (relativeZ > 0 && relativeZ < 180) {
          const lateralDist = Math.abs(car.lane - playerX);
          
          if (lateralDist < 0.28) {
            // Collision! Explode
            this.handlePlayerCrash();
          } else if (lateralDist < 0.45 && !this.isNitroActive && this.closePassBonusTimer <= 0) {
            // Close Pass Overtake bonus points!
            this.score += 150;
            this.credits += 10;
            this.closePassBonusTimer = 600; // debounce 600ms
            
            // Trigger floating text alert
            this.closePassAlertText = 'Overtake Close-Pass! +150PTS';
            this.closePassTextObj.setText(this.closePassAlertText);
            this.closePassTextObj.setAlpha(1);
            this.closePassTextObj.setScale(0.8);
            
            this.tweens.add({
              targets: this.closePassTextObj,
              scale: 1.2,
              alpha: 0,
              duration: 800,
              ease: 'Quad.easeOut'
            });

            playSynthSound(987, 'sine', 0.08, 0.08);
            setTimeout(() => playSynthSound(1318, 'sine', 0.12, 0.08), 60);
          }
        }
      }

      handlePlayerCrash() {
        this.stopEngineSound();
        playExplosionSound();
        this.cameras.main.shake(400, 0.02, true);

        // Convert score to earned credits
        const earned = Math.floor(this.score / 15);
        this.credits += earned;
        this.saveStats();

        // Transition state
        this.gameState = 'GAMEOVER';
        this.clearAllUIScreens();
        this.buildStatsScreen(earned);

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'neon-rider', score: this.score }
        }));
      }

      buildStatsScreen(earnedCredits: number) {
        const W = this.scale.width;
        const H = this.scale.height;

        // Check high score
        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
          this.highScore = this.score;
          if (typeof window !== 'undefined') {
            localStorage.setItem('neon_rider_highscore', this.highScore.toString());
          }
        }

        const activeHex = this.underglowColors[this.selectedUnderglowColor];

        // overlay box
        const overlay = this.add.rectangle(W / 2, H / 2, 340, 260, 0x08080f, 0.95).setStrokeStyle(1.5, activeHex);
        this.statsUIElements.push(overlay);

        const statusTxt = this.add.text(W / 2, H / 2 - 95, 'CRITICAL COLLISION', {
          fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 8, true, true);

        const finalScore = this.add.text(W / 2, H / 2 - 50, `SCORE: ${this.score}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '15px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        const recordTxt = this.add.text(W / 2, H / 2 - 25, isNewRecord ? '🏆 NEW HIGH SCORE RECORD!' : `PERSONAL BEST: ${this.highScore}`, {
          fontFamily: 'monospace', fontSize: '11px', color: isNewRecord ? '#ffea00' : '#64748b', fontWeight: 'bold'
        }).setOrigin(0.5);

        const earnedTxt = this.add.text(W / 2, H / 2 + 15, `CREDITS EARNED: +${earnedCredits} C\nTOTAL BALANCE: ${this.credits} C`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#39ff14', align: 'center'
        }).setOrigin(0.5);

        // Restart buttons
        const btnX = W / 2;
        const backBtn = this.add.rectangle(btnX, H / 2 + 80, 200, 32, 0x111827).setStrokeStyle(1.2, activeHex);
        backBtn.setInteractive({ useHandCursor: true });
        const backTxt = this.add.text(btnX, H / 2 + 80, 'RETURN TO GARAGE', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ffffff', fontWeight: 'bold'
        }).setOrigin(0.5);

        backBtn.on('pointerover', () => {
          backBtn.setStrokeStyle(1.6, 0xffea00);
          playSynthSound(523, 'sine', 0.05, 0.06);
        });
        backBtn.on('pointerout', () => backBtn.setStrokeStyle(1.2, activeHex));
        backBtn.on('pointerdown', () => {
          playSynthSound(600, 'sine', 0.1, 0.12);
          this.time.delayedCall(50, () => {
            this.buildGarageUI();
          });
        });

        this.statsUIElements.push(statusTxt, finalScore, recordTxt, earnedTxt, backBtn, backTxt);
      }

      updateHUDOverlay() {
        if (this.gameState !== 'RACE') return;

        // update text displays
        const kmh = Math.round(this.playerSpeed * 1.5);
        this.speedText.setText(`SPEED: ${kmh} KM/H`);
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.creditsText.setText(`BALANCE: ${this.credits} C`);

        // Draw HUD dashboard graphics panel (glassmorphic tachometer arc + nitro bar)
        const gfx = this.hudGraphics;
        gfx.clear();

        const W = this.scale.width;
        const H = this.scale.height;

        // Bottom left speedometer backing
        const hudX = 90;
        const hudY = H - 55;
        const hudR = 50;

        gfx.fillStyle(0x0c0f1e, 0.85);
        gfx.lineStyle(1.2, this.underglowColors[this.selectedUnderglowColor], 0.7);
        gfx.fillCircle(hudX, hudY, hudR);
        gfx.strokeCircle(hudX, hudY, hudR);

        // Draw dynamic RPM gauge arc
        const speedPct = this.playerSpeed / this.getMaxVelocity();
        const rpmAngleStart = 135;
        const rpmAngleEnd = 135 + (270 * Math.min(1.2, speedPct));
        
        // draw arc lines
        gfx.lineStyle(4, 0x1e293b, 1);
        gfx.beginPath();
        gfx.arc(hudX, hudY, hudR - 8, Phaser.Math.DegToRad(135), Phaser.Math.DegToRad(405), false);
        gfx.strokePath();

        // filled arc color mapping (green -> orange -> red warning)
        const arcColor = speedPct > 0.85 ? 0xef4444 : speedPct > 0.6 ? 0xffea00 : 0x39ff14;
        gfx.lineStyle(4, arcColor, 1);
        gfx.beginPath();
        gfx.arc(hudX, hudY, hudR - 8, Phaser.Math.DegToRad(135), Phaser.Math.DegToRad(rpmAngleEnd), false);
        gfx.strokePath();

        // Bottom right Nitro container HUD
        const nitX = W - 145;
        const nitY = H - 35;
        const nitW = 120;
        const nitH = 12;

        gfx.fillStyle(0x0c0f1e, 0.85);
        gfx.lineStyle(1.2, 0x00d4ff, 0.75);
        gfx.strokeRect(nitX, nitY, nitW, nitH);
        gfx.fillRect(nitX, nitY, nitW, nitH);

        const nitroPct = this.nitroCharge / this.maxNitroCharge;
        gfx.fillStyle(0x00d4ff, 1);
        gfx.fillRect(nitX + 2, nitY + 2, (nitW - 4) * nitroPct, nitH - 4);

        // --- HUD Minimap / Radar ---
        const mapW = 90;
        const mapH = 150;
        const mapX = W - mapW - 20; // W - 110
        const mapY = 100; // y position below scores
        const mapCenterX = mapX + mapW / 2;
        const mapTopY = mapY + 15;
        const mapBottomY = mapY + mapH - 15;

        // 1. Draw glassmorphic backing
        gfx.fillStyle(0x0c0f1e, 0.85);
        const activeHex = this.underglowColors[this.selectedUnderglowColor];
        gfx.lineStyle(1.5, activeHex, 0.6);
        gfx.fillRoundedRect(mapX, mapY, mapW, mapH, 10);
        gfx.strokeRoundedRect(mapX, mapY, mapW, mapH, 10);

        // Draw radar sweeping line effect
        const sweepY = mapTopY + ((this.time.now * 0.08) % (mapBottomY - mapTopY));
        gfx.lineStyle(1.5, activeHex, 0.15);
        gfx.lineBetween(mapX + 2, sweepY, mapX + mapW - 2, sweepY);

        // 2. Trace and Draw Road Path
        const playerSegIdx = Math.floor(this.cameraZ / this.segmentLength);
        const mapSegmentsCount = 100; // trace 100 segments ahead
        
        let roadCurveAccum = 0;
        const roadPoints: Array<{ lx: number; rx: number; cx: number; y: number }> = [];

        for (let i = 0; i <= mapSegmentsCount; i += 5) {
          const idx = (playerSegIdx + i) % this.segments.length;
          roadCurveAccum += this.segments[idx].curve;
          
          const pct = i / mapSegmentsCount;
          const py = mapBottomY - (mapBottomY - mapTopY) * pct;
          
          const cx = mapCenterX + roadCurveAccum * 3.0; // scale factor for curves
          const halfRoadW = 18 - pct * 6; // road narrows slightly ahead for perspective!
          
          roadPoints.push({
            lx: cx - halfRoadW,
            rx: cx + halfRoadW,
            cx: cx,
            y: py
          });
        }

        // Draw Left & Right road boundaries
        gfx.lineStyle(1.5, 0xff00ff, 0.5); // neon magenta edges
        gfx.beginPath();
        gfx.moveTo(roadPoints[0].lx, roadPoints[0].y);
        for (let i = 1; i < roadPoints.length; i++) {
          gfx.lineTo(roadPoints[i].lx, roadPoints[i].y);
        }
        gfx.strokePath();

        gfx.beginPath();
        gfx.moveTo(roadPoints[0].rx, roadPoints[0].y);
        for (let i = 1; i < roadPoints.length; i++) {
          gfx.lineTo(roadPoints[i].rx, roadPoints[i].y);
        }
        gfx.strokePath();

        // Draw Center dotted lane divider
        gfx.lineStyle(1, 0x00d4ff, 0.4); // neon cyan
        gfx.beginPath();
        gfx.moveTo(roadPoints[0].cx, roadPoints[0].y);
        for (let i = 1; i < roadPoints.length; i++) {
          gfx.lineTo(roadPoints[i].cx, roadPoints[i].y);
        }
        gfx.strokePath();

        // 3. Draw Player Car Dot (placed at bottom road segment center offset by playerX)
        const playerPct = this.playerX; // -1 to 1
        const playerHalfW = 18; // base road width at bottom
        const playerMapX = roadPoints[0].cx + playerPct * playerHalfW;
        const playerMapY = roadPoints[0].y;

        // Pulsing glow animation
        const pulse = Math.sin(this.time.now * 0.015) * 2.0 + 4.0;
        gfx.fillStyle(0x39ff14, 0.4); // flashing green shadow
        gfx.fillCircle(playerMapX, playerMapY, pulse + 2);
        gfx.fillStyle(0x39ff14, 1); // bright green dot
        gfx.fillCircle(playerMapX, playerMapY, 3.5);

        // 4. Draw Traffic Cars on Minimap
        this.trafficList.forEach(car => {
          let dist = car.z - this.playerZ;
          // Handle wrap-around
          if (dist < -this.trackLength / 2) dist += this.trackLength;
          if (dist > this.trackLength / 2) dist -= this.trackLength;

          // If car is ahead of player and within radar range
          const radarRange = mapSegmentsCount * this.segmentLength; // 20000 units
          if (dist > 0 && dist <= radarRange) {
            const pct = dist / radarRange;
            const py = mapBottomY - (mapBottomY - mapTopY) * pct;

            // Interpolate road center at this distance
            const pointIdx = Math.min(
              roadPoints.length - 1,
              Math.floor(pct * (roadPoints.length - 1))
            );
            const pt = roadPoints[pointIdx];
            const currentHalfRoadW = 18 - pct * 6;
            const carMapX = pt.cx + car.lane * currentHalfRoadW;

            // Draw orange/red dot for traffic car
            gfx.fillStyle(0xef4444, 0.45); // outer alert ring
            gfx.fillCircle(carMapX, py, 4.5);
            gfx.fillStyle(0xff3b30, 1); // inner bright dot
            gfx.fillCircle(carMapX, py, 2.8);
          }
        });

        // Label tag text
        gfx.fillStyle(0xffffff, 1);
      }

      clearAllUIScreens() {
        this.garageElements.forEach(el => el.destroy());
        this.garageElements = [];

        this.statsUIElements.forEach(el => el.destroy());
        this.statsUIElements = [];

        if (this.speedText) { this.speedText.destroy(); }
        if (this.rpmText) { this.rpmText.destroy(); }
        if (this.scoreText) { this.scoreText.destroy(); }
        if (this.creditsText) { this.creditsText.destroy(); }
        if (this.hudMessageText) { this.hudMessageText.destroy(); }

        this.hudGraphics.clear();
      }
    };
  }
}
