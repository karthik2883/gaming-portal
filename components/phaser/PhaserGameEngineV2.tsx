'use client';
import { useEffect, useRef } from 'react';

interface PhaserGameEngineProps {
  gameKey: string;
  width?: number;
  height?: number;
}

// Registry: add new Phaser games here
const GAME_LOADERS: Record<string, () => Promise<any>> = {
  snake:        () => import(/* webpackChunkName: "snake-game"       */ './games/SnakeGame'),
  breakout:     () => import(/* webpackChunkName: "breakout-game"    */ './games/BreakoutGame'),
  'water-sort': () => import(/* webpackChunkName: "water-sort-game"  */ './games/WaterSortGame'),
  'unblock-me': () => import(/* webpackChunkName: "unblock-me-game"  */ './games/UnblockMeGame'),
  sudoku:       () => import(/* webpackChunkName: "sudoku-game"      */ './games/SudokuGame'),
  pacman:       () => import(/* webpackChunkName: "pacman-game"      */ './games/PacmanGame'),
  tetris:       () => import(/* webpackChunkName: "tetris-game"      */ './games/TetrisGame'),
  chess:        () => import(/* webpackChunkName: "chess-game"       */ './games/ChessGame'),
  '2048':        () => import(/* webpackChunkName: "two-zero-four-eight-game" */ './games/TwoZeroFourEightGame'),
  typing:        () => import(/* webpackChunkName: "typing-nexus-game" */ './games/TypingNexusGame'),
  'neon-rider':  () => import(/* webpackChunkName: "neon-rider-game"  */ './games/NeonRiderGame'),
  'cyber-runner': () => import(/* webpackChunkName: "cyber-runner-game"  */ './games/CyberRunnerGame'),
  'flappy-bird':  () => import(/* webpackChunkName: "flappy-bird-game"  */ './games/FlappyBirdGame'),
  'bubble-shooter': () => import(/* webpackChunkName: "bubble-shooter-game" */ './games/BubbleShooterGame'),
  'fruit-slice': () => import(/* webpackChunkName: "fruit-slice-game" */ './games/FruitSliceGame'),
  'candy-match':    () => import(/* webpackChunkName: "candy-match-game"    */ './games/CandyMatchGame'),
  'football':        () => import(/* webpackChunkName: "football-game"        */ './games/FootballGame'),
  'memory-match':    () => import(/* webpackChunkName: "memory-match-game"    */ './games/MemoryMatchGame'),
  'neon-surfer':       () => import(/* webpackChunkName: "neon-surfer-game"       */ './games/NeonSurferGame'),
  'algorithm-arena':   () => import(/* webpackChunkName: "algorithm-arena-game" */ './games/AlgorithmArenaGame'),
  'nebula-navigator':  () => import(/* webpackChunkName: "nebula-navigator-game" */ './games/NebulaNavigatorGame'),
  'type-racer':        () => import(/* webpackChunkName: "type-racer-game" */ './games/TypeRacerGame'),
  jigsaw:              () => import(/* webpackChunkName: "jigsaw-game" */ './games/JigsawGame'),
  // Add your own: 'mygame': () => import('./games/MyGame'),
};

export default function PhaserGameEngine({ gameKey, width = 800, height = 600 }: PhaserGameEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    const char = value.slice(-1);
    e.target.value = '';

    const keyCode = char.charCodeAt(0);
    const keyEventInit = {
      key: char,
      code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true
    };

    window.dispatchEvent(new KeyboardEvent('keydown', keyEventInit));
    window.dispatchEvent(new KeyboardEvent('keyup', keyEventInit));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const controlKeys = ['Backspace', 'Enter', 'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'];
    if (controlKeys.includes(e.key) || e.key === ' ') {
      e.preventDefault();
      const key = e.key === ' ' ? ' ' : e.key;
      const code = e.key === ' ' ? 'Space' : e.code;
      const keyEventInit = {
        key,
        code,
        keyCode: e.keyCode,
        which: e.which,
        bubbles: true,
        cancelable: true
      };
      window.dispatchEvent(new KeyboardEvent('keydown', keyEventInit));
      window.dispatchEvent(new KeyboardEvent('keyup', keyEventInit));
    }
  };

  const handleContainerClick = () => {
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    async function initPhaser() {
      let Phaser: any;
      try {
        Phaser = (await import(/* webpackChunkName: "phaser" */ 'phaser')).default;
      } catch (err) {
        console.error('Failed to load Phaser:', err);
        return;
      }

      const makeErrorScene = (msg: string) => class extends Phaser.Scene {
        constructor() { super({ key: 'Error' }); }
        create() {
          const { width: w, height: h } = this.scale;
          this.add.text(w / 2, h / 2 - 20, msg, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff4444',
            wordWrap: { width: w - 40 }, align: 'center',
          }).setOrigin(0.5);
        }
      };

      let scenes: any[];
      const loader = GAME_LOADERS[gameKey];

      if (!loader) {
        scenes = [makeErrorScene(`Game "${gameKey}" not registered`)];
      } else {
        try {
          const mod = await loader();
          const Factory = mod.default;
          if (!Factory) throw new Error(`No default export in game module for "${gameKey}"`);
          const result = Factory.create(Phaser);
          // Support single-scene (class) or multi-scene (object with .scenes array)
          if (result && result.scenes) {
            scenes = result.scenes;
          } else if (result) {
            scenes = [result];
          } else {
            throw new Error(`Factory.create() returned null for "${gameKey}"`);
          }
        } catch (err: any) {
          console.error(`Game "${gameKey}" load error:`, err);
          scenes = [makeErrorScene(`Error loading "${gameKey}": ${err?.message || err}`)];
        }
      }

      if (destroyed || !containerRef.current) return;

      // Determine if game needs physics
      const needsPhysics = ['breakout', 'cyber-runner', 'flappy-bird', 'fruit-slice'].includes(gameKey);

      try {
        gameRef.current = new Phaser.Game({
          type: Phaser.AUTO,
          width,
          height,
          backgroundColor: '#08080f',
          parent: containerRef.current,
          scene: scenes,
          physics: needsPhysics
            ? { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } }
            : undefined,
          scale: {
            // FIT — scales canvas CSS size to fill the parent while maintaining
            // aspect ratio. The parent (phaser-host/gameWrapper) has an explicit
            // stable height so FIT won't cause a grow loop.
            // No autoCenter — CSS flexbox in .phaser-host handles centering,
            // preventing the JS margin vs CSS flexbox conflict that shifts games right.
            mode: Phaser.Scale.FIT,
          },
        });
      } catch (err) {
        console.error('Phaser Game init error:', err);
      }
    }

    initPhaser();

    return () => {
      destroyed = true;
      if (gameRef.current) {
        try { gameRef.current.destroy(true); } catch {}
        gameRef.current = null;
      }
    };
  }, [gameKey, width, height]);

  return (
    <div
      ref={containerRef}
      className="phaser-host"
      onClick={handleContainerClick}
      // Dimensions are controlled by globals.css (.phaser-host canvas rules).
      // Do NOT set width/height here — let CSS max-width/height:auto do the scaling.
    >
      <input
        ref={inputRef}
        type="text"
        style={{
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  );
}

