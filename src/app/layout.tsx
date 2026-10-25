import type { Metadata, Viewport } from "next";
import "./globals.css";
import TargetCursor from "@/components/target-cursor";
import AmbientAudio from "@/components/ambient-audio";
import RotateHint from "@/components/rotate-hint";

export const metadata: Metadata = {
  title: "克里斯蒂小姐 · 侦探事务所",
  description:
    "小溪的作品集。由克里斯蒂小姐——一位异头侦探——替你把案卷一份份翻出来。",
};

// viewportFit: cover 让页面铺满刘海屏，横屏时背景不会在两侧留白
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <TargetCursor
          spinDuration={2}
          hideDefaultCursor
          parallaxOn
          hoverDuration={0.2}
          size={36}
          cornerSize={12}
          thickness={3}
          padding={6}
          dotSize={4}
          cursorColor="#ffffff"
          cursorColorOnTarget="#ffffff"
          blendMode="difference"
          matchRadius
          showLabel
          clickEffect
        />
        <AmbientAudio />
        <RotateHint />
      </body>
    </html>
  );
}
