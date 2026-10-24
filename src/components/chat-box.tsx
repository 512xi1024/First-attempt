"use client";

import { useRef, useState } from "react";
import { SITE } from "@/lib/config";
import TextType from "@/components/text-type";

// 一条消息：assistant = 克里斯蒂小姐，visitor = 访客
type Msg = { role: "assistant" | "visitor"; text: string };

// ============================================================
// 真聊天：调 /api/chat（DeepSeek + Function Calling，密钥在服务器 .env）
// 接口不可用 / 密钥未配置时，用兜底话术，不报错
// ============================================================
type AiAction = { type: string; category?: string };

async function getAssistantReply(
  text: string,
  history: Msg[]
): Promise<{ reply: string; action?: AiAction }> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          text: m.text,
        })),
      }),
    });
    const data = await res.json();
    if (data.ok) {
      return { reply: data.reply as string, action: data.action };
    }
    return {
      reply:
        "……事务所的线路还没接通——AI 密钥尚未配置。委托人的话，我先记在案了。",
    };
  } catch {
    return { reply: "……线路出了点问题，委托人稍后再试。" };
  }
}

export default function ChatBox() {
  // 消息列表（开场白 = 占位文案，见 src/lib/config.ts）
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: SITE.chatOpening },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 打字过程中始终滚到最下面
  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // 访客发言进对话
  function pushVisitor(text: string) {
    setMessages((m) => [...m, { role: "visitor", text }]);
  }

  // ===== 自由打字发送（回车 = 发送） =====
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    const history = messages; // 发送前的对话（新消息单独传）
    pushVisitor(text);
    scrollToBottom();

    const { reply, action } = await getAssistantReply(text, history);
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
    scrollToBottom();

    // AI 决定"带访客看作品"：新开标签页打开总图档
    if (action?.type === "open_gallery") {
      window.open(
        `/gallery${action.category ? `?cat=${encodeURIComponent(action.category)}` : ""}`,
        "_blank"
      );
    }
  }

  // ===== 胶囊按钮 = 快捷发送固定问题 =====
  function ask(q: (typeof SITE.chatQuestions)[number]) {
    pushVisitor(q.label);
    scrollToBottom();
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: q.reply }]);
      scrollToBottom();
    }, 600);

    // "看作品"类问题：新开标签页打开总图档（带分类就筛，不带就全看）
    if (q.action === "works") {
      window.open(
        q.category ? `/gallery?cat=${encodeURIComponent(q.category)}` : "/gallery",
        "_blank"
      );
    }
  }

  return (
    <div className="flex max-h-full flex-col">
      {/* ===== 胶囊固定问题按钮（快捷方式，见 src/lib/config.ts） ===== */}
      <div className="mb-3 flex flex-wrap gap-2">
        {SITE.chatQuestions.map((q) => (
          <button
            key={q.label}
            onClick={() => ask(q)}
            className="cursor-target rounded-full border border-stone-700/70 bg-stone-900/60 px-3.5 py-1.5 text-xs tracking-[0.1em] text-stone-400 backdrop-blur-sm transition hover:border-amber-200/70 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* ===== 对话框本体：案卷面板（与留言页同源的表单语言） ===== */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex max-h-full flex-col overflow-hidden rounded-sm border border-stone-700/70 bg-stone-950/85 shadow-2xl shadow-black/60 backdrop-blur-md">
          {/* 面板头：等宽标注 + 在线状态 */}
          <div className="flex items-center justify-between border-b border-stone-800/90 px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500">
              Case log
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-stone-500">
              <span
                className="h-1 w-1 rounded-full bg-amber-200/80"
                aria-hidden="true"
              />
              在线
            </span>
          </div>

          {/* 消息区：高度自适应，内容多时向下拉长、到极限后内部滚动 */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[15px] leading-7"
          >
            {messages.map((m, i) => (
              <p
                key={i}
                className={
                  m.role === "assistant"
                    ? "max-w-[34ch] text-stone-200"
                    : "ml-auto max-w-[30ch] text-right text-amber-100/90"
                }
              >
                {m.role === "assistant" ? (
                  /* TextType 打字机（对照 reactbits.dev）：
                     75ms/字、下划线光标 0.5s 闪烁、打完停留不删除 */
                  <TextType
                    texts={[m.text]}
                    typingSpeed={75}
                    pauseDuration={1500}
                    deletingSpeed={50}
                    loop={false}
                    showCursor={i === messages.length - 1}
                    cursorCharacter="_"
                    cursorBlinkDuration={0.5}
                    mistakes={0}
                    onProgress={scrollToBottom}
                  />
                ) : (
                  m.text
                )}
              </p>
            ))}
          </div>

          {/* 输入区：访客自由打字，回车发送 */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3 border-t border-stone-800/90 px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="向克里斯蒂小姐提问…"
              aria-label="向克里斯蒂小姐提问"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-stone-200 outline-none placeholder:text-stone-600"
            />
            <button
              type="submit"
              className="cursor-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-700/80 text-xs text-stone-400 transition hover:border-amber-200/80 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70"
              aria-label="发送"
            >
              →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
