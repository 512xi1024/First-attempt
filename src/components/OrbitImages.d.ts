// OrbitImages 是第三方给的 .jsx 组件（无类型），
// 这里补一份声明：只精确写我们实际用到的 props，
// 其余走索引签名兜底。运行时依旧加载 OrbitImages.jsx，这个文件只负责类型。
import type { JSX, ReactNode } from "react";

export type OrbitImage = { src: string; alt?: string };

export default function OrbitImages(props: {
  images?: OrbitImage[];
  altPrefix?: string;
  centerContent?: ReactNode;
  onItemClick?: (index: number) => void;
  [key: string]: unknown;
}): JSX.Element | null;
