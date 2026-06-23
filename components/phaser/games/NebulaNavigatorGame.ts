export default class NebulaNavigatorGameFactory {
  static create(PhaserLib: any) {
    // Game state
    const gameState = {
      fuel: 100,
      maxFuel: 100,
      credits: 50,
      currentNodeId: 0,
      claimedNodes: [] as number[],
      inventory: { 'Quantum Algorithms': 0, 'Prime Data': 0 },
      galaxy: [] as any[],
      targetNodeId: -1,
      combatTarget: null as any,
    };

    // Sound generation helper
    const playSound = (scene: any, freq: number, type: OscillatorType, duration: number) => {
      if (!scene.sys.game.sound.context) return;
      const ctx = scene.sys.game.sound.context;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    };

    class BootScene extends PhaserLib.Scene {
      constructor() { super({ key: 'Boot' }); }
      create() {
        const createTex = (key: string, draw: (ctx: CanvasRenderingContext2D) => void, w=32, h=32) => {
          if (!this.textures.exists(key)) {
            const canvas = this.textures.createCanvas(key, w, h);
            draw(canvas.context);
            canvas.refresh();
          }
        };

        // Ship
        createTex('ship', (ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = '#00ffff';
          ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(32, 32); ctx.lineTo(16, 24); ctx.lineTo(0, 32); ctx.fill();
        });
        
        // Enemy
        createTex('enemy', (ctx: CanvasRenderingContext2D) => {
          ctx.fillStyle = '#ff0055';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(32, 0); ctx.lineTo(16, 32); ctx.fill();
        });

        // Nodes
        createTex('node_empty', (ctx: CanvasRenderingContext2D) => { ctx.fillStyle = '#aaaaaa'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill(); });
        createTex('node_combat', (ctx: CanvasRenderingContext2D) => { ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(16,16,12,0,Math.PI*2); ctx.fill(); });
        createTex('node_trade', (ctx: CanvasRenderingContext2D) => { ctx.fillStyle = '#4444ff'; ctx.fillRect(4,4,24,24); });
        createTex('node_grand', (ctx: CanvasRenderingContext2D) => { ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(32,16); ctx.lineTo(16,32); ctx.lineTo(0,16); ctx.fill(); });

        this.generateGalaxy();
        this.scene.start('GalaxyMap');
      }

      generateGalaxy() {
        const nodes = [];
        for (let i = 0; i < 20; i++) {
          nodes.push({
            id: i,
            x: PhaserLib.Math.Between(50, 750),
            y: PhaserLib.Math.Between(50, 550),
            type: i === 0 ? 'empty' : PhaserLib.Math.RND.pick(['empty', 'empty', 'combat', 'trade', 'grand']),
            name: `Sector ${String.fromCharCode(65+i)}${PhaserLib.Math.Between(10,99)}`,
            connections: [] as number[],
          });
        }
        // Connect nodes
        for (let i = 0; i < nodes.length; i++) {
          const numConn = PhaserLib.Math.Between(1, 3);
          for (let c = 0; c < numConn; c++) {
            const target = PhaserLib.Math.Between(0, nodes.length - 1);
            if (target !== i && !nodes[i].connections.includes(target)) {
              nodes[i].connections.push(target);
              nodes[target].connections.push(i);
            }
          }
        }
        gameState.galaxy = nodes;
      }
    }

    class GalaxyMapScene extends PhaserLib.Scene {
      constructor() { super({ key: 'GalaxyMap' }); }
      
      create() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Background stars
        const gfx = this.add.graphics();
        gfx.fillStyle(0xffffff, 0.8);
        for(let i=0; i<100; i++) {
          gfx.fillPoint(PhaserLib.Math.Between(0, w), PhaserLib.Math.Between(0, h), PhaserLib.Math.Between(1, 2));
        }

        // HUD
        this.add.rectangle(0, 0, w*2, 80, 0x050510, 0.9);
        this.add.text(10, 10, 'NEBULA NAVIGATOR', { fontFamily: 'Orbitron, monospace', fontSize: '20px', color: '#00ffff', fontWeight: 'bold' });
        this.add.text(w - 10, 10, `Claimed Systems: ${gameState.claimedNodes.length}`, { fontFamily: 'monospace', fontSize: '14px', color: '#00ff00' }).setOrigin(1, 0);
        
        // Draw edges
        gfx.lineStyle(1, 0x444466, 0.5);
        gameState.galaxy.forEach((node: any) => {
          node.connections.forEach((targetId: number) => {
            const target = gameState.galaxy.find((n:any) => n.id === targetId);
            if (target) {
              gfx.lineBetween(node.x, node.y, target.x, target.y);
            }
          });
        });

        // Tooltip text
        const tooltip = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 4 } }).setOrigin(0.5, 1).setDepth(10).setVisible(false);

        // Draw nodes
        gameState.galaxy.forEach((node: any) => {
          const tex = `node_${node.type}`;
          const sprite = this.add.sprite(node.x, node.y, tex).setInteractive({useHandCursor: true});
          if (gameState.claimedNodes.includes(node.id)) {
            sprite.setTint(0x00ff00);
          } else if (node.type === 'combat') {
            sprite.setTint(0xff4444);
          } else if (node.type === 'trade') {
            sprite.setTint(0x4444ff);
          } else if (node.type === 'grand') {
            sprite.setTint(0xffaa00);
          }
          
          sprite.on('pointerover', () => {
            sprite.setScale(1.2);
            tooltip.setText(`${node.name}\nType: ${node.type.toUpperCase()}`);
            tooltip.setPosition(node.x, node.y - 20);
            tooltip.setVisible(true);
          });
          
          sprite.on('pointerout', () => {
            sprite.setScale(1);
            tooltip.setVisible(false);
          });

          sprite.on('pointerdown', () => {
            if (gameState.galaxy[gameState.currentNodeId].connections.includes(node.id)) {
              gameState.targetNodeId = node.id;
              this.scene.start('WarpEquation');
            }
          });
        });

        // Draw player
        const playerNode = gameState.galaxy[gameState.currentNodeId];
        this.add.sprite(playerNode.x, playerNode.y, 'ship').setScale(0.8);

        // UI Bottom
        this.add.rectangle(0, h, w*2, 80, 0x050510, 0.9).setOrigin(0, 1);
        this.add.text(10, h - 30, `Fuel: ${gameState.fuel}/${gameState.maxFuel} | Credits: ${gameState.credits}`, { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' });
        this.add.text(w - 10, h - 30, `Cargo: QA(${gameState.inventory['Quantum Algorithms']}) | PD(${gameState.inventory['Prime Data']})`, { fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa' }).setOrigin(1, 0);
        
        if (gameState.fuel <= 0) {
          this.add.text(w/2, h/2, 'OUT OF FUEL\nGAME OVER', { fontFamily: 'Orbitron, monospace', fontSize: '48px', color: '#ff0000', align: 'center', fontWeight: 'bold' }).setOrigin(0.5);
          window.dispatchEvent(new CustomEvent('phaser-game-over', { detail: { gameKey: 'nebula-navigator', score: gameState.credits } }));
        }
      }
    }

    class WarpEquationScene extends PhaserLib.Scene {
      targetFreq: number = 0;
      currentEquation: string = '';
      currentVal: number | null = null;
      equationText!: Phaser.GameObjects.Text;

      constructor() { super({ key: 'WarpEquation' }); }
      
      init() {
        this.targetFreq = PhaserLib.Math.Between(10, 50);
        this.currentEquation = '';
        this.currentVal = null;
      }

      create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w/2, h/2, 600, 400, 0x050510).setStrokeStyle(2, 0x00ffff);
        this.add.text(w/2, h/2 - 160, 'WARP CALCULATION REQUIRED', { fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#00ffff', fontWeight: 'bold' }).setOrigin(0.5);
        
        this.add.text(w/2, h/2 - 120, `Target Warp Frequency: ${this.targetFreq}`, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

        this.equationText = this.add.text(w/2, h/2 - 60, '> _', { fontFamily: 'monospace', fontSize: '24px', color: '#00ff66' }).setOrigin(0.5);

        // Numpad and operators
        const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
        let bx = w/2 - 120;
        let by = h/2 + 20;

        buttons.forEach((btn, i) => {
          const x = bx + (i % 4) * 80;
          const y = by + Math.floor(i / 4) * 50;

          const btnBg = this.add.rectangle(x, y, 60, 40, 0x111122).setStrokeStyle(1, 0x00ffff).setInteractive({useHandCursor: true});
          const btnTxt = this.add.text(x, y, btn, { fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#00ffff' }).setOrigin(0.5);

          btnBg.on('pointerover', () => btnBg.setFillStyle(0x222244));
          btnBg.on('pointerout', () => btnBg.setFillStyle(0x111122));
          btnBg.on('pointerdown', () => this.handleInput(btn));
        });

        const skipBtn = this.add.text(w/2, h/2 + 220, '[ OVERRIDE & JUMP (Costs 10 Fuel) ]', { fontFamily: 'monospace', fontSize: '14px', color: '#ffaaaa' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        skipBtn.on('pointerdown', () => {
          gameState.fuel -= 10;
          this.jump();
        });
      }

      handleInput(char: string) {
        if (char === 'C') {
          this.currentEquation = '';
        } else if (char === '=') {
          try {
            // Evaluate math safely (no eval)
            const sanitized = this.currentEquation.replace(/[^0-9+\-*/]/g, '');
            // simple eval fallback since sanitized
            const result = new Function(`return ${sanitized}`)(); 
            if (result === this.targetFreq) {
              playSound(this, 800, 'sine', 0.2);
              this.equationText.setText(`> ${this.currentEquation} = ${result} [ACCEPTED]`);
              this.time.delayedCall(500, () => this.jump());
              return;
            } else {
              playSound(this, 200, 'sawtooth', 0.2);
              this.equationText.setText(`> ${this.currentEquation} = ${result} [REJECTED]`);
              this.time.delayedCall(800, () => {
                this.currentEquation = '';
                this.equationText.setText('> _');
              });
              return;
            }
          } catch(e) {
            this.currentEquation = 'ERROR';
          }
        } else {
          playSound(this, 600, 'sine', 0.05);
          this.currentEquation += char;
        }
        this.equationText.setText(`> ${this.currentEquation}`);
      }

      jump() {
        gameState.currentNodeId = gameState.targetNodeId;
        
        // Passive income from claimed systems
        if (gameState.claimedNodes.length > 0) {
          gameState.credits += gameState.claimedNodes.length * 5;
          // occasional commodity drop
          if (PhaserLib.Math.Between(1, 100) > 80) {
             gameState.inventory['Quantum Algorithms']++;
          }
        }

        const node = gameState.galaxy[gameState.currentNodeId];
        if (node.type === 'combat') this.scene.start('Combat');
        else if (node.type === 'trade') this.scene.start('Trade');
        else if (node.type === 'grand' && !gameState.claimedNodes.includes(node.id)) this.scene.start('GrandTheorem');
        else this.scene.start('GalaxyMap');
      }
    }

    class CombatScene extends PhaserLib.Scene {
      enemyHp: number = 3;
      shieldFreq: number = 0;
      currentEquation: string = '';
      equationText!: Phaser.GameObjects.Text;
      enemyHpText!: Phaser.GameObjects.Text;
      shieldFreqText!: Phaser.GameObjects.Text;

      constructor() { super({ key: 'Combat' }); }

      init() {
        this.enemyHp = PhaserLib.Math.Between(2, 4);
        this.newShieldFreq();
        this.currentEquation = '';
      }

      newShieldFreq() {
        this.shieldFreq = PhaserLib.Math.Between(15, 60);
        if (this.shieldFreqText) {
          this.shieldFreqText.setText(`SHIELD FREQ: ${this.shieldFreq}`);
        }
      }

      create() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.add.text(w/2, 40, 'FREQUENCY TUNING COMBAT', { fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#ff4444', fontWeight: 'bold' }).setOrigin(0.5);
        
        // Ship and Enemy
        this.add.sprite(w/4, 150, 'ship').setScale(2);
        this.add.sprite(3*w/4, 150, 'enemy').setScale(2);

        this.enemyHpText = this.add.text(3*w/4, 100, `ENEMY HULL: ${this.enemyHp}`, { fontFamily: 'monospace', fontSize: '18px', color: '#ffaaaa' }).setOrigin(0.5);
        this.shieldFreqText = this.add.text(3*w/4, 200, `SHIELD FREQ: ${this.shieldFreq}`, { fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#00ffff' }).setOrigin(0.5);

        this.add.text(w/4, 200, 'YOUR WEAPON TUNING', { fontFamily: 'monospace', fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5);
        this.equationText = this.add.text(w/2, 250, '> _', { fontFamily: 'monospace', fontSize: '24px', color: '#00ff66' }).setOrigin(0.5);

        // Numpad and operators (similar to warp)
        const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
        let bx = w/2 - 120;
        let by = 300;

        buttons.forEach((btn, i) => {
          const x = bx + (i % 4) * 80;
          const y = by + Math.floor(i / 4) * 50;

          const btnBg = this.add.rectangle(x, y, 60, 40, 0x221111).setStrokeStyle(1, 0xff4444).setInteractive({useHandCursor: true});
          const btnTxt = this.add.text(x, y, btn, { fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#ffaaaa' }).setOrigin(0.5);

          btnBg.on('pointerdown', () => this.handleInput(btn));
        });
      }

      handleInput(char: string) {
        if (char === 'C') {
          this.currentEquation = '';
        } else if (char === '=') {
          try {
            const sanitized = this.currentEquation.replace(/[^0-9+\-*/]/g, '');
            const result = new Function(`return ${sanitized}`)(); 
            if (result === this.shieldFreq) {
              playSound(this, 880, 'square', 0.2); // player hit
              this.enemyHp--;
              this.enemyHpText.setText(`ENEMY HULL: ${this.enemyHp}`);
              this.equationText.setText(`> ${this.currentEquation} = ${result} [HIT!]`);
              
              if (this.enemyHp <= 0) {
                this.time.delayedCall(1000, () => this.victory());
                return;
              } else {
                this.time.delayedCall(800, () => {
                  this.currentEquation = '';
                  this.equationText.setText('> _');
                  this.newShieldFreq();
                });
                return;
              }
            } else {
              playSound(this, 150, 'sawtooth', 0.4); // enemy hit
              gameState.fuel -= 15;
              this.equationText.setText(`> ${this.currentEquation} = ${result} [DEFLECTED!]`);
              
              // Enemy counter-attacks
              this.time.delayedCall(1000, () => {
                if (gameState.fuel <= 0) {
                  // Game over
                  window.dispatchEvent(new CustomEvent('phaser-game-over', { detail: { gameKey: 'nebula-navigator', score: gameState.credits } }));
                  this.scene.start('Boot');
                } else {
                  this.currentEquation = '';
                  this.equationText.setText('> _');
                  this.newShieldFreq();
                }
              });
              return;
            }
          } catch(e) {
            this.currentEquation = 'ERROR';
          }
        } else {
          playSound(this, 400, 'sine', 0.05);
          this.currentEquation += char;
        }
        this.equationText.setText(`> ${this.currentEquation}`);
      }

      victory() {
        const reward = PhaserLib.Math.Between(20, 50);
        gameState.credits += reward;
        gameState.inventory['Quantum Algorithms'] += PhaserLib.Math.Between(0, 1);
        
        const node = gameState.galaxy[gameState.currentNodeId];
        node.type = 'empty'; // cleared
        this.scene.start('GalaxyMap');
      }
    }

    class TradeScene extends PhaserLib.Scene {
      constructor() { super({ key: 'Trade' }); }
      create() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.add.text(w/2, 50, 'INTERSTELLAR TRADE STATION', { fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#4444ff', fontWeight: 'bold' }).setOrigin(0.5);
        
        const updateUI = () => {
          this.children.removeAll();
          this.create();
        };

        this.add.text(w/2, 120, `Credits: ${gameState.credits} | Fuel: ${gameState.fuel}/${gameState.maxFuel}`, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
        this.add.text(w/2, 150, `Cargo: Quantum Algorithms (${gameState.inventory['Quantum Algorithms']}) | Prime Data (${gameState.inventory['Prime Data']})`, { fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5);

        // Refuel
        const refuelBtn = this.add.text(w/4, 220, '[ REFUEL SHIP (10 Cr) ]', { fontFamily: 'monospace', fontSize: '16px', color: '#aaffaa' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        refuelBtn.on('pointerdown', () => {
          if (gameState.credits >= 10 && gameState.fuel < gameState.maxFuel) {
            gameState.credits -= 10;
            gameState.fuel = gameState.maxFuel;
            playSound(this, 1200, 'sine', 0.1);
            updateUI();
          } else {
            playSound(this, 200, 'sawtooth', 0.1);
          }
        });

        // Upgrade Fuel
        const upgradeBtn = this.add.text(3*w/4, 220, '[ UPGRADE MAX FUEL (50 Cr) ]', { fontFamily: 'monospace', fontSize: '16px', color: '#ffaaaa' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        upgradeBtn.on('pointerdown', () => {
          if (gameState.credits >= 50) {
            gameState.credits -= 50;
            gameState.maxFuel += 20;
            gameState.fuel += 20;
            playSound(this, 1400, 'square', 0.2);
            updateUI();
          } else {
            playSound(this, 200, 'sawtooth', 0.1);
          }
        });

        // Sell Commodities
        const sellQA = this.add.text(w/4, 300, '[ SELL QUANTUM ALGO (40 Cr) ]', { fontFamily: 'monospace', fontSize: '16px', color: '#aaffff' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        sellQA.on('pointerdown', () => {
          if (gameState.inventory['Quantum Algorithms'] > 0) {
            gameState.inventory['Quantum Algorithms']--;
            gameState.credits += 40;
            playSound(this, 1000, 'sine', 0.1);
            updateUI();
          }
        });

        const sellPD = this.add.text(3*w/4, 300, '[ SELL PRIME DATA (80 Cr) ]', { fontFamily: 'monospace', fontSize: '16px', color: '#ffaaff' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        sellPD.on('pointerdown', () => {
          if (gameState.inventory['Prime Data'] > 0) {
            gameState.inventory['Prime Data']--;
            gameState.credits += 80;
            playSound(this, 1000, 'sine', 0.1);
            updateUI();
          }
        });

        this.add.text(w/2, h - 50, '[ UNDOCK & DEPART ]', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' })
          .setOrigin(0.5).setInteractive({useHandCursor: true})
          .on('pointerdown', () => this.scene.start('GalaxyMap'));
      }
    }

    class GrandTheoremScene extends PhaserLib.Scene {
      targetFreq: number = 0;
      currentEquation: string = '';
      equationText!: Phaser.GameObjects.Text;

      constructor() { super({ key: 'GrandTheorem' }); }

      init() {
        // High difficulty target
        this.targetFreq = PhaserLib.Math.Between(150, 400);
        this.currentEquation = '';
      }

      create() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.add.rectangle(w/2, h/2, 600, 400, 0x100500).setStrokeStyle(2, 0xffaa00);
        this.add.text(w/2, h/2 - 160, 'GRAND THEOREM DISCOVERY', { fontFamily: 'Orbitron, monospace', fontSize: '24px', color: '#ffaa00', fontWeight: 'bold' }).setOrigin(0.5);
        
        this.add.text(w/2, h/2 - 120, `Solve to Claim Sector: ${this.targetFreq}`, { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

        this.equationText = this.add.text(w/2, h/2 - 60, '> _', { fontFamily: 'monospace', fontSize: '24px', color: '#ffaa00' }).setOrigin(0.5);

        // Numpad and operators
        const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
        let bx = w/2 - 120;
        let by = h/2 + 20;

        buttons.forEach((btn, i) => {
          const x = bx + (i % 4) * 80;
          const y = by + Math.floor(i / 4) * 50;

          const btnBg = this.add.rectangle(x, y, 60, 40, 0x221100).setStrokeStyle(1, 0xffaa00).setInteractive({useHandCursor: true});
          const btnTxt = this.add.text(x, y, btn, { fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#ffaa00' }).setOrigin(0.5);

          btnBg.on('pointerdown', () => this.handleInput(btn));
        });

        const retreatBtn = this.add.text(w/2, h/2 + 220, '[ ABANDON THEOREM ]', { fontFamily: 'monospace', fontSize: '14px', color: '#aaaaaa' }).setOrigin(0.5).setInteractive({useHandCursor: true});
        retreatBtn.on('pointerdown', () => this.scene.start('GalaxyMap'));
      }

      handleInput(char: string) {
        if (char === 'C') {
          this.currentEquation = '';
        } else if (char === '=') {
          try {
            const sanitized = this.currentEquation.replace(/[^0-9+\-*/]/g, '');
            const result = new Function(`return ${sanitized}`)(); 
            if (result === this.targetFreq) {
              playSound(this, 1200, 'square', 0.4);
              this.equationText.setText(`> ${this.currentEquation} = ${result} [PROVEN!]`);
              
              gameState.claimedNodes.push(gameState.currentNodeId);
              gameState.inventory['Prime Data'] += 1;

              const node = gameState.galaxy[gameState.currentNodeId];
              node.type = 'empty'; // Turn into empty node so it doesn't trigger again, but keeping id in claimedNodes makes it green
              
              this.time.delayedCall(1500, () => this.scene.start('GalaxyMap'));
              return;
            } else {
              playSound(this, 200, 'sawtooth', 0.2);
              this.equationText.setText(`> ${this.currentEquation} = ${result} [FALSIFIED!]`);
              this.time.delayedCall(800, () => {
                this.currentEquation = '';
                this.equationText.setText('> _');
              });
              return;
            }
          } catch(e) {
            this.currentEquation = 'ERROR';
          }
        } else {
          playSound(this, 600, 'sine', 0.05);
          this.currentEquation += char;
        }
        this.equationText.setText(`> ${this.currentEquation}`);
      }
    }

    return {
      scenes: [BootScene, GalaxyMapScene, WarpEquationScene, CombatScene, TradeScene, GrandTheoremScene]
    };
  }
}
