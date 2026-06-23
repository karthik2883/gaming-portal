// Fruit Slice Neo game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'fruit-slice' in PhaserGameEngine.tsx

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

// Noise buffer generator for splat squishes
function playSplatNoise(duration: number = 0.15, gainVal: number = 0.12) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Noise splat sound failed:", e);
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h / 5);
  ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + h / 3);
  ctx.bezierCurveTo(x, y + h * 2 / 3, x + w / 4, y + h * 4 / 5, x + w / 2, y + h);
  ctx.bezierCurveTo(x + w * 3 / 4, y + h * 4 / 5, x + w, y + h * 2 / 3, x + w, y + h / 3);
  ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + h / 5);
  ctx.closePath();
}

function drawSawBlade(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, teeth: number, depth: number) {
  ctx.beginPath();
  const step = Math.PI / teeth;
  let rot = 0;
  ctx.moveTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
  for (let i = 0; i < teeth; i++) {
    rot += step;
    let x1 = cx + Math.cos(rot) * (r - depth);
    let y1 = cy + Math.sin(rot) * (r - depth);
    ctx.lineTo(x1, y1);
    rot += step;
    let x2 = cx + Math.cos(rot) * r;
    let y2 = cy + Math.sin(rot) * r;
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
}

interface FruitType {
  key: string;
  name: string;
  radius: number;
  colorHex: number;
  colorStr: string;
  points: number;
  isBomb?: boolean;
}

const FRUIT_TEMPLATES: FruitType[] = [
  { key: 'watermelon', name: 'Watermelon', radius: 28, colorHex: 0xff0055, colorStr: '#ff0055', points: 10 },
  { key: 'apple', name: 'Apple', radius: 20, colorHex: 0x39ff14, colorStr: '#39ff14', points: 10 },
  { key: 'orange', name: 'Orange', radius: 20, colorHex: 0xff9900, colorStr: '#ff9900', points: 10 },
  { key: 'banana', name: 'Banana', radius: 18, colorHex: 0xffea00, colorStr: '#ffea00', points: 10 },
  { key: 'coconut', name: 'Coconut', radius: 20, colorHex: 0xffffff, colorStr: '#ffffff', points: 10 }
];

const SPECIAL_FRUIT: FruitType = {
  key: 'starfruit',
  name: 'Starfruit',
  radius: 20,
  colorHex: 0xffea00,
  colorStr: '#ffea00',
  points: 50
};

const LIFE_FRUIT: FruitType = {
  key: 'heartfruit',
  name: 'Life Fruit',
  radius: 18,
  colorHex: 0xff0088,
  colorStr: '#ff0088',
  points: 10
};

const FRENZY_FRUIT: FruitType = {
  key: 'frenzyfruit',
  name: 'Frenzy Fruit',
  radius: 20,
  colorHex: 0xff7700,
  colorStr: '#ff7700',
  points: 15
};

export default class FruitSliceGameFactory {
  static create(PhaserLib: any) {
    return class FruitSliceScene extends PhaserLib.Scene {
      score!: number;
      highScore!: number;
      lives!: number;
      isOver!: boolean;

      activeObjects!: Phaser.GameObjects.Group;
      halvesGroup!: Phaser.GameObjects.Group;

      swipePoints!: Array<{ x: number, y: number, time: number }>;
      sliceCountInSwipe!: number;
      lastSliceTime!: number;

      splats!: Array<{ x: number, y: number, r: number, color: number, alpha: number }>;

      isFrenzyActive!: boolean;
      frenzyDurationRemaining!: number;
      frenzyTimer!: Phaser.Time.TimerEvent | null;
      frenzyBarGraphics!: Phaser.GameObjects.Graphics;
      frenzyBarText!: Phaser.GameObjects.Text | null;

      // HUD and visuals
      scoreText!: Phaser.GameObjects.Text;
      highScoreText!: Phaser.GameObjects.Text;
      livesText!: Phaser.GameObjects.Text;

      trailGraphics!: Phaser.GameObjects.Graphics;
      splatGraphics!: Phaser.GameObjects.Graphics;
      gridGraphics!: Phaser.GameObjects.Graphics;

      spawnTimer!: Phaser.Time.TimerEvent;

      constructor() {
        super({ key: 'FruitSlice' });
      }

      init() {
        this.score = 0;
        this.lives = 3;
        this.isOver = false;
        this.swipePoints = [];
        this.sliceCountInSwipe = 0;
        this.lastSliceTime = 0;
        this.splats = [];
        this.isFrenzyActive = false;
        this.frenzyDurationRemaining = 0;
        this.frenzyTimer = null;
        this.frenzyBarText = null;

        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('fruit_slice_high_score');
          this.highScore = saved ? parseInt(saved, 10) : 5000;
        } else {
          this.highScore = 5000;
        }
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.splatGraphics = this.add.graphics();
        this.gridGraphics = this.add.graphics();
        this.trailGraphics = this.add.graphics();
        this.frenzyBarGraphics = this.add.graphics();

        // 1. Generate Glowing Textures
        const generateTexture = (key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) {
            this.textures.remove(key);
          }
          const canvasTexture = this.textures.createCanvas(key, width, height);
          const ctx = canvasTexture.context;
          drawFn(ctx);
          canvasTexture.refresh();
        };

        // Seed Fruit Textures
        // Watermelon
        generateTexture('fruit-watermelon', 60, 60, (ctx) => {
          ctx.strokeStyle = '#00ff66'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(30, 30, 26, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#ff0055';
          ctx.beginPath(); ctx.arc(30, 30, 22, 0, Math.PI * 2); ctx.fill();
        });
        generateTexture('fruit-watermelon-l', 60, 60, (ctx) => {
          ctx.strokeStyle = '#00ff66'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(30, 30, 26, Math.PI/2, Math.PI*1.5); ctx.stroke();
          ctx.fillStyle = '#ff0055';
          ctx.beginPath(); ctx.arc(30, 30, 22, Math.PI/2, Math.PI*1.5); ctx.fill();
        });
        generateTexture('fruit-watermelon-r', 60, 60, (ctx) => {
          ctx.strokeStyle = '#00ff66'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(30, 30, 26, -Math.PI/2, Math.PI/2); ctx.stroke();
          ctx.fillStyle = '#ff0055';
          ctx.beginPath(); ctx.arc(30, 30, 22, -Math.PI/2, Math.PI/2); ctx.fill();
        });

        // Apple
        generateTexture('fruit-apple', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#39ff14';
          ctx.beginPath(); ctx.arc(22, 22, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        generateTexture('fruit-apple-l', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#39ff14';
          ctx.beginPath(); ctx.arc(22, 22, 18, Math.PI/2, Math.PI*1.5); ctx.fill(); ctx.stroke();
        });
        generateTexture('fruit-apple-r', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#39ff14';
          ctx.beginPath(); ctx.arc(22, 22, 18, -Math.PI/2, Math.PI/2); ctx.fill(); ctx.stroke();
        });

        // Orange
        generateTexture('fruit-orange', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 2.5;
          ctx.fillStyle = '#ff9900';
          ctx.beginPath(); ctx.arc(22, 22, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        generateTexture('fruit-orange-l', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 2.5;
          ctx.fillStyle = '#ff9900';
          ctx.beginPath(); ctx.arc(22, 22, 18, Math.PI/2, Math.PI*1.5); ctx.fill(); ctx.stroke();
        });
        generateTexture('fruit-orange-r', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 2.5;
          ctx.fillStyle = '#ff9900';
          ctx.beginPath(); ctx.arc(22, 22, 18, -Math.PI/2, Math.PI/2); ctx.fill(); ctx.stroke();
        });

        // Banana
        generateTexture('fruit-banana', 40, 40, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          ctx.fillStyle = '#ffea00';
          ctx.beginPath(); ctx.arc(20, 20, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        generateTexture('fruit-banana-l', 40, 40, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          ctx.fillStyle = '#ffea00';
          ctx.beginPath(); ctx.arc(20, 20, 16, Math.PI/2, Math.PI*1.5); ctx.fill(); ctx.stroke();
        });
        generateTexture('fruit-banana-r', 40, 40, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          ctx.fillStyle = '#ffea00';
          ctx.beginPath(); ctx.arc(20, 20, 16, -Math.PI/2, Math.PI/2); ctx.fill(); ctx.stroke();
        });

        // Coconut
        generateTexture('fruit-coconut', 44, 44, (ctx) => {
          ctx.fillStyle = '#6e473b';
          ctx.beginPath(); ctx.arc(22, 22, 18, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(22, 22, 14, 0, Math.PI * 2); ctx.fill();
        });
        generateTexture('fruit-coconut-l', 44, 44, (ctx) => {
          ctx.fillStyle = '#6e473b';
          ctx.beginPath(); ctx.arc(22, 22, 18, Math.PI/2, Math.PI*1.5); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(22, 22, 14, Math.PI/2, Math.PI*1.5); ctx.fill();
        });
        generateTexture('fruit-coconut-r', 44, 44, (ctx) => {
          ctx.fillStyle = '#6e473b';
          ctx.beginPath(); ctx.arc(22, 22, 18, -Math.PI/2, Math.PI/2); ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(22, 22, 14, -Math.PI/2, Math.PI/2); ctx.fill();
        });

        // Starfruit (Special golden star)
        generateTexture('fruit-starfruit', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          ctx.fillStyle = '#ffea00';
          drawStar(ctx, 22, 22, 5, 18, 8);
          ctx.fill();
          ctx.stroke();
        });
        generateTexture('fruit-starfruit-l', 44, 44, (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, 22, 44);
          ctx.clip();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          ctx.fillStyle = '#ffea00';
          drawStar(ctx, 22, 22, 5, 18, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
        generateTexture('fruit-starfruit-r', 44, 44, (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(22, 0, 22, 44);
          ctx.clip();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          ctx.fillStyle = '#ffea00';
          drawStar(ctx, 22, 22, 5, 18, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        // Life Fruit (Heart)
        generateTexture('fruit-heartfruit', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#ff0088';
          drawHeart(ctx, 8, 8, 28, 28);
          ctx.fill();
          ctx.stroke();
        });
        generateTexture('fruit-heartfruit-l', 44, 44, (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, 22, 44);
          ctx.clip();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#ff0088';
          drawHeart(ctx, 8, 8, 28, 28);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
        generateTexture('fruit-heartfruit-r', 44, 44, (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(22, 0, 22, 44);
          ctx.clip();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#ff0088';
          drawHeart(ctx, 8, 8, 28, 28);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        // Frenzy Fruit (Sawblade)
        generateTexture('fruit-frenzyfruit', 44, 44, (ctx) => {
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#ff7700';
          drawSawBlade(ctx, 22, 22, 18, 10, 6);
          ctx.fill();
          ctx.stroke();
        });
        generateTexture('fruit-frenzyfruit-l', 44, 44, (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, 22, 44);
          ctx.clip();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#ff7700';
          drawSawBlade(ctx, 22, 22, 18, 10, 6);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
        generateTexture('fruit-frenzyfruit-r', 44, 44, (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.rect(22, 0, 22, 44);
          ctx.clip();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.fillStyle = '#ff7700';
          drawSawBlade(ctx, 22, 22, 18, 10, 6);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        // Bomb
        generateTexture('fruit-bomb', 44, 44, (ctx) => {
          ctx.fillStyle = '#2d2e30';
          ctx.beginPath(); ctx.arc(22, 22, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(22, 22, 16, 0, Math.PI * 2); ctx.stroke();
          // fuse
          ctx.strokeStyle = '#ffea00'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(22, 6); ctx.quadraticCurveTo(28, -2, 34, 4); ctx.stroke();
        });

        // Tiny particle
        generateTexture('juice-particle', 6, 6, (ctx) => {
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 6, 6);
        });

        // 2. HUD Layout Panel
        this.add.text(W / 2, 25, 'FRUIT SLICE NEO', {
          fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#ff00ff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff00ff', 8, true, true);

        // Sidebar indicators
        this.scoreText = this.add.text(40, 30, 'SCORE: 0', {
          fontFamily: 'monospace', fontSize: '15px', color: '#00d4ff', fontWeight: 'bold'
        });

        this.highScoreText = this.add.text(W / 2, 60, `BEST: ${this.highScore}`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5);

        this.livesText = this.add.text(W - 40, 30, '⚡ LIVES: ⬡ ⬡ ⬡', {
          fontFamily: 'monospace', fontSize: '15px', color: '#39ff14', fontWeight: 'bold'
        }).setOrigin(1, 0);

        this.updateLivesHUD();

        // Help Instructions
        this.add.text(W / 2, H - 25, '🖱️ Click & Drag to Slice  ·  ⚡ Avoid Bombs!', {
          fontFamily: 'monospace', fontSize: '11px', color: '#9090b0'
        }).setOrigin(0.5);

        // Groups
        this.activeObjects = this.add.group();
        this.halvesGroup = this.add.group();

        // 3. Spawning Loops
        this.spawnTimer = this.time.addEvent({
          delay: 1400,
          callback: this.spawnLaunchPack,
          callbackScope: this,
          loop: true
        });

        // Mouse Drag Action bindings
        this.input.on('pointerdown', (pointer: any) => {
          getAudioContext();
          if (this.isOver) {
            this.restartGame();
            return;
          }
          this.swipePoints = [{ x: pointer.x, y: pointer.y, time: time() }];
          this.sliceCountInSwipe = 0;
        });

        const time = () => this.time.now;

        this.drawBackgroundGrid();
      }

      update(time: number, delta: number) {
        this.drawBackgroundGrid();
        this.updateSplatsGraphics();

        if (this.isOver) return;

        const pointer = this.input.activePointer;
        let isTrailActive = false;

        if (pointer.isDown) {
          // Push new path segment
          this.swipePoints.push({ x: pointer.x, y: pointer.y, time });
          
          // Truncate path older than 160ms
          const cutoff = time - 160;
          this.swipePoints = this.swipePoints.filter(pt => pt.time > cutoff);

          this.drawSwipeTrail();
          this.checkIntersections();
          isTrailActive = true;
        }

        // Frenzy Auto-Slice check
        if (this.isFrenzyActive) {
          this.frenzyDurationRemaining -= delta;
          if (this.frenzyDurationRemaining <= 0) {
            this.isFrenzyActive = false;
            this.frenzyDurationRemaining = 0;
            this.frenzyBarGraphics.clear();
            if (this.frenzyBarText) {
              this.frenzyBarText.destroy();
              this.frenzyBarText = null;
            }
          } else {
            this.drawFrenzyProgressBar();
            // Automatically slice active non-bomb objects
            this.activeObjects.getChildren().forEach((obj: any) => {
              if (obj.active && !obj.isBomb) {
                this.swipePoints = [
                  { x: obj.x - 22, y: obj.y - 22, time: time },
                  { x: obj.x + 22, y: obj.y + 22, time: time }
                ];
                this.drawSwipeTrail();
                this.sliceObject(obj);
                isTrailActive = true;
              }
            });
          }
        }

        if (!isTrailActive) {
          // Fade swipe trail
          this.swipePoints = [];
          this.trailGraphics.clear();
        }

        // Clean up out of bounds elements (fall off bottom screen)
        this.activeObjects.getChildren().forEach((obj: any) => {
          if (obj.y > 640 && obj.body.velocity.y > 0) {
            // If it is a fruit and player missed it, lose life
            if (!obj.isBomb) {
              this.missFruit();
            }
            obj.destroy();
          }
        });

        this.halvesGroup.getChildren().forEach((half: any) => {
          if (half.y > 640) {
            half.destroy();
          }
        });
      }

      spawnLaunchPack() {
        if (this.isOver) return;

        // Number of elements thrown depends on difficulty (score level)
        let amount = 1;
        const roll = Math.random();
        if (this.score > 2000) {
          amount = roll > 0.45 ? 3 : (roll > 0.1 ? 2 : 1);
        } else if (this.score > 600) {
          amount = roll > 0.4 ? 2 : 1;
        } else {
          amount = roll > 0.8 ? 2 : 1;
        }

        for (let i = 0; i < amount; i++) {
          // Stagger slightly
          this.time.delayedCall(i * 220, () => {
            this.throwSingleObject();
          });
        }
      }

      throwSingleObject() {
        if (this.isOver) return;

        const W = this.scale.width;
        
        // Pick random type (80% fruit, 20% bomb)
        const isBomb = Math.random() < 0.20;
        let template: FruitType;

        if (isBomb) {
          template = { key: 'bomb', name: 'Bomb', radius: 22, colorHex: 0xff0055, colorStr: '#ff0055', points: 0, isBomb: true };
        } else {
          const roll = Math.random();
          if (roll < 0.10) {
            template = SPECIAL_FRUIT;
          } else if (roll < 0.15) {
            template = LIFE_FRUIT;
          } else if (roll < 0.20) {
            template = FRENZY_FRUIT;
          } else {
            template = FRUIT_TEMPLATES[Math.floor(Math.random() * FRUIT_TEMPLATES.length)];
          }
        }

        const startX = PhaserLib.Math.Between(120, W - 120);
        const startY = 620;

        const sprite = this.physics.add.sprite(startX, startY, `fruit-${template.key}`);
        sprite.body.setCircle(template.radius);
        
        // High arc velocity
        const vx = PhaserLib.Math.Between(-80, 80);
        const vy = PhaserLib.Math.Between(-620, -780); // fly height range

        sprite.body.setVelocity(vx, vy);
        sprite.body.setGravityY(520); // fall naturally

        sprite.colorHex = template.colorHex;
        sprite.colorStr = template.colorStr;
        sprite.radius = template.radius;
        sprite.key = template.key;
        sprite.points = template.points;
        sprite.isBomb = template.isBomb || false;

        // Apply angular spin rotation
        sprite.setAngularVelocity(PhaserLib.Math.Between(-150, 150));

        this.activeObjects.add(sprite);

        playSweep(200, 100, 0.22, 'sine', 0.05); // Throw whoosh sound
      }

      checkIntersections() {
        if (this.swipePoints.length < 2) return;

        const p1 = this.swipePoints[this.swipePoints.length - 2];
        const p2 = this.swipePoints[this.swipePoints.length - 1];

        this.activeObjects.getChildren().forEach((obj: any) => {
          if (!obj.active) return;

          // Check if swipe cuts the bounding circle of this object
          const cut = this.checkSegmentCircleIntersection(p1, p2, obj.x, obj.y, obj.radius + 6);
          if (cut) {
            this.sliceObject(obj);
          }
        });
      }

      checkSegmentCircleIntersection(p1: {x: number, y: number}, p2: {x: number, y: number}, cx: number, cy: number, r: number): boolean {
        const abx = p2.x - p1.x;
        const aby = p2.y - p1.y;
        const acx = cx - p1.x;
        const acy = cy - p1.y;

        const abLenSq = abx * abx + aby * aby;
        if (abLenSq === 0) {
          const d = Phaser.Math.Distance.Between(p1.x, p1.y, cx, cy);
          return d <= r;
        }

        let t = (acx * abx + acy * aby) / abLenSq;
        t = Phaser.Math.Clamp(t, 0, 1);

        const closestX = p1.x + t * abx;
        const closestY = p1.y + t * aby;

        const dist = Phaser.Math.Distance.Between(closestX, closestY, cx, cy);
        return dist <= r;
      }

      sliceObject(obj: any) {
        if (obj.isBomb) {
          this.triggerBombExplosion(obj);
          return;
        }

        const ox = obj.x;
        const oy = obj.y;
        const vx = obj.body.velocity.x;
        const vy = obj.body.velocity.y;
        const color = obj.colorHex;

        // Splat splatter graphics addition
        this.addSplat(ox, oy, obj.radius * 1.5, color);

        // Staggered juice particles
        const exploder = this.add.particles(0, 0, 'juice-particle', {
          speed: { min: 80, max: 200 },
          angle: { min: 0, max: 360 },
          scale: { start: 1, end: 0 },
          alpha: { start: 1, end: 0 },
          color: [color],
          blendMode: 'ADD',
          lifespan: 450,
          gravityY: 150
        });
        exploder.explode(16, ox, oy);

        this.time.delayedCall(600, () => {
          exploder.destroy();
        });

        // Split textures half physics sprites
        const halfL = this.physics.add.sprite(ox, oy, `fruit-${obj.key}-l`);
        halfL.body.setVelocity(vx - 140, vy - 60);
        halfL.body.setGravityY(520);
        halfL.setAngularVelocity(-350);

        const halfR = this.physics.add.sprite(ox, oy, `fruit-${obj.key}-r`);
        halfR.body.setVelocity(vx + 140, vy - 60);
        halfR.body.setGravityY(520);
        halfR.setAngularVelocity(350);

        this.halvesGroup.add(halfL);
        this.halvesGroup.add(halfR);

        const pointsAdded = obj.points || 10;
        const isSpecial = obj.key === 'starfruit';
        const isHeart = obj.key === 'heartfruit';
        const isFrenzy = obj.key === 'frenzyfruit';

        // Score update
        this.score += pointsAdded;
        this.updateHUD();

        if (isSpecial) {
          this.triggerSpecialFruitOverlay(ox, oy, pointsAdded);
        } else if (isHeart) {
          this.lives = Math.min(3, this.lives + 1);
          this.updateLivesHUD();
          this.triggerLifeFruitOverlay(ox, oy);
        } else if (isFrenzy) {
          this.activateFrenzyMode();
          this.triggerFrenzyFruitOverlay(ox, oy);
        } else {
          playSplatNoise(0.15, 0.12); // Splat noise
          playSynth(600, 'triangle', 0.08, 0.08); // Metal swish
        }

        // Combo metrics tracking
        this.sliceCountInSwipe++;
        const nowTime = this.time.now;
        if (nowTime < this.lastSliceTime + 280) {
          if (this.sliceCountInSwipe >= 3) {
            this.triggerComboOverlay(ox, oy, this.sliceCountInSwipe);
          }
        } else {
          this.sliceCountInSwipe = 1;
        }
        this.lastSliceTime = nowTime;

        obj.destroy();
      }

      addSplat(x: number, y: number, r: number, color: number) {
        this.splats.push({ x, y, r, color, alpha: 0.8 });
        if (this.splats.length > 25) {
          this.splats.shift(); // conserve memory
        }
      }

      triggerComboOverlay(x: number, y: number, count: number) {
        playSweep(523.25, 1046.5, 0.2, 'sine', 0.1); // Combo chime arpeggio
        
        this.score += count * 5; // combo bonus points
        this.updateHUD();

        const txt = this.add.text(x, y - 30, `${count}x COMBO!`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '20px', fontWeight: 'bold', color: '#ffea00'
        }).setOrigin(0.5).setShadow(0, 0, '#ffea00', 8, true, true);

        this.tweens.add({
          targets: txt,
          y: y - 80,
          alpha: 0,
          scale: 1.4,
          duration: 750,
          onComplete: () => txt.destroy()
        });
      }

      triggerSpecialFruitOverlay(x: number, y: number, points: number) {
        // Play rising synth arpeggio (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          this.time.delayedCall(idx * 80, () => {
            playSynth(freq, 'sine', 0.15, 0.12);
          });
        });

        // Floating glowing "+50 SPECIAL!" text
        const txt = this.add.text(x, y - 30, `+${points} SPECIAL!`, {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#ffea00'
        }).setOrigin(0.5).setShadow(0, 0, '#ffea00', 12, true, true);

        this.tweens.add({
          targets: txt,
          y: y - 100,
          alpha: 0,
          scale: 1.5,
          duration: 900,
          onComplete: () => txt.destroy()
        });
      }

      triggerLifeFruitOverlay(x: number, y: number) {
        const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        notes.forEach((freq, idx) => {
          this.time.delayedCall(idx * 50, () => {
            playSynth(freq, 'sine', 0.2, 0.12);
          });
        });

        const txt = this.add.text(x, y - 30, '+1 LIFE!', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#ff0088'
        }).setOrigin(0.5).setShadow(0, 0, '#ff0088', 12, true, true);

        this.tweens.add({
          targets: txt,
          y: y - 100,
          alpha: 0,
          scale: 1.5,
          duration: 900,
          onComplete: () => txt.destroy()
        });
      }

      triggerFrenzyFruitOverlay(x: number, y: number) {
        playSweep(150, 600, 0.4, 'sawtooth', 0.12);
        playSweep(300, 1200, 0.4, 'sine', 0.08);

        const txt = this.add.text(x, y - 30, 'BLADE FRENZY!', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#ff7700'
        }).setOrigin(0.5).setShadow(0, 0, '#ff7700', 16, true, true);

        this.tweens.add({
          targets: txt,
          y: y - 100,
          alpha: 0,
          scale: 1.6,
          duration: 1000,
          onComplete: () => txt.destroy()
        });
      }

      drawFrenzyProgressBar() {
        const gfx = this.frenzyBarGraphics;
        gfx.clear();
        const W = this.scale.width;
        const progress = Math.max(0, this.frenzyDurationRemaining / 5000);
        const barW = 200;
        const barH = 8;
        const barX = W / 2 - barW / 2;
        const barY = 95;

        gfx.lineStyle(1.5, 0xff7700, 0.8);
        gfx.strokeRect(barX, barY, barW, barH);
        gfx.fillStyle(0xff7700, 0.6);
        gfx.fillRect(barX, barY, barW * progress, barH);

        if (!this.frenzyBarText) {
          this.frenzyBarText = this.add.text(W / 2, 82, '⚡ FRENZY ACTIVE! ⚡', {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '13px',
            color: '#ff7700',
            fontWeight: 'bold'
          }).setOrigin(0.5).setShadow(0, 0, '#ff7700', 8, true, true);
        }
      }

      activateFrenzyMode() {
        this.isFrenzyActive = true;
        this.frenzyDurationRemaining = 5000;

        if (this.frenzyTimer) {
          this.frenzyTimer.remove();
        }

        this.frenzyTimer = this.time.addEvent({
          delay: 5000,
          callback: () => {
            this.isFrenzyActive = false;
            this.frenzyDurationRemaining = 0;
            this.frenzyBarGraphics.clear();
            if (this.frenzyBarText) {
              this.frenzyBarText.destroy();
              this.frenzyBarText = null;
            }
          },
          callbackScope: this
        });
      }

      missFruit() {
        this.lives--;
        this.updateLivesHUD();

        // Sad slide sweep
        playSweep(300, 100, 0.35, 'triangle', 0.08);

        if (this.lives <= 0) {
          this.endGame();
        }
      }

      triggerBombExplosion(bomb: any) {
        this.isOver = true;
        this.spawnTimer.remove();

        const bx = bomb.x;
        const by = bomb.y;
        bomb.destroy();

        //Fullscreen shock flash
        this.cameras.main.flash(600, 255, 0, 55);
        this.cameras.main.shake(500, 0.025);

        playSweep(220, 40, 0.75, 'sawtooth', 0.25); // Heavy low bomb noise

        // Heavy red particle blast
        const exploder = this.add.particles(0, 0, 'juice-particle', {
          speed: { min: 100, max: 350 },
          angle: { min: 0, max: 360 },
          scale: { start: 2, end: 0 },
          alpha: { start: 1, end: 0 },
          color: [0xff0055, 0xffaa00, 0xffffff],
          blendMode: 'ADD',
          lifespan: 750,
        });
        exploder.explode(45, bx, by);

        this.time.delayedCall(2000, () => {
          this.endGameCard();
        });
      }

      endGame() {
        this.isOver = true;
        this.spawnTimer.remove();

        playSweep(180, 80, 0.5, 'square', 0.15);
        setTimeout(() => playSweep(140, 60, 0.7, 'square', 0.15), 300);

        this.endGameCard();
      }

      endGameCard() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 130, 0x08080f, 0.95).setStrokeStyle(1.5, 0xff0080);
        this.add.text(W / 2, H / 2 - 30, 'GAME OVER', {
          fontFamily: 'monospace', fontSize: '22px', color: '#ff0080', fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 5, `Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#f0f0ff'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 32, 'Click anywhere to Restart', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'fruit-slice', score: this.score }
        }));
      }

      restartGame() {
        this.scene.restart();
      }

      drawSwipeTrail() {
        const gfx = this.trailGraphics;
        gfx.clear();
        if (this.swipePoints.length < 2) return;

        // Draw thicker glowing trail
        gfx.lineStyle(6, 0xff00ff, 0.8);
        gfx.beginPath();
        gfx.moveTo(this.swipePoints[0].x, this.swipePoints[0].y);
        for (let i = 1; i < this.swipePoints.length; i++) {
          gfx.lineTo(this.swipePoints[i].x, this.swipePoints[i].y);
        }
        gfx.strokePath();

        // Inner hot white core line
        gfx.lineStyle(2, 0xffffff, 1);
        gfx.beginPath();
        gfx.moveTo(this.swipePoints[0].x, this.swipePoints[0].y);
        for (let i = 1; i < this.swipePoints.length; i++) {
          gfx.lineTo(this.swipePoints[i].x, this.swipePoints[i].y);
        }
        gfx.strokePath();
      }

      updateSplatsGraphics() {
        const gfx = this.splatGraphics;
        gfx.clear();

        // Update splat list and draw them
        this.splats.forEach((splat, idx) => {
          splat.alpha -= 0.0035; // fade slowly
          if (splat.alpha > 0) {
            gfx.fillStyle(splat.color, splat.alpha * 0.45);
            gfx.fillCircle(splat.x, splat.y, splat.r);

            // Draw a few smaller dripping dots around it
            gfx.fillStyle(splat.color, splat.alpha * 0.65);
            gfx.fillCircle(splat.x - splat.r * 0.4, splat.y + splat.r * 0.5, splat.r * 0.15);
            gfx.fillCircle(splat.x + splat.r * 0.5, splat.y + splat.r * 0.4, splat.r * 0.12);
          }
        });

        // Filter out vanished splats
        this.splats = this.splats.filter(s => s.alpha > 0);
      }

      drawBackgroundGrid() {
        const gfx = this.gridGraphics;
        gfx.clear();
        const W = this.scale.width;
        const H = this.scale.height;

        // Static cyberpunk space grid
        gfx.lineStyle(0.8, 0x1e1e38, 0.35);
        const gridW = 50;
        for (let x = 0; x < W; x += gridW) {
          gfx.lineBetween(x, 0, x, H);
        }
        for (let y = 0; y < H; y += gridW) {
          gfx.lineBetween(0, y, W, y);
        }
      }

      updateLivesHUD() {
        let stars = '';
        for (let i = 0; i < 3; i++) {
          stars += i < this.lives ? '⬢ ' : '⬡ ';
        }
        this.livesText.setText(`⚡ LIVES: ${stars}`);
      }

      updateHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);

        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.highScoreText.setText(`BEST: ${this.highScore}`);
          if (typeof window !== 'undefined') {
            localStorage.setItem('fruit_slice_high_score', this.highScore.toString());
          }
        }
      }
    };
  }
}
