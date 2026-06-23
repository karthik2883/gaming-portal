// Sudoku game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'sudoku' in PhaserGameEngine.tsx

// Standalone browser audio synthesizer helper for retro SFX
function playBeep(frequency: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', duration: number = 0.1) {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth gain envelope to prevent clicking pop sounds
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context failed to start:", e);
  }
}

// Backtracking Sudoku solver & generator
function generateSudoku(difficulty: 'easy' | 'medium' | 'hard'): { start: number[][], solution: number[][] } {
  // Base valid solved Sudoku board
  const base = [
    [1, 2, 3,  4, 5, 6,  7, 8, 9],
    [4, 5, 6,  7, 8, 9,  1, 2, 3],
    [7, 8, 9,  1, 2, 3,  4, 5, 6],
    
    [2, 3, 1,  5, 6, 4,  8, 9, 7],
    [5, 6, 4,  8, 9, 7,  2, 3, 1],
    [8, 9, 7,  2, 3, 1,  5, 6, 4],
    
    [3, 1, 2,  6, 4, 5,  9, 7, 8],
    [6, 4, 5,  9, 7, 8,  3, 1, 2],
    [9, 7, 8,  3, 1, 2,  6, 4, 5]
  ];

  // Shuffle base to create unique puzzle
  const mapping = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  const solution = base.map(row => row.map(val => mapping[val - 1]));

  // Swap columns and rows within 3x3 boundaries randomly
  for (let block = 0; block < 9; block += 3) {
    // Swap rows within block
    const r1 = block + Math.floor(Math.random() * 3);
    const r2 = block + Math.floor(Math.random() * 3);
    if (r1 !== r2) {
      const temp = solution[r1];
      solution[r1] = solution[r2];
      solution[r2] = temp;
    }
    
    // Swap columns within block
    const c1 = block + Math.floor(Math.random() * 3);
    const c2 = block + Math.floor(Math.random() * 3);
    if (c1 !== c2) {
      for (let r = 0; r < 9; r++) {
        const temp = solution[r][c1];
        solution[r][c1] = solution[r][c2];
        solution[r][c2] = temp;
      }
    }
  }

  // Clear cells based on difficulty
  const start = solution.map(row => [...row]);
  let cellsToRemove = 32; // Easy
  if (difficulty === 'medium') cellsToRemove = 44;
  if (difficulty === 'hard') cellsToRemove = 54;

  let removed = 0;
  while (removed < cellsToRemove) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (start[r][c] !== 0) {
      start[r][c] = 0;
      removed++;
    }
  }

  return { start, solution };
}

export default class SudokuGameFactory {
  static create(PhaserLib: any) {
    return class SudokuScene extends PhaserLib.Scene {
      board!: number[][];
      startBoard!: number[][];
      solution!: number[][];
      selectedRow!: number;
      selectedCol!: number;
      difficulty!: 'easy' | 'medium' | 'hard';
      mistakes!: number;
      maxMistakes = 3;
      isOver!: boolean;
      won!: boolean;

      // Visuals
      cellTexts!: any[][];
      cellBgs!: any[][];
      difficultyButtons!: any[];
      mistakesText!: any;
      startText!: any;
      bg!: any;

      constructor() {
        super({ key: 'Sudoku' });
      }

      preload() {
        this.load.image('sudoku-bg', '/game-assets/sudoku-bg.png');
      }

      init(data: any) {
        this.difficulty = data?.difficulty ?? 'easy';
        this.mistakes = 0;
        this.isOver = false;
        this.won = false;
        this.selectedRow = -1;
        this.selectedCol = -1;
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Generate Board
        const boardData = generateSudoku(this.difficulty);
        this.startBoard = boardData.start;
        this.board = boardData.start.map(row => [...row]);
        this.solution = boardData.solution;

        this.cellTexts = Array.from({ length: 9 }, () => Array(9));
        this.cellBgs = Array.from({ length: 9 }, () => Array(9));

        // Add background image
        this.bg = this.add.image(W / 2, H / 2, 'sudoku-bg');
        const scaleX = W / this.bg.width;
        const scaleY = H / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setScale(scale).setScrollFactor(0);
        this.bg.setAlpha(0.25);

        // Header Title
        this.add.text(W / 2, 14, '⬡ SUDOKU', {
          fontFamily: 'monospace', fontSize: '18px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5, 0);

        // HUD Text
        this.mistakesText = this.add.text(W - 16, 16, `Mistakes: 0/3`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ff6b6b', fontWeight: 'bold'
        }).setOrigin(1, 0);

        // Difficulty Selection Tabs
        const diffTabs = ['easy', 'medium', 'hard'];
        const tabW = 80;
        const tabH = 24;
        const startTabX = W / 2 - 100;
        const diffY = 55;
        this.difficultyButtons = [];

        diffTabs.forEach((diff, idx) => {
          const x = startTabX + idx * 100;
          const tabBg = this.add.rectangle(x, diffY, tabW, tabH, 0x1f1f2e, 0.8)
            .setStrokeStyle(1.5, 0x4f4f6e)
            .setInteractive({ useHandCursor: true });
            
          const tabTxt = this.add.text(x, diffY, diff.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '11px', color: '#9090b0', fontWeight: 'bold'
          }).setOrigin(0.5);

          tabBg.on('pointerover', () => {
            if (this.difficulty !== diff) {
              tabBg.setStrokeStyle(2, 0x00d4ff);
              tabTxt.setColor('#ffffff');
            }
          });
          tabBg.on('pointerout', () => {
            if (this.difficulty !== diff) {
              tabBg.setStrokeStyle(1.5, 0x4f4f6e);
              tabTxt.setColor('#9090b0');
            }
          });
          tabBg.on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
            if (event && typeof event.stopPropagation === 'function') {
              event.stopPropagation();
            }
            if (this.difficulty === diff) return;
            this.scene.restart({ difficulty: diff });
          });

          this.difficultyButtons.push({ difficulty: diff, bg: tabBg, txt: tabTxt });
        });

        this.updateDifficultyTabs();

        // 9x9 Board Dimensions
        const cellSize = 44;
        const boardW = cellSize * 9;
        const boardX = (W - boardW) / 2;
        const boardY = 100;

        // Render cell containers
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const cx = boardX + c * cellSize;
            const cy = boardY + r * cellSize;

            const cellCtr = this.add.container(cx, cy);

            const bgRect = this.add.rectangle(cellSize / 2, cellSize / 2, cellSize - 2, cellSize - 2, 0xffffff, 0)
              .setInteractive({ useHandCursor: true });
            cellCtr.add(bgRect);

            const valText = this.add.text(cellSize / 2, cellSize / 2, '', {
              fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold', color: '#ffffff'
            }).setOrigin(0.5);
            cellCtr.add(valText);

            bgRect.on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
              if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
              }
              if (this.isOver) return;
              playBeep(440, 'sine', 0.02); // Click tick sound
              this.selectedRow = r;
              this.selectedCol = c;
              this.updateHighlights();
            });

            this.cellTexts[r][c] = valText;
            this.cellBgs[r][c] = bgRect;

            this.updateCellVisuals(r, c);
          }
        }

        // Draw Board borders (Grid Lines)
        const gridGfx = this.add.graphics();
        // Thin inner lines
        gridGfx.lineStyle(1.5, 0x00d4ff, 0.12);
        for (let i = 0; i <= 9; i++) {
          const pos = i * cellSize;
          gridGfx.lineBetween(boardX + pos, boardY, boardX + pos, boardY + boardW);
          gridGfx.lineBetween(boardX, boardY + pos, boardX + boardW, boardY + pos);
        }
        // Thick block outlines
        gridGfx.lineStyle(3.5, 0x00d4ff, 0.45);
        for (let i = 0; i <= 9; i += 3) {
          const pos = i * cellSize;
          gridGfx.lineBetween(boardX + pos, boardY - 1, boardX + pos, boardY + boardW + 1);
          gridGfx.lineBetween(boardX - 1, boardY + pos, boardX + boardW + 1, boardY + pos);
        }

        // Number Selection Pad at bottom
        const padY = 525;
        const startX_pad = W / 2 - 200;
        const keyW = 34;
        const keyH = 40;
        const gap = 8;

        for (let i = 1; i <= 9; i++) {
          const x = startX_pad + (i - 1) * (keyW + gap);
          const btn = this.add.rectangle(x, padY, keyW, keyH, 0x1f1f2e, 0.8)
            .setStrokeStyle(1.5, 0x4f4f6e)
            .setInteractive({ useHandCursor: true });
            
          const txt = this.add.text(x, padY, i.toString(), {
            fontFamily: 'monospace', fontSize: '18px', color: '#9090b0', fontWeight: 'bold'
          }).setOrigin(0.5);

          btn.on('pointerover', () => {
            btn.setStrokeStyle(2, 0x00d4ff);
            txt.setColor('#ffffff');
          });
          btn.on('pointerout', () => {
            btn.setStrokeStyle(1.5, 0x4f4f6e);
            txt.setColor('#9090b0');
          });
          btn.on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
            if (event && typeof event.stopPropagation === 'function') {
              event.stopPropagation();
            }
            if (this.isOver) return;
            this.placeDigit(i);
          });
        }

        // Erase Button next to key pad
        const eraseX = startX_pad + 9 * (keyW + gap) + 10;
        const eraseBtn = this.add.rectangle(eraseX, padY, 60, keyH, 0x2d1a24, 0.8)
          .setStrokeStyle(1.5, 0x8b3a5c)
          .setInteractive({ useHandCursor: true });
          
        const eraseTxt = this.add.text(eraseX, padY, 'ERASE', {
          fontFamily: 'monospace', fontSize: '12px', color: '#ff6b6b', fontWeight: 'bold'
        }).setOrigin(0.5);

        eraseBtn.on('pointerover', () => {
          eraseBtn.setStrokeStyle(2, 0xff0080);
          eraseTxt.setColor('#ffffff');
        });
        eraseBtn.on('pointerout', () => {
          eraseBtn.setStrokeStyle(1.5, 0x8b3a5c);
          eraseTxt.setColor('#ff6b6b');
        });
        eraseBtn.on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
          if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
          }
          if (this.isOver) return;
          this.clearSelectedCell();
        });

        // Control buttons (New Game & Solve)
        const ctrlY = 585;

        // New Game
        const newGameBtn = this.add.rectangle(W / 2 - 70, ctrlY, 110, 32, 0x1f1f2e, 0.8)
          .setStrokeStyle(1.5, 0x00d4ff)
          .setInteractive({ useHandCursor: true });
        const newGameTxt = this.add.text(W / 2 - 70, ctrlY, 'NEW GAME', {
          fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        newGameBtn.on('pointerover', () => {
          newGameBtn.setFillStyle(0x00d4ff, 0.15);
          newGameTxt.setColor('#ffffff');
        });
        newGameBtn.on('pointerout', () => {
          newGameBtn.setFillStyle(0x1f1f2e, 0.8);
          newGameTxt.setColor('#00d4ff');
        });
        newGameBtn.on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
          if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
          }
          this.scene.restart({ difficulty: this.difficulty });
        });

        // Solve Board
        const solveBtn = this.add.rectangle(W / 2 + 70, ctrlY, 110, 32, 0x1f1f2e, 0.8)
          .setStrokeStyle(1.5, 0xffaa00)
          .setInteractive({ useHandCursor: true });
        const solveTxt = this.add.text(W / 2 + 70, ctrlY, 'SOLVE BOARD', {
          fontFamily: 'monospace', fontSize: '13px', color: '#ffaa00', fontWeight: 'bold'
        }).setOrigin(0.5);

        solveBtn.on('pointerover', () => {
          solveBtn.setFillStyle(0xffaa00, 0.15);
          solveTxt.setColor('#ffffff');
        });
        solveBtn.on('pointerout', () => {
          solveBtn.setFillStyle(0x1f1f2e, 0.8);
          solveTxt.setColor('#ffaa00');
        });
        solveBtn.on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
          if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
          }
          this.solveBoard();
        });

        // Keyboard inputs (numpad + row keys)
        this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
          if (this.isOver) return;
          if (this.selectedRow === -1 || this.selectedCol === -1) return;
          
          const key = event.key;
          if (key >= '1' && key <= '9') {
            this.placeDigit(parseInt(key));
          } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
            this.clearSelectedCell();
          }
        });
      }

      updateDifficultyTabs() {
        if (!this.difficultyButtons) return;
        this.difficultyButtons.forEach((btn: any) => {
          if (btn.difficulty === this.difficulty) {
            btn.bg.setFillStyle(0x00d4ff, 0.2);
            btn.bg.setStrokeStyle(2, 0x00d4ff);
            btn.txt.setColor('#ffffff');
          } else {
            btn.bg.setFillStyle(0x1f1f2e, 0.8);
            btn.bg.setStrokeStyle(1.5, 0x4f4f6e);
            btn.txt.setColor('#9090b0');
          }
        });
      }

      updateCellVisuals(r: number, c: number) {
        const val = this.board[r][c];
        const txtObj = this.cellTexts[r][c];
        if (val === 0) {
          txtObj.setText('');
        } else {
          txtObj.setText(val.toString());
          if (this.startBoard[r][c] !== 0) {
            txtObj.setColor('#ffffff'); // Starting number: White
          } else if (val === this.solution[r][c]) {
            txtObj.setColor('#00d4ff'); // Player correct: Blue/Cyan
          } else {
            txtObj.setColor('#ff0080'); // Player wrong: Pink/Red
          }
        }
      }

      updateHighlights() {
        const selR = this.selectedRow;
        const selC = this.selectedCol;
        const hasSelection = selR !== -1 && selC !== -1;
        const selVal = hasSelection ? this.board[selR][selC] : 0;

        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const bg = this.cellBgs[r][c];
            const isSelected = r === selR && c === selC;
            
            const sameRow = r === selR;
            const sameCol = c === selC;
            const sameBlock = Math.floor(r/3) === Math.floor(selR/3) && Math.floor(c/3) === Math.floor(selC/3);
            
            const isRelated = hasSelection && (sameRow || sameCol || sameBlock);
            const isMatchingDigit = hasSelection && selVal !== 0 && this.board[r][c] === selVal;

            if (isSelected) {
              bg.setFillStyle(0x00d4ff, 0.35);
              bg.setStrokeStyle(2.5, 0x00d4ff, 1);
            } else if (isMatchingDigit) {
              bg.setFillStyle(0x00d4ff, 0.22);
              bg.setStrokeStyle(0);
            } else if (isRelated) {
              bg.setFillStyle(0x00d4ff, 0.06);
              bg.setStrokeStyle(0);
            } else {
              bg.setFillStyle(0xffffff, 0);
              bg.setStrokeStyle(0);
            }
          }
        }
      }

      placeDigit(val: number) {
        const r = this.selectedRow;
        const c = this.selectedCol;
        if (r === -1 || c === -1) return;

        // Given numbers are locked
        if (this.startBoard[r][c] !== 0) {
          playBeep(220, 'sine', 0.05);
          setTimeout(() => playBeep(220, 'sine', 0.05), 60);
          return;
        }

        if (this.board[r][c] === val) return;
        this.board[r][c] = val;

        if (val === this.solution[r][c]) {
          playBeep(523.25, 'triangle', 0.08); // Success ping
        } else {
          playBeep(150, 'sawtooth', 0.15); // Buzz error sound
          this.mistakes++;
          this.mistakesText.setText(`Mistakes: ${this.mistakes}/3`);
          if (this.mistakes >= this.maxMistakes) {
            this.endGame();
            return;
          }
        }

        this.updateCellVisuals(r, c);
        this.updateHighlights();

        if (this.checkWin()) {
          this.winGame();
        }
      }

      clearSelectedCell() {
        const r = this.selectedRow;
        const c = this.selectedCol;
        if (r === -1 || c === -1) return;

        if (this.startBoard[r][c] !== 0) {
          playBeep(220, 'sine', 0.05);
          setTimeout(() => playBeep(220, 'sine', 0.05), 60);
          return;
        }

        if (this.board[r][c] === 0) return;
        this.board[r][c] = 0;
        playBeep(350, 'sine', 0.06); // Whoosh clear

        this.updateCellVisuals(r, c);
        this.updateHighlights();
      }

      checkWin(): boolean {
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (this.board[r][c] !== this.solution[r][c]) {
              return false;
            }
          }
        }
        return true;
      }

      solveBoard() {
        if (this.isOver) return;

        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            this.board[r][c] = this.solution[r][c];
            this.updateCellVisuals(r, c);
          }
        }

        playBeep(261.63, 'triangle', 0.1);
        setTimeout(() => playBeep(329.63, 'triangle', 0.1), 100);
        setTimeout(() => playBeep(392.00, 'triangle', 0.15), 200);

        this.selectedRow = -1;
        this.selectedCol = -1;
        this.updateHighlights();
        
        this.winGame(true);
      }

      winGame(autoSolved: boolean = false) {
        this.isOver = true;

        playBeep(261.63, 'triangle', 0.1);
        setTimeout(() => playBeep(329.63, 'triangle', 0.1), 100);
        setTimeout(() => playBeep(392.00, 'triangle', 0.1), 200);
        setTimeout(() => playBeep(523.25, 'triangle', 0.25), 300);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 130, 0x08080f, 0.95).setStrokeStyle(1, 0x39ff14);
        this.add.text(W / 2, H / 2 - 30, '🏆 YOU WIN!', {
          fontFamily: 'monospace', fontSize: '22px', color: '#39ff14'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 5, `Level: ${this.difficulty.toUpperCase()}`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#f0f0ff'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 32, 'Click or Space to Play Again', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        const restartScene = () => this.scene.restart({ difficulty: this.difficulty });
        this.input.once('pointerdown', restartScene);
        this.input.keyboard.once('keydown-SPACE', restartScene);

        if (!autoSolved) {
          let baseScore = 1000;
          if (this.difficulty === 'medium') baseScore = 3000;
          if (this.difficulty === 'hard') baseScore = 5000;
          const score = Math.max(100, baseScore - this.mistakes * 200);

          // Dispatch game over event for the leaderboard system
          window.dispatchEvent(new CustomEvent('phaser-game-over', {
            detail: { gameKey: 'sudoku', score }
          }));
        }
      }

      endGame() {
        this.isOver = true;

        playBeep(180, 'sawtooth', 0.2);
        setTimeout(() => playBeep(120, 'sawtooth', 0.25), 150);
        setTimeout(() => playBeep(90, 'sawtooth', 0.35), 300);

        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H / 2, 280, 130, 0x08080f, 0.95).setStrokeStyle(1, 0xff0080);
        this.add.text(W / 2, H / 2 - 30, 'GAME OVER', {
          fontFamily: 'monospace', fontSize: '22px', color: '#ff0080'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 5, `Too Many Mistakes!`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#f0f0ff'
        }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 32, 'Click or Space to Restart', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        const restartScene = () => this.scene.restart({ difficulty: this.difficulty });
        this.input.once('pointerdown', restartScene);
        this.input.keyboard.once('keydown-SPACE', restartScene);
      }
    };
  }
}
