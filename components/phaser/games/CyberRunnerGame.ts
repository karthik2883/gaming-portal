// Cyber Runner — 2D Side-Scrolling Infinite Runner game
// Register key: 'cyber-runner' in PhaserGameEngine.tsx

// Safe Web Audio API synthesizer for retro SFX
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

function playSynthTone(freq: number, type: OscillatorType = 'sine', duration = 0.1, gainVal = 0.1) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(gainVal, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playJumpTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

function playSlideTone() {
  playSynthTone(180, 'sawtooth', 0.2, 0.05);
}

function playCoinChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

function playPowerupTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.06);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
    
    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function playCrashTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

function playLevelUpTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    // Beautiful upward level-up chime arpeggio
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
    
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch (e) {}
}

function playLevelClearTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08);
    osc.frequency.setValueAtTime(783.99, now + 0.16);
    osc.frequency.setValueAtTime(1046.50, now + 0.24);
    osc.frequency.setValueAtTime(1318.51, now + 0.32);
    osc.frequency.setValueAtTime(1567.98, now + 0.40);
    
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.6);
  } catch (e) {}
}

export default class CyberRunnerGameFactory {
  static create(PhaserLib: any) {
    return class CyberRunnerScene extends PhaserLib.Scene {
      // Gameplay properties
      bg!: Phaser.GameObjects.TileSprite;
      ground!: Phaser.GameObjects.TileSprite;
      floorCollider!: any;
      player!: any;
      playerSprite!: Phaser.GameObjects.Sprite;
      
      // Groups
      obstacles!: Phaser.Physics.Arcade.Group;
      collectibles!: Phaser.Physics.Arcade.Group;
      powerups!: Phaser.Physics.Arcade.Group;

      // Inputs
      cursors!: any;
      keys!: any;

      // Mobile controls
      mobileJump!: boolean;
      mobileSlideTimer!: number;

      // Game state variables
      isGameOver!: boolean;
      score!: number;
      highScore!: number;
      baseScrollSpeed!: number;
      currentScrollSpeed!: number;
      distanceTraveled!: number;
      level!: number;
      coinsCollectedInLevel!: number;
      coinGoal!: number;
      isLevelTransitioning!: boolean;
      isPaused!: boolean;

      // Pause UI objects
      pausePanel!: Phaser.GameObjects.Rectangle | null;
      pauseTitle!: Phaser.GameObjects.Text | null;
      pauseGuide!: Phaser.GameObjects.Text | null;

      // Level Clear UI objects
      levelClearPanel!: Phaser.GameObjects.Rectangle | null;
      levelClearTitle!: Phaser.GameObjects.Text | null;
      levelClearCoins!: Phaser.GameObjects.Text | null;
      levelClearGuide!: Phaser.GameObjects.Text | null;

      // Buffs state variables
      isInvincible!: boolean;
      speedMultiplier!: number;
      invincibilityTimer!: number; // ms
      speedTimer!: number; // ms

      // Timers for spawning
      spawnTimer!: number;
      itemSpawnTimer!: number;

      // Visual overlays and effects
      scoreText!: Phaser.GameObjects.Text;
      hudOverlayText!: Phaser.GameObjects.Text;
      shieldEffectObj!: Phaser.GameObjects.Graphics;
      speedEffectGfx!: Phaser.GameObjects.Graphics;
      speedTrailPoints!: Array<{ x: number; y: number; h: number }>;
      floatingTexts!: Phaser.GameObjects.Group;

      constructor() {
        super({ key: 'CyberRunner' });
      }

      init() {
        this.isGameOver = false;
        this.score = 0;
        this.level = 1;
        this.coinsCollectedInLevel = 0;
        this.coinGoal = 5;
        this.isLevelTransitioning = false;
        this.isPaused = false;
        this.pausePanel = null;
        this.pauseTitle = null;
        this.pauseGuide = null;
        this.levelClearPanel = null;
        this.levelClearTitle = null;
        this.levelClearCoins = null;
        this.levelClearGuide = null;
        this.baseScrollSpeed = 6;
        this.currentScrollSpeed = 6;
        this.distanceTraveled = 0;

        this.isInvincible = false;
        this.speedMultiplier = 1.0;
        this.invincibilityTimer = 0;
        this.speedTimer = 0;

        this.spawnTimer = 0;
        this.itemSpawnTimer = 0;
        this.speedTrailPoints = [];

        this.mobileJump = false;
        this.mobileSlideTimer = 0;

        if (typeof window !== 'undefined') {
          const savedHigh = localStorage.getItem('cyber_runner_highscore');
          this.highScore = savedHigh ? parseInt(savedHigh, 10) : 0;
        } else {
          this.highScore = 0;
        }
      }

      preload() {
        // Load custom resources
        this.load.image('runner_bg', '/game-assets/runner-bg.jpg');
        this.load.image('runner_road', '/game-assets/road.png');
        this.load.image('game_coin', '/game-assets/coin.png');
        this.load.image('obstacle_high', '/game-assets/obstacle_high.png');
        this.load.image('obstacle_low', '/game-assets/obstacle_low.png');
        this.load.image('obstacle_slide', '/game-assets/obstacle_slide.png');
        this.load.atlas('runner_assets', '/game-assets/spritesheet.png', '/game-assets/spritesheet.json');
        this.load.atlas('player_assets', '/game-assets/player_spritesheet.png', '/game-assets/player_spritesheet.json');
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Create player animations
        this.anims.create({
          key: 'player_idle',
          frames: [
            { key: 'player_assets', frame: 'idle_01' },
            { key: 'player_assets', frame: 'idle_02' },
            { key: 'player_assets', frame: 'idle_03' },
            { key: 'player_assets', frame: 'idle_04' }
          ],
          frameRate: 6,
          repeat: -1
        });
        this.anims.create({
          key: 'player_run',
          frames: [
            { key: 'player_assets', frame: 'run_01' },
            { key: 'player_assets', frame: 'run_02' },
            { key: 'player_assets', frame: 'run_03' },
            { key: 'player_assets', frame: 'run_04' },
            { key: 'player_assets', frame: 'run_05' },
            { key: 'player_assets', frame: 'run_06' },
            { key: 'player_assets', frame: 'run_07' },
            { key: 'player_assets', frame: 'run_08' }
          ],
          frameRate: 14,
          repeat: -1
        });
        this.anims.create({
          key: 'player_jump',
          frames: [
            { key: 'player_assets', frame: 'jump_01' },
            { key: 'player_assets', frame: 'jump_02' },
            { key: 'player_assets', frame: 'jump_03' },
            { key: 'player_assets', frame: 'jump_04' },
            { key: 'player_assets', frame: 'jump_05' },
            { key: 'player_assets', frame: 'jump_06' }
          ],
          frameRate: 10,
          repeat: 0
        });
        this.anims.create({
          key: 'player_slide',
          frames: [
            { key: 'player_assets', frame: 'slide_01' },
            { key: 'player_assets', frame: 'slide_02' },
            { key: 'player_assets', frame: 'slide_03' },
            { key: 'player_assets', frame: 'slide_04' },
            { key: 'player_assets', frame: 'slide_05' },
            { key: 'player_assets', frame: 'slide_06' }
          ],
          frameRate: 14,
          repeat: -1
        });
        this.anims.create({
          key: 'player_fall',
          frames: [
            { key: 'player_assets', frame: 'fall_01' },
            { key: 'player_assets', frame: 'fall_02' },
            { key: 'player_assets', frame: 'fall_03' },
            { key: 'player_assets', frame: 'fall_04' }
          ],
          frameRate: 8,
          repeat: -1
        });
        this.anims.create({
          key: 'player_hit',
          frames: [
            { key: 'player_assets', frame: 'hit_01' },
            { key: 'player_assets', frame: 'hit_02' },
            { key: 'player_assets', frame: 'hit_03' },
            { key: 'player_assets', frame: 'hit_04' },
            { key: 'player_assets', frame: 'hit_05' }
          ],
          frameRate: 8,
          repeat: 0
        });

        // 1. Parallax background layer
        this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'runner_bg');
        // scale background image to fit aspect ratio
        const scaleX = W / this.bg.width;
        const scaleY = H / this.bg.height;
        const scale = Math.max(scaleX, scaleY);
        this.bg.setTileScale(scale, scale);

        // 2. Parallax scrolling floor layer
        // place centered at the bottom using our natural seamless road
        const groundHeight = 110; // actual height display
        this.ground = this.add.tileSprite(W / 2, H - groundHeight / 2, W, groundHeight, 'runner_road');
        // scale ground texture tile to fit height naturally (preserving horizontal aspect ratio)
        const roadScale = 0.25;
        this.ground.setTileScale(roadScale, roadScale);

        // 3. Static floor collider
        const floorY = H - groundHeight + 20; // top sand line
        this.floorCollider = this.physics.add.staticImage(W / 2, floorY + 10, null) as any;
        this.floorCollider.setSize(W, 20);
        this.physics.add.existing(this.floorCollider, true);

        // 4. Player character physics container
        this.player = this.add.container(100, floorY - 40);
        this.physics.add.existing(this.player);
        this.player.body.setGravityY(1600);
        this.player.body.setCollideWorldBounds(true);
        // set sizing box bounds
        this.player.body.setSize(30, 80);
        this.player.body.setOffset(-15, -40);

        // Create player sprite centered on origin with feet at bottom of collider
        this.playerSprite = this.add.sprite(0, 40, 'player_assets', 'idle_01');
        this.playerSprite.setOrigin(0.5, 0.9375);
        this.player.add(this.playerSprite);

        // Setup floor collision
        this.physics.add.collider(this.player, this.floorCollider);

        // 5. Instancing Groups
        this.obstacles = this.physics.add.group();
        this.collectibles = this.physics.add.group();
        this.powerups = this.physics.add.group();
        this.floatingTexts = this.add.group();

        // 6. Setup input keys capture
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('SPACE,W,S,ENTER,P,ESC');

        // Mobile Touch Swipe & Tap controls
        let swipeStart: { x: number; y: number } | null = null;
        this.input.on('pointerdown', (pointer: any) => {
          getAudioContext();
          if (this.isGameOver) {
            this.scene.restart();
            return;
          }
          swipeStart = { x: pointer.x, y: pointer.y };
        });
        this.input.on('pointerup', (pointer: any) => {
          if (!swipeStart || this.isGameOver) return;
          const dx = pointer.x - swipeStart.x;
          const dy = pointer.y - swipeStart.y;
          const adx = Math.abs(dx);
          const ady = Math.abs(dy);
          
          if (adx < 20 && ady < 20) {
            this.mobileJump = true;
          } else if (ady > adx) {
            if (dy > 0) {
              this.mobileSlideTimer = 350; // Slide for 350ms on swipe down
            } else {
              this.mobileJump = true;
            }
          }
          swipeStart = null;
        });

        // Setup Colliders Overlaps
        this.physics.add.overlap(this.player, this.obstacles, this.handleHurdleCollision, undefined, this);
        this.physics.add.overlap(this.player, this.collectibles, this.handleCollectCoin, undefined, this);
        this.physics.add.overlap(this.player, this.powerups, this.handleCollectPowerup, undefined, this);

        // 7. Dynamic UI Texts HUD
        this.scoreText = this.add.text(25, 20, 'SCORE: 0', {
          fontFamily: 'Orbitron, monospace', fontSize: '16px', color: '#ffffff', fontWeight: 'bold'
        }).setShadow(0, 0, '#ffffff', 5, true, true);

        this.hudOverlayText = this.add.text(W / 2, H / 2, '', {
          fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#ffffff', fontWeight: 'bold', align: 'center'
        }).setOrigin(0.5).setAlpha(0);

        // Graphics layers for active buffs
        this.shieldEffectObj = this.add.graphics();
        this.speedEffectGfx = this.add.graphics();

        // Welcome chime
        playPowerupTone();
      }

      update(time: number, delta: number) {
        // Handle pause toggling
        if (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
          this.togglePause();
        }
        if (this.isPaused) {
          return;
        }

        if (this.isGameOver) {
          // Restart handler
          if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) {
            this.scene.restart();
          }
          return;
        }

        if (this.isLevelTransitioning) {
          // If level is complete, allow pressing SPACE/ENTER/W to go to next level
          if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || 
              Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || 
              Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
              Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
              Phaser.Input.Keyboard.JustDown(this.keys.W)) {
            this.startNextLevel();
          }
          
          this.player.body.setVelocityX(0);
          
          if (this.playerSprite.anims.currentAnim?.key !== 'player_victory') {
            this.playerSprite.play('player_victory');
          }
          return;
        }

        const W = this.scale.width;
        const H = this.scale.height;

        // 1. Update powerup timers
        if (this.isInvincible) {
          this.invincibilityTimer -= delta;
          if (this.invincibilityTimer <= 0) {
            this.isInvincible = false;
            this.invincibilityTimer = 0;
            this.showBuffAlert('SHIELD EXPIRED', '#ef4444');
          }
        }

        if (this.speedMultiplier > 1.0) {
          this.speedTimer -= delta;
          if (this.speedTimer <= 0) {
            this.speedMultiplier = 1.0;
            this.speedTimer = 0;
            this.showBuffAlert('SPEED BOOST OVER', '#ef4444');
          }
        }

        // Increment distance score
        this.distanceTraveled += 0.1 * (delta / 16.66);
        this.score = Math.floor(this.distanceTraveled);

        // Adjust speed based on current level and score (escalating difficulty)
        this.baseScrollSpeed = 6 + (this.level - 1) * 1.5 + this.score * 0.0003;

        // 2. Adjust scrolling speed based on active buffs
        this.currentScrollSpeed = this.baseScrollSpeed * this.speedMultiplier;

        // Scroll backgrounds
        this.bg.tilePositionX += this.currentScrollSpeed * 0.3 * (delta / 16.66);
        this.ground.tilePositionX += this.currentScrollSpeed * (delta / 16.66);

        this.scoreText.setText(`LEVEL: ${this.level}  |  COINS: ${this.coinsCollectedInLevel}/${this.coinGoal}  |  SCORE: ${this.score}  |  BEST: ${this.highScore}`);

        // 3. Spawners loops
        if (!this.isLevelTransitioning) {
          this.spawnTimer += delta;
          const spawnDelay = Math.max(1000, 2600 - (this.baseScrollSpeed * 150));
          if (this.spawnTimer >= spawnDelay) {
            this.spawnTimer = 0;
            this.spawnObstacle();
          }

          this.itemSpawnTimer += delta;
          if (this.itemSpawnTimer >= 1800) {
            this.itemSpawnTimer = 0;
            this.spawnItems();
          }
        }

        // 4. Player Movement Controls and Animations
        const onGround = this.player.body.touching.down;
        
        if (this.mobileSlideTimer > 0) {
          this.mobileSlideTimer -= delta;
        }
        
        const slidePressed = this.cursors.down.isDown || this.keys.S.isDown || (this.mobileSlideTimer > 0);

        // Jumping mechanic
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
                            Phaser.Input.Keyboard.JustDown(this.cursors.space) || 
                            Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || 
                            Phaser.Input.Keyboard.JustDown(this.keys.W) ||
                            this.mobileJump;

        if (jumpPressed && onGround) {
          this.mobileJump = false; // Reset
          this.player.body.setVelocityY(-650);
          playJumpTone();
        }

        // Adjust body size, offset, and animation based on current state
        if (slidePressed) {
          if (!onGround) {
            // Fast drop if in air
            this.player.body.setVelocityY(750);
          }
          
          // Slide physics body
          this.player.body.setSize(30, 45);
          this.player.body.setOffset(-15, -5);

          // Play slide animation
          if (this.playerSprite.anims.currentAnim?.key !== 'player_slide') {
            this.playerSprite.play('player_slide');
          }

          if (onGround && time % 80 < 20) {
            playSlideTone();
          }
        } else {
          // Standing physics body
          this.player.body.setSize(30, 80);
          this.player.body.setOffset(-15, -40);

          if (!onGround) {
            // Play jump or fall animation depending on vertical velocity
            if (this.player.body.velocity.y > 0) {
              if (this.playerSprite.anims.currentAnim?.key !== 'player_fall') {
                this.playerSprite.play('player_fall');
              }
            } else {
              if (this.playerSprite.anims.currentAnim?.key !== 'player_jump') {
                this.playerSprite.play('player_jump');
              }
            }
          } else {
            // Play run animation
            if (this.playerSprite.anims.currentAnim?.key !== 'player_run') {
              this.playerSprite.play('player_run');
            }
          }
        }

        // Keep character size consistent with uniform 128x128 cell scaling
        this.playerSprite.setScale(85 / 128);

        // 5. Move obstacles, collectibles, and clean off-screen
        this.updateOffScreenObjects();

        // 6. Draw glowing active shield/speed particles effects
        this.renderActiveBuffEffects();
      }

      spawnObstacle() {
        const W = this.scale.width;
        const H = this.scale.height;
        const floorY = H - 110 + 20;

        // Choose randomly between jumping hurdle (crates) and sliding hurdle (log archway)
        const isSlide = Math.random() > 0.5;
        const obstacleKey = isSlide ? 'obstacle_slide' : 'obstacle_high';

        let spawnY = floorY;
        let obs: any;

        if (isSlide) {
          // Log archway: height 80, centered at floorY - 40 (bottom sits at floorY)
          spawnY = floorY - 40;
          obs = this.obstacles.create(W + 50, spawnY, obstacleKey);
          obs.setDisplaySize(186, 80);
          // Set physics body to the top log only (921 width, 160 height, 0, 0 offset)
          obs.body.setSize(921, 160);
          obs.body.setOffset(0, 0);
        } else {
          // Crates/barrel: height 75, centered at floorY - 37.5 (bottom sits at floorY)
          spawnY = floorY - 37.5;
          obs = this.obstacles.create(W + 50, spawnY, obstacleKey);
          obs.setDisplaySize(81, 75);
          obs.body.setSize(450, 600, true);
        }

        obs.body.setAllowGravity(false);
        obs.body.setImmovable(true);
        obs.body.setVelocityX(-this.currentScrollSpeed * 60);
      }

      spawnItems() {
        const W = this.scale.width;
        const H = this.scale.height;
        const floorY = H - 110 + 20;

        const rand = Math.random();

        if (rand < 0.6) {
          // 60% chance to spawn coins paths
          const coinCount = 3 + Math.floor(Math.random() * 4);
          const layoutHeight = floorY - 50 - Math.random() * 80;
          let coinX = W + 40;

          for (let i = 0; i < coinCount; i++) {
            const coin = this.collectibles.create(coinX, layoutHeight, 'game_coin');
            coin.name = 'coin';
            coin.setDisplaySize(28, 28);
            coin.body.setAllowGravity(false);
            coin.body.setVelocityX(-this.currentScrollSpeed * 60);
            coin.body.setSize(812, 842);
            
            // Add a beautiful spinning and floating yoyo tween!
            this.tweens.add({
              targets: coin,
              scaleX: 0,
              duration: 400 + Math.random() * 200,
              yoyo: true,
              repeat: -1
            });
            this.tweens.add({
              targets: coin,
              y: layoutHeight - 8,
              duration: 800 + Math.random() * 400,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
            
            coinX += 45;
          }
        } else if (rand < 0.75) {
          // 15% chance to spawn speed powerup
          const power = this.powerups.create(W + 40, floorY - 45, 'runner_assets', 'powerup_speed');
          power.name = 'speed';
          power.setScale(0.2);
          power.body.setAllowGravity(false);
          power.body.setVelocityX(-this.currentScrollSpeed * 60);
          power.body.setSize(200, 200);
        } else if (rand < 0.9) {
          // 15% chance to spawn shield powerup
          const power = this.powerups.create(W + 40, floorY - 45, 'runner_assets', 'powerup_shield');
          power.name = 'shield';
          power.setScale(0.2);
          power.body.setAllowGravity(false);
          power.body.setVelocityX(-this.currentScrollSpeed * 60);
          power.body.setSize(200, 200);
        } else {
          // 10% chance to spawn a Multiplier Chest!
          const chest = this.collectibles.create(W + 40, floorY - 35, 'runner_assets', 'multiplier_chest');
          chest.name = 'chest';
          chest.setScale(0.22);
          chest.body.setAllowGravity(false);
          chest.body.setVelocityX(-this.currentScrollSpeed * 60);
          chest.body.setSize(220, 200);
        }
      }

      updateOffScreenObjects() {
        // Recycle hurdles
        this.obstacles.getChildren().forEach((obs: any) => {
          if (obs.x < -80) {
            obs.destroy();
          } else {
            // Keep velocity aligned with scrolling
            obs.body.setVelocityX(-this.currentScrollSpeed * 60);
          }
        });

        // Recycle coins/chests
        this.collectibles.getChildren().forEach((col: any) => {
          if (col.x < -80) {
            col.destroy();
          } else {
            col.body.setVelocityX(-this.currentScrollSpeed * 60);
          }
        });

        // Recycle powerups
        this.powerups.getChildren().forEach((pw: any) => {
          if (pw.x < -80) {
            pw.destroy();
          } else {
            pw.body.setVelocityX(-this.currentScrollSpeed * 60);
          }
        });
      }

      renderActiveBuffEffects() {
        // 1. Draw invincibility blue shield aura
        this.shieldEffectObj.clear();
        if (this.isInvincible) {
          this.shieldEffectObj.lineStyle(2.5, 0x00d4ff, 0.7);
          this.shieldEffectObj.fillStyle(0x00d4ff, 0.15);
          
          // Draw circle overlay centered on player container
          const px = this.player.x;
          const py = this.player.y + (this.player.body.height === 45 ? 17.5 : 0); // adjust offset on slide
          
          this.shieldEffectObj.fillCircle(px, py, 42);
          this.shieldEffectObj.strokeCircle(px, py, 42);
        }

        // 2. Draw speed trailing lines
        this.speedEffectGfx.clear();
        if (this.speedMultiplier > 1.0) {
          // Save trail positions
          const px = this.player.x;
          const py = this.player.y;
          const ph = this.player.body.height;

          this.speedTrailPoints.push({ x: px, y: py, h: ph });
          if (this.speedTrailPoints.length > 8) {
            this.speedTrailPoints.shift();
          }

          // draw fading trail rectangles
          this.speedTrailPoints.forEach((pt, idx) => {
            const alpha = (idx / this.speedTrailPoints.length) * 0.25;
            this.speedEffectGfx.fillStyle(0xff00ff, alpha);
            this.speedEffectGfx.fillRect(pt.x - 15 - (8 - idx) * 12, pt.y + (pt.h === 45 ? -5 : -40), 30, pt.h);
          });
        } else {
          this.speedTrailPoints = [];
        }
      }

      handleCollectCoin(player: any, item: any) {
        item.destroy();

        if (item.name === 'coin') {
          this.distanceTraveled += 100; // Adds points
          playCoinChime();
          this.createFloatingText(item.x, item.y, '+10PTS', '#ffea00');
          
          if (!this.isLevelTransitioning) {
            this.coinsCollectedInLevel++;
            
            // Level cleared check
            if (this.coinsCollectedInLevel >= this.coinGoal) {
              this.isLevelTransitioning = true;
              
              // Play a victory level clear chime!
              playLevelClearTone();
              
              // Stop the scrolling speed entirely
              this.baseScrollSpeed = 0;
              this.currentScrollSpeed = 0;
              
              // Clear active obstacles and items so they don't hit the player
              this.obstacles.clear(true, true);
              this.collectibles.clear(true, true);
              this.powerups.clear(true, true);
              
              const W = this.scale.width;
              const H = this.scale.height;

              // Draw beautiful level clear panel overlay
              this.levelClearPanel = this.add.rectangle(W / 2, H / 2, 400, 180, 0x08080f, 0.92).setStrokeStyle(1.5, 0x39ff14);
              this.levelClearTitle = this.add.text(W / 2, H / 2 - 45, `LEVEL ${this.level} COMPLETED`, {
                fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#39ff14', fontWeight: 'bold'
              }).setOrigin(0.5).setShadow(0, 0, '#39ff14', 8, true, true);
              
              this.levelClearCoins = this.add.text(W / 2, H / 2 - 5, `COINS COLLECTED: ${this.coinsCollectedInLevel}/${this.coinGoal}`, {
                fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
              }).setOrigin(0.5);
              
              this.levelClearGuide = this.add.text(W / 2, H / 2 + 45, 'PRESS SPACE / ENTER FOR NEXT LEVEL', {
                fontFamily: 'Orbitron, monospace', fontSize: '12px', color: '#ffffff', fontWeight: 'bold'
              }).setOrigin(0.5);
            }
          }
        } else if (item.name === 'chest') {
          this.distanceTraveled += 1000; // Adds 100 points
          playPowerupTone();
          this.createFloatingText(item.x, item.y, 'MULTIPLIER CHEST! +100PTS', '#39ff14');
        }
      }

      handleCollectPowerup(player: any, power: any) {
        power.destroy();
        playPowerupTone();

        if (power.name === 'speed') {
          this.speedMultiplier = 1.5;
          this.speedTimer = 5000; // 5 seconds duration
          this.showBuffAlert('SPEED BOOST ACTIVE! 1.5x', '#ff00ff');
          this.createFloatingText(power.x, power.y, 'SPEED BOOST!', '#ff00ff');
        } else if (power.name === 'shield') {
          this.isInvincible = true;
          this.invincibilityTimer = 5000; // 5 seconds duration
          this.showBuffAlert('INVINCIBILITY ACTIVATED!', '#00d4ff');
          this.createFloatingText(power.x, power.y, 'SHIELD BARRIER!', '#00d4ff');
        }
      }

      handleHurdleCollision(player: any, obstacle: any) {
        if (this.isInvincible) {
          // Ignored collision under shield
          return;
        }

        // CRASH! GAME OVER
        this.isGameOver = true;
        this.physics.pause();
        playCrashTone();

        // Dispatch game over event for the leaderboard system
        window.dispatchEvent(new CustomEvent('phaser-game-over', {
          detail: { gameKey: 'cyber-runner', score: this.score }
        }));

        // Stop player animations and play hit animation
        if (this.playerSprite) {
          this.playerSprite.play('player_hit');
        }

        // Save high score
        if (this.score > this.highScore) {
          this.highScore = this.score;
          if (typeof window !== 'undefined') {
            localStorage.setItem('cyber_runner_highscore', this.highScore.toString());
          }
        }

        // Draw screen block overlay
        const W = this.scale.width;
        const H = this.scale.height;

        const overlayBack = this.add.rectangle(W / 2, H / 2, 360, 200, 0x08080f, 0.92).setStrokeStyle(1.5, 0xef4444);
        
        const gameOverTxt = this.add.text(W / 2, H / 2 - 60, 'SYSTEM OVERLOAD', {
          fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#ef4444', fontWeight: 'bold'
        }).setOrigin(0.5).setShadow(0, 0, '#ef4444', 8, true, true);

        const scoreTxt = this.add.text(W / 2, H / 2 - 15, `FINAL METRICS: ${this.score}`, {
          fontFamily: 'monospace', fontSize: '13px', color: '#00d4ff', fontWeight: 'bold'
        }).setOrigin(0.5);

        const bestTxt = this.add.text(W / 2, H / 2 + 10, `HIGH RECORD: ${this.highScore}`, {
          fontFamily: 'monospace', fontSize: '11px', color: '#6b7280'
        }).setOrigin(0.5);

        const guideTxt = this.add.text(W / 2, H / 2 + 60, 'PRESS SPACE / ENTER TO RESTART', {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ffffff'
        }).setOrigin(0.5);
      }

      createFloatingText(x: number, y: number, text: string, color: string) {
        const textObj = this.add.text(x, y, text, {
          fontFamily: 'Orbitron, monospace', fontSize: '11px', color, fontWeight: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
          targets: textObj,
          y: y - 80,
          alpha: 0,
          scale: 1.3,
          duration: 1000,
          onComplete: () => {
            textObj.destroy();
          }
        });
      }

      showBuffAlert(text: string, colorHexStr: string) {
        this.hudOverlayText.setText(text);
        this.hudOverlayText.setColor(colorHexStr);
        this.hudOverlayText.setAlpha(1);
        this.hudOverlayText.setScale(0.8);
        this.hudOverlayText.setShadow(0, 0, colorHexStr, 6, true, true);

        this.tweens.add({
          targets: this.hudOverlayText,
          scale: 1.2,
          alpha: 0,
          duration: 1500,
          ease: 'Quad.easeOut'
        });
      }

      startNextLevel() {
        // Destroy level clear UI panel
        if (this.levelClearPanel) this.levelClearPanel.destroy();
        if (this.levelClearTitle) this.levelClearTitle.destroy();
        if (this.levelClearCoins) this.levelClearCoins.destroy();
        if (this.levelClearGuide) this.levelClearGuide.destroy();
        this.levelClearPanel = null;

        this.level++;
        this.coinGoal = 5 + (this.level - 1) * 3;
        this.coinsCollectedInLevel = 0;

        // Reset speed and update scroll speed
        this.baseScrollSpeed = 6 + (this.level - 1) * 1.5 + this.score * 0.0003;
        this.currentScrollSpeed = this.baseScrollSpeed * this.speedMultiplier;

        // Clear any leftover objects
        this.obstacles.clear(true, true);
        this.collectibles.clear(true, true);
        this.powerups.clear(true, true);

        // Resume spawning
        this.isLevelTransitioning = false;
        playPowerupTone();
        this.showBuffAlert(`LEVEL ${this.level} START!`, '#00d4ff');
      }

      togglePause() {
        if (this.isGameOver || this.isLevelTransitioning) return;
        
        const W = this.scale.width;
        const H = this.scale.height;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
          // Pause physics, tweens, and player animation
          this.physics.pause();
          this.tweens.pauseAll();
          this.playerSprite.anims.pause();
          
          // Draw Pause overlay
          this.pausePanel = this.add.rectangle(W / 2, H / 2, 300, 140, 0x08080f, 0.92).setStrokeStyle(1.5, 0x00d4ff);
          this.pauseTitle = this.add.text(W / 2, H / 2 - 25, 'SYSTEM PAUSED', {
            fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#00d4ff', fontWeight: 'bold'
          }).setOrigin(0.5).setShadow(0, 0, '#00d4ff', 8, true, true);
          
          this.pauseGuide = this.add.text(W / 2, H / 2 + 25, 'PRESS P / ESC TO RESUME', {
            fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ffffff'
          }).setOrigin(0.5);
          
          playPowerupTone();
        } else {
          // Resume physics, tweens, and player animation
          this.physics.resume();
          this.tweens.resumeAll();
          this.playerSprite.anims.resume();
          
          // Destroy Pause overlay
          if (this.pausePanel) this.pausePanel.destroy();
          if (this.pauseTitle) this.pauseTitle.destroy();
          if (this.pauseGuide) this.pauseGuide.destroy();
          this.pausePanel = null;
          
          playPowerupTone();
        }
      }
    };
  }
}
