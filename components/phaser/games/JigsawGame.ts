// JigsawGame.ts — Dynamic jigsaw puzzle game for FlipTrip Games portal.
// Procedurally renders comic characters and beautiful scenic backdrops.

export default class JigsawGameFactory {
  static create(PhaserLib: any) {

    // ── DIFFICULTY PRESETS ──────────────────────────────────────────────────
    const DIFFICULTIES: Record<string, { cols: number; rows: number; label: string; time: number }> = {
      easy:   { cols: 3, rows: 3, label: 'EASY', time: 180 },   // 9 pieces (200x150)
      medium: { cols: 4, rows: 4, label: 'MEDIUM', time: 300 }, // 16 pieces (150x112)
      hard:   { cols: 5, rows: 5, label: 'HARD', time: 480 },   // 25 pieces (120x90)
    };

    // ── LEVEL PRESETS (SCENES) ──────────────────────────────────────────────
    const LEVELS = [
      {
        name: 'Cyber Ninja',
        location: 'Neo Tokyo Rooftops',
        color: 0x00d4ff,
        glow: '#00d4ff',
        secondary: 0xff00aa,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Background Gradient
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#040212');
          bg.addColorStop(0.6, '#0b0424');
          bg.addColorStop(1, '#20002c');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Grid dots in sky
          ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
          for (let x = 15; x < W; x += 30) {
            for (let y = 15; y < H * 0.6; y += 30) {
              ctx.beginPath();
              ctx.arc(x, y, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Luminous Moon
          const grad = ctx.createRadialGradient(W * 0.75, H * 0.35, 10, W * 0.75, H * 0.35, 120);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.2, 'rgba(0, 212, 255, 0.8)');
          grad.addColorStop(0.5, 'rgba(255, 0, 170, 0.3)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(W * 0.75, H * 0.35, 120, 0, Math.PI * 2);
          ctx.fill();

          // Silhouette Skyline
          const buildWidths = [70, 90, 80, 110, 75, 120, 95];
          const buildHeights = [180, 240, 210, 280, 200, 260, 220];
          let bx = 0;
          ctx.fillStyle = '#080517';
          buildWidths.forEach((bw, i) => {
            const bh = buildHeights[i];
            ctx.fillRect(bx, H - bh, bw, bh);

            // Neon window lines
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
            ctx.lineWidth = 1.5;
            for (let wx = bx + 12; wx < bx + bw - 10; wx += 20) {
              for (let wy = H - bh + 20; wy < H - 20; wy += 40) {
                ctx.beginPath();
                ctx.rect(wx, wy, 8, 12);
                ctx.stroke();
                if (Math.random() > 0.45) {
                  ctx.fillStyle = Math.random() > 0.5 ? '#00d4ff' : '#ff00aa';
                  ctx.fillRect(wx, wy, 8, 12);
                  ctx.fillStyle = '#080517';
                }
              }
            }
            bx += bw - 2;
          });

          // Main rooftop in foreground
          ctx.fillStyle = '#030209';
          ctx.fillRect(50, H - 90, W - 100, 90);
          ctx.strokeStyle = '#ff00aa';
          ctx.lineWidth = 4;
          ctx.strokeRect(50, H - 90, W - 100, 4);

          // Ninja Superhero Silhouette
          const nx = W * 0.35;
          const ny = H - 90;
          ctx.fillStyle = '#030209';
          ctx.strokeStyle = '#00d4ff';
          ctx.lineWidth = 2.5;

          // Head / Mask
          ctx.beginPath();
          ctx.arc(nx, ny - 100, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Glowing Cyan Eyes
          ctx.fillStyle = '#00d4ff';
          ctx.beginPath();
          ctx.ellipse(nx - 5, ny - 102, 3, 1.5, 0.1, 0, Math.PI * 2);
          ctx.ellipse(nx + 5, ny - 102, 3, 1.5, -0.1, 0, Math.PI * 2);
          ctx.fill();

          // Mask tails
          ctx.strokeStyle = '#ff00aa';
          ctx.beginPath();
          ctx.moveTo(nx - 12, ny - 98);
          ctx.quadraticCurveTo(nx - 28, ny - 95, nx - 35, ny - 110);
          ctx.moveTo(nx - 12, ny - 98);
          ctx.quadraticCurveTo(nx - 24, ny - 88, nx - 30, ny - 92);
          ctx.stroke();

          // Body / Shoulders / Scarf
          ctx.fillStyle = '#030209';
          ctx.strokeStyle = '#00d4ff';
          ctx.beginPath();
          ctx.moveTo(nx - 20, ny - 85);
          ctx.lineTo(nx + 20, ny - 85);
          ctx.lineTo(nx + 15, ny - 45);
          ctx.lineTo(nx - 15, ny - 45);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Neon chest runes
          ctx.strokeStyle = '#00d4ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(nx - 6, ny - 75);
          ctx.lineTo(nx + 6, ny - 75);
          ctx.moveTo(nx, ny - 80);
          ctx.lineTo(nx, ny - 55);
          ctx.stroke();

          // Legs / Stance
          ctx.fillStyle = '#030209';
          ctx.strokeStyle = '#00d4ff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(nx - 12, ny - 45);
          ctx.lineTo(nx - 25, ny);
          ctx.lineTo(nx - 12, ny);
          ctx.lineTo(nx - 5, ny - 45);
          ctx.moveTo(nx + 12, ny - 45);
          ctx.lineTo(nx + 25, ny);
          ctx.lineTo(nx + 12, ny);
          ctx.lineTo(nx + 5, ny - 45);
          ctx.stroke();

          // Neon Sword (Katana) in Hand
          ctx.shadowColor = '#ff00aa';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = '#ff00aa';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(nx + 10, ny - 65);
          ctx.lineTo(nx + 75, ny - 130);
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      },
      {
        name: 'Cosmic Explorer',
        location: 'Nebula Horizon',
        color: 0xcc88ff,
        glow: '#cc88ff',
        secondary: 0x00ffff,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Dark space gradient
          const bg = ctx.createLinearGradient(0, 0, W, H);
          bg.addColorStop(0, '#00000a');
          bg.addColorStop(0.5, '#0b001a');
          bg.addColorStop(1, '#1b002c');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Nebula dust clouds
          const nG1 = ctx.createRadialGradient(W * 0.3, H * 0.4, 20, W * 0.3, H * 0.4, 180);
          nG1.addColorStop(0, 'rgba(0, 255, 255, 0.22)');
          nG1.addColorStop(0.5, 'rgba(204, 136, 255, 0.12)');
          nG1.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = nG1;
          ctx.beginPath();
          ctx.arc(W * 0.3, H * 0.4, 180, 0, Math.PI * 2);
          ctx.fill();

          const nG2 = ctx.createRadialGradient(W * 0.7, H * 0.6, 10, W * 0.7, H * 0.6, 150);
          nG2.addColorStop(0, 'rgba(255, 0, 170, 0.18)');
          nG2.addColorStop(0.6, 'rgba(11, 0, 26, 0.08)');
          nG2.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = nG2;
          ctx.beginPath();
          ctx.arc(W * 0.7, H * 0.6, 150, 0, Math.PI * 2);
          ctx.fill();

          // Stars
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 60; i++) {
            const sx = Math.random() * W;
            const sy = Math.random() * H;
            const sr = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
          }

          // Gas Giant Planet & Ring
          const px = W * 0.72;
          const py = H * 0.28;
          // Rings behind planet
          ctx.strokeStyle = 'rgba(204, 136, 255, 0.4)';
          ctx.lineWidth = 10;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-0.25);
          ctx.scale(2.5, 0.45);
          ctx.beginPath();
          ctx.arc(0, 0, 48, Math.PI, 2 * Math.PI); // back half of ring
          ctx.stroke();
          ctx.restore();

          // Planet Body
          const pGrad = ctx.createLinearGradient(px - 35, py - 35, px + 35, py + 35);
          pGrad.addColorStop(0, '#cc88ff');
          pGrad.addColorStop(0.4, '#1b002c');
          pGrad.addColorStop(1, '#020005');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(px, py, 35, 0, Math.PI * 2);
          ctx.fill();

          // Rings in front of planet
          ctx.strokeStyle = 'rgba(204, 136, 255, 0.6)';
          ctx.lineWidth = 10;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-0.25);
          ctx.scale(2.5, 0.45);
          ctx.beginPath();
          ctx.arc(0, 0, 48, 0, Math.PI); // front half of ring
          ctx.stroke();
          ctx.restore();

          // Asteroid asteroid surface
          ctx.fillStyle = '#06020c';
          ctx.strokeStyle = '#cc88ff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-20, H + 10);
          ctx.lineTo(120, H - 70);
          ctx.lineTo(260, H - 40);
          ctx.lineTo(410, H - 85);
          ctx.lineTo(W + 20, H - 30);
          ctx.lineTo(W + 20, H + 20);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Astronaut standing silhouette
          const ax = 220;
          const ay = H - 50;

          // Body
          ctx.fillStyle = '#06020c';
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ax, ay - 46, 12, 0, Math.PI * 2); // helmet
          ctx.fill();
          ctx.stroke();

          // Visor Gold Glow
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(ax + 4, ay - 46, 7, -Math.PI / 2, Math.PI / 2);
          ctx.fill();

          // Suit
          ctx.fillStyle = '#06020c';
          ctx.strokeStyle = '#00ffff';
          ctx.beginPath();
          ctx.rect(ax - 10, ay - 34, 20, 28); // torso
          ctx.fill();
          ctx.stroke();

          // Life support backpack
          ctx.fillStyle = '#06020c';
          ctx.strokeStyle = '#cc88ff';
          ctx.strokeRect(ax - 15, ay - 32, 5, 22);

          // Legs
          ctx.beginPath();
          ctx.moveTo(ax - 6, ay - 6);
          ctx.lineTo(ax - 8, ay + 15);
          ctx.moveTo(ax + 6, ay - 6);
          ctx.lineTo(ax + 8, ay + 15);
          ctx.stroke();
        }
      },
      {
        name: 'Elven Sorceress',
        location: 'Fantasy Glade',
        color: 0x39ff14,
        glow: '#39ff14',
        secondary: 0xffd700,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Forest background
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#020e06');
          bg.addColorStop(0.6, '#032009');
          bg.addColorStop(1, '#0c071a');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Glowing magic mushrooms
          ctx.fillStyle = 'rgba(57, 255, 20, 0.3)';
          const mX = [80, 110, 480, 520];
          const mY = [H - 40, H - 35, H - 45, H - 40];
          mX.forEach((mx, i) => {
            const my = mY[i];
            ctx.beginPath();
            ctx.arc(mx, my, 8, Math.PI, 0); // cap
            ctx.fill();
            ctx.fillRect(mx - 2, my, 4, 10); // stem
          });

          // Forest Ancient Tree Silhouettes
          ctx.fillStyle = '#010903';
          ctx.fillRect(0, 0, 45, H);
          ctx.fillRect(W - 55, 0, 55, H);

          ctx.beginPath();
          ctx.ellipse(30, 80, 90, 60, 0, 0, Math.PI * 2);
          ctx.ellipse(W - 40, 100, 100, 70, 0, 0, Math.PI * 2);
          ctx.fill();

          // Ground
          ctx.fillStyle = '#010502';
          ctx.fillRect(0, H - 30, W, 30);

          // Sorceress standing central
          const sx = W * 0.45;
          const sy = H - 30;

          // Head / hair
          ctx.fillStyle = '#010502';
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy - 90, 11, 0, Math.PI * 2); // head
          ctx.fill();
          ctx.stroke();

          // Hair details
          ctx.strokeStyle = '#ffd700';
          ctx.beginPath();
          ctx.moveTo(sx - 10, sy - 92);
          ctx.lineTo(sx - 15, sy - 65);
          ctx.moveTo(sx + 10, sy - 92);
          ctx.lineTo(sx + 15, sy - 65);
          ctx.stroke();

          // Robe / Body
          ctx.fillStyle = '#010502';
          ctx.strokeStyle = '#39ff14';
          ctx.beginPath();
          ctx.moveTo(sx - 14, sy - 79);
          ctx.lineTo(sx + 14, sy - 79);
          ctx.lineTo(sx + 24, sy);
          ctx.lineTo(sx - 24, sy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Casting arms holding a glowing spell orb
          ctx.strokeStyle = '#39ff14';
          ctx.beginPath();
          ctx.moveTo(sx - 12, sy - 70);
          ctx.lineTo(sx - 26, sy - 82);
          ctx.moveTo(sx + 12, sy - 70);
          ctx.lineTo(sx + 26, sy - 82);
          ctx.stroke();

          // Giant Spell Magic Circle
          const mx = sx;
          const my = sy - 90;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(mx, my, 42, 0, Math.PI * 2);
          ctx.stroke();

          // Outer magical glyphs
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(57, 255, 20, 0.8)';
          ctx.beginPath();
          ctx.arc(mx, my, 48, 0, Math.PI * 2);
          ctx.stroke();

          // Rays from magical orb
          ctx.strokeStyle = '#39ff14';
          ctx.lineWidth = 1.5;
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const rx = mx + Math.cos(a) * 42;
            const ry = my + Math.sin(a) * 42;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(rx, ry);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
        }
      },
      {
        name: 'Retro Mech',
        location: 'Desert Outpost',
        color: 0xff8800,
        glow: '#ff8800',
        secondary: 0xff4444,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Warm desert gradient
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#2b0808');
          bg.addColorStop(0.5, '#5d1b06');
          bg.addColorStop(1, '#9e370a');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Double Suns setting
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.arc(W * 0.45, H * 0.45, 45, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff8800';
          ctx.beginPath();
          ctx.arc(W * 0.58, H * 0.52, 25, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Canyon mountains silhouette
          ctx.fillStyle = '#1e0503';
          ctx.beginPath();
          ctx.moveTo(-10, H);
          ctx.lineTo(80, H - 120);
          ctx.lineTo(150, H - 150);
          ctx.lineTo(240, H - 110);
          ctx.lineTo(380, H - 180);
          ctx.lineTo(490, H - 130);
          ctx.lineTo(W + 10, H - 160);
          ctx.lineTo(W + 10, H);
          ctx.closePath();
          ctx.fill();

          // Foreground outpost platform
          ctx.fillStyle = '#080101';
          ctx.fillRect(100, H - 60, W - 200, 60);
          ctx.strokeStyle = '#ff4444';
          ctx.lineWidth = 3;
          ctx.strokeRect(100, H - 60, W - 200, 3);

          // Outpost antenna
          ctx.strokeStyle = '#ff8800';
          ctx.beginPath();
          ctx.moveTo(140, H - 60);
          ctx.lineTo(140, H - 110);
          ctx.stroke();
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(140, H - 110, 4, 0, Math.PI * 2);
          ctx.fill();

          // Giant Mech silhouette
          const rx = W * 0.5;
          const ry = H - 60;

          ctx.fillStyle = '#080101';
          ctx.strokeStyle = '#ff8800';
          ctx.lineWidth = 2.5;

          // Head blocky
          ctx.beginPath();
          ctx.rect(rx - 12, ry - 115, 24, 18);
          ctx.fill();
          ctx.stroke();

          // Glowing visor eye (red)
          ctx.fillStyle = '#ff4444';
          ctx.fillRect(rx - 8, ry - 108, 16, 4);

          // Torso / Armored chest
          ctx.fillStyle = '#080101';
          ctx.strokeStyle = '#ff8800';
          ctx.beginPath();
          ctx.rect(rx - 22, ry - 97, 44, 48);
          ctx.fill();
          ctx.stroke();

          // Shoulder pods
          ctx.fillRect(rx - 32, ry - 97, 10, 15);
          ctx.strokeRect(rx - 32, ry - 97, 10, 15);
          ctx.fillRect(rx + 22, ry - 97, 10, 15);
          ctx.strokeRect(rx + 22, ry - 97, 10, 15);

          // Arms / Cannons
          ctx.beginPath();
          // Left arm
          ctx.moveTo(rx - 28, ry - 82);
          ctx.lineTo(rx - 45, ry - 60);
          ctx.lineTo(rx - 45, ry - 40);
          // Right arm cannon
          ctx.moveTo(rx + 28, ry - 82);
          ctx.lineTo(rx + 42, ry - 65);
          ctx.lineTo(rx + 50, ry - 80); // aiming up
          ctx.stroke();

          // Legs / Pistons
          ctx.beginPath();
          ctx.rect(rx - 18, ry - 49, 10, 49);
          ctx.rect(rx + 8, ry - 49, 10, 49);
          ctx.fill();
          ctx.stroke();
        }
      },
      {
        name: 'Atlantis Guardian',
        location: 'Abyssal Deep',
        color: 0x00ffff,
        glow: '#00ffff',
        secondary: 0xffd700,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Deep ocean gradient
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#020516');
          bg.addColorStop(0.6, '#031427');
          bg.addColorStop(1, '#05293d');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Sunlight rays from top
          ctx.fillStyle = 'rgba(0, 255, 255, 0.04)';
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(80 + i * 120, 0);
            ctx.lineTo(160 + i * 140, H);
            ctx.lineTo(60 + i * 140, H);
            ctx.closePath();
            ctx.fill();
          }

          // Bioluminescent Jellyfish
          ctx.fillStyle = 'rgba(0, 255, 255, 0.22)';
          ctx.strokeStyle = '#00ffff';
          const jX = [120, 480, 540];
          const jY = [110, 160, 280];
          jX.forEach((jx, i) => {
            const jy = jY[i];
            ctx.beginPath();
            ctx.arc(jx, jy, 12, Math.PI, 0); // bell
            ctx.fill();
            ctx.stroke();
            // tentacles
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(jx - 6, jy); ctx.lineTo(jx - 8, jy + 25);
            ctx.moveTo(jx, jy); ctx.lineTo(jx, jy + 30);
            ctx.moveTo(jx + 6, jy); ctx.lineTo(jx + 8, jy + 25);
            ctx.stroke();
          });

          // Sunken Temple Pillars
          ctx.fillStyle = '#020914';
          ctx.fillRect(60, H - 240, 35, 240);
          ctx.fillRect(480, H - 280, 40, 280);

          // Ocean floor
          ctx.fillStyle = '#01050b';
          ctx.fillRect(0, H - 25, W, 25);

          // Underwater Guardian Superhero Silhouette
          const gx = W * 0.45;
          const gy = H - 25;

          ctx.fillStyle = '#01050b';
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2.5;

          // Head / Fin helmet
          ctx.beginPath();
          ctx.arc(gx, gy - 85, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Fin crest
          ctx.strokeStyle = '#ffd700';
          ctx.beginPath();
          ctx.moveTo(gx, gy - 96);
          ctx.quadraticCurveTo(gx - 4, gy - 108, gx - 10, gy - 102);
          ctx.stroke();

          // Body / Torso
          ctx.strokeStyle = '#00ffff';
          ctx.beginPath();
          ctx.moveTo(gx - 16, gy - 74);
          ctx.lineTo(gx + 16, gy - 74);
          ctx.lineTo(gx + 11, gy - 40);
          ctx.lineTo(gx - 11, gy - 40);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Arm holding Trident
          ctx.beginPath();
          ctx.moveTo(gx - 13, gy - 65);
          ctx.lineTo(gx - 32, gy - 55);
          ctx.stroke();

          // Glowing Golden Trident
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 12;
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          // Shaft
          ctx.moveTo(gx - 32, gy - 120);
          ctx.lineTo(gx - 32, gy + 10);
          // Head
          ctx.moveTo(gx - 40, gy - 112);
          ctx.lineTo(gx - 40, gy - 122);
          ctx.moveTo(gx - 24, gy - 112);
          ctx.lineTo(gx - 24, gy - 122);
          ctx.moveTo(gx - 40, gy - 112);
          ctx.lineTo(gx - 24, gy - 112);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      },
      {
        name: 'Steampunk Aviator',
        location: 'Cloud Kingdom',
        color: 0xffd700,
        glow: '#ffd700',
        secondary: 0xcc88ff,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Sunset Cloud sky
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#3d1c02');
          bg.addColorStop(0.5, '#754009');
          bg.addColorStop(1, '#b37715');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Golden clouds
          ctx.fillStyle = 'rgba(212, 154, 23, 0.22)';
          ctx.beginPath();
          ctx.arc(100, H * 0.45, 60, 0, Math.PI * 2);
          ctx.arc(180, H * 0.4, 80, 0, Math.PI * 2);
          ctx.arc(260, H * 0.5, 70, 0, Math.PI * 2);
          ctx.arc(480, H * 0.35, 75, 0, Math.PI * 2);
          ctx.fill();

          // Floating Island Castle Silhouette
          ctx.fillStyle = '#1f1103';
          ctx.beginPath();
          ctx.moveTo(W * 0.65, H * 0.45);
          ctx.lineTo(W * 0.85, H * 0.45);
          ctx.lineTo(W * 0.9, H * 0.58);
          ctx.lineTo(W * 0.75, H * 0.68);
          ctx.lineTo(W * 0.6, H * 0.55);
          ctx.closePath();
          ctx.fill();
          // Tower on island
          ctx.fillRect(W * 0.72, H * 0.33, 20, 50);

          // Foreground Airship wood deck
          ctx.fillStyle = '#0b0601';
          ctx.fillRect(0, H - 45, W, 45);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(0, H - 45, W, 3);

          // Steam gears on deck
          ctx.strokeStyle = 'rgba(212, 154, 23, 0.4)';
          ctx.beginPath();
          ctx.arc(60, H - 22, 16, 0, Math.PI * 2);
          ctx.stroke();

          // Pilot silhouette standing
          const px = W * 0.25;
          const py = H - 45;

          ctx.fillStyle = '#0b0601';
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2.5;

          // Head with goggles
          ctx.beginPath();
          ctx.arc(px, py - 78, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Glowing neon cyan Goggles
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(px - 3, py - 78, 3, 0, Math.PI * 2);
          ctx.arc(px + 3, py - 78, 3, 0, Math.PI * 2);
          ctx.fill();

          // Coat / Torso (windswept coat tails)
          ctx.fillStyle = '#0b0601';
          ctx.strokeStyle = '#ffd700';
          ctx.beginPath();
          ctx.moveTo(px - 12, py - 68);
          ctx.lineTo(px + 12, py - 68);
          ctx.lineTo(px + 8, py - 35);
          ctx.lineTo(px - 26, py - 38); // wind blowing coat tail left
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Legs
          ctx.beginPath();
          ctx.moveTo(px - 6, py - 35);
          ctx.lineTo(px - 8, py);
          ctx.moveTo(px + 6, py - 35);
          ctx.lineTo(px + 8, py);
          ctx.stroke();
        }
      },
      {
        name: 'Neon Dragon',
        location: 'Cyber Kyoto Shrine',
        color: 0xff00aa,
        glow: '#ff00aa',
        secondary: 0x00ffff,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Retro Synthwave Sunset Gradient
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#1a0033');
          bg.addColorStop(0.5, '#4d004d');
          bg.addColorStop(1, '#ff3366');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Wireframe horizontal lines in ground
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1;
          for (let y = H - 80; y < H; y += 15) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
          }

          // Giant Retro Sun
          const sunGrad = ctx.createLinearGradient(W / 2, H * 0.2, W / 2, H * 0.7);
          sunGrad.addColorStop(0, '#ffd700');
          sunGrad.addColorStop(1, '#ff00aa');
          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(W / 2, H * 0.45, 80, 0, Math.PI * 2);
          ctx.fill();

          // Synthwave Sun lines (horizontal cuts)
          ctx.fillStyle = '#1a0033';
          for (let y = H * 0.35; y < H * 0.65; y += 12) {
            const cutH = 3 + (y - H * 0.35) * 0.15;
            ctx.fillRect(W / 2 - 90, y, 180, cutH);
          }

          // Pagoda Shrine Silhouette on left
          ctx.fillStyle = '#06010d';
          ctx.fillRect(40, H - 180, 70, 100); // base tower
          // roof 1
          ctx.beginPath();
          ctx.moveTo(25, H - 180);
          ctx.lineTo(125, H - 180);
          ctx.lineTo(110, H - 195);
          ctx.lineTo(40, H - 195);
          ctx.closePath();
          ctx.fill();
          // second tier tower
          ctx.fillRect(52, H - 240, 46, 45);
          // roof 2
          ctx.beginPath();
          ctx.moveTo(35, H - 240);
          ctx.lineTo(115, H - 240);
          ctx.lineTo(102, H - 252);
          ctx.lineTo(48, H - 252);
          ctx.closePath();
          ctx.fill();
          // spire
          ctx.fillRect(72, H - 280, 6, 28);

          // Cherry Blossom Tree on right
          ctx.fillStyle = '#06010d';
          // trunk
          ctx.beginPath();
          ctx.moveTo(W - 60, H - 80);
          ctx.lineTo(W - 90, H - 160);
          ctx.lineTo(W - 75, H - 160);
          ctx.lineTo(W - 50, H - 80);
          ctx.closePath();
          ctx.fill();
          // branches
          ctx.beginPath();
          ctx.moveTo(W - 90, H - 160);
          ctx.quadraticCurveTo(W - 130, H - 180, W - 150, H - 170);
          ctx.moveTo(W - 80, H - 160);
          ctx.quadraticCurveTo(W - 100, H - 210, W - 110, H - 230);
          ctx.stroke();

          // Glowing Cherry Blossom dots (magenta/pink)
          ctx.fillStyle = '#ff00aa';
          ctx.shadowColor = '#ff00aa';
          ctx.shadowBlur = 10;
          const dots = [
            [W - 150, H - 170], [W - 140, H - 180], [W - 160, H - 165],
            [W - 110, H - 230], [W - 120, H - 240], [W - 95, H - 225],
            [W - 130, H - 200], [W - 80, H - 190], [W - 100, H - 175]
          ];
          dots.forEach(d => {
            ctx.beginPath();
            ctx.arc(d[0], d[1], 6, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.shadowBlur = 0;

          // Majestic Dragon Silhouette coiling in sky
          ctx.fillStyle = '#06010d';
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 8;

          // Dragon Body curve
          ctx.beginPath();
          ctx.moveTo(W * 0.3, H * 0.45);
          ctx.quadraticCurveTo(W * 0.35, H * 0.28, W * 0.48, H * 0.38);
          ctx.quadraticCurveTo(W * 0.6, H * 0.48, W * 0.68, H * 0.33);
          ctx.quadraticCurveTo(W * 0.72, H * 0.2, W * 0.78, H * 0.26);
          ctx.lineTo(W * 0.8, H * 0.24); // tail spike
          ctx.stroke();

          // Dragon Head
          const dhx = W * 0.3;
          const dhy = H * 0.45;
          ctx.beginPath();
          ctx.arc(dhx, dhy, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Horns / snout
          ctx.beginPath();
          ctx.moveTo(dhx - 8, dhy - 10);
          ctx.lineTo(dhx - 20, dhy - 18);
          ctx.moveTo(dhx + 6, dhy - 12);
          ctx.lineTo(dhx, dhy - 24);
          // jaw
          ctx.moveTo(dhx - 12, dhy + 4);
          ctx.lineTo(dhx - 25, dhy + 10);
          ctx.stroke();

          // Glowing eye (cyan)
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(dhx - 6, dhy - 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      },
      {
        name: 'Miami Surf',
        location: 'Synthwave Beach',
        color: 0x00ffff,
        glow: '#00ffff',
        secondary: 0xffaa00,
        draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => {
          // Sunset sky gradient: Orange to purple
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#f12711');
          bg.addColorStop(0.6, '#f5af19');
          bg.addColorStop(1, '#e65c00');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);

          // Giant magenta neon sun in center
          const sunGrad = ctx.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, 90);
          sunGrad.addColorStop(0, '#ff00aa');
          sunGrad.addColorStop(0.6, '#ff0055');
          sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(W / 2, H * 0.45, 95, 0, Math.PI * 2);
          ctx.fill();

          // Reflective Synthwave Ocean in foreground (with grid lines)
          ctx.fillStyle = '#1c0522';
          ctx.fillRect(0, H - 120, W, 120);

          ctx.strokeStyle = '#ff00aa';
          ctx.lineWidth = 1.5;
          // Horizontal perspective grid lines
          for (let y = H - 120; y < H; y += 16) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
          }

          // Palm tree silhouettes on left
          ctx.fillStyle = '#0a010d';
          // Left Trunk
          ctx.beginPath();
          ctx.moveTo(80, H);
          ctx.quadraticCurveTo(60, H - 110, 45, H - 190);
          ctx.quadraticCurveTo(72, H - 110, 95, H);
          ctx.closePath();
          ctx.fill();

          // Left Palm Leaves
          ctx.strokeStyle = '#0a010d';
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          const leavesL = [
            [45, H - 190, 10, H - 230],
            [45, H - 190, -5, H - 200],
            [45, H - 190, 80, H - 220],
            [45, H - 190, 95, H - 170],
            [45, H - 190, 20, H - 165]
          ];
          leavesL.forEach(l => {
            ctx.beginPath();
            ctx.moveTo(l[0], l[1]);
            ctx.quadraticCurveTo(l[2], l[3] + 10, l[2], l[3]);
            ctx.stroke();
          });

          // Palm tree silhouettes on right
          // Right Trunk
          ctx.beginPath();
          ctx.moveTo(W - 80, H);
          ctx.quadraticCurveTo(W - 60, H - 100, W - 50, H - 170);
          ctx.quadraticCurveTo(W - 72, H - 100, W - 95, H);
          ctx.closePath();
          ctx.fill();

          // Right Palm Leaves
          const leavesR = [
            [W - 50, H - 170, W - 10, H - 200],
            [W - 50, H - 170, W - 20, H - 145],
            [W - 50, H - 170, W - 90, H - 200],
            [W - 50, H - 170, W - 110, H - 150],
            [W - 50, H - 170, W - 80, H - 130]
          ];
          leavesR.forEach(l => {
            ctx.beginPath();
            ctx.moveTo(l[0], l[1]);
            ctx.quadraticCurveTo(l[2], l[3] + 10, l[2], l[3]);
            ctx.stroke();
          });

          // Cool cyber-car profile driving along horizon grid
          const cx = W * 0.45;
          const cy = H - 132;
          ctx.fillStyle = '#0a010d';
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 6;
          // Car chassis
          ctx.beginPath();
          ctx.moveTo(cx - 35, cy);
          ctx.lineTo(cx - 35, cy - 8);
          ctx.lineTo(cx - 20, cy - 8);
          ctx.lineTo(cx - 10, cy - 18);
          ctx.lineTo(cx + 15, cy - 18);
          ctx.lineTo(cx + 28, cy - 6);
          ctx.lineTo(cx + 40, cy - 6);
          ctx.lineTo(cx + 40, cy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Wheels (neon circles)
          ctx.fillStyle = '#0a010d';
          ctx.beginPath();
          ctx.arc(cx - 20, cy, 7, 0, Math.PI * 2);
          ctx.arc(cx + 22, cy, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Taillight glow (orange/red)
          ctx.fillStyle = '#ff3300';
          ctx.beginPath();
          ctx.arc(cx - 32, cy - 5, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    ];

    // ── JIGSAW EDGE PATH BUILDER ────────────────────────────────────────────
    function drawJigsawPath(
      ctx: CanvasRenderingContext2D,
      x0: number, y0: number,
      w: number, h: number,
      top: number, right: number, bottom: number, left: number,
      tabSize: number
    ) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);

      // 1. TOP EDGE (Left to Right)
      if (top === 0) {
        ctx.lineTo(x0 + w, y0);
      } else {
        const cx = x0 + w / 2;
        const depth = tabSize * 1.35 * top; // loop goes up (outward) if top = 1
        const neck = tabSize * 0.45;
        const head = tabSize * 0.85;

        ctx.lineTo(cx - tabSize, y0);
        ctx.bezierCurveTo(cx - tabSize, y0 - depth * 0.2, cx - tabSize * 0.9, y0 - depth * 0.4, cx - neck, y0 - depth * 0.4);
        ctx.bezierCurveTo(cx - head, y0 - depth * 0.8, cx - head * 0.5, y0 - depth, cx, y0 - depth);
        ctx.bezierCurveTo(cx + head * 0.5, y0 - depth, cx + head, y0 - depth * 0.8, cx + neck, y0 - depth * 0.4);
        ctx.bezierCurveTo(cx + tabSize * 0.9, y0 - depth * 0.4, cx + tabSize, y0 - depth * 0.2, cx + tabSize, y0);
        ctx.lineTo(x0 + w, y0);
      }

      // 2. RIGHT EDGE (Top to Bottom)
      if (right === 0) {
        ctx.lineTo(x0 + w, y0 + h);
      } else {
        const cy = y0 + h / 2;
        const depth = tabSize * 1.35 * right; // loop goes right (outward) if right = 1
        const neck = tabSize * 0.45;
        const head = tabSize * 0.85;

        ctx.lineTo(x0 + w, cy - tabSize);
        ctx.bezierCurveTo(x0 + w + depth * 0.2, cy - tabSize, x0 + w + depth * 0.4, cy - tabSize * 0.9, x0 + w + depth * 0.4, cy - neck);
        ctx.bezierCurveTo(x0 + w + depth * 0.8, cy - head, x0 + w + depth, cy - head * 0.5, x0 + w + depth, cy);
        ctx.bezierCurveTo(x0 + w + depth, cy + head * 0.5, x0 + w + depth * 0.7, cy + head, x0 + w + depth * 0.4, cy + neck);
        ctx.bezierCurveTo(x0 + w + depth * 0.4, cy + tabSize * 0.9, x0 + w + depth * 0.2, cy + tabSize, x0 + w, cy + tabSize);
        ctx.lineTo(x0 + w, y0 + h);
      }

      // 3. BOTTOM EDGE (Right to Left)
      if (bottom === 0) {
        ctx.lineTo(x0, y0 + h);
      } else {
        const cx = x0 + w / 2;
        const depth = tabSize * 1.35 * bottom; // loop goes down (outward) if bottom = 1
        const neck = tabSize * 0.45;
        const head = tabSize * 0.85;

        ctx.lineTo(cx + tabSize, y0 + h);
        ctx.bezierCurveTo(cx + tabSize, y0 + h + depth * 0.2, cx + tabSize * 0.9, y0 + h + depth * 0.4, cx + neck, y0 + h + depth * 0.4);
        ctx.bezierCurveTo(cx + head, y0 + h + depth * 0.8, cx + head * 0.5, y0 + h + depth, cx, y0 + h + depth);
        ctx.bezierCurveTo(cx - head * 0.5, y0 + h + depth, cx - head, y0 + h + depth * 0.8, cx - neck, y0 + h + depth * 0.4);
        ctx.bezierCurveTo(cx - tabSize * 0.9, y0 + h + depth * 0.4, cx - tabSize, y0 + h + depth * 0.2, cx - tabSize, y0 + h);
        ctx.lineTo(x0, y0 + h);
      }

      // 4. LEFT EDGE (Bottom to Top)
      if (left === 0) {
        ctx.lineTo(x0, y0);
      } else {
        const cy = y0 + h / 2;
        const depth = tabSize * 1.35 * left; // loop goes left (outward) if left = 1
        const neck = tabSize * 0.45;
        const head = tabSize * 0.85;

        ctx.lineTo(x0, cy + tabSize);
        ctx.bezierCurveTo(x0 - depth * 0.2, cy + tabSize, x0 - depth * 0.4, cy + tabSize * 0.9, x0 - depth * 0.4, cy + neck);
        ctx.bezierCurveTo(x0 - depth * 0.8, cy + head, x0 - depth, cy + head * 0.5, x0 - depth, cy);
        ctx.bezierCurveTo(x0 - depth, cy - head * 0.5, x0 - depth * 0.7, cy - head, x0 - depth * 0.25, cy - neck);
        ctx.bezierCurveTo(x0 - depth * 0.4, cy - tabSize * 0.9, x0 - depth * 0.2, cy - tabSize, x0, cy - tabSize);
        ctx.lineTo(x0, y0);
      }

      ctx.closePath();
    }

    // ── AUDIO OSCILLATOR CHIME SYNTH ─────────────────────────────────────────
    function playTone(ctx: AudioContext, freq: number, type: OscillatorType, gain: number, start: number, dur: number) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(gain, start);
      vol.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    }

    // ────────────────────────────────────────────────────────────────────────
    //  SCENE 1: MenuScene (Level & Difficulty Selection)
    // ────────────────────────────────────────────────────────────────────────
    class MenuScene extends PhaserLib.Scene {
      selectedDiff = 'medium';
      constructor() { super({ key: 'JigsawMenu' }); }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Space/Cyber Background
        this.add.rectangle(W / 2, H / 2, W, H, 0x050410);

        // Dot grid pattern
        const makeTexture = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const t = this.textures.createCanvas(key, w, h);
          draw(t.context);
          t.refresh();
        };

        makeTexture('menu-dots', 25, 25, (ctx) => {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
          ctx.beginPath();
          ctx.arc(12, 12, 1, 0, Math.PI * 2);
          ctx.fill();
        });
        this.add.tileSprite(W / 2, H / 2, W, H, 'menu-dots');

        // Title text
        this.add.text(W / 2, 50, 'CYBER JIGSAW', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '38px',
          color: '#00d4ff', fontStyle: 'bold',
          stroke: '#030c24', strokeThickness: 8,
        }).setOrigin(0.5);

        this.add.text(W / 2, 88, 'NEON COMIC ADVENTURE', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px',
          color: '#ff00aa', letterSpacing: 4, fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(W / 2, 130, 'SELECT LEVEL & SCENE', {
          fontFamily: 'monospace', fontSize: '12px', color: '#687e9c',
        }).setOrigin(0.5);

        // 8 Level Selector Thumbnails in a clean 4-column layout (prevents bottom overlap)
        const tW = 120;
        const tH = 90;
        const gap = 24;
        const startX = W / 2 - (4 * tW + 3 * gap) / 2 + tW / 2;
        const startY = 175;

        LEVELS.forEach((level, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const lx = startX + col * (tW + gap);
          const ly = startY + row * (tH + gap + 35);

          // Render level thumbnail canvas
          const thumbKey = `thumb-level-${i}`;
          makeTexture(thumbKey, tW, tH, (ctx) => {
            level.draw(ctx, tW, tH);
            ctx.strokeStyle = '#2d2d44';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, tW, tH);
          });

          // Draw boundary glow
          const frame = this.add.graphics();
          frame.lineStyle(2, 0x1f1f33, 1);
          frame.strokeRect(lx - tW / 2 - 2, ly - tH / 2 - 2, tW + 4, tH + 4);

          // Display thumbnail
          const img = this.add.image(lx, ly, thumbKey);
          img.setInteractive({ cursor: 'pointer' });

          const lbl = this.add.text(lx, ly + tH / 2 + 14, level.name.toUpperCase(), {
            fontFamily: 'Orbitron, sans-serif', fontSize: '9.5px',
            color: '#a0aed0', fontStyle: 'bold',
          }).setOrigin(0.5);

          const loc = this.add.text(lx, ly + tH / 2 + 25, level.location, {
            fontFamily: 'monospace', fontSize: '7.5px', color: '#4c5e7b',
          }).setOrigin(0.5);

          // Select state
          img.on('pointerover', () => {
            frame.clear();
            frame.lineStyle(2.5, level.color, 1.0);
            frame.strokeRect(lx - tW / 2 - 3, ly - tH / 2 - 3, tW + 6, tH + 6);
            lbl.setColor(`#${level.color.toString(16).padStart(6, '0')}`);
            img.setScale(1.05);
          });

          img.on('pointerout', () => {
            frame.clear();
            frame.lineStyle(2, 0x1f1f33, 1);
            frame.strokeRect(lx - tW / 2 - 2, ly - tH / 2 - 2, tW + 4, tH + 4);
            lbl.setColor('#a0aed0');
            img.setScale(1);
          });

          img.on('pointerdown', () => {
            // Play menu click sound
            const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
            playTone(actx, 330, 'sine', 0.12, actx.currentTime, 0.08);
            this.scene.start('JigsawGame', { levelIdx: i, difficulty: this.selectedDiff });
          });
        });

        // Difficulty Settings buttons (bottom)
        this.add.text(W / 2, H - 110, 'DIFFICULTY', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#687e9c', letterSpacing: 2,
        }).setOrigin(0.5);

        const diffs = ['easy', 'medium', 'hard'];
        const dX = [W / 2 - 110, W / 2, W / 2 + 110];
        const dY = H - 64;

        this.selectedDiff = this.selectedDiff || 'medium';
        const dBtns: any[] = [];

        diffs.forEach((d, i) => {
          const cfg = DIFFICULTIES[d];
          const bg = this.add.graphics();
          const txt = this.add.text(dX[i], dY, `${cfg.label}\n(${cfg.cols}x${cfg.rows})`, {
            fontFamily: 'Orbitron, sans-serif', fontSize: '12px',
            color: '#a0aed0', fontStyle: 'bold', align: 'center',
          }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

          const updateBtnStyles = () => {
            bg.clear();
            if (this.selectedDiff === d) {
              bg.fillStyle(0x00d4ff, 0.15);
              bg.lineStyle(2, 0x00d4ff, 1);
              txt.setColor('#00d4ff');
            } else {
              bg.fillStyle(0x1a1a2e, 0.3);
              bg.lineStyle(1.5, 0x2e2e4a, 0.8);
              txt.setColor('#6b7a99');
            }
            bg.fillRoundedRect(dX[i] - 48, dY - 24, 96, 48, 8);
            bg.strokeRoundedRect(dX[i] - 48, dY - 24, 96, 48, 8);
          };

          txt.on('pointerdown', () => {
            this.selectedDiff = d;
            dBtns.forEach(b => b.update());
            const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
            playTone(actx, 440, 'sine', 0.12, actx.currentTime, 0.06);
          });

          dBtns.push({ update: updateBtnStyles });
          updateBtnStyles();
        });
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    //  SCENE 2: GameScene (Jigsaw Gameplay Area)
    // ────────────────────────────────────────────────────────────────────────
    class GameScene extends PhaserLib.Scene {
      levelIdx = 0;
      difficulty = 'medium';
      audioCtx: AudioContext | null = null;

      // Layout Dimensions
      boardW = 600;
      boardH = 450;
      boardX = 0;
      boardY = 0;

      // Jigsaw State
      cols = 4;
      rows = 4;
      pieceW = 0;
      pieceH = 0;
      tabSize = 0;

      pieces: any[] = [];
      solvedCount = 0;
      totalPieces = 0;

      // Timer & Moves
      timeLeft = 300;
      moves = 0;
      timerEvent: any;
      score = 0;
      hasWon = false;

      // UI
      timerText: any;
      movesText: any;
      guideActive = false;
      guideImg: any;

      // Particles
      particleGraphics: any;

      constructor() { super({ key: 'JigsawGame' }); }

      init(data: any) {
        this.levelIdx = data.levelIdx !== undefined ? data.levelIdx : 0;
        this.difficulty = data.difficulty || 'medium';
        this.hasWon = false;
        this.solvedCount = 0;
        this.moves = 0;
        this.pieces = [];
        this.guideActive = false;
      }

      create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const level = LEVELS[this.levelIdx];
        const diff = DIFFICULTIES[this.difficulty];

        this.cols = diff.cols;
        this.rows = diff.rows;
        this.totalPieces = this.cols * this.rows;
        this.timeLeft = diff.time;

        this.pieceW = this.boardW / this.cols;
        this.pieceH = this.boardH / this.rows;
        this.tabSize = Math.floor(Math.min(this.pieceW, this.pieceH) * 0.18);

        // Web Audio Context
        try { this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}

        // Dark background
        this.add.rectangle(W / 2, H / 2, W, H, 0x05040d);

        // Dot grid background
        const makeTexture = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) => {
          if (this.textures.exists(key)) this.textures.remove(key);
          const t = this.textures.createCanvas(key, w, h);
          draw(t.context);
          t.refresh();
        };

        makeTexture('game-grid-dots', 20, 20, (ctx) => {
          ctx.fillStyle = 'rgba(0, 212, 255, 0.04)';
          ctx.beginPath();
          ctx.arc(10, 10, 0.8, 0, Math.PI * 2);
          ctx.fill();
        });
        this.add.tileSprite(W / 2, H / 2, W, H, 'game-grid-dots');

        // Draw HUD bar top (60px high)
        const hudH = 50;
        this.add.rectangle(W / 2, hudH / 2, W, hudH, 0x09081a, 0.9);
        this.add.graphics().lineStyle(1.5, level.color, 0.3).lineBetween(0, hudH, W, hudH);

        // Title and stats
        this.add.text(16, 12, `LEVEL: ${level.name.toUpperCase()}`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#a0aed0', fontStyle: 'bold',
        });
        this.add.text(16, 28, `${diff.label}  •  ${this.totalPieces} PIECES`, {
          fontFamily: 'monospace', fontSize: '9px', color: '#4a5b7c',
        });

        this.movesText = this.add.text(W / 2, 25, 'DRAGS: 0', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: '#f0f2ff',
        }).setOrigin(0.5);

        this.timerText = this.add.text(W - 16, 15, `⏱ ${this.timeLeft}s`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: '#ffd700',
        }).setOrigin(1, 0.5);

        // Board placement (centered in bottom 550px viewport)
        this.boardX = (W - this.boardW) / 2;
        this.boardY = 50 + (H - 50 - this.boardH) / 2;

        // Draw board container frame
        const boardBg = this.add.graphics();
        boardBg.fillStyle(0x0e0e22, 0.4);
        boardBg.fillRoundedRect(this.boardX - 4, this.boardY - 4, this.boardW + 8, this.boardH + 8, 8);
        boardBg.lineStyle(2, 0x1f1f3e, 0.8);
        boardBg.strokeRoundedRect(this.boardX - 4, this.boardY - 4, this.boardW + 8, this.boardH + 8, 8);

        // Inner puzzle outline grid
        const boardGrid = this.add.graphics();
        boardGrid.lineStyle(1, 0x1f1f3e, 0.4);
        for (let r = 1; r < this.rows; r++) {
          boardGrid.lineBetween(this.boardX, this.boardY + r * this.pieceH, this.boardX + this.boardW, this.boardY + r * this.pieceH);
        }
        for (let c = 1; c < this.cols; c++) {
          boardGrid.lineBetween(this.boardX + c * this.pieceW, this.boardY, this.boardX + c * this.pieceW, this.boardY + this.boardH);
        }

        // Render full size high quality comic level scene source
        const sourceKey = `level-source-${this.levelIdx}`;
        makeTexture(sourceKey, this.boardW, this.boardH, (ctx) => {
          level.draw(ctx, this.boardW, this.boardH);
        });

        // Add Guide Preview image (hidden/transparent by default)
        this.guideImg = this.add.image(this.boardX + this.boardW / 2, this.boardY + this.boardH / 2, sourceKey);
        this.guideImg.setDisplaySize(this.boardW, this.boardH);
        this.guideImg.setAlpha(0);

        // Dynamic edge direction generation
        const edges: any[][] = [];
        for (let r = 0; r < this.rows; r++) {
          edges[r] = [];
          for (let c = 0; c < this.cols; c++) {
            edges[r][c] = { top: 0, right: 0, bottom: 0, left: 0 };
          }
        }

        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            edges[r][c].top = (r > 0) ? -edges[r - 1][c].bottom : 0;
            edges[r][c].left = (c > 0) ? -edges[r][c - 1].right : 0;
            edges[r][c].bottom = (r < this.rows - 1) ? (Math.random() < 0.5 ? 1 : -1) : 0;
            edges[r][c].right = (c < this.cols - 1) ? (Math.random() < 0.5 ? 1 : -1) : 0;
          }
        }

        // Particle graphics
        this.particleGraphics = this.add.graphics();

        // ── DYNAMIC PIECE GENERATION ─────────────────────────────────────────
        const sourceTexture = this.textures.get(sourceKey).getSourceImage() as HTMLCanvasElement;
        const pW = this.pieceW + this.tabSize * 2;
        const pH = this.pieceH + this.tabSize * 2;

        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const pieceKey = `piece-${this.levelIdx}-${r}-${c}`;
            const top = edges[r][c].top;
            const right = edges[r][c].right;
            const bottom = edges[r][c].bottom;
            const left = edges[r][c].left;

            makeTexture(pieceKey, pW, pH, (ctx) => {
              // 1. Draw shape outline shifted by tabSize padding
              drawJigsawPath(ctx, this.tabSize, this.tabSize, this.pieceW, this.pieceH, top, right, bottom, left, this.tabSize);
              ctx.clip();

              // 2. Map coordinates back to main source image
              const sx = c * this.pieceW - this.tabSize;
              const sy = r * this.pieceH - this.tabSize;
              ctx.drawImage(sourceTexture, sx, sy, pW, pH, 0, 0, pW, pH);

              // 3. Glowing neon border stroke
              ctx.shadowColor = level.glow;
              ctx.shadowBlur = 3;
              ctx.strokeStyle = `#${level.color.toString(16).padStart(6, '0')}`;
              ctx.lineWidth = 1.8;
              drawJigsawPath(ctx, this.tabSize, this.tabSize, this.pieceW, this.pieceH, top, right, bottom, left, this.tabSize);
              ctx.stroke();
            });

            // Target assembly position
            const tx = this.boardX + c * this.pieceW + this.pieceW / 2;
            const ty = this.boardY + r * this.pieceH + this.pieceH / 2;

            // Spawn piece sprite
            const sprite = this.add.image(0, 0, pieceKey);
            sprite.setInteractive({ cursor: 'pointer' });
            this.input.setDraggable(sprite);

            // Keep reference properties
            const pieceObj = {
              sprite,
              r, c,
              tx, ty,
              isSolved: false,
              particles: [] as any[],
            };

            sprite.setData('meta', pieceObj);

            // Drag behavior
            sprite.on('dragstart', () => {
              if (pieceObj.isSolved) return;
              this.children.bringToTop(sprite);
              sprite.setScale(1.05);
              sprite.setAlpha(0.9);
              sprite.setAngle(0);
              this.playTone(280, 'sine', 0.1, 0.05);
            });

            sprite.on('drag', (pointer: any, dragX: number, dragY: number) => {
              if (pieceObj.isSolved) return;
              sprite.x = dragX;
              sprite.y = dragY;
            });

            sprite.on('dragend', () => {
              if (pieceObj.isSolved) return;
              sprite.setScale(1);
              sprite.setAlpha(1);
              this.moves++;
              this.movesText.setText(`DRAGS: ${this.moves}`);

              // Calculate distance to correct grid slot
              const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, pieceObj.tx, pieceObj.ty);
              if (dist <= 25) {
                // Snap piece into place!
                sprite.x = pieceObj.tx;
                sprite.y = pieceObj.ty;
                sprite.setAngle(0);
                pieceObj.isSolved = true;
                this.solvedCount++;

                // Lock piece
                sprite.disableInteractive();
                sprite.setTint(0xbbbbbb); // slightly darker solved state to merge

                // Snap effects
                this.spawnParticles(sprite.x, sprite.y, level.color, 12, pieceObj);
                this.playTone(523, 'sine', 0.15, 0.1);
                this.time.delayedCall(100, () => {
                  this.playTone(659, 'sine', 0.12, 0.12);
                });

                if (this.solvedCount === this.totalPieces) {
                  this.time.delayedCall(400, this.onVictory, [], this);
                }
              } else {
                this.playTone(180, 'triangle', 0.08, 0.08);
              }
            });

            this.pieces.push(pieceObj);
          }
        }

        // Scatter all pieces around board
        this.scatterPieces();

        // ── CONTROLS / TOOLBAR (Centered & Glowing Neon Design) ────────────────
        const btnW = 120;
        const btnH = 36;
        const bY = H - 32;

        const drawBtn = (gfx: any, x: number, y: number, color: number, isHover: boolean, isActive: boolean) => {
          gfx.clear();
          if (isActive) {
            gfx.fillStyle(color, 0.35);
            gfx.lineStyle(2.5, color, 1);
          } else if (isHover) {
            gfx.fillStyle(color, 0.2);
            gfx.lineStyle(2.5, color, 1);
          } else {
            gfx.fillStyle(0x070612, 0.9);
            gfx.lineStyle(1.8, color, 0.45);
          }
          gfx.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
          gfx.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 8);
        };

        // 1. GUIDE Button
        const gX = W / 2 - 140;
        const btnPrev = this.add.graphics();
        drawBtn(btnPrev, gX, bY, level.color, false, false);

        const txtPrev = this.add.text(gX, bY, '👁 GUIDE', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '10.5px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        txtPrev.on('pointerover', () => {
          drawBtn(btnPrev, gX, bY, level.color, true, false);
          txtPrev.setColor('#ffffff');
        });
        txtPrev.on('pointerout', () => {
          drawBtn(btnPrev, gX, bY, level.color, false, false);
          txtPrev.setColor(this.guideActive ? `#${level.color.toString(16).padStart(6, '0')}` : '#ffffff');
        });
        txtPrev.on('pointerdown', () => {
          this.guideActive = !this.guideActive;
          this.guideImg.setAlpha(this.guideActive ? 0.28 : 0);
          drawBtn(btnPrev, gX, bY, level.color, true, true);
          txtPrev.setColor(this.guideActive ? `#${level.color.toString(16).padStart(6, '0')}` : '#ffffff');
          this.playTone(400, 'sine', 0.08, 0.05);
        });
        txtPrev.on('pointerup', () => {
          drawBtn(btnPrev, gX, bY, level.color, true, false);
        });

        // 2. SCATTER Button
        const sX = W / 2;
        const btnScatter = this.add.graphics();
        drawBtn(btnScatter, sX, bY, level.color, false, false);

        const txtScatter = this.add.text(sX, bY, '⚡ SCATTER', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '10.5px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        txtScatter.on('pointerover', () => {
          drawBtn(btnScatter, sX, bY, level.color, true, false);
        });
        txtScatter.on('pointerout', () => {
          drawBtn(btnScatter, sX, bY, level.color, false, false);
        });
        txtScatter.on('pointerdown', () => {
          drawBtn(btnScatter, sX, bY, level.color, true, true);
          this.scatterPieces();
          this.playTone(330, 'sine', 0.1, 0.06);
        });
        txtScatter.on('pointerup', () => {
          drawBtn(btnScatter, sX, bY, level.color, true, false);
        });

        // 3. BACK TO MENU Button
        const mX = W / 2 + 140;
        const menuColor = 0xff00aa;
        const btnMenu = this.add.graphics();
        drawBtn(btnMenu, mX, bY, menuColor, false, false);

        const txtMenu = this.add.text(mX, bY, '⌂ MENU', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '10.5px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });

        txtMenu.on('pointerover', () => {
          drawBtn(btnMenu, mX, bY, menuColor, true, false);
          txtMenu.setColor(`#${menuColor.toString(16).padStart(6, '0')}`);
        });
        txtMenu.on('pointerout', () => {
          drawBtn(btnMenu, mX, bY, menuColor, false, false);
          txtMenu.setColor('#ffffff');
        });
        txtMenu.on('pointerdown', () => {
          drawBtn(btnMenu, mX, bY, menuColor, true, true);
          this.timerEvent?.remove();
          this.scene.start('JigsawMenu');
        });
        txtMenu.on('pointerup', () => {
          drawBtn(btnMenu, mX, bY, menuColor, true, false);
        });

        // Start countdown timer
        this.timerEvent = this.time.addEvent({
          delay: 1000,
          callback: this.onTick,
          callbackScope: this,
          loop: true,
        });
      }

      scatterPieces() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.pieces.forEach(p => {
          if (p.isSolved) return;

          const leftBound = this.boardX - 40;
          let sx = 0;
          if (Math.random() < 0.5 && leftBound > 50) {
            sx = 40 + Math.random() * (leftBound - 40);
          } else {
            sx = (this.boardX + this.boardW + 40) + Math.random() * (W - (this.boardX + this.boardW + 80));
          }

          const sy = 80 + Math.random() * (H - 180);

          this.tweens.add({
            targets: p.sprite,
            x: sx,
            y: sy,
            angle: 0,
            duration: 500,
            ease: 'Back.easeOut',
          });
        });
      }

      onTick() {
        if (this.hasWon) return;
        this.timeLeft--;
        const color = this.timeLeft <= 15 ? '#ff3333' : this.timeLeft <= 45 ? '#ffaa00' : '#ffd700';
        this.timerText.setText(`⏱ ${this.timeLeft}s`).setColor(color);

        if (this.timeLeft <= 0) {
          this.onGameOver();
        }
      }

      onVictory() {
        this.timerEvent?.remove();
        this.hasWon = true;

        this.tweens.add({
          targets: this.guideImg,
          alpha: 1,
          duration: 300,
        });

        this.playVictoryFanfare();

        const base = this.totalPieces * 200;
        const speedBonus = Math.max(0, this.timeLeft * 8);
        const dragPenalty = Math.max(0, (this.moves - this.totalPieces) * 20);
        this.score = Math.max(100, base + speedBonus - dragPenalty);

        this.showEndScreen(true);
      }

      onGameOver() {
        this.timerEvent?.remove();
        this.hasWon = false;
        this.playTone(150, 'sawtooth', 0.12, 0.4);
        this.time.delayedCall(120, () => this.playTone(100, 'sawtooth', 0.15, 0.5));

        this.pieces.forEach(p => p.sprite.disableInteractive());
        this.showEndScreen(false);
      }

      showEndScreen(won: boolean) {
        const W = this.scale.width;
        const H = this.scale.height;
        const level = LEVELS[this.levelIdx];
        const panelColor = won ? level.color : 0xff3333;

        const panel = this.add.graphics();
        panel.fillStyle(0x060514, 0.96);
        panel.fillRoundedRect(W / 2 - 160, H / 2 - 120, 320, 240, 12);
        panel.lineStyle(2, panelColor, 1);
        panel.strokeRoundedRect(W / 2 - 160, H / 2 - 120, 320, 240, 12);

        this.add.text(W / 2, H / 2 - 85, won ? '★ PUZZLE SOLVED ★' : '✗ OUT OF TIME ✗', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '20px',
          color: won ? '#00d4ff' : '#ff3333', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 40, `SCORE: ${this.score.toLocaleString()}`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#ffffff',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 8, `DRAGS: ${this.moves}  •  TIME REMAINING: ${this.timeLeft}s`, {
          fontFamily: 'monospace', fontSize: '10px', color: '#7b8ba4',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 18, `SCENE: ${level.name} (${this.difficulty.toUpperCase()})`, {
          fontFamily: 'Orbitron, sans-serif', fontSize: '9px', color: '#4a5b7c', fontStyle: 'bold',
        }).setOrigin(0.5);

        // Buttons
        const btnRetry = this.add.graphics();
        btnRetry.fillStyle(level.color, 0.15);
        btnRetry.lineStyle(1.5, level.color, 0.8);
        btnRetry.fillRoundedRect(W / 2 - 110, H / 2 + 45, 100, 38, 6);
        btnRetry.strokeRoundedRect(W / 2 - 110, H / 2 + 45, 100, 38, 6);
        const txtRetry = this.add.text(W / 2 - 60, H / 2 + 64, '↺ RETRY', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: `#${level.color.toString(16)}`, fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
        txtRetry.on('pointerdown', () => this.scene.restart({ levelIdx: this.levelIdx, difficulty: this.difficulty }));
        txtRetry.on('pointerover', () => btnRetry.setAlpha(1.5));
        txtRetry.on('pointerout',  () => btnRetry.setAlpha(1));

        const btnMenu = this.add.graphics();
        btnMenu.fillStyle(0xff00aa, 0.12);
        btnMenu.lineStyle(1.5, 0xff00aa, 0.8);
        btnMenu.fillRoundedRect(W / 2 + 10, H / 2 + 45, 100, 38, 6);
        btnMenu.strokeRoundedRect(W / 2 + 10, H / 2 + 45, 100, 38, 6);
        const txtMenu = this.add.text(W / 2 + 60, H / 2 + 64, '⌂ MENU', {
          fontFamily: 'Orbitron, sans-serif', fontSize: '11px', color: '#ff00aa', fontStyle: 'bold',
        }).setOrigin(0.5).setInteractive({ cursor: 'pointer' });
        txtMenu.on('pointerdown', () => this.scene.start('JigsawMenu'));
        txtMenu.on('pointerover', () => btnMenu.setAlpha(1.5));
        txtMenu.on('pointerout',  () => btnMenu.setAlpha(1));

        if (won && this.score > 0) {
          window.dispatchEvent(new CustomEvent('phaser-game-over', {
            detail: { gameKey: 'jigsaw', score: this.score },
          }));
        }
      }

      spawnParticles(x: number, y: number, color: number, count: number, pRef: any) {
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const speed = 70 + Math.random() * 80;
          pRef.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color,
          });
        }
      }

      playTone(freq: number, type: OscillatorType, gain: number, dur: number) {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        playTone(this.audioCtx, freq, type, gain, now, dur);
      }

      playVictoryFanfare() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          playTone(this.audioCtx!, freq, 'sine', 0.12, now + idx * 0.12, 0.3);
        });
      }

      update(_time: number, delta: number) {
        this.particleGraphics.clear();
        const dt = delta / 1000;

        this.pieces.forEach(p => {
          p.particles = p.particles.filter((pt: any) => pt.life > 0);
          p.particles.forEach((pt: any) => {
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vy += 150 * dt; // gravity
            pt.life -= dt * 1.8;
            if (pt.life > 0) {
              this.particleGraphics.fillStyle(pt.color, pt.life);
              this.particleGraphics.fillCircle(pt.x, pt.y, 2.5 * pt.life);
            }
          });
        });
      }
    }

    return { scenes: [MenuScene, GameScene] };
  }
}
