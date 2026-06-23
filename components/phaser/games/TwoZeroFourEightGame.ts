// 2048 Cyber game — factory pattern for SSR-safe Phaser.js loading
// Register key: '2048' in PhaserGameEngine.tsx

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

const TILE_SIZE = 90;
const GAP_SIZE = 10;
const GRID_SIZE = 4;
const OFFSET_X = 45;
const OFFSET_Y = 125;

// Cyberpunk color palettes for values
const TILE_COLORS: Record<number, number> = {
  2: 0x0055ff,    // Neon Dark Blue
  4: 0x00d4ff,    // Neon Cyan
  8: 0x39ff14,    // Neon Green
  16: 0xa3e635,   // Neon Lime
  32: 0xffea00,   // Neon Yellow
  64: 0xff9900,   // Neon Orange
  128: 0xff00ff,  // Neon Magenta
  256: 0xff0055,  // Neon Pink/Red
  512: 0xbd00ff,  // Neon Violet
  1024: 0x00ffff, // Neon Turquoise
  2048: 0xffd700  // Neon Gold
};

const TEXT_COLORS: Record<number, string> = {
  2: '#ffffff',
  4: '#08080f',
  8: '#08080f',
  16: '#08080f',
  32: '#08080f',
  64: '#ffffff',
  128: '#ffffff',
  256: '#ffffff',
  512: '#ffffff',
  1024: '#08080f',
  2048: '#08080f'
};

export default class TwoZeroFourEightGameFactory {
  static create(PhaserLib: any) {
    return class TwoZeroFourEightScene extends PhaserLib.Scene {
      board!: number[][];
      tileContainers!: (Phaser.GameObjects.Container | null)[][];
      
      score!: number;
      highScore!: number;
      isOver!: boolean;
      won!: boolean;
      hasReached2048!: boolean;

      // Undo state history (1-step history)
      hasUndoHistory!: boolean;
      undoBoard!: number[][];
      undoScore!: number;

      // HUD elements
      scoreText!: Phaser.GameObjects.Text;
      highScoreText!: Phaser.GameObjects.Text;
      undoButton!: Phaser.GameObjects.Text;
      boardBgGraphics!: Phaser.GameObjects.Graphics;
      starGraphics!: Phaser.GameObjects.Graphics;

      starFields!: Array<{ x: number; y: number; alpha: number; speed: number }>;
      isAnimating!: boolean;

      constructor() {
        super({ key: 'TwoZeroFourEight' });
      }

      init() {
        this.board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        this.tileContainers = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
        this.score = 0;
        this.isOver = false;
        this.won = false;
        this.hasReached2048 = false;
        this.isAnimating = false;

        this.hasUndoHistory = false;
        this.undoBoard = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        this.undoScore = 0;

        // Retrieve high score from local storage
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('2048_high_score');
          this.highScore = saved ? parseInt(saved, 10) : 0;
        } else {
          this.highScore = 0;
        }

        // Initialize Starfield points
        this.starFields = Array.from({ length: 30 }, () => ({
          x: Math.random() * 500,
          y: Math.random() * 600,
          alpha: Math.random(),
          speed: 0.1 + Math.random() * 0.4
        }));
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.starGraphics = this.add.graphics();
        this.boardBgGraphics = this.add.graphics();

        // Title Label
        this.add.text(W / 2, 35, '2048 CYBER', {
          fontFamily: 'Orbitron, monospace', fontSize: '26px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00d4ff', 8, true, true);

        // Score HUD panels
        this.scoreText = this.add.text(120, 85, 'SCORE\n0', {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#ff00ff', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        this.highScoreText = this.add.text(W - 120, 85, `BEST\n${this.highScore}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#ffea00', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        // Undo button
        this.undoButton = this.add.text(W / 2, 565, 'UNDO MOVE', {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#a0a0b0', fontWeight: 'bold', cursor: 'pointer'
        }).setOrigin(0.5);
        this.undoButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 20), Phaser.Geom.Rectangle.Contains);
        this.undoButton.on('pointerdown', () => {
          this.executeUndo();
        });

        this.drawBoardBackground();

        // Spawn first two tiles
        this.spawnTile();
        this.spawnTile();

        // Register keyboard controls
        const keyboard = this.input.keyboard;
        keyboard.on('keydown', (e: KeyboardEvent) => {
          getAudioContext();

          if (this.isOver || this.won) {
            if (e.code === 'Space') this.restartGame();
            return;
          }

          if (this.isAnimating) return; // Prevent moves while sliding

          let slideDir: 'L' | 'R' | 'U' | 'D' | null = null;
          switch (e.code) {
            case 'ArrowLeft': case 'KeyA':
              slideDir = 'L'; break;
            case 'ArrowRight': case 'KeyD':
              slideDir = 'R'; break;
            case 'ArrowUp': case 'KeyW':
              slideDir = 'U'; break;
            case 'ArrowDown': case 'KeyS':
              slideDir = 'D'; break;
          }

          if (slideDir) {
            this.handleMove(slideDir);
          }
        });

        // Click on game-over or win to restart
        this.input.on('pointerdown', (pointer: any) => {
          getAudioContext();
          if (this.isOver || this.won) {
            // Check click isn't on the undo button
            if (pointer.y < 540) {
              this.restartGame();
            }
          }
        });
      }

      drawBoardBackground() {
        const gfx = this.boardBgGraphics;
        gfx.clear();

        // Grid backing panel
        const totalSize = GRID_SIZE * TILE_SIZE + (GRID_SIZE + 1) * GAP_SIZE;
        gfx.fillStyle(0x0c0f1d, 0.85); // glassmorphism backing
        gfx.lineStyle(1.8, 0x00d4ff, 0.9); // neon cyan border
        gfx.fillRect(OFFSET_X, OFFSET_Y, totalSize, totalSize);
        gfx.strokeRect(OFFSET_X, OFFSET_Y, totalSize, totalSize);

        // Draw empty slot outlines
        gfx.lineStyle(1.2, 0x1e293b, 0.5);
        gfx.fillStyle(0x08080f, 0.4);

        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const x = OFFSET_X + GAP_SIZE + c * (TILE_SIZE + GAP_SIZE);
            const y = OFFSET_Y + GAP_SIZE + r * (TILE_SIZE + GAP_SIZE);
            gfx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            gfx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      spawnTile() {
        const emptyCells: Array<{ r: number; c: number }> = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (this.board[r][c] === 0) {
              emptyCells.push({ r, c });
            }
          }
        }

        if (emptyCells.length === 0) return;

        // Choose random empty cell
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // 90% chance of 2, 10% chance of 4
        const val = Math.random() < 0.9 ? 2 : 4;
        this.board[cell.r][cell.c] = val;

        // Draw container tile
        const container = this.createTileContainer(cell.r, cell.c, val);
        this.tileContainers[cell.r][cell.c] = container;

        // Fade in scale animation on spawn
        container.setScale(0);
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 120,
          ease: 'Back.easeOut'
        });
      }

      createTileContainer(row: number, col: number, val: number): Phaser.GameObjects.Container {
        const x = OFFSET_X + GAP_SIZE + col * (TILE_SIZE + GAP_SIZE) + TILE_SIZE / 2;
        const y = OFFSET_Y + GAP_SIZE + row * (TILE_SIZE + GAP_SIZE) + TILE_SIZE / 2;

        const container = this.add.container(x, y);

        // Graphics box background
        const bg = this.add.graphics();
        const color = TILE_COLORS[val] || 0xff00b0;
        bg.fillStyle(color, 1);
        bg.lineStyle(1.5, 0x000000, 0.8);
        bg.fillRect(-TILE_SIZE / 2 + 1, -TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        bg.strokeRect(-TILE_SIZE / 2 + 1, -TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // Inner glowing borders
        bg.lineStyle(1.2, 0xffffff, 0.25);
        bg.strokeRect(-TILE_SIZE / 2 + 3, -TILE_SIZE / 2 + 3, TILE_SIZE - 6, TILE_SIZE - 6);

        // Text label
        const txtColor = TEXT_COLORS[val] || '#ffffff';
        const fontSize = val >= 1000 ? '20px' : val >= 100 ? '24px' : '28px';
        const textObj = this.add.text(0, 0, val.toString(), {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: fontSize,
          color: txtColor,
          fontWeight: 'bold'
        }).setOrigin(0.5);

        container.add(bg);
        container.add(textObj);
        
        // Store piece value directly on container for animations Reference
        (container as any).tileValue = val;

        return container;
      }

      handleMove(dir: 'L' | 'R' | 'U' | 'D') {
        // 1. Save state for Undo
        this.saveUndoState();

        // 2. Perform slide math calculations
        const moves: Array<{
          container: Phaser.GameObjects.Container;
          from: { r: number; c: number };
          to: { r: number; c: number };
          merge: boolean;
          mergedVal?: number;
        }> = [];

        const nextBoard = this.board.map(row => [...row]);
        const nextContainers = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

        let moved = false;

        // Traversal order based on direction
        const rows = dir === 'D' ? [3, 2, 1, 0] : [0, 1, 2, 3];
        const cols = dir === 'R' ? [3, 2, 1, 0] : [0, 1, 2, 3];

        const dr = dir === 'U' ? -1 : dir === 'D' ? 1 : 0;
        const dc = dir === 'L' ? -1 : dir === 'R' ? 1 : 0;

        // Track merged status of tiles in this slide to prevent double-merging in a single turn
        const mergedCells = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

        for (const r of rows) {
          for (const c of cols) {
            const val = this.board[r][c];
            if (val === 0) continue;

            const container = this.tileContainers[r][c]!;
            let currR = r;
            let currC = c;

            // Slide block as far as possible
            while (true) {
              const nextR = currR + dr;
              const nextC = currC + dc;

              if (nextR < 0 || nextR >= GRID_SIZE || nextC < 0 || nextC >= GRID_SIZE) break;

              const nextVal = nextBoard[nextR][nextC];
              if (nextVal === 0) {
                // Shift forward
                currR = nextR;
                currC = nextC;
              } else if (nextVal === val && !mergedCells[nextR][nextC]) {
                // Merge tiles!
                currR = nextR;
                currC = nextC;
                mergedCells[nextR][nextC] = true;
                break;
              } else {
                break;
              }
            }

            if (currR !== r || currC !== c) {
              moved = true;
              const targetMerge = mergedCells[currR][currC];
              
              if (targetMerge) {
                // Merge destination
                const newVal = val * 2;
                nextBoard[currR][currC] = newVal;
                nextBoard[r][c] = 0;

                moves.push({
                  container,
                  from: { r, c },
                  to: { r: currR, c: currC },
                  merge: true,
                  mergedVal: newVal
                });
              } else {
                // Simple shift destination
                nextBoard[currR][currC] = val;
                nextBoard[r][c] = 0;

                moves.push({
                  container,
                  from: { r, c },
                  to: { r: currR, c: currC },
                  merge: false
                });

                nextContainers[currR][currC] = container;
              }
            } else {
              // Tile stayed in place
              nextContainers[r][c] = container;
            }
          }
        }

        if (!moved) {
          // Revert undo availability since no move actually occurred
          this.hasUndoHistory = false;
          this.updateHUD();
          return;
        }

        // 3. Execute Phaser animations
        this.isAnimating = true;
        this.board = nextBoard;
        playSweep(300, 200, 0.08, 'sine', 0.05); // Slide tick

        let animCount = moves.length;
        const cleanupContainers: Phaser.GameObjects.Container[] = [];
        let scoreIncrement = 0;
        let playMergeSound = false;

        moves.forEach(m => {
          const targetX = OFFSET_X + GAP_SIZE + m.to.c * (TILE_SIZE + GAP_SIZE) + TILE_SIZE / 2;
          const targetY = OFFSET_Y + GAP_SIZE + m.to.r * (TILE_SIZE + GAP_SIZE) + TILE_SIZE / 2;

          this.tweens.add({
            targets: m.container,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: 'Quad.easeOut',
            onComplete: () => {
              animCount--;

              if (m.merge) {
                cleanupContainers.push(m.container);
                
                // Spawn the new merged container tile if not done yet
                if (!nextContainers[m.to.r][m.to.c]) {
                  const newVal = m.mergedVal!;
                  const mergedContainer = this.createTileContainer(m.to.r, m.to.c, newVal);
                  nextContainers[m.to.r][m.to.c] = mergedContainer;

                  scoreIncrement += newVal;
                  playMergeSound = true;

                  if (newVal === 2048 && !this.hasReached2048) {
                    this.hasReached2048 = true;
                    this.won = true;
                  }

                  // Merge pop scale bounce effect
                  mergedContainer.setScale(0.8);
                  this.tweens.add({
                    targets: mergedContainer,
                    scaleX: 1.15,
                    scaleY: 1.15,
                    duration: 70,
                    yoyo: true,
                    repeat: 0
                  });
                }
              }

              // Once all active sliding animations complete, wrap up the turn
              if (animCount === 0) {
                // Destroy old pre-merged containers
                cleanupContainers.forEach(c => c.destroy());
                
                this.tileContainers = nextContainers;
                this.score += scoreIncrement;
                
                if (playMergeSound) {
                  //滿足 Merging synth sweep sound
                  playSound(523, 'sine', 0.08, 0.08);
                  setTimeout(() => playSound(659, 'sine', 0.08, 0.08), 50);
                }

                this.updateHUD();
                
                // Spawn new tile and update game state checks
                this.time.delayedCall(50, () => {
                  this.spawnTile();
                  this.isAnimating = false;
                  
                  if (this.won) {
                    this.triggerWin();
                  } else if (this.checkGameOver()) {
                    this.triggerGameOver();
                  }
                });
              }
            }
          });
        });
      }

      saveUndoState() {
        this.hasUndoHistory = true;
        this.undoScore = this.score;
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            this.undoBoard[r][c] = this.board[r][c];
          }
        }
        this.updateHUD();
      }

      executeUndo() {
        if (!this.hasUndoHistory || this.isAnimating || this.isOver || this.won) return;

        // Play reverse undo sweep sound
        playSweep(180, 360, 0.12, 'sine', 0.06);

        // Clear all active tile containers
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (this.tileContainers[r][c]) {
              this.tileContainers[r][c]!.destroy();
              this.tileContainers[r][c] = null;
            }
          }
        }

        // Restore board grid values and score
        this.score = this.undoScore;
        this.board = this.undoBoard.map(row => [...row]);

        // Recreate containers
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const val = this.board[r][c];
            if (val !== 0) {
              this.tileContainers[r][c] = this.createTileContainer(r, c, val);
            }
          }
        }

        this.hasUndoHistory = false;
        this.updateHUD();
      }

      checkGameOver(): boolean {
        // 1. Check if empty cells exist
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (this.board[r][c] === 0) return false;
          }
        }

        // 2. Check if adjacent identical cells exist to merge
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const val = this.board[r][c];
            if (r + 1 < GRID_SIZE && this.board[r + 1][c] === val) return false;
            if (c + 1 < GRID_SIZE && this.board[r][c + 1] === val) return false;
          }
        }

        return true;
      }

      updateHUD() {
        this.scoreText.setText(`SCORE\n${this.score}`);
        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.highScoreText.setText(`BEST\n${this.highScore}`);
          if (typeof window !== 'undefined') {
            localStorage.setItem('2048_high_score', this.highScore.toString());
          }
        }

        // Undo button styling active state
        if (this.hasUndoHistory && !this.isOver && !this.won) {
          this.undoButton.setColor('#ffea00');
        } else {
          this.undoButton.setColor('#4b5563');
        }
      }

      update(time: number, delta: number) {
        // Starfield rendering loop
        this.drawStarfield();
      }

      drawStarfield() {
        const gfx = this.starGraphics;
        gfx.clear();
        
        this.starFields.forEach(star => {
          star.y += star.speed;
          if (star.y > 600) {
            star.y = 0;
            star.x = Math.random() * 500;
          }

          gfx.fillStyle(0xffffff, star.alpha);
          gfx.fillCircle(star.x, star.y, star.speed * 2);
        });
      }

      triggerWin() {
        this.won = true;

        // Victory fanfare sweeps
        playSweep(261.63, 523.25, 0.15, 'square', 0.12);
        setTimeout(() => playSweep(329.63, 659.25, 0.15, 'square', 0.12), 150);
        setTimeout(() => playSweep(392.00, 783.99, 0.15, 'square', 0.12), 300);
        setTimeout(() => playSweep(523.25, 1046.5, 0.45, 'square', 0.12), 450);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 140, 0x08080f, 0.95).setStrokeStyle(1.5, 0x39ff14);
        this.add.text(W / 2, H / 2 - 35, '🏆 VICTORY!', {
          fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#39ff14', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 5, `Reached 2048! Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#f0f0ff'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 35, 'Click anywhere to Keep Playing', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);
      }

      triggerGameOver() {
        this.isOver = true;

        // Tragic descent sweep
        playSweep(180, 80, 0.5, 'square', 0.15);
        setTimeout(() => playSweep(140, 60, 0.7, 'square', 0.15), 300);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 140, 0x08080f, 0.95).setStrokeStyle(1.5, 0xff0055);
        this.add.text(W / 2, H / 2 - 35, 'GAME OVER', {
          fontFamily: 'Orbitron, monospace', fontSize: '22px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 5, `Final Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '14px', color: '#f0f0ff'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 35, 'Click anywhere to Restart', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: '2048', score: this.score }
        }));
      }

      restartGame() {
        this.scene.restart();
      }
    };
  }
}
