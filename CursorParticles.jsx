import React, { useEffect, useRef } from "react";

/**
 * CursorParticles - Subtle Constellation Mouse-Trail Particle Effect
 * Inspired by the soft celestial movement on the Antigravity website.
 *
 * Features:
 * - Spawns luminous celestial particles trailing behind cursor with gentle deceleration
 * - Subtle connecting constellation lines between nearby particles (< 90px)
 * - Cool-toned celestial palette: soft star white, sky blue, indigo, purple, cyan
 * - Non-intrusive: pointer-events: none, sits above UI with high z-index without blocking clicks
 * - Idle-pause: stops requestAnimationFrame loop when no particles are active (0% idle CPU)
 */
export default function CursorParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });

    const particles = [];
    const MAX_PARTICLES = 50;
    const CONNECT_DISTANCE = 90;

    const colors = [
      { r: 255, g: 255, b: 255 }, // soft star white
      { r: 96, g: 165, b: 250 },  // sky blue
      { r: 129, g: 140, b: 248 }, // indigo
      { r: 167, g: 139, b: 250 }, // subtle lavender/purple
      { r: 56, g: 189, b: 248 },  // cyan tint
    ];

    let lastSpawnTime = 0;
    let animFrameId = null;

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.2 + 0.3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 0.3; // upward celestial drift
        this.size = Math.random() * 2.2 + 1.8; // visible star-like dot
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.25 + 0.75;
        this.maxAlpha = this.alpha;
        this.decay = Math.random() * 0.014 + 0.009; // smooth fade-out
        this.life = 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        this.alpha = this.maxAlpha * Math.max(0, this.life);
      }

      draw(ctx) {
        if (this.alpha <= 0.01) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha * 0.9})`;
        ctx.fill();
        ctx.restore();
      }
    }

    const onPointerMove = (e) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      const now = performance.now();
      if (now - lastSpawnTime > 14) {
        if (particles.length < MAX_PARTICLES) {
          particles.push(new Particle(clientX, clientY));
          particles.push(
            new Particle(
              clientX + (Math.random() * 12 - 6),
              clientY + (Math.random() * 12 - 6)
            )
          );
        }
        lastSpawnTime = now;
      }

      if (!animFrameId) {
        loop();
      }
    };

    function loop() {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();

        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx);
        }
      }

      // Constellation lines
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DISTANCE) {
            const lineAlpha =
              (1 - dist / CONNECT_DISTANCE) *
              Math.min(p1.alpha, p2.alpha) *
              0.35;
            if (lineAlpha > 0.01) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(165, 180, 252, ${lineAlpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      if (particles.length > 0) {
        animFrameId = requestAnimationFrame(loop);
      } else {
        animFrameId = null;
        ctx.clearRect(0, 0, width, height);
      }
    }

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("pointermove", onPointerMove);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="cursor-particles"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 999999,
        display: "block",
      }}
      aria-hidden="true"
    />
  );
}
