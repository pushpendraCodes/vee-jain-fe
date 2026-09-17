"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
};

export default function HeroField({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    if (reduce) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;

    const count = mobile ? 24 : 48;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.35 + Math.random() * 0.65,
      r: 0.8 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00028,
      hue: Math.random() > 0.5 ? 140 : 25,
    }));

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const draw = () => {
      mx += (tx - mx) * 0.045;
      my += (ty - my) * 0.045;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.55 + mx * 18;
      const cy = h * 0.48 + my * 12;
      for (let i = 0; i < 3; i++) {
        const radius = 70 + i * 54;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(43,58,46,${0.08 - i * 0.015})`;
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.14) {
            const alpha = (1 - dist / 0.14) * 0.12 * Math.min(a.z, b.z);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(43, 58, 46, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x * w + mx * a.z * 12, a.y * h + my * a.z * 10);
            ctx.lineTo(b.x * w + mx * b.z * 12, b.y * h + my * b.z * 10);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        const x = p.x * w + mx * p.z * 16;
        const y = p.y * h + my * p.z * 12;
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue}, 40%, 55%, ${0.35 * p.z})`);
        g.addColorStop(1, `hsla(${p.hue}, 40%, 45%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `hsla(${p.hue}, 50%, 60%, ${0.7 * p.z})`;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    wrap.addEventListener("pointermove", onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      wrap.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={wrapRef} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute inset-0 sci-grid opacity-30" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-2 blur-3xl animate-float md:h-80 md:w-80" />
    </div>
  );
}
