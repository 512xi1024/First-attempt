// 页面转场：每次切换路由，template 会重新挂载 → 包一层淡入动画
// （学习 igma.im 的页面过渡；纯透明度渐变，深色浅色底都成立）
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
