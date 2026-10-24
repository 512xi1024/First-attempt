"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// 环境音：壁炉噼啪 + 远处马车（淡）
// 全部用 Web Audio 实时合成，不依赖任何音频文件——
// 好处：零体积、零版权风险、音量/频率完全可控
// 规则：浏览器禁止自动播放，所以等访客第一次操作页面后再淡入；
//       左下角按钮随时可关，选择记在浏览器里
// ============================================================

const STORAGE_KEY = "ambient_muted";

export default function AmbientAudio() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mutedRef = useRef(true); // 默认静音，等读到用户偏好再决定

  // 清理所有定时器 + 淡出停止
  const stop = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    setOn(false);

    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.9);
    setTimeout(() => {
      ctx.suspend().catch(() => {});
    }, 1000);
    setOn(false);
    ctxRef.current = null;
    masterRef.current = null;
  }, []);

  // 造一段噪声（brown：更闷、更像炉火；white：更亮，用于噼啪）
  const makeNoise = useCallback(
    (ctx: AudioContext, seconds: number, brown = false) => {
      const len = Math.floor(ctx.sampleRate * seconds);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        if (brown) {
          last = (last + 0.02 * white) / 1.02;
          d[i] = last * 3.2;
        } else {
          d[i] = white;
        }
      }
      return buffer;
    },
    []
  );

  // 壁炉：低频噪声铺底 + 随机短促噼啪
  const startFireplace = useCallback(
    (ctx: AudioContext, master: GainNode) => {
      const bed = ctx.createBufferSource();
      bed.buffer = makeNoise(ctx, 4, true);
      bed.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 360;
      lp.Q.value = 0.6;

      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.11;

      bed.connect(lp).connect(bedGain).connect(master);
      bed.start();

      // 炉火呼吸感：极慢的正弦轻微推拉音量
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain).connect(bedGain.gain);
      lfo.start();

      // 噼啪：短促、清脆、偶有连响，0.12~0.7 秒随机一次
      const crackle = () => {
        const pop = (delay: number, gain: number, freq: number) => {
          const src = ctx.createBufferSource();
          src.buffer = makeNoise(ctx, 0.09);
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = freq;
          bp.Q.value = 1.1;
          const g = ctx.createGain();
          const t = ctx.currentTime + delay;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035 + Math.random() * 0.05);
          src.connect(bp).connect(g).connect(master);
          src.start(t);
          src.stop(t + 0.2);
        };

        const freq = 900 + Math.random() * 2400;
        const big = Math.random() < 0.25;
        pop(0, big ? 0.2 : 0.09, freq);
        // 三成概率紧跟一声「啪」
        if (Math.random() < 0.3) pop(0.045 + Math.random() * 0.04, 0.07, 1400 + Math.random() * 2000);

        timersRef.current.push(
          setTimeout(crackle, 120 + Math.random() * 600)
        );
      };
      timersRef.current.push(setTimeout(crackle, 300));
    },
    [makeNoise]
  );

  // 马车：每 45~60 秒路过一次，蹄声很轻、渐近渐远
  const startCarriage = useCallback(
    (ctx: AudioContext, master: GainNode) => {
      const pass = () => {
        // 车轮/车厢的低频滚动
        const rumble = ctx.createBufferSource();
        rumble.buffer = makeNoise(ctx, 2.4, true);
        const rlp = ctx.createBiquadFilter();
        rlp.type = "lowpass";
        rlp.frequency.value = 170;
        const rg = ctx.createGain();
        const t0 = ctx.currentTime;
        rg.gain.setValueAtTime(0.0001, t0);
        rg.gain.linearRampToValueAtTime(0.03, t0 + 0.6);
        rg.gain.linearRampToValueAtTime(0.0001, t0 + 2.4);
        rumble.connect(rlp).connect(rg).connect(master);
        rumble.start(t0);
        rumble.stop(t0 + 2.5);

        // 马蹄：6 声，间距轻微不均，听起来才像真走
        let t = t0 + 0.35;
        for (let i = 0; i < 6; i++) {
          const thumpSrc = ctx.createBufferSource();
          thumpSrc.buffer = makeNoise(ctx, 0.16);
          const thumpLp = ctx.createBiquadFilter();
          thumpLp.type = "lowpass";
          thumpLp.frequency.value = 320;
          const tg = ctx.createGain();
          tg.gain.setValueAtTime(0.0001, t);
          tg.gain.linearRampToValueAtTime(0.028, t + 0.012);
          tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          thumpSrc.connect(thumpLp).connect(tg).connect(master);
          thumpSrc.start(t);
          thumpSrc.stop(t + 0.2);
          t += 0.17 + Math.random() * 0.07;
        }

        timersRef.current.push(setTimeout(pass, 45000 + Math.random() * 15000));
      };
      timersRef.current.push(setTimeout(pass, 22000 + Math.random() * 12000));
    },
    [makeNoise]
  );

  const start = useCallback(() => {
    if (ctxRef.current) return;
    try {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const master = ctx.createGain();
      // 总音量很低："淡淡的"——需要更响只要改这一个数
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 2.5);
      master.connect(ctx.destination);
      masterRef.current = master;

      startFireplace(ctx, master);
      startCarriage(ctx, master);
      ctx.resume().catch(() => {});
      setOn(true);
    } catch {
      // 浏览器不支持 WebAudio 或被策略拦住：静默失败，不影响页面
    }
  }, [startFireplace, startCarriage]);

  // 读取偏好 + 首次操作后自动淡入
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    mutedRef.current = saved === "1";
    // 默认就是"开"：状态先亮起来（声音等首次交互才真正开始，浏览器策略所致）
    setOn(!mutedRef.current);
    if (mutedRef.current) return;

    const kick = (e: Event) => {
      // 点在声音按钮上时不抢：交给按钮自己的点击逻辑处理
      const el = e.target as Element | null;
      if (el?.closest?.("[data-ambient-toggle]")) return;
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      if (!mutedRef.current) start();
    };
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });

    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [start]);

  // 卸载时收干净
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  function toggle() {
    if (on) {
      mutedRef.current = true;
      localStorage.setItem(STORAGE_KEY, "1");
      stop();
    } else {
      mutedRef.current = false;
      localStorage.setItem(STORAGE_KEY, "0");
      start();
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "关闭环境音" : "开启环境音"}
      title={on ? "关闭环境音" : "开启环境音"}
      data-cursor-label={on ? "静音" : "声音"}
      data-ambient-toggle
      className={`cursor-target group fixed bottom-6 right-24 z-20 mb-1 flex h-10 items-center gap-2.5 rounded-full border px-4 backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70 ${
        on
          ? "border-amber-200/60 bg-stone-900/85 text-amber-100 shadow-lg shadow-black/50"
          : "border-stone-600 bg-stone-900/85 text-stone-300 hover:border-amber-200/50"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
        {on ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 6a9 9 0 0 1 0 12" />
          </>
        ) : (
          <path d="M16 9.5l5 5m0-5-5 5" />
        )}
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
        环境音
      </span>
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          on ? "bg-amber-300" : "bg-stone-500"
        }`}
      />
      <span className="font-mono text-[10px] tracking-[0.15em]">
        {on ? "开" : "关"}
      </span>
    </button>
  );
}
