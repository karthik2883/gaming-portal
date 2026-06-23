// TypeRacer game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'type-racer' in PhaserGameEngineV2.tsx

const TEXT_PROMPTS = [
  "The quick brown fox jumps over the lazy dog. Hackers prefer the terminal over the mouse any day of the week.",
  "In the neon-lit streets of Neo-Tokyo, data is the only currency that matters. Jack in, download the payload, and get out before the ice traces you.",
  "Syntax error on line 42. Expected semicolon but found undefined. Debugging is like being the detective in a crime movie where you are also the murderer.",
  "Artificial intelligence is no match for natural stupidity. But a good algorithm can sometimes compensate for a bad day of coding.",
  "Quantum computing will break all encryption. Until then, make sure you use a password manager and don't reuse your credentials across sites.",
  "The matrix is everywhere. It is all around us. Even now, in this very room. You can see it when you look out your window or when you turn on your television.",
  "Speed and accuracy are the keys to victory. Keep your eyes on the next word and let your fingers dance across the mechanical keyboard."
];

// Audio helpers (safe for SSR)
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
  } catch (e) {}
}

export default class TypeRacerGameFactory {
  static create(PhaserLib: any) {
    return class TypeRacerScene extends PhaserLib.Scene {
      gameState!: 'MENU' | 'COUNTDOWN' | 'RACING' | 'FINISHED';
      
      // Typing Logic
      targetText!: string;
      typedIndex!: number; // how many characters typed correctly
      errorIndex!: number; // if > 0, the index of the character they got wrong
      
      // Racing stats
      startTime!: number;
      finishTime!: number;
      totalKeystrokes!: number;
      correctKeystrokes!: number;
      
      // Game Objects
      cars!: any[];
      roadLines!: Phaser.GameObjects.Graphics;
      roadOffset: number = 0;
      
      textContainer!: Phaser.GameObjects.Container;
      charElements!: Phaser.GameObjects.Text[];
      
      cloudGraphics!: Phaser.GameObjects.Graphics;
      clouds!: {x: number, y: number, speed: number, size: number}[];

      uiGraphics!: Phaser.GameObjects.Graphics;
      wpmText!: Phaser.GameObjects.Text;
      accuracyText!: Phaser.GameObjects.Text;
      countdownText!: Phaser.GameObjects.Text;
      timerText!: Phaser.GameObjects.Text;

      botSpeeds!: number[]; // WPM for each bot
      botNames!: string[];

      timeLeft!: number;

      constructor() {
        super({ key: 'TypeRacer' });
      }

      preload() {
        this.load.image('car', '/media/neon_car.png');
      }

      init() {
        this.gameState = 'MENU';
        this.targetText = TEXT_PROMPTS[Math.floor(Math.random() * TEXT_PROMPTS.length)];
        this.typedIndex = 0;
        this.errorIndex = -1;
        this.totalKeystrokes = 0;
        this.correctKeystrokes = 0;
        this.roadOffset = 0;
        this.cars = [];
        this.charElements = [];
        this.botSpeeds = [40, 55, 70]; // Example bot WPMs
        this.timeLeft = 60; // 60 seconds race

        const names = ['NeonRider', 'CyberNinja', 'Glitch', 'ZeroCool', 'AcidBurn', 'CrashOverride', 'NullPointer', 'ByteMe'];
        Phaser.Utils.Array.Shuffle(names);
        this.botNames = names.slice(0, 3);
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Background
        this.add.rectangle(0, 0, W, H, 0x0c0f1d).setOrigin(0, 0);

        this.clouds = [];
        for (let i = 0; i < 8; i++) {
          this.clouds.push({
            x: Math.random() * W,
            y: Math.random() * 200, // Sky area
            speed: 0.05 + Math.random() * 0.1,
            size: 20 + Math.random() * 40
          });
        }
        this.cloudGraphics = this.add.graphics();

        this.roadLines = this.add.graphics();
        this.uiGraphics = this.add.graphics();

        this.input.keyboard.on('keydown', this.handleKeyInput, this);

        this.buildMenu();
      }

      buildMenu() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.uiGraphics.clear();
        
        const title = this.add.text(W/2, H/2 - 80, 'TYPE RACER', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '48px', color: '#ff0055', fontStyle: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 10, true, true);

        const sub = this.add.text(W/2, H/2 - 10, 'Select Difficulty:', {
          fontFamily: 'monospace', fontSize: '20px', color: '#00d4ff'
        }).setOrigin(0.5);

        const opt1 = this.add.text(W/2 - 115, H/2 + 30, '[1] EASY   (20-40 WPM) ', { fontFamily: 'monospace', fontSize: '18px', color: '#39ff14' }).setOrigin(0, 0.5);
        const opt2 = this.add.text(W/2 - 115, H/2 + 60, '[2] MEDIUM (40-70 WPM) ', { fontFamily: 'monospace', fontSize: '18px', color: '#ffea00' }).setOrigin(0, 0.5);
        const opt3 = this.add.text(W/2 - 115, H/2 + 90, '[3] HARD   (70-110 WPM)', { fontFamily: 'monospace', fontSize: '18px', color: '#ff0055' }).setOrigin(0, 0.5);

        this.cars = [title, sub, opt1, opt2, opt3]; 
      }

      startRace() {
        // Clear Menu
        this.cars.forEach(c => c.destroy());
        this.cars = [];
        
        const W = this.scale.width;
        const H = this.scale.height;

        // Build Cars
        // 4 Lanes: Player + 3 Bots
        const laneHeight = 60;
        const startY = 100;
        const colors = [0x00d4ff, 0xff0055, 0xffea00, 0x39ff14]; // Player is cyan
        
        for (let i = 0; i < 4; i++) {
          const y = startY + i * laneHeight;
          const car = this.add.sprite(50, y, 'car').setOrigin(0.5, 0.5);
          car.setDisplaySize(100, 35); // Fix stretched car image by forcing proper aspect ratio
          car.setFlipX(true); // Image was generated facing left
          car.setBlendMode(Phaser.BlendModes.SCREEN); // Removes black background
          
          if (i !== 0) {
            // Tint bot cars so you can tell them apart. Player is default neon pink from the prompt.
            car.setTint(colors[i]);
          }
          
          // We don't need a separate glass element anymore since the sprite handles details.
          // Keep a dummy one so the update logic doesn't crash
          const glass = this.add.rectangle(0, 0, 0, 0, 0x000000, 0); 
          
          const botName = i === 0 ? 'YOU' : this.botNames[i - 1];
          const label = this.add.text(25, y - 22, botName, {
            fontFamily: 'monospace', fontSize: '10px', color: '#fff'
          }).setOrigin(0.5, 0.5);
          
          this.cars.push({
            x: 50,
            y,
            sprite: car,
            glass: glass,
            label: label,
            progress: 0, // 0 to 1
            isPlayer: i === 0,
            botWpm: i === 0 ? 0 : this.botSpeeds[i - 1],
            finished: false,
            name: botName
          });
        }

        this.buildTextPrompt();

        this.wpmText = this.add.text(20, 10, 'WPM: 0', { fontFamily: 'monospace', fontSize: '16px', color: '#00d4ff' });
        this.accuracyText = this.add.text(120, 10, 'ACC: 100%', { fontFamily: 'monospace', fontSize: '16px', color: '#39ff14' });
        this.timerText = this.add.text(W - 100, 10, 'TIME: 60', { fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#ffea00' });

        this.gameState = 'COUNTDOWN';
        
        let count = 3;
        this.countdownText = this.add.text(W/2, H/2 - 100, '3', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '72px', color: '#ffea00', fontStyle: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ffea00', 10, true, true);

        playSound(440, 'square', 0.2);

        const countdownEvent = this.time.addEvent({
          delay: 1000,
          repeat: 3,
          callback: () => {
            count--;
            if (count > 0) {
              this.countdownText.setText(count.toString());
              playSound(440, 'square', 0.2);
            } else if (count === 0) {
              this.countdownText.setText('GO!');
              this.countdownText.setColor('#39ff14');
              playSound(880, 'square', 0.4);
              // Car rush / revving sound
              playSound(150, 'sawtooth', 0.8, 0.3);
              setTimeout(() => playSound(200, 'sawtooth', 0.5, 0.2), 200);

              // Allow typing immediately when GO! appears
              this.gameState = 'RACING';
              this.startTime = this.time.now;
              this.updateCursor();
            } else {
              this.countdownText.destroy();
            }
          }
        });
      }

      buildTextPrompt() {
        const W = this.scale.width;
        
        this.textContainer = this.add.container(0, 0);
        
        const marginX = 50;
        let startY = 360; 
        
        let currentX = marginX;
        let currentY = startY;
        
        // measure char width exactly to fix alignment
        const tempText = this.add.text(0, 0, 'A', { fontFamily: 'monospace', fontSize: '22px' });
        const charWidth = tempText.width;
        const charHeight = tempText.height;
        tempText.destroy();

        // Split by words to handle wrapping
        const words = this.targetText.split(' ');

        for (let w = 0; w < words.length; w++) {
          const word = words[w] + (w < words.length - 1 ? ' ' : '');
          const wordWidth = word.length * charWidth;

          if (currentX + wordWidth > W - marginX) {
            currentX = marginX;
            currentY += charHeight + 10; // Tighter line height
          }

          for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const t = this.add.text(currentX, currentY, char, {
              fontFamily: 'monospace', fontSize: '22px', color: '#a0aec0' 
            });
            this.charElements.push(t);
            this.textContainer.add(t);
            
            // Advance cursor exactly
            currentX += charWidth;
          }
        }

        // Create a properly aligned background panel with a new color
        const totalHeight = (currentY - startY) + charHeight + 30;
        const panelCenterY = startY + (totalHeight / 2) - 15;

        // Vibrant purple/pink panel instead of black/dark blue
        const panel = this.add.rectangle(W/2, panelCenterY, W - 40, totalHeight, 0x2a0a4a, 0.8).setStrokeStyle(2, 0xff0055);
        this.textContainer.addAt(panel, 0);
      }

      handleKeyInput(e: KeyboardEvent) {
        getAudioContext();

        if (this.gameState === 'MENU') {
          if (e.key === '1') {
            this.botSpeeds = [20, 30, 40];
            this.startRace();
          } else if (e.key === '2') {
            this.botSpeeds = [40, 55, 70];
            this.startRace();
          } else if (e.key === '3') {
            this.botSpeeds = [70, 90, 110];
            this.startRace();
          }
          return;
        }

        if (this.gameState === 'FINISHED' && e.code === 'Enter') {
          this.scene.restart();
          return;
        }

        if (this.gameState !== 'RACING') return;

        // Ignore meta keys
        if (e.key.length > 1) return;

        this.totalKeystrokes++;
        
        const targetChar = this.targetText[this.typedIndex];
        
        if (e.key === targetChar) {
          // Correct keystroke
          this.correctKeystrokes++;
          this.charElements[this.typedIndex].setColor('#39ff14'); // Green
          this.charElements[this.typedIndex].setShadow(0, 0, '#39ff14', 5, true, true);
          
          // Clear error state if any
          if (this.errorIndex === this.typedIndex) {
            this.errorIndex = -1;
          }
          
          this.typedIndex++;
          // Engine rev on type
          playSound(120 + (this.typedIndex * 2), 'sawtooth', 0.05, 0.05);
          playSound(600, 'sine', 0.02, 0.02); // Click sound

          // Update player car progress
          const progress = this.typedIndex / this.targetText.length;
          this.cars[0].progress = progress;

          if (this.typedIndex === this.targetText.length) {
            this.playerFinished();
          } else {
            // Underline next character
            this.updateCursor();
          }
        } else {
          // Incorrect keystroke
          if (this.errorIndex !== this.typedIndex) {
            this.errorIndex = this.typedIndex;
            this.charElements[this.typedIndex].setColor('#ff0055'); // Red
            this.charElements[this.typedIndex].setBackgroundColor('#ff005555');
            playSound(150, 'sawtooth', 0.1, 0.1);
          }
        }

        this.updateHUD();
      }

      updateCursor() {
        // Remove background from all un-typed
        for (let i = this.typedIndex; i < this.charElements.length; i++) {
          this.charElements[i].setBackgroundColor('transparent');
        }
        // Add underline/background to current
        if (this.typedIndex < this.charElements.length && this.errorIndex === -1) {
          this.charElements[this.typedIndex].setBackgroundColor('#ffffff33');
        }
      }

      playerFinished() {
        this.cars[0].finished = true;
        this.finishTime = this.time.now;
        
        // Remove cursor
        this.charElements.forEach(c => c.setBackgroundColor('transparent'));
        
        this.endGame(); // End game immediately if player finishes
      }

      endGame() {
        this.gameState = 'FINISHED';
        this.finishTime = this.time.now;

        // Hide the prompt text container so it doesn't overlap the game over text
        if (this.textContainer) {
          this.textContainer.setVisible(false);
        }

        playSound(440, 'triangle', 0.1);
        setTimeout(() => playSound(554, 'triangle', 0.1), 100);
        setTimeout(() => playSound(659, 'triangle', 0.2), 200);

        const W = this.scale.width;
        const H = this.scale.height;

        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.8).setOrigin(0.5);
        
        // Add checkered flag
        this.add.text(W/2, H/2 - 120, '🏁', { fontSize: '64px' }).setOrigin(0.5);
        
        // Calculate Placement based on progress
        let sortedCars = [...this.cars].sort((a, b) => b.progress - a.progress);
        let placement = sortedCars.findIndex(c => c.isPlayer) + 1;
        
        let placeStr = placement === 1 ? '1st' : placement === 2 ? '2nd' : placement === 3 ? '3rd' : '4th';

        let winMsg = placement === 1 ? 'YOU WON!' : `${sortedCars[0].name} WON!`;

        this.add.text(W/2, H/2 - 60, winMsg, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '40px', color: placement === 1 ? '#ffea00' : '#ff0055', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(W/2, H/2 - 20, `You finished ${placeStr}`, {
          fontFamily: 'monospace', fontSize: '24px', color: '#00d4ff'
        }).setOrigin(0.5);

        const minutes = (this.finishTime - this.startTime) / 60000;
        // In case the player hasn't typed anything, words is 0. If they finished, it's the full length.
        const typedChars = this.cars[0].progress * this.targetText.length;
        const words = typedChars / 5;
        const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
        const accuracy = this.totalKeystrokes > 0 ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100) : 0;

        this.add.text(W/2, H/2 + 20, `Speed: ${wpm} WPM`, {
          fontFamily: 'monospace', fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(W/2, H/2 + 50, `Accuracy: ${accuracy}%`, {
          fontFamily: 'monospace', fontSize: '20px', color: '#ffffff'
        }).setOrigin(0.5);

        let suggestion = '';
        if (accuracy < 90) suggestion = "Suggestion: Focus on accuracy to avoid penalties!";
        else if (wpm < 40) suggestion = "Suggestion: Great accuracy! Now try to push your speed.";
        else if (wpm < 70) suggestion = "Suggestion: Good speed! Practice daily to hit Hacker levels.";
        else suggestion = "Suggestion: Incredible typing! You are a master hacker.";

        this.add.text(W/2, H/2 + 90, suggestion, {
          fontFamily: 'monospace', fontSize: '16px', color: '#ffea00', fontStyle: 'italic'
        }).setOrigin(0.5);

        let restartCount = 10;
        const restartText = this.add.text(W/2, H/2 + 130, `Restarting in ${restartCount}... (Press ENTER to skip)`, {
          fontFamily: 'monospace', fontSize: '18px', color: '#4b5563'
        }).setOrigin(0.5);

        // Auto restart countdown
        this.time.addEvent({
          delay: 1000,
          repeat: 9,
          callback: () => {
            if (this.gameState !== 'FINISHED') return; // Just in case it was skipped
            restartCount--;
            if (restartCount > 0) {
              restartText.setText(`Restarting in ${restartCount}... (Press ENTER to skip)`);
            } else {
              this.scene.restart();
            }
          }
        });
      }

      updateHUD() {
        if (!this.wpmText || !this.accuracyText) return;
        
        const minutes = (this.time.now - this.startTime) / 60000;
        if (minutes > 0) {
          const words = this.typedIndex / 5;
          const wpm = Math.round(words / minutes);
          this.wpmText.setText(`WPM: ${wpm}`);
        }

        const accuracy = this.totalKeystrokes > 0 ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100) : 100;
        this.accuracyText.setText(`ACC: ${accuracy}%`);
      }

      update(time: number, delta: number) {
        if (this.gameState === 'MENU') return;

        const W = this.scale.width;
        const H = this.scale.height;
        
        // Draw moving clouds
        this.cloudGraphics.clear();
        this.cloudGraphics.fillStyle(0x00d4ff, 0.05); // Very faint neon clouds
        this.clouds.forEach(c => {
          c.x -= c.speed * delta;
          if (c.x < -c.size * 2) c.x = W + c.size * 2;
          this.cloudGraphics.fillEllipse(c.x, c.y, c.size * 2, c.size);
          this.cloudGraphics.fillEllipse(c.x + c.size * 0.5, c.y - c.size * 0.3, c.size * 1.5, c.size * 0.8);
        });
        
        // Draw Road background grid
        this.roadLines.clear();
        
        // Neon Grid
        this.roadLines.lineStyle(1, 0x00d4ff, 0.2);
        // Horizontal lines
        for (let i = 0; i < H; i += 40) {
          this.roadLines.beginPath();
          this.roadLines.moveTo(0, i);
          this.roadLines.lineTo(W, i);
          this.roadLines.strokePath();
        }
        // Vertical lines (scrolling)
        const gridOffset = this.roadOffset % 40;
        for (let x = gridOffset; x < W; x += 40) {
          this.roadLines.beginPath();
          this.roadLines.moveTo(x, 0);
          this.roadLines.lineTo(x, H);
          this.roadLines.strokePath();
        }

        this.roadLines.lineStyle(2, 0x4b5563, 0.5);
        
        // Determine camera speed based on player progress
        // Actually, let's keep cars within the screen
        // Track goes from x=50 to W-50
        const trackLength = W - 100;

        if (this.gameState === 'RACING') {
          this.roadOffset -= delta * 0.5; // Road moving backwards effect
          if (this.roadOffset < -40) this.roadOffset = 0;

          // Update timer
          this.timeLeft -= delta / 1000;
          if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.endGame();
            return;
          }
          this.timerText.setText(`TIME: ${Math.ceil(this.timeLeft)}`);

          // Update Bots
          const elapsedMinutes = (time - this.startTime) / 60000;
          let anyBotFinished = false;

          this.cars.forEach((car, idx) => {
            if (!car.isPlayer && !car.finished) {
              const totalWords = this.targetText.length / 5;
              const expectedWords = car.botWpm * elapsedMinutes;
              car.progress = Phaser.Math.Clamp(expectedWords / totalWords, 0, 1);
              if (car.progress >= 1) {
                car.finished = true;
                anyBotFinished = true;
              }
            }

            // Move car sprites
            const targetX = 50 + (car.progress * trackLength);
            // Smooth lerp
            car.sprite.x += (targetX - car.sprite.x) * 0.1;
            car.glass.x = car.sprite.x + 15;
            car.label.x = car.sprite.x;
            car.label.y = car.sprite.y - 22;
            
            // Add slight vertical jitter to simulate driving
            if (this.time.now % 100 < 50) {
              car.sprite.y += Math.random() * 1 - 0.5;
            }
          });

          if (anyBotFinished) {
             this.endGame();
             return;
          }

          // Continually update HUD (for WPM over time)
          this.updateHUD();
        }

        // Draw dashed lane lines
        this.roadLines.lineStyle(2, 0x4b5563, 0.8);
        for (let i = 1; i < 4; i++) {
          const y = 100 + i * 60 - 30; // Between lanes
          for (let x = this.roadOffset; x < W; x += 40) {
            this.roadLines.beginPath();
            this.roadLines.moveTo(x, y);
            this.roadLines.lineTo(x + 20, y);
            this.roadLines.strokePath();
          }
        }
        
        // Finish line
        this.roadLines.lineStyle(4, 0xffffff, 0.8);
        this.roadLines.beginPath();
        this.roadLines.moveTo(W - 40, 70);
        this.roadLines.lineTo(W - 40, 310);
        this.roadLines.strokePath();
      }
    };
  }
}
