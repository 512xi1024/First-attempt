"use client";

import { useEffect, useRef, type ReactNode } from "react";

// ============================================================
// 磁吸：光标靠近时，元素朝光标方向轻轻挪一点，像被吸过去
// - 用 CSS 的 translate 属性，不用 transform：
//   transform 容易被元素自身的动画 / 位移覆盖，两者会打架
// - 基准位置用 offsetLeft 算，不用 getBoundingClientRect：
//   元素被挪动后 rect 会跟着变，用它算会自激抖动
// - 触摸屏没有"靠近"这回事，直接跳过
// ============================================================

type MagneticProps = {
  children: ReactNode;
  strength?: number; // 跟随力度，0.2 左右是"轻轻一吸"
  radius?: number; // 元素外多大范围内开始吸（px）
  className?: string;
};

export default function Magnetic({
  children,
  strength = 0.22,
  radius = 30,
  className = "",
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    let px = 0;
    let py = 0;
    let engaged = false; // 上一帧是否处于吸附状态，用来只播一次回位动画

    const apply = () => {
      raf = 0;
      const parent = el.offsetParent as HTMLElement | null;
      const pr = parent?.getBoundingClientRect();
      const baseX = (pr?.left ?? 0) + el.offsetLeft + el.offsetWidth / 2;
      const baseY = (pr?.top ?? 0) + el.offsetTop + el.offsetHeight / 2;

      const dx = px - baseX;
      const dy = py - baseY;
      const dist = Math.hypot(dx, dy);
      const reach = Math.max(el.offsetWidth, el.offsetHeight) / 2 + radius;

      if (dist < reach) {
        const k = 1 - dist / reach; // 越近吸得越紧
        engaged = true;
        el.style.transition = "translate 0.12s linear";
        el.style.setProperty(
          "translate",
          `${dx * strength * k}px ${dy * strength * k}px`
        );
      } else if (engaged) {
        engaged = false;
        // 离开时带回弹，收得干净利落
        el.style.transition =
          "translate 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)";
        el.style.setProperty("translate", "0px 0px");
      }
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
