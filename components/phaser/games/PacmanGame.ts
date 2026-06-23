// Pac-Man game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'pacman' in PhaserGameEngine.tsx

// Safe Web Audio API synthesizer for 8-bit retro sound effects
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

function playSound(frequency: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', duration: number = 0.1, gainValue: number = 0.1) {
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

// Complex frequency sweeping sounds
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

// Symmetric maze grid layout
// 1 = Wall, 0 = Regular Dot, 2 = Power Pellet, 3 = Ghost House Gate, 4 = Empty Corridor
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,4,1,4,1,1,1,0,1,1,1,1],
  [4,4,4,1,0,1,4,4,4,4,4,4,4,1,0,1,4,4,4],
  [1,1,1,1,0,1,4,1,1,3,1,1,4,1,0,1,1,1,1],
  [4,4,4,4,0,4,4,1,4,4,4,1,4,4,0,4,4,4,4],
  [1,1,1,1,0,1,4,1,1,1,1,1,4,1,0,1,1,1,1],
  [4,4,4,1,0,1,4,4,4,4,4,4,4,1,0,1,4,4,4],
  [1,1,1,1,0,1,4,1,1,1,1,1,4,1,0,1,1,1,1],
  [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,1,0,0,0,0,0,4,0,0,0,0,0,1,0,0,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const TILE_SIZE = 24;
const OFFSET_X = 12;
const OFFSET_Y = 40;

export default class PacmanGameFactory {
  static create(PhaserLib: any) {
    return class PacmanScene extends PhaserLib.Scene {
      // Game grid state
      grid!: number[][];
      dotsGroup!: Phaser.GameObjects.Group;
      pelletsGroup!: Phaser.GameObjects.Group;

      // Pacman entity
      pacman!: {
        x: number;
        y: number;
        px: number;
        py: number;
        tx: number;
        ty: number;
        dx: number;
        dy: number;
        ndx: number;
        ndy: number;
        speed: number;
        graphic: Phaser.GameObjects.Graphics;
      };

      // Ghosts list
      ghosts!: Array<{
        name: string;
        color: number;
        x: number;
        y: number;
        px: number;
        py: number;
        tx: number;
        ty: number;
        dx: number;
        dy: number;
        speed: number;
        state: 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';
        scatterTarget: { x: number; y: number };
        graphic: Phaser.GameObjects.Graphics;
        respawnTimer: number;
      }>;

      // Game Stats
      level!: number;
      score!: number;
      highScore!: number;
      lives!: number;
      isOver!: boolean;
      won!: boolean;
      frightenedTimer!: number;
      releaseTimer!: number;

      // HUD Text
      scoreText!: Phaser.GameObjects.Text;
      highScoreText!: Phaser.GameObjects.Text;
      livesText!: Phaser.GameObjects.Text;
      levelText!: Phaser.GameObjects.Text;

      // Chewing mouth animation helpers
      mouthAngle!: number;
      mouthOpening!: boolean;
      wakaTimer!: number;
      sirenTimer!: number;

      constructor() {
        super({ key: 'Pacman' });
      }

      init(data: any) {
        this.level = data?.level ?? 1;
        this.score = data?.score ?? 0;
        this.lives = data?.lives ?? 3;
        this.isOver = false;
        this.won = false;
        this.frightenedTimer = 0;
        this.releaseTimer = 0;
        this.mouthAngle = 0;
        this.mouthOpening = true;
        this.wakaTimer = 0;
        this.sirenTimer = 0;

        // Retrieve high score from local storage
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('pacman_high_score');
          this.highScore = saved ? parseInt(saved, 10) : 10000;
        } else {
          this.highScore = 10000;
        }
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Load Grid clone
        this.grid = MAZE.map(row => [...row]);

        // Render Maze static background walls
        const wallGfx = this.add.graphics();
        wallGfx.lineStyle(3, 0x0055ff, 1);
        wallGfx.fillStyle(0x002288, 0.2);

        for (let r = 0; r < this.grid.length; r++) {
          for (let c = 0; c < this.grid[r].length; c++) {
            const val = this.grid[r][c];
            const x = OFFSET_X + c * TILE_SIZE;
            const y = OFFSET_Y + r * TILE_SIZE;

            if (val === 1) {
              // Neon wall outline
              wallGfx.strokeRect(x + 1.5, y + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
              wallGfx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            } else if (val === 3) {
              // Ghost Gate: cyan neon thin block
              wallGfx.lineStyle(2, 0xff00ff, 1);
              wallGfx.lineBetween(x, y + TILE_SIZE / 2, x + TILE_SIZE, y + TILE_SIZE / 2);
              wallGfx.lineStyle(3, 0x0055ff, 1); // Reset wall style
            }
          }
        }

        // Setup dots and pellets groups
        this.dotsGroup = this.add.group();
        this.pelletsGroup = this.add.group();
        this.drawDots();

        // Calculate scaled speeds based on level
        const pacmanSpeed = Math.min(3.0, 2.2 + (this.level - 1) * 0.1);
        const ghostSpeed = Math.min(2.8, 1.8 + (this.level - 1) * 0.18);

        // HUD Setup
        this.scoreText = this.add.text(12, 12, `SCORE: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
        });
        this.highScoreText = this.add.text(W / 2, 12, `HIGH: ${this.highScore}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5, 0);
        this.levelText = this.add.text(W / 2, 28, `LEVEL: ${this.level}`, {
          fontFamily: 'monospace', fontSize: '12px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5, 0);
        this.livesText = this.add.text(W - 12, 12, '', {
          fontFamily: 'monospace', fontSize: '13px', color: '#39ff14', fontWeight: 'bold'
        }).setOrigin(1, 0);
        
        this.updateLivesHUD();

        // Instantiate Pacman
        this.pacman = {
          x: 9,
          y: 16,
          px: OFFSET_X + 9 * TILE_SIZE + TILE_SIZE / 2,
          py: OFFSET_Y + 16 * TILE_SIZE + TILE_SIZE / 2,
          tx: 9,
          ty: 16,
          dx: 0,
          dy: 0,
          ndx: 0,
          ndy: 0,
          speed: pacmanSpeed,
          graphic: this.add.graphics()
        };

        // Instantiate Ghosts (Blinky, Pinky, Inky, Clyde)
        this.ghosts = [
          {
            name: 'Blinky', color: 0xff0000, x: 9, y: 8,
            px: OFFSET_X + 9 * TILE_SIZE + TILE_SIZE / 2, py: OFFSET_Y + 8 * TILE_SIZE + TILE_SIZE / 2,
            tx: 9, ty: 8, dx: 0, dy: -1, speed: ghostSpeed, state: 'SCATTER',
            scatterTarget: { x: 17, y: 1 }, graphic: this.add.graphics(), respawnTimer: 0
          },
          {
            name: 'Pinky', color: 0xffb8ff, x: 8, y: 10,
            px: OFFSET_X + 8 * TILE_SIZE + TILE_SIZE / 2, py: OFFSET_Y + 10 * TILE_SIZE + TILE_SIZE / 2,
            tx: 8, ty: 10, dx: 0, dy: -1, speed: ghostSpeed, state: 'SCATTER',
            scatterTarget: { x: 1, y: 1 }, graphic: this.add.graphics(), respawnTimer: 0
          },
          {
            name: 'Inky', color: 0x00ffff, x: 9, y: 10,
            px: OFFSET_X + 9 * TILE_SIZE + TILE_SIZE / 2, py: OFFSET_Y + 10 * TILE_SIZE + TILE_SIZE / 2,
            tx: 9, ty: 10, dx: 0, dy: -1, speed: ghostSpeed, state: 'SCATTER',
            scatterTarget: { x: 17, y: 20 }, graphic: this.add.graphics(), respawnTimer: 0
          },
          {
            name: 'Clyde', color: 0xffb851, x: 10, y: 10,
            px: OFFSET_X + 10 * TILE_SIZE + TILE_SIZE / 2, py: OFFSET_Y + 10 * TILE_SIZE + TILE_SIZE / 2,
            tx: 10, ty: 10, dx: 0, dy: -1, speed: ghostSpeed, state: 'SCATTER',
            scatterTarget: { x: 1, y: 20 }, graphic: this.add.graphics(), respawnTimer: 0
          }
        ];

        // Controls binding
        const keyboard = this.input.keyboard;
        keyboard.on('keydown', (e: KeyboardEvent) => {
          // Initialize/Resume AudioContext on user input
          getAudioContext();

          if (this.isOver) {
            if (e.code === 'Space') this.restartGame();
            return;
          }
          if (this.won) return;

          switch (e.code) {
            case 'ArrowUp': case 'KeyW':
              this.pacman.ndx = 0; this.pacman.ndy = -1; break;
            case 'ArrowDown': case 'KeyS':
              this.pacman.ndx = 0; this.pacman.ndy = 1; break;
            case 'ArrowLeft': case 'KeyA':
              this.pacman.ndx = -1; this.pacman.ndy = 0; break;
            case 'ArrowRight': case 'KeyD':
              this.pacman.ndx = 1; this.pacman.ndy = 0; break;
          }
        });

        // Pointer click restart binding
        this.input.on('pointerdown', () => {
          getAudioContext();
          if (this.isOver) {
            this.restartGame();
          }
        });
      }

      drawDots() {
        this.dotsGroup.clear(true, true);
        this.pelletsGroup.clear(true, true);

        for (let r = 0; r < this.grid.length; r++) {
          for (let c = 0; c < this.grid[r].length; c++) {
            const val = this.grid[r][c];
            const x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
            const y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;

            if (val === 0) {
              // Small regular dot
              const d = this.add.circle(x, y, 3.5, 0xffea00);
              this.dotsGroup.add(d);
            } else if (val === 2) {
              // Large flashing Power Pellet
              const p = this.add.circle(x, y, 7, 0xff5500);
              this.tweens.add({
                targets: p,
                alpha: 0.2,
                duration: 250,
                yoyo: true,
                repeat: -1
              });
              this.pelletsGroup.add(p);
            }
          }
        }
      }

      update(time: number, delta: number) {
        if (this.isOver || this.won) return;

        this.releaseTimer += delta;

        // Pacman movements
        this.movePacman();
        this.eatItems();

        // Ghosts state machine and move logic
        this.moveGhosts(delta);

        // Sound sweeps
        this.playSiren(time);

        // Animate entities
        this.drawEntities();
        this.checkCollisions();
      }

      movePacman() {
        const pm = this.pacman;
        
        // Check if aligned at cell center
        const alignX = pm.px === OFFSET_X + pm.x * TILE_SIZE + TILE_SIZE / 2;
        const alignY = pm.py === OFFSET_Y + pm.y * TILE_SIZE + TILE_SIZE / 2;

        if (alignX && alignY) {
          // Check if buffer direction is clear to switch
          if (this.isClearPath(pm.x, pm.y, pm.ndx, pm.ndy)) {
            pm.dx = pm.ndx;
            pm.dy = pm.ndy;
          }

          // Check if current direction is clear to move
          if (this.isClearPath(pm.x, pm.y, pm.dx, pm.dy)) {
            pm.tx = pm.x + pm.dx;
            pm.ty = pm.y + pm.dy;
          } else {
            // Stop Pacman
            pm.tx = pm.x;
            pm.ty = pm.y;
            pm.dx = 0;
            pm.dy = 0;
          }
        }

        // Progress pixel movement towards target cell
        const targetPX = OFFSET_X + pm.tx * TILE_SIZE + TILE_SIZE / 2;
        const targetPY = OFFSET_Y + pm.ty * TILE_SIZE + TILE_SIZE / 2;

        if (pm.px !== targetPX) {
          const moveStep = Math.min(pm.speed, Math.abs(pm.px - targetPX));
          pm.px += pm.dx * moveStep;
        }
        if (pm.py !== targetPY) {
          const moveStep = Math.min(pm.speed, Math.abs(pm.py - targetPY));
          pm.py += pm.dy * moveStep;
        }

        // Update grid position when target reached
        if (pm.px === targetPX && pm.py === targetPY) {
          pm.x = pm.tx;
          pm.y = pm.ty;

          // Wrap around portals left & right
          if (pm.x < 0) {
            pm.x = this.grid[0].length - 1;
            pm.tx = pm.x;
            pm.px = OFFSET_X + pm.x * TILE_SIZE + TILE_SIZE / 2;
          } else if (pm.x >= this.grid[0].length) {
            pm.x = 0;
            pm.tx = pm.x;
            pm.px = OFFSET_X + pm.x * TILE_SIZE + TILE_SIZE / 2;
          }
        }
      }

      eatItems() {
        const pm = this.pacman;
        const gridVal = this.grid[pm.y][pm.x];

        if (gridVal === 0) {
          // Eat Regular Dot
          this.grid[pm.y][pm.x] = 4; // Set to empty corridor
          this.dotsGroup.getChildren().forEach((child: any) => {
            if (Math.abs(child.x - pm.px) < 10 && Math.abs(child.y - pm.py) < 10) {
              child.destroy();
            }
          });

          this.score += 10;
          this.updateScoreHUD();
          this.triggerWakaSound();
          this.checkWinState();

        } else if (gridVal === 2) {
          // Eat Power Pellet
          this.grid[pm.y][pm.x] = 4;
          this.pelletsGroup.getChildren().forEach((child: any) => {
            if (Math.abs(child.x - pm.px) < 10 && Math.abs(child.y - pm.py) < 10) {
              child.destroy();
            }
          });

          this.score += 50;
          this.updateScoreHUD();
          playSound(260, 'sawtooth', 0.25, 0.15); // Low power blast tone
          this.triggerFrightenedMode();
          this.checkWinState();
        }
      }

      triggerWakaSound() {
        this.wakaTimer++;
        if (this.wakaTimer % 6 === 0) {
          // Alternating waka-waka pitch
          const freq = (this.wakaTimer / 6) % 2 === 0 ? 380 : 260;
          playSound(freq, 'sine', 0.08, 0.08);
        }
      }

      playSiren(time: number) {
        if (this.isOver || this.won) return;

        // Frightened siren or standard background sweep
        if (this.frightenedTimer > 0) {
          if (time > this.sirenTimer + 300) {
            playSweep(150, 220, 0.15, 'triangle', 0.04);
            this.sirenTimer = time;
          }
        } else {
          if (time > this.sirenTimer + 700) {
            playSweep(250, 180, 0.4, 'sine', 0.03);
            this.sirenTimer = time;
          }
        }
      }

      triggerFrightenedMode() {
        this.frightenedTimer = Math.max(1200, 7000 - (this.level - 1) * 1300); // Frightened duration scales down with level
        this.ghosts.forEach(g => {
          if (g.state !== 'EATEN') {
            g.state = 'FRIGHTENED';
            // Reverse direction immediately on power pellet
            g.dx *= -1;
            g.dy *= -1;
            g.tx = g.x;
            g.ty = g.y;
          }
        });
      }

      moveGhosts(delta: number) {
        if (this.frightenedTimer > 0) {
          this.frightenedTimer -= delta;
          if (this.frightenedTimer <= 0) {
            // Restore normal states
            this.ghosts.forEach(g => {
              if (g.state === 'FRIGHTENED') g.state = 'CHASE';
            });
          }
        }

        this.ghosts.forEach(g => {
          // Handle EATEN eyes returning to house respawn delay
          if (g.state === 'EATEN') {
            if (g.x === 9 && g.y === 10) {
              g.respawnTimer += delta;
              if (g.respawnTimer >= 2000) {
                g.state = 'CHASE';
                g.respawnTimer = 0;
              }
              this.drawGhostEyesOnly(g);
              return;
            }
          }

          // Check grid center alignment
          const alignX = g.px === OFFSET_X + g.x * TILE_SIZE + TILE_SIZE / 2;
          const alignY = g.py === OFFSET_Y + g.y * TILE_SIZE + TILE_SIZE / 2;

          if (alignX && alignY) {
            const nextMove = this.getGhostNextMove(g);
            g.dx = nextMove.dx;
            g.dy = nextMove.dy;
            g.tx = g.x + g.dx;
            g.ty = g.y + g.dy;
          }

          // Adjust speed based on state
          let currentSpeed = g.speed;
          if (g.state === 'FRIGHTENED') currentSpeed = g.speed * 0.55;
          if (g.state === 'EATEN') currentSpeed = g.speed * 2.2;

          // Slide pixel coordinates
          const targetPX = OFFSET_X + g.tx * TILE_SIZE + TILE_SIZE / 2;
          const targetPY = OFFSET_Y + g.ty * TILE_SIZE + TILE_SIZE / 2;

          if (g.px !== targetPX) {
            const moveStep = Math.min(currentSpeed, Math.abs(g.px - targetPX));
            g.px += g.dx * moveStep;
          }
          if (g.py !== targetPY) {
            const moveStep = Math.min(currentSpeed, Math.abs(g.py - targetPY));
            g.py += g.dy * moveStep;
          }

          if (g.px === targetPX && g.py === targetPY) {
            g.x = g.tx;
            g.y = g.ty;

            // Portal wraparound
            if (g.x < 0) {
              g.x = this.grid[0].length - 1;
              g.tx = g.x;
              g.px = OFFSET_X + g.x * TILE_SIZE + TILE_SIZE / 2;
            } else if (g.x >= this.grid[0].length) {
              g.x = 0;
              g.tx = g.x;
              g.px = OFFSET_X + g.x * TILE_SIZE + TILE_SIZE / 2;
            }
          }
        });
      }

      getGhostNextMove(g: any): { dx: number; dy: number } {
        // Targets mapping based on AI states
        let targetX = 9;
        let targetY = 8;

        if (g.state === 'EATEN') {
          // Head back to ghost house gate
          targetX = 9;
          targetY = 10;
        } else if (g.state === 'SCATTER') {
          targetX = g.scatterTarget.x;
          targetY = g.scatterTarget.y;
        } else if (g.state === 'CHASE') {
          // Classic behaviors
          if (g.name === 'Blinky') {
            targetX = this.pacman.x;
            targetY = this.pacman.y;
          } else if (g.name === 'Pinky') {
            targetX = this.pacman.x + this.pacman.dx * 4;
            targetY = this.pacman.y + this.pacman.dy * 4;
          } else if (g.name === 'Inky') {
            // Vector offset relative to Blinky
            const blinky = this.ghosts[0];
            const pmX = this.pacman.x + this.pacman.dx * 2;
            const pmY = this.pacman.y + this.pacman.dy * 2;
            targetX = pmX + (pmX - blinky.x);
            targetY = pmY + (pmY - blinky.y);
          } else {
            // Clyde: chases when far (>8 tiles), scatters when close
            const dist = Phaser.Math.Distance.Between(g.x, g.y, this.pacman.x, this.pacman.y);
            if (dist > 8) {
              targetX = this.pacman.x;
              targetY = this.pacman.y;
            } else {
              targetX = g.scatterTarget.x;
              targetY = g.scatterTarget.y;
            }
          }
        }

        // Evaluate all open paths (excluding reversals)
        const dirs = [
          { dx: 0, dy: -1 }, // Up
          { dx: -1, dy: 0 }, // Left
          { dx: 0, dy: 1 },  // Down
          { dx: 1, dy: 0 }   // Right
        ];

        const validMoves: Array<{ dx: number; dy: number; dist: number }> = [];

        dirs.forEach(d => {
          // Cannot immediately reverse direction
          if (d.dx === -g.dx && d.dy === -g.dy) return;

          const nx = g.x + d.dx;
          const ny = g.y + d.dy;

          if (this.isClearPathGhost(g, nx, ny, d.dx, d.dy)) {
            let dist = 99999;
            if (g.state === 'FRIGHTENED') {
              dist = Math.random(); // Frightened wander randomly
            } else {
              dist = Phaser.Math.Distance.Between(nx, ny, targetX, targetY);
            }
            validMoves.push({ dx: d.dx, dy: d.dy, dist });
          }
        });

        // Backup plan: if no moves except reversal, reverse
        if (validMoves.length === 0) {
          return { dx: -g.dx, dy: -g.dy };
        }

        // Pick neighbor closest to target destination
        validMoves.sort((a, b) => a.dist - b.dist);
        return { dx: validMoves[0].dx, dy: validMoves[0].dy };
      }

      isClearPath(x: number, y: number, dx: number, dy: number): boolean {
        const nx = x + dx;
        const ny = y + dy;
        
        // Wraparound boundary portals are clear
        if (nx < 0 || nx >= MAZE[0].length) return true;
        if (ny < 0 || ny >= MAZE.length) return false;

        const tile = this.grid[ny][nx];
        return tile !== 1 && tile !== 3; // Pacman cannot cross gates (3) or walls (1)
      }

      isClearPathGhost(g: any, nx: number, ny: number, dx: number, dy: number): boolean {
        if (nx < 0 || nx >= MAZE[0].length) return true;
        if (ny < 0 || ny >= MAZE.length) return false;

        const tile = this.grid[ny][nx];

        // Eaten eyes can pass through gate freely
        if (g.state === 'EATEN') {
          return tile !== 1;
        }

        // Standard ghosts can cross gate (3) to exit the house under release timers
        if (tile === 3) {
          if (dy === -1) {
            // Exit house: check release timer
            if (g.name === 'Pinky' && this.releaseTimer < 500) return false;
            if (g.name === 'Inky' && this.releaseTimer < 3000) return false;
            if (g.name === 'Clyde' && this.releaseTimer < 6000) return false;
            return true;
          }
          // Cannot enter house from outside
          return false;
        }

        return tile !== 1;
      }

      checkCollisions() {
        const pm = this.pacman;

        this.ghosts.forEach(g => {
          // Distance threshold: within 12 pixels
          const dist = Phaser.Math.Distance.Between(pm.px, pm.py, g.px, g.py);
          if (dist < 12) {
            if (g.state === 'FRIGHTENED') {
              // Eat Ghost!
              g.state = 'EATEN';
              g.tx = g.x;
              g.ty = g.y;
              this.score += 200;
              this.updateScoreHUD();
              playSound(523.25, 'triangle', 0.25, 0.15); // High point chime
              setTimeout(() => playSound(659.25, 'triangle', 0.25, 0.15), 100);
            } else if (g.state !== 'EATEN') {
              // Collide with ghost -> lose life
              this.loseLife();
            }
          }
        });
      }

      loseLife() {
        this.lives--;
        this.updateLivesHUD();
        playSound(120, 'sawtooth', 0.4, 0.2); // Buzz tone

        // Sad falling slide sound
        playSweep(440, 50, 0.7, 'sine', 0.15);

        if (this.lives <= 0) {
          this.endGame();
        } else {
          // Reset positions to spawn center
          this.resetPositions();
        }
      }

      resetPositions() {
        this.releaseTimer = 0;
        // Pacman reset
        const pm = this.pacman;
        pm.x = 9; pm.y = 16;
        pm.px = OFFSET_X + 9 * TILE_SIZE + TILE_SIZE / 2;
        pm.py = OFFSET_Y + 16 * TILE_SIZE + TILE_SIZE / 2;
        pm.tx = 9; pm.ty = 16;
        pm.dx = 0; pm.dy = 0;
        pm.ndx = 0; pm.ndy = 0;

        // Ghosts reset
        this.ghosts[0].x = 9; this.ghosts[0].y = 8;   // Blinky
        this.ghosts[1].x = 8; this.ghosts[1].y = 10;  // Pinky
        this.ghosts[2].x = 9; this.ghosts[2].y = 10;  // Inky
        this.ghosts[3].x = 10; this.ghosts[3].y = 10; // Clyde

        this.ghosts.forEach(g => {
          g.px = OFFSET_X + g.x * TILE_SIZE + TILE_SIZE / 2;
          g.py = OFFSET_Y + g.y * TILE_SIZE + TILE_SIZE / 2;
          g.tx = g.x;
          g.ty = g.y;
          g.dx = 0;
          g.dy = -1;
          if (g.state !== 'EATEN') g.state = 'SCATTER';
        });
      }

      updateScoreHUD() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.highScoreText.setText(`HIGH: ${this.highScore}`);
          if (typeof window !== 'undefined') {
            localStorage.setItem('pacman_high_score', this.highScore.toString());
          }
        }
      }

      updateLivesHUD() {
        let stars = '';
        for (let i = 0; i < 3; i++) {
          stars += i < this.lives ? '⬡ ' : '  ';
        }
        this.livesText.setText(`LIVES: ${stars}`);
      }

      checkWinState() {
        // Win when all regular dots are eaten
        const dotsLeft = this.dotsGroup.getLength();
        if (dotsLeft === 0) {
          this.winGame();
        }
      }

      winGame() {
        this.won = true;
        this.pacman.dx = 0;
        this.pacman.dy = 0;
        this.ghosts.forEach(g => {
          g.dx = 0;
          g.dy = 0;
        });

        // Victory fanfare arpeggio
        playSweep(130.81, 261.63, 0.15, 'square', 0.12);
        setTimeout(() => playSweep(164.81, 329.63, 0.15, 'square', 0.12), 150);
        setTimeout(() => playSweep(196.00, 392.00, 0.15, 'square', 0.12), 300);
        setTimeout(() => playSweep(261.63, 523.25, 0.45, 'square', 0.12), 450);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 130, 0x08080f, 0.95).setStrokeStyle(1, 0x39ff14);
        this.add.text(W / 2, H / 2 - 30, '🏆 LEVEL CLEAR!', {
          fontFamily: 'monospace', fontSize: '20px', color: '#39ff14', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 5, `Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#f0f0ff'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 32, 'Preparing Next Level...', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        // Advance to next level automatically
        this.time.delayedCall(2500, () => {
          this.scene.restart({ level: this.level + 1, score: this.score, lives: this.lives });
        });
      }

      endGame() {
        this.isOver = true;
        this.pacman.dx = 0;
        this.pacman.dy = 0;

        // Low tragic chord sweep
        playSweep(180, 80, 0.5, 'square', 0.15);
        setTimeout(() => playSweep(140, 60, 0.7, 'square', 0.15), 300);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 130, 0x08080f, 0.95).setStrokeStyle(1, 0xff0080);
        this.add.text(W / 2, H / 2 - 30, 'GAME OVER', {
          fontFamily: 'monospace', fontSize: '22px', color: '#ff0080', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 5, `Final Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#f0f0ff'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 32, 'Press SPACE or CLICK to Restart', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'pacman', score: this.score }
        }));
      }

      restartGame() {
        this.scene.restart({ level: 1, score: 0, lives: 3 });
      }

      drawEntities() {
        // Draw Pacman
        this.drawPacman();

        // Draw Ghosts
        this.ghosts.forEach(g => {
          if (g.state === 'EATEN') {
            this.drawGhostEyesOnly(g);
          } else {
            this.drawGhostStandard(g);
          }
        });
      }

      drawPacman() {
        const pm = this.pacman;
        const gfx = pm.graphic;
        gfx.clear();

        // Chewing mouth cycles
        if (pm.dx !== 0 || pm.dy !== 0) {
          if (this.mouthOpening) {
            this.mouthAngle += 3;
            if (this.mouthAngle >= 42) this.mouthOpening = false;
          } else {
            this.mouthAngle -= 3;
            if (this.mouthAngle <= 3) this.mouthOpening = true;
          }
        }

        gfx.fillStyle(0xffea00, 1);
        gfx.lineStyle(1.5, 0x000000, 1);

        // Determine slice angle orientation
        let rotationRad = 0;
        if (pm.dx === 1) rotationRad = 0;
        else if (pm.dy === 1) rotationRad = Math.PI / 2;
        else if (pm.dx === -1) rotationRad = Math.PI;
        else if (pm.dy === -1) rotationRad = -Math.PI / 2;

        const startAngle = rotationRad + Phaser.Math.DegToRad(this.mouthAngle);
        const endAngle = rotationRad + Phaser.Math.DegToRad(360 - this.mouthAngle);

        // Draw Pie Slice sector
        gfx.slice(pm.px, pm.py, 10, startAngle, endAngle);
        gfx.fillPath();
        gfx.strokePath();
      }

      drawGhostStandard(g: any) {
        const gfx = g.graphic;
        gfx.clear();

        let baseColor = g.color;
        
        // Frightened ghosts turn neon cyan-blue or flash white
        if (g.state === 'FRIGHTENED') {
          baseColor = this.frightenedTimer < 2000 && Math.floor(this.frightenedTimer / 200) % 2 === 0
            ? 0xffffff
            : 0x1d4ed8; // Dark neon blue
        }

        gfx.fillStyle(baseColor, 1);
        gfx.lineStyle(1.2, 0x000000, 1);

        // Draw standard jelly dome
        gfx.beginPath();
        gfx.arc(g.px, g.py - 1, 9.5, Math.PI, 0, false);
        gfx.lineTo(g.px + 9.5, g.py + 9.5);
        // Draw squiggly tentacles bottom
        gfx.lineTo(g.px + 5.5, g.py + 6.5);
        gfx.lineTo(g.px + 2, g.py + 9.5);
        gfx.lineTo(g.px - 2, g.py + 6.5);
        gfx.lineTo(g.px - 5.5, g.py + 9.5);
        gfx.lineTo(g.px - 9.5, g.py + 6.5);
        gfx.closePath();
        gfx.fillPath();
        gfx.strokePath();

        // Draw eyes
        this.drawEyesPupils(g);
      }

      drawGhostEyesOnly(g: any) {
        const gfx = g.graphic;
        gfx.clear();
        this.drawEyesPupils(g);
      }

      drawEyesPupils(g: any) {
        const gfx = g.graphic;

        // Frightened ghosts have small frightened eyes
        if (g.state === 'FRIGHTENED') {
          gfx.fillStyle(0xffea00, 1); // Yellow pupil
          gfx.fillCircle(g.px - 3.5, g.py - 1, 2);
          gfx.fillCircle(g.px + 3.5, g.py - 1, 2);
          return;
        }

        // Normal eyes backing
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(g.px - 3.8, g.py - 1.8, 3.2);
        gfx.fillCircle(g.px + 3.8, g.py - 1.8, 3.2);

        // Pupils look towards current movement heading
        let ox = 0;
        let oy = 0;
        if (g.dx === 1) ox = 1.3;
        else if (g.dx === -1) ox = -1.3;
        else if (g.dy === 1) oy = 1.3;
        else if (g.dy === -1) oy = -1.3;

        gfx.fillStyle(0x0f172a, 1);
        gfx.fillCircle(g.px - 3.8 + ox, g.py - 1.8 + oy, 1.4);
        gfx.fillCircle(g.px + 3.8 + ox, g.py - 1.8 + oy, 1.4);
      }
    };
  }
}
