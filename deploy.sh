#!/bin/bash
# ============================================================
# 一键更新线上网站
# 用法：在服务器上执行  bash /var/www/portfolio/deploy.sh
# 做什么：拉最新代码 → 装依赖 → 生成数据库客户端 → 构建 → 重启
# ============================================================
set -e

cd /var/www/portfolio

echo "① 拉取最新代码…"
git pull

echo "② 安装依赖（含构建工具）…"
npm ci --include=dev

echo "③ 生成数据库客户端…"
npx prisma generate

echo "④ 构建生产版本（约 30 秒）…"
npm run build

echo "⑤ 重启服务…"
pm2 restart portfolio

echo ""
echo "✓ 更新完成，打开网站看看"
