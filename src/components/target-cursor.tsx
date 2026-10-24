"use client";

// ============================================================
// TargetCursor 十字准星光标（对照 reactbits.dev 的 TargetCursor）
// 用法：挂在根布局，给想"锁定"的元素加 className="cursor-target"，
//       可选 data-cursor-label="文字" 显示标签
// ============================================================

import { useEffect, useRef } from "react";
import "./target-cursor.css";

type TargetCursorProps = {
  spinDuration?: number; // 准星旋转一圈的秒数
  hideDefaultCursor?: boolean; // 隐藏系统鼠标箭头
  parallaxOn?: boolean; // 光标带一点惯性跟随
  hoverDuration?: number; // 悬停锁定/跟随的过渡秒数
  size?: number; // 默认准星边长 px
  cornerSize?: number; // 四角括号边长 px
  thickness?: number; // 括号线条粗细 px
  padding?: number; // 锁定目标时向外扩多少 px
  dotSize?: number; // 中心圆点直径 px
  cursorColor?: string;
  cursorColorOnTarget?: string;
  blendMode?: string; // 混合模式（difference = 反色）
  matchRadius?: boolean; // 锁定时贴合目标圆角
  showLabel?: boolean; // 显示 data-cursor-label 文字
  clickEffect?: boolean; // 点击时收缩一下
};

export default function TargetCursor({
  spinDuration = 2,
  hideDefaultCursor = false,
  parallaxOn = true,
  hoverDuration = 0.2,
  size = 36,
  cornerSize = 12,
  thickness = 3,
  padding = 6,
  dotSize = 4,
  cursorColor = "#ffffff",
  cursorColorOnTarget = "#ffffff",
  blendMode = "difference",
  matchRadius = false,
  showLabel = false,
  clickEffect = false,
}: TargetCursorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 断言非空：下面的帧循环在闭包里跑，TS 不会保留 early-return 的收窄
    const wrapper = wrapperRef.current!;
    const label = labelRef.current!;
    if (!wrapper || !label) return;

    let mouseX = -100;
    let mouseY = -100;
    let curX = -100;
    let curY = -100;
    let curSize = size;
    let curRadius = 12;
    let raf = 0;
    let last = 0;
    let hovering: HTMLElement | null = null;
    let lastTarget: HTMLElement | null = null;
    let pressed = false;
    let visible = false;

    // 悬停在文字上也算"锁定"：停转但不框选放大
    function isTextTarget(el: HTMLElement | null): boolean {
      return !!el?.closest(
        "p,h1,h2,h3,h4,h5,h6,span,li,blockquote,dd,dt,figcaption,label,input,textarea"
      );
    }

    if (hideDefaultCursor) {
      document.body.classList.add("target-cursor-active");
    }

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        curX = mouseX;
        curY = mouseY;
        wrapper!.classList.add("tc-ready");
      }
      const el = (e.target as HTMLElement | null)?.closest?.(
        ".cursor-target"
      ) as HTMLElement | null;
      hovering = el;
      lastTarget = e.target as HTMLElement | null;
    }

    function onDown() {
      pressed = true;
    }
    function onUp() {
      pressed = false;
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;

      // 页面跳转后，被锁定的元素可能已从 DOM 移除。
      // 已移除元素的 rect 全是 0，不解除的话光标会一路飞向左上角。
      if (hovering && !hovering.isConnected) hovering = null;
      if (lastTarget && !lastTarget.isConnected) lastTarget = null;

      // 跟随系数：hoverDuration 越小跟得越紧
      const k = 1 - Math.exp(-dt / Math.max(0.02, hoverDuration * 0.35));

      let targetX = mouseX;
      let targetY = mouseY;
      let targetSize = size;
      let targetRadius = 12;
      let color = cursorColor;
      let labelText = "";

      if (hovering) {
        const r = hovering.getBoundingClientRect();
        targetX = r.left + r.width / 2;
        targetY = r.top + r.height / 2;
        targetSize = Math.max(r.width, r.height) + padding * 2;
        if (matchRadius) {
          const br = parseFloat(
            getComputedStyle(hovering).borderTopLeftRadius || "0"
          );
          targetRadius = Math.min(br + padding, targetSize / 2);
        }
        color = cursorColorOnTarget;
        labelText = hovering.dataset.cursorLabel || "";
      }

      // 位置带惯性（视差跟随感）
      if (parallaxOn && !hovering) {
        curX += (targetX - curX) * k;
        curY += (targetY - curY) * k;
      } else {
        curX += (targetX - curX) * k;
        curY += (targetY - curY) * k;
      }
      curSize += (targetSize - curSize) * k;
      curRadius += (targetRadius - curRadius) * k;

      const half = curSize / 2;
      const scale = clickEffect && pressed ? 0.85 : 1;

      wrapper.style.width = `${curSize}px`;
      wrapper.style.height = `${curSize}px`;
      wrapper.style.borderRadius = `${curRadius}px`;
      wrapper.style.color = hovering ? cursorColorOnTarget : cursorColor;
      // 用 setProperty 而不是 style.mixBlendMode：后者的类型是字面量联合，直接赋值会报类型错
      wrapper.style.setProperty("mix-blend-mode", blendMode);
      wrapper.style.transform = `translate3d(${curX - half}px, ${
        curY - half
      }px, 0) scale(${scale})`;
      // 锁定目标（或悬停文字）时暂停旋转（框住就行）
      wrapper.classList.toggle(
        "tc-locked",
        !!hovering || (!hovering && isTextTarget(lastTarget))
      );

      // 标签
      const showLabelNow = showLabel && hovering && labelText;
      label.textContent = labelText;
      label.classList.toggle("tc-show", !!showLabelNow);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(raf);
      document.body.classList.remove("target-cursor-active");
    };
  }, [
    spinDuration,
    hideDefaultCursor,
    parallaxOn,
    hoverDuration,
    size,
    cornerSize,
    thickness,
    padding,
    dotSize,
    cursorColor,
    cursorColorOnTarget,
    blendMode,
    matchRadius,
    showLabel,
    clickEffect,
  ]);

  return (
    <div ref={wrapperRef} className="target-cursor-wrapper">
      <div
        className="target-cursor"
        style={
          {
            "--tc-spin-duration": `${spinDuration}s`,
            "--tc-corner": `${cornerSize}px`,
            "--tc-thickness": `${thickness}px`,
            "--tc-dot": `${dotSize}px`,
          } as React.CSSProperties
        }
      >
        <span className="tc-corner tc-tl" />
        <span className="tc-corner tc-tr" />
        <span className="tc-corner tc-bl" />
        <span className="tc-corner tc-br" />
        <span className="tc-dot" />
      </div>
      <div ref={labelRef} className="tc-label" />
    </div>
  );
}
