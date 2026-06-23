// Tetris game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'tetris' in PhaserGameEngine.tsx

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

// 7 Tetromino shapes and their relative offset patterns
const TETROMINOES: Record<string, number[][]> = {
  I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
  O: [[1,1], [1,1]],
  T: [[0,1,0], [1,1,1], [0,0,0]],
  S: [[0,1,1], [1,1,0], [0,0,0]],
  Z: [[1,1,0], [0,1,1], [0,0,0]],
  J: [[1,0,0], [1,1,1], [0,0,0]],
  L: [[0,0,1], [1,1,1], [0,0,0]]
};

const TETROMINO_COLORS: Record<string, number> = {
  I: 0x00f0f0, // Neon Cyan
  O: 0xffea00, // Neon Yellow
  T: 0xff00ff, // Neon Purple/Magenta
  S: 0x39ff14, // Neon Green
  Z: 0xff0055, // Neon Red/Pink
  J: 0x0055ff, // Neon Blue
  L: 0xff9900  // Neon Orange
};

const BOARD_COLS = 10;
const BOARD_ROWS = 20;
const TILE_SIZE = 22;

const OFFSET_X = 40;
const OFFSET_Y = 80;

export default class TetrisGameFactory {
  static create(PhaserLib: any) {
    return class TetrisScene extends PhaserLib.Scene {
      // Board state: 0 = empty, 1 = occupied
      board!: number[][];
      boardColors!: number[][];

      // Block Entities
      currentPiece!: {
        shape: number[][];
        x: number;
        y: number;
        color: number;
        type: string;
      };
      nextPiece!: {
        shape: number[][];
        color: number;
        type: string;
      };

      // Game metrics
      score!: number;
      highScore!: number;
      level!: number;
      lines!: number;
      isOver!: boolean;

      // Timers & Delays
      dropTimer!: number;
      lockDelayTimer!: number;
      isLocking!: boolean;

      // HUD and graphics
      scoreText!: Phaser.GameObjects.Text;
      highScoreText!: Phaser.GameObjects.Text;
      levelText!: Phaser.GameObjects.Text;
      linesText!: Phaser.GameObjects.Text;
      
      boardGraphics!: Phaser.GameObjects.Graphics;
      nextGraphics!: Phaser.GameObjects.Graphics;
      starGraphics!: Phaser.GameObjects.Graphics;

      starFields!: Array<{ x: number; y: number; alpha: number; speed: number }>;
      lineClearFlashY!: number[];
      lineClearFlashTimer!: number;

      constructor() {
        super({ key: 'Tetris' });
      }

      init() {
        this.board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));
        this.boardColors = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));
        
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isOver = false;

        this.dropTimer = 0;
        this.lockDelayTimer = 0;
        this.isLocking = false;
        this.lineClearFlashY = [];
        this.lineClearFlashTimer = 0;

        // Retrieve high score from local storage
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('tetris_high_score');
          this.highScore = saved ? parseInt(saved, 10) : 10000;
        } else {
          this.highScore = 10000;
        }

        // Initialize Starfield points
        this.starFields = Array.from({ length: 40 }, () => ({
          x: Math.random() * 500,
          y: Math.random() * 600,
          alpha: Math.random(),
          speed: 0.1 + Math.random() * 0.4
        }));
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Draw static grid panels and sidebars
        this.starGraphics = this.add.graphics();
        this.boardGraphics = this.add.graphics();
        this.nextGraphics = this.add.graphics();

        // Title indicator
        this.add.text(W / 2, 30, 'TETRIS NEO', {
          fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#ff00ff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff00ff', 6, true, true);

        // HUD Text labels
        this.scoreText = this.add.text(380, 240, 'SCORE\n0', {
          fontFamily: 'monospace', fontSize: '15px', color: '#00d4ff', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        this.highScoreText = this.add.text(380, 310, `BEST\n${this.highScore}`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#ffea00', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        this.levelText = this.add.text(380, 380, 'LEVEL\n1', {
          fontFamily: 'monospace', fontSize: '15px', color: '#39ff14', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        this.linesText = this.add.text(380, 450, 'LINES\n0', {
          fontFamily: 'monospace', fontSize: '15px', color: '#ff0055', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);

        // Spawn first active block
        this.spawnNextPiece();
        this.spawnPiece();

        // Register controls
        const keyboard = this.input.keyboard;
        keyboard.on('keydown', (e: KeyboardEvent) => {
          getAudioContext();

          if (this.isOver) {
            if (e.code === 'Space') this.restartGame();
            return;
          }

          switch (e.code) {
            case 'ArrowLeft': case 'KeyA':
              this.movePiece(-1, 0);
              break;
            case 'ArrowRight': case 'KeyD':
              this.movePiece(1, 0);
              break;
            case 'ArrowUp': case 'KeyW':
              this.rotatePiece();
              break;
            case 'ArrowDown': case 'KeyS':
              this.movePiece(0, 1);
              this.score += 1; // 1 point for soft drop
              this.updateHUD();
              break;
            case 'Space':
              this.hardDrop();
              break;
          }
        });

        // Click restart
        this.input.on('pointerdown', () => {
          getAudioContext();
          if (this.isOver) {
            this.restartGame();
          }
        });
      }

      spawnNextPiece() {
        const types = Object.keys(TETROMINOES);
        const randType = types[Math.floor(Math.random() * types.length)];
        this.nextPiece = {
          shape: TETROMINOES[randType].map(row => [...row]),
          color: TETROMINO_COLORS[randType],
          type: randType
        };
      }

      spawnPiece() {
        this.currentPiece = {
          shape: this.nextPiece.shape,
          color: this.nextPiece.color,
          type: this.nextPiece.type,
          x: Math.floor((BOARD_COLS - this.nextPiece.shape[0].length) / 2),
          y: 0
        };

        this.spawnNextPiece();
        this.isLocking = false;
        this.lockDelayTimer = 0;

        // Game over check: overlapping immediately on spawn
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
          this.endGame();
        }
      }

      movePiece(dx: number, dy: number): boolean {
        if (this.isOver) return false;

        if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.shape)) {
          this.currentPiece.x += dx;
          this.currentPiece.y += dy;
          if (dx !== 0) {
            playSound(360, 'sine', 0.05, 0.05); // move tick
          }
          if (dy > 0) {
            playSound(220, 'sine', 0.03, 0.05); // soft drop tick
          }
          return true;
        }
        return false;
      }

      rotatePiece() {
        if (this.isOver) return;

        const shape = this.currentPiece.shape;
        const N = shape.length;
        // Transpose and reverse rows to rotate 90 deg clockwise
        const rotated = Array.from({ length: N }, () => Array(N).fill(0));
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            rotated[c][N - 1 - r] = shape[r][c];
          }
        }

        // Wall kick logic: try rotating, if it collides, try moving it left/right/up by 1 cell
        const kicks = [0, -1, 1, -2, 2];
        for (const dx of kicks) {
          if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            this.currentPiece.x += dx;
            playSound(420, 'triangle', 0.08, 0.08); // rotate sound
            return;
          }
        }
      }

      hardDrop() {
        if (this.isOver) return;

        let droppedRows = 0;
        while (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
          this.currentPiece.y++;
          droppedRows++;
        }

        this.score += droppedRows * 2; // 2 points per dropped row
        this.updateHUD();
        
        playSound(150, 'sawtooth', 0.15, 0.12); // Hard drop strike
        this.lockPiece();
      }

      checkCollision(px: number, py: number, shape: number[][]): boolean {
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
              const boardX = px + c;
              const boardY = py + r;

              // Grid limits
              if (boardX < 0 || boardX >= BOARD_COLS || boardY >= BOARD_ROWS) {
                return true;
              }

              // Overlap with locked block
              if (boardY >= 0 && this.board[boardY][boardX] !== 0) {
                return true;
              }
            }
          }
        }
        return false;
      }

      lockPiece() {
        const shape = this.currentPiece.shape;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
              const boardX = this.currentPiece.x + c;
              const boardY = this.currentPiece.y + r;
              if (boardY >= 0) {
                this.board[boardY][boardX] = 1;
                this.boardColors[boardY][boardX] = this.currentPiece.color;
              }
            }
          }
        }

        playSound(180, 'square', 0.08, 0.1); // Placement lock
        this.checkLineClears();
        this.spawnPiece();
      }

      checkLineClears() {
        const clearedRows: number[] = [];

        for (let r = BOARD_ROWS - 1; r >= 0; r--) {
          if (this.board[r].every(val => val !== 0)) {
            clearedRows.push(r);
          }
        }

        if (clearedRows.length > 0) {
          // Play cleared lines flash animation
          this.lineClearFlashY = clearedRows;
          this.lineClearFlashTimer = 180; // 180ms flash duration
          
          // Add score based on rows cleared
          const baseScores = [0, 100, 300, 500, 800];
          const linesCleared = clearedRows.length;
          const pointsGained = baseScores[linesCleared] * this.level;
          
          this.score += pointsGained;
          this.lines += linesCleared;

          // Sound triggers based on count
          if (linesCleared === 4) {
            // Tetris arpeggio sweep
            playSweep(260, 520, 0.45, 'sawtooth', 0.15);
            setTimeout(() => playSweep(390, 780, 0.35, 'sawtooth', 0.15), 100);
          } else {
            // Standard clear chord
            playSweep(523.25, 783.99, 0.25, 'triangle', 0.1);
          }

          // Level up check (every 10 lines)
          const newLevel = Math.floor(this.lines / 10) + 1;
          if (newLevel > this.level) {
            this.level = newLevel;
            // Level up fanfare
            setTimeout(() => {
              playSound(523.25, 'square', 0.15, 0.15);
              setTimeout(() => playSound(659.25, 'square', 0.15, 0.15), 100);
              setTimeout(() => playSound(783.99, 'square', 0.15, 0.15), 200);
              setTimeout(() => playSweep(523.25, 1046.5, 0.4, 'square', 0.15), 300);
            }, 300);
          }

          this.updateHUD();

          // Actually shift columns downwards
          // Note: we do this immediately in state, but flash overlay is drawn concurrently
          clearedRows.sort((a, b) => a - b);
          for (const rowY of clearedRows) {
            this.board.splice(rowY, 1);
            this.boardColors.splice(rowY, 1);
            this.board.unshift(Array(BOARD_COLS).fill(0));
            this.boardColors.unshift(Array(BOARD_COLS).fill(0));
          }
        }
      }

      getDropInterval(): number {
        // Drop delay interval decreases as level increases (speeds up)
        const intervals = [1000, 850, 700, 550, 400, 300, 220, 150, 100, 70];
        return intervals[Math.min(this.level - 1, intervals.length - 1)];
      }

      updateHUD() {
        this.scoreText.setText(`SCORE\n${this.score}`);
        this.levelText.setText(`LEVEL\n${this.level}`);
        this.linesText.setText(`LINES\n${this.lines}`);

        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.highScoreText.setText(`BEST\n${this.highScore}`);
          if (typeof window !== 'undefined') {
            localStorage.setItem('tetris_high_score', this.highScore.toString());
          }
        }
      }

      update(time: number, delta: number) {
        // Update parallax starfields
        this.drawStarfield();

        if (this.isOver) return;

        // Line clear flashing timers
        if (this.lineClearFlashTimer > 0) {
          this.lineClearFlashTimer -= delta;
          if (this.lineClearFlashTimer <= 0) {
            this.lineClearFlashY = [];
          }
        }

        // Automatic gravity drop timer
        this.dropTimer += delta;
        const dropInterval = this.getDropInterval();

        if (this.dropTimer >= dropInterval) {
          this.dropTimer = 0;
          
          // Attempt downward gravity movement
          if (!this.movePiece(0, 1)) {
            // Cannot drop: initialize lock delay if not locking
            if (!this.isLocking) {
              this.isLocking = true;
              this.lockDelayTimer = 0;
            }
          } else {
            this.isLocking = false;
          }
        }

        // Handle piece locking delay (gives 500ms sliding leeway)
        if (this.isLocking) {
          this.lockDelayTimer += delta;
          if (this.lockDelayTimer >= 500) {
            // Double check collisions before locking
            if (this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
              this.lockPiece();
            } else {
              this.isLocking = false;
            }
          }
        }

        // Render boards and preview blocks
        this.drawBoard();
        this.drawNextPiecePreview();
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

      drawBoard() {
        const gfx = this.boardGraphics;
        gfx.clear();

        // 1. Grid frame background panel
        gfx.fillStyle(0x0c0f1d, 0.85); // glassmorphism dark backing
        gfx.lineStyle(1.5, 0x00d4ff, 1); // Neon blue frame border
        gfx.fillRect(OFFSET_X, OFFSET_Y, BOARD_COLS * TILE_SIZE, BOARD_ROWS * TILE_SIZE);
        gfx.strokeRect(OFFSET_X, OFFSET_Y, BOARD_COLS * TILE_SIZE, BOARD_ROWS * TILE_SIZE);

        // 2. Draw cell subdivisions (fine grid gridlines)
        gfx.lineStyle(0.6, 0x1e293b, 0.45);
        for (let r = 1; r < BOARD_ROWS; r++) {
          gfx.lineBetween(OFFSET_X, OFFSET_Y + r * TILE_SIZE, OFFSET_X + BOARD_COLS * TILE_SIZE, OFFSET_Y + r * TILE_SIZE);
        }
        for (let c = 1; c < BOARD_COLS; c++) {
          gfx.lineBetween(OFFSET_X + c * TILE_SIZE, OFFSET_Y, OFFSET_X + c * TILE_SIZE, OFFSET_Y + BOARD_ROWS * TILE_SIZE);
        }

        // 3. Draw ghost piece indicator (where the piece will land)
        if (!this.isOver) {
          let ghostY = this.currentPiece.y;
          while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
          }

          if (ghostY !== this.currentPiece.y) {
            gfx.lineStyle(1.2, this.currentPiece.color, 0.35);
            const shape = this.currentPiece.shape;
            for (let r = 0; r < shape.length; r++) {
              for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                  const gx = OFFSET_X + (this.currentPiece.x + c) * TILE_SIZE;
                  const gy = OFFSET_Y + (ghostY + r) * TILE_SIZE;
                  gfx.strokeRect(gx + 2, gy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
              }
            }
          }
        }

        // 4. Draw locked blocks on board
        for (let r = 0; r < BOARD_ROWS; r++) {
          for (let c = 0; c < BOARD_COLS; c++) {
            if (this.board[r][c] !== 0) {
              this.drawBlock(gfx, OFFSET_X + c * TILE_SIZE, OFFSET_Y + r * TILE_SIZE, this.boardColors[r][c]);
            }
          }
        }

        // 5. Draw active falling piece blocks
        if (!this.isOver) {
          const shape = this.currentPiece.shape;
          for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
              if (shape[r][c] !== 0) {
                const px = OFFSET_X + (this.currentPiece.x + c) * TILE_SIZE;
                const py = OFFSET_Y + (this.currentPiece.y + r) * TILE_SIZE;
                this.drawBlock(gfx, px, py, this.currentPiece.color);
              }
            }
          }
        }

        // 6. Draw line clear white flash overlay
        if (this.lineClearFlashY.length > 0) {
          gfx.fillStyle(0xffffff, 0.7);
          this.lineClearFlashY.forEach(rowY => {
            gfx.fillRect(OFFSET_X, OFFSET_Y + rowY * TILE_SIZE, BOARD_COLS * TILE_SIZE, TILE_SIZE);
          });
        }
      }

      drawBlock(gfx: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
        gfx.fillStyle(color, 1);
        gfx.lineStyle(1.5, 0x000000, 0.8);
        gfx.fillRect(x + 1.5, y + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
        gfx.strokeRect(x + 1.5, y + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);

        // Highlight inner reflection glow
        gfx.fillStyle(0xffffff, 0.35);
        gfx.fillRect(x + 3.5, y + 3.5, 5, 2);
      }

      drawNextPiecePreview() {
        const gfx = this.nextGraphics;
        gfx.clear();

        // 1. Preview box border
        gfx.fillStyle(0x0c0f1d, 0.85);
        gfx.lineStyle(1.5, 0xff00ff, 1); // Neon magenta border
        gfx.fillRect(320, 80, 120, 110);
        gfx.strokeRect(320, 80, 120, 110);

        // Header label
        gfx.lineStyle(1.2, 0xff00ff, 0.5);
        
        // Draw the next piece inside the box centered
        const shape = this.nextPiece.shape;
        const color = this.nextPiece.color;

        const gridN = shape.length;
        const boxW = 120;
        const boxH = 110;

        // Centering calculations
        const startX = 320 + (boxW - gridN * TILE_SIZE) / 2;
        const startY = 80 + (boxH - gridN * TILE_SIZE) / 2;

        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
              this.drawBlock(gfx, startX + c * TILE_SIZE, startY + r * TILE_SIZE, color);
            }
          }
        }
      }

      endGame() {
        this.isOver = true;

        // Low tragic game-over sweep
        playSweep(180, 80, 0.5, 'square', 0.15);
        setTimeout(() => playSweep(140, 60, 0.7, 'square', 0.15), 300);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 140, 0x08080f, 0.95).setStrokeStyle(1, 0xff0080);
        this.add.text(W / 2, H / 2 - 35, 'GAME OVER', {
          fontFamily: 'Orbitron, monospace', fontSize: '22px', color: '#ff0080', fontWeight: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(W / 2, H / 2 + 5, `Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#f0f0ff'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 35, 'Press SPACE or CLICK to Restart', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'tetris', score: this.score }
        }));
      }

      restartGame() {
        this.scene.restart();
      }
    };
  }
}
