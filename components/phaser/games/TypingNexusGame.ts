// Typing Nexus game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'typing' in PhaserGameEngine.tsx

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

// Clicky mechanical keyboard sounds (alternating slight pitch shifts)
let keyClickAlt = false;
function playKeyClick() {
  keyClickAlt = !keyClickAlt;
  playSound(keyClickAlt ? 800 : 850, 'triangle', 0.02, 0.06);
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

// Dictionaries
const STANDARD_WORDS = [
  'CYBER', 'MATRIX', 'GRID', 'PHASER', 'NEXUS', 'HACKER', 'SHIELD', 'LASER', 'METEOR', 'FIREWALL',
  'SYSTEM', 'CONSOLE', 'NETWORK', 'PROCESS', 'PROGRAM', 'DATABASE', 'ROUTER', 'MODEM', 'VECTOR', 'RENDER',
  'SHADER', 'BUFFER', 'SPRITE', 'CANVAS', 'ENGINE', 'FLUX', 'CODE', 'BINARY', 'OCTAL', 'HEX',
  'CHIP', 'CIRCUIT', 'TERMINAL', 'SERVER', 'CLIENT', 'SOCKET', 'PORT', 'PROXY', 'DOCKER', 'CLOUD',
  'PIXEL', 'PIPELINE', 'RECURSION', 'ALGORITHM', 'STRETCH', 'RESPONSE', 'DYNAMIC', 'PROMPT', 'AI', 'LOGIC'
];

const CODE_COMMANDS = [
  'npm run dev',
  'git commit -m "update"',
  'console.log("system ok");',
  'const game = new Phaser.Game();',
  'SELECT * FROM users WHERE active = true;',
  'docker-compose up -d',
  'curl -X POST http://api/login',
  'window.localStorage.setItem("key", val);',
  'let [x, y] = [0, 0];',
  'res.status(200).json({ success: true });',
  'rm -rf .next && npm run build',
  'systemctl restart nginx.service',
  'export default function Page() {',
  'import { useEffect, useState } from "react";'
];

interface FallingWord {
  text: string;
  x: number;
  y: number;
  speed: number;
  textObj: Phaser.GameObjects.Text;
}

export default class TypingNexusGameFactory {
  static create(PhaserLib: any) {
    return class TypingNexusScene extends PhaserLib.Scene {
      // Game State: 'MENU' | 'PLAY_METEOR' | 'PLAY_TIME' | 'PLAY_TERMINAL' | 'STATS'
      gameState!: 'MENU' | 'PLAY_METEOR' | 'PLAY_TIME' | 'PLAY_TERMINAL' | 'STATS';
      activeMode!: 'METEOR' | 'TIME' | 'TERMINAL';

      // Gameplay metrics
      score!: number;
      highScores!: Record<string, number>;
      typedBuffer!: string;
      totalKeystrokes!: number;
      correctKeystrokes!: number;
      wordsTypedCount!: number;

      // Mode 1: Meteor Defend
      fallingWords!: FallingWord[];
      shieldHealth!: number;
      meteorSpawnTimer!: number;

      // Mode 2: Time Attack
      timeRemaining!: number; // ms
      wordsQueue!: string[];

      // Mode 3: Hacker Terminal
      terminalLogs!: string[];
      currentCommand!: string;
      firewallProgress!: number; // 0 to 1
      terminalMistakes!: number;
      hackingLevel!: number;

      // Graphics & Text elements
      starGraphics!: Phaser.GameObjects.Graphics;
      hudGraphics!: Phaser.GameObjects.Graphics;
      starFields!: Array<{ x: number; y: number; alpha: number; speed: number }>;

      // Text objects
      scoreText!: Phaser.GameObjects.Text;
      metricsText!: Phaser.GameObjects.Text;
      typedBufferText!: Phaser.GameObjects.Text;

      // UI containers
      menuUIElements!: Phaser.GameObjects.GameObject[];
      statsUIElements!: Phaser.GameObjects.GameObject[];
      meteorUIElements!: Phaser.GameObjects.GameObject[];
      timeUIElements!: Phaser.GameObjects.GameObject[];
      terminalUIElements!: Phaser.GameObjects.GameObject[];

      constructor() {
        super({ key: 'TypingNexus' });
      }

      init() {
        this.gameState = 'MENU';
        this.score = 0;
        this.typedBuffer = '';
        this.totalKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.wordsTypedCount = 0;

        this.fallingWords = [];
        this.shieldHealth = 100;
        this.meteorSpawnTimer = 0;

        this.timeRemaining = 60000;
        this.wordsQueue = [];

        this.terminalLogs = [];
        this.currentCommand = '';
        this.firewallProgress = 0;
        this.terminalMistakes = 0;
        this.hackingLevel = 1;

        this.menuUIElements = [];
        this.statsUIElements = [];
        this.meteorUIElements = [];
        this.timeUIElements = [];
        this.terminalUIElements = [];

        // Load local high scores
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('typing_nexus_high_scores');
          this.highScores = saved ? JSON.parse(saved) : { METEOR: 0, TIME: 0, TERMINAL: 0 };
        } else {
          this.highScores = { METEOR: 0, TIME: 0, TERMINAL: 0 };
        }

        // Initialize Starfield points
        this.starFields = Array.from({ length: 35 }, () => ({
          x: Math.random() * 600,
          y: Math.random() * 500,
          alpha: Math.random(),
          speed: 0.15 + Math.random() * 0.4
        }));
      }

      create() {
        this.starGraphics = this.add.graphics();
        this.hudGraphics = this.add.graphics();

        // Keyboard captures
        this.input.keyboard.on('keydown', (e: KeyboardEvent) => {
          getAudioContext();
          this.handleGlobalKeyInput(e);
        });

        // Setup Main Menu screen
        this.buildMenuScreen();
      }

      buildMenuScreen() {
        this.gameState = 'MENU';
        this.clearAllUIScreens();

        const W = this.scale.width;
        
        // Header
        const header = this.add.text(W / 2, 60, 'TYPING NEXUS', {
          fontFamily: 'Orbitron, monospace', fontSize: '28px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#00d4ff', 8, true, true);
        this.menuUIElements.push(header);

        const sub = this.add.text(W / 2, 100, 'CHOOSE YOUR TRANSMISSION MODE', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ff00ff'
        }).setOrigin(0.5);
        this.menuUIElements.push(sub);

        // 3 Cards mapping
        const modes = [
          { name: 'METEOR DEFEND', key: 'METEOR', desc: 'Arcade Survival\nDestroy falling words before they breach the grid.', color: '#39ff14', y: 170 },
          { name: 'TIME ATTACK', key: 'TIME', desc: '60s Speed Run\nType as many words as possible. Correct words add +1s.', color: '#ffea00', y: 260 },
          { name: 'HACKER TERMINAL', key: 'TERMINAL', desc: 'Code Typer\nType scripts correctly before the firewall scan finishes.', color: '#ff0055', y: 350 }
        ];

        modes.forEach(mode => {
          // Card Box backing
          const btnBack = this.add.rectangle(W / 2, mode.y, 420, 70, 0x0c0f1d, 0.9).setStrokeStyle(1.2, parseInt(mode.color.replace('#', '0x')));
          btnBack.setInteractive({ useHandCursor: true });
          btnBack.on('pointerdown', () => {
            playSound(523, 'sine', 0.1, 0.1);
            this.startGameplayMode(mode.key as any);
          });

          // Text labels
          const title = this.add.text(W / 2 - 190, mode.y - 20, mode.name, {
            fontFamily: 'Orbitron, monospace', fontSize: '14px', color: mode.color, fontWeight: 'bold'
          });
          const descText = this.add.text(W / 2 - 190, mode.y + 2, mode.desc, {
            fontFamily: 'monospace', fontSize: '11px', color: '#9090b0'
          });

          // High score tag
          const best = this.highScores[mode.key] || 0;
          const bestText = this.add.text(W / 2 + 190, mode.y, `BEST: ${best}`, {
            fontFamily: 'monospace', fontSize: '12px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(1, 0.5);

          this.menuUIElements.push(btnBack, title, descText, bestText);
        });
      }

      startGameplayMode(modeKey: 'METEOR' | 'TIME' | 'TERMINAL') {
        this.clearAllUIScreens();
        this.gameState = ('PLAY_' + modeKey) as any;
        this.activeMode = modeKey;

        this.score = 0;
        this.typedBuffer = '';
        this.totalKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.wordsTypedCount = 0;

        const W = this.scale.width;

        // Common HUD
        this.scoreText = this.add.text(25, 20, 'SCORE: 0', {
          fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#00d4ff', fontWeight: 'bold'
        });
        
        this.metricsText = this.add.text(W - 25, 20, 'WPM: 0  |  ACC: 100%', {
          fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#00d4ff', fontWeight: 'bold', align: 'right'
        }).setOrigin(1, 0);

        this.typedBufferText = this.add.text(W / 2, 455, '', {
          fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5);

        // Sub HUD elements references
        if (modeKey === 'METEOR') {
          this.shieldHealth = 100;
          this.fallingWords = [];
          this.meteorSpawnTimer = 0;

          // Draw bottom shield barrier bar
          const barrier = this.add.text(W / 2, 410, '🛡️ SHIELD BARRIER WALL 🛡️', {
            fontFamily: 'monospace', fontSize: '11px', color: '#39ff14', align: 'center'
          }).setOrigin(0.5);
          this.meteorUIElements.push(barrier);
        } else if (modeKey === 'TIME') {
          this.timeRemaining = 60000;
          this.wordsQueue = [];
          // Pre-populate queue
          for (let i = 0; i < 4; i++) {
            this.wordsQueue.push(STANDARD_WORDS[Math.floor(Math.random() * STANDARD_WORDS.length)]);
          }
          this.drawTimeAttackQueue();
        } else if (modeKey === 'TERMINAL') {
          this.terminalMistakes = 0;
          this.hackingLevel = 1;
          this.firewallProgress = 0;
          this.terminalLogs = [
            'System connected...',
            'Firewall node security initialized...',
            'Type code blocks correctly to hack grid nodes.'
          ];
          this.spawnNewTerminalCommand();
        }

        // Mechanical level intro sound
        playSweep(220, 880, 0.35, 'square', 0.12);
      }

      spawnNewTerminalCommand() {
        this.currentCommand = CODE_COMMANDS[Math.floor(Math.random() * CODE_COMMANDS.length)];
        this.typedBuffer = '';
        this.firewallProgress = 0;
        this.drawTerminalInterface();
      }

      drawTerminalInterface() {
        this.terminalUIElements.forEach(el => el.destroy());
        this.terminalUIElements = [];

        const W = this.scale.width;

        // Title Hacking Level
        const levelTxt = this.add.text(W / 2, 65, `NODE HACK LEVEL: ${this.hackingLevel}`, {
          fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.terminalUIElements.push(levelTxt);

        // Terminal text panels
        let logY = 100;
        this.terminalLogs.slice(-5).forEach(log => {
          const logTxt = this.add.text(45, logY, `> ${log}`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#4b5563'
          });
          this.terminalUIElements.push(logTxt);
          logY += 20;
        });

        // Command to type
        const cmdPrompt = this.add.text(45, 230, 'guest@nexus:~$ ', {
          fontFamily: 'monospace', fontSize: '14px', color: '#00d4ff', fontWeight: 'bold'
        });
        this.terminalUIElements.push(cmdPrompt);

        // Splitting characters to draw correct typed overlays
        const startX = 45 + cmdPrompt.width;
        
        // Draw gray base text command
        const baseCmd = this.add.text(startX, 230, this.currentCommand, {
          fontFamily: 'monospace', fontSize: '14px', color: '#1e293b'
        });
        this.terminalUIElements.push(baseCmd);

        // Draw green correct overlay text
        const correctTypedPart = this.currentCommand.substring(0, this.typedBuffer.length);
        if (correctTypedPart) {
          const greenCmd = this.add.text(startX, 230, correctTypedPart, {
            fontFamily: 'monospace', fontSize: '14px', color: '#39ff14', fontWeight: 'bold'
          }).setShadow(0, 0, '#39ff14', 5, true, true);
          this.terminalUIElements.push(greenCmd);
        }
      }

      drawTimeAttackQueue() {
        this.timeUIElements.forEach(el => el.destroy());
        this.timeUIElements = [];

        const W = this.scale.width;

        // Current target word
        const target = this.wordsQueue[0];
        const targetText = this.add.text(W / 2, 200, target, {
          fontFamily: 'Orbitron, monospace', fontSize: '36px', color: '#ffea00', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ffea00', 8, true, true);
        this.timeUIElements.push(targetText);

        // Typed progress outline overlay (tints correct typed letters in cyan)
        const typedCorrect = this.typedBuffer;
        if (typedCorrect && target.startsWith(typedCorrect)) {
          const overlay = this.add.text(W / 2, 200, typedCorrect, {
            fontFamily: 'Orbitron, monospace', fontSize: '36px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(0.5).setShadow(0, 0, '#00d4ff', 8, true, true);
          this.timeUIElements.push(overlay);
        }

        // Sub queue upcoming
        let subY = 270;
        this.wordsQueue.slice(1).forEach((word, idx) => {
          const subText = this.add.text(W / 2, subY, word, {
            fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#4b5563'
          }).setOrigin(0.5);
          this.timeUIElements.push(subText);
          subY += 30;
        });
      }

      handleGlobalKeyInput(e: KeyboardEvent) {
        if (this.gameState === 'MENU') {
          if (e.code === 'Digit1') this.startGameplayMode('METEOR');
          if (e.code === 'Digit2') this.startGameplayMode('TIME');
          if (e.code === 'Digit3') this.startGameplayMode('TERMINAL');
          return;
        }

        if (this.gameState === 'STATS') {
          if (e.code === 'Space' || e.code === 'Enter') {
            this.buildMenuScreen();
          }
          return;
        }

        // Backspace delete support
        if (e.code === 'Backspace') {
          e.preventDefault();
          if (this.typedBuffer.length > 0) {
            this.typedBuffer = this.typedBuffer.slice(0, -1);
            playSound(300, 'sine', 0.02, 0.05); // Delete tick
            this.totalKeystrokes++;
            this.updateInputDisplay();
          }
          return;
        }

        // Capture keystrokes
        if (e.key.length === 1) {
          playKeyClick();
          this.totalKeystrokes++;
          
          if (this.gameState === 'PLAY_METEOR') {
            this.typedBuffer += e.key.toUpperCase();
            this.checkMeteorMatch();
          } else if (this.gameState === 'PLAY_TIME') {
            const target = this.wordsQueue[0];
            const nextChar = target[this.typedBuffer.length];
            
            // Check matching next letter
            if (e.key.toUpperCase() === nextChar) {
              this.correctKeystrokes++;
              this.typedBuffer += e.key.toUpperCase();
              this.checkTimeAttackMatch();
            } else {
              playSound(150, 'sawtooth', 0.08, 0.08); // Error buzz
              // Reset typing buffer on mismatch
              this.typedBuffer = '';
            }
          } else if (this.gameState === 'PLAY_TERMINAL') {
            const nextChar = this.currentCommand[this.typedBuffer.length];
            if (e.key === nextChar) {
              this.correctKeystrokes++;
              this.typedBuffer += e.key;
              this.checkTerminalMatch();
            } else {
              playSound(150, 'sawtooth', 0.08, 0.08);
              this.totalKeystrokes++; // count error
            }
          }

          this.updateInputDisplay();
        }
      }

      checkMeteorMatch() {
        // Find if buffer matches any falling word fully
        let matchIdx = -1;
        for (let i = 0; i < this.fallingWords.length; i++) {
          if (this.fallingWords[i].text === this.typedBuffer) {
            matchIdx = i;
            break;
          }
        }

        if (matchIdx !== -1) {
          // Matched! Destroy meteor
          const word = this.fallingWords[matchIdx];
          
          this.correctKeystrokes += word.text.length;
          this.score += word.text.length * 10;
          this.wordsTypedCount++;
          
          word.textObj.destroy();
          this.fallingWords.splice(matchIdx, 1);
          this.typedBuffer = '';

          // Satisfying correct sound
          playSound(587.33, 'triangle', 0.08, 0.08);
          setTimeout(() => playSound(880, 'triangle', 0.12, 0.08), 50);

          this.updateHUDText();
        }
      }

      checkTimeAttackMatch() {
        const target = this.wordsQueue[0];
        if (this.typedBuffer === target) {
          // Success! Shifting queue
          this.score += target.length * 10;
          this.wordsTypedCount++;
          this.timeRemaining += 1000; // Add 1 second extension
          
          this.wordsQueue.shift();
          this.wordsQueue.push(STANDARD_WORDS[Math.floor(Math.random() * STANDARD_WORDS.length)]);
          this.typedBuffer = '';

          playSound(659.25, 'triangle', 0.08, 0.08);
          setTimeout(() => playSound(987.77, 'triangle', 0.12, 0.08), 50);

          this.updateHUDText();
          this.drawTimeAttackQueue();
        }
      }

      checkTerminalMatch() {
        this.drawTerminalInterface();

        if (this.typedBuffer === this.currentCommand) {
          // Correct script typed!
          this.score += this.currentCommand.length * 5;
          this.wordsTypedCount++;
          this.terminalLogs.push(`HACK COMPLETED: ${this.currentCommand}`);
          
          // Sound arpeggio
          playSound(880, 'sine', 0.06, 0.08);
          setTimeout(() => playSound(1046.5, 'sine', 0.06, 0.08), 40);
          setTimeout(() => playSound(1318.5, 'sine', 0.12, 0.08), 80);

          // Level up check
          if (this.wordsTypedCount % 5 === 0) {
            this.hackingLevel++;
            this.terminalLogs.push(`>> ACCESS GRANTED. SECURITY LEVEL INCREASES.`);
            
            // Celebratory sweep
            setTimeout(() => {
              playSweep(440, 1760, 0.4, 'triangle', 0.1);
            }, 150);
          }

          this.spawnNewTerminalCommand();
          this.updateHUDText();
        }
      }

      updateInputDisplay() {
        if (this.gameState === 'STATS' || this.gameState === 'MENU') return;
        if (!this.typedBufferText || !this.typedBufferText.active) return;

        if (this.gameState === 'PLAY_METEOR') {
          this.typedBufferText.setText(this.typedBuffer);
          this.highlightFallingPrefixes();
        } else if (this.gameState === 'PLAY_TIME') {
          this.drawTimeAttackQueue();
        } else if (this.gameState === 'PLAY_TERMINAL') {
          this.drawTerminalInterface();
        }
      }

      highlightFallingPrefixes() {
        this.fallingWords.forEach(w => {
          if (this.typedBuffer && w.text.startsWith(this.typedBuffer)) {
            // Highlight matching prefix in cyan
            w.textObj.setColor('#00d4ff');
          } else {
            // Restore standard yellow/white
            w.textObj.setColor('#ffea00');
          }
        });
      }

      updateHUDText() {
        if (this.gameState === 'STATS' || this.gameState === 'MENU') return;
        if (!this.scoreText || !this.scoreText.active || !this.metricsText || !this.metricsText.active) return;

        this.scoreText.setText(`SCORE: ${this.score}`);
        
        // Calculate WPM & Accuracy
        const accuracy = this.totalKeystrokes > 0 
          ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
          : 100;
        
        // Live WPM calculation (estimate 5 chars = 1 word)
        let wpm = 0;
        if (this.gameState === 'PLAY_TIME') {
          const elapsed = (60000 - this.timeRemaining) / 1000;
          wpm = elapsed > 2 ? Math.round((this.correctKeystrokes / 5) / (elapsed / 60)) : 0;
        } else {
          // Standard estimate
          wpm = Math.round(this.wordsTypedCount * 1.5);
        }

        this.metricsText.setText(`WPM: ${wpm}  |  ACC: ${accuracy}%`);
      }

      update(time: number, delta: number) {
        // Draw starfields background
        this.drawStarfields();

        if (this.gameState === 'PLAY_METEOR') {
          this.updateMeteorMode(delta);
        } else if (this.gameState === 'PLAY_TIME') {
          this.updateTimeAttackMode(delta);
        } else if (this.gameState === 'PLAY_TERMINAL') {
          this.updateTerminalMode(delta);
        }
      }

      drawStarfields() {
        const gfx = this.starGraphics;
        gfx.clear();
        this.starFields.forEach(star => {
          star.y += star.speed;
          if (star.y > 500) {
            star.y = 0;
            star.x = Math.random() * 600;
          }
          gfx.fillStyle(0xffffff, star.alpha);
          gfx.fillCircle(star.x, star.y, star.speed * 2);
        });
      }

      updateMeteorMode(delta: number) {
        // Update spawning timer
        this.meteorSpawnTimer += delta;
        
        // Spawn faster at higher score
        const spawnDelay = Math.max(1000, 2400 - (this.score / 20) * 100);
        if (this.meteorSpawnTimer >= spawnDelay) {
          this.meteorSpawnTimer = 0;
          this.spawnMeteorWord();
        }

        // Move falling words
        const crashLimit = 420;
        const cleanup: FallingWord[] = [];

        this.fallingWords.forEach(w => {
          w.y += w.speed * (delta / 16.66);
          w.textObj.y = w.y;

          if (w.y >= crashLimit) {
            cleanup.push(w);
          }
        });

        // Handle crashed words
        let breached = false;
        cleanup.forEach(w => {
          w.textObj.destroy();
          const idx = this.fallingWords.indexOf(w);
          if (idx !== -1) {
            this.fallingWords.splice(idx, 1);
          }

          // Damage shield
          this.shieldHealth = Math.max(0, this.shieldHealth - 20);
          playSound(100, 'sawtooth', 0.35, 0.15); // Crash explosion sound
          
          if (this.shieldHealth <= 0) {
            breached = true;
          }
        });

        if (breached) {
          this.endGame();
          return;
        }

        this.drawMeteorHUD();
      }

      spawnMeteorWord() {
        const W = this.scale.width;
        const wordStr = STANDARD_WORDS[Math.floor(Math.random() * STANDARD_WORDS.length)];
        
        // Ensure random coordinates keep text on canvas bounds
        const x = 50 + Math.random() * (W - 140);
        const speed = 0.6 + Math.random() * 0.7 + (this.score / 500) * 0.15;

        const textObj = this.add.text(x, 40, wordStr, {
          fontFamily: 'Orbitron, monospace', fontSize: '15px', color: '#ffea00', fontWeight: 'bold'
        }).setShadow(0, 0, '#ffea00', 5, true, true);

        this.fallingWords.push({
          text: wordStr, x, y: 40, speed, textObj
        });
      }

      drawMeteorHUD() {
        const gfx = this.hudGraphics;
        gfx.clear();

        const W = this.scale.width;

        // Draw horizontal Shield health bar
        const barX = 150;
        const barY = 430;
        const barW = 300;
        const barH = 12;

        gfx.lineStyle(1.5, 0x39ff14, 0.7);
        gfx.strokeRect(barX, barY, barW, barH);
        gfx.fillStyle(0x0c0f1d, 1);
        gfx.fillRect(barX, barY, barW, barH);

        const healthPercent = this.shieldHealth / 100;
        const fillW = barW * healthPercent;

        // Shield color transitions green -> red
        const fillColor = healthPercent > 0.5 ? 0x39ff14 : healthPercent > 0.25 ? 0xffea00 : 0xff0055;
        gfx.fillStyle(fillColor, 1);
        gfx.fillRect(barX, barY, fillW, barH);
      }

      updateTimeAttackMode(delta: number) {
        this.timeRemaining -= delta;
        if (this.timeRemaining <= 0) {
          this.timeRemaining = 0;
          this.endGame();
          return;
        }

        this.updateHUDText();
        this.drawTimeAttackHUD();
      }

      drawTimeAttackHUD() {
        const gfx = this.hudGraphics;
        gfx.clear();

        const W = this.scale.width;

        // Draw timer countdown bar
        const barX = 150;
        const barY = 120;
        const barW = 300;
        const barH = 10;

        gfx.lineStyle(1.5, 0xffea00, 0.7);
        gfx.strokeRect(barX, barY, barW, barH);
        gfx.fillStyle(0x0c0f1d, 1);
        gfx.fillRect(barX, barY, barW, barH);

        const timePercent = Phaser.Math.Clamp(this.timeRemaining / 60000, 0, 1);
        const fillW = barW * timePercent;

        gfx.fillStyle(0xffea00, 1);
        gfx.fillRect(barX, barY, fillW, barH);
      }

      updateTerminalMode(delta: number) {
        // Firewall scanning progress bar speed escalates per hacking level
        const fillRate = 0.0001 + (this.hackingLevel - 1) * 0.000015;
        this.firewallProgress = Phaser.Math.Clamp(this.firewallProgress + fillRate * delta, 0, 1);

        if (this.firewallProgress >= 1) {
          // Firewall breach! Security alarm
          this.firewallProgress = 0;
          this.terminalMistakes++;
          this.terminalLogs.push(`>> WARNING: FIREWALL COMPROMISED. SECURITY SCAN COMPLETED.`);
          playSound(120, 'sawtooth', 0.4, 0.25); // Warning buzz

          if (this.terminalMistakes >= 3) {
            this.endGame();
            return;
          } else {
            this.spawnNewTerminalCommand();
          }
        }

        this.drawTerminalHUD();
      }

      drawTerminalHUD() {
        const gfx = this.hudGraphics;
        gfx.clear();

        const W = this.scale.width;

        // Draw horizontal Firewall alert scanner bar
        const barX = 100;
        const barY = 425;
        const barW = 400;
        const barH = 8;

        gfx.lineStyle(1.5, 0xff0055, 0.7);
        gfx.strokeRect(barX, barY, barW, barH);
        gfx.fillStyle(0x0c0f1d, 1);
        gfx.fillRect(barX, barY, barW, barH);

        const fillW = barW * this.firewallProgress;
        gfx.fillStyle(0xff0055, 1);
        gfx.fillRect(barX, barY, fillW, barH);

        // Security grid alerts warning label
        if (this.terminalMistakes > 0) {
          gfx.fillStyle(0xff0055, 0.12);
          gfx.fillRect(0, 0, W, 500);
        }
      }

      endGame() {
        // Stop current scene loops
        this.gameState = 'STATS';

        this.hudGraphics.clear();
        
        // Destroy active falling objects
        this.fallingWords.forEach(w => w.textObj.destroy());
        this.fallingWords = [];

        // Tragic descent sweep sound
        playSweep(180, 80, 0.5, 'square', 0.15);
        setTimeout(() => playSweep(140, 60, 0.7, 'square', 0.15), 300);

        this.clearAllUIScreens();
        this.buildStatsScreen();

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'typing', score: this.score }
        }));
      }

      buildStatsScreen() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Check high score
        const best = this.highScores[this.activeMode] || 0;
        const isNewRecord = this.score > best;
        if (isNewRecord) {
          this.highScores[this.activeMode] = this.score;
          if (typeof window !== 'undefined') {
            localStorage.setItem('typing_nexus_high_scores', JSON.stringify(this.highScores));
          }
        }

        // Title box
        const overlayRect = this.add.rectangle(W / 2, H / 2, 320, 240, 0x08080f, 0.95).setStrokeStyle(1.5, 0xff00ff);
        this.statsUIElements.push(overlayRect);

        const statusTxt = this.add.text(W / 2, H / 2 - 90, 'TRANSMISSION ENDED', {
          fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#ff00ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        const finalScore = this.add.text(W / 2, H / 2 - 45, `FINAL SCORE: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '15px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        // Record tag
        const recordTxt = this.add.text(W / 2, H / 2 - 20, isNewRecord ? '🏆 NEW BEST RECORD!' : `BEST RECORD: ${best}`, {
          fontFamily: 'monospace', fontSize: '11px', color: isNewRecord ? '#ffea00' : '#4b5563', fontWeight: 'bold'
        }).setOrigin(0.5);

        // Detailed Metrics calculation
        const accuracy = this.totalKeystrokes > 0 
          ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
          : 100;
        const wpm = Math.round(this.wordsTypedCount * 1.5);

        const accuracyText = this.add.text(W / 2, H / 2 + 15, `TYPED WORDS: ${this.wordsTypedCount}\n\nACCURACY: ${accuracy}%\n\nSPEED RATE: ${wpm} WPM`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        const restartGuide = this.add.text(W / 2, H / 2 + 95, 'Press SPACE / CLICK to Restart', {
          fontFamily: 'monospace', fontSize: '11px', color: '#9090b0'
        }).setOrigin(0.5);

        this.statsUIElements.push(statusTxt, finalScore, recordTxt, accuracyText, restartGuide);
      }

      clearAllUIScreens() {
        this.menuUIElements.forEach(el => el.destroy());
        this.menuUIElements = [];

        this.statsUIElements.forEach(el => el.destroy());
        this.statsUIElements = [];

        this.meteorUIElements.forEach(el => el.destroy());
        this.meteorUIElements = [];

        this.timeUIElements.forEach(el => el.destroy());
        this.timeUIElements = [];

        this.terminalUIElements.forEach(el => el.destroy());
        this.terminalUIElements = [];

        if (this.scoreText) { this.scoreText.destroy(); }
        if (this.metricsText) { this.metricsText.destroy(); }
        if (this.typedBufferText) { this.typedBufferText.destroy(); }
      }

      restartGame() {
        this.scene.restart();
      }
    };
  }
}
