// ============================================================
// 站点配置（需要随时改的内容放这里，不用动页面代码）
// ============================================================

export const SITE = {
  // 简历下载地址（后台「简历管理」上传的文件，自动走这里）
  resumeUrl: "/api/files/resume.pdf",

  // 其他项目入口：跳转到服务器上其他项目的访问地址
  // 以后填成：{ name: "项目名", url: "https://xxx.xxx" }
  // 留空数组时，页面上不显示这一栏
  externalProjects: [] as { name: string; url: string }[],

  // 克里斯蒂小姐的开场白：委托人上门查小溪的底细
  chatOpening:
    "请进，委托人。你要查的那个人——小溪——案卷我已经备好了。想从哪一页看起？",

  // 胶囊固定问题按钮（占位文案 + 占位回复；接入 Gemini 后，回复改由 AI 生成）
  // action 说明：
  //   "works" = 回复后新开标签页打开总图档（category = 作品分类名）
  //   "reply" = 只回复一句话
  chatQuestions: [
    {
      label: "看看作品",
      action: "works",
      reply: "明智的选择。证据都已归档——请看新打开的那份图档。",
    },
    {
      label: "小溪是谁",
      action: "reply",
      reply: "小溪，一位 UI/UX 设计师。能力几何，「档案」一页自有答案。",
    },
    {
      label: "怎么联系她",
      action: "reply",
      reply: "事务所的信箱常年开放——导航上的「联系」便是入口。",
    },
  ] as {
    label: string;
    action: "works" | "reply";
    category?: string;
    reply: string;
  }[],

  // 联系方式（显示在「联系」页）
  contact: {
    email: "2839421749@qq.com", // QQ 邮箱
    qq: "2839421749",
    wechatQr: "/wechat-qr.webp", // 微信二维码（放 public 目录）
    note: "通常 24 小时内回信。微信最直接。",
  },
};
