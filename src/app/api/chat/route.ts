import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ============================================================
// 聊天接口：DeepSeek 官方 API（OpenAI 兼容格式）+ Function Calling
// 密钥从 .env 的 DEEPSEEK_API_KEY 读（只在服务器用，绝不会暴露给访客）
// 前端把对话历史发过来，这里组装人设/知识库/作品清单后调 DeepSeek
// ============================================================

const MODEL = "deepseek-chat";
const API_URL = "https://api.deepseek.com/chat/completions";

// ============================================================
// 输入长度上限（唯一的防滥用措施，刻意留得很宽松）
// 目的：不让一次请求带进来几十万字把额度烧光，
//       同时正常访客（包括贴一段长说明的）完全不会碰到。
// 3000 字 ≈ 4500 token，单次成本约 ¥0.005，可以接受。
// 历史另算总预算：从最近的一条往前取，超出就丢掉更早的，
// 不截断单条内容（截断会让 AI 答得前言不搭后语）。
// ============================================================
const MAX_MESSAGE_CHARS = 3000;
const MAX_HISTORY_CHARS = 10000;

// 默认人设（后台「AI 人设提示词」填了内容就用后台的）
const DEFAULT_PERSONA = `你是"克里斯蒂小姐"，侦探形象的 AI 引导助手，代替站长小溪接待访客。
性格：老派英伦侦探，话不多但有推理感，称呼访客为"委托人"。
职责：引导访客了解小溪的 UI/UX 作品、技能与简历；不闲聊无关话题，不编造档案里没有的信息，不知道就坦白说。
语气：每次回复不超过两句话。`;

// 分类近义词表：一组词 = 同一个分类领域。
// 判定方式：分类名里含有这组任意一个词，且访客说法里也含有这组任意一个词 → 命中。
const CATEGORY_ALIASES: Record<string, string[]> = {
  app: ["app", "手机", "手机端", "移动", "移动端", "客户端", "ios", "android", "安卓", "小程序", "应用"],
  web: ["web", "网页", "网站", "官网", "站点", "pc", "桌面", "后台", "页面"],
  ui: ["ui", "界面", "交互", "原型"],
  handdrawn: ["手绘", "手稿", "手绘稿", "素描", "速写", "线稿", "涂鸦", "水彩", "马克笔"],
  ip: ["ip", "形象", "吉祥物", "卡通", "角色设定", "ip形象", "ip设计", "mascot"],
  brand: ["品牌", "vi", "标志", "logo", "视觉识别"],
  poster: ["海报", "平面", "插画", "宣传", "易拉宝", "banner"],
  "3d": ["三维", "建模", "渲染", "3d"],
};

// 这些说法指的是"全部作品"，不该锁定任何分类 → 直接打开总图鉴
const ALL_WORKS_HINTS = [
  "设计稿",
  "全部",
  "所有",
  "整体",
  "总览",
  "图鉴",
  "作品集",
  "都看",
  "随便看",
];

function norm(s: string) {
  return s.toLowerCase().replace(/[\s\-_·，。！？!?、/\\]/g, "");
}

// 把 AI 给出的分类（可能是近义说法）对齐到真实分类名
function matchCategory(input: string, categories: string[]): string | undefined {
  const t = norm(input);
  if (!t) return undefined;
  // 1) 完全一致
  const exact = categories.find((c) => norm(c) === t);
  if (exact) return exact;
  // 2) 互相包含："app" 与 "app设计"
  const inc = categories.find((c) => norm(c).includes(t) || t.includes(norm(c)));
  if (inc) return inc;
  // 3) 近义词表："手机端设计" → 含 app 相关的分类
  for (const c of categories) {
    const n = norm(c);
    for (const words of Object.values(CATEGORY_ALIASES)) {
      const hitName = words.some((w) => n.includes(norm(w)));
      const hitInput = words.some((w) => t.includes(norm(w)));
      if (hitName && hitInput) return c;
    }
  }
  return undefined;
}

// 判断这次"看作品"的请求属于哪种：
// all = 看全部（打开总图鉴）／match = 对上某个分类／miss = 库里没有这一类（不跳转）
type CategoryHit =
  | { kind: "all" }
  | { kind: "match"; category: string }
  | { kind: "miss"; input: string };

function resolveCategory(
  input: string,
  categories: string[]
): CategoryHit {
  const t = norm(input);
  // 模型没指定分类，或访客说的是"全部/设计稿/作品集" → 打开总图鉴
  if (!t || ALL_WORKS_HINTS.some((w) => t.includes(norm(w)))) {
    return { kind: "all" };
  }
  const hit = matchCategory(input, categories);
  return hit ? { kind: "match", category: hit } : { kind: "miss", input };
}

// 可调用的"工具"：分类清单动态生成（enum 让模型只能选真实存在的分类）
function buildTools(categories: string[]) {
  const categoryProp: Record<string, unknown> = {
    type: "string",
    description:
      "作品分类。必须从【分类清单】中选一个原名；若访客用的是俗称（如 app、手机端、移动端、手机 App、手绘、IP 形象、吉祥物、网页、后台），归入最接近的分类。若访客想看的是全部作品、设计稿、作品集、整体图鉴，则不要传这个参数。若访客点名的分类在【分类清单】里根本不存在，请不要调用本函数。",
  };
  if (categories.length > 0) categoryProp.enum = categories;

  return [
    {
      type: "function",
      function: {
        name: "show_works",
        description: "带访客去看作品图档，可指定分类",
        parameters: {
          type: "object",
          properties: { category: categoryProp },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "show_resume",
        description: "引导访客下载小溪的简历 PDF",
        parameters: { type: "object", properties: {} },
      },
    },
  ];
}

// 对话消息（OpenAI 格式）
type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
};

export async function POST(req: NextRequest) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    // 没配密钥：让前端走占位回复，不报红错
    return NextResponse.json(
      { ok: false, error: "AI 密钥未配置" },
      { status: 200 }
    );
  }

  const body = await req.json().catch(() => null);
  const message = (body?.message || "").toString().trim();
  const rawHistory: { role?: string; text?: string }[] = Array.isArray(
    body?.history
  )
    ? body.history.slice(-10)
    : [];
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "消息不能为空" },
      { status: 400 }
    );
  }

  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json(
      {
        ok: false,
        error: `这封信太厚了，${MAX_MESSAGE_CHARS} 字以内我还能一一读完。`,
      },
      { status: 413 }
    );
  }

  // 历史：从最近的一条往前装，超出总预算就把更早的丢掉
  const history: { role?: string; text?: string }[] = [];
  let historyChars = 0;
  for (let i = rawHistory.length - 1; i >= 0; i--) {
    const len = (rawHistory[i].text || "").toString().length;
    if (historyChars + len > MAX_HISTORY_CHARS) break;
    historyChars += len;
    history.unshift(rawHistory[i]);
  }

  // 组装系统提示：人设（后台可改）+ 知识库 + 作品清单
  const [sys, kb, works] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "system_prompt" } }),
    prisma.setting.findUnique({ where: { key: "knowledge_base" } }),
    prisma.work.findMany({
      select: { title: true, category: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  const categories = Array.from(
    new Set(works.map((w) => (w.category || "").trim()).filter(Boolean))
  );

  const systemText = [
    sys?.value || DEFAULT_PERSONA,
    `【知识库】\n${kb?.value || "（暂无）"}`,
    `【作品清单】\n${
      works.map((w) => `- ${w.title}（分类：${w.category}）`).join("\n") ||
      "（暂无作品）"
    }`,
    `【分类清单】\n${categories.join("、") || "（暂无分类）"}`,
    `【分类对齐规则】访客常用俗称指代作品分类，例如说"app""手机端设计""移动端""iOS"都应归入与 app 相关的分类；说"网页""官网""后台"归入与 web 相关的分类；说"手绘""手稿""线稿""速写"归入与手绘相关的分类；说"IP形象""吉祥物""卡通角色""形象设计"归入与 IP 相关的分类。调用 show_works 时，category 必须填【分类清单】里的原名。特别注意：访客说的是"设计稿""全部作品""作品集""整体看看""总览"时，指的是全部作品，不要填 category（打开总图鉴）。`,
    `【找不到分类怎么办】如果访客点名的作品类型在【分类清单】里没有对应（例如问手绘、问某个你查不到的品类），不要硬凑一个分类，也不要打开总图鉴。直接用一句话说明：案卷里没翻到这一类，请他点导航栏的「图档」自己看看别的。不要编造作品，也不要假装已经打开。`,
  ].join("\n\n");

  // 前端历史里的 "model" 映射成 OpenAI 的 "assistant"
  const messages: ChatMessage[] = [
    { role: "system", content: systemText },
    ...history
      .filter((m) => (m.text || "").toString().trim())
      .map((m) => ({
        role: (m.role === "model" ? "assistant" : "user") as
          | "assistant"
          | "user",
        content: (m.text || "").toString(),
      })),
    { role: "user", content: message },
  ];

  async function callDeepseek() {
    return fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: buildTools(categories),
      }),
    });
  }

  let res = await callDeepseek();
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "AI 调用失败，请稍后再试" },
      { status: 502 }
    );
  }
  let data = await res.json();
  let assistantMsg = data?.choices?.[0]?.message;

  // 模型决定调用工具 → 执行 → 把结果喂回去拿最终回复
  const toolCall = assistantMsg?.tool_calls?.[0];
  let action: { type: string; category?: string } | undefined;
  if (toolCall?.function?.name) {
    const name = toolCall.function.name as string;
    let args: Record<string, string> = {};
    try {
      args = JSON.parse(toolCall.function.arguments || "{}");
    } catch {
      // 参数解析失败就当没传参
    }

    // 回喂给模型的执行结果，直接影响它下一句话怎么说
    let toolResult = "已执行成功，请用你的侦探腔告诉委托人接下来看什么";

    if (name === "show_works") {
      const raw = (args.category || "").toString().trim();
      const hit = resolveCategory(raw, categories);

      if (hit.kind === "match") {
        action = { type: "open_gallery", category: hit.category };
        toolResult = `已为委托人打开「${hit.category}」这一分类的作品图档（新标签页）。请用你的侦探腔请他过目。`;
      } else if (hit.kind === "all") {
        action = { type: "open_gallery", category: "" };
        toolResult = "已为委托人打开总图鉴（全部作品，新标签页）。请用你的侦探腔请他过目。";
      } else {
        // 库里没有这一类 → 不打开任何图档，只回话
        action = undefined;
        toolResult =
          `执行失败：档案里没有「${hit.input}」这个分类，所以【没有打开任何图档】。` +
          `请用你的侦探腔如实告诉委托人：你在案卷里没翻到这一类，` +
          `并建议他自己点导航栏上的「图档」看看其他作品。` +
          `绝对不要说"已打开""请过目"这类话。`;
      }
    } else if (name === "show_resume") {
      action = { type: "download_resume" };
      toolResult = "已为委托人调出简历档案（开始下载）。请用你的侦探腔告知他。";
    }

    // 把模型的决定和工具结果追加进对话，再要最终回复
    messages.push({
      role: "assistant",
      content: assistantMsg.content || null,
      tool_calls: [toolCall],
    });
    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: toolResult,
    });

    res = await callDeepseek();
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "AI 调用失败，请稍后再试" },
        { status: 502 }
      );
    }
    data = await res.json();
    assistantMsg = data?.choices?.[0]?.message;
  }

  const reply = (assistantMsg?.content || "").toString().trim();

  if (!reply) {
    return NextResponse.json(
      { ok: false, error: "AI 没有返回内容" },
      { status: 502 }
    );
  }

  // 姿态规则（前端切素材用；素材没做前仅作占位）
  const pose =
    action?.type === "open_gallery"
      ? "出示"
      : action?.type === "download_resume"
        ? "掏取"
        : "待机";

  return NextResponse.json({ ok: true, reply, pose, action });
}
