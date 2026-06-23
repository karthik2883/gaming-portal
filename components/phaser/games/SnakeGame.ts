// SnakeGame using factory pattern for dynamic Phaser.js loading (client-side only)

export default class SnakeGameFactory {
  static create(PhaserLib: any) {
    const randBetween = (a: number, b: number) =>
      Math.floor(Math.random() * (b - a + 1)) + a;

    return class SnakeScene extends PhaserLib.Scene {
      snake: { x: number; y: number }[] = [];
      food: any;
      direction = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      readonly GRID = 20;
      moveTimer = 0;
      moveDelay = 150;
      score = 0;
      scoreText: any;
      isOver = false;
      cols = 0;
      rows = 0;
      snakeGraphics: any;
      borderGraphics: any;
      
      // Advanced Refinement Fields
      lives = 3;
      livesText: any;
      powerup: any = null;
      powerupType = '';
      activePowerup = '';
      activePowerupTimer = 0;
      invulnerabilityTimer = 0;

      constructor() {
        super({ key: 'SnakeGame' });
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.cols = Math.floor(W / this.GRID);
        this.rows = Math.floor(H / this.GRID);
        this.isOver = false;
        this.score = 0;
        this.lives = 3;
        this.moveDelay = 150;
        this.direction = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.snake = [];
        this.powerup = null;
        this.powerupType = '';
        this.activePowerup = '';
        this.activePowerupTimer = 0;
        this.invulnerabilityTimer = 0;

        // Draw grid lines
        const g = this.add.graphics();
        g.lineStyle(1, 0x151535, 0.5);
        for (let x = 0; x <= this.cols; x++) g.lineBetween(x * this.GRID, 0, x * this.GRID, H);
        for (let y = 0; y <= this.rows; y++) g.lineBetween(0, y * this.GRID, W, y * this.GRID);

        // Draw neon dot matrix at grid intersections for a high-tech retro coordinate map look
        g.fillStyle(0x00d4ff, 0.2);
        for (let x = 1; x < this.cols; x++) {
          for (let y = 1; y < this.rows; y++) {
            if ((x + y) % 2 === 0) {
              g.fillCircle(x * this.GRID, y * this.GRID, 1.5);
            }
          }
        }

        // Draw glowing outer border and corner brackets
        this.borderGraphics = this.add.graphics();
        this.drawBorders(W, H);

        // HUD Setup (placed behind snake / food with alpha)
        this.add.text(W / 2, 22, '🐍 SNAKE NEON', { fontFamily: 'Orbitron, sans-serif', fontSize: '15px', color: '#00d4ff', fontWeight: 'bold' }).setOrigin(0.5, 0).setAlpha(0.65);
        this.livesText = this.add.text(24, 22, 'LIVES: ❤️❤️❤️', { fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#ff0055', fontWeight: 'bold' }).setAlpha(0.8);
        this.scoreText = this.add.text(W - 24, 22, 'Score: 0', { fontFamily: 'Orbitron, sans-serif', fontSize: '12px', color: '#9090b0', fontWeight: 'bold' }).setOrigin(1, 0).setAlpha(0.8);

        // Graphics renderer for the snake
        this.snakeGraphics = this.add.graphics();

        // Init snake at center
        const sx = Math.floor(this.cols / 2);
        const sy = Math.floor(this.rows / 2);
        for (let i = 0; i < 3; i++) this.addSeg((sx - i) * this.GRID, sy * this.GRID);

        this.spawnFood();
        this.drawSnake();

        this.input.keyboard.on('keydown', (e: any) => {
          switch (e.code) {
            case 'ArrowUp': case 'KeyW': if (this.direction.y !== 1) this.nextDir = { x: 0, y: -1 }; break;
            case 'ArrowDown': case 'KeyS': if (this.direction.y !== -1) this.nextDir = { x: 0, y: 1 }; break;
            case 'ArrowLeft': case 'KeyA': if (this.direction.x !== 1) this.nextDir = { x: -1, y: 0 }; break;
            case 'ArrowRight': case 'KeyD': if (this.direction.x !== -1) this.nextDir = { x: 1, y: 0 }; break;
            case 'Space': if (this.isOver) this.scene.restart(); break;
          }
        });
      }

      addSeg(x: number, y: number) {
        this.snake.push({ x: x + this.GRID / 2, y: y + this.GRID / 2 });
      }

      drawBorders(W: number, H: number) {
        this.borderGraphics.clear();
        const G = this.GRID / 2;
        const L = 16; // Length of corner brackets
        const borderColor = 0x00d4ff; // Neon cyan
        const accentColor = 0xff00aa; // Neon pink for corner brackets

        // 1. Draw outer boundary box (thin neon line)
        this.borderGraphics.lineStyle(1.5, borderColor, 0.65);
        this.borderGraphics.strokeRect(G, G, W - this.GRID, H - this.GRID);

        // 2. Draw outer boundary thick glow line
        this.borderGraphics.lineStyle(4, borderColor, 0.2);
        this.borderGraphics.strokeRect(G, G, W - this.GRID, H - this.GRID);

        // 3. Draw premium corner brackets (thicker neon pink lines)
        this.borderGraphics.lineStyle(3, accentColor, 0.95);

        // Top-Left corner bracket
        this.borderGraphics.lineBetween(G, G, G + L, G);
        this.borderGraphics.lineBetween(G, G, G, G + L);

        // Top-Right corner bracket
        this.borderGraphics.lineBetween(W - G, G, W - G - L, G);
        this.borderGraphics.lineBetween(W - G, G, W - G, G + L);

        // Bottom-Left corner bracket
        this.borderGraphics.lineBetween(G, H - G, G + L, H - G);
        this.borderGraphics.lineBetween(G, H - G, G, H - G - L);

        // Bottom-Right corner bracket
        this.borderGraphics.lineBetween(W - G, H - G, W - G - L, H - G);
        this.borderGraphics.lineBetween(W - G, H - G, W - G, H - G - L);
      }

      spawnFood() {
        let fx: number, fy: number;
        const margin = 2;
        do {
          fx = randBetween(margin, this.cols - margin - 1) * this.GRID;
          fy = randBetween(margin, this.rows - margin - 1) * this.GRID;
        } while (
          this.snake.some(s => Math.abs(s.x - (fx + this.GRID / 2)) < 2 && Math.abs(s.y - (fy + this.GRID / 2)) < 2) ||
          (this.powerup && Math.abs(fx - this.powerup.x) < 2 && Math.abs(fy - this.powerup.y) < 2)
        );

        if (this.food) this.food.destroy();
        this.food = this.add.rectangle(fx + this.GRID / 2, fy + this.GRID / 2, this.GRID - 4, this.GRID - 4, 0x39ff14);
        this.tweens.add({ targets: this.food, scaleX: 0.7, scaleY: 0.7, duration: 400, yoyo: true, repeat: -1 });
      }

      spawnPowerup() {
        let px: number, py: number;
        const margin = 2;
        do {
          px = randBetween(margin, this.cols - margin - 1) * this.GRID;
          py = randBetween(margin, this.rows - margin - 1) * this.GRID;
        } while (
          this.snake.some(s => Math.abs(s.x - (px + this.GRID / 2)) < 2 && Math.abs(s.y - (py + this.GRID / 2)) < 2) ||
          (Math.abs(px - this.food.x) < 2 && Math.abs(py - this.food.y) < 2)
        );

        if (this.powerup) this.powerup.destroy();

        const types = ['shield', 'slow', 'speed'];
        this.powerupType = types[Math.floor(Math.random() * types.length)];

        let color = 0x0080ff; // shield: Blue
        if (this.powerupType === 'slow') color = 0x39ff14; // slow: Green
        else if (this.powerupType === 'speed') color = 0xffd700; // speed: Yellow Gold

        this.powerup = this.add.circle(px + this.GRID / 2, py + this.GRID / 2, this.GRID / 2 - 2, color);
        this.tweens.add({
          targets: this.powerup,
          scaleX: 0.7,
          scaleY: 0.7,
          duration: 450,
          yoyo: true,
          repeat: -1
        });
      }

      activatePowerup(type: string) {
        this.activePowerup = type;
        
        let color = '#0080ff';
        if (type === 'slow') color = '#39ff14';
        else if (type === 'speed') color = '#ffd700';

        this.showFloatingText(`+${type.toUpperCase()}!`, this.snake[0].x, this.snake[0].y - 25, color, 14);

        if (type === 'shield') {
          this.activePowerupTimer = 999999; // Stays active until consumed
        } else {
          this.activePowerupTimer = 10000; // 10s duration for slow/speed
        }
      }

      resetSnakePosition() {
        const W = this.scale.width;
        const H = this.scale.height;
        const sx = Math.floor(this.cols / 2);
        const sy = Math.floor(this.rows / 2);
        const currentLength = Math.max(3, Math.floor(this.snake.length * 0.7));

        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };

        for (let i = 0; i < currentLength; i++) {
          this.snake.push({
            x: (sx - i) * this.GRID + this.GRID / 2,
            y: sy * this.GRID + this.GRID / 2
          });
        }
      }

      updateLivesText() {
        if (this.livesText) {
          const hearts = '❤️'.repeat(this.lives);
          this.livesText.setText(`LIVES: ${hearts || '☠️'}`);
        }
      }

      showFloatingText(msg: string, x: number, y: number, colorHex: string, size = 12) {
        const txt = this.add.text(x, y, msg, {
          fontFamily: 'Orbitron, sans-serif', fontSize: `${size}px`, color: colorHex, fontWeight: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
          targets: txt,
          y: y - 40,
          alpha: 0,
          duration: 1000,
          onComplete: () => txt.destroy()
        });
      }

      drawSnake() {
        this.snakeGraphics.clear();
        if (this.snake.length === 0) return;

        const head = this.snake[0];
        const isDead = this.isOver;

        // Color definitions
        let bodyColor = 0x0080ff; // Default cyan blue
        let headColor = 0x00d4ff;

        if (isDead) {
          bodyColor = 0xff0055;
          headColor = 0xff00ff;
        } else {
          if (this.activePowerup === 'speed') {
            bodyColor = 0xffd700; // Yellow Gold
            headColor = 0xffea00;
          } else if (this.activePowerup === 'slow') {
            bodyColor = 0x39ff14; // Acid Green
            headColor = 0x66ff66;
          } else if (this.activePowerup === 'shield') {
            headColor = 0x0080ff; // Blue shield core
          }
        }

        // Flashing transparency during invulnerability
        const alpha = (this.invulnerabilityTimer > 0 && Math.floor(this.time.now / 150) % 2 === 0) ? 0.35 : 1.0;

        // 1. Draw body trail (continuous line)
        if (this.snake.length > 1) {
          this.snakeGraphics.lineStyle(this.GRID - 2, bodyColor, alpha);
          this.snakeGraphics.beginPath();
          this.snakeGraphics.moveTo(head.x, head.y);
          for (let i = 1; i < this.snake.length; i++) {
            this.snakeGraphics.lineTo(this.snake[i].x, this.snake[i].y);
          }
          this.snakeGraphics.strokePath();
        }

        // 2. Draw circular joint junctions to round off bends perfectly
        this.snakeGraphics.fillStyle(bodyColor, alpha);
        for (let i = 1; i < this.snake.length; i++) {
          this.snakeGraphics.fillCircle(this.snake[i].x, this.snake[i].y, (this.GRID - 2) / 2);
        }

        // 3. Draw rounded head circle
        this.snakeGraphics.fillStyle(headColor, alpha);
        this.snakeGraphics.fillCircle(head.x, head.y, this.GRID / 2);

        // 3b. Draw blue shield circle outline if shield is active
        if (this.activePowerup === 'shield' && !isDead) {
          this.snakeGraphics.lineStyle(2, 0x00d4ff, 0.85);
          this.snakeGraphics.strokeCircle(head.x, head.y, this.GRID / 2 + 3);
        }

        // 4. Draw dynamic eyes
        if (!isDead) {
          // Normal alive eyes looking in steering direction
          this.snakeGraphics.fillStyle(0xffffff, alpha);
          const eyeOffset = 3.5;
          const eyeRadius = 2.5;
          const pupilRadius = 1;

          let leftEyeX = head.x;
          let leftEyeY = head.y;
          let rightEyeX = head.x;
          let rightEyeY = head.y;

          if (this.direction.x === 1) { // Right
            leftEyeX += eyeOffset; leftEyeY -= eyeOffset;
            rightEyeX += eyeOffset; rightEyeY += eyeOffset;
          } else if (this.direction.x === -1) { // Left
            leftEyeX -= eyeOffset; leftEyeY += eyeOffset;
            rightEyeX -= eyeOffset; rightEyeY -= eyeOffset;
          } else if (this.direction.y === 1) { // Down
            leftEyeX += eyeOffset; leftEyeY += eyeOffset;
            rightEyeX -= eyeOffset; rightEyeY += eyeOffset;
          } else if (this.direction.y === -1) { // Up
            leftEyeX -= eyeOffset; leftEyeY -= eyeOffset;
            rightEyeX += eyeOffset; rightEyeY -= eyeOffset;
          }

          // Draw white sclera
          this.snakeGraphics.fillCircle(leftEyeX, leftEyeY, eyeRadius);
          this.snakeGraphics.fillCircle(rightEyeX, rightEyeY, eyeRadius);

          // Draw black pupils
          this.snakeGraphics.fillStyle(0x000000, alpha);
          this.snakeGraphics.fillCircle(leftEyeX, leftEyeY, pupilRadius);
          this.snakeGraphics.fillCircle(rightEyeX, rightEyeY, pupilRadius);
        } else {
          // Dead eyes (drawn as white crosses 'X')
          this.snakeGraphics.lineStyle(2, 0xffffff, 1);
          const size = 3;

          // Eye 1 offset
          const eye1X = head.x - (this.direction.y !== 0 ? 4 : 2);
          const eye1Y = head.y - (this.direction.x !== 0 ? 4 : 2);
          this.snakeGraphics.lineBetween(eye1X - size, eye1Y - size, eye1X + size, eye1Y + size);
          this.snakeGraphics.lineBetween(eye1X - size, eye1Y + size, eye1X + size, eye1Y - size);

          // Eye 2 offset
          const eye2X = head.x + (this.direction.y !== 0 ? 4 : 2);
          const eye2Y = head.y + (this.direction.x !== 0 ? 4 : 2);
          this.snakeGraphics.lineBetween(eye2X - size, eye2Y - size, eye2X + size, eye2Y + size);
          this.snakeGraphics.lineBetween(eye2X - size, eye2Y + size, eye2X + size, eye2Y - size);
        }
      }

      update(time: number, delta: number) {
        // Pulsate border graphics alpha to simulate a retro breathing neon glow
        if (this.borderGraphics) {
          this.borderGraphics.alpha = 0.65 + 0.3 * Math.sin(time / 250);
        }

        if (this.isOver) return;

        // Update active timers
        if (this.activePowerupTimer > 0) {
          this.activePowerupTimer -= delta;
          if (this.activePowerupTimer <= 0) {
            this.activePowerup = '';
            this.showFloatingText('POWERUP EXPIRED', this.snake[0].x, this.snake[0].y - 25, '#5a5a7a');
          }
        }
        if (this.invulnerabilityTimer > 0) {
          this.invulnerabilityTimer -= delta;
        }

        this.moveTimer += delta;

        // Determine current move delay based on active powerups
        let currentDelay = this.moveDelay;
        if (this.activePowerup === 'slow') {
          currentDelay = this.moveDelay * 1.5;
        } else if (this.activePowerup === 'speed') {
          currentDelay = this.moveDelay * 0.65;
        }

        if (this.moveTimer < currentDelay) return;
        this.moveTimer = 0;
        this.direction = { ...this.nextDir };

        const head = this.snake[0];
        let nx = head.x + this.direction.x * this.GRID;
        let ny = head.y + this.direction.y * this.GRID;
        const W = this.scale.width;
        const H = this.scale.height;

        // Collision validations
        let isWallHit = (nx < this.GRID / 2 || nx > W - this.GRID / 2 || ny < this.GRID / 2 || ny > H - this.GRID / 2);
        let isSelfHit = this.snake.some(s => Math.abs(s.x - nx) < 2 && Math.abs(s.y - ny) < 2);

        if (isWallHit || isSelfHit) {
          if (this.invulnerabilityTimer > 0) {
            // Wrap around on wall hit, ignore self-hit during invulnerability
            if (isWallHit) {
              if (nx < this.GRID / 2) nx = W - this.GRID / 2;
              else if (nx > W - this.GRID / 2) nx = this.GRID / 2;

              if (ny < this.GRID / 2) ny = H - this.GRID / 2;
              else if (ny > H - this.GRID / 2) ny = this.GRID / 2;
            }
            isWallHit = false;
            isSelfHit = false;
          } else if (this.activePowerup === 'shield') {
            // Shield absorbs the hit
            this.activePowerup = '';
            this.activePowerupTimer = 0;
            this.invulnerabilityTimer = 1500; // 1.5s invulnerability grace
            this.cameras.main.flash(200, 0, 128, 255, false);
            this.showFloatingText('SHIELD SHATTERED!', this.snake[0].x, this.snake[0].y - 25, '#00d4ff');
            
            // Wrap or glide immediately so we don't freeze or die in this tick
            if (isWallHit) {
              if (nx < this.GRID / 2) nx = W - this.GRID / 2;
              else if (nx > W - this.GRID / 2) nx = this.GRID / 2;

              if (ny < this.GRID / 2) ny = H - this.GRID / 2;
              else if (ny > H - this.GRID / 2) ny = this.GRID / 2;
            }
            isWallHit = false;
            isSelfHit = false;
          } else {
            // Deduct life
            this.lives--;
            this.updateLivesText();

            if (this.lives > 0) {
              this.cameras.main.flash(250, 255, 0, 85, false);
              this.cameras.main.shake(150, 0.008);
              this.showFloatingText('-1 LIFE', this.snake[0].x, this.snake[0].y - 25, '#ff0055');
              this.invulnerabilityTimer = 2000; // 2s invulnerability grace
              this.resetSnakePosition();
              return;
            } else {
              return this.endGame();
            }
          }
        }

        // Eat Power-up check
        const atePowerup = this.powerup && Math.abs(nx - this.powerup.x) < 2 && Math.abs(ny - this.powerup.y) < 2;
        if (atePowerup) {
          this.activatePowerup(this.powerupType);
          this.powerup.destroy();
          this.powerup = null;
        }

        // Eat Food check
        const ateFood = Math.abs(nx - this.food.x) < 2 && Math.abs(ny - this.food.y) < 2;
        if (!ateFood) {
          if (!atePowerup) {
            this.snake.pop(); // Remove tail
          }
        } else {
          // Double score points during speed boost
          const pointsEarned = this.activePowerup === 'speed' ? 20 : 10;
          this.score += pointsEarned;
          this.scoreText.setText(`Score: ${this.score}`);
          this.showFloatingText(`+${pointsEarned}`, nx, ny - 20, this.activePowerup === 'speed' ? '#ffd700' : '#39ff14');
          this.spawnFood();
          this.moveDelay = Math.max(80, this.moveDelay - 2);

          // 35% chance to spawn a power-up if none is currently active or spawned
          if (Math.random() < 0.35 && !this.powerup && !this.activePowerup) {
            this.spawnPowerup();
          }
        }

        this.snake.unshift({ x: nx, y: ny }); // Add new head
        this.drawSnake();
      }

      endGame() {
        this.isOver = true;
        const W = this.scale.width;
        const H = this.scale.height;
        
        if (this.powerup) {
          this.powerup.destroy();
          this.powerup = null;
        }

        this.cameras.main.flash(300, 255, 0, 85, false);
        this.cameras.main.shake(200, 0.01);
        this.drawSnake(); // Redraw dead state with crosses and red coloring

        this.add.rectangle(W / 2, H / 2, 260, 120, 0x08080f, 0.92).setStrokeStyle(1.5, 0xff0055);
        this.add.text(W / 2, H / 2 - 25, 'GAME OVER', { fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#ff0055', fontWeight: 'bold' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 8, `Score: ${this.score}`, { fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: '#f0f0ff' }).setOrigin(0.5);
        this.add.text(W / 2, H / 2 + 30, 'Press SPACE to restart', { fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: '#9090b0' }).setOrigin(0.5);

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'snake', score: this.score }
        }));
      }
    };
  }
}
