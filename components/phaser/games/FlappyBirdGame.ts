// FlappyBirdGame (Flappy Cyber) using factory pattern for dynamic Phaser.js loading (client-side only)

export default class FlappyBirdGameFactory {
  static create(PhaserLib: any) {
    
    // Procedural sound synthesis engine using Web Audio API
    class CyberSynth {
      ctx: AudioContext | null = null;

      init() {
        if (this.ctx) return;
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        if (AudioContextClass) {
          try {
            this.ctx = new AudioContextClass();
          } catch (e) {
            console.error('Failed to init AudioContext:', e);
          }
        }
      }

      playFlap() {
        this.init();
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(160, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.12);
        } catch (e) {}
      }

      playScore() {
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const playTone = (freq: number, start: number, duration: number) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(start);
            osc.stop(start + duration);
          };
          playTone(587.33, now, 0.08); // D5
          playTone(880.00, now + 0.06, 0.12); // A5
        } catch (e) {}
      }

      playPowerup() {
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const playTone = (freq: number, start: number, duration: number) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(start);
            osc.stop(start + duration);
          };
          playTone(392.00, now, 0.06); // G4
          playTone(523.25, now + 0.06, 0.06); // C5
          playTone(659.25, now + 0.12, 0.06); // E5
          playTone(783.99, now + 0.18, 0.15); // G5
        } catch (e) {}
      }

      playLevelUp() {
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const playTone = (freq: number, start: number, duration: number) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.08, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(start);
            osc.stop(start + duration);
          };
          playTone(523.25, now, 0.1); // C5
          playTone(659.25, now + 0.1, 0.1); // E5
          playTone(783.99, now + 0.2, 0.1); // G5
          playTone(1046.50, now + 0.3, 0.25); // C6
        } catch (e) {}
      }

      playCrash() {
        this.init();
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.45);
          gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.45);
        } catch (e) {}
      }

      playShieldBreak() {
        this.init();
        if (!this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(400, this.ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.25);
        } catch (e) {}
      }
    }

    return class FlappyBirdScene extends PhaserLib.Scene {
      bird: any;
      pipes: any;
      powerups: any;
      particles: any;
      emitter: any;
      
      // Gameplay Stats
      score = 0;
      highScore = 0;
      level = 1;
      isOver = false;
      hasStarted = false;
      
      // HUD Texts
      scoreText: any;
      levelText: any;
      highScoreText: any;
      startPromptText: any;
      
      // Game variables
      pipeSpeed = 180;
      gapHeight = 160;
      spawnTimerEvent: any = null;
      
      // Parallax backgrounds
      gridBg: any;
      cityBg: any;
      stars: any;
      floorBg: any;
      floorOffset = 0;
      
      // Powerups statuses
      powerupsActive = {
        shield: { active: false, time: 0, text: 'SHIELD', color: 0x0080ff, bar: null as any, label: null as any },
        shrink: { active: false, time: 0, text: 'SHRINK', color: 0xbd00ff, bar: null as any, label: null as any },
        slowMo: { active: false, time: 0, text: 'SLOW-MO', color: 0x39ff14, bar: null as any, label: null as any },
        boost:  { active: false, time: 0, text: 'BOOST',  color: 0xffd700, bar: null as any, label: null as any }
      };

      // Cyber Synth Audio
      synth = new CyberSynth();
      
      // Theme colors per level
      themeColors = [
        0x00d4ff, // L1: Cyan
        0xbd00ff, // L2: Purple
        0x39ff14, // L3: Acid Green
        0xff0055, // L4: Hot Pink
        0xffd700  // L5+: Neon Gold
      ];

      constructor() {
        super({ key: 'FlappyBirdGame' });
      }

      preload() {
        // Create procedurally generated textures
        this.createBirdTexture();
        this.createPowerupTextures();
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;
        
        this.isOver = false;
        this.hasStarted = false;
        this.score = 0;
        this.level = 1;
        this.pipeSpeed = 180;
        this.gapHeight = 160;

        // Reset powerups
        Object.keys(this.powerupsActive).forEach(key => {
          const p = this.powerupsActive[key as keyof typeof this.powerupsActive];
          p.active = false;
          p.time = 0;
          if (p.bar) { p.bar.destroy(); p.bar = null; }
          if (p.label) { p.label.destroy(); p.label = null; }
        });

        // Starry sky gradient
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x050510, 0x050510, 0x180f2d, 0x180f2d, 1);
        sky.fillRect(0, 0, W, H);
        sky.setScrollFactor(0);

        // Draw static stars
        this.stars = this.add.graphics();
        this.stars.setScrollFactor(0);
        for (let i = 0; i < 40; i++) {
          const sx = Phaser.Math.Between(0, W);
          const sy = Phaser.Math.Between(0, H - 150);
          const r = Phaser.Math.FloatBetween(0.5, 2.0);
          const alpha = Phaser.Math.FloatBetween(0.3, 0.95);
          this.stars.fillStyle(0xffffff, alpha);
          this.stars.fillCircle(sx, sy, r);
        }

        // 1. Far background: City Outline
        this.cityBg = this.add.graphics();
        this.drawCityBackground();
        
        // 2. Parallax background: Grid
        this.gridBg = this.add.grid(W / 2, H / 2, W * 2, H, 40, 40, 0, 0, 0x111133, 0.2);

        // 3. Groups (use standard groups to avoid physics-group side-effects on Graphics objects)
        this.pipes = this.add.group();
        this.powerups = this.add.group();

        // Floor graphics setup (added after groups to render on top of scrolling pipes)
        this.floorBg = this.add.graphics();
        this.floorOffset = 0;
        this.drawFloor();

        // 4. Create particles trail
        this.particles = this.add.particles(0, 0, 'bird_spark', {
          speed: { min: 20, max: 100 },
          angle: { min: 140, max: 220 },
          scale: { start: 0.8, end: 0 },
          blendMode: 'ADD',
          lifespan: 600,
          frequency: 35
        });
        
        // 5. Create Bird
        this.bird = this.physics.add.sprite(100, H / 2, 'cyber_bird');
        this.bird.setCircle(14);
        this.bird.setCollideWorldBounds(false); // We handle custom bounds logic below
        this.bird.body.allowGravity = false; // Wait until player presses key
        
        // Emitter follow bird
        this.emitter = this.particles.startFollow(this.bird, -10, 0);

        // 6. Physics Colliders
        this.physics.add.overlap(this.bird, this.pipes, this.hitPipe, undefined, this);
        this.physics.add.overlap(this.bird, this.powerups, this.collectPowerup, undefined, this);

        // 7. HUD Setup
        this.scoreText = this.add.text(W / 2, 85, '0', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '48px', color: '#ffffff', fontWeight: '800'
        }).setOrigin(0.5).setAlpha(0.85);

        this.levelText = this.add.text(16, 16, 'LVL: 1', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: '#00d4ff', fontWeight: 'bold'
        });

        const savedHigh = localStorage.getItem('flappy_high') || '0';
        this.highScore = parseInt(savedHigh);
        this.highScoreText = this.add.text(W - 16, 16, `HIGH: ${this.highScore}`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: '#5a5a7a', fontWeight: 'bold'
        }).setOrigin(1, 0);

        this.startPromptText = this.add.text(W / 2, H / 2 + 50, 'PRESS SPACE TO START', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '16px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({
          targets: this.startPromptText,
          alpha: 0.3,
          duration: 600,
          yoyo: true,
          repeat: -1
        });

        // Glowing Game Title Logo
        const logo = this.add.text(W / 2, H / 2 - 50, 'FLAPPY CYBER', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '32px', color: '#ffffff', fontWeight: '900',
          stroke: '#00d4ff', strokeThickness: 2
        }).setOrigin(0.5);
        
        // Clean logo on game start
        this.tweens.add({
          targets: logo,
          y: H / 2 - 60,
          yoyo: true,
          duration: 1000,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        this.startPromptText.setData('logo', logo);

        // Input Handlers
        this.input.keyboard.on('keydown', (e: any) => {
          if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            this.handleFlap();
          }
        });
        this.input.on('pointerdown', () => {
          this.handleFlap();
        });
      }

      handleFlap() {
        if (this.isOver) return;

        if (!this.hasStarted) {
          this.hasStarted = true;
          this.bird.body.allowGravity = true;
          this.physics.world.gravity.y = 1000;
          
          // Cleanup Title elements
          this.tweens.killTweensOf(this.startPromptText);
          const logo = this.startPromptText.getData('logo');
          if (logo) logo.destroy();
          this.startPromptText.destroy();
          
          // Start Spawning Pipes immediately
          this.spawnPipeColumn();
          this.startPipeSpawning();
        }

        // Apply jump velocity (disabled during Auto-Boost)
        if (!this.powerupsActive.boost.active) {
          this.bird.setVelocityY(-340);
          this.synth.playFlap();
        }
      }

      update(time: number, delta: number) {
        if (this.isOver) return;

        const W = this.scale.width;
        const H = this.scale.height;

        if (this.hasStarted) {
          // Scroll Backgrounds
          const currentSpeed = this.powerupsActive.slowMo.active ? this.pipeSpeed * 0.5 : this.pipeSpeed;
          const speedFactor = currentSpeed / 60; // normalized speed scroll
          
          this.gridBg.x -= speedFactor * (delta / 16);
          if (this.gridBg.x < 0) this.gridBg.x = W / 2;
          
          // Scroll city outline very slowly
          this.cityBg.x -= (speedFactor * 0.1) * (delta / 16);
          if (this.cityBg.x < -W) this.cityBg.x = 0;

          // Scroll slanted floor offset using a normalized 3D spacing interval (seamless projection)
          const d = 1.0;
          this.floorOffset += (speedFactor * (delta / 16)) * 0.02;
          if (this.floorOffset >= d) {
            this.floorOffset -= d;
          }
          this.drawFloor();

          // Adjust bird rotation based on velocity
          if (!this.powerupsActive.boost.active) {
            this.bird.rotation = Phaser.Math.Clamp(this.bird.body.velocity.y * 0.0018, -0.4, 0.8);
          } else {
            // Level out flight during Auto-Boost
            this.bird.rotation = 0;
          }

          // Capping ceiling bounds
          if (this.bird.y < 25) {
            this.bird.y = 25;
            this.bird.setVelocityY(0);
          }

          // Ground collision check
          if (this.bird.y > H - 60 - 14) {
            this.triggerGameOver();
          }

          // Update active powerups timer bars
          this.updatePowerupTimers(delta);

          // Auto-boost tracking (auto-steers bird toward next pipe center)
          if (this.powerupsActive.boost.active) {
            this.steerAutoBoost();
          }

          // Handle moving pipes dynamically (Level 4+)
          if (this.level >= 4) {
            this.pipes.children.iterate((pipe: any) => {
              if (pipe && pipe.active) {
                // Apply a vertical float wave
                const spawnTime = pipe.getData('spawnTime') || 0;
                const amplitude = pipe.getData('amplitude') || 40;
                const frequency = pipe.getData('frequency') || 0.003;
                const baseVal = pipe.getData('baseY') || pipe.y;
                
                pipe.y = baseVal + Math.sin((time - spawnTime) * frequency) * amplitude;
              }
            });
          }

          // Clean offscreen pipes & count points
          this.pipes.children.iterate((pipe: any) => {
            if (pipe && pipe.active) {
              if (pipe.x < -100) {
                pipe.destroy();
              } else if (!pipe.getData('passed') && pipe.x < this.bird.x) {
                // Pass point logic: we only count when the Top pipe of the column is passed
                if (pipe.getData('isTop')) {
                  pipe.setData('passed', true);
                  this.earnPoint();
                }
              }
            }
          });

          // Clean offscreen powerups & smoothly update active powerups' vertical velocities (physics-based)
          this.powerups.children.iterate((pw: any) => {
            if (pw && pw.active) {
              if (pw.x < -50) {
                pw.destroy();
              } else {
                const spawnTime = pw.getData('spawnTime') || 0;
                const isMoving = this.level >= 4;
                
                // Base float velocity from moving pipes (Level 4+)
                let floatVelocity = 0;
                if (isMoving) {
                  const amp = pw.getData('amplitude') || 40;
                  const freq = pw.getData('frequency') || 0.0025;
                  floatVelocity = amp * freq * 1000 * Math.cos((time - spawnTime) * freq);
                }
                
                // Hover oscillation velocity
                const hoverAmp = 10;
                const hoverFreq = 0.004;
                const hoverVelocity = hoverAmp * hoverFreq * 1000 * Math.cos((time - spawnTime) * hoverFreq);
                
                // Apply combined velocity directly to physics body to prevent jitter
                pw.setVelocityY(floatVelocity + hoverVelocity);
              }
            }
          });
        }
      }

      // =============================================
      // PIPE HANDLING
      // =============================================
      startPipeSpawning() {
        this.recalculatePipeSpawnTimer();
      }

      recalculatePipeSpawnTimer() {
        if (this.spawnTimerEvent) {
          this.spawnTimerEvent.destroy();
        }

        // We want a constant horizontal distance between pipe gaps: around 260px.
        // Formula: spawnInterval = (distance / speed) * 1000
        const currentSpeed = this.powerupsActive.slowMo.active ? this.pipeSpeed * 0.5 : this.pipeSpeed;
        const interval = (280 / currentSpeed) * 1000;

        this.spawnTimerEvent = this.time.addEvent({
          delay: interval,
          callback: this.spawnPipeColumn,
          callbackScope: this,
          loop: true
        });
      }

      spawnPipeColumn() {
        if (this.isOver) return;

        const W = this.scale.width;
        const H = this.scale.height;
        
        // Define gap ranges safely (leave margins at top/bottom)
        const minY = 170;
        const maxY = 430;
        const gapCenter = Phaser.Math.Between(minY, maxY);
               const activeColor = this.getThemeColor();
        const isBoost = this.powerupsActive.boost.active;
        const isSlow = this.powerupsActive.slowMo.active;
        const scrollSpeed = isBoost ? this.pipeSpeed * 2 : (isSlow ? this.pipeSpeed * 0.5 : this.pipeSpeed);

        const pipeWidth = 60;
        const halfGap = this.gapHeight / 2;

        // Pipe visual components
        const topPipeHeight = gapCenter - halfGap;
        const bottomPipeHeight = H - (gapCenter + halfGap);
        const pipeX = W + 20;

        // 1. Spawning Top Pipe (Graphics object)
        const topPipe = this.add.graphics();
        topPipe.setPosition(pipeX, 0);
        this.drawPipeGraphics(topPipe, pipeWidth, topPipeHeight, activeColor, true);
        this.physics.add.existing(topPipe);
        
        // Physics configurations
        topPipe.body.allowGravity = false;
        topPipe.body.setSize(pipeWidth, topPipeHeight);
        topPipe.body.setOffset(0, 0);
        topPipe.body.setVelocityX(-scrollSpeed);
        
        topPipe.setData('isTop', true);
        topPipe.setData('passed', false);
        topPipe.setData('height', topPipeHeight);
        topPipe.setData('baseY', 0);
        topPipe.setData('spawnTime', this.time.now);
        topPipe.setData('amplitude', Phaser.Math.Between(25, 45));
        topPipe.setData('frequency', 0.0025);
        this.pipes.add(topPipe);

        // 2. Spawning Bottom Pipe (Graphics object)
        const bottomPipe = this.add.graphics();
        bottomPipe.setPosition(pipeX, gapCenter + halfGap);
        this.drawPipeGraphics(bottomPipe, pipeWidth, bottomPipeHeight, activeColor, false);
        this.physics.add.existing(bottomPipe);
        
        // Physics configurations
        bottomPipe.body.allowGravity = false;
        bottomPipe.body.setSize(pipeWidth, bottomPipeHeight);
        bottomPipe.body.setOffset(0, 0);
        bottomPipe.body.setVelocityX(-scrollSpeed);
        
        bottomPipe.setData('isTop', false);
        bottomPipe.setData('height', bottomPipeHeight);
        bottomPipe.setData('baseY', gapCenter + halfGap);
        bottomPipe.setData('spawnTime', this.time.now);
        bottomPipe.setData('amplitude', topPipe.getData('amplitude')); // sync floating movement
        bottomPipe.setData('frequency', topPipe.getData('frequency'));
        this.pipes.add(bottomPipe);

        // 3. Spawning Power-up (25% chance)
        if (Phaser.Math.Between(1, 100) <= 25) {
          const powerTypes = ['shield', 'shrink', 'slowMo', 'boost'];
          const randType = powerTypes[Phaser.Math.Between(0, 100) <= 12 ? 3 : Phaser.Math.Between(0, 2)];
          
          const pwItem = this.physics.add.sprite(pipeX + pipeWidth / 2, gapCenter, `pw_${randType}`);
          pwItem.setData('type', randType);
          pwItem.setVelocityX(-scrollSpeed);
          
          // Store properties for smooth physics-based vertical updates in update()
          pwItem.setData('spawnTime', this.time.now);
          pwItem.setData('amplitude', topPipe.getData('amplitude'));
          pwItem.setData('frequency', topPipe.getData('frequency'));

          this.powerups.add(pwItem);
        }
      }

      drawPipeGraphics(g: any, w: number, h: number, borderHex: number, isTop: boolean) {
        g.clear();
        
        // 1. Draw the main pipe body (shaft)
        const shaftW = w - 8;
        const shaftX = 4;
        const capH = 24;
        
        let shaftY = 0;
        let shaftH = h;
        let capY = 0;
        
        if (isTop) {
          shaftH = h - capH;
          capY = h - capH;
        } else {
          shaftY = capH;
          shaftH = h - capH;
          capY = 0;
        }
        
        // Base fill for shaft: dark tech blue-grey
        g.fillStyle(0x0b0b1f, 0.95);
        g.fillRect(shaftX, shaftY, shaftW, shaftH);
        
        // Vertical shading & highlights
        g.fillStyle(0x03030d, 0.5);
        g.fillRect(shaftX, shaftY, shaftW * 0.2, shaftH); // Left shadow
        g.fillRect(shaftX + shaftW * 0.8, shaftY, shaftW * 0.2, shaftH); // Right shadow
        
        g.fillStyle(borderHex, 0.15);
        g.fillRect(shaftX + shaftW * 0.4, shaftY, shaftW * 0.2, shaftH); // Center glow
        
        g.fillStyle(0xffffff, 0.25);
        g.fillRect(shaftX + shaftW * 0.48, shaftY, shaftW * 0.04, shaftH); // Center specular line
        
        // Shaft neon borders
        g.lineStyle(1.5, borderHex, 0.8);
        g.lineBetween(shaftX, shaftY, shaftX, shaftY + shaftH);
        g.lineBetween(shaftX + shaftW, shaftY, shaftX + shaftW, shaftY + shaftH);
        
        // 2. Draw the cap (lip)
        g.fillStyle(0x0e0e2d, 0.98);
        g.fillRect(0, capY, w, capH);
        
        // Cap shading & highlight
        g.fillStyle(0x050515, 0.6);
        g.fillRect(0, capY, w * 0.15, capH);
        g.fillRect(w * 0.85, capY, w * 0.15, capH);
        
        g.fillStyle(borderHex, 0.25);
        g.fillRect(w * 0.35, capY, w * 0.3, capH);
        
        g.fillStyle(0xffffff, 0.45);
        g.fillRect(w * 0.47, capY, w * 0.06, capH);
        
        // Cap border box
        g.lineStyle(2, borderHex, 1);
        g.strokeRect(0, capY, w, capH);
        
        // Tech grill lines on the cap
        g.lineStyle(1, borderHex, 0.5);
        g.lineBetween(3, capY + capH * 0.3, w - 3, capY + capH * 0.3);
        g.lineBetween(3, capY + capH * 0.7, w - 3, capY + capH * 0.7);
        
        // Connection line
        g.lineStyle(2, borderHex, 0.6);
        if (isTop) {
          g.lineBetween(shaftX, capY, shaftX + shaftW, capY);
        } else {
          g.lineBetween(shaftX, capY + capH, shaftX + shaftW, capY + capH);
        }
      }

      // =============================================
      // SCORING & PROGRESSION
      // =============================================
      earnPoint() {
        this.score++;
        this.scoreText.setText(this.score);
        this.synth.playScore();

        // Add floaty point text
        this.showFloatingText('+1', this.bird.x, this.bird.y - 20, '#00d4ff');

        // High score updates
        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.highScoreText.setText(`HIGH: ${this.highScore}`);
          localStorage.setItem('flappy_high', String(this.highScore));
        }

        // Level Up check (every 5 points)
        if (this.score % 5 === 0) {
          this.triggerLevelUp();
        }
      }

      triggerLevelUp() {
        this.level++;
        this.levelText.setText(`LVL: ${this.level}`);
        this.levelText.setColor('#' + this.getThemeColor().toString(16));
        
        this.synth.playLevelUp();

        // Award bonus points on Level Up
        const bonusPoints = 5;
        this.score += bonusPoints;
        this.scoreText.setText(this.score);
        this.showFloatingText(`+${bonusPoints} LEVEL BONUS!`, this.scale.width / 2, this.scale.height / 2 + 10, '#ffd700', 16);

        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.highScoreText.setText(`HIGH: ${this.highScore}`);
          localStorage.setItem('flappy_high', String(this.highScore));
        }

        // Level parameters escalation
        this.pipeSpeed = Math.min(320, 180 + (this.level - 1) * 20);
        this.gapHeight = Math.max(105, 160 - (this.level - 1) * 8);

        // Flash screen white briefly
        this.cameras.main.flash(200, 255, 255, 255, false);
        
        // Show giant floating Level Up text
        this.showFloatingText(`LEVEL ${this.level}`, this.scale.width / 2, this.scale.height / 2 - 30, '#' + this.getThemeColor().toString(16), 28);

        // Instantly recalculate pipe spawn timers to align with new scroll speeds
        this.recalculatePipeSpawnTimer();

        // Dynamic speed adjustments on active scrolling pipes
        const currentSpeed = this.powerupsActive.slowMo.active ? this.pipeSpeed * 0.5 : this.pipeSpeed;
        this.pipes.children.iterate((pipe: any) => {
          if (pipe && pipe.active) {
            pipe.body.setVelocityX(-currentSpeed);
          }
        });
      }

      // =============================================
      // POWER-UP COLLECTION & TRACKING
      // =============================================
      collectPowerup(_bird: any, pw: any) {
        const type = pw.getData('type') as keyof typeof this.powerupsActive;
        pw.destroy();

        this.synth.playPowerup();
        this.cameras.main.flash(150, 0, 212, 255, false);

        // Activate powerup
        const p = this.powerupsActive[type];
        p.active = true;
        
        // Slow-Mo and Boost get 12 seconds, shield and shrink get 15 seconds (longer duration)
        p.time = (type === 'boost' || type === 'slowMo') ? 12000 : 15000;

        // Custom visual alerts
        this.showFloatingText(`+${p.text}!`, this.bird.x, this.bird.y - 30, '#' + p.color.toString(16), 16);

        // Execute specific powerup functions
        if (type === 'shrink') {
          this.tweens.add({
            targets: this.bird,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 250
          });
        } else if (type === 'slowMo') {
          // Adjust velocities
          this.pipes.children.iterate((pipe: any) => {
            if (pipe && pipe.active) pipe.body.setVelocityX(-this.pipeSpeed * 0.5);
          });
          this.powerups.children.iterate((item: any) => {
            if (item && item.active) item.setVelocityX(-this.pipeSpeed * 0.5);
          });
          this.physics.world.gravity.y = 400; // floaty gravity
          this.recalculatePipeSpawnTimer();
        } else if (type === 'boost') {
          // Start invincibility speed run
          this.bird.body.allowGravity = false;
          this.bird.setVelocityY(0);
          this.pipes.children.iterate((pipe: any) => {
            if (pipe && pipe.active) pipe.body.setVelocityX(-this.pipeSpeed * 2);
          });
          this.powerups.children.iterate((item: any) => {
            if (item && item.active) item.setVelocityX(-this.pipeSpeed * 2);
          });
          this.recalculatePipeSpawnTimer();
          
          // Shift particle trail to gold
          this.emitter.setParticleTint(0xffd700);
        }
      }

      updatePowerupTimers(delta: number) {
        const slots = {
          shield: 45,
          shrink: 59,
          slowMo: 73,
          boost: 87
        };

        Object.keys(this.powerupsActive).forEach(key => {
          const p = this.powerupsActive[key as keyof typeof this.powerupsActive];
          if (p.active) {
            p.time -= delta;

            if (p.time <= 0) {
              p.active = false;
              p.time = 0;
              if (p.bar) { p.bar.destroy(); p.bar = null; }
              if (p.label) { p.label.destroy(); p.label = null; }

              // Revert modifications
              if (key === 'shrink') {
                this.tweens.add({ targets: this.bird, scaleX: 1, scaleY: 1, duration: 250 });
              } else if (key === 'slowMo') {
                this.physics.world.gravity.y = 1000;
                this.pipes.children.iterate((pipe: any) => {
                  if (pipe && pipe.active) pipe.body.setVelocityX(-this.pipeSpeed);
                });
                this.powerups.children.iterate((item: any) => {
                  if (item && item.active) item.setVelocityX(-this.pipeSpeed);
                });
                this.recalculatePipeSpawnTimer();
              } else if (key === 'boost') {
                this.bird.body.allowGravity = true;
                this.pipes.children.iterate((pipe: any) => {
                  if (pipe && pipe.active) pipe.body.setVelocityX(-this.pipeSpeed);
                });
                this.powerups.children.iterate((item: any) => {
                  if (item && item.active) item.setVelocityX(-this.pipeSpeed);
                });
                this.recalculatePipeSpawnTimer();
                this.emitter.setParticleTint(0xffffff); // reset trail
              }
            } else {
              // Draw or update HUD Progress Bar
              const yPos = slots[key as keyof typeof slots];
              const barWidth = 80;
              const barHeight = 6;
              const maxDur = (key === 'boost' || key === 'slowMo') ? 12000 : 15000;
              const fillRatio = p.time / maxDur;
              
              if (!p.bar) {
                p.bar = this.add.graphics();
              }
              p.bar.clear();
              
              // Progress Bar Outline
              p.bar.lineStyle(1, 0x5a5a7a, 0.5);
              p.bar.strokeRect(16, yPos, barWidth, barHeight);
              
              // Fill
              p.bar.fillStyle(p.color, 0.85);
              p.bar.fillRect(17, yPos + 1, (barWidth - 2) * fillRatio, barHeight - 2);

              // Label text (re-used dynamically instead of destroyed/created every frame to prevent game stutter)
              if (!p.label) {
                p.label = this.add.text(16 + barWidth + 8, yPos - 3, p.text, {
                  fontFamily: 'Orbitron, sans-serif', fontSize: '9px', color: '#' + p.color.toString(16), fontWeight: 'bold'
                });
              }
              p.label.setY(yPos - 3);
            }
          }
        });
      }

      steerAutoBoost() {
        // Find the closest oncoming pipe column center gap
        let closestPipe: any = null;
        let minX = 9999;
        
        this.pipes.children.iterate((pipe: any) => {
          if (pipe && pipe.active && pipe.x > this.bird.x - 20) {
            if (pipe.x < minX) {
              minX = pipe.x;
              closestPipe = pipe;
            }
          }
        });

        const targetY = 300; // Default center
        let finalY = targetY;

        if (closestPipe) {
          // If pipe is found, get the gap height center relative to its current Y position (critical for moving pipes)
          const pipeH = closestPipe.getData('height') || 0;
          if (closestPipe.getData('isTop')) {
            finalY = closestPipe.y + pipeH + this.gapHeight / 2;
          } else {
            finalY = closestPipe.y - this.gapHeight / 2;
          }
        }

        // Smoothly steer the bird Y to target gap using velocity instead of direct position mutation
        const targetVelocity = Phaser.Math.Clamp((finalY - this.bird.y) * 8, -350, 350);
        this.bird.setVelocityY(targetVelocity);
      }

      // =============================================
      // COLLISION HANDLERS
      // =============================================
      hitPipe(_bird: any, pipe: any) {
        if (this.isOver) return;

        // Auto boost ignores all pipe obstacles
        if (this.powerupsActive.boost.active) return;

        // Shield powerup absorbs one collision
        if (this.powerupsActive.shield.active) {
          this.powerupsActive.shield.active = false;
          this.powerupsActive.shield.time = 0;
          if (this.powerupsActive.shield.bar) {
            this.powerupsActive.shield.bar.clear();
          }

          this.synth.playShieldBreak();
          this.cameras.main.flash(200, 0, 128, 255, false);

          // Find the matching column (top & bottom pipes at same X coordinates) and destroy them
          const targetX = pipe.x;
          this.pipes.children.iterate((p: any) => {
            if (p && p.active && Math.abs(p.x - targetX) < 10) {
              // Destroy with explosion particles
              this.createNeonExplosion(p.x, p.y, this.getThemeColor());
              p.destroy();
            }
          });

          return;
        }

        // Standard crash
        this.triggerGameOver();
      }

      triggerGameOver() {
        this.isOver = true;
        this.bird.body.allowGravity = false;
        this.bird.setVelocity(0, 0);

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'flappy-bird', score: this.score }
        }));

        this.synth.playCrash();

        // Cameras shakes
        this.cameras.main.flash(300, 255, 0, 85, false);
        this.cameras.main.shake(200, 0.012);

        // Turn bird red/pink
        this.bird.setTint(0xff0055);
        this.emitter.stop(); // Stop engine particles

        if (this.spawnTimerEvent) {
          this.spawnTimerEvent.destroy();
        }

        // Stop all scrolling objects
        this.pipes.children.iterate((pipe: any) => { if (pipe && pipe.active) pipe.body.setVelocityX(0); });
        this.powerups.children.iterate((item: any) => { if (item && item.active) item.setVelocityX(0); });

        // Show Game Over panel
        const W = this.scale.width;
        const H = this.scale.height;

        this.time.delayedCall(400, () => {
          const panel = this.add.graphics();
          panel.fillStyle(0x08080f, 0.95);
          panel.fillRect(W / 2 - 130, H / 2 - 90, 260, 180);
          panel.lineStyle(1.5, 0xff0055, 1);
          panel.strokeRect(W / 2 - 130, H / 2 - 90, 260, 180);
          
          this.add.text(W / 2, H / 2 - 60, 'SYSTEM OFFLINE', {
            fontFamily: 'Orbitron, sans-serif', fontSize: '20px', color: '#ff0055', fontWeight: 'bold'
          }).setOrigin(0.5);

          this.add.text(W / 2, H / 2 - 20, `SCORE: ${this.score}`, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '16px', color: '#ffffff', fontWeight: 'bold'
          }).setOrigin(0.5);

          this.add.text(W / 2, H / 2 + 10, `BEST: ${this.highScore}`, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: '#5a5a7a', fontWeight: 'bold'
          }).setOrigin(0.5);

          const restart = this.add.text(W / 2, H / 2 + 50, 'CLICK TO RESTART', {
            fontFamily: 'Orbitron, sans-serif', fontSize: '12px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(0.5);

          this.tweens.add({
            targets: restart,
            alpha: 0.4,
            yoyo: true,
            duration: 500,
            repeat: -1
          });

          // Enable tap to restart
          this.input.once('pointerdown', () => this.scene.restart());
          this.input.keyboard.once('keydown-Space', () => this.scene.restart());
        });
      }

      // =============================================
      // VISUAL DRAWING UTILITIES
      // =============================================
      getThemeColor() {
        const colorIdx = Math.min(this.themeColors.length - 1, this.level - 1);
        return this.themeColors[colorIdx];
      }

      drawCityBackground() {
        const W = this.scale.width;
        const H = this.scale.height;
        
        this.cityBg.clear();
        
        const b1 = [60, 120, 80, 150, 90, 110, 70, 160, 110, 130];
        const drawBuildings = (heights: number[], fillCol: number, lineCol: number, isFar: boolean) => {
          let x = isFar ? 0 : 15;
          const w = 45;
          
          for (let loop = 0; loop < 2; loop++) {
            heights.forEach((h) => {
              this.cityBg.fillStyle(fillCol, isFar ? 0.45 : 0.65);
              this.cityBg.fillRect(x, H - h, w, h);
              
              this.cityBg.lineStyle(isFar ? 1 : 1.5, lineCol, isFar ? 0.3 : 0.5);
              this.cityBg.strokeRect(x, H - h, w, h);
              
              // Draw small neon windows on the buildings
              const winRows = Math.floor((h - 20) / (isFar ? 12 : 8));
              const winCols = isFar ? 2 : 3;
              const winW = isFar ? 3 : 4;
              const winH = isFar ? 4 : 5;
              const winPaddingX = (w - (winCols * winW)) / (winCols + 1);
              const winPaddingY = isFar ? 8 : 6;
              
              for (let r = 0; r < winRows; r++) {
                for (let c = 0; c < winCols; c++) {
                  const randVal = Math.sin((x + c) * 12.9898 + (H - h + r) * 78.233) * 43758.5453;
                  const fraction = randVal - Math.floor(randVal);
                  
                  if (fraction > 0.65) {
                    let winColor = 0xffe066;
                    if (fraction > 0.9) {
                      winColor = 0x00ffff;
                    } else if (fraction > 0.8) {
                      winColor = 0xff00bb;
                    }
                    
                    const wx = x + winPaddingX + c * (winW + winPaddingX);
                    const wy = H - h + 15 + r * (winH + winPaddingY);
                    
                    if (wy < H - 60) {
                      this.cityBg.fillStyle(winColor, isFar ? 0.25 : 0.6);
                      this.cityBg.fillRect(wx, wy, winW, winH);
                    }
                  }
                }
              }
              
              x += w;
            });
            if (loop === 0) {
              x = W + (isFar ? 0 : 15);
            }
          }
        };
        
        drawBuildings(b1, 0x0e0e22, 0x1d1d42, true);
        
        const b2 = [100, 170, 120, 210, 130, 160, 90, 230, 140, 180];
        drawBuildings(b2, 0x13132d, 0x242456, false);
      }

      drawFloor() {
        const W = this.scale.width;
        const H = this.scale.height;
        const floorY = H - 60;
        
        this.floorBg.clear();
        
        // Floor dark base
        this.floorBg.fillStyle(0x050515, 1);
        this.floorBg.fillRect(0, floorY, W, 60);
        
        // Neon horizon border
        const themeColor = this.getThemeColor();
        this.floorBg.lineStyle(3, themeColor, 1);
        this.floorBg.lineBetween(0, floorY, W, floorY);
        
        // Grid lines (3D slanted perspective)
        const numSlants = 12;
        this.floorBg.lineStyle(1.5, themeColor, 0.45);
        for (let i = 0; i <= numSlants; i++) {
          const ratio = i / numSlants;
          const xTop = W * ratio;
          const xBottom = W / 2 + (xTop - W / 2) * 1.4;
          this.floorBg.lineBetween(xTop, floorY, xBottom, H);
        }
        
        // Seamless 3D perspective scrolling horizontal lines
        const d = 1.0; // Spacing in 3D depth
        const K = H - floorY; // Max height of floor zone
        const maxLines = 10;
        
        for (let n = 1; n <= maxLines; n++) {
          const z = n * d - this.floorOffset; // floorOffset is normalized between 0 and d
          if (z > 0) {
            const currentY = floorY + K / z;
            if (currentY >= floorY && currentY <= H) {
              const alpha = Phaser.Math.Clamp((currentY - floorY) / K, 0.1, 0.8);
              this.floorBg.lineStyle(1.5, themeColor, alpha);
              this.floorBg.lineBetween(0, currentY, W, currentY);
            }
          }
        }
      }

      createBirdTexture() {
        const radius = 14;
        
        // 1. Cyber Bird Base texture
        const baseCanvas = this.textures.createCanvas('cyber_bird', radius * 2 + 10, radius * 2 + 10);
        if (baseCanvas) {
          const ctx = baseCanvas.context;
          
          // Draw Glowing Main Orb Body
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00d4ff';
          ctx.fillStyle = '#00d4ff';
          ctx.beginPath();
          ctx.arc(radius + 5, radius + 5, radius - 2, 0, Math.PI * 2);
          ctx.fill();

          // Cyber metallic core
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#0a0a1a';
          ctx.beginPath();
          ctx.arc(radius + 5, radius + 5, radius - 7, 0, Math.PI * 2);
          ctx.fill();

          // Glowing neon cyan center eye
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#39ff14';
          ctx.fillStyle = '#39ff14';
          ctx.beginPath();
          ctx.arc(radius + 7, radius + 5, 3, 0, Math.PI * 2);
          ctx.fill();

          baseCanvas.refresh();
        }

        // 2. White particle spark texture for trails
        const sparkCanvas = this.textures.createCanvas('bird_spark', 8, 8);
        if (sparkCanvas) {
          const ctx = sparkCanvas.context;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(4, 4, 3, 0, Math.PI * 2);
          ctx.fill();
          sparkCanvas.refresh();
        }

        // 3. Invisible empty placeholder for pipes
        const emptyCanvas = this.textures.createCanvas('empty', 2, 2);
        if (emptyCanvas) {
          const ctx = emptyCanvas.context;
          ctx.fillStyle = 'rgba(0,0,0,0)';
          ctx.fillRect(0,0,2,2);
          emptyCanvas.refresh();
        }
      }

      createPowerupTextures() {
        const rad = 12;
        const powers = [
          { key: 'shield', color: '#0080ff', icon: 'S' },
          { key: 'shrink', color: '#bd00ff', icon: 'M' },
          { key: 'slowMo', color: '#39ff14', icon: 'T' },
          { key: 'boost',  color: '#ffd700', icon: 'B' }
        ];

        powers.forEach(p => {
          const canvas = this.textures.createCanvas(`pw_${p.key}`, rad * 2, rad * 2);
          if (canvas) {
            const ctx = canvas.context;
            
            // Neon glow ring
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(rad, rad, rad - 2, 0, Math.PI * 2);
            ctx.stroke();

            // Dark inner circle
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#08080f';
            ctx.beginPath();
            ctx.arc(rad, rad, rad - 3, 0, Math.PI * 2);
            ctx.fill();

            // Letter Icon
            ctx.fillStyle = p.color;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.icon, rad, rad);

            canvas.refresh();
          }
        });
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

      createNeonExplosion(x: number, y: number, colorHex: number) {
        const exp = this.add.particles(x, y, 'bird_spark', {
          speed: { min: 40, max: 150 },
          scale: { start: 0.8, end: 0 },
          blendMode: 'ADD',
          lifespan: 400,
          maxParticles: 12
        });
        
        // Dynamic tint of explosion particles
        exp.setParticleTint(colorHex);
        this.time.delayedCall(450, () => exp.destroy());
      }
    };
  }
}
