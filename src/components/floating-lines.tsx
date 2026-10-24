"use client";

// ============================================================
// FloatingLines 漂浮线条背景（对照 reactbits.dev 的 FloatingLines）
// - 多层正弦波叠出流动的线条，渐变描边 + 辉光
// - interactive：线条向鼠标弯曲；clickSwirl：点击激起漩涡脉冲
// - parallax：整个线条组随鼠标轻微位移
// 纯背景装饰：pointer-events 关闭，不影响页面交互
// ============================================================

import { useEffect, useId, useRef } from "react";

type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: string[];
  lineCount?: number;
  lineDistance?: number;
  bendStrength?: number;
  interactive?: boolean;
  clickSwirl?: boolean;
  lineStyle?: "solid" | "dashed";
  lineWidth?: number;
  glow?: number;
  brightness?: number;
  animationSpeed?: number;
  amplitude?: number;
  depthOfField?: number;
  edgeFade?: number;
  bendRadius?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  intro?: boolean;
  lightMode?: boolean;
};

export default function FloatingLines({
  linesGradient = ["#4d4731", "#ffffff"],
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = 10,
  lineDistance = 6,
  bendStrength = -0.5,
  interactive = true,
  clickSwirl = true,
  lineStyle = "solid",
  lineWidth = 1,
  glow = 1,
  brightness = 1,
  animationSpeed = 1,
  amplitude = 1,
  depthOfField = 0.5,
  edgeFade = 0,
  bendRadius = 5,
  parallax = false,
  parallaxStrength = 0.2,
  intro = true,
  lightMode = false,
}: FloatingLinesProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const gid = useId().replace(/:/g, "");

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let clickAt = -9999;
    let raf = 0;
    let last = performance.now();
    let fade = intro ? 0 : 1; // 入场淡入

    function onMove(e: MouseEvent) {
      const r = wrap!.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (mouse.x < -999) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
    }
    function onClick(e: MouseEvent) {
      onMove(e);
      clickAt = performance.now();
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      const W = wrap!.clientWidth;
      const H = wrap!.clientHeight;
      if (!W || !H) return;

      // 鼠标平滑 + 视差
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 6);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 6);
      if (parallax && groupRef.current) {
        const px = (mouse.x - W / 2) * 0.02 * parallaxStrength;
        const py = (mouse.y - H / 2) * 0.02 * parallaxStrength;
        groupRef.current.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      }

      fade = Math.min(1, fade + dt * 0.8);
      wrap!.style.opacity = String(fade);

      const R = bendRadius * 44; // 鼠标影响半径
      const clickAge = (now - clickAt) / 1000;
      const pulse =
        clickSwirl && clickAge >= 0 && clickAge < 1.5
          ? Math.exp(-clickAge * 2.2)
          : 0;

      const seg = 26;
      for (let i = 0; i < lineCount; i++) {
        const frac = lineCount === 1 ? 0.5 : i / (lineCount - 1);
        // lineDistance 控制疏密：数值越大整体铺得越开
        const baseY =
          H * (0.14 + frac * (0.5 + lineDistance * 0.04) + (1 - (0.5 + lineDistance * 0.04)) * 0.5);
        const amp = amplitude * (H / 600);
        const phase = i * 0.55;
        let d = "";
        for (let s = 0; s <= seg; s++) {
          const u = s / seg;
          const x = u * W;
          let y = baseY;
          // 三层波：top（高频小波）/ middle（中频）/ bottom（低频大浪）
          if (enabledWaves.includes("top"))
            y += Math.sin(u * 4.6 + t * 0.9 * animationSpeed + phase) * amp * 9;
          if (enabledWaves.includes("middle"))
            y +=
              Math.sin(u * 1.9 - t * 0.6 * animationSpeed + phase * 0.6) *
              amp *
              15;
          if (enabledWaves.includes("bottom"))
            y += Math.sin(u * 0.8 + t * 0.35 * animationSpeed) * amp * 21;
          // 整体弯曲
          y += bendStrength * Math.pow((u - 0.5) * 2, 2) * H * 0.14;

          // 鼠标交互：附近的线被吸向光标 + 点击漩涡脉冲
          if (interactive) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < R) {
              const p = 1 - dist / R;
              y += (mouse.y - y) * p * p * 0.4;
              if (pulse > 0) {
                y += Math.sin(t * 6 + u * 9) * p * pulse * 30;
              }
            }
          }

          d += `${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        pathRefs.current[i]?.setAttribute("d", d);
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, [
    lineCount,
    lineDistance,
    bendStrength,
    interactive,
    clickSwirl,
    animationSpeed,
    amplitude,
    bendRadius,
    parallax,
    parallaxStrength,
    intro,
  ]);

  const mid = (lineCount - 1) / 2;

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        opacity: intro ? 0 : 1,
        filter: glow
          ? `drop-shadow(0 0 ${glow * 6}px rgba(255,255,255,${0.15 + glow * 0.25}))`
          : undefined,
      }}
    >
      <svg width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={linesGradient[0]} />
            <stop offset="100%" stopColor={linesGradient[linesGradient.length - 1]} />
          </linearGradient>
        </defs>
        <g ref={groupRef}>
          {Array.from({ length: lineCount }).map((_, i) => (
            <path
              key={i}
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth={lineWidth}
              strokeDasharray={lineStyle === "dashed" ? "7 9" : undefined}
              strokeLinecap="round"
              opacity={
                brightness *
                (1 -
                  depthOfField *
                    (Math.abs(i - mid) / (mid || 1)) *
                    0.65)
              }
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
