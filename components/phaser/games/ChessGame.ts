// Chess game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'chess' in PhaserGameEngine.tsx

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

// Custom Noise Synthesizer for piece captures
function playCaptureNoise(duration: number = 0.2, gainVal: number = 0.15) {
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
    filter.type = 'bandpass';
    filter.frequency.value = 800;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Noise sound failed:", e);
  }
}

interface ChessPiece {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
  color: 'w' | 'b';
  hasMoved?: boolean;
}

type BoardState = Array<Array<ChessPiece | null>>;

const UNICODE_PIECES: Record<string, Record<string, string>> = {
  w: { k: '♚\uFE0E', q: '♛\uFE0E', r: '♜\uFE0E', b: '♝\uFE0E', n: '♞\uFE0E', p: '♟\uFE0E' },
  b: { k: '♚\uFE0E', q: '♛\uFE0E', r: '♜\uFE0E', b: '♝\uFE0E', n: '♞\uFE0E', p: '♟\uFE0E' }
};


const TILE_SIZE = 54;
const BOARD_SIZE = 8;
const OFFSET_X = 40;
const OFFSET_Y = 80;

export default class ChessGameFactory {
  static create(PhaserLib: any) {

    // ── Difficulty Selector Scene ───────────────────────────────────────────
    class MenuScene extends PhaserLib.Scene {
      constructor() { super({ key: 'ChessMenu' }); }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, W, H, 0x080820);

        // Grid dot background
        const generateTexture = (key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const canvasTexture = this.textures.createCanvas(key, width, height);
          drawFn(canvasTexture.context);
          canvasTexture.refresh();
        };

        generateTexture('bg-dot-chess-menu', 24, 24, (ctx) => {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
          ctx.beginPath();
          ctx.arc(12, 12, 1, 0, Math.PI * 2);
          ctx.fill();
        });

        this.add.tileSprite(W / 2, H / 2, W, H, 'bg-dot-chess-menu');

        // Title
        this.add.text(W / 2, 80, 'CHESS', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '42px',
          color: '#00d4ff', fontStyle: 'bold',
          stroke: '#003355', strokeThickness: 6,
        }).setOrigin(0.5);
        this.add.text(W / 2, 125, 'NEO', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '28px',
          color: '#ff00ff', fontStyle: 'bold',
          stroke: '#330022', strokeThickness: 4,
        }).setOrigin(0.5);

        this.add.text(W / 2, 185, 'SELECT DIFFICULTY', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px',
          color: '#6688aa', letterSpacing: 3,
        }).setOrigin(0.5);

        const diffs = ['easy', 'medium', 'hard'];
        const btnColors = { easy: 0x39ff14, medium: 0x00d4ff, hard: 0xff00ff };
        const btnY = [250, 330, 410];
        const labels = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };
        const descs = {
          easy: 'AI makes basic moves & overlooks trap layers',
          medium: 'AI searches 2-ply deep (standard challenge)',
          hard: 'AI searches 3-ply deep with alpha-beta pruning'
        };

        diffs.forEach((d, i) => {
          const col = btnColors[d as keyof typeof btnColors];
          const bg = this.add.graphics();
          bg.fillStyle(col, 0.08);
          bg.lineStyle(1.8, col, 0.8);
          bg.fillRoundedRect(W / 2 - 160, btnY[i] - 28, 320, 56, 8);
          bg.strokeRoundedRect(W / 2 - 160, btnY[i] - 28, 320, 56, 8);

          const zone = this.add.zone(W / 2, btnY[i], 320, 56).setInteractive({ cursor: 'pointer' });
          this.add.text(W / 2, btnY[i] - 10, labels[d as keyof typeof labels], {
            fontFamily: 'Orbitron, sans-serif', fontSize: '16px',
            color: `#${col.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
          }).setOrigin(0.5);
          
          this.add.text(W / 2, btnY[i] + 12, descs[d as keyof typeof descs], {
            fontFamily: 'monospace', fontSize: '10px', color: '#778899',
          }).setOrigin(0.5);

          zone.on('pointerover', () => { bg.setAlpha(1.4); })
            .on('pointerout',  () => { bg.setAlpha(1); })
            .on('pointerdown', () => {
              playSound(440, 'sine', 0.05, 0.05);
              this.scene.start('Chess', { difficulty: d });
            });
        });

        this.add.text(W / 2, H - 40, 'Win by checkmate. Try the FULLSCREEN button in the header for the best view!', {
          fontFamily: 'monospace', fontSize: '11px', color: '#556688',
        }).setOrigin(0.5);
      }
    }

    class ChessScene extends PhaserLib.Scene {
      board!: BoardState;
      selectedSquare!: { row: number; col: number } | null;
      validMoves!: Array<{ row: number; col: number; type?: 'normal' | 'capture' | 'castle' }>;
      
      turn!: 'w' | 'b'; // w = Player, b = AI
      isOver!: boolean;
      gameStateText!: string;

      // Captured lists
      capturedWhite!: string[];
      capturedBlack!: string[];

      // Highlighting last moves
      lastMove!: { from: { row: number; col: number }; to: { row: number; col: number } } | null;

      // Graphics & Text elements
      boardGraphics!: Phaser.GameObjects.Graphics;
      selectionGraphics!: Phaser.GameObjects.Graphics;
      pieceTexts!: Phaser.GameObjects.GameObject[][];
      captureSprites!: Phaser.GameObjects.Sprite[];
      
      statusText!: Phaser.GameObjects.Text;
      evalBarGraphics!: Phaser.GameObjects.Graphics;
      capturedText!: Phaser.GameObjects.Text;
      restartButton!: Phaser.GameObjects.Text;
      menuButton!: Phaser.GameObjects.Text;
      moveList!: string[];
      movesText!: Phaser.GameObjects.Text;

      constructor() {
        super({ key: 'Chess' });
      }

      difficulty = 'medium';

      init(data: any) {
        this.difficulty = data ? data.difficulty || 'medium' : 'medium';
        this.resetBoard();
        this.selectedSquare = null;
        this.validMoves = [];
        this.turn = 'w';
        this.isOver = false;
        this.gameStateText = 'YOUR TURN';
        this.capturedWhite = [];
        this.capturedBlack = [];
        this.lastMove = null;
        this.pieceTexts = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
        this.captureSprites = [];
        this.moveList = [];
      }

      resetBoard() {
        this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

        // Back row pieces layout
        const backRow: Array<ChessPiece['type']> = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

        // Instantiate Black Pieces (rows 0, 1)
        for (let c = 0; c < BOARD_SIZE; c++) {
          this.board[0][c] = { type: backRow[c], color: 'b', hasMoved: false };
          this.board[1][c] = { type: 'p', color: 'b', hasMoved: false };
        }

        // Instantiate White Pieces (rows 6, 7)
        for (let c = 0; c < BOARD_SIZE; c++) {
          this.board[6][c] = { type: 'p', color: 'w', hasMoved: false };
          this.board[7][c] = { type: backRow[c], color: 'w', hasMoved: false };
        }
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Static graphics layouts
        const bgGrid = this.add.graphics();
        bgGrid.fillStyle(0x0c0f1d, 0.7);
        bgGrid.fillRect(0, 0, W, H);

        // Header Label
        this.add.text(W / 2, 30, 'CHESS NEO', {
          fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00d4ff', 8, true, true);

        // Sidebar Panel Border
        const sidebarBorder = this.add.graphics();
        sidebarBorder.lineStyle(1.5, 0xff00ff, 1);
        sidebarBorder.strokeRect(520, 80, 110, 432);
        sidebarBorder.fillStyle(0x0c0f1d, 0.9);
        sidebarBorder.fillRect(520, 80, 110, 432);

        // Status Indicators
        this.statusText = this.add.text(W - 20, 110, 'YOUR\nTURN', {
          fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold', align: 'right'
        }).setOrigin(1, 0.5);

        // Menu Button
        this.menuButton = this.add.text(525, H - 35, 'MENU', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ff00ff', fontWeight: 'bold', cursor: 'pointer'
        }).setOrigin(0, 0.5);
        this.menuButton.setInteractive({ useHandCursor: true });
        this.menuButton.on('pointerdown', () => {
          playSound(440, 'sine', 0.05, 0.05);
          this.scene.start('ChessMenu');
        });

        // Restart Button
        this.restartButton = this.add.text(625, H - 35, 'RESTART', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ffea00', fontWeight: 'bold', cursor: 'pointer'
        }).setOrigin(1, 0.5);
        this.restartButton.setInteractive({ useHandCursor: true });
        this.restartButton.on('pointerdown', () => {
          playSound(440, 'sine', 0.05, 0.05);
          this.restartGame();
        });

        // Initialize HUD elements
        this.boardGraphics = this.add.graphics();
        this.selectionGraphics = this.add.graphics();
        this.evalBarGraphics = this.add.graphics();

        // Coordinates A-H
        const colsLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (let c = 0; c < BOARD_SIZE; c++) {
          const x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
          this.add.text(x, OFFSET_Y + BOARD_SIZE * TILE_SIZE + 10, colsLetters[c], {
            fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(0.5);
          this.add.text(x, OFFSET_Y - 12, colsLetters[c], {
            fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(0.5);
        }

        // Coordinates 1-8
        for (let r = 0; r < BOARD_SIZE; r++) {
          const y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;
          const rowNum = (BOARD_SIZE - r).toString();
          this.add.text(OFFSET_X - 15, y, rowNum, {
            fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(0.5);
          this.add.text(OFFSET_X + BOARD_SIZE * TILE_SIZE + 12, y, rowNum, {
            fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(0.5);
        }

        // Render Captures Panel Labels in the Sidebar
        this.add.text(530, 285, 'CAPTURES', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#9090b0', fontWeight: 'bold'
        });
        
        this.add.text(530, 310, 'PLAYER', {
          fontFamily: 'Orbitron, monospace', fontSize: '9px', color: '#00d4ff', fontWeight: 'bold'
        });

        this.add.text(530, 405, 'AI', {
          fontFamily: 'Orbitron, monospace', fontSize: '9px', color: '#ff00ff', fontWeight: 'bold'
        });

        this.capturedText = this.add.text(0, 0, '').setVisible(false);

        // Render Moves Panel in the Sidebar
        this.add.text(530, 145, 'MOVES', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#9090b0', fontWeight: 'bold'
        });

        this.movesText = this.add.text(530, 162, '', {
          fontFamily: 'monospace', fontSize: '10px', color: '#b0f0ff', lineSpacing: 4
        });

        // Pre-generate 12 glowing circular piece textures
        const generateTexture = (key: string, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const canvasTexture = this.textures.createCanvas(key, 54, 54);
          drawFn(canvasTexture.context);
          canvasTexture.refresh();
        };

        const colorsConfig = {
          w: { main: '#00d4ff', glow: '#0055ff', bg: 'rgba(9, 11, 21, 0.95)', border: '#00d4ff' },
          b: { main: '#ff00ff', glow: '#ff0055', bg: 'rgba(12, 9, 21, 0.95)', border: '#ff00ff' }
        };

        const piecesList = ['p', 'r', 'n', 'b', 'q', 'k'];
        const colorsKeys = ['w', 'b'] as const;

        colorsKeys.forEach(col => {
          piecesList.forEach(type => {
            const key = `piece-${col}-${type}`;
            generateTexture(key, (ctx) => {
              const cfg = colorsConfig[col];
              const char = UNICODE_PIECES[col][type];
              
              // Draw Character Symbol
              ctx.shadowColor = cfg.glow;
              ctx.shadowBlur = 8;
              ctx.fillStyle = cfg.main;
              ctx.font = 'bold 38px "Segoe UI Symbol", "Apple Color Emoji", "Arial", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Fine-tune offset for vertical centering
              ctx.fillText(char, 27, 28.5);
            });
          });
        });


        // Keyboard spacebar restart listener
        this.input.keyboard.on('keydown-SPACE', () => {
          if (this.isOver) {
            playSound(440, 'sine', 0.05, 0.05);
            this.restartGame();
          }
        });

        // Render initial visual representations
        this.drawBoard();
        this.drawPieces();
        this.updateHUD();

        // Mouse click inputs on board
        this.input.on('pointerdown', (pointer: any) => {
          getAudioContext();

          if (this.isOver) {
            this.restartGame();
            return;
          }

          // Check if player click falls on the board
          const row = Math.floor((pointer.y - OFFSET_Y) / TILE_SIZE);
          const col = Math.floor((pointer.x - OFFSET_X) / TILE_SIZE);

          if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            this.handleSquareClick(row, col);
          }
        });
      }

      handleSquareClick(row: number, col: number) {
        if (this.turn !== 'w' || this.isOver) return;

        const piece = this.board[row][col];

        // Case 1: click on an indicated valid destination
        const destinationMove = this.validMoves.find(m => m.row === row && m.col === col);
        if (destinationMove && this.selectedSquare) {
          this.executePlayerMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
          return;
        }

        // Case 2: click on own piece to select/highlight moves
        if (piece && piece.color === 'w') {
          playSound(440, 'sine', 0.03, 0.05); // Tick
          this.selectedSquare = { row, col };
          this.validMoves = this.generateLegalMoves(row, col, this.board);
          this.drawSelections();
        } else {
          // Clear selections
          this.selectedSquare = null;
          this.validMoves = [];
          this.drawSelections();
        }
      }

      executePlayerMove(fromRow: number, fromCol: number, toRow: number, toCol: number) {
        const piece = this.board[fromRow][fromCol]!;
        const destPiece = this.board[toRow][toCol];

        // Castle handling
        if (piece.type === 'k' && Math.abs(fromCol - toCol) === 2) {
          if (toCol === 6) {
            const rook = this.board[toRow][7];
            this.board[toRow][5] = rook;
            this.board[toRow][7] = null;
            if (rook) rook.hasMoved = true;
          } else if (toCol === 2) {
            const rook = this.board[toRow][0];
            this.board[toRow][3] = rook;
            this.board[toRow][0] = null;
            if (rook) rook.hasMoved = true;
          }
        }

        const originalType = piece.type;
        // Move execution
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.hasMoved = true;

        // Auto-pawn promotion to Queen
        if (piece.type === 'p' && toRow === 0) {
          piece.type = 'q';
        }

        // Record move
        this.recordMove(fromRow, fromCol, toRow, toCol, originalType, true, destPiece !== null);

        // Check if capture
        if (destPiece) {
          this.capturedBlack.push(destPiece.type.toUpperCase());
          playCaptureNoise(0.2, 0.12);
        } else {
          playSweep(300, 600, 0.08, 'sine', 0.08); // Move slide sweep
        }

        this.lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
        this.selectedSquare = null;
        this.validMoves = [];

        // Redraw board & check check status
        this.drawBoard();
        this.drawPieces();

        if (this.isKingInCheck('b', this.board)) {
          if (this.isCheckmate('b')) {
            this.triggerWinGame('PLAYER WINS (CHECKMATE)');
            return;
          }
          playSound(650, 'sawtooth', 0.25, 0.1); // Warning buzzer
          this.gameStateText = 'AI CHECKED';
        } else if (this.isStalemate('b')) {
          this.triggerDrawGame('DRAW (STALEMATE)');
          return;
        } else {
          this.gameStateText = 'AI THINKING';
        }

        this.turn = 'b';
        this.updateHUD();

        // Stagger AI move delay
        this.time.delayedCall(700, () => {
          this.executeAIMove();
        });
      }

      executeAIMove() {
        if (this.isOver) return;

        const bestMove = this.calculateBestMove();
        if (bestMove) {
          const { from, to } = bestMove;
          const piece = this.board[from.row][from.col]!;
          const destPiece = this.board[to.row][to.col];

          // Castle handling
          if (piece.type === 'k' && Math.abs(from.col - to.col) === 2) {
            if (to.col === 6) {
              const rook = this.board[to.row][7];
              this.board[to.row][5] = rook;
              this.board[to.row][7] = null;
              if (rook) rook.hasMoved = true;
            } else if (to.col === 2) {
              const rook = this.board[to.row][0];
              this.board[to.row][3] = rook;
              this.board[to.row][0] = null;
              if (rook) rook.hasMoved = true;
            }
          }

          const originalType = piece.type;
          this.board[to.row][to.col] = piece;
          this.board[from.row][from.col] = null;
          piece.hasMoved = true;

          // Auto AI pawn promotion
          if (piece.type === 'p' && to.row === 7) {
            piece.type = 'q';
          }

          // Record move
          this.recordMove(from.row, from.col, to.row, to.col, originalType, false, destPiece !== null);

          if (destPiece) {
            this.capturedWhite.push(destPiece.type.toLowerCase());
            playCaptureNoise(0.2, 0.12);
          } else {
            playSweep(300, 450, 0.08, 'sine', 0.08);
          }

          this.lastMove = { from, to };

          this.drawBoard();
          this.drawPieces();

          if (this.isKingInCheck('w', this.board)) {
            if (this.isCheckmate('w')) {
              this.triggerLossGame('AI WINS (CHECKMATE)');
              return;
            }
            playSound(650, 'sawtooth', 0.25, 0.1);
            this.gameStateText = 'CHECKED!';
          } else if (this.isStalemate('w')) {
            this.triggerDrawGame('DRAW (STALEMATE)');
            return;
          } else {
            this.gameStateText = 'YOUR TURN';
          }
        } else {
          // AI has no moves: check if checkmate or draw
          if (this.isKingInCheck('b', this.board)) {
            this.triggerWinGame('PLAYER WINS (CHECKMATE)');
          } else {
            this.triggerDrawGame('DRAW (STALEMATE)');
          }
          return;
        }

        this.turn = 'w';
        this.updateHUD();
      }

      // Recursive Minimax with Alpha-Beta Pruning
      minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean, board: BoardState): number {
        if (depth === 0) {
          return this.evaluateBoard(board);
        }

        const activeColor = isMaximizing ? 'b' : 'w';
        const moves = this.getAllLegalMoves(activeColor, board);

        if (moves.length === 0) {
          if (this.isKingInCheck(activeColor, board)) {
            return isMaximizing ? -99999 + (3 - depth) : 99999 - (3 - depth); // Prefer faster checkmate
          }
          return 0; // Stalemate
        }

        if (isMaximizing) {
          let maxEval = -999999;
          for (const m of moves) {
            // Simulate move
            const tempPiece = board[m.to.row][m.to.col];
            const movingPiece = board[m.from.row][m.from.col]!;

            let isCastle = false;
            let rookFromCol = -1;
            let rookToCol = -1;
            let tempRookPiece: ChessPiece | null = null;

            if (movingPiece.type === 'k' && Math.abs(m.from.col - m.to.col) === 2) {
              isCastle = true;
              rookFromCol = m.to.col === 6 ? 7 : 0;
              rookToCol = m.to.col === 6 ? 5 : 3;
              tempRookPiece = board[m.to.row][rookFromCol];
              board[m.to.row][rookToCol] = tempRookPiece;
              board[m.to.row][rookFromCol] = null;
            }

            board[m.to.row][m.to.col] = movingPiece;
            board[m.from.row][m.from.col] = null;

            const evaluation = this.minimax(depth - 1, alpha, beta, false, board);
            maxEval = Math.max(maxEval, evaluation);

            // Restore simulation
            board[m.from.row][m.from.col] = movingPiece;
            board[m.to.row][m.to.col] = tempPiece;
            if (isCastle) {
              board[m.to.row][rookFromCol] = tempRookPiece;
              board[m.to.row][rookToCol] = null;
            }

            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
              break; // Beta cut-off
            }
          }
          return maxEval;
        } else {
          let minEval = 999999;
          for (const m of moves) {
            // Simulate move
            const tempPiece = board[m.to.row][m.to.col];
            const movingPiece = board[m.from.row][m.from.col]!;

            let isCastle = false;
            let rookFromCol = -1;
            let rookToCol = -1;
            let tempRookPiece: ChessPiece | null = null;

            if (movingPiece.type === 'k' && Math.abs(m.from.col - m.to.col) === 2) {
              isCastle = true;
              rookFromCol = m.to.col === 6 ? 7 : 0;
              rookToCol = m.to.col === 6 ? 5 : 3;
              tempRookPiece = board[m.to.row][rookFromCol];
              board[m.to.row][rookToCol] = tempRookPiece;
              board[m.to.row][rookFromCol] = null;
            }

            board[m.to.row][m.to.col] = movingPiece;
            board[m.from.row][m.from.col] = null;

            const evaluation = this.minimax(depth - 1, alpha, beta, true, board);
            minEval = Math.min(minEval, evaluation);

            // Restore simulation
            board[m.from.row][m.from.col] = movingPiece;
            board[m.to.row][m.to.col] = tempPiece;
            if (isCastle) {
              board[m.to.row][rookFromCol] = tempRookPiece;
              board[m.to.row][rookToCol] = null;
            }

            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
              break; // Alpha cut-off
            }
          }
          return minEval;
        }
      }

      // Minimax Search Algorithm with Alpha-Beta Pruning
      calculateBestMove(): { from: { row: number; col: number }; to: { row: number; col: number } } | null {
        const moves = this.getAllLegalMoves('b', this.board);
        if (moves.length === 0) return null;

        // Shuffle moves to make AI play differently in equal situations
        for (let i = moves.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = moves[i];
          moves[i] = moves[j];
          moves[j] = temp;
        }

        let depth = 2; // Medium default
        if (this.difficulty === 'easy') {
          depth = 1;
        } else if (this.difficulty === 'hard') {
          depth = 3;
        }

        let bestVal = -999999;
        let bestMove = moves[0];

        // Black wants to maximize board score: (Black value - White value)
        for (const m of moves) {
          // Simulate move
          const tempPiece = this.board[m.to.row][m.to.col];
          const movingPiece = this.board[m.from.row][m.from.col]!;

          let isCastle = false;
          let rookFromCol = -1;
          let rookToCol = -1;
          let tempRookPiece: ChessPiece | null = null;

          if (movingPiece.type === 'k' && Math.abs(m.from.col - m.to.col) === 2) {
            isCastle = true;
            rookFromCol = m.to.col === 6 ? 7 : 0;
            rookToCol = m.to.col === 6 ? 5 : 3;
            tempRookPiece = this.board[m.to.row][rookFromCol];
            this.board[m.to.row][rookToCol] = tempRookPiece;
            this.board[m.to.row][rookFromCol] = null;
          }

          this.board[m.to.row][m.to.col] = movingPiece;
          this.board[m.from.row][m.from.col] = null;

          // Call minimax
          const val = this.minimax(depth - 1, -999999, 999999, false, this.board);

          // Restore Black simulation
          this.board[m.from.row][m.from.col] = movingPiece;
          this.board[m.to.row][m.to.col] = tempPiece;

          if (isCastle) {
            this.board[m.to.row][rookFromCol] = tempRookPiece;
            this.board[m.to.row][rookToCol] = null;
          }

          if (val > bestVal) {
            bestVal = val;
            bestMove = m;
          }
        }

        return bestMove;
      }

      evaluateBoard(board: BoardState): number {
        // Material values
        const vals: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        let score = 0;

        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (piece) {
              let value = vals[piece.type];

              // Add simple positional values for center control
              if (piece.type === 'p') {
                // Pawns benefit from advancing
                value += (piece.color === 'b' ? r : (7 - r)) * 10;
              }
              if (piece.type === 'n' || piece.type === 'b') {
                // Knights/Bishops benefit from active center positioning
                if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
                  value += 15;
                }
              }

              if (piece.color === 'b') {
                score += value;
              } else {
                score -= value;
              }
            }
          }
        }
        return score;
      }

      // Legal Moves generation (filters out moves putting own King in check)
      generateLegalMoves(row: number, col: number, board: BoardState): Array<{ row: number; col: number }> {
        const pseudo = this.generatePseudoLegalMoves(row, col, board);
        const legal: Array<{ row: number; col: number }> = [];
        const piece = board[row][col]!;

        for (const m of pseudo) {
          // Simulate move
          const tempDestPiece = board[m.row][m.col];
          board[m.row][m.col] = piece;
          board[row][col] = null;

          if (!this.isKingInCheck(piece.color, board)) {
            legal.push(m);
          }

          // Restore board
          board[row][col] = piece;
          board[m.row][m.col] = tempDestPiece;
        }

        // Castling moves
        if (piece.type === 'k' && !piece.hasMoved) {
          const color = piece.color;
          if (!this.isKingInCheck(color, board)) {
            // King-side Castling
            const rookK = board[row][7];
            if (rookK && rookK.type === 'r' && rookK.color === color && !rookK.hasMoved) {
              if (!board[row][5] && !board[row][6]) {
                if (!this.isSquareAttacked(color, row, 5, board) && !this.isSquareAttacked(color, row, 6, board)) {
                  legal.push({ row, col: 6 });
                }
              }
            }

            // Queen-side Castling
            const rookQ = board[row][0];
            if (rookQ && rookQ.type === 'r' && rookQ.color === color && !rookQ.hasMoved) {
              if (!board[row][1] && !board[row][2] && !board[row][3]) {
                if (!this.isSquareAttacked(color, row, 2, board) && !this.isSquareAttacked(color, row, 3, board)) {
                  legal.push({ row, col: 2 });
                }
              }
            }
          }
        }

        return legal;
      }

      getAllLegalMoves(color: 'w' | 'b', board: BoardState): Array<{ from: { row: number; col: number }; to: { row: number; col: number } }> {
        const moves: Array<{ from: { row: number; col: number }; to: { row: number; col: number } }> = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (piece && piece.color === color) {
              const legal = this.generateLegalMoves(r, c, board);
              legal.forEach(dest => {
                moves.push({ from: { row: r, col: c }, to: dest });
              });
            }
          }
        }

        return moves;
      }

      isKingInCheck(color: 'w' | 'b', board: BoardState): boolean {
        // Find king coordinates
        let kr = -1, kc = -1;
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (piece && piece.type === 'k' && piece.color === color) {
              kr = r; kc = c;
              break;
            }
          }
        }

        if (kr === -1) return false;

        // Check if any opponent piece attacks the king coordinate
        const oppColor = color === 'w' ? 'b' : 'w';
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (piece && piece.color === oppColor) {
              const pseudo = this.generatePseudoLegalMoves(r, c, board);
              if (pseudo.some(m => m.row === kr && m.col === kc)) {
                return true;
              }
            }
          }
        }

        return false;
      }

      isSquareAttacked(opposedColor: 'w' | 'b', targetRow: number, targetCol: number, board: BoardState): boolean {
        const oppColor = opposedColor === 'w' ? 'b' : 'w';
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = board[r][c];
            if (piece && piece.color === oppColor) {
              const pseudo = this.generatePseudoLegalMoves(r, c, board);
              if (pseudo.some(m => m.row === targetRow && m.col === targetCol)) {
                return true;
              }
            }
          }
        }
        return false;
      }

      isCheckmate(color: 'w' | 'b'): boolean {
        return this.isKingInCheck(color, this.board) && this.getAllLegalMoves(color, this.board).length === 0;
      }

      isStalemate(color: 'w' | 'b'): boolean {
        return !this.isKingInCheck(color, this.board) && this.getAllLegalMoves(color, this.board).length === 0;
      }

      // Pseudo Legal Moves (ignores check status constraints)
      generatePseudoLegalMoves(row: number, col: number, board: BoardState): Array<{ row: number; col: number }> {
        const piece = board[row][col]!;
        const moves: Array<{ row: number; col: number }> = [];
        const dir = piece.color === 'w' ? -1 : 1; // Pawns move UP for white, DOWN for black

        if (piece.type === 'p') {
          // Pawn 1-step forward
          const nextR = row + dir;
          if (nextR >= 0 && nextR < BOARD_SIZE && !board[nextR][col]) {
            moves.push({ row: nextR, col });
            // Pawn 2-step forward from starting row
            const startR = piece.color === 'w' ? 6 : 1;
            const doubleR = row + dir * 2;
            if (row === startR && !board[doubleR][col]) {
              moves.push({ row: doubleR, col });
            }
          }

          // Diagonal captures
          for (const dc of [-1, 1]) {
            const capR = row + dir;
            const capC = col + dc;
            if (capR >= 0 && capR < BOARD_SIZE && capC >= 0 && capC < BOARD_SIZE) {
              const dest = board[capR][capC];
              if (dest && dest.color !== piece.color) {
                moves.push({ row: capR, col: capC });
              }
            }
          }
        }

        // Rook & Queen sliding horizontal/vertical
        if (piece.type === 'r' || piece.type === 'q') {
          const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          dirs.forEach(([dr, dc]) => {
            let nr = row + dr;
            let nc = col + dc;
            while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              const dest = board[nr][nc];
              if (!dest) {
                moves.push({ row: nr, col: nc });
              } else {
                if (dest.color !== piece.color) {
                  moves.push({ row: nr, col: nc });
                }
                break;
              }
              nr += dr;
              nc += dc;
            }
          });
        }

        // Bishop & Queen sliding diagonal
        if (piece.type === 'b' || piece.type === 'q') {
          const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
          dirs.forEach(([dr, dc]) => {
            let nr = row + dr;
            let nc = col + dc;
            while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              const dest = board[nr][nc];
              if (!dest) {
                moves.push({ row: nr, col: nc });
              } else {
                if (dest.color !== piece.color) {
                  moves.push({ row: nr, col: nc });
                }
                break;
              }
              nr += dr;
              nc += dc;
            }
          });
        }

        // Knight movements
        if (piece.type === 'n') {
          const jumps = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
          ];
          jumps.forEach(([dr, dc]) => {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              const dest = board[nr][nc];
              if (!dest || dest.color !== piece.color) {
                moves.push({ row: nr, col: nc });
              }
            }
          });
        }

        // King movements
        if (piece.type === 'k') {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                const dest = board[nr][nc];
                if (!dest || dest.color !== piece.color) {
                  moves.push({ row: nr, col: nc });
                }
              }
            }
          }
        }

        return moves;
      }

      drawBoard() {
        const gfx = this.boardGraphics;
        gfx.clear();

        // High-tech board outlines
        gfx.lineStyle(2.5, 0x00d4ff, 0.95);
        gfx.strokeRect(OFFSET_X - 2, OFFSET_Y - 2, BOARD_SIZE * TILE_SIZE + 4, BOARD_SIZE * TILE_SIZE + 4);

        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const isDark = (r + c) % 2 === 1;
            const x = OFFSET_X + c * TILE_SIZE;
            const y = OFFSET_Y + r * TILE_SIZE;

            // Checker layout coloring
            gfx.fillStyle(isDark ? 0x0c1129 : 0x181e3d, 0.9);
            gfx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            
            // Thin inner grids
            gfx.lineStyle(0.6, 0x00d4ff, 0.25);
            gfx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          }
        }

        // Highlight last move from/to squares
        if (this.lastMove) {
          gfx.lineStyle(1.8, 0xffea00, 0.7); // glowing yellow
          const fromX = OFFSET_X + this.lastMove.from.col * TILE_SIZE;
          const fromY = OFFSET_Y + this.lastMove.from.row * TILE_SIZE;
          gfx.strokeRect(fromX + 1.5, fromY + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);

          const toX = OFFSET_X + this.lastMove.to.col * TILE_SIZE;
          const toY = OFFSET_Y + this.lastMove.to.row * TILE_SIZE;
          gfx.strokeRect(toX + 1.5, toY + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
        }

        // Highlight king in red if checked
        const activeKingColor = this.turn === 'w' ? 'w' : 'b';
        if (this.isKingInCheck(activeKingColor, this.board)) {
          // Find active King
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              const piece = this.board[r][c];
              if (piece && piece.type === 'k' && piece.color === activeKingColor) {
                gfx.fillStyle(0xff0055, 0.35); // red check tint
                gfx.fillRect(OFFSET_X + c * TILE_SIZE, OFFSET_Y + r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                gfx.lineStyle(2, 0xff0055, 1);
                gfx.strokeRect(OFFSET_X + c * TILE_SIZE + 1.5, OFFSET_Y + r * TILE_SIZE + 1.5, TILE_SIZE - 3, TILE_SIZE - 3);
              }
            }
          }
        }
      }

      drawPieces() {
        // Clear all old texts
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (this.pieceTexts[r][c]) {
              this.pieceTexts[r][c].destroy();
              this.pieceTexts[r][c] = null as any;
            }
          }
        }

        // Draw active pieces
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = this.board[r][c];
            if (piece) {
              const x = OFFSET_X + c * TILE_SIZE + TILE_SIZE / 2;
              const y = OFFSET_Y + r * TILE_SIZE + TILE_SIZE / 2;

              const key = `piece-${piece.color}-${piece.type}`;
              const sprite = this.add.sprite(x, y, key);
              this.pieceTexts[r][c] = sprite;
            }
          }
        }
      }

      drawSelections() {
        const gfx = this.selectionGraphics;
        gfx.clear();

        // Highlight selected square in green
        if (this.selectedSquare) {
          const sx = OFFSET_X + this.selectedSquare.col * TILE_SIZE;
          const sy = OFFSET_Y + this.selectedSquare.row * TILE_SIZE;
          gfx.lineStyle(2, 0x39ff14, 1); // Neon green
          gfx.strokeRect(sx + 1, sy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          gfx.fillStyle(0x39ff14, 0.12);
          gfx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }

        // Highlight valid move dots/circles
        this.validMoves.forEach(m => {
          const cx = OFFSET_X + m.col * TILE_SIZE + TILE_SIZE / 2;
          const cy = OFFSET_Y + m.row * TILE_SIZE + TILE_SIZE / 2;

          const isCapture = this.board[m.row][m.col] !== null;
          if (isCapture) {
            gfx.lineStyle(2, 0xff0055, 0.85); // Capture neon red ring
            gfx.strokeCircle(cx, cy, TILE_SIZE / 2.3);
            gfx.fillStyle(0xff0055, 0.15);
            gfx.fillCircle(cx, cy, TILE_SIZE / 2.3);
          } else {
            gfx.fillStyle(0x39ff14, 0.75); // Destination green dot
            gfx.fillCircle(cx, cy, 6);
          }
        });
      }

      updateHUD() {
        // Update turn texts
        if (this.isOver) {
          this.statusText.setText(this.gameStateText);
        } else {
          const activeText = this.turn === 'w' ? 'YOUR\nTURN' : 'AI\nTHINKING';
          const activeColor = this.turn === 'w' ? '#00d4ff' : '#ff00ff';
          this.statusText.setText(activeText).setColor(activeColor);
        }

        // Render visual Evaluation Bar showing material values balances
        this.drawEvaluationBar();

        // Render visual captured pieces wrapping in the sidebar
        if (this.captureSprites) {
          this.captureSprites.forEach(s => s.destroy());
        }
        this.captureSprites = [];

        // Player Captures: Black pieces captured by player (using 'piece-b-...')
        this.capturedBlack.forEach((p, i) => {
          const type = p.toLowerCase();
          const key = `piece-b-${type}`;
          const x = 532 + (i % 5) * 18;
          const y = 330 + Math.floor(i / 5) * 20;
          const sprite = this.add.sprite(x, y, key).setScale(0.32);
          this.captureSprites.push(sprite);
        });

        // AI Captures: White pieces captured by AI (using 'piece-w-...')
        this.capturedWhite.forEach((p, i) => {
          const type = p.toLowerCase();
          const key = `piece-w-${type}`;
          const x = 532 + (i % 5) * 18;
          const y = 425 + Math.floor(i / 5) * 20;
          const sprite = this.add.sprite(x, y, key).setScale(0.32);
          this.captureSprites.push(sprite);
        });
      }

      drawEvaluationBar() {
        const gfx = this.evalBarGraphics;
        gfx.clear();

        // Eval vertical bar: X = 500, Y = 80, W = 12, H = 432
        const barX = 500;
        const barY = 80;
        const barW = 12;
        const barH = 432;

        gfx.lineStyle(1.5, 0x00d4ff, 0.7);
        gfx.strokeRect(barX, barY, barW, barH);
        gfx.fillStyle(0x0c0f1d, 1);
        gfx.fillRect(barX, barY, barW, barH);

        // Evaluation Math
        const evalScore = this.evaluateBoard(this.board);

        // Clamped advantage percentage. If 0 -> 50%.
        // Each pawn is 100 points. Scale ratio: 1000 score = full bar.
        const scaledVal = Phaser.Math.Clamp(evalScore, -1200, 1200);
        const percent = (scaledVal + 1200) / 2400; // 0 to 1

        const playerHeight = barH * (1 - percent); // White is negative score, so high negative = White winning = taller player height
        const aiHeight = barH * percent;

        // Player section (Cyan)
        gfx.fillStyle(0x00d4ff, 1);
        gfx.fillRect(barX, barY + aiHeight, barW, playerHeight);

        // AI section (Magenta)
        gfx.fillStyle(0xff00ff, 1);
        gfx.fillRect(barX, barY, barW, aiHeight);
      }

      triggerWinGame(text: string) {
        this.isOver = true;
        this.gameStateText = 'VICTORY';
        this.gameStateOverlay(text, '#39ff14');

        // Play Win Fanfare
        playSweep(261.63, 523.25, 0.15, 'square', 0.12);
        setTimeout(() => playSweep(329.63, 659.25, 0.15, 'square', 0.12), 150);
        setTimeout(() => playSweep(392.00, 783.99, 0.15, 'square', 0.12), 300);
        setTimeout(() => playSweep(523.25, 1046.5, 0.45, 'square', 0.12), 450);
      }

      triggerLossGame(text: string) {
        this.isOver = true;
        this.gameStateText = 'DEFEAT';
        this.gameStateOverlay(text, '#ff0055');

        // Play Loss Tragic Sweep
        playSweep(180, 80, 0.5, 'square', 0.15);
        setTimeout(() => playSweep(140, 60, 0.7, 'square', 0.15), 300);
      }

      triggerDrawGame(text: string) {
        this.isOver = true;
        this.gameStateText = 'DRAW';
        this.gameStateOverlay(text, '#ffea00');

        // Play standard sweep
        playSweep(300, 200, 0.35, 'triangle', 0.1);
      }

      gameStateOverlay(title: string, colorHex: string) {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(OFFSET_X + 216, OFFSET_Y + 216, 300, 140, 0x08080f, 0.95).setStrokeStyle(1.5, parseInt(colorHex.replace('#', '0x'), 16));
        this.add.text(OFFSET_X + 216, OFFSET_Y + 175, title, {
          fontFamily: 'Orbitron, monospace', fontSize: '18px', color: colorHex, fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5);
        
        this.add.text(OFFSET_X + 216, OFFSET_Y + 215, 'Press SPACE or CLICK to Restart', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        const menuTxt = this.add.text(OFFSET_X + 216, OFFSET_Y + 245, '⌂ RETURN TO MENU', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ff00ff', fontWeight: 'bold', cursor: 'pointer'
        }).setOrigin(0.5).setInteractive();
        menuTxt.on('pointerdown', () => {
          playSound(440, 'sine', 0.05, 0.05);
          this.scene.start('ChessMenu');
        });
      }

      restartGame() {
        this.scene.restart({ difficulty: this.difficulty });
      }

      recordMove(fromRow: number, fromCol: number, toRow: number, toCol: number, pieceType: string, isWhite: boolean, isCapture: boolean) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const toRank = 8 - toRow;

        // Castling check
        let moveStr = '';
        if (pieceType === 'k' && Math.abs(fromCol - toCol) === 2) {
          moveStr = toCol === 6 ? 'O-O' : 'O-O-O';
        } else {
          const pieceCode = pieceType === 'p' ? '' : pieceType.toUpperCase();
          if (pieceType === 'p') {
            if (isCapture) {
              moveStr = `${files[fromCol]}x${files[toCol]}${toRank}`;
            } else {
              moveStr = `${files[toCol]}${toRank}`;
            }
          } else {
            if (isCapture) {
              moveStr = `${pieceCode}x${files[toCol]}${toRank}`;
            } else {
              moveStr = `${pieceCode}${files[toCol]}${toRank}`;
            }
          }
        }

        // Add check '+' symbol if opponent King is checked
        const oppColor = isWhite ? 'b' : 'w';
        if (this.isKingInCheck(oppColor, this.board)) {
          moveStr += '+';
        }

        if (isWhite) {
          const moveNum = this.moveList.length + 1;
          this.moveList.push(`${moveNum.toString().padStart(2, ' ')}. ${moveStr.padEnd(7, ' ')}`);
        } else {
          if (this.moveList.length > 0) {
            this.moveList[this.moveList.length - 1] += ` ${moveStr}`;
          } else {
            this.moveList.push(` 1. ...     ${moveStr}`);
          }
        }
        this.updateMovesDisplay();
      }

      updateMovesDisplay() {
        const maxLines = 7;
        const start = Math.max(0, this.moveList.length - maxLines);
        const displayLines = this.moveList.slice(start, start + maxLines);
        this.movesText.setText(displayLines.join('\n'));
      }
    };

    return { scenes: [MenuScene, ChessScene] };
  }
}
