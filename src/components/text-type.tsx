"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { playKeySound } from "@/lib/typewriter-sound";

// ============================================================
// TextType 打字机（对照 reactbits.dev 的 TextType 实现）
// texts     ：要打的文字（数组；loop 时依次轮播）
// typingSpeed   ：打字间隔 ms（默认 75）
// pauseDuration ：打完停留 ms（默认 1500，仅 loop 时用于停顿再删）
// deletingSpeed ：删除间隔 ms（默认 50，仅 loop 时使用）
// loop      ：true = 打完→停留→删除→下一条循环；
//             false = 打完停在原地（聊天回复用这个，内容不能被删）
// showCursor / cursorCharacter / cursorBlinkDuration ：光标样式
// mistakes  ：错字模拟（0 = 不模拟，聊天场景保持 0）
// ============================================================

type TextTypeProps = {
  texts: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  showCursor?: boolean;
  cursorCharacter?: string;
  cursorBlinkDuration?: number;
  mistakes?: number;
  // 每打一个字放一声打字机按键音（音量很低，跟随「环境音」总开关）
  sound?: boolean;
  onProgress?: () => void;
};

export default function TextType({
  texts,
  typingSpeed = 75,
  pauseDuration = 1500,
  deletingSpeed = 50,
  loop = false,
  showCursor = true,
  cursorCharacter = "_",
  cursorBlinkDuration = 0.5,
  mistakes = 0,
  sound = false,
  onProgress,
}: TextTypeProps) {
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<
    "typing" | "pausing" | "deleting" | "done"
  >("typing");
  const index = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;

  // 用拼接字符串做依赖，避免父组件每次渲染都重置打字进度
  const joined = texts.join("\u0000");
  const items = useMemo(() => joined.split("\u0000"), [joined]);

  // 文字内容变化时从头开始
  useEffect(() => {
    index.current = 0;
    setDisplay("");
    setPhase("typing");
  }, [joined]);

  useEffect(() => {
    const text = items[index.current] ?? "";

    if (phase === "typing") {
      if (display.length < text.length) {
        timer.current = setTimeout(() => {
          // 空格/换行不发声，否则会多出无意义的空响
          const nextChar = text[display.length];
          if (sound && nextChar && !/\s/.test(nextChar)) playKeySound();
          setDisplay(text.slice(0, display.length + 1));
          progressRef.current?.();
        }, typingSpeed);
      } else if (loop && items.length > 0) {
        setPhase("pausing");
      } else {
        setPhase("done");
      }
    } else if (phase === "pausing") {
      timer.current = setTimeout(() => setPhase("deleting"), pauseDuration);
    } else if (phase === "deleting") {
      if (display.length > 0) {
        timer.current = setTimeout(() => {
          setDisplay(display.slice(0, -1));
          progressRef.current?.();
        }, deletingSpeed);
      } else {
        index.current = (index.current + 1) % items.length;
        setPhase("typing");
      }
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [display, phase, items, typingSpeed, pauseDuration, deletingSpeed, loop, sound]);

  return (
    <span>
      {display}
      {showCursor && phase !== "done" && (
        <span
          className="cursor-blink ml-0.5 text-amber-200"
          style={{ animationDuration: `${cursorBlinkDuration}s` }}
        >
          {cursorCharacter}
        </span>
      )}
      {/* mistakes 参数保留：聊天场景固定 0，不模拟错字 */}
      <span className="hidden">{mistakes}</span>
    </span>
  );
}
