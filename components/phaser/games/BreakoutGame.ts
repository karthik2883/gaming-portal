// Breakout / Block-breaker game — factory pattern for SSR-safe Phaser.js loading
// Register key: 'breakout' in PhaserGameEngine.tsx

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

// Rounded rectangle helper for robust Canvas compatibility
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default class BreakoutGameFactory {
  static create(PhaserLib: any) {
    return class BreakoutScene extends PhaserLib.Scene {
      ball: any;
      paddle: any;
      bricks: any;
      cursors: any;
      score = 0;
      lives = 3;
      scoreText: any;
      livesText: any;
      isOver = false;
      started = false;
      startText: any;
      selectedLevel = 'medium';
      currentSpeed = 320;
      speedButtons: any[] = [];
      speedLabel: any;
      gridGraphics: any;
      gridOffset = 0;
      ballTrail: any;

      constructor() {
        super({ key: 'Breakout' });
      }

      preload() {
        this.load.image('breakout-bg', '/game-assets/breakout-bg.png');
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.score = 0;
        this.lives = 3;
        this.isOver = false;
        this.started = false;
        this.gridOffset = 0;

        // Background image
        const bg = this.add.image(W / 2, H / 2, 'breakout-bg');
        const scaleX = W / bg.width;
        const scaleY = H / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);
        bg.setAlpha(0.55);

        // Graphics overlay for animated grid scrolling
        this.gridGraphics = this.add.graphics();

        // Enable collision on left, right, and top bounds; disable on bottom
        this.physics.world.setBoundsCollision(true, true, true, false);

        // Define colors matching the high fidelity retro neon thumbnail
        const COLOR_HEX = ['#ff0055', '#ff7700', '#ffcc00', '#00ffcc', '#0099ff', '#ff00ff'];
        const COLOR_NUM = [0xff0055, 0xff7700, 0xffcc00, 0x00ffcc, 0x0099ff, 0xff00ff];

        // Texture generation helper
        const generateTexture = (key: string, width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) {
            this.textures.remove(key);
          }
          const canvasTexture = this.textures.createCanvas(key, width, height);
          const ctx = canvasTexture.context;
          drawFn(ctx);
          canvasTexture.refresh();
        };

        // 1. Generate Glowing Paddle Texture
        const padX = 10;
        const padY = 10;
        const paddleW = 100;
        const paddleH = 14;
        generateTexture('paddle-texture', paddleW + padX * 2, paddleH + padY * 2, (ctx) => {
          drawRoundRect(ctx, padX, padY, paddleW, paddleH, 6);
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1.5;
          drawRoundRect(ctx, padX, padY, paddleW, paddleH, 6);
          ctx.stroke();
        });

        // 2. Generate Glowing Ball Texture
        const ballRad = 8;
        const ballPad = 8;
        generateTexture('ball-texture', ballRad * 2 + ballPad * 2, ballRad * 2 + ballPad * 2, (ctx) => {
          ctx.beginPath();
          ctx.arc(ballRad + ballPad, ballRad + ballPad, ballRad, 0, Math.PI * 2);
          ctx.shadowColor = '#00ffcc';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        });

        // 3. Generate Trail and Particle Debris Textures
        generateTexture('trail-particle', 12, 12, (ctx) => {
          ctx.beginPath();
          ctx.arc(6, 6, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#00ffcc';
          ctx.fill();
        });
        generateTexture('brick-particle', 8, 8, (ctx) => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 8, 8);
        });

        // Paddle setup
        this.paddle = this.add.sprite(W / 2, H - 40, 'paddle-texture');
        this.physics.add.existing(this.paddle, true); // static body
        (this.paddle.body as any).setSize(paddleW, paddleH);
        (this.paddle.body as any).setOffset(padX, padY);

        // Ball setup
        this.ball = this.add.sprite(W / 2, H - 60, 'ball-texture');
        this.physics.add.existing(this.ball);
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.onWorldBounds = true;
        this.ball.body.setBounce(1);
        this.ball.body.setVelocity(0, 0);
        (this.ball.body as any).setCircle(ballRad);
        (this.ball.body as any).setOffset(ballPad, ballPad);

        // Ball Trail setup
        this.ballTrail = this.add.particles(0, 0, 'trail-particle', {
          speed: 10,
          scale: { start: 1.0, end: 0 },
          alpha: { start: 0.5, end: 0.01 },
          blendMode: 'ADD',
          lifespan: 250,
          frequency: 15,
        });
        this.ballTrail.startFollow(this.ball);
        this.ballTrail.stop(); // Rest until launch

        // Bricks grid setup
        this.bricks = this.physics.add.staticGroup();
        const brickCols = 9;
        const brickRows = 6;
        const brickW = Math.floor((W - 60) / brickCols);
        const brickH = 22;
        const startX = 30 + brickW / 2;
        const startY = 60;
        const brickPad = 10;

        // Generate glowing textures for each brick row
        for (let row = 0; row < brickRows; row++) {
          generateTexture(`brick-${row}`, brickW - 4 + brickPad * 2, brickH + brickPad * 2, (ctx) => {
            drawRoundRect(ctx, brickPad, brickPad, brickW - 4, brickH, 4);
            ctx.shadowColor = COLOR_HEX[row];
            ctx.shadowBlur = 6;
            ctx.fillStyle = COLOR_HEX[row];
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 1;
            drawRoundRect(ctx, brickPad + 1.5, brickPad + 1.5, brickW - 7, brickH - 3, 3);
            ctx.stroke();
          });
        }

        // Spawn brick sprites
        for (let row = 0; row < brickRows; row++) {
          for (let col = 0; col < brickCols; col++) {
            const bx = startX + col * brickW;
            const by = startY + row * (brickH + 6);
            const brick = this.add.sprite(bx, by, `brick-${row}`);
            this.physics.add.existing(brick, true);
            (brick.body as any).setSize(brickW - 4, brickH);
            (brick.body as any).setOffset(brickPad, brickPad);
            this.bricks.add(brick);
          }
        }

        // Colliders
        this.physics.add.collider(this.ball, this.bricks, (_ball: any, brick: any) => {
          playBeep(587.33, 'sine', 0.06);

          // Spawn particle explosion burst using the brick's row color
          const brickRow = parseInt(brick.texture.key.split('-')[1]);
          const particleColor = COLOR_NUM[brickRow] || 0xffffff;

          const exploder = this.add.particles(0, 0, 'brick-particle', {
            speed: { min: 40, max: 120 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            color: [particleColor],
            blendMode: 'ADD',
            lifespan: 350,
            gravityY: 100,
          });
          exploder.explode(12, brick.x, brick.y);

          // Destroy particle manager shortly after explosion to conserve memory
          this.time.delayedCall(500, () => {
            exploder.destroy();
          });

          brick.destroy();
          this.score += 10;
          this.scoreText.setText(`Score: ${this.score}`);
          if (this.bricks.countActive() === 0) this.winGame();
        });

        this.physics.add.collider(this.ball, this.paddle, () => {
          playBeep(330, 'triangle', 0.08);

          // Angle ball based on hit position
          const diff = this.ball.x - this.paddle.x;
          const norm = diff / (paddleW / 2); // -1 to 1
          const speed = this.currentSpeed;
          const vx = norm * speed * 0.8;
          const vy = -Math.sqrt(speed * speed - vx * vx);
          this.ball.body.setVelocity(vx, vy);
        });

        // HUD Text styling with neon stroke effects
        this.scoreText = this.add.text(12, 12, 'Score: 0', {
          fontFamily: 'monospace', fontSize: '14px', color: '#00d4ff', fontWeight: 'bold'
        }).setStroke('#004466', 3);

        this.livesText = this.add.text(W - 12, 12, `Level: MEDIUM`, {
          fontFamily: 'monospace', fontSize: '14px', color: '#ff6b00', fontWeight: 'bold'
        }).setOrigin(1, 0).setStroke('#441e00', 3);

        this.add.text(W / 2, 12, '⬡ BREAKOUT', {
          fontFamily: 'monospace', fontSize: '14px', color: '#9090b0', fontWeight: 'bold'
        }).setOrigin(0.5, 0);

        this.startText = this.add.text(W / 2, H / 2 + 70, 'Press SPACE to launch', {
          fontFamily: 'monospace', fontSize: '13px', color: '#9090b0'
        }).setOrigin(0.5);

        // Speed Level Selection UI
        this.speedButtons = [];
        const levels: ('slow' | 'medium' | 'fast')[] = ['slow', 'medium', 'fast'];
        const btnW = 100;
        const btnH = 32;
        const startX_btn = W / 2 - 120;
        const btnY = H / 2 + 15;

        this.speedLabel = this.add.text(W / 2, btnY - 35, 'SELECT BALL SPEED', {
          fontFamily: 'monospace', fontSize: '13px', color: '#9090b0', fontWeight: 'bold'
        }).setOrigin(0.5);

        levels.forEach((lvl, idx) => {
          const x = startX_btn + idx * 120;
          
          const btnBg = this.add.rectangle(x, btnY, btnW, btnH, 0x1f1f2e, 0.8)
            .setStrokeStyle(1.5, 0x4f4f6e)
            .setInteractive({ useHandCursor: true });
            
          const txt = this.add.text(x, btnY, lvl.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '14px', color: '#9090b0', fontWeight: 'bold'
          }).setOrigin(0.5);

          btnBg.on('pointerover', () => {
            if (this.selectedLevel !== lvl) {
              btnBg.setStrokeStyle(2, 0x00d4ff);
              txt.setColor('#ffffff');
            }
          });
          btnBg.on('pointerout', () => {
            if (this.selectedLevel !== lvl) {
              btnBg.setStrokeStyle(1.5, 0x4f4f6e);
              txt.setColor('#9090b0');
            }
          });
          btnBg.on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
            if (event && typeof event.stopPropagation === 'function') {
              event.stopPropagation();
            }
            this.setSpeedLevel(lvl);
          });

          this.speedButtons.push({ level: lvl, bg: btnBg, txt });
        });

        // Set initial speed level
        this.setSpeedLevel('medium');

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', () => this.launch());

        // Touch/Pointer tap to launch the ball
        this.input.on('pointerdown', () => {
          if (!this.started && !this.isOver) {
            this.launch();
          }
        });

        // World bounds listener for ball bounce sounds (left, right, top edges)
        this.physics.world.on('worldbounds', (body: any, up: boolean, down: boolean, left: boolean, right: boolean) => {
          if (body.gameObject === this.ball) {
            if (!down) {
              playBeep(240, 'sine', 0.05);
            }
          }
        });
      }

      setSpeedLevel(level: 'slow' | 'medium' | 'fast') {
        this.selectedLevel = level;
        if (level === 'slow') {
          this.currentSpeed = 220;
        } else if (level === 'medium') {
          this.currentSpeed = 320;
        } else {
          this.currentSpeed = 460;
        }
        this.updateSpeedButtons();
        if (this.livesText) {
          this.livesText.setText(`Level: ${level.toUpperCase()}`);
        }
      }

      updateSpeedButtons() {
        if (!this.speedButtons) return;
        this.speedButtons.forEach((btn: any) => {
          if (btn.level === this.selectedLevel) {
            btn.bg.setFillStyle(0x00d4ff, 0.2);
            btn.bg.setStrokeStyle(2.5, 0x00d4ff);
            btn.txt.setColor('#ffffff');
          } else {
            btn.bg.setFillStyle(0x1f1f2e, 0.8);
            btn.bg.setStrokeStyle(1.5, 0x4f4f6e);
            btn.txt.setColor('#9090b0');
          }
        });
      }

      launch() {
        if (this.started || this.isOver) return;
        this.started = true;
        this.startText.setVisible(false);
        
        // Hide speed selection UI
        if (this.speedButtons) {
          this.speedButtons.forEach((btn: any) => {
            btn.bg.setVisible(false);
            btn.txt.setVisible(false);
          });
        }
        if (this.speedLabel) {
          this.speedLabel.setVisible(false);
        }

        // Activate glowing ball trail
        if (this.ballTrail) {
          this.ballTrail.start();
        }

        const scale = this.currentSpeed / 322.49;
        this.ball.body.setVelocity(160 * scale, -280 * scale);
      }

      update(time: number, delta: number) {
        if (this.isOver) return;

        const W = this.scale.width;
        const H = this.scale.height;
        const speed = 400; // Responsive speed for keyboard controls

        // Update animated grid scroll offset
        const gridSpeed = 20; // pixels per second
        this.gridOffset = (this.gridOffset + gridSpeed * (delta / 1000)) % 30;

        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(1, 0x00d4ff, 0.08);

        // Draw vertical grid lines
        for (let x = 0; x < W; x += 30) {
          this.gridGraphics.lineBetween(x, 0, x, H);
        }
        // Draw scrolling horizontal grid lines
        for (let y = this.gridOffset; y < H; y += 30) {
          this.gridGraphics.lineBetween(0, y, W, y);
        }

        // Move paddle with keyboard arrows or touch/pointer drag
        if (this.cursors.left.isDown) {
          this.paddle.x = Math.max(100 / 2, this.paddle.x - speed * (delta / 1000));
        } else if (this.cursors.right.isDown) {
          this.paddle.x = Math.min(W - 100 / 2, this.paddle.x + speed * (delta / 1000));
        } else {
          const pointer = this.input.activePointer;
          if (pointer.isDown) {
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 100 / 2, W - 100 / 2);
          }
        }

        // Sync paddle physics body
        (this.paddle.body as any).reset(this.paddle.x, this.paddle.y);

        // If ball not started, keep it on paddle
        if (!this.started) {
          this.ball.x = this.paddle.x;
        }

        // Ball fell below screen -> Stop the game immediately (Game Over)
        if (this.started && this.ball.y > H + 20) {
          this.endGame();
        }
      }

      winGame() {
        this.isOver = true;
        
        if (this.ballTrail) {
          this.ballTrail.stop();
        }

        // Victory chime arpeggio
        playBeep(261.63, 'triangle', 0.1);
        setTimeout(() => playBeep(329.63, 'triangle', 0.1), 100);
        setTimeout(() => playBeep(392.00, 'triangle', 0.1), 200);
        setTimeout(() => playBeep(523.25, 'triangle', 0.25), 300);

        const W = this.scale.width;
        const H = this.scale.height;
        this.ball.body.setVelocity(0, 0);

        // Glassmorphic panel with neon border
        const boxBg = this.add.rectangle(W / 2, H / 2, 280, 130, 0x080814, 0.9);
        const borderG = this.add.graphics();
        const borderCol = 0x39ff14;
        borderG.lineStyle(4, borderCol, 0.3);
        borderG.strokeRect(W / 2 - 140, H / 2 - 65, 280, 130);
        borderG.lineStyle(2, borderCol, 0.6);
        borderG.strokeRect(W / 2 - 140, H / 2 - 65, 280, 130);
        borderG.lineStyle(1, 0xffffff, 1);
        borderG.strokeRect(W / 2 - 140, H / 2 - 65, 280, 130);

        this.add.text(W / 2, H / 2 - 30, '🏆 YOU WIN!', {
          fontFamily: 'monospace', fontSize: '24px', color: '#39ff14', fontWeight: 'bold'
        }).setOrigin(0.5).setStroke('#005511', 4).setShadow(0, 0, '#39ff14', 6, true, true);

        this.add.text(W / 2, H / 2 + 5, `Final Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '16px', color: '#f0f0ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 32, 'Click to Play Again', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => this.scene.restart());
        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
      }

      endGame() {
        this.isOver = true;

        if (this.ballTrail) {
          this.ballTrail.stop();
        }

        // Sad descending game over chime
        playBeep(180, 'sawtooth', 0.2);
        setTimeout(() => playBeep(120, 'sawtooth', 0.25), 150);
        setTimeout(() => playBeep(90, 'sawtooth', 0.35), 300);

        const W = this.scale.width;
        const H = this.scale.height;
        this.ball.body.setVelocity(0, 0);

        // Shake camera for crunchier impact feel
        this.cameras.main.shake(200, 0.012);

        // Glassmorphic panel with neon border
        const boxBg = this.add.rectangle(W / 2, H / 2, 280, 130, 0x080814, 0.9);
        const borderG = this.add.graphics();
        const borderCol = 0xff0055;
        borderG.lineStyle(4, borderCol, 0.3);
        borderG.strokeRect(W / 2 - 140, H / 2 - 65, 280, 130);
        borderG.lineStyle(2, borderCol, 0.6);
        borderG.strokeRect(W / 2 - 140, H / 2 - 65, 280, 130);
        borderG.lineStyle(1, 0xffffff, 1);
        borderG.strokeRect(W / 2 - 140, H / 2 - 65, 280, 130);

        this.add.text(W / 2, H / 2 - 30, 'GAME OVER', {
          fontFamily: 'monospace', fontSize: '24px', color: '#ff0055', fontWeight: 'bold'
        }).setOrigin(0.5).setStroke('#550011', 4).setShadow(0, 0, '#ff0055', 6, true, true);

        this.add.text(W / 2, H / 2 + 5, `Score: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '16px', color: '#f0f0ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 32, 'Click to Restart', {
          fontFamily: 'monospace', fontSize: '12px', color: '#9090b0'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => this.scene.restart());
        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'breakout', score: this.score }
        }));
      }
    };
  }
}
